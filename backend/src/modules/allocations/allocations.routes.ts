import { Router, RequestHandler } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { requireRole, Roles } from '../../middleware/rbac';
import { handleGetAllocationLog, handleGetPendingAllocations } from './allocations.controller';

const router = Router();

const auth = authenticate as RequestHandler;
const frontDesk = requireRole(...Roles.frontDesk) as RequestHandler;
const manager = requireRole(UserRole.HousekeepingManager, UserRole.Admin) as RequestHandler;

router.get('/log', auth, manager, handleGetAllocationLog as unknown as RequestHandler);
router.get('/pending', auth, frontDesk, handleGetPendingAllocations as unknown as RequestHandler);

export default router;
