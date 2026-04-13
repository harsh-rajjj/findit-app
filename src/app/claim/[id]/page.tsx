import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { claims, reports, users, messages, categories } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClaimActions } from "@/components/claims/ClaimActions";
import { MessageThread } from "@/components/claims/MessageThread";
import { PickupEditor } from "@/components/claims/PickupEditor";
import { ClaimDisputeActions } from "@/components/claims/ClaimDisputeActions";

interface ClaimPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Get claim with report and users
  const [claim] = await db
    .select({
      id: claims.id,
      status: claims.status,
      proofText: claims.proofText,
      verificationAnswer: claims.verificationAnswer,
      pickupTime: claims.pickupTime,
      pickupLocation: claims.pickupLocation,
      createdAt: claims.createdAt,
      reportId: claims.reportId,
      claimerId: claims.claimerId,
      reportTitle: reports.title,
      reportType: reports.type,
      reportUserId: reports.userId,
      reportDescription: reports.description,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(claims)
    .innerJoin(reports, eq(claims.reportId, reports.id))
    .leftJoin(categories, eq(reports.categoryId, categories.id))
    .where(eq(claims.id, id))
    .limit(1);

  if (!claim) notFound();

  // Only the finder (report owner) and claimer can view
  const isOwner = session.user.id === claim.reportUserId;
  const isClaimer = session.user.id === claim.claimerId;
  if (!isOwner && !isClaimer) notFound();

  // Get user names
  const [claimerUser] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, claim.claimerId));

  const [ownerUser] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, claim.reportUserId));

  // Get messages
  const claimMessages = await db
    .select({
      id: messages.id,
      content: messages.content,
      senderId: messages.senderId,
      createdAt: messages.createdAt,
      senderName: users.username,
    })
    .from(messages)
    .innerJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.claimId, id))
    .orderBy(asc(messages.createdAt));

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });

  const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
    PENDING: { color: "bg-amber-100 text-amber-800 border-amber-200", icon: "⏳", label: "Pending Review" },
    APPROVED: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "✅", label: "Approved" },
    REJECTED: { color: "bg-red-100 text-red-800 border-red-200", icon: "❌", label: "Rejected" },
    WITHDRAWN: { color: "bg-slate-100 text-slate-700 border-slate-200", icon: "↩️", label: "Withdrawn" },
    REVOKED: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: "⚠️", label: "Approval Revoked" },
  };
  const status = statusConfig[claim.status] || statusConfig.PENDING;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-fade-in">
      {/* Back */}
      <Link
        href={isOwner ? `/report/${claim.reportId}` : "/dashboard"}
        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-6 text-sm font-medium transition-colors group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      {/* Status Banner */}
      <div className={`p-4 rounded-xl border mb-6 flex items-center gap-3 ${status.color}`}>
        <span className="text-2xl">{status.icon}</span>
        <div>
          <p className="font-semibold">{status.label}</p>
          <p className="text-sm opacity-80">
            {claim.status === "PENDING" && isOwner && "Review this claim and approve or reject it"}
            {claim.status === "PENDING" && isClaimer && "Waiting for the finder to review your claim"}
            {claim.status === "APPROVED" && "This claim has been approved! Coordinate the pickup below."}
            {claim.status === "REJECTED" && "This claim has been rejected."}
            {claim.status === "WITHDRAWN" && "This claim was withdrawn by the claimer."}
            {claim.status === "REVOKED" && "The approval was revoked by the finder. The item is back to active listings."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Info */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Claim for</p>
                  <CardTitle className="text-lg">
                    <Link href={`/report/${claim.reportId}`} className="hover:text-primary transition-colors">
                      {claim.reportTitle}
                    </Link>
                  </CardTitle>
                </div>
                {claim.categoryName && (
                  <span className="text-xs bg-muted px-2.5 py-1 rounded-full shrink-0">
                    {claim.categoryIcon} {claim.categoryName}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">Proof of Ownership</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                  {claim.proofText}
                </p>
              </div>

              {claim.verificationAnswer && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">Verification Answer</h3>
                  <p className="text-sm leading-relaxed bg-muted/30 p-3 rounded-lg italic">
                    &ldquo;{claim.verificationAnswer}&rdquo;
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t border-border/60">
                <span>Claimed by <strong className="text-foreground">@{claimerUser?.username}</strong></span>
                <span>Item found by <strong className="text-foreground">@{ownerUser?.username}</strong></span>
                <span>Submitted {formatDate(claim.createdAt)}</span>
              </div>

              {/* Actions for owner */}
              {isOwner && claim.status === "PENDING" && (
                <div className="pt-3 border-t border-border/60">
                  <ClaimActions claimId={claim.id} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                💬 Messages
                <Badge variant="secondary" className="text-xs">{claimMessages.length}</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Coordinate pickup details and communicate about the item
              </p>
            </CardHeader>
            <CardContent>
              <MessageThread
                claimId={claim.id}
                currentUserId={session.user.id}
                messages={claimMessages.map(m => ({
                  id: m.id,
                  content: m.content,
                  senderId: m.senderId,
                  senderName: m.senderName,
                  createdAt: m.createdAt.toISOString(),
                }))}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pickup Details */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                📦 Pickup Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PickupEditor
                claimId={claim.id}
                currentPickupTime={claim.pickupTime?.toISOString() || null}
                currentPickupLocation={claim.pickupLocation || null}
              />
            </CardContent>
          </Card>

          {/* Dispute / Revoke Actions */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                🛡️ Claim Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ClaimDisputeActions
                claimId={claim.id}
                claimStatus={claim.status}
                isOwner={isOwner}
                isClaimer={isClaimer}
              />
              {claim.status === "WITHDRAWN" || claim.status === "REVOKED" || claim.status === "REJECTED" ? (
                <p className="text-xs text-muted-foreground mt-2">This claim is no longer active.</p>
              ) : null}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {ownerUser?.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">@{ownerUser?.username}</p>
                  <p className="text-xs text-muted-foreground">Finder (item owner)</p>
                </div>
                {isOwner && <Badge variant="secondary" className="ml-auto text-xs">You</Badge>}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {claimerUser?.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">@{claimerUser?.username}</p>
                  <p className="text-xs text-muted-foreground">Claimer</p>
                </div>
                {isClaimer && <Badge variant="secondary" className="ml-auto text-xs">You</Badge>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
