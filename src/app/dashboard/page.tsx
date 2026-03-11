import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reports, categories, matches, claims, users } from "@/db/schema";
import { eq, and, or, inArray, desc } from "drizzle-orm";
import { ReportCard } from "@/components/reports/ReportCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  // Get user's reports
  const userReports = await db
    .select({
      id: reports.id, type: reports.type, title: reports.title,
      description: reports.description, status: reports.status,
      createdAt: reports.createdAt,
      categoryName: categories.name, categoryIcon: categories.icon,
    })
    .from(reports)
    .leftJoin(categories, eq(reports.categoryId, categories.id))
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.createdAt));

  const lostReports = userReports
    .filter(r => r.type === "LOST" && r.status === "ACTIVE")
    .map(r => ({ ...r, category: r.categoryName ? { name: r.categoryName, icon: r.categoryIcon } : null }));
  const foundReports = userReports
    .filter(r => r.type === "FOUND" && r.status === "ACTIVE")
    .map(r => ({ ...r, category: r.categoryName ? { name: r.categoryName, icon: r.categoryIcon } : null }));

  // Get user's report IDs for matching
  const userReportIds = userReports.map(r => r.id);

  // Get matches
  let userMatches: Array<{
    id: string; confidenceScore: number;
    lostTitle: string; foundTitle: string;
    lostReportId: string; foundReportId: string;
  }> = [];
  if (userReportIds.length > 0) {
    const matchRows = await db
      .select()
      .from(matches)
      .where(
        and(
          eq(matches.dismissed, false),
          or(
            inArray(matches.lostReportId, userReportIds),
            inArray(matches.foundReportId, userReportIds)
          )
        )
      )
      .orderBy(desc(matches.confidenceScore))
      .limit(5);

    // Get titles for matched reports
    for (const m of matchRows) {
      const [lost] = await db.select({ title: reports.title }).from(reports).where(eq(reports.id, m.lostReportId));
      const [found] = await db.select({ title: reports.title }).from(reports).where(eq(reports.id, m.foundReportId));
      userMatches.push({
        id: m.id,
        confidenceScore: m.confidenceScore,
        lostTitle: lost?.title || "Unknown",
        foundTitle: found?.title || "Unknown",
        lostReportId: m.lostReportId,
        foundReportId: m.foundReportId,
      });
    }
  }

  // Get claims on my found items
  const claimsOnMyItems = await db
    .select({
      id: claims.id, proofText: claims.proofText, status: claims.status,
      createdAt: claims.createdAt, reportId: claims.reportId,
      reportTitle: reports.title, claimerName: users.username,
    })
    .from(claims)
    .innerJoin(reports, eq(claims.reportId, reports.id))
    .innerJoin(users, eq(claims.claimerId, users.id))
    .where(and(eq(reports.userId, userId), eq(claims.status, "PENDING")))
    .orderBy(desc(claims.createdAt));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session.user.name}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/report/new?type=lost">
            <Button variant="destructive">Report Lost Item</Button>
          </Link>
          <Link href="/report/new?type=found">
            <Button variant="secondary">Report Found Item</Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-red-600">{lostReports.length}</p>
            <p className="text-sm text-muted-foreground">Active Lost Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-600">{foundReports.length}</p>
            <p className="text-sm text-muted-foreground">Active Found Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-primary">{userMatches.length}</p>
            <p className="text-sm text-muted-foreground">Potential Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-yellow-600">{claimsOnMyItems.length}</p>
            <p className="text-sm text-muted-foreground">Pending Claims</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Claims */}
          {claimsOnMyItems.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg">⚠️ Claims Requiring Your Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {claimsOnMyItems.map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between bg-white border p-4 rounded-md">
                    <div>
                      <p className="font-medium">{claim.reportTitle}</p>
                      <p className="text-sm text-muted-foreground">Claim by @{claim.claimerName}</p>
                    </div>
                    <Link href={`/report/${claim.reportId}`}>
                      <Button size="sm">Review</Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* My Lost Items */}
          <section>
            <h2 className="text-lg font-semibold mb-4">My Lost Items</h2>
            {lostReports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lostReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 border border-dashed rounded-md">
                No active lost item reports
              </p>
            )}
          </section>

          {/* My Found Items */}
          <section>
            <h2 className="text-lg font-semibold mb-4">My Found Items</h2>
            {foundReports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {foundReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 border border-dashed rounded-md">
                No active found item reports
              </p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Potential Matches</CardTitle>
                <Link href="/matches" className="text-sm text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {userMatches.length > 0 ? (
                <div className="space-y-3">
                  {userMatches.slice(0, 3).map((match) => (
                    <div key={match.id} className="border p-3 rounded-md">
                      <Badge variant={match.confidenceScore >= 80 ? "default" : "secondary"}>
                        {match.confidenceScore}% Match
                      </Badge>
                      <p className="text-sm font-medium truncate mt-2">{match.lostTitle}</p>
                      <p className="text-xs text-muted-foreground">↔</p>
                      <p className="text-sm font-medium truncate">{match.foundTitle}</p>
                      <Link href="/matches" className="text-xs text-primary hover:underline">
                        View details →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No matches found yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
