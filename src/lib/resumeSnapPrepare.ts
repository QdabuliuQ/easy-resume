'use client';
import {
  RESUME_INFO1_ROW_ATTR,
  RESUME_ITEM_ROW_ATTR,
  RESUME_MODULE_HEADER_ATTR,
} from '@/components/moduleOperation/constants';
import { RESUME_MODULE_BODY_TEXT_COLOR } from '@/lib/resumePageLayout';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { resumeExportFontStack } from '@/lib/resumeFont';

function parseRgbLuma(cssColor: string): number | null {
  const m = cssColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return null;
  const r = +m[1];
  const g = +m[2];
  const b = +m[3];
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function needsForcedInk(cssColor: string): boolean {
  const l = parseRgbLuma(cssColor);
  return l != null && l > 200;
}

function isPipeSepSpan(el: HTMLElement): boolean {
  return /^[\u00a0\s]*\|[\u00a0\s]*$/.test(el.textContent ?? '');
}

function resolveLineHeightCss(gs: GlobalStyle): string {
  return typeof gs.lineHeight === 'number' && gs.lineHeight > 6
    ? `${gs.lineHeight}px`
    : String(gs.lineHeight ?? 1.5);
}

/** snapdom 截图前：info1 行内字段 keep-all，并把 `|` 与后字段粘成 nowrap，避免孤儿分隔符 */
export function prepareInfo1RowsForSnap(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(`[${RESUME_INFO1_ROW_ATTR}]`).forEach((row) => {
    row.style.wordBreak = 'keep-all';
    row.style.overflowWrap = 'normal';
    row.querySelectorAll<HTMLElement>('span').forEach((span) => {
      if (span.closest('[data-resume-export-ignore]')) return;
      span.style.wordBreak = 'keep-all';
      span.style.overflowWrap = 'normal';
    });
    let node = row.firstElementChild as HTMLElement | null;
    while (node) {
      const next = node.nextElementSibling as HTMLElement | null;
      if (next && isPipeSepSpan(node) && !isPipeSepSpan(next)) {
        const wrap = document.createElement('span');
        wrap.setAttribute('data-resume-snap-nowrap', '');
        wrap.style.whiteSpace = 'nowrap';
        wrap.style.display = 'inline';
        node.style.display = 'inline';
        next.style.display = 'inline';
        const after = next.nextElementSibling as HTMLElement | null;
        row.insertBefore(wrap, node);
        wrap.appendChild(node);
        wrap.appendChild(next);
        node = after;
        continue;
      }
      node = next;
    }
  });
}

function hardenItemHeaderRow(row: HTMLElement) {
  row.style.alignItems = 'flex-start';
  row.style.minWidth = '0';
  row.style.width = '100%';
  const kids = Array.from(row.children) as HTMLElement[];
  if (!kids.length) return;
  const left = kids[0]!;
  left.style.minWidth = '0';
  left.style.flex = '1 1 0%';
  left.style.maxWidth = '100%';
  left.style.overflowWrap = 'anywhere';
  left.style.wordBreak = 'break-word';
  if (left.classList.contains('flex') || left.classList.contains('flex-wrap')) {
    left.style.display = 'block';
    Array.from(left.children).forEach((c) => {
      const child = c as HTMLElement;
      child.style.display = 'inline';
      child.style.verticalAlign = 'baseline';
      if (!child.style.marginRight) child.style.marginRight = '10px';
    });
  }
  const right = kids[1];
  if (right) {
    right.style.flexShrink = '0';
    right.style.whiteSpace = 'nowrap';
    right.style.alignSelf = 'flex-start';
  }
}

/**
 * snapdom 对嵌套 flex + flex-wrap + shrink-0 日期列易算错高度。
 * 优先用 data-resume-item-row；无标记时回退到 data-item-id 锚点。
 */
export function prepareItemHeaderRowsForSnap(root: HTMLElement) {
  const marked = root.querySelectorAll<HTMLElement>(`[${RESUME_ITEM_ROW_ATTR}]`);
  if (marked.length) {
    marked.forEach(hardenItemHeaderRow);
    return;
  }
  const anchors = root.querySelectorAll<HTMLElement>(
    '[data-item-id$="_school"],[data-item-id$="_major"],[data-item-id$="_name"],[data-item-id$="_job"],[data-item-id$="_company"]',
  );
  const rows = new Set<HTMLElement>();
  anchors.forEach((el) => {
    let p: HTMLElement | null = el.parentElement;
    while (p && p !== root) {
      if (p.classList.contains('justify-between')) {
        rows.add(p);
        break;
      }
      p = p.parentElement;
    }
  });
  rows.forEach(hardenItemHeaderRow);
}

/** 富文本描述强制行高，避免 snap 行盒塌缩叠到上一行 */
export function prepareRichTextLineHeightForSnap(root: HTMLElement, gs: GlobalStyle) {
  const lh = resolveLineHeightCss(gs);
  root.querySelectorAll<HTMLElement>('.ql-editor, .resume-quill-embed').forEach((el) => {
    el.style.lineHeight = lh;
    el.style.minHeight = '0';
    el.querySelectorAll<HTMLElement>('p,li,div').forEach((block) => {
      block.style.lineHeight = lh;
    });
  });
}

function indentKey(el: HTMLElement): string {
  return Array.from(el.classList).find((c) => c.startsWith('ql-indent-')) ?? '';
}

function indentLevel(el: HTMLElement): number {
  const k = indentKey(el);
  if (!k) return 0;
  const n = Number(k.replace('ql-indent-', ''));
  return Number.isFinite(n) ? n : 0;
}

function topChildUnder(editor: Element, el: HTMLElement): HTMLElement | null {
  let n: HTMLElement | null = el;
  while (n && n.parentElement !== editor) n = n.parentElement;
  return n;
}

/** Quill 在 .ql-editor 上挂 counter；p/h 会 counter-set 打断编号 */
function hasQuillCounterResetBetween(
  earlier: HTMLElement,
  later: HTMLElement,
  editor: Element,
): boolean {
  const kids = Array.from(editor.children);
  const a = topChildUnder(editor, earlier);
  const b = topChildUnder(editor, later);
  if (!a || !b) return false;
  const ia = kids.indexOf(a);
  const ib = kids.indexOf(b);
  if (ia < 0 || ib < 0 || ia >= ib) return false;
  for (let i = ia + 1; i < ib; i += 1) {
    const t = (kids[i] as HTMLElement).tagName;
    if (t === 'P' || t === 'PRE' || t === 'BLOCKQUOTE' || /^H[1-6]$/.test(t)) return true;
  }
  return false;
}

/** Quill：indent%3 → decimal / lower-alpha / lower-roman */
function toLowerAlpha(n: number): string {
  let x = Math.max(1, n);
  let s = '';
  while (x > 0) {
    x -= 1;
    s = String.fromCharCode(97 + (x % 26)) + s;
    x = Math.floor(x / 26);
  }
  return s;
}

function toLowerRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['m', 'cm', 'd', 'cd', 'c', 'xc', 'l', 'xl', 'x', 'ix', 'v', 'iv', 'i'];
  let x = Math.max(1, Math.min(n, 3999));
  let s = '';
  for (let i = 0; i < vals.length; i += 1) {
    while (x >= vals[i]!) {
      s += syms[i]!;
      x -= vals[i]!;
    }
  }
  return s;
}

