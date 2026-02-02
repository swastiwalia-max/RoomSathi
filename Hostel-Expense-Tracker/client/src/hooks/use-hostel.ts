import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertExpense, type CreateRoomRequest, type JoinRoomRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// ============================================
// ROOMS
// ============================================

export function useCreateRoom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateRoomRequest) => {
      // API expects strings for budget, ensure schema compliance
      const payload = {
        ...data,
        communalBudget: String(data.communalBudget || "0"),
        userPersonalBudget: String(data.userPersonalBudget || "0")
      };

      const res = await fetch(api.rooms.create.path, {
        method: api.rooms.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create room");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // Store session
      localStorage.setItem("hostel_user_id", String(data.user.id));
      localStorage.setItem("hostel_room_id", String(data.room.id));
      localStorage.setItem("hostel_room_code", data.room.code);
      
      toast({
        title: "Room Created! 🎉",
        description: `Your room code is ${data.room.code}. Share it with roommates!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useJoinRoom() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: JoinRoomRequest) => {
      const payload = {
        ...data,
        userPersonalBudget: String(data.userPersonalBudget || "0")
      };

      const res = await fetch(api.rooms.join.path, {
        method: api.rooms.join.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to join room");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // Store session
      localStorage.setItem("hostel_user_id", String(data.user.id));
      localStorage.setItem("hostel_room_id", String(data.room.id));
      localStorage.setItem("hostel_room_code", data.room.code);

      toast({
        title: "Joined Room! 👋",
        description: `Welcome to ${data.room.name}!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useRoom(id: number) {
  return useQuery({
    queryKey: [api.rooms.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.rooms.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch room");
      return await res.json();
    },
    enabled: !!id,
  });
}

export function useResetMonth(roomId: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const url = buildUrl(api.rooms.reset.path, { id: roomId });
      const res = await fetch(url, {
        method: api.rooms.reset.method,
      });
      if (!res.ok) throw new Error("Failed to reset month");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      toast({
        title: "Month Reset",
        description: "All expenses have been archived. Ready for a fresh start!",
      });
    }
  });
}

// ============================================
// USERS
// ============================================

export function useRoomUsers(roomId: number) {
  return useQuery({
    queryKey: [api.users.list.path, roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const url = buildUrl(api.users.list.path, { roomId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch users");
      // Use loose parsing as schema might differ slightly on partial fields
      return await res.json(); 
    },
    enabled: !!roomId,
  });
}

// ============================================
// EXPENSES
// ============================================

export function useExpenses(roomId: number) {
  return useQuery({
    queryKey: [api.expenses.list.path, roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const url = buildUrl(api.expenses.list.path, { roomId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return await res.json();
    },
    enabled: !!roomId,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertExpense) => {
      // Ensure numeric strings
      const payload = {
        ...data,
        amount: String(data.amount)
      };

      const res = await fetch(api.expenses.create.path, {
        method: api.expenses.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create expense");
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.rooms.get.path] }); // Room might have updated totals if we implemented that
      toast({
        title: "Expense Added 💸",
        description: `Added ${variables.title} to expenses.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.expenses.delete.path, { id });
      const res = await fetch(url, {
        method: api.expenses.delete.method,
      });
      if (!res.ok) throw new Error("Failed to delete expense");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      toast({
        title: "Deleted",
        description: "Expense removed successfully.",
      });
    }
  });
}
