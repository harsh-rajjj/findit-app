"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ClaimActionsProps {
  claimId: string;
}

export function ClaimActions({ claimId }: ClaimActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(action);
    try {
      const response = await fetch(`/api/claims/${claimId}/${action}`, {
        method: "POST",
      });
      if (response.ok) {
        router.refresh();
      }
    } catch {
      console.error(`Failed to ${action} claim`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
      >
        {loading === "approve" ? "..." : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
      >
        {loading === "reject" ? "..." : "Reject"}
      </Button>
    </div>
  );
}
