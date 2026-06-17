import { prisma } from '../../../db/client';
import { NotFoundError, ConflictError } from '../../../shared/errors/AppError';
import { assertTenantOwnership } from '../../../middleware/tenantGuard';
import { CreateSkillInput, UpdateSkillInput } from './skills.schema';
import { paginate, paginationArgs } from '../../../shared/utils/pagination';

export async function listSkills(propertyId: string, page: number, limit: number) {
  const where = { propertyId };
  const { skip, take } = paginationArgs(page, limit);
  const [rows, total] = await prisma.$transaction([
    prisma.skill.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.skill.count({ where }),
  ]);
  return paginate(rows, total, page, limit);
}

export async function getSkill(propertyId: string, id: string) {
  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) throw new NotFoundError('Skill');
  assertTenantOwnership(propertyId, skill.propertyId);
  return skill;
}

export async function createSkill(propertyId: string, input: CreateSkillInput) {
  const existing = await prisma.skill.findUnique({ where: { name_propertyId: { name: input.name, propertyId } } });
  if (existing) throw new ConflictError(`Skill '${input.name}' already exists for this property`);
  return prisma.skill.create({ data: { ...input, propertyId, logic: input.logic as object } });
}

export async function updateSkill(propertyId: string, id: string, input: UpdateSkillInput) {
  const skill = await prisma.skill.findUnique({ where: { id }, select: { propertyId: true } });
  if (!skill) throw new NotFoundError('Skill');
  assertTenantOwnership(propertyId, skill.propertyId);
  const data: Record<string, unknown> = { ...input };
  if (input.logic) data['logic'] = input.logic as object;
  return prisma.skill.update({ where: { id }, data });
}

export async function deleteSkill(propertyId: string, id: string) {
  const skill = await prisma.skill.findUnique({ where: { id }, select: { propertyId: true } });
  if (!skill) throw new NotFoundError('Skill');
  assertTenantOwnership(propertyId, skill.propertyId);
  await prisma.skill.delete({ where: { id } });
}
