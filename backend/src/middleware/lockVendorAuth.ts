import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { UnauthorizedError } from '../shared/errors/AppError';

export function lockVendorAuth(req: Request, _res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-lock-vendor-api-key'];
  if (typeof apiKey !== 'string' || apiKey !== config.LOCK_VENDOR_API_KEY) {
    return next(new UnauthorizedError('Invalid or missing lock vendor API key'));
  }
  next();
}
