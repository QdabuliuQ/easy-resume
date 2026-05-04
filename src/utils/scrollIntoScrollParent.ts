/**
 * 将元素滚入最近的、实际可垂直滚动的祖先容器。
 * 用于避开含 `transform` 时原生 `scrollIntoView` 行为不稳定的问题。
 */
export function findVerticalScrollParent(el: HTMLElement | null): HTMLElement | null {
  let p: HTMLElement | null = el?.parentElement ?? null;
  while (p) {
    const st = getComputedStyle(p);
    const oy = st.overflowY;
    if (oy === 'auto' || oy === 'scroll' || oy === 'overlay') {
      return p;
    }
    p = p.parentElement;
  }
  return null;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * 手动平滑滚动（部分环境下 `scrollTo({ behavior: 'smooth' })` 几乎无动效）
 */
function animateScrollTop(
  el: HTMLElement,
  to: number,
  durationMs: number,
  onDone?: () => void
) {
  const from = el.scrollTop;
  const delta = to - from;
  if (Math.abs(delta) < 0.5) {
    onDone?.();
    return;
  }
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / durationMs);
    const eased =
      t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    el.scrollTop = from + delta * eased;
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      el.scrollTop = to;
      onDone?.();
    }
  };
  requestAnimationFrame(step);
}

/**
 * 在滚动容器内把目标元素滚进可视区（类似 block: 'nearest'）。
 */
export function scrollElementIntoScrollParent(
  el: HTMLElement,
  behavior: ScrollBehavior = 'smooth'
) {
  const sp = findVerticalScrollParent(el);
  if (!sp) {
    el.scrollIntoView({ behavior, block: 'nearest', inline: 'nearest' });
    return;
  }

  const spRect = sp.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  const posTop = sp.scrollTop + elRect.top - spRect.top;
  const posBottom = posTop + elRect.height;
  const viewTop = sp.scrollTop;
  const viewBottom = viewTop + sp.clientHeight;

  let next = sp.scrollTop;
  if (posTop < viewTop) {
    next = posTop;
  } else if (posBottom > viewBottom) {
    next = posBottom - sp.clientHeight;
  }

  const maxScroll = Math.max(0, sp.scrollHeight - sp.clientHeight);
  next = Math.max(0, Math.min(next, maxScroll));

  if (Math.abs(next - sp.scrollTop) < 0.5) {
    return;
  }

  const useSmooth =
    behavior === 'smooth' && !prefersReducedMotion();

  if (useSmooth) {
    animateScrollTop(sp, next, 520);
  } else {
    sp.scrollTop = next;
  }
}
