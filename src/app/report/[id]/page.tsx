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
      imageUrl: reports.imageUrl,
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
      pickupTime: claims.pickupTime, pickupLocation: claims.pickupLocation,
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      {/* Back button */}
      <Link
        href={isOwner ? "/dashboard" : "/browse"}
        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-6 text-sm font-medium transition-colors group"
        id="report-back"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to {isOwner ? "Dashboard" : "Browse"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60 shadow-sm overflow-hidden">
            {/* Type accent bar */}
            <div className={`h-1.5 ${
              isLost
                ? "bg-gradient-to-r from-red-500 to-orange-400"
                : "bg-gradient-to-r from-emerald-500 to-teal-400"
            }`} />

            {/* Item Image */}
            {report.imageUrl && (
              <div className="relative w-full h-64 sm:h-80 overflow-hidden bg-muted">
                <img
                  src={report.imageUrl}
                  alt={report.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-xl sm:text-2xl">{report.title}</CardTitle>
                <Badge
                  variant={isLost ? "destructive" : "default"}
                  className={`shrink-0 ${!isLost ? "gradient-primary text-white border-0" : ""}`}
                >
                  {isLost ? "LOST" : "FOUND"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                {report.categoryName && (
                  <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-0.5 rounded-full text-xs font-medium">
                    {report.categoryIcon} {report.categoryName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-xs">
                  📅 {isLost ? "Lost" : "Found"} on {formatDate(report.lostFoundDate)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs">
                  🕐 Posted {formatDate(report.createdAt)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Description</h2>
                <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{report.description}</p>
              </div>

              {report.locationDescription && (
                <>
                  <Separator />
                  <div>
                    <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Location</h2>
                    <p className="text-foreground/80 inline-flex items-start gap-2">
                      <span className="text-lg mt-0.5">📍</span>
                      {report.locationDescription}
                    </p>
                  </div>
                </>
              )}

              {report.verificationQuestion && isOwner && (
                <>
                  <Separator />
                  <div>
                    <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Verification Question</h2>
                    <p className="text-foreground/80 italic">&ldquo;{report.verificationQuestion}&rdquo;</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Info Card */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant={report.status === "ACTIVE" ? "default" : "secondary"}
                  className={report.status === "ACTIVE" ? "gradient-primary text-white border-0" : ""}
                >
                  {report.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reported by</span>
                <span className="text-sm font-medium">@{owner?.username}</span>
              </div>

              {/* Claim Button for non-owners on FOUND items */}
              {!isOwner && !isLost && report.status === "ACTIVE" && session?.user && (
                <div className="pt-2">
                  {existingClaim ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm text-amber-800 font-medium mb-2">You&apos;ve submitted a claim</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{existingClaim.status}</Badge>
                        <Link href={`/claim/${existingClaim.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">View Details →</Button>
                        </Link>
                      </div>
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
                  <Button className="w-full gradient-primary text-white border-0 shadow-sm h-11" id="report-login-claim">
                    Login to Claim This Item
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Claims list for owner */}
          {isOwner && !isLost && reportClaims.length > 0 && (
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Claims
                  <Badge variant="secondary" className="text-xs">{reportClaims.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportClaims.map((claim) => (
                  <div key={claim.id} className="border border-border/60 p-4 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">@{claim.claimerName}</span>
                      <Badge variant={
                        claim.status === "PENDING" ? "secondary" :
                        claim.status === "APPROVED" ? "default" : "destructive"
                      } className={`text-xs ${claim.status === "APPROVED" ? "gradient-primary text-white border-0" : ""}`}>
                        {claim.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {claim.proofText}
                    </p>
                    {claim.verificationAnswer && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong className="text-foreground">Verification:</strong> {claim.verificationAnswer}
                      </p>
                    )}
                    {claim.pickupTime && (
                      <p className="text-xs text-muted-foreground mb-2">
                        📅 Pickup: {formatDate(claim.pickupTime)}
                        {claim.pickupLocation && ` at ${claim.pickupLocation}`}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      {claim.status === "PENDING" && <ClaimActions claimId={claim.id} />}
                      <Link href={`/claim/${claim.id}`} className="ml-auto">
                        <Button size="sm" variant="outline" className="text-xs h-8">
                          Details →
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile: Sticky claim button */}
      {!isOwner && !isLost && report.status === "ACTIVE" && !session?.user && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 glass-strong border-t z-40">
          <Link href={`/login?callbackUrl=/report/${report.id}`}>
            <Button className="w-full gradient-primary text-white border-0 shadow-lg h-12 text-base font-medium">
              Login to Claim This Item
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
