export type PopoverPlacement = 'below' | 'above';

export type PopoverPosition = {
  top: number;
  left: number;
  placement: PopoverPlacement;
  width: number;
};

export type AnchorHighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type ClipBox = { x: number; y: number; w: number; h: number };

const PAD = 8;

/** 高亮色块外扩：左右各 3px（总宽 +6），上下 0 */
export const HIGHLIGHT_OUTSET_X = 6;
export const HIGHLIGHT_OUTSET_Y = 0;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

function toClipBox(r: DOMRect | Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>): ClipBox {
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

function intersectBoxes(a: ClipBox, b: ClipBox): ClipBox | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x;
  const h = Math.min(a.y + a.h, b.y + b.h) - y;
  if (w <= 0 || h <= 0) return null;
  return { x, y, w, h };
}

function unionBoxes(a: ClipBox, b: ClipBox): ClipBox {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.w, b.x + b.w);
  const bottom = Math.max(a.y + a.h, b.y + b.h);
  return { x, y, w: right - x, h: bottom - y };
}

function isClippedOverflow(style: CSSStyleDeclaration): boolean {
  return (
    style.overflow !== 'visible' ||
    style.overflowX !== 'visible' ||
    style.overflowY !== 'visible'
  );
}

/** 页盒 ∩ 祖先 overflow 裁剪，对齐预览分页 overflow:hidden */
function visibleClip(el: Element, page: HTMLElement): ClipBox | null {
  let clip: ClipBox | null = toClipBox(page.getBoundingClientRect());
  let n: Element | null = el;
  while (n && clip) {
    const style = getComputedStyle(n);
    if (isClippedOverflow(style)) {
      clip = intersectBoxes(clip, toClipBox(n.getBoundingClientRect()));
    }
    if (n === page) break;
    n = n.parentElement;
  }
  return clip;
}

function clipBoxToHighlightRect(box: ClipBox, container: HTMLElement): AnchorHighlightRect {
  const cr = container.getBoundingClientRect();
  const halfX = HIGHLIGHT_OUTSET_X / 2;
  const halfY = HIGHLIGHT_OUTSET_Y / 2;
  return {
    top: box.y - cr.top + container.scrollTop - halfY,
    left: box.x - cr.left + container.scrollLeft - halfX,
    width: box.w + HIGHLIGHT_OUTSET_X,
    height: box.h + HIGHLIGHT_OUTSET_Y,
  };
}

function unionVisibleLineBoxes(el: HTMLElement, clip: ClipBox): ClipBox | null {
  const range = document.createRange();
  range.selectNodeContents(el);
  const lineRects = Array.from(range.getClientRects());
  const boxes = lineRects.length > 0 ? lineRects : [el.getBoundingClientRect()];
  let union: ClipBox | null = null;
  for (const rect of boxes) {
    if (rect.width <= 0 || rect.height <= 0) continue;
    const vis = intersectBoxes(toClipBox(rect), clip);
    if (!vis || vis.w < 1 || vis.h < 1) continue;
    union = union ? unionBoxes(union, vis) : vis;
  }
  return union;
}

function resolveCanvasPageEl(el: HTMLElement): HTMLElement | null {
  const canvasPage = el.closest('[data-resume-canvas-page]');
  if (canvasPage instanceof HTMLElement) return canvasPage;
  const exportPage = el.closest('[data-resume-export-page]');
  return exportPage instanceof HTMLElement ? exportPage : null;
}

function resolveHighlightSearchRoot(container: HTMLElement): HTMLElement | null {
  const snap = container.querySelector('[data-resume-canvas-snap]');
  return snap instanceof HTMLElement ? snap : null;
}

function highlightTargetsForAnchor(anchorEl: HTMLElement, container: HTMLElement): HTMLElement[] {
  const root = resolveHighlightSearchRoot(container);
  if (!root) return [anchorEl];
  const itemId = anchorEl.getAttribute('data-item-id')?.trim();
  if (!itemId) return [anchorEl];
  const matches = Array.from(
    root.querySelectorAll<HTMLElement>(`[data-item-id="${CSS.escape(itemId)}"]`),
  ).filter((el) => el.closest('[data-resume-canvas-page]'));
  return matches.length > 0 ? matches : [anchorEl];
}

