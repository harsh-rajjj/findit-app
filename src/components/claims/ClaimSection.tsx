"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
        This Is Mine - Claim Item
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("reportId")} />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Textarea
        label="Proof of Ownership"
        placeholder="Describe why you believe this is your item. Include specific details only the owner would know..."
        error={errors.proofText?.message}
        {...register("proofText")}
      />

      {hasVerificationQuestion && (
        <Input
          label="Verification Answer"
          placeholder="Answer the owner's verification question"
          helperText="The owner set a question to verify ownership"
          error={errors.verificationAnswer?.message}
          {...register("verificationAnswer")}
        />
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowForm(false)}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          Submit Claim
        </Button>
      </div>
    </form>
  );
}
