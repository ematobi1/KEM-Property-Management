import { Response } from 'express';
import { z } from 'zod';
import { ValidationError } from '../../shared/errors/AppError';
import { AuthenticatedRequest } from '../../shared/types';
import { getAllocationLog, getPendingAllocations } from './allocations.service';

const logQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function handleGetAllocationLog(req: AuthenticatedRequest, res: Response) {
  const parsed = logQuerySchema.safeParse(req.query);
  if (!parsed.success) throw new ValidationError(parsed.error.flatten().fieldErrors);
  const { propertyId } = req.user;
  const { startDate, endDate } = parsed.data;
  const logs = await getAllocationLog(propertyId, startDate, endDate);
  res.json({ data: logs, meta: { total: logs.length } });
}

export async function handleGetPendingAllocations(req: AuthenticatedRequest, res: Response) {
  const { propertyId } = req.user;
  const pending = await getPendingAllocations(propertyId);
  res.json({ data: pending });
}
