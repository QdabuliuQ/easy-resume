import {
  RESUME_H7_PANEL_ATTR,
  RESUME_HEADER_MARK_ATTR,
  RESUME_INFO1_ATTR,
  RESUME_INFO1_ROW_ATTR,
  RESUME_MODULE_HEADER_ATTR,
} from '@/components/moduleOperation/constants';
import {
  boxFullyInside,
  boxTopInsideClip,
  cssPseudoIsVisual,
  cssRichTextFlags,
  orRichTextFlags,
  tagRichTextFlags,
  flushToPageEdge,
  cssBorderRadiusPx,
  groupTextNodeIntoLineRuns,
  intersectBoxes,
  imageMimeFromSrc,
  normalizePdfHref,
  objectFitCrop,
  parseCssBeforeContent,
  parseCssColor,
  type ClipBox,
  type LineRect,
} from '@/lib/pdfkitExport/layout';
import { quillOrderedListMarker } from '@/lib/resumeSnapPrepare';
import type {
  PdfkitFillRun,
  PdfkitImageRun,
  PdfkitPage,
  PdfkitTextRun,
} from '@/lib/pdfkitExport/types';

const SKIP_CLOSEST = 'script,style,noscript,textarea';
const HEADER_SEL = `[${RESUME_MODULE_HEADER_ATTR}]`;
const HEADER_MARK_SEL = `[${RESUME_HEADER_MARK_ATTR}]`;
const INFO1_SEL = `[${RESUME_INFO1_ATTR}]`;
const INFO1_ROW_SEL = `[${RESUME_INFO1_ROW_ATTR}]`;
const SIDE_COL_SEL = '[data-resume-side-col]';
const H7_PANEL_SEL = `[${RESUME_H7_PANEL_ATTR}]`;
const ROUNDED_BANNER_SEL = '[data-resume-rounded-banner]';
const QL_UI_SEL = '.ql-ui';
const PSEUDO_ATTR = 'data-pdfkit-pseudo';
const HIDE_BEFORE = 'data-pdfkit-hide-before';
const HIDE_AFTER = 'data-pdfkit-hide-after';
const PSEUDO_HIDE_STYLE_ID = 'pdfkit-pseudo-hide';
/** snapdom 有限并发：太多会抢主线程，太少吃不满 */
const SNAP_CONCURRENCY = 3;
const PAGE_CONCURRENCY = 2;
/** 装饰截图像素倍率：1.5 比 2 明显更快，观感通常够用 */
export const PDFKIT_SNAP_SCALE = 1.5;
/** snap 边缘毛边约 2.5css px；按 scale 换成位图像素 */
const SNAP_BORDER_CSS_PX = 2.5;
/** 伪元素探针盒包含少量行盒顶部留白，DOCX 浮动图需要向上收紧。 */
const PSEUDO_IMAGE_Y_LIFT_PX = 3;

function snapBorderImgPx(scale: number): number {
  return Math.max(2, Math.round(SNAP_BORDER_CSS_PX * scale));
}

function boxesAlmostEqual(a: ClipBox, b: ClipBox, eps = 0.5): boolean {
  return (
    Math.abs(a.x - b.x) < eps &&
    Math.abs(a.y - b.y) < eps &&
    Math.abs(a.w - b.w) < eps &&
    Math.abs(a.h - b.h) < eps
  );
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!items.length) return [];
  const out = new Array<R>(items.length);
  let next = 0;
  const workers = Math.min(Math.max(1, limit), items.length);
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (next < items.length) {
        const i = next;
        next += 1;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

export type SnapElementOpts = {
  /** 伪元素探针有文字时才需要；装饰截图默认 false */
  embedFonts?: boolean;
};

export type SnapElementToDataUrl = (
  el: HTMLElement,
  opts?: SnapElementOpts,
) => Promise<string | null>;

export type CollectPdfkitOptions = {
  /** Word 等：装饰区（header/banner/h7）只出图，不采正文 run，避免叠两层 */
  skipDecorText?: boolean;
};

/** skipDecorText 时截图须带标题；PDF 默认藏字另画 run */
export function shouldBakeDecorText(opts?: CollectPdfkitOptions): boolean {
  return Boolean(opts?.skipDecorText);
}

function inSnapDecor(el: Element): boolean {
  return Boolean(
    el.closest(HEADER_SEL) || el.closest(H7_PANEL_SEL) || el.closest(ROUNDED_BANNER_SEL),
  );
}

function ancestorTextBox(el: HTMLElement): ClipBox | null {
  let n: HTMLElement | null = el;
  for (let i = 0; i < 5 && n; i += 1) {
    const r = n.getBoundingClientRect();
    if (r.width >= 1 && r.height >= 1) return toClipBox(r);
    n = n.parentElement;
  }
  return null;
}

function isHiddenStyle(style: CSSStyleDeclaration): boolean {
  if (style.display === 'none' || style.visibility === 'hidden') return true;
  const opacity = Number.parseFloat(style.opacity);
  return Number.isFinite(opacity) && opacity <= 0;
}

function rangeRects(
  range: Range,
  node: Text,
  start: number,
  endExclusive: number,
): LineRect[] {
  range.setStart(node, start);
  range.setEnd(node, endExclusive);
  const rects = range.getClientRects();
  const out: LineRect[] = [];
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    out.push({ top: r.top, left: r.left, width: r.width, height: r.height });
  }
  return out;
}

