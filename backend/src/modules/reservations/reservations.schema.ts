import { z } from 'zod';
import { LoyaltyTier, ReservationStatus, DepositStatus } from '@prisma/client';

export const createReservationSchema = z.object({
  guestFirstName: z.string().min(1).max(100),
  guestLastName: z.string().min(1).max(100),
  roomNumber: z.string().optional(),
  checkInDate: z.string().date(),
  checkOutDate: z.string().date(),
  loyaltyTier: z.nativeEnum(LoyaltyTier).default(LoyaltyTier.None),
  earlyCheckInEligible: z.boolean().default(false),
  lateCheckOutEligible: z.boolean().default(false),
  depositStatus: z.nativeEnum(DepositStatus).default(DepositStatus.Pending),
});

export const updateReservationSchema = createReservationSchema.partial();

export const reservationSearchSchema = z.object({
  query: z.string().max(200).optional(),
  status: z.nativeEnum(ReservationStatus).optional(),
  loyaltyTier: z.nativeEnum(LoyaltyTier).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
});

export const confirmAllocationSchema = z.object({
  allocationLogId: z.string().uuid(),
});

export const overrideAllocationSchema = z.object({
  newRoomNumber: z.string().min(1).max(20),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type ReservationSearchInput = z.infer<typeof reservationSearchSchema>;
export type ConfirmAllocationInput = z.infer<typeof confirmAllocationSchema>;
export type OverrideAllocationInput = z.infer<typeof overrideAllocationSchema>;
