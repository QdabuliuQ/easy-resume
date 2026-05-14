/** 与 sectionHeaderType11 圆点 `w-[9px] h-[9px]` 一致（画布 / PDF 共用） */
export const HEADER11_DOT_PX = 9;

export function header11DotPx(_fontSizePx?: number): number {
  return HEADER11_DOT_PX;
}

export function header11TitleRowMinHeightPx(fontSizeNum: number): number {
  const n = Number(fontSizeNum);
  const fs = Number.isFinite(n) && n > 0 ? n : 13;
  return Math.max(32, Math.round(fs * 2.1));
}