function relBox(r: DOMRect | ClipBox, pageRect: DOMRect): ClipBox {
  if ('left' in r) {
    return {
      x: r.left - pageRect.left,
      y: r.top - pageRect.top,
      w: r.width,
      h: r.height,
    };
  }
  return {
    x: r.x - pageRect.left,
    y: r.y - pageRect.top,
    w: r.w,
    h: r.h,
  };
}

function toClipBox(r: DOMRect): ClipBox {
  return { x: r.left, y: r.top, w: r.width, h: r.height };
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
    if (isClippedOverflow(style) && !(n instanceof HTMLElement && n.matches(H7_PANEL_SEL))) {
      clip = intersectBoxes(clip, toClipBox(n.getBoundingClientRect()));
    }
    if (n === page) break;
    n = n.parentElement;
  }
  return clip;
}

function keepFullyVisible(
  box: ClipBox,
  clip: ClipBox | null,
): boolean {
  return Boolean(clip && boxFullyInside(box, clip));
}

function keepTextVisible(
  box: ClipBox,
  clip: ClipBox | null,
): boolean {
  return Boolean(clip && boxTopInsideClip(box, clip));
}

function cssFontWeight(weight: string): number {
  const n = Number.parseInt(weight, 10);
  if (Number.isFinite(n)) return n;
  if (weight === 'bold' || weight === 'bolder') return 700;
  return 400;
}

function canvasFontString(style: CSSStyleDeclaration, fontWeight: number, fontSize: number) {
  const fontStyle = style.fontStyle && style.fontStyle !== 'normal' ? `${style.fontStyle} ` : '';
  const fontVariant = style.fontVariant && style.fontVariant !== 'normal' ? `${style.fontVariant} ` : '';
  const family = style.fontFamily || 'sans-serif';
  return `${fontStyle}${fontVariant}${fontWeight} ${fontSize}px ${family}`;
}

function measureTextInk(
  context: CanvasRenderingContext2D,
  text: string,
  style: CSSStyleDeclaration,
  fontWeight: number,
  fontSize: number,
): { width?: number; ascent?: number; descent?: number } {
  try {
    context.font = canvasFontString(style, fontWeight, fontSize);
    const metrics = context.measureText(text);
    const letterSpacing = style.letterSpacing === 'normal'
      ? 0
      : Number.parseFloat(style.letterSpacing) || 0;
    const width = metrics.width + Math.max(0, text.length - 1) * letterSpacing;
    const ascent = metrics.actualBoundingBoxAscent;
    const descent = metrics.actualBoundingBoxDescent;
    return {
      ...(Number.isFinite(width) && width > 0 ? { width } : {}),
      ...(Number.isFinite(ascent) && ascent > 0 ? { ascent } : {}),
      ...(Number.isFinite(descent) && descent >= 0 ? { descent } : {}),
    };
  } catch {
    return {};
  }
}

/** 向上找最重字重（info1.name 的 font-bold 在父级时也能采到） */
function resolveFontWeight(el: HTMLElement): number {
  let best = 400;
  let n: HTMLElement | null = el;
  for (let i = 0; i < 12 && n; i += 1) {
    best = Math.max(best, cssFontWeight(getComputedStyle(n).fontWeight));
    const tag = n.tagName;
    if (tag === 'B' || tag === 'STRONG') best = Math.max(best, 700);
    if (n.classList.contains('font-bold')) best = Math.max(best, 700);
    if (n.classList.contains('font-semibold')) best = Math.max(best, 600);
    if (n.classList.contains('ql-editor') || n.hasAttribute('data-resume-export-page')) {
      break;
    }
    n = n.parentElement;
  }
  return best;
}

