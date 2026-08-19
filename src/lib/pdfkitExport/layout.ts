import { PAGE_FIT_EPSILON_PX } from '@/lib/pageSplitAvoidCut';

export const CSS_PX_TO_PT = 72 / 96;

export function pxToPt(px: number): number {
  return px * CSS_PX_TO_PT;
}

/** 用字体 em 盒（ascender–descender）对齐 CSS 行盒，避免 CJK 大 ascent 把字顶下去 */
export function pdfkitTextY(runY: number, runH: number, metricLineH: number): number {
  return runY + (runH - metricLineH) / 2;
}

export type ClipBox = { x: number; y: number; w: number; h: number };

/** 贴页边：亚像素 / 截图 1–2px 缝补到 0 */
export function flushToPageEdge(box: ClipBox, page: ClipBox, pad = 2): ClipBox {
  let { x, y, w, h } = box;
  if (y > 0 && y <= pad) {
    h += y;
    y = 0;
  }
  if (x > 0 && x <= pad) {
    w += x;
    x = 0;
  }
  const right = page.x + page.w - (x + w);
  if (right > 0 && right <= pad) w += right;
  const bottom = page.y + page.h - (y + h);
  if (bottom > 0 && bottom <= pad) h += bottom;
  return { x, y, w, h };
}

export function intersectBoxes(a: ClipBox, b: ClipBox): ClipBox | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x;
  const h = Math.min(a.y + a.h, b.y + b.h) - y;
  if (w <= 0 || h <= 0) return null;
  return { x, y, w, h };
}

/** 与预览分页避切一致：行盒/标题须整段落在可见区内才绘制 */
export function boxFullyInside(
  box: ClipBox,
  clip: ClipBox,
  eps = PAGE_FIT_EPSILON_PX,
): boolean {
  return (
    box.x >= clip.x - eps &&
    box.y >= clip.y - eps &&
    box.x + box.w <= clip.x + clip.w + eps &&
    box.y + box.h <= clip.y + clip.h + eps
  );
}

/** 分页只切纵向；姓名等 nowrap 可能略超出水平仍应导出 */
export function boxVerticallyInside(
  box: ClipBox,
  clip: ClipBox,
  eps = PAGE_FIT_EPSILON_PX,
): boolean {
  if (!intersectBoxes(box, clip)) return false;
  return box.y >= clip.y - eps && box.y + box.h <= clip.y + clip.h + eps;
}

/** 行顶在页内即保留：底边略出页缝仍导出，避免 header7 分页丢一行 */
export function boxTopInsideClip(
  box: ClipBox,
  clip: ClipBox,
  eps = 4,
): boolean {
  if (!intersectBoxes(box, clip)) return false;
  return box.y >= clip.y - eps && box.y < clip.y + clip.h;
}

export function cssHasClipPath(style: {
  clipPath?: string;
  webkitClipPath?: string;
}): boolean {
  const a = (style.clipPath ?? '').trim().toLowerCase();
  const b = (style.webkitClipPath ?? '').trim().toLowerCase();
  return (Boolean(a) && a !== 'none') || (Boolean(b) && b !== 'none');
}

/** 富文本：斜体 / 下划线 / 删除线（含 Quill u/s/em） */
export function cssRichTextFlags(style: {
  fontStyle: string;
  textDecorationLine?: string;
  textDecoration?: string;
}): { italic: boolean; underline: boolean; strike: boolean } {
  const dec = `${style.textDecorationLine ?? ''} ${style.textDecoration ?? ''}`.toLowerCase();
  return {
    italic: style.fontStyle === 'italic' || style.fontStyle === 'oblique',
    underline: /\bunderline\b/.test(dec),
    strike: /\bline-through\b/.test(dec),
  };
}

export function tagRichTextFlags(tagName: string): {
  italic: boolean;
  underline: boolean;
  strike: boolean;
} {
  const t = tagName.toUpperCase();
  return {
    italic: t === 'I' || t === 'EM',
    underline: t === 'U',
    strike: t === 'S' || t === 'STRIKE' || t === 'DEL',
  };
}

