import { Response, NextFunction } from 'express';
import { ForbiddenError } from '../shared/errors/AppError';
import { AuthenticatedRequest } from '../shared/types';

/**
 * Verifies the :propertyId URL param matches the authenticated session's property.
 * Must be mounted after `authenticate` on routes that expose a propertyId param.
 */
export function tenantGuard(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const paramPropertyId = req.params['propertyId'];
  if (paramPropertyId && paramPropertyId !== req.user.propertyId) {
    return next(new ForbiddenError('Cross-tenant access denied'));
  }
  next();
}

/**
 * Runtime check used inside service layer to assert caller owns the resource.
 * Throws ForbiddenError if the resource belongs to a different property.
 */
export function assertTenantOwnership(sessionPropertyId: string, resourcePropertyId: string): void {
  if (sessionPropertyId !== resourcePropertyId) {
    throw new ForbiddenError('Cross-tenant access denied');
  }
}
