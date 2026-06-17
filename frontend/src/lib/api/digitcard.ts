import { apiRequest } from './client';
import type { PreArrivalInput, PreArrivalResult, TokenIssueInput, TokenResult } from './types';

export function initiatePreArrival(data: PreArrivalInput): Promise<PreArrivalResult> {
  return apiRequest('POST', '/digitcard/pre-arrival', data);
}

export function issueToken(data: TokenIssueInput): Promise<TokenResult> {
  return apiRequest('POST', '/digitcard/token/issue', data);
}
