import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { desksTable } from "./desks";

export const sessionStatusEnum = pgEnum("session_status", ["active", "away"]);

export const sessionsTable = pgTable("sessions", {
  id: serial("id").primaryKey(),
  deskId: integer("desk_id")
    .notNull()
    .references(() => desksTable.id, { onDelete: "cascade" }),
  studentName: text("student_name").notNull(),
  studentId: text("student_id").notNull(),
  checkedInAt: timestamp("checked_in_at").notNull().defaultNow(),
  status: sessionStatusEnum("status").notNull().default("active"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Session = typeof sessionsTable.$inferSelect;
export type InsertSession = typeof sessionsTable.$inferInsert;
