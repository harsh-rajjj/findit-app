"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface ClaimActionsProps {
  claimId: string;
}

export function ClaimActions({ claimId }: ClaimActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAction = async (action: "approve" | "reject") => {
    const setter = action === "approve" ? setIsApproving : setIsRejecting;
    setter(true);

    try {
      const response = await fetch(`/api/claims/${claimId}/${action}`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setter(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="primary"
        onClick={() => handleAction("approve")}
        isLoading={isApproving}
        disabled={isRejecting}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={() => handleAction("reject")}
        isLoading={isRejecting}
        disabled={isApproving}
      >
        Reject
      </Button>
    </div>
  );
}
