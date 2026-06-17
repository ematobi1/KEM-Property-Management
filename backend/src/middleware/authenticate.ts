import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../shared/errors/AppError';
import { AuthPayload, AuthenticatedRequest } from '../shared/types';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Bearer token required'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
