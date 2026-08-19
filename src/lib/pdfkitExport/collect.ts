import { RESUME_H7_PANEL_ATTR, RESUME_HEADER_MARK_ATTR, RESUME_MODULE_HEADER_ATTR } from '@/components/moduleOperation/constants';
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
import type {
  PdfkitFillRun,
  PdfkitImageRun,
  PdfkitPage,
  PdfkitTextRun,
} from '@/lib/pdfkitExport/types';

const SKIP_CLOSEST = 'script,style,noscript,textarea';
const HEADER_SEL = `[${RESUME_MODULE_HEADER_ATTR}]`;
const HEADER_MARK_SEL = `[${RESUME_HEADER_MARK_ATTR}]`;
const H7_PANEL_SEL = `[${RESUME_H7_PANEL_ATTR}]`;
const ROUNDED_BANNER_SEL = '[data-resume-rounded-banner]';
const QL_UI_SEL = '.ql-ui';
const PSEUDO_ATTR = 'data-pdfkit-pseudo';
const HIDE_BEFORE = 'data-pdfkit-hide-before';
const HIDE_AFTER = 'data-pdfkit-hide-after';
const PSEUDO_HIDE_STYLE_ID = 'pdfkit-pseudo-hide';
const SNAP_BORDER_PX = 5;

export type SnapElementOpts = {
  /** 伪元素探针有文字时才需要；装饰截图默认 false */
  embedFonts?: boolean;
};

export type SnapElementToDataUrl = (
  el: HTMLElement,
  opts?: SnapElementOpts,
) => Promise<string | null>;

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

function indentKey(el: HTMLElement): string {
  return Array.from(el.classList).find((c) => c.startsWith('ql-indent-')) ?? '';
}

function orderedIndex(li: HTMLElement): number {
  const indent = indentKey(li);
  let n = 0;
  let cur: Element | null = li;
  while (cur) {
    if (cur instanceof HTMLElement && cur.getAttribute('data-list') === 'ordered') {
      if (indentKey(cur) === indent) n += 1;
    }
    cur = cur.previousElementSibling;
  }
  return Math.max(1, n);
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
  if (kind === 'ordered') return `${orderedIndex(li)}. `;
  return null;
}

function waitFrame(): Promise<void> {
  return new Promise((r) => {
    requestAnimationFrame(() => r());
  });
}

async function cropDataUrlBorder(dataUrl: string, px: number): Promise<string> {
  if (px <= 0) return dataUrl;
  const img = new Image();
  img.src = dataUrl;
  try {
    await img.decode();
  } catch {
    return dataUrl;
  }
  const dw = img.naturalWidth - px * 2;
  const dh = img.naturalHeight - px * 2;
  if (dw < 8 || dh < 8) return dataUrl;
  const canvas = document.createElement('canvas');
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, px, px, dw, dh, 0, 0, dw, dh);
  return canvas.toDataURL('image/png');
}

async function cropDataUrlToCssBox(
  dataUrl: string,
  full: ClipBox,
  vis: ClipBox,
): Promise<string> {
  if (
    Math.abs(full.x - vis.x) < 0.5 &&
    Math.abs(full.y - vis.y) < 0.5 &&
    Math.abs(full.w - vis.w) < 0.5 &&
    Math.abs(full.h - vis.h) < 0.5
  ) {
    return dataUrl;
  }
  if (full.w < 1 || full.h < 1) return dataUrl;
  const img = new Image();
  img.src = dataUrl;
  try {
    await img.decode();
  } catch {
    return dataUrl;
  }
  const sx = ((vis.x - full.x) / full.w) * img.naturalWidth;
  const sy = ((vis.y - full.y) / full.h) * img.naturalHeight;
  const sw = (vis.w / full.w) * img.naturalWidth;
  const sh = (vis.h / full.h) * img.naturalHeight;
  if (sw < 1 || sh < 1) return dataUrl;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
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
    return { ...placed, y: placed.y - 2, dataUrl };
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
  const out: PdfkitImageRun[] = [];
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
  }
  return out;
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
): Promise<{ images: PdfkitImageRun[]; fills: PdfkitFillRun[] }> {
  const images: PdfkitImageRun[] = [];
  const fills: PdfkitFillRun[] = [];
  const banners = page.querySelectorAll<HTMLElement>(ROUNDED_BANNER_SEL);
  for (let i = 0; i < banners.length; i += 1) {
    const el = banners[i];
    if (isHiddenStyle(getComputedStyle(el))) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (!keepFullyVisible(toClipBox(r), visibleClip(el, page))) continue;
    const raw = await snapElement(el);
    if (!raw) continue;
    const dataUrl = await cropDataUrlBorder(raw, SNAP_BORDER_PX);
    const placed = flushToPageEdge(relBox(r, pageRect), {
      x: 0,
      y: 0,
      w: pageRect.width,
      h: pageRect.height,
    });
    placed.x = 0;
    placed.y = 0;
    placed.w = pageRect.width;
    images.push({ ...placed, dataUrl });
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
  }
  return { images, fills };
}