export function formatQuillOrderedMarker(index: number, indent: number): string {
  const n = Math.max(1, index);
  const style = ((indent % 3) + 3) % 3;
  if (style === 1) return `${toLowerAlpha(n)}. `;
  if (style === 2) return `${toLowerRoman(n)}. `;
  return `${n}. `;
}

function collectQuillListItems(li: HTMLElement): HTMLElement[] {
  const useDataList = li.hasAttribute('data-list');
  const editor =
    li.closest('.ql-editor') ?? li.closest('.resume-quill-embed') ?? null;
  if (editor) {
    return useDataList
      ? Array.from(editor.querySelectorAll<HTMLElement>('li[data-list]'))
      : Array.from(editor.querySelectorAll<HTMLElement>('ol > li'));
  }
  const list = li.parentElement;
  const host = list?.parentElement;
  if (host && list && (list.tagName === 'OL' || list.tagName === 'UL')) {
    const lists = Array.from(host.children).filter(
      (c) => c.tagName === 'OL' || c.tagName === 'UL',
    );
    if (lists.length > 1) {
      return lists.flatMap((l) =>
        Array.from(l.children).filter((c): c is HTMLElement => {
          if (!(c instanceof HTMLElement) || c.tagName !== 'LI') return false;
          return useDataList ? c.hasAttribute('data-list') : true;
        }),
      );
    }
  }
  if (list) {
    return Array.from(list.children).filter((c): c is HTMLElement => {
      if (!(c instanceof HTMLElement) || c.tagName !== 'LI') return false;
      return useDataList ? c.hasAttribute('data-list') : true;
    });
  }
  return [li];
}

