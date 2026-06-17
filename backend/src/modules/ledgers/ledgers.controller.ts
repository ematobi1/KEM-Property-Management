import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
import { createLedgerLine, getFolioBalance, getFolioStatement } from './ledgers.service';
import { CreateLedgerLineSchema, FolioQuerySchema, FolioStatementQuerySchema } from './ledgers.schema';

export async function handlePostLedgerLine(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = CreateLedgerLineSchema.parse(req.body);
    const line = await createLedgerLine(req.user.propertyId, req.user.userId, input);
    res.status(201).json({ data: line });
  } catch (err) {
    next(err);
  }
}

export async function handleGetFolioBalance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { folioId } = FolioQuerySchema.parse({ folioId: req.params['folioId'] });
    const balance = await getFolioBalance(req.user.propertyId, folioId);
    res.status(200).json({ data: balance });
  } catch (err) {
    next(err);
  }
}

export async function handleGetFolioStatement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = FolioStatementQuerySchema.parse({
      folioId: req.params['folioId'],
      ...req.query,
    });
    const statement = await getFolioStatement(req.user.propertyId, input);
    res.status(200).json({ data: statement });
  } catch (err) {
    next(err);
  }
}
