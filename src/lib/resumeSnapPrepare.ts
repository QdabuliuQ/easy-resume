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
  prepareModuleHeadersForSnap(root);
}