async function collectSnapDecor(
  page: HTMLElement,
  pageRect: DOMRect,
  snapElement: SnapElementToDataUrl,
  selector: string,
  clipVisible: boolean,
): Promise<PdfkitImageRun[]> {
  const out: PdfkitImageRun[] = [];
  const nodes = page.querySelectorAll<HTMLElement>(selector);
  ensurePseudoHideCss(page.ownerDocument);
  for (let i = 0; i < nodes.length; i += 1) {
    const el = nodes[i];
    if (isHiddenStyle(getComputedStyle(el))) continue;
    const full = toClipBox(el.getBoundingClientRect());
    if (full.w < 1 || full.h < 1) continue;
    const clip = visibleClip(el, page);
    const vis = clip ? intersectBoxes(full, clip) : null;
    if (!vis || vis.w < 1 || vis.h < 1) continue;
    if (!clipVisible && !keepFullyVisible(full, clip)) continue;
    const restore = hideTextKeepLayout(el);
    // header 伪元素只靠本截图；面板伪元素另采，截图时关掉防叠两层
    if (selector !== HEADER_SEL) el.setAttribute('data-pdfkit-hide-pseudos', '');
    try {
      await waitFrame();
      const raw = await snapElement(el);
      if (!raw) continue;
      const dataUrl = clipVisible ? await cropDataUrlToCssBox(raw, full, vis) : raw;
      out.push({ ...relBox(vis, pageRect), dataUrl });
    } finally {
      el.removeAttribute('data-pdfkit-hide-pseudos');
      restore();
    }
  }
  return out;
}

async function collectHeaderImages(
  page: HTMLElement,
  pageRect: DOMRect,
  snapElement: SnapElementToDataUrl,
): Promise<PdfkitImageRun[]> {
  return collectSnapDecor(page, pageRect, snapElement, HEADER_SEL, true);
}

async function collectH7PanelImages(
  page: HTMLElement,
  pageRect: DOMRect,
  snapElement: SnapElementToDataUrl,
): Promise<PdfkitImageRun[]> {
  return collectSnapDecor(page, pageRect, snapElement, H7_PANEL_SEL, true);
}

export async function collectPdfkitPage(
  page: HTMLElement,
  snapElement: SnapElementToDataUrl,
): Promise<PdfkitPage> {
  const pageRect = page.getBoundingClientRect();
  const pageStyle = getComputedStyle(page);
  const runs: PdfkitTextRun[] = [];
  const doc = page.ownerDocument;
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
        !el.closest(HEADER_MARK_SEL)
      ) {
        const style = getComputedStyle(el);
        if (!isHiddenStyle(style)) {
          const clip = visibleClip(el, page);
          const fontSize = Number.parseFloat(style.fontSize) || 12;
          const fontWeight = cssFontWeight(style.fontWeight);
          const letterSpacing =
            style.letterSpacing === 'normal'
              ? 0
              : Number.parseFloat(style.letterSpacing) || 0;
          const flags = richTextFlagsFor(el);
          const href = resolveTextHref(el);
          const lineRuns = groupTextNodeIntoLineRuns(raw, (start, end) =>
            rangeRects(range, node as Text, start, end),
          );
          if (!lineRuns.length && raw.trim()) {
            const fb = ancestorTextBox(el);
            if (fb) lineRuns.push({ text: raw.trim(), x: fb.x, y: fb.y, w: fb.w, h: fb.h });
          }
          for (const r of lineRuns) {
            if (!keepTextVisible({ x: r.x, y: r.y, w: r.w, h: r.h }, clip)) {
              continue;
            }
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
  const banner = await collectRoundedBanner(page, pageRect, snapElement);
  const headerImages = await collectHeaderImages(page, pageRect, snapElement);
  const panelImages = await collectH7PanelImages(page, pageRect, snapElement);
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
      ...collectFills(page, pageRect, parseCssColor(background)),
    ],
  };
}

export async function collectPdfkitPages(
  root: ParentNode,
  snapElement: SnapElementToDataUrl,
): Promise<PdfkitPage[]> {
  const pages = Array.from(
    root.querySelectorAll<HTMLElement>('[data-resume-export-page]'),
  );
  const out: PdfkitPage[] = [];
  for (const page of pages) {
    out.push(await collectPdfkitPage(page, snapElement));
  }
  return out;
}
