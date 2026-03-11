import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { ClaimSection } from "@/components/claims/ClaimSection";
import { ClaimActions } from "@/components/claims/ClaimActions";
import { ReportActions } from "@/components/reports/ReportActions";

interface ReportPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ claim?: string }>;
}

async function getReport(id: string) {
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      category: true,
      user: { select: { id: true, username: true } },
      claims: {
        include: {
          claimer: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: "desc" as const },
      },
    },
  });
  return report;
}

export default async function ReportPage({ params, searchParams }: ReportPageProps) {
  const { id } = await params;
  const { claim: claimParam } = await searchParams;
  const session = await auth();
  const report = await getReport(id);

  if (!report || report.deletedAt) {
    notFound();
  }

  const isOwner = session?.user?.id === report.userId;
  const isLost = report.type === "LOST";
  const hasImage = report.images && report.images.length > 0;

  // Check if current user already claimed
  const existingClaim = report.claims.find(
    (c) => c.claimerId === session?.user?.id
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        href={isOwner ? "/dashboard" : "/browse"}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        ← Back to {isOwner ? "Dashboard" : "Browse"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="border border-gray-200 bg-white">
            {hasImage ? (
              <div className="relative aspect-[4/3]">
                <Image
                  src={report.images[0]}
                  alt={report.title}
                  fill
                  className="object-contain bg-gray-50"
                  priority
                />
              </div>
            ) : (
              <div className="aspect-[4/3] flex items-center justify-center bg-gray-100 text-gray-400">
                <svg
                  className="w-16 h-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}
            {report.images.length > 1 && (
              <div className="flex gap-2 p-2 border-t border-gray-200">
                {report.images.slice(1).map((img, i) => (
                  <div key={i} className="relative w-20 h-20 border border-gray-200">
                    <Image
                      src={img}
                      alt={`${report.title} - image ${i + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
              <Badge variant={isLost ? "lost" : "found"}>
                {isLost ? "LOST" : "FOUND"}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              <span>
                {report.category.icon} {report.category.name}
              </span>
              <span>
                {isLost ? "Lost" : "Found"} on {formatDate(report.lostFoundDate)}
              </span>
              <span>Posted {formatRelativeTime(report.createdAt)}</span>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {report.description}
              </p>
            </div>

            {report.locationDescription && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="font-semibold text-gray-900 mb-2">Location</h2>
                <p className="text-gray-700">📍 {report.locationDescription}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">Status</span>
              <Badge
                variant={
                  report.status === "ACTIVE"
                    ? "active"
                    : report.status === "RESOLVED"
                    ? "resolved"
                    : "expired"
                }
              >
                {report.status}
              </Badge>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p>
                Reported by{" "}
                <span className="font-medium text-gray-900">
                  @{report.user.username}
                </span>
              </p>
            </div>

            {/* Owner Actions */}
            {isOwner && report.status === "ACTIVE" && (
              <ReportActions reportId={report.id} />
            )}

            {/* Claim Button for non-owners on FOUND items */}
            {!isOwner && !isLost && report.status === "ACTIVE" && session?.user && (
              <div>
                {existingClaim ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      You&apos;ve already submitted a claim.
                      <br />
                      Status:{" "}
                      <Badge variant={existingClaim.status.toLowerCase() as "pending" | "approved" | "rejected"}>
                        {existingClaim.status}
                      </Badge>
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

            {/* Login prompt */}
            {!session?.user && !isLost && report.status === "ACTIVE" && (
              <Link href={`/login?callbackUrl=/report/${report.id}`}>
                <Button className="w-full">Login to Claim</Button>
              </Link>
            )}
          </div>

          {/* Claims Section (for owner) */}
          {isOwner && !isLost && report.claims.length > 0 && (
            <div className="border border-gray-200 bg-white p-6">
              <h2 className="font-semibold text-gray-900 mb-4">
                Claims ({report.claims.length})
              </h2>
              <div className="space-y-4">
                {report.claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">@{claim.claimer.username}</span>
                      <Badge variant={claim.status.toLowerCase() as "pending" | "approved" | "rejected"}>
                        {claim.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {claim.proofText}
                    </p>
                    {claim.verificationAnswer && (
                      <p className="text-sm text-gray-500 mb-3">
                        <strong>Verification answer:</strong>{" "}
                        {claim.verificationAnswer}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mb-3">
                      {formatRelativeTime(claim.createdAt)}
                    </p>
                    {claim.status === "PENDING" && (
                      <ClaimActions claimId={claim.id} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
