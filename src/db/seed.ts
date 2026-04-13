import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { users, categories, reports, matches } from "./schema";
import { createId } from "./utils";

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client);

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (order matters for foreign keys)
  await db.delete(matches);
  await db.delete(reports);
  await db.delete(categories);
  await db.delete(users);

  // Create categories (flat list)
  const categoryData = [
    { id: createId(), name: "Phones", slug: "phones", icon: "📱" },
    { id: createId(), name: "Laptops", slug: "laptops", icon: "💻" },
    { id: createId(), name: "Headphones", slug: "headphones", icon: "🎧" },
    { id: createId(), name: "Wallets", slug: "wallets", icon: "👛" },
    { id: createId(), name: "Keys", slug: "keys", icon: "🔑" },
    { id: createId(), name: "Bags", slug: "bags", icon: "🎒" },
    { id: createId(), name: "ID Cards", slug: "id-cards", icon: "🪪" },
    { id: createId(), name: "Books", slug: "books", icon: "📚" },
    { id: createId(), name: "Glasses", slug: "glasses", icon: "👓" },
    { id: createId(), name: "Clothing", slug: "clothing", icon: "👕" },
    { id: createId(), name: "Watches", slug: "watches", icon: "⌚" },
    { id: createId(), name: "Other", slug: "other", icon: "📦" },
  ];
  await db.insert(categories).values(categoryData);

  // Create demo users
  const passwordHash = await bcrypt.hash("password123", 10);
  const user1Id = createId();
  const user2Id = createId();

  await db.insert(users).values([
    { id: user1Id, username: "alice", passwordHash },
    { id: user2Id, username: "bob", passwordHash },
  ]);

  // Create sample reports
  const lostPhoneId = createId();
  const foundPhoneId = createId();

  await db.insert(reports).values([
    {
      id: lostPhoneId,
      type: "LOST",
      title: "Black iPhone 14 Pro",
      description: "Lost my black iPhone 14 Pro with a clear case. It has a crack on the bottom right corner of the screen. Last seen in the college library near the study area on the second floor.",
      categoryId: categoryData[0].id,
      userId: user1Id,
      locationDescription: "College Library, 2nd Floor",
      lostFoundDate: new Date("2026-03-10"),
      verificationQuestion: "What is the phone wallpaper?",
    },
    {
      id: foundPhoneId,
      type: "FOUND",
      title: "iPhone found in library",
      description: "Found a black iPhone with a clear case in the college library. It was left on a desk near the windows on the second floor. The phone has a small crack on the screen.",
      categoryId: categoryData[0].id,
      userId: user2Id,
      locationDescription: "College Library, near windows",
      lostFoundDate: new Date("2026-03-10"),
    },
    {
      id: createId(),
      type: "FOUND",
      title: "Blue backpack found in cafeteria",
      description: "Found a blue Nike backpack left under a table in the college cafeteria. Contains some notebooks and a pencil case. No name tag visible.",
      categoryId: categoryData[5].id,
      userId: user2Id,
      locationDescription: "College Cafeteria",
      lostFoundDate: new Date("2026-03-09"),
    },
    {
      id: createId(),
      type: "LOST",
      title: "Set of car and house keys",
      description: "Lost my keys somewhere on campus. They have a Toyota car key, two house keys, and a small red keychain. Possibly dropped near the parking lot or main building entrance.",
      categoryId: categoryData[4].id,
      userId: user1Id,
      locationDescription: "Campus parking lot area",
      lostFoundDate: new Date("2026-03-11"),
    },
  ]);

  // Create a match between the phone reports
  await db.insert(matches).values({
    id: createId(),
    lostReportId: lostPhoneId,
    foundReportId: foundPhoneId,
    confidenceScore: 85,
  });

  console.log("✅ Created 12 categories, 4 reports, 2 users, 1 match");
  console.log("📝 Demo accounts: alice/password123, bob/password123");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
