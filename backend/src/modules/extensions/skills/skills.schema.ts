import { z } from 'zod';

export const createSkillSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  logic: z.record(z.unknown()).default({}),
});

export const updateSkillSchema = createSkillSchema.partial();

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
