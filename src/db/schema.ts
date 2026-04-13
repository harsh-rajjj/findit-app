import { pgTable, text, timestamp, integer, boolean, unique } from "drizzle-orm/pg-core";
import { createId } from "./utils";

// ============================================================================
// USERS
// ============================================================================
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(createId),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// CATEGORIES (flat list)
// ============================================================================
export const categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
});

// ============================================================================
// REPORTS (Lost or Found items)
// ============================================================================
export const reports = pgTable("reports", {
  id: text("id").primaryKey().$defaultFn(createId),
  type: text("type").notNull(), // "LOST" or "FOUND"
  status: text("status").notNull().default("ACTIVE"), // "ACTIVE" or "RESOLVED"
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: text("category_id").notNull().references(() => categories.id),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  locationDescription: text("location_description"),
  lostFoundDate: timestamp("lost_found_date").notNull(),
  verificationQuestion: text("verification_question"),
  imageUrl: text("image_url"),
  embedding: text("embedding"), // JSON-serialized float[] vector from ML model
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// CLAIMS (ownership claims on found items)
// ============================================================================
export const claims = pgTable("claims", {
  id: text("id").primaryKey().$defaultFn(createId),
  reportId: text("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  claimerId: text("claimer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("PENDING"), // "PENDING", "APPROVED", "REJECTED"
  proofText: text("proof_text").notNull(),
  verificationAnswer: text("verification_answer"),
  pickupTime: timestamp("pickup_time"),
  pickupLocation: text("pickup_location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.reportId, table.claimerId),
]);

// ============================================================================
// MESSAGES (conversation between claimer and finder on a claim)
// ============================================================================
export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(createId),
  claimId: text("claim_id").notNull().references(() => claims.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// MATCHES (potential lost-found matches)
// ============================================================================
export const matches = pgTable("matches", {
  id: text("id").primaryKey().$defaultFn(createId),
  lostReportId: text("lost_report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  foundReportId: text("found_report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  confidenceScore: integer("confidence_score").notNull(),
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique().on(table.lostReportId, table.foundReportId),
]);

// ============================================================================
// NOTIFICATIONS (in-app notification system)
// ============================================================================
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "MATCH", "CLAIM", "CLAIM_APPROVED", "CLAIM_REJECTED", "MESSAGE"
  title: text("title").notNull(),
  message: text("message").notNull(),
  linkUrl: text("link_url"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
