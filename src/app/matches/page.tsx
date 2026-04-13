import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reports, matches, categories, users } from "@/db/schema";
import { eq, or, inArray, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default async function MatchesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/matches");

  // Get user's report IDs
  const userReportRows = await db
    .select({ id: reports.id })
    .from(reports)
    .where(eq(reports.userId, session.user.id));

  const reportIds = userReportRows.map(r => r.id);

  if (reportIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Potential Matches</h1>
        <div className="text-center py-20 border border-dashed border-border/60 rounded-xl bg-muted/30 mt-6">
          <div className="text-4xl mb-3">🔗</div>
          <p className="text-muted-foreground mb-2 font-medium">No potential matches found yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Create a report first, and our algorithm will find matches automatically.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/report/new?type=lost">
              <Button variant="destructive" className="px-6">Report Lost Item</Button>
            </Link>
            <Link href="/report/new?type=found">
              <Button className="gradient-primary text-white border-0 px-6">Report Found Item</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get all matches
  const allMatches = await db
    .select()
    .from(matches)
    .where(
      or(
        inArray(matches.lostReportId, reportIds),
        inArray(matches.foundReportId, reportIds)
      )
    )
    .orderBy(desc(matches.confidenceScore));

  // Enrich with report details
  const enrichedMatches = await Promise.all(
    allMatches.map(async (match) => {
      const [lostReport] = await db
        .select({
          title: reports.title, description: reports.description,
          categoryName: categories.name, categoryIcon: categories.icon,
          username: users.username,
        })
        .from(reports)
        .leftJoin(categories, eq(reports.categoryId, categories.id))
        .innerJoin(users, eq(reports.userId, users.id))
        .where(eq(reports.id, match.lostReportId));

      const [foundReport] = await db
        .select({
          title: reports.title, description: reports.description,
          categoryName: categories.name, categoryIcon: categories.icon,
          username: users.username,
        })
        .from(reports)
        .leftJoin(categories, eq(reports.categoryId, categories.id))
        .innerJoin(users, eq(reports.userId, users.id))
        .where(eq(reports.id, match.foundReportId));

      return { ...match, lostReport, foundReport };
    })
  );

  const activeMatches = enrichedMatches.filter(m => !m.dismissed);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Potential Matches</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Items our algorithm believes could be matches for your reports.
        </p>
      </div>

      {activeMatches.length > 0 ? (
        <div className="space-y-6">
          {activeMatches.map((match) => {
            const isMyLostItem = match.lostReport?.username === session.user?.name;
            const isHighConfidence = match.confidenceScore >= 80;

            return (
              <Card
                key={match.id}
                className={`border-border/60 shadow-sm overflow-hidden animate-fade-in-up ${
                  isHighConfidence ? "ring-2 ring-emerald-200 shadow-emerald-100" : ""
                }`}
              >
                {/* Confidence bar */}
                <div className={`h-1.5 ${
                  isHighConfidence
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-indigo-500/50 to-violet-500/50"
                }`} />

                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={isHighConfidence ? "default" : "secondary"}
                      className={`${isHighConfidence ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0" : ""} text-sm px-3 py-1`}
                    >
                      {match.confidenceScore}% Confidence
                    </Badge>
                    {isHighConfidence && (
                      <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        High Match
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Match comparison — stacks on mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Lost Item */}
                    <div className="border border-red-200/80 bg-red-50/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive" className="text-xs">LOST</Badge>
                        {isMyLostItem && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">Your item</span>
                        )}
                      </div>
                      <h3 className="font-semibold">{match.lostReport?.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {match.lostReport?.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <span>{match.lostReport?.categoryIcon}</span>
                        <span>{match.lostReport?.categoryName}</span>
                      </p>
                      <Link href={`/report/${match.lostReportId}`} className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
                        View details
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>

                    {/* Connector arrow (visible on mobile) */}
                    <div className="md:hidden flex justify-center -my-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <svg className="w-4 h-4 text-muted-foreground rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    </div>

                    {/* Found Item */}
                    <div className="border border-emerald-200/80 bg-emerald-50/50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="gradient-primary text-white border-0 text-xs">FOUND</Badge>
                        {!isMyLostItem && (
                          <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-medium">Your item</span>
                        )}
                      </div>
                      <h3 className="font-semibold">{match.foundReport?.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {match.foundReport?.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <span>{match.foundReport?.categoryIcon}</span>
                        <span>{match.foundReport?.categoryName}</span>
                      </p>
                      <Link href={`/report/${match.foundReportId}`} className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1">
                        View details
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/60">
                    {isMyLostItem ? (
                      <Link href={`/report/${match.foundReportId}`}>
                        <Button size="sm" className="gradient-primary text-white border-0 shadow-sm">
                          Claim This Item →
                        </Button>
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        The owner of the lost item can claim your found item
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border/60 rounded-xl bg-muted/30">
          <div className="text-4xl mb-3">🔗</div>
          <p className="text-muted-foreground mb-2 font-medium">No potential matches found yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When you report an item, our algorithm will automatically search for matches.
          </p>
        </div>
      )}
    </div>
  );
}
