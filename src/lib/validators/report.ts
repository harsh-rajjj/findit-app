import { z } from "zod";

// ============================================================================
// REPORT SCHEMAS
// ============================================================================

export const createReportSchema = z.object({
  type: z.enum(["LOST", "FOUND"]),
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be at most 2000 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  locationDescription: z
    .string()
    .max(200, "Location description must be at most 200 characters")
    .optional(),
  lostFoundDate: z.string().min(1, "Please select a date"),
  verificationQuestion: z
    .string()
    .max(200, "Verification question must be at most 200 characters")
    .optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// ============================================================================
// CLAIM SCHEMAS
// ============================================================================

export const createClaimSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  proofText: z
    .string()
    .min(10, "Please provide more details about your claim")
    .max(1000, "Proof text must be at most 1000 characters"),
  verificationAnswer: z
    .string()
    .max(200, "Answer must be at most 200 characters")
    .optional(),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
