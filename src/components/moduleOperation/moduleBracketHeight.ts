/** 跨页括号高度：首槽顶 → 末槽底的屏幕跨度（自然含页内 padding 与页面间距） */
export function moduleBracketHeightFromSpanCssPx(
  firstTop: number,
  lastBottom: number,
  canvasScale: number,
): number {
  const s =
    canvasScale > 0 && Number.isFinite(canvasScale) ? canvasScale : 1;
  return Math.max(0, (lastBottom - firstTop) / s);
}
