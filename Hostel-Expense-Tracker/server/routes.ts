import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Create Room
  app.post(api.rooms.create.path, async (req, res) => {
    try {
      const input = api.rooms.create.input.parse(req.body);
      
      const room = await storage.createRoom({
        name: input.name,
        communalBudget: input.communalBudget || "0"
      });
      
      const user = await storage.createUser({
        name: input.userName,
        roomId: room.id,
        personalBudget: input.userPersonalBudget || "0"
      });
      
      res.status(201).json({ room, user, token: "dummy-token" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // Join Room
  app.post(api.rooms.join.path, async (req, res) => {
    try {
      const input = api.rooms.join.input.parse(req.body);
      const room = await storage.getRoomByCode(input.code);
      
      if (!room) {
        res.status(404).json({ message: "Room not found. Check the code!" });
        return;
      }
      
      const user = await storage.createUser({
        name: input.userName,
        roomId: room.id,
        personalBudget: input.userPersonalBudget || "0"
      });
      
      res.json({ room, user, token: "dummy-token" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // Get Room Data (with members)
  app.get(api.rooms.get.path, async (req, res) => {
    const roomId = parseInt(req.params.id);
    const room = await storage.getRoom(roomId);
    if (!room) {
      res.status(404).json({ message: "Room not found" });
      return;
    }
    const members = await storage.getRoomUsers(roomId);
    res.json({ ...room, members });
  });
  
  // Get Room Users
  app.get(api.users.list.path, async (req, res) => {
      const roomId = parseInt(req.params.roomId);
      const users = await storage.getRoomUsers(roomId);
      res.json(users);
  });

  // Get Room Expenses
  app.get(api.expenses.list.path, async (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const expenses = await storage.getRoomExpenses(roomId);
    res.json(expenses);
  });

  // Add Expense
  app.post(api.expenses.create.path, async (req, res) => {
    try {
      // Coerce amount to string if needed or handle in frontend, schema expects string/numeric
      // But Zod schema from drizzle-zod might expect string for numeric columns
      const input = api.expenses.create.input.parse(req.body);
      const expense = await storage.createExpense(input);
      res.status(201).json(expense);
    } catch (err) {
       if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
        return;
      }
      throw err;
    }
  });

  // Delete Expense
  app.delete(api.expenses.delete.path, async (req, res) => {
      const id = parseInt(req.params.id);
      await storage.deleteExpense(id);
      res.status(204).send();
  });

  // Reset Month (Archive)
  app.post(api.rooms.reset.path, async (req, res) => {
      const roomId = parseInt(req.params.id);
      await storage.archiveRoomExpenses(roomId);
      res.json({ message: "Month reset successfully" });
  });

  return httpServer;
}
