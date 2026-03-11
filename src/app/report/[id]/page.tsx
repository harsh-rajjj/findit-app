import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { reports, categories, claims, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ClaimSection } from "@/components/claims/ClaimSection";
import { ClaimActions } from "@/components/claims/ClaimActions";

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const session = await auth();

  // Get report with category
  const [report] = await db
    .select({
      id: reports.id, type: reports.type, status: reports.status,
      title: reports.title, description: reports.description,
      locationDescription: reports.locationDescription,
      lostFoundDate: reports.lostFoundDate,
      verificationQuestion: reports.verificationQuestion,
      createdAt: reports.createdAt, userId: reports.userId,
      categoryName: categories.name, categoryIcon: categories.icon,
    })
    .from(reports)
    .leftJoin(categories, eq(reports.categoryId, categories.id))
    .where(eq(reports.id, id))
    .limit(1);

  if (!report) notFound();

  // Get report owner
  const [owner] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, report.userId))
    .limit(1);

  // Get claims for this report
  const reportClaims = await db
    .select({
      id: claims.id, status: claims.status, proofText: claims.proofText,
      verificationAnswer: claims.verificationAnswer, createdAt: claims.createdAt,
      claimerName: users.username, claimerId: claims.claimerId,
    })
    .from(claims)
    .innerJoin(users, eq(claims.claimerId, users.id))
    .where(eq(claims.reportId, id))
    .orderBy(desc(claims.createdAt));

  const isOwner = session?.user?.id === report.userId;
  const isLost = report.type === "LOST";
  const existingClaim = reportClaims.find(c => c.claimerId === session?.user?.id);

  const formatDate = (date: Date) => new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={isOwner ? "/dashboard" : "/browse"}
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
      >
        ← Back to {isOwner ? "Dashboard" : "Browse"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-2xl">{report.title}</CardTitle>
                <Badge variant={isLost ? "destructive" : "default"}>
                  {isLost ? "LOST" : "FOUND"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {report.categoryName && (
                  <span>{report.categoryIcon} {report.categoryName}</span>
                )}
                <span>{isLost ? "Lost" : "Found"} on {formatDate(report.lostFoundDate)}</span>
                <span>Posted {formatDate(report.createdAt)}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{report.description}</p>
              </div>

              {report.locationDescription && (
                <>
                  <Separator />
                  <div>
                    <h2 className="font-semibold mb-2">Location</h2>
                    <p className="text-muted-foreground">📍 {report.locationDescription}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={report.status === "ACTIVE" ? "default" : "secondary"}>
                  {report.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Reported by <span className="font-medium text-foreground">@{owner?.username}</span>
              </p>

              {/* Claim Button for non-owners on FOUND items */}
              {!isOwner && !isLost && report.status === "ACTIVE" && session?.user && (
                <div>
                  {existingClaim ? (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        You&apos;ve already submitted a claim.
                        <br />
                        Status: <Badge variant="secondary">{existingClaim.status}</Badge>
                      </p>
                    </div>
                  ) : (
                    <ClaimSection
                      reportId={report.id}
                      hasVerificationQuestion={!!report.verificationQuestion}
                    />
                  )}
                </div>
              )}

              {!session?.user && !isLost && report.status === "ACTIVE" && (
                <Link href={`/login?callbackUrl=/report/${report.id}`}>
                  <Button className="w-full">Login to Claim</Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Claims list for owner */}
          {isOwner && !isLost && reportClaims.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Claims ({reportClaims.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportClaims.map((claim) => (
                  <div key={claim.id} className="border p-4 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">@{claim.claimerName}</span>
                      <Badge variant={
                        claim.status === "PENDING" ? "secondary" :
                        claim.status === "APPROVED" ? "default" : "destructive"
                      }>
                        {claim.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {claim.proofText}
                    </p>
                    {claim.verificationAnswer && (
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>Verification answer:</strong> {claim.verificationAnswer}
                      </p>
                    )}
                    {claim.status === "PENDING" && <ClaimActions claimId={claim.id} />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
