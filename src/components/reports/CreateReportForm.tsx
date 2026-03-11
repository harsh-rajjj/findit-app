"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createReportSchema, type CreateReportInput } from "@/lib/validators/report";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface CreateReportFormProps {
  categories: Category[];
}

export function CreateReportForm({ categories }: CreateReportFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type")?.toUpperCase() === "FOUND" ? "FOUND" : "LOST";

  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateReportInput>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      type: defaultType,
      lostFoundDate: new Date().toISOString().split("T")[0],
    },
  });

  const reportType = watch("type");
  const isLost = reportType === "LOST";

  const onSubmit = async (data: CreateReportInput) => {
    setError(null);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create report");
        return;
      }

      router.push(`/report/${result.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Report Type Toggle */}
      <div>
        <Label className="mb-2 block">What are you reporting?</Label>
        <div className="flex gap-4">
          <label
            className={`flex-1 p-4 border-2 cursor-pointer text-center rounded-md ${
              isLost ? "border-destructive bg-destructive/10" : "border-muted hover:border-muted-foreground/30"
            }`}
          >
            <input type="radio" value="LOST" {...register("type")} className="sr-only" />
            <span className="block text-2xl mb-1">😢</span>
            <span className={`font-semibold ${isLost ? "text-destructive" : ""}`}>
              I Lost Something
            </span>
          </label>
          <label
            className={`flex-1 p-4 border-2 cursor-pointer text-center rounded-md ${
              !isLost ? "border-green-600 bg-green-50" : "border-muted hover:border-muted-foreground/30"
            }`}
          >
            <input type="radio" value="FOUND" {...register("type")} className="sr-only" />
            <span className="block text-2xl mb-1">🎉</span>
            <span className={`font-semibold ${!isLost ? "text-green-700" : ""}`}>
              I Found Something
            </span>
          </label>
        </div>
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder={isLost ? "e.g., Black iPhone 14 Pro" : "e.g., Set of keys"}
          {...register("title")}
        />
        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder={
            isLost
              ? "Describe your item in detail. Include color, brand, distinguishing features..."
              : "Describe the item you found. Where exactly did you find it?"
          }
          {...register("description")}
        />
        <p className="text-xs text-muted-foreground mt-1">Minimum 20 characters</p>
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="categoryId">Category</Label>
        <select
          id="categoryId"
          {...register("categoryId")}
          className="w-full h-10 px-3 border rounded-md bg-background text-sm"
        >
          <option value="">Select a category...</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId.message}</p>}
      </div>

      {/* Date */}
      <div>
        <Label htmlFor="lostFoundDate">
          {isLost ? "When did you lose it?" : "When did you find it?"}
        </Label>
        <Input id="lostFoundDate" type="date" {...register("lostFoundDate")} />
        {errors.lostFoundDate && <p className="text-sm text-destructive mt-1">{errors.lostFoundDate.message}</p>}
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="locationDescription">Location (optional)</Label>
        <Input
          id="locationDescription"
          placeholder={isLost ? "Where did you last see it?" : "Where did you find it?"}
          {...register("locationDescription")}
        />
      </div>

      {/* Verification Question (only for LOST items) */}
      {isLost && (
        <div className="border-t pt-6">
          <Label htmlFor="verificationQuestion">Verification Question (Optional)</Label>
          <Input
            id="verificationQuestion"
            placeholder="e.g., What is the phone's wallpaper?"
            {...register("verificationQuestion")}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Ask a question only the real owner would know
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          variant={isLost ? "destructive" : "default"}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Submitting..." : isLost ? "Report Lost Item" : "Report Found Item"}
        </Button>
      </div>
    </form>
  );
}
