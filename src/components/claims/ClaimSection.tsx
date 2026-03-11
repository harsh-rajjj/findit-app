"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClaimSchema, type CreateClaimInput } from "@/lib/validators/report";

interface ClaimSectionProps {
  reportId: string;
  hasVerificationQuestion: boolean;
}

export function ClaimSection({ reportId, hasVerificationQuestion }: ClaimSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateClaimInput>({
    resolver: zodResolver(createClaimSchema),
    defaultValues: { reportId },
  });

  const onSubmit = async (data: CreateClaimInput) => {
    setError(null);
    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Failed to submit claim");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  if (!showForm) {
    return (
      <Button className="w-full" onClick={() => setShowForm(true)}>
        This Is Mine — Claim Item
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("reportId")} />

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      <div>
        <Label>Proof of Ownership</Label>
        <Textarea
          placeholder="Describe why you believe this is your item. Include specific details only the owner would know..."
          {...register("proofText")}
        />
        {errors.proofText && <p className="text-sm text-destructive mt-1">{errors.proofText.message}</p>}
      </div>

      {hasVerificationQuestion && (
        <div>
          <Label>Verification Answer</Label>
          <Input
            placeholder="Answer the owner's verification question"
            {...register("verificationAnswer")}
          />
          {errors.verificationAnswer && (
            <p className="text-sm text-destructive mt-1">{errors.verificationAnswer.message}</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Submitting..." : "Submit Claim"}
        </Button>
      </div>
    </form>
  );
}
