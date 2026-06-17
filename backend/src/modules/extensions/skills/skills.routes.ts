import { Router, RequestHandler } from 'express';
import { authenticate } from '../../../middleware/authenticate';
import { requireRole, Roles } from '../../../middleware/rbac';
import { handleList, handleGet, handleCreate, handleUpdate, handleDelete } from './skills.controller';

const router = Router();
const auth = authenticate as RequestHandler;
const admin = requireRole(...Roles.admin) as RequestHandler;

router.get('/', auth, admin, handleList as unknown as RequestHandler);
router.get('/:id', auth, admin, handleGet as unknown as RequestHandler);
router.post('/', auth, admin, handleCreate as unknown as RequestHandler);
router.patch('/:id', auth, admin, handleUpdate as unknown as RequestHandler);
router.delete('/:id', auth, admin, handleDelete as unknown as RequestHandler);

export default router;
