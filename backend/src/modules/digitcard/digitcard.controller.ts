import { Request, Response, NextFunction } from 'express';
import { AppError, ForbiddenError } from '../../shared/errors/AppError';
import { AuthenticatedRequest } from '../../shared/types';
import { initiatePreArrivalCheckIn, issueAccessToken, verifyAccessToken } from './digitcard.service';
import { PreArrivalCheckInSchema, TokenIssueSchema, TokenVerifySchema } from './digitcard.schema';

export async function handlePreArrivalCheckIn(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = PreArrivalCheckInSchema.parse(req.body);
    const result = await initiatePreArrivalCheckIn(req.user.propertyId, input);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleIssueToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = TokenIssueSchema.parse(req.body);
    const result = await issueAccessToken(req.user.propertyId, input);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function handleVerifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = TokenVerifySchema.parse(req.body);
    const result = await verifyAccessToken(input.token, input.roomNumber);

    if (!result.valid) {
      if (result.reason === 'expired') {
        return next(new AppError(410, 'TOKEN_EXPIRED', 'Access token has expired — please request a new token'));
      }
      return next(new ForbiddenError(`Token verification failed: ${result.reason}`));
    }

    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}
