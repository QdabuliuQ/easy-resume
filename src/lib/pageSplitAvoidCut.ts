export const PAGE_FIT_EPSILON_PX = 0.5;

export type PageSplitHit = { viewHeight: number; nextOffsetY: number };
export type PageSplitResolve = PageSplitHit | 'empty-page' | null;

/** header / 行盒被页缝切开时：本页收到 anchorTop，整块从下一页开始 */
export function resolveSplitAwayFromCut(
  anchorTop: number,
  anchorBottom: number,
  offsetY: number,
  visibleHeight: number,
): PageSplitResolve {
  const cutY = offsetY + visibleHeight;
  if (!(anchorTop < cutY && anchorBottom > cutY)) return null;
  const viewHeight = anchorTop - offsetY;
  if (viewHeight <= PAGE_FIT_EPSILON_PX) return 'empty-page';
  return { viewHeight, nextOffsetY: anchorTop };
}

/**
 * 正文行盒已按 top 升序。找第一个被切的 rect；
 * 若某 rect 整段在 cutY 下方则停止后续判断。
 */
export function pickSplitFromSortedBodyRects(
  rects: ReadonlyArray<{ top: number; bottom: number }>,
  offsetY: number,
  visibleHeight: number,
): PageSplitResolve {
  const cutY = offsetY + visibleHeight;
  for (const rect of rects) {
    if (rect.top > cutY && rect.bottom > cutY) break;
    const hit = resolveSplitAwayFromCut(rect.top, rect.bottom, offsetY, visibleHeight);
    if (hit) return hit;
  }
  return null;
}