/**
 * Quill 扁平 li + ql-indent；CSS counter 挂在 .ql-editor。
 * 同级连续计数；遇到更浅缩进则嵌套计数器重置。
 */
export function quillOrderedListIndex(li: HTMLElement): number {
  const myIndent = indentLevel(li);
  const useDataList = li.hasAttribute('data-list');
  const all = collectQuillListItems(li);
  const at = all.indexOf(li);
  if (at < 0) return 1;

  const editor =
    li.closest('.ql-editor') ?? li.closest('.resume-quill-embed') ?? null;

  let n = 0;
  for (let i = at; i >= 0; i -= 1) {
    if (
      editor &&
      i < at &&
      hasQuillCounterResetBetween(all[i]!, all[i + 1]!, editor)
    ) {
      break;
    }
    const cur = all[i]!;
    const ind = indentLevel(cur);
    if (ind < myIndent) break;
    if (ind !== myIndent) continue;
    if (useDataList) {
      if (cur.getAttribute('data-list') === 'ordered') n += 1;
    } else if (cur.parentElement?.tagName === 'OL') {
      n += 1;
    }
  }
  return Math.max(1, n);
}

export function quillOrderedListMarker(li: HTMLElement): string {
  return formatQuillOrderedMarker(quillOrderedListIndex(li), indentLevel(li));
}

function ensureSnapMarkerStyle(doc: Document) {
  if (doc.getElementById('resume-snap-marker-style')) return;
  const style = doc.createElement('style');
  style.id = 'resume-snap-marker-style';
  style.textContent =
    '[data-resume-snap-marker]::before,[data-resume-snap-marker]::after{content:none!important}';
  doc.head.appendChild(style);
}

/** 实心圆用 inline style，避免 snapdom 丢伪元素 / 缺 • 字形 */
function appendSnapDisc(doc: Document, host: HTMLElement, ink: string) {
  const disc = doc.createElement('span');
  disc.setAttribute('data-resume-snap-marker', '');
  disc.setAttribute('data-resume-snap-disc', '');
  disc.setAttribute('aria-hidden', 'true');
  disc.style.cssText = [
    'display:inline-block',
    'width:0.22em',
    'height:0.22em',
    'margin:0 0.4em 0 0',
    'border-radius:50%',
    `background-color:${ink}`,
    'vertical-align:0.2em',
    'flex-shrink:0',
  ].join(';');
  host.appendChild(disc);
}

function resolveSnapInk(el: HTMLElement): string {
  try {
    const c = getComputedStyle(el).color;
    if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c;
  } catch {
    /* ignore */
  }
  return '#333333';
}

function materializeQuillUiMarker(li: HTMLElement, ui: HTMLElement) {
  const kind = li.getAttribute('data-list');
  ui.textContent = '';
  ui.setAttribute('data-resume-snap-marker', '');
  // inline-block + 微上移：与汉字行盒光学对齐（baseline 时数字偏下）
  ui.style.display = 'inline-block';
  ui.style.verticalAlign = '0.12em';
  ui.style.lineHeight = 'inherit';
  if (kind === 'ordered') {
    ui.textContent = quillOrderedListMarker(li);
    ui.style.marginRight = '0.25em';
    return;
  }
  if (kind === 'checked') {
    ui.textContent = '[x] ';
    return;
  }
  if (kind === 'unchecked') {
    ui.textContent = '[ ] ';
    return;
  }
  appendSnapDisc(li.ownerDocument, ui, resolveSnapInk(li));
}

/**
 * snapdom 不渲染 Quill `.ql-ui::before` / 原生 list-style 圆点，且部分字库无 •。
 * 导出前物化标记（圆点用 CSS 圆，有序用数字文本）。
 */
