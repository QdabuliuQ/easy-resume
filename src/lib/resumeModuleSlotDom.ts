import { RESUME_MODULE_ID_ATTR } from '@/components/moduleOperation/constants';

export type ClientRectBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type SizeBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** 续页时模块外包一层 translateY，槽位是其外层 */
export function moduleSlotEl(root: HTMLElement): HTMLElement {
  const p = root.parentElement;
  if (!p) return root;
  if (p.style.transform.includes('translateY')) return p.parentElement ?? p;
  return p;
}

export function intersectClientRects(a: ClientRectBox, b: ClientRectBox): ClientRectBox & SizeBox {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.right, b.right);
  const bottom = Math.min(a.bottom, b.bottom);
  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

export function unionClientRects(rects: ClientRectBox[]): (ClientRectBox & SizeBox) | null {
  if (!rects.length) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const r of rects) {
    left = Math.min(left, r.left);
    top = Math.min(top, r.top);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  }
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

function toBox(r: DOMRect): ClientRectBox {
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
}

/**
 * 快捷选中框：同一 data-item-id 在各分页槽位内的可见并集。
 * 跨页时 first.top→last.bottom 自然含页边距与页面间距。
 */
export function visibleSelectableUnionRect(
  stageEl: HTMLElement,
  targetEl: HTMLElement,
): SizeBox | null {
  const itemId = targetEl.getAttribute('data-item-id')?.trim();
  const candidates = itemId
    ? (Array.from(
        stageEl.querySelectorAll(`[data-item-id="${CSS.escape(itemId)}"]`),
      ) as HTMLElement[])
    : [targetEl];

  const clipped: ClientRectBox[] = [];
  for (const el of candidates) {
    if (!stageEl.contains(el)) continue;
    const moduleRoot = el.closest(`[${RESUME_MODULE_ID_ATTR}]`);
    const slot = moduleRoot instanceof HTMLElement ? moduleSlotEl(moduleRoot) : el;
    const inter = intersectClientRects(toBox(el.getBoundingClientRect()), toBox(slot.getBoundingClientRect()));
    if (inter.width > 0.5 && inter.height > 0.5) clipped.push(inter);
  }

  const uni = unionClientRects(clipped);
  if (!uni || uni.width <= 0 || uni.height <= 0) return null;
  return { left: uni.left, top: uni.top, width: uni.width, height: uni.height };
}