function richTextFlagsFor(el: HTMLElement): {
  italic: boolean;
  underline: boolean;
  strike: boolean;
} {
  let flags = { italic: false, underline: false, strike: false };
  let n: HTMLElement | null = el;
  for (let i = 0; i < 12 && n; i += 1) {
    flags = orRichTextFlags(flags, tagRichTextFlags(n.tagName));
    flags = orRichTextFlags(flags, cssRichTextFlags(getComputedStyle(n)));
    if (n.classList.contains('ql-editor') || n.hasAttribute('data-resume-export-page')) {
      break;
    }
    n = n.parentElement;
  }
  return flags;
}

function resolveTextHref(el: HTMLElement): string | undefined {
  const a = el.closest('a');
  if (!(a instanceof HTMLAnchorElement)) return undefined;
  return normalizePdfHref(a.getAttribute('href') || a.href);
}

function imageToDataUrl(img: HTMLImageElement): string | null {
  try {
    const box = img.getBoundingClientRect();
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh || box.width < 1 || box.height < 1) return null;
    const scale = 2;
    const dw = Math.max(1, Math.round(box.width * scale));
    const dh = Math.max(1, Math.round(box.height * scale));
    const fit = getComputedStyle(img).objectFit || 'fill';
    const crop = objectFitCrop(nw, nh, dw, dh, fit);
    const mime = imageMimeFromSrc(img.currentSrc || img.src);
    const canvas = document.createElement('canvas');
    canvas.width = dw;
    canvas.height = dh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (mime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, dw, dh);
    }
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, dw, dh);
    return mime === 'image/png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.92);
  } catch {
    return null;
  }
}

function resolveQlUiBeforeText(el: HTMLElement, content: string): string | null {
  const literal = parseCssBeforeContent(content);
  if (literal != null && literal.length > 0) return literal;
  const li = el.closest('li');
  if (!(li instanceof HTMLElement)) return null;
  const kind = li.getAttribute('data-list');
  if (kind === 'bullet') return '•';
  if (kind === 'checked') return '☑';
  if (kind === 'unchecked') return '☐';
  if (kind === 'ordered') return quillOrderedListMarker(li);
  return null;
}

function waitFrame(): Promise<void> {
  return new Promise((r) => {
    requestAnimationFrame(() => r());
  });
}

async function decodeSnapImage(
  dataUrl: string,
): Promise<ImageBitmap | HTMLImageElement | null> {
  try {
    if (typeof createImageBitmap === 'function') {
      const blob = await (await fetch(dataUrl)).blob();
      return await createImageBitmap(blob);
    }
  } catch {
    // fall through
  }
  const img = new Image();
  img.src = dataUrl;
  try {
    await img.decode();
    return img;
  } catch {
    return null;
  }
}

function snapImageSize(img: ImageBitmap | HTMLImageElement): { w: number; h: number } {
  if ('naturalWidth' in img && img.naturalWidth > 0) {
    return { w: img.naturalWidth, h: img.naturalHeight };
  }
  return { w: img.width, h: img.height };
}

function closeSnapImage(img: ImageBitmap | HTMLImageElement) {
  if ('close' in img && typeof img.close === 'function') img.close();
}

async function encodeSnapCrop(
  img: ImageBitmap | HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    closeSnapImage(img);
    throw new Error('canvas');
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  closeSnapImage(img);
  return canvas.toDataURL('image/png');
}

/**
 * 单次解码/编码。无毛边且无需按可视框裁切时直接返回原 dataUrl。
 */
async function cropSnapPng(
  dataUrl: string,
  opts: {
    cssW: number;
    cssH: number;
    full?: ClipBox;
    vis?: ClipBox;
    trimBorder?: boolean;
  },
): Promise<string> {
  const scale = PDFKIT_SNAP_SCALE;
  const needVis =
    opts.full && opts.vis && !boxesAlmostEqual(opts.full, opts.vis) && opts.full.w >= 1;
  const border = opts.trimBorder && !needVis ? snapBorderImgPx(scale) : 0;
  if (!needVis && border <= 0) return dataUrl;

  const img = await decodeSnapImage(dataUrl);
  if (!img) return dataUrl;
  const { w: nw, h: nh } = snapImageSize(img);

  let sx = 0;
  let sy = 0;
  let sw = nw;
  let sh = nh;

  if (needVis && opts.full && opts.vis) {
    sx = ((opts.vis.x - opts.full.x) / opts.full.w) * nw;
    sy = ((opts.vis.y - opts.full.y) / opts.full.h) * nh;
    sw = (opts.vis.w / opts.full.w) * nw;
    sh = (opts.vis.h / opts.full.h) * nh;
  } else if (border > 0) {
    const ew = Math.ceil(opts.cssW * scale);
    const eh = Math.ceil(opts.cssH * scale);
    // 位图没有明显大于期望尺寸 → 无毛边，跳过裁切
    if (nw <= ew + 1 && nh <= eh + 1) {
      closeSnapImage(img);
      return dataUrl;
    }
    sx = border;
    sy = border;
    sw = nw - border * 2;
    sh = nh - border * 2;
  }

  if (sw < 8 || sh < 8) {
    closeSnapImage(img);
    return dataUrl;
  }
  if (sx <= 0.5 && sy <= 0.5 && sw >= nw - 0.5 && sh >= nh - 0.5) {
    closeSnapImage(img);
    return dataUrl;
  }
  try {
    return await encodeSnapCrop(img, sx, sy, sw, sh);
  } catch {
    return dataUrl;
  }
}

