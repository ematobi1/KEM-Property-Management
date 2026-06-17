import { z } from 'zod';
import { AgentStatus } from '@prisma/client';

export const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(AgentStatus).default(AgentStatus.Active),
  config: z.record(z.unknown()).default({}),
});

export const updateAgentSchema = createAgentSchema.partial();

export const assignSkillSchema = z.object({
  skillId: z.string().uuid(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
