import { z } from 'zod';
import { HousekeepingStatus, AvailabilityStatus, StatusIndicator } from '@prisma/client';

export const roomFilterSchema = z.object({
  zone: z.string().optional(),
  floor: z.string().optional(),
  building: z.string().optional(),
  roomType: z.string().optional(),
  housekeepingStatus: z.nativeEnum(HousekeepingStatus).optional(),
  availabilityStatus: z.nativeEnum(AvailabilityStatus).optional(),
  assigned: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const statusTransitionSchema = z.object({
  housekeepingStatus: z.nativeEnum(HousekeepingStatus),
});

export const roomStatusIndicatorSchema = z.object({
  indicators: z.array(z.nativeEnum(StatusIndicator)),
});

export const availabilityOverrideSchema = z.object({
  availabilityStatus: z.nativeEnum(AvailabilityStatus),
});

export type RoomFilterInput = z.infer<typeof roomFilterSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
