import { Router, RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireRole, Roles } from '../../middleware/rbac';
import { handleListDepartures, handleExpressCheckOut, handlePrintFolio } from './departures.controller';

const router = Router();

const auth = authenticate as RequestHandler;
const frontDesk = requireRole(...Roles.frontDesk) as RequestHandler;

router.get('/', auth, frontDesk, handleListDepartures as unknown as RequestHandler);
router.post('/:id/checkout', auth, frontDesk, handleExpressCheckOut as unknown as RequestHandler);
router.get('/:id/folio', auth, frontDesk, handlePrintFolio as unknown as RequestHandler);

export default router;
