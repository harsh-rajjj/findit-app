"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  createReportSchema,
  type CreateReportInput,
} from "@/lib/validators/report";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parentId: string | null;
  children?: Category[];
}

interface CreateReportFormProps {
  categories: Category[];
}

export function CreateReportForm({ categories }: CreateReportFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get("type")?.toUpperCase() === "FOUND" ? "FOUND" : "LOST";

  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateReportInput>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      type: defaultType,
      images: [],
      lostFoundDate: new Date(),
    },
  });

  const reportType = watch("type");
  const isLost = reportType === "LOST";

  // Build flat category options with hierarchy
  const categoryOptions = categories.flatMap((parent) => {
    const options = [{ value: parent.id, label: `${parent.icon || ""} ${parent.name}` }];
    if (parent.children) {
      parent.children.forEach((child) => {
        options.push({
          value: child.id,
          label: `  └ ${child.icon || ""} ${child.name}`,
        });
      });
    }
    return options;
  });

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude);
        setValue("longitude", position.coords.longitude);
        setIsGettingLocation(false);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [setValue]);

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

  // Set today's date as default for date input
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const dateInput = document.getElementById("lostFoundDate") as HTMLInputElement;
    if (dateInput && !dateInput.value) {
      dateInput.value = today;
    }
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Report Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          What are you reporting?
        </label>
        <div className="flex gap-4">
          <label
            className={`flex-1 p-4 border-2 cursor-pointer text-center ${
              isLost
                ? "border-red-600 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              value="LOST"
              {...register("type")}
              className="sr-only"
            />
            <span className="block text-2xl mb-1">😢</span>
            <span className={`font-semibold ${isLost ? "text-red-700" : ""}`}>
              I Lost Something
            </span>
          </label>
          <label
            className={`flex-1 p-4 border-2 cursor-pointer text-center ${
              !isLost
                ? "border-green-600 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              value="FOUND"
              {...register("type")}
              className="sr-only"
            />
            <span className="block text-2xl mb-1">🎉</span>
            <span className={`font-semibold ${!isLost ? "text-green-700" : ""}`}>
              I Found Something
            </span>
          </label>
        </div>
      </div>

      {/* Title */}
      <Input
        label="Title"
        placeholder={isLost ? "e.g., Black iPhone 14 Pro" : "e.g., Set of keys"}
        error={errors.title?.message}
        {...register("title")}
      />

      {/* Description */}
      <Textarea
        label="Description"
        placeholder={
          isLost
            ? "Describe your item in detail. Include color, brand, distinguishing features..."
            : "Describe the item you found. Where exactly did you find it?"
        }
        helperText="Minimum 20 characters"
        error={errors.description?.message}
        {...register("description")}
      />

      {/* Category */}
      <Select
        label="Category"
        options={categoryOptions}
        error={errors.categoryId?.message}
        {...register("categoryId")}
      />

      {/* Date */}
      <Input
        label={isLost ? "When did you lose it?" : "When did you find it?"}
        type="date"
        error={errors.lostFoundDate?.message}
        {...register("lostFoundDate")}
      />

      {/* Location */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-900">
            Location
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? "Getting location..." : "📍 Use current location"}
          </Button>
        </div>
        <Input
          placeholder={isLost ? "Where did you last see it?" : "Where did you find it?"}
          {...register("locationDescription")}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="number"
            step="any"
            placeholder="Latitude"
            {...register("latitude", { valueAsNumber: true })}
          />
          <Input
            type="number"
            step="any"
            placeholder="Longitude"
            {...register("longitude", { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Verification Question (only for LOST items) */}
      {isLost && (
        <div className="border-t border-gray-200 pt-6">
          <Input
            label="Verification Question (Optional)"
            placeholder="e.g., What is the phone's wallpaper?"
            helperText="Ask a question only the real owner would know the answer to"
            {...register("verificationQuestion")}
          />
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant={isLost ? "danger" : "primary"}
          isLoading={isSubmitting}
          className="flex-1"
        >
          {isLost ? "Report Lost Item" : "Report Found Item"}
        </Button>
      </div>
    </form>
  );
}