function visibleFragmentBox(el: HTMLElement): ClipBox | null {
  const page = resolveCanvasPageEl(el);
  if (!page) return null;
  const clip = visibleClip(el, page);
  if (!clip) return null;
  return unionVisibleLineBoxes(el, clip);
}

/** 合并跨页各片段；中间页边距 + 页间距自然计入 union 高度 */
export function unionClipBoxes(boxes: ClipBox[]): ClipBox | null {
  let union: ClipBox | null = null;
  for (const box of boxes) {
    if (box.w < 1 || box.h < 1) continue;
    union = union ? unionBoxes(union, box) : box;
  }
  return union;
}

/** 跨分页字段：各页可见片段 union 成一块高亮（含页边距与页间距） */
export function computeAnchorHighlightRectFromElement(
  anchorEl: HTMLElement,
  container: HTMLElement,
): AnchorHighlightRect | null {
  const targets = highlightTargetsForAnchor(anchorEl, container);
  const anchorPart = visibleFragmentBox(anchorEl);
  const parts: ClipBox[] = [];
  for (const el of targets) {
    const part = visibleFragmentBox(el);
    if (part) parts.push(part);
  }
  const vertical = unionClipBoxes(parts);
  if (!vertical) {
    if (!anchorPart) return null;
    return clipBoxToHighlightRect(anchorPart, container);
  }
  const horiz = anchorPart ?? vertical;
  return clipBoxToHighlightRect(
    { x: horiz.x, y: vertical.y, w: horiz.w, h: vertical.h },
    container,
  );
}

/** 弹出层定位用 anchor：取当前页可见文本行盒，避免跨页/overflow 下 getBoundingClientRect 偏大 */
export function resolvePopoverAnchorRect(
  anchorEl: HTMLElement,
  container: HTMLElement,
): DOMRect {
  const part = visibleFragmentBox(anchorEl);
  if (part) return new DOMRect(part.x, part.y, part.w, part.h);
  return anchorEl.getBoundingClientRect();
}

/** 滚动容器内 absolute 坐标；用视口 rect 差值 + scroll，兼容 canvas scale */
export function computeAnchorHighlightRect(
  anchor: DOMRect,
  container: HTMLElement,
): AnchorHighlightRect {
  return clipBoxToHighlightRect(toClipBox(anchor), container);
}

export function computePopoverPosition(
  anchor: DOMRect,
  container: HTMLElement,
  popoverWidth: number,
  popoverHeight: number,
): PopoverPosition {
  const cr = container.getBoundingClientRect();
  const scrollTop = container.scrollTop;
  const scrollLeft = container.scrollLeft;
  const viewW = container.clientWidth;
  const viewH = container.clientHeight;
  const width = Math.min(popoverWidth, viewW - PAD * 2);
  const halfX = HIGHLIGHT_OUTSET_X / 2;
  const halfY = HIGHLIGHT_OUTSET_Y / 2;

  const anchorTop = anchor.top - cr.top + scrollTop;
  const anchorBottom = anchor.bottom - cr.top + scrollTop;
  const anchorLeft = anchor.left - cr.left + scrollLeft;
  const anchorRight = anchor.right - cr.left + scrollLeft;
  const highlightTop = anchorTop - halfY;
  const highlightBottom = anchorBottom + halfY;

  const availBelow = scrollTop + viewH - highlightBottom - PAD;
  const availAbove = highlightTop - scrollTop - PAD;
  const placeBelow = availBelow >= popoverHeight || availBelow >= availAbove;
  const placement: PopoverPlacement = placeBelow ? 'below' : 'above';

  let top = placeBelow ? highlightBottom + PAD : highlightTop - popoverHeight - PAD;
  let left = anchorLeft - halfX;

  const maxLeft = scrollLeft + viewW - width - PAD;
  if (left + width > scrollLeft + viewW - PAD) {
    left = anchorRight + halfX - width;
  }
  left = clamp(left, scrollLeft + PAD, maxLeft);

  const minTop = scrollTop + PAD;
  const maxTop = scrollTop + viewH - popoverHeight - PAD;
  if (maxTop >= minTop) {
    if (top > maxTop) top = highlightTop - popoverHeight - PAD;
    if (top < minTop) top = highlightBottom + PAD;
    top = clamp(top, minTop, maxTop);
  } else {
    top = minTop;
  }

  return { top, left, placement, width };
}
