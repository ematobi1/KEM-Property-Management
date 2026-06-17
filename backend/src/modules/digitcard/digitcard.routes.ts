import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole, Roles } from '../../middleware/rbac';
import { lockVendorAuth } from '../../middleware/lockVendorAuth';
import { handlePreArrivalCheckIn, handleIssueToken, handleVerifyToken } from './digitcard.controller';

const router = Router();

const auth = authenticate as RequestHandler;
const frontDesk = requireRole(...Roles.frontDesk) as RequestHandler;

// PMS-authenticated routes (front desk registers/issues on behalf of guests)
router.post('/pre-arrival', auth, frontDesk, handlePreArrivalCheckIn as unknown as RequestHandler);
router.post('/token/issue', auth, frontDesk, handleIssueToken as unknown as RequestHandler);

// Lock vendor webhook — authenticated via X-Lock-Vendor-Api-Key header, not PMS JWT
router.post('/token/verify', lockVendorAuth as RequestHandler, handleVerifyToken as RequestHandler);

export default router;
