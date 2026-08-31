/** 七牛 imageView2 缩略图 */
export function cdnThumbUrl(url: string, width: number): string {
  const trimmed = url.trim();
  if (!trimmed || width <= 0) return trimmed;
  const sep = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${sep}imageView2/2/w/${Math.round(width)}/format/webp`;
}

/** 首页物理小卡显示宽 128；2x 屏用 256，避免发糊 */
export const HOME_LIST_THUMB_W = 256;
/**
 * 编辑侧栏 / 后台模板列表：卡片约 160CSS 宽，按 3x 取 480
 */
export const PANEL_LIST_THUMB_W = 480;
/**
 * 首页展开 / 后台大图预览固定宽（与视口无关），便于预取命中同一 URL。
 * ponytail: 不用 cardWidth*2，否则窗口宽度不同会冷启动 imageView2
 */
export const HOME_EXPAND_THUMB_W = 1400;

export function homeListThumbUrl(previewImage: string) {
  return cdnThumbUrl(previewImage, HOME_LIST_THUMB_W);
}

export function panelListThumbUrl(previewImage: string) {
  return cdnThumbUrl(previewImage, PANEL_LIST_THUMB_W);
}

export function homeExpandThumbUrl(previewImage: string) {
  return cdnThumbUrl(previewImage, HOME_EXPAND_THUMB_W);
}

const expandDone = new Set<string>();
const expandQueued = new Set<string>();
const expandQueue: string[] = [];
let expandActive = 0;
const EXPAND_MAX_CONCURRENT = 1;

function pumpExpandPrefetch() {
  while (expandActive < EXPAND_MAX_CONCURRENT && expandQueue.length) {
    const url = expandQueue.shift()!;
    expandActive += 1;
    const img = new Image();
    img.decoding = 'async';
    const finish = () => {
      expandActive -= 1;
      expandDone.add(url);
      pumpExpandPrefetch();
    };
    img.onload = finish;
    img.onerror = finish;
    img.src = homeExpandThumbUrl(url);
  }
}

/** 仅 hover / 即将展开时调用；全局串行 1 路，避免和列表缩略图抢带宽 */
export function prefetchHomeExpandThumb(previewImage: string) {
  if (typeof window === 'undefined') return;
  const url = previewImage.trim();
  if (!url || expandDone.has(url) || expandQueued.has(url)) return;
  expandQueued.add(url);
  expandQueue.push(url);
  pumpExpandPrefetch();
}
