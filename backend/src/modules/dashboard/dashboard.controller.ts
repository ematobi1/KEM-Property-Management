import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
import { UserRole } from '@prisma/client';
import {
  getDashboardMetrics,
  getDashboardMetricsFromViews,
  getMonthOverMonthComparison,
} from './dashboard.service';
import { refreshDashboardViews } from '../../shared/utils/materialized-views';
import { prisma } from '../../db/client';

const ADMIN_ROLES: UserRole[] = [UserRole.Admin];
const MANAGER_ROLES: UserRole[] = [UserRole.HousekeepingManager, UserRole.Admin];

export async function handleGetDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const metrics = await getDashboardMetrics(req.user.propertyId);
    res.status(200).json({ data: metrics });
  } catch (err) {
    next(err);
  }
}

export async function handleGetMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const metrics = await getDashboardMetricsFromViews(req.user.propertyId);
    res.status(200).json({ data: metrics });
  } catch (err) {
    next(err);
  }
}

export async function handleGetMomComparison(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!MANAGER_ROLES.includes(req.user.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Manager or Admin role required' } });
      return;
    }
    const comparison = await getMonthOverMonthComparison(req.user.propertyId);
    res.status(200).json({ data: comparison });
  } catch (err) {
    next(err);
  }
}

export async function handleManualRefresh(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Admin role required' } });
      return;
    }
    await refreshDashboardViews(prisma);
    res.status(200).json({ data: { refreshed: true, timestamp: new Date().toISOString() } });
  } catch (err) {
    next(err);
  }
}
