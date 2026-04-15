"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DeleteReportButtonProps {
  reportId: string;
}

export function DeleteReportButton({ reportId }: DeleteReportButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 4000);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete report");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-2 pt-2 border-t border-border/60">
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-2.5 py-2">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="destructive"
        className={`w-full h-10 text-sm ${confirming ? "animate-pulse" : ""}`}
        disabled={loading}
        onClick={handleDelete}
        id={`report-delete-${reportId}`}
      >
        {loading ? "Deleting..." : confirming ? "Confirm Delete" : "Delete Report"}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        This permanently deletes this item report and related claims.
      </p>
    </div>
  );
}

