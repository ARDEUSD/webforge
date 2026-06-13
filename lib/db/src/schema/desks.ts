import { pgTable, serial, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const zoneEnum = pgEnum("zone", [
  "quiet_study",
  "collaboration",
  "pc_lab",
  "window_view",
]);
export const deskStatusEnum = pgEnum("desk_status", ["free", "occupied", "away"]);

export const desksTable = pgTable("desks", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  zone: zoneEnum("zone").notNull(),
  status: deskStatusEnum("status").notNull().default("free"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Desk = typeof desksTable.$inferSelect;
export type InsertDesk = typeof desksTable.$inferInsert;
