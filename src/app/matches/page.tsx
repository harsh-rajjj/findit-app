import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { DismissMatchButton } from "@/components/reports/DismissMatchButton";

async function getUserMatches(userId: string) {
  const userReportIds = await prisma.report.findMany({
    where: { userId },
    select: { id: true },
  });

  const reportIds = userReportIds.map((r) => r.id);

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { lostReportId: { in: reportIds } },
        { foundReportId: { in: reportIds } },
      ],
    },
    include: {
      lostReport: {
        include: {
          category: true,
          user: { select: { username: true } },
        },
      },
      foundReport: {
        include: {
          category: true,
          user: { select: { username: true } },
        },
      },
    },
    orderBy: [{ dismissed: "asc" }, { confidenceScore: "desc" }],
  });
  return matches;
}

export default async function MatchesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/matches");
  }

  const matches = await getUserMatches(session.user.id);
  const activeMatches = matches.filter((m) => !m.dismissed);
  const dismissedMatches = matches.filter((m) => m.dismissed);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Potential Matches</h1>
      <p className="text-gray-600 mb-8">
        These are items that our algorithm believes could be matches for your
        reports.
      </p>

      {activeMatches.length > 0 ? (
        <div className="space-y-6">
          {activeMatches.map((match) => {
            const isMyLostItem = match.lostReport.user.username === session.user?.name;

            return (
              <div
                key={match.id}
                className={`border bg-white p-6 ${
                  match.confidenceScore >= 80
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    variant={match.confidenceScore >= 80 ? "found" : "pending"}
                  >
                    {match.confidenceScore}% Confidence
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Found {formatRelativeTime(match.createdAt)}
                  </span>
                </div>

                {/* Match Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lost Item */}
                  <div className="border border-red-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="lost">LOST</Badge>
                      {isMyLostItem && (
                        <span className="text-xs text-gray-500">(Your item)</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {truncate(match.lostReport.title, 40)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {truncate(match.lostReport.description, 100)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {match.lostReport.category.icon}{" "}
                      {match.lostReport.category.name}
                    </p>
                    <Link
                      href={`/report/${match.lostReportId}`}
                      className="text-xs text-blue-800 hover:underline"
                    >
                      View details →
                    </Link>
                  </div>

                  {/* Found Item */}
                  <div className="border border-green-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="found">FOUND</Badge>
                      {!isMyLostItem && (
                        <span className="text-xs text-gray-500">(Your item)</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {truncate(match.foundReport.title, 40)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {truncate(match.foundReport.description, 100)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {match.foundReport.category.icon}{" "}
                      {match.foundReport.category.name}
                    </p>
                    <Link
                      href={`/report/${match.foundReportId}`}
                      className="text-xs text-blue-800 hover:underline"
                    >
                      View details →
                    </Link>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                  {isMyLostItem ? (
                    <Link href={`/report/${match.foundReportId}?claim=true`}>
                      <Button size="sm">Claim This Item</Button>
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-600">
                      The owner of the lost item can claim your found item
                    </p>
                  )}
                  <DismissMatchButton matchId={match.id} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No potential matches found yet</p>
          <p className="text-sm text-gray-400">
            When you report an item, our algorithm will automatically search for
            potential matches and notify you.
          </p>
        </div>
      )}

      {/* Dismissed Matches */}
      {dismissedMatches.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Dismissed Matches ({dismissedMatches.length})
          </h2>
          <div className="space-y-2">
            {dismissedMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between border border-gray-200 bg-gray-50 p-4"
              >
                <div>
                  <p className="text-sm">
                    {match.lostReport.title} ↔ {match.foundReport.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {match.confidenceScore}% confidence
                  </p>
                </div>
                <DismissMatchButton matchId={match.id} label="Restore" restore />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
