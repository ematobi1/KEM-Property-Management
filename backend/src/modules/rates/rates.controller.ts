import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
import {
  createRatePlan,
  updateRatePlan,
  listRatePlans,
  getBestAvailableRate,
  recalculateRatesForProperty,
} from './rates.service';
import { CreateRatePlanSchema, UpdateRatePlanSchema, GetBARSchema } from './rates.schema';

export async function handleCreateRatePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = CreateRatePlanSchema.parse(req.body);
    const plan = await createRatePlan(req.user.propertyId, input);
    res.status(201).json({ data: plan });
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateRatePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = UpdateRatePlanSchema.parse(req.body);
    const plan = await updateRatePlan(req.user.propertyId, req.params['planId']!, input);
    res.status(200).json({ data: plan });
  } catch (err) {
    next(err);
  }
}

export async function handleGetRatePlans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const plans = await listRatePlans(req.user.propertyId);
    res.status(200).json({ data: plans });
  } catch (err) {
    next(err);
  }
}

export async function handleGetBestAvailableRate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = GetBARSchema.parse(req.query);
    const bar = await getBestAvailableRate(req.user.propertyId, input.roomType, input.date);
    res.status(200).json({ data: bar });
  } catch (err) {
    next(err);
  }
}

export async function handleTriggerRateRecalculation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await recalculateRatesForProperty(req.user.propertyId);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}
