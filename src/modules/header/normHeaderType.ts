import type { GlobalStyle } from '@/modules/utils/common.type';

export function normHeaderType(gs: GlobalStyle): number {
  const n = Number(gs.headerType);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(11, Math.floor(n));
}
