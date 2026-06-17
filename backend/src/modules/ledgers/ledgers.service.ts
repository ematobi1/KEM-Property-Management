import { Prisma } from '@prisma/client';
import { prisma } from '../../db/client';
import { NotFoundError } from '../../shared/errors/AppError';
import { assertTenantOwnership } from '../../middleware/tenantGuard';
import { CreateLedgerLineInput, FolioStatementInput } from './ledgers.schema';

export async function createLedgerLine(propertyId: string, userId: string, input: CreateLedgerLineInput) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: input.reservationId },
    select: { propertyId: true },
  });
  if (!reservation) throw new NotFoundError('Reservation');
  assertTenantOwnership(propertyId, reservation.propertyId);

  try {
    return await prisma.financialLedgerLine.create({
      data: {
        propertyId,
        reservationId: input.reservationId,
        folioId: input.folioId,
        lineType: input.lineType,
        amountCents: input.amountCents,
        currency: input.currency,
        description: input.description,
        postedById: userId,
        idempotencyKey: input.idempotencyKey,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const existing = await prisma.financialLedgerLine.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) {
        assertTenantOwnership(propertyId, existing.propertyId);
        return existing;
      }
    }
    throw err;
  }
}

type BalanceRow = { balance_cents: bigint; currency: string; line_count: bigint };

export async function getFolioBalance(propertyId: string, folioId: string) {
  const rows = await prisma.$queryRaw<BalanceRow[]>`
    SELECT
      COALESCE(SUM(
        CASE WHEN line_type IN ('CHARGE', 'ADJUSTMENT')
          THEN amount_cents
          ELSE -amount_cents
        END
      ), 0) AS balance_cents,
      COALESCE(MAX(currency), 'USD') AS currency,
      COUNT(*) AS line_count
    FROM financial_ledger_lines
    WHERE property_id = ${propertyId}::uuid
      AND folio_id = ${folioId}
  `;

  const row = rows[0];
  return {
    folioId,
    balanceCents: Number(row?.balance_cents ?? 0),
    currency: row?.currency ?? 'USD',
    lineCount: Number(row?.line_count ?? 0),
  };
}

export async function getFolioStatement(propertyId: string, input: FolioStatementInput) {
  const where: Prisma.FinancialLedgerLineWhereInput = {
    propertyId,
    folioId: input.folioId,
  };

  if (input.startDate || input.endDate) {
    where.createdAt = {
      ...(input.startDate && { gte: new Date(input.startDate) }),
      ...(input.endDate && { lte: new Date(input.endDate) }),
    };
  }

  const lines = await prisma.financialLedgerLine.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  const balanceCents = lines.reduce((sum, line) => {
    return line.lineType === 'CHARGE' || line.lineType === 'ADJUSTMENT'
      ? sum + line.amountCents
      : sum - line.amountCents;
  }, 0);

  return {
    folioId: input.folioId,
    lines,
    balanceCents,
    currency: lines[0]?.currency ?? 'USD',
  };
}
