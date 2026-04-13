"use client";

import { useState, useRef } from "react";
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        setImagePreview(null);
      } else {
        setImageUrl(data.url);
      }
    } catch {
      setError("Image upload failed. Please try again.");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: CreateReportInput) => {
    setError(null);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          imageUrl: imageUrl || undefined,
        }),
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in" id="create-report-form">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg flex items-center gap-2 animate-slide-down">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Report Type Toggle */}
      <div>
        <Label className="mb-2 block text-sm font-medium">What are you reporting?</Label>
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`p-4 border-2 cursor-pointer text-center rounded-xl transition-all duration-200 ${
              isLost
                ? "border-red-400 bg-red-50 shadow-sm shadow-red-100"
                : "border-border/60 hover:border-muted-foreground/30"
            }`}
          >
            <input type="radio" value="LOST" {...register("type")} className="sr-only" />
            <span className="block text-2xl mb-1">😢</span>
            <span className={`font-semibold text-sm ${isLost ? "text-red-600" : "text-muted-foreground"}`}>
              I Lost Something
            </span>
          </label>
          <label
            className={`p-4 border-2 cursor-pointer text-center rounded-xl transition-all duration-200 ${
              !isLost
                ? "border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100"
                : "border-border/60 hover:border-muted-foreground/30"
            }`}
          >
            <input type="radio" value="FOUND" {...register("type")} className="sr-only" />
            <span className="block text-2xl mb-1">🎉</span>
            <span className={`font-semibold text-sm ${!isLost ? "text-emerald-600" : "text-muted-foreground"}`}>
              I Found Something
            </span>
          </label>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <Label className="mb-2 block text-sm font-medium">
          📷 Photo (Optional)
        </Label>
        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden border border-border/60 animate-scale-in">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Uploading...
                </div>
              </div>
            )}
            {!uploading && (
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            )}
            {imageUrl && !uploading && (
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-emerald-500/90 text-white text-xs rounded-full font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Uploaded
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border/60 hover:border-primary/40 rounded-xl p-8 text-center transition-all hover:bg-primary/5 group"
          >
            <svg className="w-10 h-10 mx-auto text-muted-foreground/40 group-hover:text-primary/60 transition-colors mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Click to upload a photo
            </p>
            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG or WebP • Max 5MB</p>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Title */}
      <div>
        <Label htmlFor="title" className="text-sm font-medium">Title</Label>
        <Input
          id="title"
          placeholder={isLost ? "e.g., Black iPhone 14 Pro" : "e.g., Set of keys"}
          {...register("title")}
          className="mt-1.5 h-11"
        />
        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
        <Textarea
          id="description"
          placeholder={
            isLost
              ? "Describe your item in detail. Include color, brand, distinguishing features..."
              : "Describe the item you found. Where exactly did you find it?"
          }
          {...register("description")}
          className="mt-1.5 min-h-[120px]"
        />
        <p className="text-xs text-muted-foreground mt-1">Minimum 20 characters</p>
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="categoryId" className="text-sm font-medium">Category</Label>
        <select
          id="categoryId"
          {...register("categoryId")}
          className="w-full h-11 px-3 border border-border rounded-lg bg-background text-sm mt-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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

      {/* Date & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="lostFoundDate" className="text-sm font-medium">
            {isLost ? "When did you lose it?" : "When did you find it?"}
          </Label>
          <Input id="lostFoundDate" type="date" {...register("lostFoundDate")} className="mt-1.5 h-11" />
          {errors.lostFoundDate && <p className="text-sm text-destructive mt-1">{errors.lostFoundDate.message}</p>}
        </div>
        <div>
          <Label htmlFor="locationDescription" className="text-sm font-medium">Location (optional)</Label>
          <Input
            id="locationDescription"
            placeholder={isLost ? "Where did you last see it?" : "Where did you find it?"}
            {...register("locationDescription")}
            className="mt-1.5 h-11"
          />
        </div>
      </div>

      {/* Verification Question */}
      {isLost && (
        <div className="border-t border-border/60 pt-6 animate-slide-up">
          <Label htmlFor="verificationQuestion" className="text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Verification Question (Optional)
          </Label>
          <Input
            id="verificationQuestion"
            placeholder="e.g., What is the phone's wallpaper?"
            {...register("verificationQuestion")}
            className="mt-1.5 h-11"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Ask a question only the real owner would know
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1 h-12 font-medium"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant={isLost ? "destructive" : "default"}
          disabled={isSubmitting || uploading}
          className={`flex-1 h-12 font-medium shadow-md ${
            !isLost ? "gradient-primary text-white border-0 shadow-primary/20" : "shadow-destructive/20"
          }`}
          id="report-submit"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </span>
          ) : isLost ? "Report Lost Item" : "Report Found Item"}
        </Button>
      </div>
    </form>
  );
}
