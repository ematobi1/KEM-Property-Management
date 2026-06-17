import { z } from 'zod';

export const checkInSchema = z.object({
  roomNumber: z.string().min(1),
});

export const autoAssignSchema = z.object({
  reservationIds: z.array(z.string().uuid()).min(1).max(50),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type AutoAssignInput = z.infer<typeof autoAssignSchema>;
