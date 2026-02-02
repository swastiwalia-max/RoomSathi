import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // 6-char uppercase code
  communalBudget: numeric("communal_budget").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  roomId: integer("room_id").notNull(),
  personalBudget: numeric("personal_budget").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  amount: numeric("amount").notNull(),
  type: text("type").notNull(), // 'personal' | 'shared'
  category: text("category").notNull(), // Food, Electricity, WiFi, Travel, Laundry, Misc
  paidById: integer("paid_by_id").notNull(),
  roomId: integer("room_id").notNull(),
  date: timestamp("date").defaultNow(),
  archived: boolean("archived").default(false), // For month reset
});

// === RELATIONS ===

export const roomsRelations = relations(rooms, ({ many }) => ({
  users: many(users),
  expenses: many(expenses),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  room: one(rooms, {
    fields: [users.roomId],
    references: [rooms.id],
  }),
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  room: one(rooms, {
    fields: [expenses.roomId],
    references: [rooms.id],
  }),
  paidBy: one(users, {
    fields: [expenses.paidById],
    references: [users.id],
  }),
}));

// === SCHEMAS ===

export const insertRoomSchema = createInsertSchema(rooms).pick({
  name: true,
  communalBudget: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  personalBudget: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  title: true,
  amount: true,
  type: true,
  category: true,
  paidById: true,
  roomId: true,
});

// === TYPES ===

export type Room = typeof rooms.$inferSelect;
export type User = typeof users.$inferSelect;
export type Expense = typeof expenses.$inferSelect;

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// Request types
export type CreateRoomRequest = InsertRoom & { userName: string; userPersonalBudget?: string };
export type JoinRoomRequest = { code: string; userName: string; userPersonalBudget?: string };
export type CreateExpenseRequest = InsertExpense;

export type RoomWithMembers = Room & { members: User[] };
