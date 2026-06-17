import { prisma } from '../../../db/client';
import { NotFoundError, ConflictError } from '../../../shared/errors/AppError';
import { assertTenantOwnership } from '../../../middleware/tenantGuard';
import { CreateInstructionInput, UpdateInstructionInput } from './instructions.schema';
import { paginate, paginationArgs } from '../../../shared/utils/pagination';

export async function listInstructions(propertyId: string, page: number, limit: number) {
  const where = { propertyId };
  const { skip, take } = paginationArgs(page, limit);
  const [rows, total] = await prisma.$transaction([
    prisma.instruction.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.instruction.count({ where }),
  ]);
  return paginate(rows, total, page, limit);
}

export async function getInstruction(propertyId: string, id: string) {
  const instruction = await prisma.instruction.findUnique({ where: { id } });
  if (!instruction) throw new NotFoundError('Instruction');
  assertTenantOwnership(propertyId, instruction.propertyId);
  return instruction;
}

export async function createInstruction(propertyId: string, input: CreateInstructionInput) {
  const existing = await prisma.instruction.findUnique({ where: { name_propertyId: { name: input.name, propertyId } } });
  if (existing) throw new ConflictError(`Instruction '${input.name}' already exists for this property`);

  if (input.agentId) {
    const agent = await prisma.agent.findUnique({ where: { id: input.agentId }, select: { propertyId: true } });
    if (!agent) throw new NotFoundError('Agent');
    assertTenantOwnership(propertyId, agent.propertyId);
  }

  return prisma.instruction.create({
    data: { ...input, propertyId, blueprint: input.blueprint as object },
  });
}

export async function updateInstruction(propertyId: string, id: string, input: UpdateInstructionInput) {
  const instruction = await prisma.instruction.findUnique({ where: { id }, select: { propertyId: true } });
  if (!instruction) throw new NotFoundError('Instruction');
  assertTenantOwnership(propertyId, instruction.propertyId);
  const data: Record<string, unknown> = { ...input };
  if (input.blueprint) data['blueprint'] = input.blueprint as object;
  return prisma.instruction.update({ where: { id }, data });
}

export async function deleteInstruction(propertyId: string, id: string) {
  const instruction = await prisma.instruction.findUnique({ where: { id }, select: { propertyId: true } });
  if (!instruction) throw new NotFoundError('Instruction');
  assertTenantOwnership(propertyId, instruction.propertyId);
  await prisma.instruction.delete({ where: { id } });
}
