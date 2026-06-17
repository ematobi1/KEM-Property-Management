import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/types';
import { listDepartures, expressCheckOut, printProformaFolio } from './departures.service';
import { paginationSchema } from '../../shared/utils/pagination';

export async function handleListDepartures(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const result = await listDepartures(req.user.propertyId, page, limit);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleExpressCheckOut(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await expressCheckOut(req.user.propertyId, req.params['id']!);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function handlePrintFolio(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await printProformaFolio(req.user.propertyId, req.params['id']!);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}
