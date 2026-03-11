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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-2">Potential Matches</h1>
        <div className="text-center py-16 border border-dashed rounded-md">
          <p className="text-muted-foreground mb-4">No potential matches found yet</p>
          <p className="text-sm text-muted-foreground">
            Create a report first, and our algorithm will find matches automatically.
          </p>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">Potential Matches</h1>
      <p className="text-muted-foreground mb-8">
        These are items that our algorithm believes could be matches for your reports.
      </p>

      {activeMatches.length > 0 ? (
        <div className="space-y-6">
          {activeMatches.map((match) => {
            const isMyLostItem = match.lostReport?.username === session.user?.name;

            return (
              <Card
                key={match.id}
                className={match.confidenceScore >= 80 ? "border-green-300 bg-green-50" : ""}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant={match.confidenceScore >= 80 ? "default" : "secondary"}>
                      {match.confidenceScore}% Confidence
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Lost Item */}
                    <div className="border border-red-200 p-4 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive">LOST</Badge>
                        {isMyLostItem && <span className="text-xs text-muted-foreground">(Your item)</span>}
                      </div>
                      <h3 className="font-semibold">{match.lostReport?.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {match.lostReport?.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {match.lostReport?.categoryIcon} {match.lostReport?.categoryName}
                      </p>
                      <Link href={`/report/${match.lostReportId}`} className="text-xs text-primary hover:underline">
                        View details →
                      </Link>
                    </div>

                    {/* Found Item */}
                    <div className="border border-green-200 p-4 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>FOUND</Badge>
                        {!isMyLostItem && <span className="text-xs text-muted-foreground">(Your item)</span>}
                      </div>
                      <h3 className="font-semibold">{match.foundReport?.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {match.foundReport?.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {match.foundReport?.categoryIcon} {match.foundReport?.categoryName}
                      </p>
                      <Link href={`/report/${match.foundReportId}`} className="text-xs text-primary hover:underline">
                        View details →
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    {isMyLostItem ? (
                      <Link href={`/report/${match.foundReportId}`}>
                        <Button size="sm">Claim This Item</Button>
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">
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
        <div className="text-center py-16 border border-dashed rounded-md">
          <p className="text-muted-foreground mb-4">No potential matches found yet</p>
          <p className="text-sm text-muted-foreground">
            When you report an item, our algorithm will automatically search for matches.
          </p>
        </div>
      )}
    </div>
  );
}