function ensurePseudoHideCss(doc: Document) {
  if (doc.getElementById(PSEUDO_HIDE_STYLE_ID)) return;
  const s = doc.createElement('style');
  s.id = PSEUDO_HIDE_STYLE_ID;
  s.textContent = `[${HIDE_BEFORE}]::before,[${HIDE_AFTER}]::after,[data-pdfkit-hide-pseudos]::before,[data-pdfkit-hide-pseudos]::after,[data-pdfkit-hide-pseudos] *::before,[data-pdfkit-hide-pseudos] *::after{content:none!important;display:none!important}`;
  doc.head.appendChild(s);
}

const SKIP_PSEUDO_PROPS = new Set([
  'content',
  'animation',
  'animation-name',
  'transition',
  'transition-property',
]);

function applyPseudoStyle(probe: HTMLElement, cs: CSSStyleDeclaration) {
  for (let i = 0; i < cs.length; i += 1) {
    const prop = cs.item(i);
    if (!prop || SKIP_PSEUDO_PROPS.has(prop)) continue;
    probe.style.setProperty(prop, cs.getPropertyValue(prop));
  }
}

function resolvePseudoText(
  el: HTMLElement,
  which: '::before' | '::after',
  cs: CSSStyleDeclaration,
): string {
  const parsed = parseCssBeforeContent(cs.content);
  if (parsed != null) return parsed;
  if (which === '::before' && el.classList.contains('ql-ui')) {
    return resolveQlUiBeforeText(el, cs.content) ?? '';
  }
  return '';
}

async function snapPseudo(
  el: HTMLElement,
  which: '::before' | '::after',
  page: HTMLElement,
  pageRect: DOMRect,
  snap: SnapElementToDataUrl,
  cs = getComputedStyle(el, which),
): Promise<PdfkitImageRun | null> {
  if (!cssPseudoIsVisual(cs)) return null;
  const hideAttr = which === '::before' ? HIDE_BEFORE : HIDE_AFTER;
  const probe = el.ownerDocument.createElement('span');
  probe.setAttribute(PSEUDO_ATTR, which);
  applyPseudoStyle(probe, cs);
  const text = resolvePseudoText(el, which, cs);
  probe.textContent = text;
  el.setAttribute(hideAttr, '');
  if (which === '::before') el.insertBefore(probe, el.firstChild);
  else el.appendChild(probe);
  try {
    await waitFrame();
    const r = probe.getBoundingClientRect();
    if (r.width < 0.5 && r.height < 0.5) return null;
    const clip = visibleClip(el, page);
    const box = toClipBox(r);
    if (!keepFullyVisible(box, clip) && !keepTextVisible(box, clip)) {
      return null;
    }
    const dataUrl = await snap(probe, { embedFonts: Boolean(text.trim()) });
    if (!dataUrl) return null;
    const placed = relBox(r, pageRect);
    return {
      ...placed,
      y: Math.max(0, placed.y - PSEUDO_IMAGE_Y_LIFT_PX),
      dataUrl,
    };
  } finally {
    probe.remove();
    el.removeAttribute(hideAttr);
  }
}

