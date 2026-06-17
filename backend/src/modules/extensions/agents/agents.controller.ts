import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../shared/types';
import { paginationSchema } from '../../../shared/utils/pagination';
import { createAgentSchema, updateAgentSchema, assignSkillSchema } from './agents.schema';
import { listAgents, getAgent, createAgent, updateAgent, deleteAgent, assignSkillToAgent, removeSkillFromAgent } from './agents.service';

export async function handleList(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    res.status(200).json(await listAgents(req.user.propertyId, page, limit));
  } catch (err) { next(err); }
}

export async function handleGet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json({ data: await getAgent(req.user.propertyId, req.params['id']!) });
  } catch (err) { next(err); }
}

export async function handleCreate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = createAgentSchema.parse(req.body);
    res.status(201).json({ data: await createAgent(req.user.propertyId, input) });
  } catch (err) { next(err); }
}

export async function handleUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = updateAgentSchema.parse(req.body);
    res.status(200).json({ data: await updateAgent(req.user.propertyId, req.params['id']!, input) });
  } catch (err) { next(err); }
}

export async function handleDelete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteAgent(req.user.propertyId, req.params['id']!);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function handleAssignSkill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { skillId } = assignSkillSchema.parse(req.body);
    const result = await assignSkillToAgent(req.user.propertyId, req.params['id']!, skillId);
    res.status(200).json({ data: result });
  } catch (err) { next(err); }
}

export async function handleRemoveSkill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await removeSkillFromAgent(req.user.propertyId, req.params['id']!, req.params['skillId']!);
    res.status(204).send();
  } catch (err) { next(err); }
}
