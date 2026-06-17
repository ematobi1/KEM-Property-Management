import { apiRequest } from './client';
import type { CreateLedgerLineInput, FolioBalance, FolioStatement, LedgerLine } from './types';

export function postLedgerLine(data: CreateLedgerLineInput): Promise<LedgerLine> {
  return apiRequest('POST', '/ledgers/lines', data);
}

export function getFolioBalance(folioId: string): Promise<FolioBalance> {
  return apiRequest('GET', `/ledgers/folios/${folioId}/balance`);
}

export function getFolioStatement(
  folioId: string,
  startDate?: string,
  endDate?: string,
): Promise<FolioStatement> {
  return apiRequest('GET', `/ledgers/folios/${folioId}/statement`, undefined, {
    startDate,
    endDate,
  });
}
