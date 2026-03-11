import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime, truncate } from "@/lib/utils";
import type { Report, Category, User } from "@prisma/client";

interface ReportCardProps {
  report: Report & {
    category: Category;
    user?: Pick<User, "username">;
  };
  showClaimButton?: boolean;
}

export function ReportCard({ report, showClaimButton = false }: ReportCardProps) {
  const isLost = report.type === "LOST";
  const hasImage = report.images && report.images.length > 0;

  return (
    <article className="border border-gray-200 bg-white hover:border-gray-400 transition-colors">
      {/* Image */}
      <Link href={`/report/${report.id}`}>
        <div className="relative aspect-[4/3] bg-gray-100">
          {hasImage ? (
            <Image
              src={report.images[0]}
              alt={report.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <svg
                className="w-12 h-12"
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
          {/* Type Badge */}
          <div className="absolute top-2 left-2">
            <Badge variant={isLost ? "lost" : "found"}>
              {isLost ? "LOST" : "FOUND"}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/report/${report.id}`}>
          <h3 className="font-semibold text-gray-900 hover:underline">
            {truncate(report.title, 50)}
          </h3>
        </Link>

        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
          {truncate(report.description, 100)}
        </p>

        {/* Meta Info */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span>{report.category.icon}</span>
            <span>{report.category.name}</span>
          </span>
          <span>•</span>
          <span>
            {isLost ? "Lost" : "Found"} {formatRelativeTime(report.lostFoundDate)}
          </span>
        </div>

        {/* Location */}
        {report.locationDescription && (
          <p className="mt-2 text-xs text-gray-500 truncate">
            📍 {report.locationDescription}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link
            href={`/report/${report.id}`}
            className="flex-1 text-center px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            View Details
          </Link>
          {showClaimButton && !isLost && (
            <Link
              href={`/report/${report.id}?claim=true`}
              className="flex-1 text-center px-3 py-2 text-sm font-medium bg-blue-800 text-white hover:bg-blue-900"
            >
              Claim Item
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
