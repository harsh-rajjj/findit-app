import { db } from "@/db";
import { reports, categories, matches } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { calculateSimilarity } from "./similarity";

const MATCH_THRESHOLD = 50;

/**
 * Run matching algorithm for a newly created report.
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

  for (const candidate of candidateReports) {
    const score = calculateMatchScore(report, candidate);

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
    }
  }

  console.log(`Matching complete for report ${reportId}`);
}

function calculateMatchScore(
  reportA: { categoryId: string; title: string; description: string; lostFoundDate: Date },
  reportB: { categoryId: string; title: string; description: string; lostFoundDate: Date }
): number {
  // 1. Category Score (0-50)
  const categoryScore = reportA.categoryId === reportB.categoryId ? 50 : 0;

  // 2. Description Similarity Score (0-40)
  const textA = `${reportA.title} ${reportA.description}`.toLowerCase();
  const textB = `${reportB.title} ${reportB.description}`.toLowerCase();
  const similarity = calculateSimilarity(textA, textB);
  const descriptionScore = Math.round(similarity * 40);

  // 3. Time Score (0-10)
  const timeDiffDays = Math.abs(
    (reportA.lostFoundDate.getTime() - reportB.lostFoundDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  let timeScore = 0;
  if (timeDiffDays <= 1) timeScore = 10;
  else if (timeDiffDays <= 3) timeScore = 5;
  else if (timeDiffDays <= 7) timeScore = 2;

  return categoryScore + descriptionScore + timeScore;
}
