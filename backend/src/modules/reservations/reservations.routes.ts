import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole, Roles } from '../../middleware/rbac';
import {
  handleSearch,
  handleGetOne,
  handleCreate,
  handleUpdate,
  handleConfirmAllocation,
  handleOverrideAllocation,
} from './reservations.controller';

const router = Router();

const auth = authenticate as RequestHandler;
const frontDesk = requireRole(...Roles.frontDesk) as RequestHandler;
const anyRole = requireRole(...Roles.any) as RequestHandler;

router.get('/', auth, anyRole, handleSearch as unknown as RequestHandler);
router.get('/:id', auth, anyRole, handleGetOne as unknown as RequestHandler);
router.post('/', auth, frontDesk, handleCreate as unknown as RequestHandler);
router.patch('/:id', auth, frontDesk, handleUpdate as unknown as RequestHandler);
router.post('/:id/confirm-allocation', auth, frontDesk, handleConfirmAllocation as unknown as RequestHandler);
router.post('/:id/override-allocation', auth, frontDesk, handleOverrideAllocation as unknown as RequestHandler);

export default router;