export function prepareQuillListMarkersForSnap(root: HTMLElement) {
  const doc = root.ownerDocument;
  ensureSnapMarkerStyle(doc);

  root.querySelectorAll<HTMLElement>('li[data-list]').forEach((li) => {
    if (li.querySelector(':scope > [data-resume-snap-disc], :scope > .ql-ui[data-resume-snap-marker]')) {
      return;
    }
    let ui = li.querySelector(':scope > .ql-ui') as HTMLElement | null;
    if (!ui) {
      ui = doc.createElement('span');
      ui.className = 'ql-ui';
      li.insertBefore(ui, li.firstChild);
    }
    materializeQuillUiMarker(li, ui);
  });

  root.querySelectorAll<HTMLElement>('.ql-editor li:not([data-list])').forEach((li) => {
    if (li.querySelector(':scope > [data-resume-snap-marker]')) return;
    const ordered = li.parentElement?.tagName === 'OL';
    const marker = doc.createElement('span');
    marker.setAttribute('data-resume-snap-marker', '');
    marker.style.display = 'inline-block';
    marker.style.verticalAlign = '0.12em';
    marker.style.lineHeight = 'inherit';
    if (ordered) {
      marker.textContent = quillOrderedListMarker(li);
      marker.style.marginRight = '0.25em';
    } else {
      appendSnapDisc(doc, marker, resolveSnapInk(li));
    }
    li.insertBefore(marker, li.firstChild);
    li.style.listStyle = 'none';
    li.style.listStyleType = 'none';
  });
}

/**
 * 模块标题在 snap 下易逐字折行（含 Type5 箭头条：标题在 div 文本节点里，不是 span）。
 * 强制标题叶节点 nowrap，行内 flex 不换行。
 */
export function prepareModuleHeadersForSnap(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(`[${RESUME_MODULE_HEADER_ATTR}]`).forEach((header) => {
    header.querySelectorAll<HTMLElement>('.flex').forEach((row) => {
      row.style.flexWrap = 'nowrap';
      row.style.alignItems = 'center';
    });
    header.querySelectorAll<HTMLElement>('span, div').forEach((el) => {
      if (el.getAttribute('aria-hidden') === 'true') return;
      if (el.children.length > 0) return;
      const text = (el.textContent ?? '').trim();
      if (!text || text.length > 48) return;
      el.style.whiteSpace = 'nowrap';
      el.style.wordBreak = 'keep-all';
      el.style.overflowWrap = 'normal';
      el.style.flexShrink = '0';
      el.style.minWidth = 'max-content';
      if (el.tagName === 'SPAN') el.style.display = 'inline-block';
    });
  });
}

/** 暗色编辑器下 inherited 浅色字会被白底导出“吃掉” */
export function prepareResumeSnapSubtree(root: HTMLElement, gs: GlobalStyle) {
  const color = RESUME_MODULE_BODY_TEXT_COLOR;
  const ff = resumeExportFontStack(gs.resumeFont);
  const fs = `${gs.fontSize}px`;
  const lh = resolveLineHeightCss(gs);
  root.style.setProperty('color', color, 'important');
  root.style.setProperty('font-family', ff, 'important');
  root.style.fontSize = fs;
  root.style.lineHeight = lh;
  root.querySelectorAll<HTMLElement>('.ql-editor, .resume-quill-embed').forEach((el) => {
    el.style.setProperty('color', color, 'important');
    el.style.setProperty('font-family', ff, 'important');
  });
  const tags =
    'p,span,div,li,td,th,h1,h2,h3,h4,h5,h6,a,label,strong,em,b,i,u';
  root.querySelectorAll<HTMLElement>(tags).forEach((el) => {
    if (el.closest('[data-resume-export-ignore]')) return;
    if (el.closest('[data-resume-side-col]')) return;
    // Respect explicit inline color (e.g. white text on colored header chips).
    if (el.style.color && el.style.color.trim()) return;
    const tc = getComputedStyle(el).color;
    if (needsForcedInk(tc)) el.style.setProperty('color', color, 'important');
  });
  prepareInfo1RowsForSnap(root);
  prepareItemHeaderRowsForSnap(root);
  prepareRichTextLineHeightForSnap(root, gs);
  prepareQuillListMarkersForSnap(root);
  prepareModuleHeadersForSnap(root);
}
