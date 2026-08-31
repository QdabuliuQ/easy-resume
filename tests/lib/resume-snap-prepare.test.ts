// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  RESUME_INFO1_ROW_ATTR,
  RESUME_ITEM_ROW_ATTR,
  RESUME_MODULE_HEADER_ATTR,
} from '@/components/moduleOperation/constants';
import {
  prepareInfo1RowsForSnap,
  prepareItemHeaderRowsForSnap,
  prepareModuleHeadersForSnap,
  prepareRichTextLineHeightForSnap,
} from '@/lib/resumeSnapPrepare';
import type { GlobalStyle } from '@/modules/utils/common.type';

describe('prepareInfo1RowsForSnap', () => {
  it('sets keep-all and glues pipe sep to following field', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div ${RESUME_INFO1_ROW_ATTR}="a:0">
        <span data-item-id="a_phone">135</span>
        <span>\u00a0\u00a0|\u00a0\u00a0</span>
        <span data-item-id="a_email">test@x.com</span>
      </div>
    `;
    prepareInfo1RowsForSnap(root);
    const row = root.querySelector(`[${RESUME_INFO1_ROW_ATTR}]`) as HTMLElement;
    expect(row.style.wordBreak).toBe('keep-all');
    const nowrap = row.querySelector('[data-resume-snap-nowrap]') as HTMLElement;
    expect(nowrap).toBeTruthy();
    expect(nowrap.style.whiteSpace).toBe('nowrap');
    expect(nowrap.textContent).toContain('|');
    expect(nowrap.textContent).toContain('test@x.com');
    expect(row.querySelector('[data-item-id="a_phone"]')?.parentElement).toBe(row);
  });
});

describe('prepareItemHeaderRowsForSnap', () => {
  it('uses data-resume-item-row markers when present', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div ${RESUME_ITEM_ROW_ATTR} class="mb-[5px] flex min-w-0 justify-between gap-2">
        <div class="flex min-w-0 flex-[7] flex-wrap items-center">
          <span data-item-id="edu_0_major">计算机科学与技术</span>
          <span data-item-id="edu_0_degree">本科</span>
        </div>
        <div class="shrink-0"><span data-item-id="edu_0_city">广州</span></div>
      </div>
    `;
    prepareItemHeaderRowsForSnap(root);
    const row = root.querySelector(`[${RESUME_ITEM_ROW_ATTR}]`) as HTMLElement;
    const left = row.children[0] as HTMLElement;
    const right = row.children[1] as HTMLElement;
    expect(left.style.display).toBe('block');
    expect(left.style.minWidth).toBe('0');
    expect(left.style.flex).toBe('1 1 0%');
    expect(right.style.flexShrink).toBe('0');
    expect(right.style.whiteSpace).toBe('nowrap');
  });

  it('falls back to justify-between via data-item-id anchors', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="mb-[5px] flex min-w-0 justify-between gap-2">
        <div class="flex min-w-0 flex-[7] flex-wrap items-center">
          <span data-item-id="edu_0_major">计算机科学与技术</span>
        </div>
        <div class="shrink-0"><span>广州</span></div>
      </div>
    `;
    prepareItemHeaderRowsForSnap(root);
    const row = root.querySelector('.justify-between') as HTMLElement;
    expect((row.children[0] as HTMLElement).style.display).toBe('block');
  });
});

describe('prepareRichTextLineHeightForSnap', () => {
  it('forces line-height on ql-editor blocks', () => {
    const root = document.createElement('div');
    root.innerHTML = `<div class="ql-editor"><p>熟悉数据结构</p></div>`;
    prepareRichTextLineHeightForSnap(root, { lineHeight: 1.5, fontSize: 13 } as GlobalStyle);
    const ed = root.querySelector('.ql-editor') as HTMLElement;
    const p = root.querySelector('p') as HTMLElement;
    expect(ed.style.lineHeight).toBe('1.5');
    expect(p.style.lineHeight).toBe('1.5');
  });
});

describe('prepareModuleHeadersForSnap', () => {
  it('forces nowrap on module title so it does not wrap onto rule lines', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div ${RESUME_MODULE_HEADER_ATTR}>
        <div class="flex w-full items-center gap-3">
          <div class="h-px flex-1"></div>
          <span class="shrink-0 whitespace-nowrap font-bold">工作经历</span>
          <div class="h-px flex-1"></div>
        </div>
      </div>
    `;
    prepareModuleHeadersForSnap(root);
    const title = root.querySelector('span') as HTMLElement;
    const row = root.querySelector('.flex') as HTMLElement;
    expect(title.style.whiteSpace).toBe('nowrap');
    expect(title.style.wordBreak).toBe('keep-all');
    expect(title.style.flexShrink).toBe('0');
    expect(row.style.flexWrap).toBe('nowrap');
  });

  it('forces nowrap on Type5 arrow title div (text node, not span)', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div ${RESUME_MODULE_HEADER_ATTR}>
        <div class="relative flex w-full items-center">
          <div aria-hidden="true"></div>
          <div class="relative z-[1] flex h-full shrink-0 items-center font-bold leading-none text-white">个人优势</div>
        </div>
      </div>
    `;
    prepareModuleHeadersForSnap(root);
    const chip = Array.from(root.querySelectorAll('div')).find(
      (d) => d.textContent?.trim() === '个人优势' && d.children.length === 0,
    ) as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.style.whiteSpace).toBe('nowrap');
    expect(chip.style.minWidth).toBe('max-content');
  });
});
