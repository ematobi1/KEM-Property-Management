import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../shared/types';
import { paginationSchema } from '../../../shared/utils/pagination';
import { createInstructionSchema, updateInstructionSchema } from './instructions.schema';
import { listInstructions, getInstruction, createInstruction, updateInstruction, deleteInstruction } from './instructions.service';

export async function handleList(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    res.status(200).json(await listInstructions(req.user.propertyId, page, limit));
  } catch (err) { next(err); }
}

export async function handleGet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ data: await getInstruction(req.user.propertyId, req.params['id']!) });
  } catch (err) { next(err); }
}

export async function handleCreate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createInstructionSchema.parse(req.body);
    res.status(201).json({ data: await createInstruction(req.user.propertyId, input) });
  } catch (err) { next(err); }
}

export async function handleUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateInstructionSchema.parse(req.body);
    res.status(200).json({ data: await updateInstruction(req.user.propertyId, req.params['id']!, input) });
  } catch (err) { next(err); }
}

export async function handleDelete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteInstruction(req.user.propertyId, req.params['id']!);
    res.status(204).send();
  } catch (err) { next(err); }
}