async function collectPseudoImages(
  page: HTMLElement,
  pageRect: DOMRect,
  snap: SnapElementToDataUrl,
): Promise<PdfkitImageRun[]> {
  ensurePseudoHideCss(page.ownerDocument);
  const targets: HTMLElement[] = [];
  const els = page.querySelectorAll<HTMLElement>('*');
  for (let i = 0; i < els.length; i += 1) {
    const el = els[i];
    if (
      el === page ||
      el.hasAttribute(PSEUDO_ATTR) ||
      el.closest(HEADER_SEL) ||
      el.closest(ROUNDED_BANNER_SEL)
    ) {
      continue;
    }
    if (isHiddenStyle(getComputedStyle(el))) continue;
    if (
      cssPseudoIsVisual(getComputedStyle(el, '::before')) ||
      cssPseudoIsVisual(getComputedStyle(el, '::after'))
    ) {
      targets.push(el);
    }
  }
  const groups = await mapLimit(targets, SNAP_CONCURRENCY, async (el) => {
    const out: PdfkitImageRun[] = [];
    const beforeCs = getComputedStyle(el, '::before');
    if (cssPseudoIsVisual(beforeCs)) {
      const before = await snapPseudo(el, '::before', page, pageRect, snap, beforeCs);
      if (before) out.push(before);
    }
    const afterCs = getComputedStyle(el, '::after');
    if (cssPseudoIsVisual(afterCs)) {
      const after = await snapPseudo(el, '::after', page, pageRect, snap, afterCs);
      if (after) out.push(after);
    }
    return out;
  });
  return groups.flat();
}

function hideTextKeepLayout(root: HTMLElement): () => void {
  const saved: Array<{
    el: HTMLElement;
    color: string;
    fill: string;
    shadow: string;
    stroke: string;
    opacity: string;
  }> = [];
  const seen = new Set<HTMLElement>();
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n = walker.nextNode();
  while (n) {
    if ((n.nodeValue ?? '').trim()) {
      const el = n.parentElement;
      if (el && !seen.has(el) && !el.closest(HEADER_MARK_SEL)) {
        seen.add(el);
        saved.push({
          el,
          color: el.style.getPropertyValue('color'),
          fill: el.style.getPropertyValue('-webkit-text-fill-color'),
          shadow: el.style.getPropertyValue('text-shadow'),
          stroke: el.style.getPropertyValue('-webkit-text-stroke'),
          opacity: el.style.getPropertyValue('opacity'),
        });
        // 透明字保留布局/色块；有背景时勿用 opacity:0，否则整块装饰一起消失
        el.style.setProperty('color', 'transparent', 'important');
        el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
        el.style.setProperty('text-shadow', 'none', 'important');
        el.style.setProperty('-webkit-text-stroke', '0', 'important');
        if (!parseCssColor(getComputedStyle(el).backgroundColor)) {
          el.style.setProperty('opacity', '0', 'important');
        }
      }
    }
    n = walker.nextNode();
  }
  return () => {
    for (const s of saved) {
      s.el.style.removeProperty('color');
      s.el.style.removeProperty('-webkit-text-fill-color');
      s.el.style.removeProperty('text-shadow');
      s.el.style.removeProperty('-webkit-text-stroke');
      s.el.style.removeProperty('opacity');
      if (s.color) s.el.style.setProperty('color', s.color);
      if (s.fill) s.el.style.setProperty('-webkit-text-fill-color', s.fill);
      if (s.shadow) s.el.style.setProperty('text-shadow', s.shadow);
      if (s.stroke) s.el.style.setProperty('-webkit-text-stroke', s.stroke);
      if (s.opacity) s.el.style.setProperty('opacity', s.opacity);
    }
  };
}

function collectFills(
  page: HTMLElement,
  pageRect: DOMRect,
  pageBg: string | null,
): PdfkitFillRun[] {
  const out: PdfkitFillRun[] = [];
  const els = page.querySelectorAll<HTMLElement>('*');
  for (let i = 0; i < els.length; i += 1) {
    const el = els[i];
    if (
      el === page ||
      el.hasAttribute(PSEUDO_ATTR) ||
      el.matches(SIDE_COL_SEL) ||
      el.closest(HEADER_SEL) ||
      el.closest(H7_PANEL_SEL) ||
      el.closest(ROUNDED_BANNER_SEL)
    ) {
      continue;
    }
    const style = getComputedStyle(el);
    if (isHiddenStyle(style)) continue;
    const color = parseCssColor(style.backgroundColor);
    if (!color || color === pageBg) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const clip = visibleClip(el, page);
    if (!clip) continue;
    const vis = intersectBoxes(toClipBox(r), clip);
    if (!vis || vis.w < 1 || vis.h < 1) continue;
    const box = flushToPageEdge(relBox(vis, pageRect), {
      x: 0,
      y: 0,
      w: pageRect.width,
      h: pageRect.height,
    });
    const radius = cssBorderRadiusPx(
      style.borderTopLeftRadius || style.borderRadius,
      box.w,
      box.h,
    );
    out.push(radius > 0 ? { ...box, color, radius } : { ...box, color });
  }
  return out;
}

