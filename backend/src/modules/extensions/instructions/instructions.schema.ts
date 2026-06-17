import { z } from 'zod';

export const createInstructionSchema = z.object({
  name: z.string().min(1).max(100),
  agentId: z.string().uuid().optional(),
  blueprint: z.record(z.unknown()),
});

export const updateInstructionSchema = createInstructionSchema.partial();

export type CreateInstructionInput = z.infer<typeof createInstructionSchema>;
export type UpdateInstructionInput = z.infer<typeof updateInstructionSchema>;
