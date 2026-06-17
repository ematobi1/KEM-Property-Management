import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  propertyCode: z.string().length(5).toUpperCase(),
});

export type LoginInput = z.infer<typeof loginSchema>;
