import type { GlobalStyle } from '@/modules/utils/common.type';
import { MAX_HEADER_TYPE } from './headerTypeBounds';

export function normHeaderType(gs: GlobalStyle): number {
  const n = Number(gs.headerType);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(MAX_HEADER_TYPE, Math.floor(n));
}
