import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
import { listArrivals, checkIn, autoAssignRooms, printRegistrationCards } from './arrivals.service';
import { checkInSchema, autoAssignSchema } from './arrivals.schema';
import { paginationSchema } from '../../shared/utils/pagination';

export async function handleListArrivals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await listArrivals(req.user.propertyId, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleCheckIn(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = checkInSchema.parse(req.body);
    const result = await checkIn(req.user.propertyId, req.params['id']!, input);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleAutoAssign(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reservationIds } = autoAssignSchema.parse(req.body);
    const result = await autoAssignRooms(req.user.propertyId, reservationIds);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function handlePrintRegistrationCards(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reservationIds } = autoAssignSchema.parse(req.body);
    const result = await printRegistrationCards(req.user.propertyId, reservationIds);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}