/** 侧栏背景是布局级色块，单独采集可避免 flex 子树/裁剪规则让它丢失。 */
function collectSideColFills(page: HTMLElement, pageRect: DOMRect): PdfkitFillRun[] {
  const out: PdfkitFillRun[] = [];
  const els = page.querySelectorAll<HTMLElement>(SIDE_COL_SEL);
  for (let i = 0; i < els.length; i += 1) {
    const el = els[i];
    const style = getComputedStyle(el);
    if (isHiddenStyle(style)) continue;
    const color = parseCssColor(style.backgroundColor);
    if (!color) continue;
    const box = toClipBox(el.getBoundingClientRect());
    const clip = visibleClip(el, page);
    const visible = clip ? intersectBoxes(box, clip) : null;
    if (!visible || visible.w < 1 || visible.h < 1) continue;
    out.push({ ...relBox(visible, pageRect), color });
  }
  return out;
}

function collectImages(page: HTMLElement, pageRect: DOMRect): PdfkitImageRun[] {
  const out: PdfkitImageRun[] = [];
  const imgs = page.querySelectorAll('img');
  for (let i = 0; i < imgs.length; i += 1) {
    const img = imgs[i];
    if (!(img instanceof HTMLImageElement) || !img.naturalWidth) continue;
    if (inSnapDecor(img)) continue;
    if (isHiddenStyle(getComputedStyle(img))) continue;
    const r = img.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (!keepFullyVisible(toClipBox(r), visibleClip(img, page))) continue;
    const dataUrl = imageToDataUrl(img);
    if (!dataUrl) continue;
    out.push({ ...relBox(r, pageRect), dataUrl });
  }
  return out;
}

async function collectRoundedBanner(
  page: HTMLElement,
  pageRect: DOMRect,
  snapElement: SnapElementToDataUrl,
  bakeText?: boolean,
): Promise<{ images: PdfkitImageRun[]; fills: PdfkitFillRun[] }> {
  const candidates: HTMLElement[] = [];
  const banners = page.querySelectorAll<HTMLElement>(ROUNDED_BANNER_SEL);
  for (let i = 0; i < banners.length; i += 1) {
    const el = banners[i];
    if (isHiddenStyle(getComputedStyle(el))) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (!keepFullyVisible(toClipBox(r), visibleClip(el, page))) continue;
    candidates.push(el);
  }
  const parts = await mapLimit(candidates, SNAP_CONCURRENCY, async (el) => {
    const r = el.getBoundingClientRect();
    const raw = await snapElement(el, { embedFonts: Boolean(bakeText) });
    if (!raw) return null;
    const dataUrl = await cropSnapPng(raw, {
      cssW: r.width,
      cssH: r.height,
      trimBorder: true,
    });
    const placed = flushToPageEdge(relBox(r, pageRect), {
      x: 0,
      y: 0,
      w: pageRect.width,
      h: pageRect.height,
    });
    placed.x = 0;
    placed.y = 0;
    placed.w = pageRect.width;
    const images: PdfkitImageRun[] = [{ ...placed, dataUrl }];
    const fills: PdfkitFillRun[] = [];
    const inner = el.firstElementChild;
    const color =
      inner instanceof HTMLElement
        ? parseCssColor(getComputedStyle(inner).backgroundColor)
        : null;
    if (color) {
      const arcR = Math.max(12, Math.round(placed.h * 0.42));
      const straightH = Math.max(2, placed.h - arcR);
      fills.push({ x: 0, y: 0, w: placed.w, h: 3, color });
      fills.push({ x: 0, y: 0, w: 3, h: straightH, color });
      fills.push({ x: Math.max(0, placed.w - 3), y: 0, w: 3, h: straightH, color });
    }
    return { images, fills };
  });
  const images: PdfkitImageRun[] = [];
  const fills: PdfkitFillRun[] = [];
  for (const part of parts) {
    if (!part) continue;
    images.push(...part.images);
    fills.push(...part.fills);
  }
  return { images, fills };
}

