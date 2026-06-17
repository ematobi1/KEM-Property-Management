import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole, Roles } from '../../middleware/rbac';
import {
  handleGetDashboard,
  handleGetMetrics,
  handleGetMomComparison,
  handleManualRefresh,
} from './dashboard.controller';

const router = Router();

const auth = authenticate as RequestHandler;
const anyRole = requireRole(...Roles.any) as RequestHandler;
const frontDesk = requireRole(...Roles.frontDesk) as RequestHandler;

router.get('/', auth, anyRole, handleGetDashboard as unknown as RequestHandler);
router.get('/metrics', auth, frontDesk, handleGetMetrics as unknown as RequestHandler);
router.get('/mom-comparison', auth, frontDesk, handleGetMomComparison as unknown as RequestHandler);
router.post('/refresh', auth, frontDesk, handleManualRefresh as unknown as RequestHandler);

export default router;
