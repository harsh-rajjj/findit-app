"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface ClaimDisputeActionsProps {
  claimId: string;
  claimStatus: string;
  isOwner: boolean;
  isClaimer: boolean;
}

export function ClaimDisputeActions({ claimId, claimStatus, isOwner, isClaimer }: ClaimDisputeActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<"withdraw" | "revoke" | "reclaim" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleWithdraw = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claimId}/dispute`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to withdraw claim");
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claimId}/revoke`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to revoke approval");
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const handleReclaim = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claimId}/reclaim`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reopen claim");
      } else {
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  // Claimer can withdraw if status is PENDING or APPROVED
  const canWithdraw = isClaimer && (claimStatus === "PENDING" || claimStatus === "APPROVED");
  // Owner can revoke if status is APPROVED
  const canRevoke = isOwner && claimStatus === "APPROVED";
  // Claimer can reopen a rejected/withdrawn claim
  const canReclaim = isClaimer && (claimStatus === "REJECTED" || claimStatus === "WITHDRAWN" || claimStatus === "REVOKED");

  if (!canWithdraw && !canRevoke && !canReclaim) return null;

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
          {error}
        </div>
      )}

      {showConfirm ? (
        <div className="p-4 border-2 border-amber-300 bg-amber-50 rounded-xl animate-scale-in">
          <p className="text-sm font-semibold text-amber-900 mb-1">
            {showConfirm === "withdraw"
              ? "⚠️ Withdraw this claim?"
              : showConfirm === "revoke"
                ? "⚠️ Revoke this approval?"
                : "⚠️ Reopen this claim?"}
          </p>
          <p className="text-xs text-amber-700 mb-3">
            {showConfirm === "withdraw" &&
              "This will cancel your claim. If it was already approved, the item will be put back as active for other people to claim."}
            {showConfirm === "revoke" &&
              "This will undo the approval and put the item back as active. The claimer will be notified and other people can submit new claims."}
            {showConfirm === "reclaim" &&
              "This will reopen your claim for review again. Consider adding extra proof in the messages after reopening."}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={
                showConfirm === "withdraw"
                  ? handleWithdraw
                  : showConfirm === "revoke"
                    ? handleRevoke
                    : handleReclaim
              }
              disabled={loading}
              className="text-xs h-8"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                showConfirm === "withdraw"
                  ? "Yes, Withdraw"
                  : showConfirm === "revoke"
                    ? "Yes, Revoke"
                    : "Yes, Reopen"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfirm(null)}
              disabled={loading}
              className="text-xs h-8"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {canWithdraw && (
            <button
              onClick={() => setShowConfirm("withdraw")}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              {claimStatus === "APPROVED" ? "Withdraw — Wrong Item" : "Withdraw My Claim"}
            </button>
          )}
          {canRevoke && (
            <button
              onClick={() => setShowConfirm("revoke")}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Revoke Approval — Mistake
            </button>
          )}
          {canReclaim && (
            <button
              onClick={() => setShowConfirm("reclaim")}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 9A8 8 0 006.34 6.34L4 10m0 5a8 8 0 0013.66 2.66L20 14" />
              </svg>
              {claimStatus === "REJECTED"
                ? "Appeal Rejection"
                : claimStatus === "REVOKED"
                  ? "Re-appeal Revocation"
                  : "Reclaim This Item"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