async function collectSnapDecor(
  page: HTMLElement,
  pageRect: DOMRect,
  snapElement: SnapElementToDataUrl,
  selector: string,
  clipVisible: boolean,
  /** Word：装饰区不采文字 run，截图须带标题；PDF：藏字只截装饰，文字另画 */
  bakeText?: boolean,
): Promise<PdfkitImageRun[]> {
  ensurePseudoHideCss(page.ownerDocument);
  type Job = { el: HTMLElement; full: ClipBox; vis: ClipBox };
  const jobs: Job[] = [];
  const nodes = page.querySelectorAll<HTMLElement>(selector);
  for (let i = 0; i < nodes.length; i += 1) {
    const el = nodes[i];
    if (isHiddenStyle(getComputedStyle(el))) continue;
    const full = toClipBox(el.getBoundingClientRect());
    if (full.w < 1 || full.h < 1) continue;
    const clip = visibleClip(el, page);
    const vis = clip ? intersectBoxes(full, clip) : null;
    if (!vis || vis.w < 1 || vis.h < 1) continue;
    if (!clipVisible && !keepFullyVisible(full, clip)) continue;
    jobs.push({ el, full, vis });
  }
  const parts = await mapLimit(jobs, SNAP_CONCURRENCY, async ({ el, full, vis }) => {
    const restore = bakeText ? () => undefined : hideTextKeepLayout(el);
    // header 伪元素只靠本截图；面板伪元素另采，截图时关掉防叠两层
    if (selector !== HEADER_SEL) el.setAttribute('data-pdfkit-hide-pseudos', '');
    try {
      await waitFrame();
      const raw = await snapElement(el, { embedFonts: Boolean(bakeText) });
      if (!raw) return null;
      const dataUrl = clipVisible
        ? await cropSnapPng(raw, {
            cssW: full.w,
            cssH: full.h,
            full,
            vis,
          })
        : raw;
      return { ...relBox(vis, pageRect), dataUrl } satisfies PdfkitImageRun;
    } finally {
      el.removeAttribute('data-pdfkit-hide-pseudos');
      restore();
    }
  });
  return parts.filter((x): x is PdfkitImageRun => Boolean(x));
}

async function collectHeaderImages(
  page: HTMLElement,
  pageRect: DOMRect,
  snapElement: SnapElementToDataUrl,
  bakeText?: boolean,
): Promise<PdfkitImageRun[]> {
  return collectSnapDecor(page, pageRect, snapElement, HEADER_SEL, true, bakeText);
}

async function collectH7PanelImages(
  page: HTMLElement,
  pageRect: DOMRect,
  snapElement: SnapElementToDataUrl,
  bakeText?: boolean,
): Promise<PdfkitImageRun[]> {
  return collectSnapDecor(page, pageRect, snapElement, H7_PANEL_SEL, true, bakeText);
}

