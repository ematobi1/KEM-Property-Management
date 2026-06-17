import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole, Roles } from '../../middleware/rbac';
import {
  handleListArrivals,
  handleCheckIn,
  handleAutoAssign,
  handlePrintRegistrationCards,
} from './arrivals.controller';

const router = Router();

const auth = authenticate as RequestHandler;
const frontDesk = requireRole(...Roles.frontDesk) as RequestHandler;

router.get('/', auth, frontDesk, handleListArrivals as unknown as RequestHandler);
router.post('/:id/checkin', auth, frontDesk, handleCheckIn as unknown as RequestHandler);
router.post('/auto-assign', auth, frontDesk, handleAutoAssign as unknown as RequestHandler);
router.post('/registration-cards', auth, frontDesk, handlePrintRegistrationCards as unknown as RequestHandler);

export default router;
