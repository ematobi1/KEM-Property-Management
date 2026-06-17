import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { ForbiddenError } from '../shared/errors/AppError';
import { AuthenticatedRequest } from '../shared/types';

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' is not authorized for this action`));
    }
    next();
  };
}

export const Roles = {
  frontDesk: [UserRole.FrontDeskAgent, UserRole.Admin] as UserRole[],
  housekeeping: [UserRole.HousekeepingStaff, UserRole.HousekeepingManager, UserRole.Admin] as UserRole[],
  housekeepingManager: [UserRole.HousekeepingManager, UserRole.Admin] as UserRole[],
  admin: [UserRole.Admin] as UserRole[],
  any: Object.values(UserRole),
};
