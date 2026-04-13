"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PickupEditorProps {
  claimId: string;
  currentPickupTime?: string | null;
  currentPickupLocation?: string | null;
}

export function PickupEditor({ claimId, currentPickupTime, currentPickupLocation }: PickupEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState(
    currentPickupTime
      ? new Date(currentPickupTime).toISOString().slice(0, 16)
      : ""
  );
  const [pickupLocation, setPickupLocation] = useState(currentPickupLocation || "");

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(`/api/claims/${claimId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupTime: pickupTime || undefined,
          pickupLocation: pickupLocation || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!editing) {
    return (
      <div className="space-y-2">
        {(currentPickupTime || currentPickupLocation) ? (
          <div className="bg-muted/50 p-3 rounded-lg space-y-1.5">
            {currentPickupTime && (
              <p className="text-sm flex items-center gap-2">
                <span>📅</span>
                <span className="font-medium">{formatDateTime(currentPickupTime)}</span>
              </p>
            )}
            {currentPickupLocation && (
              <p className="text-sm flex items-center gap-2">
                <span>📍</span>
                <span className="font-medium">{currentPickupLocation}</span>
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No pickup details set yet</p>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditing(true)}
          className="text-xs h-8"
          id="pickup-edit"
        >
          {(currentPickupTime || currentPickupLocation) ? "Change Pickup Details" : "Set Pickup Details"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-slide-up">
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <div>
        <Label className="text-xs text-muted-foreground">Date & Time</Label>
        <Input
          type="datetime-local"
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
          className="h-9 text-sm mt-1"
        />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Location</Label>
        <Input
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          placeholder="e.g., Library entrance"
          className="h-9 text-sm mt-1"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="h-8 text-xs flex-1">
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="h-8 text-xs flex-1 gradient-primary text-white border-0"
          id="pickup-save"
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
