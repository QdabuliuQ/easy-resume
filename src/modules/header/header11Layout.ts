import { SECTION_HEADER_ROW_HEIGHT_PX } from './sectionHeaderLayout';

/** 与 sectionHeaderType11 圆点 `w-[9px] h-[9px]` 一致（画布 / PDF 共用） */
export const HEADER11_DOT_PX = 9;


export function header11DotPx(): number {
  return HEADER11_DOT_PX;
}


export function header11TitleRowMinHeightPx(): number {
  return SECTION_HEADER_ROW_HEIGHT_PX;
}
