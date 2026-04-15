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
  const [proofImageUrls, setProofImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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
      if (isUploading) {
        setError("Please wait for image uploads to finish.");
        return;
      }
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, proofImageUrls }),
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

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = Math.max(0, 5 - proofImageUrls.length);
    const picked = Array.from(files).slice(0, remaining);
    if (picked.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of picked) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Upload failed");
        uploaded.push(json.url as string);
      }
      setProofImageUrls((prev) => [...prev, ...uploaded].slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!showForm) {
    return (
      <Button
        className="w-full gradient-primary text-white border-0 shadow-md shadow-primary/20 h-11 font-medium transition-all hover:opacity-90 hover:shadow-lg"
        onClick={() => setShowForm(true)}
        id="claim-open-form"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        This Is Mine — Claim Item
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-slide-up" id="claim-form">
      <input type="hidden" {...register("reportId")} />

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-center gap-2 animate-slide-down">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div>
        <Label className="text-sm font-medium">Proof of Ownership *</Label>
        <Textarea
          placeholder="Describe why you believe this is your item. Include specific details only the owner would know..."
          {...register("proofText")}
          className="mt-1.5 min-h-[100px]"
        />
        {errors.proofText && <p className="text-sm text-destructive mt-1">{errors.proofText.message}</p>}
      </div>

      <div>
        <Label className="text-sm font-medium">Proof Images (optional)</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Upload up to 5 photos that help prove ownership (receipts, unique marks, original packaging, etc.).
        </p>
        <Input
          type="file"
          accept="image/*"
          multiple
          className="mt-2 h-11"
          onChange={(e) => uploadFiles(e.target.files)}
          disabled={isUploading || proofImageUrls.length >= 5}
        />
        {proofImageUrls.length > 0 && (
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
            {proofImageUrls.map((url) => (
              <div key={url} className="relative rounded-lg overflow-hidden border border-border/60 bg-muted/20">
                <img src={url} alt="Proof upload" className="h-20 w-full object-cover" />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-background/80 hover:bg-background text-foreground rounded-md p-1 shadow-sm"
                  aria-label="Remove image"
                  onClick={() => setProofImageUrls((prev) => prev.filter((u) => u !== url))}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {isUploading && (
          <p className="text-xs text-muted-foreground mt-2">Uploading images…</p>
        )}
      </div>

      {hasVerificationQuestion && (
        <div>
          <Label className="text-sm font-medium">Verification Answer</Label>
          <Input
            placeholder="Answer the owner's verification question"
            {...register("verificationAnswer")}
            className="mt-1.5 h-11"
          />
          {errors.verificationAnswer && (
            <p className="text-sm text-destructive mt-1">{errors.verificationAnswer.message}</p>
          )}
        </div>
      )}

      {/* Pickup Details */}
      <div className="border-t border-border/60 pt-4 space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          📅 Proposed Pickup (optional)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Pickup Date & Time</Label>
            <Input
              type="datetime-local"
              {...register("pickupTime")}
              className="mt-1 h-10 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Pickup Location</Label>
            <Input
              placeholder="e.g., Library entrance"
              {...register("pickupLocation")}
              className="mt-1 h-10 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowForm(false)}
          className="flex-1 h-11"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-11 gradient-primary text-white border-0 shadow-sm"
          id="claim-submit"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </span>
          ) : (
            "Submit Claim"
          )}
        </Button>
      </div>
    </form>
  );
}
