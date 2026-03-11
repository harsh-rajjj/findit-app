import { prisma } from "@/lib/prisma";
import { calculateSimilarity } from "./similarity";

const MATCH_THRESHOLD = 50;

/**
 * Run matching algorithm for a newly created report.
 * Compares LOST reports against FOUND reports (and vice versa).
 */
export async function runMatchingAlgorithm(reportId: string): Promise<void> {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { category: true },
  });

  if (!report || report.status !== "ACTIVE") return;

  const oppositeType = report.type === "LOST" ? "FOUND" : "LOST";

  // Find potential matching reports
  const candidateReports = await prisma.report.findMany({
    where: {
      type: oppositeType,
      status: "ACTIVE",
    },
    include: { category: true },
  });

  const matches: Array<{
    lostReportId: string;
    foundReportId: string;
    confidenceScore: number;
  }> = [];

  for (const candidate of candidateReports) {
    const score = calculateMatchScore(report, candidate);

    if (score >= MATCH_THRESHOLD) {
      const lostReportId = report.type === "LOST" ? report.id : candidate.id;
      const foundReportId = report.type === "FOUND" ? report.id : candidate.id;

      matches.push({
        lostReportId,
        foundReportId,
        confidenceScore: score,
      });
    }
  }

  // Upsert matches (avoid duplicates)
  for (const match of matches) {
    await prisma.match.upsert({
      where: {
        lostReportId_foundReportId: {
          lostReportId: match.lostReportId,
          foundReportId: match.foundReportId,
        },
      },
      create: match,
      update: { confidenceScore: match.confidenceScore },
    });
  }

  console.log(
    `Matching complete for report ${reportId}: ${matches.length} matches found`
  );
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
