import { z } from 'zod';
import { LedgerLineType } from '@prisma/client';

export const CreateLedgerLineSchema = z.object({
  reservationId: z.string().uuid(),
  folioId: z.string().uuid(),
  lineType: z.nativeEnum(LedgerLineType),
  amountCents: z.number().int().min(1),
  currency: z.string().length(3).default('USD'),
  description: z.string().min(1).max(500),
  idempotencyKey: z.string().uuid(),
});

export const FolioQuerySchema = z.object({
  folioId: z.string().uuid(),
});

export const FolioStatementQuerySchema = z.object({
  folioId: z.string().uuid(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateLedgerLineInput = z.infer<typeof CreateLedgerLineSchema>;
export type FolioStatementInput = z.infer<typeof FolioStatementQuerySchema>;
