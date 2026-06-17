import { z } from 'zod';

const dayWeightsSchema = z.object({
  mon: z.number().default(1.0),
  tue: z.number().default(1.0),
  wed: z.number().default(1.0),
  thu: z.number().default(1.0),
  fri: z.number().default(1.0),
  sat: z.number().default(1.0),
  sun: z.number().default(1.0),
});

export const CreateRatePlanSchema = z.object({
  roomType: z.string().min(1),
  dateStart: z.string().datetime(),
  dateEnd: z.string().datetime(),
  baseRateCents: z.number().int().min(100),
  demandMultiplier: z.number().min(0.1).max(5.0).default(1.0),
  seasonalityFactor: z.number().min(0.1).max(5.0).default(1.0),
  dayOfWeekWeights: dayWeightsSchema.default({}),
});

export const UpdateRatePlanSchema = CreateRatePlanSchema.partial();

export const GetBARSchema = z.object({
  roomType: z.string().min(1),
  date: z.string().datetime(),
});

export const ComputeRateParamsSchema = z.object({
  roomType: z.string().min(1),
  date: z.string().datetime(),
  occupancyPercent: z.number().min(0).max(100).optional(),
});

export type CreateRatePlanInput = z.infer<typeof CreateRatePlanSchema>;
export type UpdateRatePlanInput = z.infer<typeof UpdateRatePlanSchema>;
export type GetBARInput = z.infer<typeof GetBARSchema>;
export type ComputeRateParamsInput = z.infer<typeof ComputeRateParamsSchema>;
