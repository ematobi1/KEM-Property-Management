import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole, Roles } from '../../middleware/rbac';
import { handlePostLedgerLine, handleGetFolioBalance, handleGetFolioStatement } from './ledgers.controller';

const router = Router();

const auth = authenticate as RequestHandler;
const frontDesk = requireRole(...Roles.frontDesk) as RequestHandler;

router.post('/lines', auth, frontDesk, handlePostLedgerLine as unknown as RequestHandler);
router.get('/folios/:folioId/balance', auth, frontDesk, handleGetFolioBalance as unknown as RequestHandler);
router.get('/folios/:folioId/statement', auth, frontDesk, handleGetFolioStatement as unknown as RequestHandler);

export default router;
