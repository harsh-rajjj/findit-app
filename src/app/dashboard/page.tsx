import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportCard } from "@/components/reports/ReportCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime } from "@/lib/utils";

async function getUserReports(userId: string) {
  const [lostReports, foundReports, resolvedReports] = await Promise.all([
    prisma.report.findMany({
      where: { userId, type: "LOST", status: "ACTIVE" },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.report.findMany({
      where: { userId, type: "FOUND", status: "ACTIVE" },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.report.findMany({
      where: { userId, status: "RESOLVED" },
      include: { category: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return { lostReports, foundReports, resolvedReports };
}

async function getUserMatches(userId: string) {
  const userReportIds = await prisma.report.findMany({
    where: { userId },
    select: { id: true },
  });

  const reportIds = userReportIds.map((r) => r.id);

  return prisma.match.findMany({
    where: {
      OR: [
        { lostReportId: { in: reportIds } },
        { foundReportId: { in: reportIds } },
      ],
      dismissed: false,
    },
    include: {
      lostReport: { include: { category: true, user: true } },
      foundReport: { include: { category: true, user: true } },
    },
    orderBy: { confidenceScore: "desc" },
    take: 5,
  });
}

async function getPendingClaims(userId: string) {
  // Claims on my found items
  const claimsOnMyItems = await prisma.claim.findMany({
    where: {
      report: { userId, type: "FOUND" },
      status: "PENDING",
    },
    include: {
      report: true,
      claimer: { select: { username: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // My claims on others' items
  const myClaims = await prisma.claim.findMany({
    where: { claimerId: userId },
    include: {
      report: { include: { category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { claimsOnMyItems, myClaims };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [reports, matches, claims] = await Promise.all([
    getUserReports(session.user.id),
    getUserMatches(session.user.id),
    getPendingClaims(session.user.id),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session.user.name}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/report/new?type=lost">
            <Button variant="danger">Report Lost Item</Button>
          </Link>
          <Link href="/report/new?type=found">
            <Button variant="secondary">Report Found Item</Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-red-700">
            {reports.lostReports.length}
          </p>
          <p className="text-sm text-gray-600">Active Lost Items</p>
        </div>
        <div className="border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-green-700">
            {reports.foundReports.length}
          </p>
          <p className="text-sm text-gray-600">Active Found Items</p>
        </div>
        <div className="border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-blue-800">{matches.length}</p>
          <p className="text-sm text-gray-600">Potential Matches</p>
        </div>
        <div className="border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-yellow-600">
            {claims.claimsOnMyItems.length}
          </p>
          <p className="text-sm text-gray-600">Pending Claims</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Claims on My Items */}
          {claims.claimsOnMyItems.length > 0 && (
            <section className="border border-yellow-200 bg-yellow-50 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                ⚠️ Claims Requiring Your Review
              </h2>
              <div className="space-y-3">
                {claims.claimsOnMyItems.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between bg-white border border-gray-200 p-4"
                  >
                    <div>
                      <p className="font-medium">{claim.report.title}</p>
                      <p className="text-sm text-gray-600">
                        Claim by @{claim.claimer.username} •{" "}
                        {formatRelativeTime(claim.createdAt)}
                      </p>
                    </div>
                    <Link href={`/report/${claim.reportId}?claim=${claim.id}`}>
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* My Lost Items */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              My Lost Items
            </h2>
            {reports.lostReports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reports.lostReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 border border-dashed border-gray-300">
                No active lost item reports
              </p>
            )}
          </section>

          {/* My Found Items */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              My Found Items
            </h2>
            {reports.foundReports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reports.foundReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 border border-dashed border-gray-300">
                No active found item reports
              </p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Potential Matches */}
          <section className="border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Potential Matches</h2>
              <Link
                href="/matches"
                className="text-sm text-blue-800 hover:underline"
              >
                View all
              </Link>
            </div>
            {matches.length > 0 ? (
              <div className="space-y-3">
                {matches.slice(0, 3).map((match) => (
                  <div
                    key={match.id}
                    className="border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          match.confidenceScore >= 80 ? "found" : "pending"
                        }
                      >
                        {match.confidenceScore}% Match
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">
                      {match.lostReport.title}
                    </p>
                    <p className="text-xs text-gray-500">↔</p>
                    <p className="text-sm font-medium truncate">
                      {match.foundReport.title}
                    </p>
                    <Link
                      href={`/matches?id=${match.id}`}
                      className="text-xs text-blue-800 hover:underline"
                    >
                      View details →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No matches found yet</p>
            )}
          </section>

          {/* My Claims */}
          <section className="border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900 mb-4">My Claims</h2>
            {claims.myClaims.length > 0 ? (
              <div className="space-y-3">
                {claims.myClaims.slice(0, 5).map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {claim.report.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatRelativeTime(claim.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        claim.status === "PENDING"
                          ? "pending"
                          : claim.status === "APPROVED"
                          ? "approved"
                          : "rejected"
                      }
                    >
                      {claim.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                You haven&apos;t made any claims yet
              </p>
            )}
          </section>

          {/* Recently Resolved */}
          {reports.resolvedReports.length > 0 && (
            <section className="border border-gray-200 bg-white p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                Recently Resolved
              </h2>
              <div className="space-y-2">
                {reports.resolvedReports.map((report) => (
                  <div key={report.id} className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm truncate">{report.title}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
