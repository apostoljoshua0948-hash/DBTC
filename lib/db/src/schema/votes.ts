import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { studentsTable } from "./students";
import { candidatesTable } from "./candidates";

export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id),
  candidateId: integer("candidate_id").notNull().references(() => candidatesTable.id),
  position: text("position").notNull(),
  votedAt: timestamp("voted_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Vote = typeof votesTable.$inferSelect;
