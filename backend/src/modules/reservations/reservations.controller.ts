import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
import { UserRole } from '@prisma/client';
import {
  searchReservations,
  getReservationById,
  createReservation,
  updateReservation,
  confirmAllocation,
  overrideAllocation,
} from './reservations.service';
import {
  createReservationSchema,
  updateReservationSchema,
  reservationSearchSchema,
  confirmAllocationSchema,
  overrideAllocationSchema,
} from './reservations.schema';

const PRIVILEGED_ROLES: UserRole[] = [UserRole.Admin, UserRole.FrontDeskAgent];

export async function handleSearch(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = reservationSearchSchema.parse(req.query);
    const privileged = PRIVILEGED_ROLES.includes(req.user.role);
    const result = await searchReservations(req.user.propertyId, input, privileged);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleGetOne(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const privileged = PRIVILEGED_ROLES.includes(req.user.role);
    const reservation = await getReservationById(req.user.propertyId, req.params['id']!, privileged);
    res.status(200).json({ data: reservation });
  } catch (err) {
    next(err);
  }
}

export async function handleCreate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createReservationSchema.parse(req.body);
    const reservation = await createReservation(req.user.propertyId, input);
    res.status(201).json({ data: reservation });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateReservationSchema.parse(req.body);
    const reservation = await updateReservation(req.user.propertyId, req.params['id']!, input);
    res.status(200).json({ data: reservation });
  } catch (err) {
    next(err);
  }
}

export async function handleConfirmAllocation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { allocationLogId } = confirmAllocationSchema.parse(req.body);
    const reservation = await confirmAllocation(
      req.user.propertyId,
      req.params['id']!,
      allocationLogId,
      req.user.userId,
    );
    res.status(200).json({ data: reservation });
  } catch (err) {
    next(err);
  }
}

export async function handleOverrideAllocation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { newRoomNumber } = overrideAllocationSchema.parse(req.body);
    const reservation = await overrideAllocation(
      req.user.propertyId,
      req.params['id']!,
      newRoomNumber,
      req.user.userId,
    );
    res.status(200).json({ data: reservation });
  } catch (err) {
    next(err);
  }
}