export async function collectPdfkitPage(
  page: HTMLElement,
  snapElement: SnapElementToDataUrl,
  opts?: CollectPdfkitOptions,
): Promise<PdfkitPage> {
  const pageRect = page.getBoundingClientRect();
  const pageStyle = getComputedStyle(page);
  const runs: PdfkitTextRun[] = [];
  const doc = page.ownerDocument;
  const measureCanvas = doc.createElement('canvas');
  const measureContext = measureCanvas.getContext('2d');
  const range = doc.createRange();
  const walker = doc.createTreeWalker(page, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    if (node instanceof Text) {
      const raw = node.nodeValue ?? '';
      const el = node.parentElement;
      if (
        raw &&
        el &&
        !el.closest(SKIP_CLOSEST) &&
        !el.closest(QL_UI_SEL) &&
        !el.closest(HEADER_MARK_SEL) &&
        !(opts?.skipDecorText && inSnapDecor(el))
      ) {
        const style = getComputedStyle(el);
        if (!isHiddenStyle(style)) {
          const clip = visibleClip(el, page);
          const fontSize = Number.parseFloat(style.fontSize) || 12;
          const fontWeight = resolveFontWeight(el);
          const letterSpacing =
            style.letterSpacing === 'normal'
              ? 0
              : Number.parseFloat(style.letterSpacing) || 0;
          const flags = richTextFlagsFor(el);
          const href = resolveTextHref(el);
          const isHeader = Boolean(el.closest(HEADER_SEL));
          const isInfo1 = Boolean(el.closest(INFO1_SEL));
          const info1Row = el.closest(INFO1_ROW_SEL);
          const info1RowBox = info1Row instanceof HTMLElement
            ? info1Row.getBoundingClientRect()
            : null;
          const info1LineId = info1Row?.getAttribute(RESUME_INFO1_ROW_ATTR) || undefined;
          const info1LineAlign = info1RowBox && info1Row instanceof HTMLElement
            ? (['left', 'center', 'right'].includes(getComputedStyle(info1Row).textAlign)
                ? getComputedStyle(info1Row).textAlign as 'left' | 'center' | 'right'
                : undefined)
            : undefined;
          const lineRuns = groupTextNodeIntoLineRuns(raw, (start, end) =>
            rangeRects(range, node as Text, start, end),
          );
          if (!lineRuns.length && raw.trim()) {
            const fb = ancestorTextBox(el);
            if (fb) lineRuns.push({ text: raw.trim(), x: fb.x, y: fb.y, w: fb.w, h: fb.h });
          }
          const itemEl = el.closest('[data-item-id]');
          const itemBox =
            itemEl instanceof HTMLElement ? itemEl.getBoundingClientRect() : null;
          const itemText =
            itemEl instanceof HTMLElement
              ? (itemEl.textContent ?? '').replace(/\s+/g, ' ').trim()
              : '';
          for (const r of lineRuns) {
            // 整字段只有这一段文本时，用元素盒宽（与预览一致），不用纯字形 rect
            if (
              !isInfo1 &&
              itemBox &&
              itemBox.width >= 1 &&
              itemText &&
              itemText === r.text.replace(/\s+/g, ' ').trim()
            ) {
              r.x = itemBox.left;
              r.y = itemBox.top;
              r.w = itemBox.width;
              r.h = itemBox.height;
            }
            if (!keepTextVisible({ x: r.x, y: r.y, w: r.w, h: r.h }, clip)) {
              continue;
            }
            const ink = measureContext
              ? measureTextInk(measureContext, r.text, style, fontWeight, fontSize)
              : {};
            // 一个逻辑 row 可能因侧栏宽度不足而换成多条视觉行；每条视觉行
            // 必须独立成 Frame，否则合并时会把换行内容压成一行并发生裁切。
            const info1VisualLineId = info1LineId && info1RowBox
              ? `${info1LineId}:${Math.round((r.y - info1RowBox.top) * 2) / 2}`
              : undefined;
            runs.push({
              text: r.text,
              x: r.x - pageRect.left,
              y: r.y - pageRect.top,
              w: r.w,
              h: r.h,
              fontSize,
              fontWeight,
              color: style.color,
              letterSpacing,
              fontFamily: style.fontFamily || undefined,
              ...(ink.width != null ? { textWidth: ink.width } : {}),
              ...(ink.ascent != null ? { textAscent: ink.ascent } : {}),
              ...(ink.descent != null ? { textDescent: ink.descent } : {}),
              ...(isHeader ? { isHeader: true } : {}),
              ...(isInfo1 ? { isInfo1: true } : {}),
              ...(info1VisualLineId && info1RowBox
                ? {
                    info1LineId: info1VisualLineId,
                    info1LineX: info1RowBox.left - pageRect.left,
                    info1LineY: r.y - pageRect.top,
                    info1LineW: info1RowBox.width,
                    info1LineH: Math.max(r.h, fontSize * 1.15),
                    ...(info1LineAlign ? { info1LineAlign } : {}),
                  }
                : {}),
              ...(flags.italic ? { italic: true } : {}),
              ...(flags.underline || href ? { underline: true } : {}),
              ...(flags.strike ? { strike: true } : {}),
              ...(href ? { href } : {}),
            });
          }
        }
      }
    }
    node = walker.nextNode();
  }
  const background = pageStyle.backgroundColor;
  const bakeDecorText = shouldBakeDecorText(opts);
  // 伪元素可能落在 h7 面板内，等面板截完再采，避免 hide 状态互踩
  const [banner, headerImages, panelImages] = await Promise.all([
    collectRoundedBanner(page, pageRect, snapElement, bakeDecorText),
    collectHeaderImages(page, pageRect, snapElement, bakeDecorText),
    collectH7PanelImages(page, pageRect, snapElement, bakeDecorText),
  ]);
  const pseudoImages = await collectPseudoImages(page, pageRect, snapElement);
  return {
    width: pageRect.width,
    height: pageRect.height,
    background,
    runs,
    images: [
      ...banner.images,
      ...headerImages,
      ...panelImages,
      ...pseudoImages,
      ...collectImages(page, pageRect),
    ],
    fills: [
      ...banner.fills,
      ...collectSideColFills(page, pageRect),
      ...collectFills(page, pageRect, parseCssColor(background)),
    ],
  };
}

export async function collectPdfkitPages(
  root: ParentNode,
  snapElement: SnapElementToDataUrl,
  opts?: CollectPdfkitOptions,
): Promise<PdfkitPage[]> {
  const pages = Array.from(
    root.querySelectorAll<HTMLElement>('[data-resume-export-page]'),
  );
  return mapLimit(pages, PAGE_CONCURRENCY, (page) =>
    collectPdfkitPage(page, snapElement, opts),
  );
}
