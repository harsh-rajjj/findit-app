import { db } from "@/db";
import { reports, categories, matches } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateSimilarity } from "./similarity";
import { generateEmbedding, cosineSimilarity } from "./embeddings";
import { createNotification } from "@/lib/notifications";

const MATCH_THRESHOLD = 50;

/**
 * Generate and store an embedding for a report.
 */
export async function generateAndStoreEmbedding(reportId: string): Promise<void> {
  try {
    const [report] = await db
      .select({ title: reports.title, description: reports.description })
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!report) return;

    const text = `${report.title} ${report.description}`;
    const embedding = await generateEmbedding(text);

    if (embedding) {
      await db
        .update(reports)
        .set({ embedding: JSON.stringify(embedding) })
        .where(eq(reports.id, reportId));
      console.log(`✓ Embedding stored for report ${reportId}`);
    }
  } catch (error) {
    console.error(`Failed to generate embedding for report ${reportId}:`, error);
  }
}

/**
 * Run matching algorithm for a newly created report.
 * Uses ML-powered semantic similarity when embeddings are available,
 * falls back to Jaccard word overlap otherwise.
 */
export async function runMatchingAlgorithm(reportId: string): Promise<void> {
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);

  if (!report || report.status !== "ACTIVE") return;

  const oppositeType = report.type === "LOST" ? "FOUND" : "LOST";

  const candidateReports = await db
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.type, oppositeType),
        eq(reports.status, "ACTIVE")
      )
    );

  // Parse the report's embedding if available
  let reportEmbedding: number[] | null = null;
  if (report.embedding) {
    try {
      reportEmbedding = JSON.parse(report.embedding);
    } catch { /* ignore parse errors */ }
  }

  for (const candidate of candidateReports) {
    const score = calculateMatchScore(report, candidate, reportEmbedding);

    if (score >= MATCH_THRESHOLD) {
      const lostReportId = report.type === "LOST" ? report.id : candidate.id;
      const foundReportId = report.type === "FOUND" ? report.id : candidate.id;

      // Upsert: try insert, on conflict update score
      await db
        .insert(matches)
        .values({
          lostReportId,
          foundReportId,
          confidenceScore: score,
        })
        .onConflictDoUpdate({
          target: [matches.lostReportId, matches.foundReportId],
          set: { confidenceScore: score },
        });

      // Send notifications to both report owners
      try {
        await createNotification({
          userId: report.userId,
          type: "MATCH",
          title: "🔗 Potential Match Found!",
          message: `Your report "${report.title}" has a ${score}% match with "${candidate.title}"`,
          linkUrl: "/matches",
        });

        await createNotification({
          userId: candidate.userId,
          type: "MATCH",
          title: "🔗 Potential Match Found!",
          message: `Your report "${candidate.title}" has a ${score}% match with "${report.title}"`,
          linkUrl: "/matches",
        });
      } catch { /* notification errors are non-critical */ }
    }
  }

  console.log(`Matching complete for report ${reportId}`);
}

function calculateMatchScore(
  reportA: { categoryId: string; title: string; description: string; lostFoundDate: Date; embedding: string | null },
  reportB: { categoryId: string; title: string; description: string; lostFoundDate: Date; embedding: string | null },
  reportAEmbedding: number[] | null
): number {
  // 1. Category Score (0-30)
  const categoryScore = reportA.categoryId === reportB.categoryId ? 30 : 0;

  // 2. Semantic / Text Similarity Score (0-55)
  let similarityScore = 0;

  // Try ML semantic similarity first
  if (reportAEmbedding) {
    let reportBEmbedding: number[] | null = null;
    if (reportB.embedding) {
      try {
        reportBEmbedding = JSON.parse(reportB.embedding);
      } catch { /* ignore */ }
    }

    if (reportBEmbedding) {
      // Use ML cosine similarity
      const cosine = cosineSimilarity(reportAEmbedding, reportBEmbedding);
      // cosine ranges from -1 to 1, typically 0 to 1 for similar docs
      // Map to 0-55 score range
      similarityScore = Math.round(Math.max(0, cosine) * 55);
    } else {
      // Fallback: Jaccard for candidates without embeddings
      const textA = `${reportA.title} ${reportA.description}`.toLowerCase();
      const textB = `${reportB.title} ${reportB.description}`.toLowerCase();
      similarityScore = Math.round(calculateSimilarity(textA, textB) * 55);
    }
  } else {
    // Fallback: Jaccard word overlap
    const textA = `${reportA.title} ${reportA.description}`.toLowerCase();
    const textB = `${reportB.title} ${reportB.description}`.toLowerCase();
    similarityScore = Math.round(calculateSimilarity(textA, textB) * 55);
  }

  // 3. Time Score (0-15)
  const timeDiffDays = Math.abs(
    (reportA.lostFoundDate.getTime() - reportB.lostFoundDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  let timeScore = 0;
  if (timeDiffDays <= 1) timeScore = 15;
  else if (timeDiffDays <= 3) timeScore = 10;
  else if (timeDiffDays <= 7) timeScore = 5;
  else if (timeDiffDays <= 14) timeScore = 2;

  return categoryScore + similarityScore + timeScore;
}
