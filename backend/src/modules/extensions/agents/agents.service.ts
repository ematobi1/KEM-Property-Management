import { prisma } from '../../../db/client';
import { NotFoundError, ConflictError } from '../../../shared/errors/AppError';
import { assertTenantOwnership } from '../../../middleware/tenantGuard';
import { CreateAgentInput, UpdateAgentInput } from './agents.schema';
import { paginate, paginationArgs } from '../../../shared/utils/pagination';

export async function listAgents(propertyId: string, page: number, limit: number) {
  const where = { propertyId };
  const { skip, take } = paginationArgs(page, limit);
  const [rows, total] = await prisma.$transaction([
    prisma.agent.findMany({ where, skip, take, include: { agentSkills: { include: { skill: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.agent.count({ where }),
  ]);
  return paginate(rows, total, page, limit);
}

export async function getAgent(propertyId: string, id: string) {
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: { agentSkills: { include: { skill: true } }, instructions: true, hooks: true },
  });
  if (!agent) throw new NotFoundError('Agent');
  assertTenantOwnership(propertyId, agent.propertyId);
  return agent;
}

export async function createAgent(propertyId: string, input: CreateAgentInput) {
  const existing = await prisma.agent.findUnique({ where: { name_propertyId: { name: input.name, propertyId } } });
  if (existing) throw new ConflictError(`Agent '${input.name}' already exists for this property`);
  return prisma.agent.create({ data: { ...input, propertyId, config: input.config as object } });
}

export async function updateAgent(propertyId: string, id: string, input: UpdateAgentInput) {
  const agent = await prisma.agent.findUnique({ where: { id }, select: { propertyId: true } });
  if (!agent) throw new NotFoundError('Agent');
  assertTenantOwnership(propertyId, agent.propertyId);
  const data: Record<string, unknown> = { ...input };
  if (input.config) data['config'] = input.config as object;
  return prisma.agent.update({ where: { id }, data });
}

export async function deleteAgent(propertyId: string, id: string) {
  const agent = await prisma.agent.findUnique({ where: { id }, select: { propertyId: true } });
  if (!agent) throw new NotFoundError('Agent');
  assertTenantOwnership(propertyId, agent.propertyId);
  await prisma.agent.delete({ where: { id } });
}

export async function assignSkillToAgent(propertyId: string, agentId: string, skillId: string) {
  const [agent, skill] = await Promise.all([
    prisma.agent.findUnique({ where: { id: agentId }, select: { propertyId: true } }),
    prisma.skill.findUnique({ where: { id: skillId }, select: { propertyId: true } }),
  ]);

  if (!agent) throw new NotFoundError('Agent');
  if (!skill) throw new NotFoundError('Skill');
  assertTenantOwnership(propertyId, agent.propertyId);
  assertTenantOwnership(propertyId, skill.propertyId);

  return prisma.agentSkill.upsert({
    where: { agentId_skillId: { agentId, skillId } },
    create: { agentId, skillId },
    update: {},
  });
}

export async function removeSkillFromAgent(propertyId: string, agentId: string, skillId: string) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId }, select: { propertyId: true } });
  if (!agent) throw new NotFoundError('Agent');
  assertTenantOwnership(propertyId, agent.propertyId);
  await prisma.agentSkill.delete({ where: { agentId_skillId: { agentId, skillId } } });
}
