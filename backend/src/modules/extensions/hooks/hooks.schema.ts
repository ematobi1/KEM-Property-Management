import { z } from 'zod';
import { HookEvent, HookMethod } from '@prisma/client';

export const createHookSchema = z.object({
  name: z.string().min(1).max(100),
  agentId: z.string().uuid().optional(),
  event: z.nativeEnum(HookEvent),
  url: z.string().url(),
  method: z.nativeEnum(HookMethod).default(HookMethod.POST),
  headers: z.record(z.string()).default({}),
  isAsync: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export const updateHookSchema = createHookSchema.partial();

export type CreateHookInput = z.infer<typeof createHookSchema>;
export type UpdateHookInput = z.infer<typeof updateHookSchema>;
