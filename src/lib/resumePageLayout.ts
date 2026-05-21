import type { GlobalStyle } from '@/modules/utils/common.type';

export type ResumePageLayout = 'default' | 'line' | 'rounded' | 'leftCol' | 'rightCol';

/** 侧栏主题色宽度占页面比例（leftCol / rightCol，与 Page / PDF / 画布一致） */
export const RESUME_PAGE_SIDE_COL_WIDTH_RATIO = 0.3;

/** @deprecated 使用 RESUME_PAGE_SIDE_COL_WIDTH_RATIO */
export const RESUME_PAGE_LEFT_COL_WIDTH_RATIO = RESUME_PAGE_SIDE_COL_WIDTH_RATIO;

export const RESUME_PAGE_TOP_LINE_HEIGHT_PX = 3;
/** 首页顶部弧形色块占位高度（与 Page / PDF 一致） */
export const RESUME_PAGE_ROUNDED_BANNER_HEIGHT_PX = 78;

export function normResumePageLayout(v: unknown): ResumePageLayout {
  if (v === 'line') return 'line';
  if (v === 'rounded') return 'rounded';
  if (v === 'leftCol') return 'leftCol';
  if (v === 'rightCol') return 'rightCol';
  return 'default';
}

export function resumePageHasSideCol(layout: unknown): boolean {
  const l = normResumePageLayout(layout);
  return l === 'leftCol' || l === 'rightCol';
}

/** leftCol / rightCol 侧栏内 info1 文字色（预览 / PDF / 图片导出一致） */
export const RESUME_SIDE_COL_INFO1_TEXT_COLOR = '#fff';

export function resumeInfo1FieldTextColor(layout: unknown): string {
  return resumePageHasSideCol(layout) ? RESUME_SIDE_COL_INFO1_TEXT_COLOR : '#333';
}

export function resumeInfo1FieldSeparatorColor(layout: unknown): string {
  return resumePageHasSideCol(layout) ? RESUME_SIDE_COL_INFO1_TEXT_COLOR : '#999';
}

export function resumePageSideColInnerWidthCss(
  pageWidthCss: string,
  padding = 0,
): string {
  const pad = Number(padding ?? 0);
  return `calc(${pageWidthCss} * ${RESUME_PAGE_SIDE_COL_WIDTH_RATIO} - ${pad * 2}px)`;
}

export function resumePageContentInnerWidthCss(
  pageWidthCss: string,
  layout: unknown,
  padding = 0,
): string {
  const pad = Number(padding ?? 0);
  if (resumePageHasSideCol(layout)) {
    const content = 1 - RESUME_PAGE_SIDE_COL_WIDTH_RATIO;
    return `calc(${pageWidthCss} * ${content} - ${pad * 2}px)`;
  }
  return `calc(${pageWidthCss} - ${pad * 2}px)`;
}

export function resumePageTopLineHeightPx(layout: unknown): number {
  return normResumePageLayout(layout) === 'line' ? RESUME_PAGE_TOP_LINE_HEIGHT_PX : 0;
}

export function resumePageRoundedBannerHeightPx(
  layout: unknown,
  firstPage: boolean,
): number {
  if (!firstPage) return 0;
  return normResumePageLayout(layout) === 'rounded' ? RESUME_PAGE_ROUNDED_BANNER_HEIGHT_PX : 0;
}

/** 分页/版心可用高度仅扣页边距；line 顶栏与 rounded 弧带均为绝对定位，不占版心 */
export function resumePageInnerHeightDeductionPx(
  gs: Pick<GlobalStyle, 'padding' | 'layout'>,
  _pageIndex = 0,
): number {
  const pad = Number(gs.padding ?? 0);
  return pad * 2;
}
