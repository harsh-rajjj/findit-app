import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reports, categories, matches, claims, users } from "@/db/schema";
import { eq, and, or, inArray, desc, sql } from "drizzle-orm";
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
      createdAt: reports.createdAt, imageUrl: reports.imageUrl,
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

  // Get matches (OPTIMIZED: batch query instead of N+1)
  let userMatches: Array<{
    id: string; confidenceScore: number;
    lostTitle: string; foundTitle: string;
    lostReportId: string; foundReportId: string;
  }> = [];
  if (userReportIds.length > 0) {
    const matchRows = await db
      .select({
        id: matches.id,
        confidenceScore: matches.confidenceScore,
        lostReportId: matches.lostReportId,
        foundReportId: matches.foundReportId,
      })
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

    if (matchRows.length > 0) {
      // Batch fetch all report titles needed
      const allMatchReportIds = [
        ...new Set(matchRows.flatMap(m => [m.lostReportId, m.foundReportId]))
      ];
      const reportTitles = await db
        .select({ id: reports.id, title: reports.title })
        .from(reports)
        .where(inArray(reports.id, allMatchReportIds));
      const titleMap = new Map(reportTitles.map(r => [r.id, r.title]));

      userMatches = matchRows.map(m => ({
        id: m.id,
        confidenceScore: m.confidenceScore,
        lostTitle: titleMap.get(m.lostReportId) || "Unknown",
        foundTitle: titleMap.get(m.foundReportId) || "Unknown",
        lostReportId: m.lostReportId,
        foundReportId: m.foundReportId,
      }));
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, <span className="font-medium text-foreground">{session.user.name}</span></p>
        </div>
        <div className="flex gap-3">
          <Link href="/report/new?type=lost">
            <Button variant="destructive" className="shadow-sm shadow-destructive/20" id="dash-report-lost">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Report Lost
            </Button>
          </Link>
          <Link href="/report/new?type=found">
            <Button className="gradient-primary text-white border-0 shadow-sm shadow-primary/20" id="dash-report-found">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Report Found
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {[
          { value: lostReports.length, label: "Active Lost", icon: "🔴", gradient: "from-red-500/10 to-red-500/5", textColor: "text-red-600" },
          { value: foundReports.length, label: "Active Found", icon: "🟢", gradient: "from-emerald-500/10 to-emerald-500/5", textColor: "text-emerald-600" },
          { value: userMatches.length, label: "Matches", icon: "🔗", gradient: "from-indigo-500/10 to-indigo-500/5", textColor: "text-primary" },
          { value: claimsOnMyItems.length, label: "Pending Claims", icon: "⚡", gradient: "from-amber-500/10 to-amber-500/5", textColor: "text-amber-600" },
        ].map((stat, i) => (
          <Card key={i} className={`border-border/50 bg-gradient-to-br ${stat.gradient} card-hover`}>
            <CardContent className="pt-5 pb-5 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl sm:text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Claims */}
          {claimsOnMyItems.length > 0 && (
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-amber-50/50 animate-fade-in-up">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-sm">⚡</span>
                  Claims Requiring Your Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {claimsOnMyItems.map((claim) => (
                  <div key={claim.id} className="flex items-center justify-between bg-white border border-amber-100 p-4 rounded-xl transition-all hover:shadow-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{claim.reportTitle}</p>
                      <p className="text-sm text-muted-foreground">Claim by <span className="font-medium">@{claim.claimerName}</span></p>
                    </div>
                    <Link href={`/claim/${claim.id}`} className="ml-3 shrink-0">
                      <Button size="sm" className="gradient-primary text-white border-0 shadow-sm">Review</Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* My Lost Items */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <h2 className="text-lg font-semibold">My Lost Items</h2>
            </div>
            {lostReports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lostReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-border/60 rounded-xl bg-muted/30">
                <p className="text-muted-foreground text-sm">No active lost item reports</p>
                <Link href="/report/new?type=lost" className="text-sm text-primary hover:underline mt-2 inline-block">
                  Report a lost item →
                </Link>
              </div>
            )}
          </section>

          {/* My Found Items */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="text-lg font-semibold">My Found Items</h2>
            </div>
            {foundReports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {foundReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-border/60 rounded-xl bg-muted/30">
                <p className="text-muted-foreground text-sm">No active found item reports</p>
                <Link href="/report/new?type=found" className="text-sm text-primary hover:underline mt-2 inline-block">
                  Report a found item →
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center text-white text-xs">🔗</span>
                  Potential Matches
                </CardTitle>
                <Link href="/matches" className="text-xs text-primary hover:underline font-medium">View all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {userMatches.length > 0 ? (
                <div className="space-y-3">
                  {userMatches.slice(0, 3).map((match) => (
                    <div key={match.id} className="border border-border/60 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                      <Badge
                        variant={match.confidenceScore >= 80 ? "default" : "secondary"}
                        className={match.confidenceScore >= 80 ? "gradient-primary text-white border-0 text-xs" : "text-xs"}
                      >
                        {match.confidenceScore}% Match
                      </Badge>
                      <p className="text-sm font-medium truncate mt-2">{match.lostTitle}</p>
                      <div className="flex items-center justify-center my-1">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium truncate">{match.foundTitle}</p>
                      <Link href="/matches" className="text-xs text-primary hover:underline mt-2 inline-block">
                        View details →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">No matches found yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Matches appear when a reported item matches yours</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
