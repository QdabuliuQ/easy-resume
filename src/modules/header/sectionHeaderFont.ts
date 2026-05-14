import type { GlobalStyle } from '@/modules/utils/common.type';

export function sectionHeaderFontSizeNum(gs: GlobalStyle): number {
  const fsRaw = Number(gs.fontSize);
  return Number.isFinite(fsRaw) && fsRaw > 0 ? fsRaw : 13;
}

export function sectionHeaderFontSizeCss(gs: GlobalStyle): string {
  return `${sectionHeaderFontSizeNum(gs)}px`;
}
