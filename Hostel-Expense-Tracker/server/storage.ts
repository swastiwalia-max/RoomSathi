import { db } from "./db";
import {
  rooms, users, expenses,
  type InsertRoom, type InsertUser, type InsertExpense,
  type Room, type User, type Expense
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // Rooms
  createRoom(room: InsertRoom): Promise<Room>;
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getRoomUsers(roomId: number): Promise<User[]>;
  
  // Expenses
  createExpense(expense: InsertExpense): Promise<Expense>;
  getRoomExpenses(roomId: number): Promise<(Expense & { paidBy: User })[]>;
  deleteExpense(id: number): Promise<void>;
  archiveRoomExpenses(roomId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createRoom(room: InsertRoom): Promise<Room> {
    const code = nanoid(6).toUpperCase();
    const [newRoom] = await db.insert(rooms).values({ ...room, code }).returning();
    return newRoom;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
    return room;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getRoomUsers(roomId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.roomId, roomId));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async getRoomExpenses(roomId: number): Promise<(Expense & { paidBy: User })[]> {
    return await db.select({
      id: expenses.id,
      title: expenses.title,
      amount: expenses.amount,
      type: expenses.type,
      category: expenses.category,
      paidById: expenses.paidById,
      roomId: expenses.roomId,
      date: expenses.date,
      archived: expenses.archived,
      paidBy: users
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.paidById, users.id))
    .where(and(eq(expenses.roomId, roomId), eq(expenses.archived, false)))
    .orderBy(desc(expenses.date));
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async archiveRoomExpenses(roomId: number): Promise<void> {
      await db.update(expenses)
        .set({ archived: true })
        .where(eq(expenses.roomId, roomId));
  }
}

export const storage = new DatabaseStorage();
