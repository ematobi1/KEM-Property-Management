import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole, Roles } from '../../middleware/rbac';
import {
  handleListRooms,
  handleTransitionStatus,
  handleSetIndicators,
  handleOverrideAvailability,
} from './housekeeping.controller';

const router = Router();

const auth = authenticate as RequestHandler;
const hkAny = requireRole(...Roles.housekeeping) as RequestHandler;
const hkMgr = requireRole(...Roles.housekeepingManager) as RequestHandler;

// All housekeeping staff can list and update room statuses
router.get('/rooms', auth, hkAny, handleListRooms as unknown as RequestHandler);
router.patch('/rooms/:roomNumber/status', auth, hkAny, handleTransitionStatus as unknown as RequestHandler);
router.patch('/rooms/:roomNumber/indicators', auth, hkAny, handleSetIndicators as unknown as RequestHandler);

// Only managers can override availability (Out of Order, etc.)
router.patch('/rooms/:roomNumber/availability', auth, hkMgr, handleOverrideAvailability as unknown as RequestHandler);

export default router;
