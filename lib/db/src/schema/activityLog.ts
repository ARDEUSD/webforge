import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const actionEnum = pgEnum("action", ["checkin", "away", "checkout"]);

export const activityLogTable = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  deskId: integer("desk_id").notNull(),
  deskNumber: integer("desk_number").notNull(),
  studentName: text("student_name").notNull(),
  studentId: text("student_id").notNull(),
  action: actionEnum("action").notNull(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
});

export type ActivityLog = typeof activityLogTable.$inferSelect;
