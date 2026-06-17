import { z } from 'zod';

export const PreArrivalCheckInSchema = z.object({
  reservationId: z.string().uuid(),
  deviceHardwareId: z.string().min(16).max(256),
  identityDocBase64: z.string().optional(),
});

export const TokenIssueSchema = z.object({
  reservationId: z.string().uuid(),
  deviceHardwareId: z.string().min(16).max(256),
});

export const TokenVerifySchema = z.object({
  token: z.string().min(1),
  roomNumber: z.string().min(1),
});

export type PreArrivalCheckInInput = z.infer<typeof PreArrivalCheckInSchema>;
export type TokenIssueInput = z.infer<typeof TokenIssueSchema>;
export type TokenVerifyInput = z.infer<typeof TokenVerifySchema>;
