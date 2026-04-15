import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReportCardProps {
  report: {
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    createdAt: Date;
    imageUrl?: string | null;
    category?: { name: string; icon: string | null } | null;
  };
  showClaimButton?: boolean;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ReportCard({ report, showClaimButton }: ReportCardProps) {
  const isLost = report.type === "LOST";

  return (
    <Link href={`/report/${report.id}`} id={`report-card-${report.id}`}>
      <Card className={`h-full card-hover cursor-pointer group relative overflow-hidden border-border/60 ${
        isLost ? "hover:border-red-300" : "hover:border-emerald-300"
      }`}>
        {/* Type accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${
          isLost
            ? "bg-gradient-to-r from-red-500 to-orange-400"
            : "bg-gradient-to-r from-emerald-500 to-teal-400"
        }`} />

        {/* Image */}
        {report.imageUrl && (
          <div className="relative w-full h-40 overflow-hidden bg-muted">
            <img
              src={report.imageUrl}
              alt={report.title}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <Badge
              variant={isLost ? "destructive" : "default"}
              className={`absolute top-2 right-2 text-xs font-semibold ${
                !isLost ? "gradient-primary text-white border-0" : ""
              }`}
            >
              {report.type}
            </Badge>
          </div>
        )}

        <CardHeader className={`pb-2 ${report.imageUrl ? "pt-3" : "pt-5"}`}>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base line-clamp-1 group-hover:text-primary transition-colors">
              {report.title}
            </CardTitle>
            {!report.imageUrl && (
              <Badge
                variant={isLost ? "destructive" : "default"}
                className={`shrink-0 text-xs font-semibold ${
                  !isLost ? "gradient-primary text-white border-0" : ""
                }`}
              >
                {report.type}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {report.category && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {report.category.icon} {report.category.name}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {timeAgo(report.createdAt)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {report.description}
          </p>
          {showClaimButton && report.type === "FOUND" && report.status === "ACTIVE" && (
            <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
              <span>View & Claim</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
