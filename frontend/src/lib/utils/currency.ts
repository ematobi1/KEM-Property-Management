const SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function formatCents(amountCents: number, currency = 'USD'): string {
  const symbol = SYMBOLS[currency] ?? currency;
  const wholePart = Math.floor(Math.abs(amountCents) / 100);
  const centsPart = Math.abs(amountCents) % 100;
  const sign = amountCents < 0 ? '-' : '';
  return `${sign}${symbol}${wholePart}.${String(centsPart).padStart(2, '0')}`;
}
