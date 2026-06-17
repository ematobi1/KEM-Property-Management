import { Router, RequestHandler } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { requireRole, Roles } from '../../middleware/rbac';
import {
  handleCreateRatePlan,
  handleUpdateRatePlan,
  handleGetRatePlans,
  handleGetBestAvailableRate,
  handleTriggerRateRecalculation,
} from './rates.controller';

const router = Router();

const auth = authenticate as RequestHandler;
// No RevenueManager role exists — rate plan mutations are admin-level operations
const admin = requireRole(...Roles.admin) as RequestHandler;
// Front desk + housekeeping manager + admin can read rates
const rateReader = requireRole(
  UserRole.FrontDeskAgent,
  UserRole.HousekeepingManager,
  UserRole.Admin,
) as RequestHandler;

router.post('/plans', auth, admin, handleCreateRatePlan as unknown as RequestHandler);
router.patch('/plans/:planId', auth, admin, handleUpdateRatePlan as unknown as RequestHandler);
router.get('/plans', auth, rateReader, handleGetRatePlans as unknown as RequestHandler);
router.get('/bar', auth, rateReader, handleGetBestAvailableRate as unknown as RequestHandler);
router.post('/recalculate', auth, admin, handleTriggerRateRecalculation as unknown as RequestHandler);

export default router;
