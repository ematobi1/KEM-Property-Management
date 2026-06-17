import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
import {
  listRooms,
  transitionRoomStatus,
  setStatusIndicators,
  overrideAvailability,
} from './housekeeping.service';
import {
  roomFilterSchema,
  statusTransitionSchema,
  roomStatusIndicatorSchema,
  availabilityOverrideSchema,
} from './housekeeping.schema';

export async function handleListRooms(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = roomFilterSchema.parse(req.query);
    const result = await listRooms(req.user.propertyId, input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleTransitionStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { housekeepingStatus } = statusTransitionSchema.parse(req.body);
    const room = await transitionRoomStatus(req.user.propertyId, req.params['roomNumber']!, housekeepingStatus);
    res.status(200).json({ data: room });
  } catch (err) {
    next(err);
  }
}

export async function handleSetIndicators(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { indicators } = roomStatusIndicatorSchema.parse(req.body);
    const room = await setStatusIndicators(req.user.propertyId, req.params['roomNumber']!, indicators);
    res.status(200).json({ data: room });
  } catch (err) {
    next(err);
  }
}

export async function handleOverrideAvailability(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { availabilityStatus } = availabilityOverrideSchema.parse(req.body);
    const room = await overrideAvailability(req.user.propertyId, req.params['roomNumber']!, availabilityStatus);
    res.status(200).json({ data: room });
  } catch (err) {
    next(err);
  }
}
