import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../shared/types';
import { paginationSchema } from '../../../shared/utils/pagination';
import { createSkillSchema, updateSkillSchema } from './skills.schema';
import { listSkills, getSkill, createSkill, updateSkill, deleteSkill } from './skills.service';

export async function handleList(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    res.status(200).json(await listSkills(req.user.propertyId, page, limit));
  } catch (err) { next(err); }
}

export async function handleGet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ data: await getSkill(req.user.propertyId, req.params['id']!) });
  } catch (err) { next(err); }
}

export async function handleCreate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createSkillSchema.parse(req.body);
    res.status(201).json({ data: await createSkill(req.user.propertyId, input) });
  } catch (err) { next(err); }
}

export async function handleUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateSkillSchema.parse(req.body);
    res.status(200).json({ data: await updateSkill(req.user.propertyId, req.params['id']!, input) });
  } catch (err) { next(err); }
}

export async function handleDelete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteSkill(req.user.propertyId, req.params['id']!);
    res.status(204).send();
  } catch (err) { next(err); }
}
