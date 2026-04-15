import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

// Keep serverless connection usage very small to avoid exhausting pooled sessions
// on hosted Postgres providers (e.g. Supabase pooler).
const client = postgres(connectionString, {
  // In serverless (Vercel), keep this low to avoid pool exhaustion.
  // In local/dev, allow a few parallel DB ops for snappier navigation.
  max: isVercel ? 1 : 5,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});
export const db = drizzle(client, { schema });
