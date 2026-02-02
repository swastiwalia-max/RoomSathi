import { z } from 'zod';
import { insertRoomSchema, insertUserSchema, insertExpenseSchema, rooms, users, expenses } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  rooms: {
    create: {
      method: 'POST' as const,
      path: '/api/rooms',
      input: z.object({
        name: z.string().min(1),
        userName: z.string().min(1),
        communalBudget: z.string().optional(),
        userPersonalBudget: z.string().optional(),
      }),
      responses: {
        201: z.object({ room: z.any(), user: z.any(), token: z.string() }), // returning simple objects for now to avoid circular type issues in routes definition
        400: errorSchemas.validation,
      },
    },
    join: {
      method: 'POST' as const,
      path: '/api/rooms/join',
      input: z.object({
        code: z.string().length(6),
        userName: z.string().min(1),
        userPersonalBudget: z.string().optional(),
      }),
      responses: {
        200: z.object({ room: z.any(), user: z.any(), token: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/rooms/:id',
      responses: {
        200: z.any(), // RoomWithMembers
        404: errorSchemas.notFound,
      },
    },
    reset: {
        method: 'POST' as const,
        path: '/api/rooms/:id/reset',
        responses: {
            200: z.object({ message: z.string() }),
        }
    }
  },
  users: {
    list: {
        method: 'GET' as const,
        path: '/api/rooms/:roomId/users',
        responses: {
            200: z.array(z.custom<typeof users.$inferSelect>()),
        }
    }
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/rooms/:roomId/expenses',
      responses: {
        200: z.array(z.custom<typeof expenses.$inferSelect & { paidBy: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/expenses',
      input: insertExpenseSchema,
      responses: {
        201: z.custom<typeof expenses.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
        method: 'DELETE' as const,
        path: '/api/expenses/:id',
        responses: {
            204: z.void(),
            404: errorSchemas.notFound
        }
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
