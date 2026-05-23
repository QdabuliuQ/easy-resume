'use client';
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

/** 暗色编辑器下 inherited 浅色字会被白底导出“吃掉” */
export function prepareResumeSnapSubtree(root: HTMLElement, gs: GlobalStyle) {
  const color = RESUME_MODULE_BODY_TEXT_COLOR;
  const ff = resumeExportFontStack(gs.resumeFont);
  const fs = `${gs.fontSize}px`;
  const lh =
    typeof gs.lineHeight === 'number' && gs.lineHeight > 6
      ? `${gs.lineHeight}px`
      : String(gs.lineHeight ?? 1.5);
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
    const tc = getComputedStyle(el).color;
    if (needsForcedInk(tc)) el.style.setProperty('color', color, 'important');
  });
}
