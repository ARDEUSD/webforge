import { db } from "@workspace/db";
import { desksTable, sessionsTable, activityLogTable, usersTable } from "@workspace/db/schema";
import bcrypt from "bcryptjs";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "deskguard2025";

type Zone = "quiet_study" | "collaboration" | "pc_lab" | "window_view";

const zones: Array<{ zone: Zone; start: number; end: number }> = [
  { zone: "quiet_study", start: 1, end: 15 },
  { zone: "collaboration", start: 16, end: 30 },
  { zone: "pc_lab", start: 31, end: 40 },
  { zone: "window_view", start: 41, end: 50 },
];

async function seed() {
  console.log("Seeding DeskGuard database...");

  // Clear in FK-safe order
  await db.delete(activityLogTable);
  await db.delete(sessionsTable);
  await db.delete(desksTable);
  await db.delete(usersTable);

  // Create 50 desks
  const desksToInsert = zones.flatMap(({ zone, start, end }) =>
    Array.from({ length: end - start + 1 }, (_, i) => ({
      number: start + i,
      zone,
      status: "free" as const,
    }))
  );
  await db.insert(desksTable).values(desksToInsert);
  console.log(`✓ Created ${desksToInsert.length} desks`);

  // Create admin user
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await db.insert(usersTable).values({
    username: ADMIN_USERNAME,
    passwordHash,
    role: "admin",
  });
  console.log(`✓ Created admin user: "${ADMIN_USERNAME}"`);

  console.log("\nSeeding complete!");
  console.log(`Admin login → username: "${ADMIN_USERNAME}"  password: "${ADMIN_PASSWORD}"`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