export function orRichTextFlags(
  a: { italic: boolean; underline: boolean; strike: boolean },
  b: { italic: boolean; underline: boolean; strike: boolean },
) {
  return {
    italic: a.italic || b.italic,
    underline: a.underline || b.underline,
    strike: a.strike || b.strike,
  };
}

/** 规范化可点链接；仅 http(s) / mailto */
export function normalizePdfHref(raw: string | null | undefined): string | undefined {
  const s = String(raw ?? '').trim();
  if (!s) return undefined;
  if (/^mailto:/i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) {
    try {
      return new URL(s).href;
    } catch {
      return undefined;
    }
  }
  if (/^\/\//.test(s)) {
    try {
      return new URL(`https:${s}`).href;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/** object-cover：从原图裁出与绘制框同比例的中间区域 */
export function objectFitCrop(
  nw: number,
  nh: number,
  dw: number,
  dh: number,
  fit: string,
): { sx: number; sy: number; sw: number; sh: number } {
  if (nw <= 0 || nh <= 0 || dw <= 0 || dh <= 0) {
    return { sx: 0, sy: 0, sw: Math.max(1, nw), sh: Math.max(1, nh) };
  }
  if (fit !== 'cover') {
    return { sx: 0, sy: 0, sw: nw, sh: nh };
  }
  const s = Math.max(dw / nw, dh / nh);
  const sw = dw / s;
  const sh = dh / s;
  return { sx: (nw - sw) / 2, sy: (nh - sh) / 2, sw, sh };
}

/** 头像 src → 导出 mime：png 保持 png，其余按 jpeg */
export function imageMimeFromSrc(src: string): 'image/png' | 'image/jpeg' {
  const s = String(src ?? '').trim();
  if (/^data:image\/png/i.test(s) || /\.png(?:\?|#|$)/i.test(s)) return 'image/png';
  return 'image/jpeg';
}

export type LineRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/** 用 Range.getClientRects 按行拆 text node：同行扩展，换行切开 */
export function groupTextNodeIntoLineRuns(
  raw: string,
  getRects: (start: number, endExclusive: number) => LineRect[],
): { text: string; x: number; y: number; w: number; h: number }[] {
  const out: { text: string; x: number; y: number; w: number; h: number }[] = [];
  let i = 0;
  while (i < raw.length) {
    const first = getRects(i, i + 1)[0];
    if (!first || (first.width === 0 && first.height === 0)) {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < raw.length) {
      const rects = getRects(i, j + 1);
      if (rects.length !== 1) break;
      if (Math.abs(rects[0].top - first.top) > 1.5) break;
      j += 1;
    }
    const box = getRects(i, j)[0];
    const text = raw.slice(i, j);
    if (box && text.trim()) {
      out.push({ text, x: box.left, y: box.top, w: box.width, h: box.height });
    }
    i = j;
  }
  return out;
}

export function parseCssColor(input: string): string | null {
  const s = String(input ?? '').trim();
  if (!s || s === 'transparent' || s === 'none') return null;
  if (s.startsWith('#')) {
    if (/^#[0-9a-f]{3}$/i.test(s)) {
      const r = s[1];
      const g = s[2];
      const b = s[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    if (/^#[0-9a-f]{6}$/i.test(s)) return s.toLowerCase();
    if (/^#[0-9a-f]{8}$/i.test(s)) {
      const a = Number.parseInt(s.slice(7, 9), 16) / 255;
      if (a <= 0) return null;
      return s.slice(0, 7).toLowerCase();
    }
    return null;
  }
  const m =
    s.match(
      /^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i,
    );
  if (!m) return s.toLowerCase();
  const aRaw = m[4];
  if (aRaw != null) {
    const a = aRaw.endsWith('%')
      ? Number.parseFloat(aRaw) / 100
      : Number.parseFloat(aRaw);
    if (Number.isFinite(a) && a <= 0) return null;
  }
  const hex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${hex(+m[1])}${hex(+m[2])}${hex(+m[3])}`;
}

/** 取左上圆角，百分数相对短边；封顶为 min(w,h)/2 */
export function cssBorderRadiusPx(
  value: string,
  boxW: number,
  boxH: number,
): number {
  const first = String(value ?? '').trim().split(/\s+/)[0] ?? '';
  if (!first || first === '0' || first === '0px') return 0;
  const n = Number.parseFloat(first);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const cap = Math.min(boxW, boxH) / 2;
  if (cap <= 0) return 0;
  if (first.endsWith('%')) return Math.min(cap, (n / 100) * Math.min(boxW, boxH));
  return Math.min(cap, n);
}

/** 解析 getComputedStyle(...,'::before').content；counter 返回 null（需 snap 宿主） */
export function parseCssBeforeContent(content: string): string | null {
  const c = String(content ?? '').trim();
  if (!c || c === 'none' || c === 'normal') return null;
  if (/^counters?\(/i.test(c)) return null;
  let inner = c;
  if (
    (inner.startsWith('"') && inner.endsWith('"')) ||
    (inner.startsWith("'") && inner.endsWith("'"))
  ) {
    inner = inner.slice(1, -1);
  }
  return inner
    .replace(/\\([0-9a-fA-F]{1,6})[ ]?/g, (_, h: string) =>
      String.fromCodePoint(Number.parseInt(h, 16)),
    )
    .replace(/\\(.)/g, '$1');
}

export function cssBeforeIsPaintable(before: {
  content: string;
  display: string;
  visibility: string;
}): boolean {
  if (before.display === 'none' || before.visibility === 'hidden') return false;
  const c = String(before.content ?? '').trim();
  return Boolean(c) && c !== 'none' && c !== 'normal';
}

/** 可见 ::before / ::after（含 content:"" 装饰盒） */
export function cssPseudoIsVisual(before: {
  content: string;
  display: string;
  visibility: string;
  opacity?: string;
}): boolean {
  if (!cssBeforeIsPaintable(before)) return false;
  const op = Number.parseFloat(String(before.opacity ?? '1'));
  return !Number.isFinite(op) || op > 0;
}

function cssPx(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

/** ::before 占用盒（含 margin / 绝对偏移） */
export function cssBeforeOuterBox(
  host: { left: number; top: number; width: number; height: number },
  before: {
    width: string;
    height: string;
    marginLeft: string;
    marginTop: string;
    top: string;
    left: string;
    position: string;
    lineHeight: string;
  },
  fontSize: number,
): ClipBox {
  const boxW = cssPx(before.width) || host.width || fontSize * 1.2;
  const boxH =
    cssPx(before.height) || cssPx(before.lineHeight) || host.height || fontSize;
  let x = host.left + cssPx(before.marginLeft);
  let y = host.top + cssPx(before.marginTop);
  if (before.position === 'absolute' || before.position === 'relative') {
    if (before.left !== 'auto') x = host.left + cssPx(before.left);
    if (before.top !== 'auto') y = host.top + cssPx(before.top);
  }
  return { x, y, w: Math.max(boxW, 1), h: Math.max(boxH, 1) };
}

/** 列表圆点：在首行文字左侧，留 margin-right，垂直居中 */
export function discLeftOfLine(
  line: { left: number; top: number; height: number },
  fontSize: number,
  marginRight = fontSize * 0.3,
): { cx: number; cy: number; r: number } {
  const r = Math.max(1.15, fontSize * 0.14);
  const gap = Number.isFinite(marginRight) ? Math.max(0, marginRight) : fontSize * 0.3;
  return {
    cx: line.left - gap - r,
    cy: line.top + line.height / 2,
    r,
  };
}

export function isDiscGlyph(text: string): boolean {
  const t = text.trim();
  return t === '•' || t === '●' || t === '∙' || t === '·';
}

