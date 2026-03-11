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
    category?: { name: string; icon: string | null } | null;
  };
  showClaimButton?: boolean;
}

export function ReportCard({ report, showClaimButton }: ReportCardProps) {
  return (
    <Link href={`/report/${report.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base line-clamp-1">{report.title}</CardTitle>
            <Badge variant={report.type === "LOST" ? "destructive" : "default"}>
              {report.type}
            </Badge>
          </div>
          {report.category && (
            <p className="text-sm text-muted-foreground">
              {report.category.icon} {report.category.name}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {report.description}
          </p>
          {showClaimButton && report.type === "FOUND" && report.status === "ACTIVE" && (
            <p className="mt-3 text-sm font-medium text-primary">
              View & Claim →
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
