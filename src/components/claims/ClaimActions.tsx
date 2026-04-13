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
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null);

  const handleAction = async (action: "approve" | "reject") => {
    if (confirming !== action) {
      setConfirming(action);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirming(null), 3000);
      return;
    }

    setLoading(action);
    setConfirming(null);
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
        className={`h-8 text-xs font-medium transition-all ${
          confirming === "approve"
            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
            : "gradient-primary text-white border-0"
        }`}
        id={`claim-approve-${claimId}`}
      >
        {loading === "approve" ? (
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : confirming === "approve" ? (
          "Confirm ✓"
        ) : (
          "Approve"
        )}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        className={`h-8 text-xs font-medium ${confirming === "reject" ? "animate-pulse" : ""}`}
        id={`claim-reject-${claimId}`}
      >
        {loading === "reject" ? (
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : confirming === "reject" ? (
          "Confirm ✕"
        ) : (
          "Reject"
        )}
      </Button>
    </div>
  );
}
