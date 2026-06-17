import { prisma } from '../../../db/client';
import { NotFoundError, ConflictError } from '../../../shared/errors/AppError';
import { assertTenantOwnership } from '../../../middleware/tenantGuard';
import { CreateHookInput, UpdateHookInput } from './hooks.schema';
import { paginate, paginationArgs } from '../../../shared/utils/pagination';

export async function listHooks(propertyId: string, page: number, limit: number) {
  const where = { propertyId };
  const { skip, take } = paginationArgs(page, limit);
  const [rows, total] = await prisma.$transaction([
    prisma.hook.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.hook.count({ where }),
  ]);
  return paginate(rows, total, page, limit);
}

export async function getHook(propertyId: string, id: string) {
  const hook = await prisma.hook.findUnique({ where: { id } });
  if (!hook) throw new NotFoundError('Hook');
  assertTenantOwnership(propertyId, hook.propertyId);
  return hook;
}

export async function createHook(propertyId: string, input: CreateHookInput) {
  const existing = await prisma.hook.findUnique({ where: { name_propertyId: { name: input.name, propertyId } } });
  if (existing) throw new ConflictError(`Hook '${input.name}' already exists for this property`);

  if (input.agentId) {
    const agent = await prisma.agent.findUnique({ where: { id: input.agentId }, select: { propertyId: true } });
    if (!agent) throw new NotFoundError('Agent');
    assertTenantOwnership(propertyId, agent.propertyId);
  }

  return prisma.hook.create({
    data: { ...input, propertyId, headers: input.headers as object },
  });
}

export async function updateHook(propertyId: string, id: string, input: UpdateHookInput) {
  const hook = await prisma.hook.findUnique({ where: { id }, select: { propertyId: true } });
  if (!hook) throw new NotFoundError('Hook');
  assertTenantOwnership(propertyId, hook.propertyId);
  const data: Record<string, unknown> = { ...input };
  if (input.headers) data['headers'] = input.headers as object;
  return prisma.hook.update({ where: { id }, data });
}

export async function deleteHook(propertyId: string, id: string) {
  const hook = await prisma.hook.findUnique({ where: { id }, select: { propertyId: true } });
  if (!hook) throw new NotFoundError('Hook');
  assertTenantOwnership(propertyId, hook.propertyId);
  await prisma.hook.delete({ where: { id } });
}

/**
 * Dispatches registered hooks for a lifecycle event.
 * Called internally by service layer after state mutations.
 * Fires asynchronously by default to avoid blocking the request.
 */
export async function dispatchHooks(propertyId: string, event: string, payload: Record<string, unknown>) {
  const hooks = await prisma.hook.findMany({
    where: { propertyId, event: event as never, isActive: true },
  });

  for (const hook of hooks) {
    const dispatch = () =>
      fetch(hook.url, {
        method: hook.method,
        headers: { 'Content-Type': 'application/json', ...(hook.headers as Record<string, string>) },
        body: JSON.stringify({ event, propertyId, payload, triggeredAt: new Date().toISOString() }),
        signal: AbortSignal.timeout(10_000),
      }).catch((err: Error) => {
        console.error(`Hook '${hook.name}' dispatch failed:`, err.message);
      });

    if (hook.isAsync) {
      void dispatch();
    } else {
      await dispatch();
    }
  }
}
