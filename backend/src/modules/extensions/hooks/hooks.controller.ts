import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../shared/types';
import { paginationSchema } from '../../../shared/utils/pagination';
import { createHookSchema, updateHookSchema } from './hooks.schema';
import { listHooks, getHook, createHook, updateHook, deleteHook } from './hooks.service';

export async function handleList(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    res.status(200).json(await listHooks(req.user.propertyId, page, limit));
  } catch (err) { next(err); }
}

export async function handleGet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ data: await getHook(req.user.propertyId, req.params['id']!) });
  } catch (err) { next(err); }
}

export async function handleCreate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createHookSchema.parse(req.body);
    res.status(201).json({ data: await createHook(req.user.propertyId, input) });
  } catch (err) { next(err); }
}

export async function handleUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateHookSchema.parse(req.body);
    res.status(200).json({ data: await updateHook(req.user.propertyId, req.params['id']!, input) });
  } catch (err) { next(err); }
}

export async function handleDelete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteHook(req.user.propertyId, req.params['id']!);
    res.status(204).send();
  } catch (err) { next(err); }
}
