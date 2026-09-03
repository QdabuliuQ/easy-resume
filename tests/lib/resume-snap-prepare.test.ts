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
  prepareQuillListMarkersForSnap,
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

describe('prepareQuillListMarkersForSnap', () => {
  it('materializes Quill bullet as CSS disc and ordered as digits', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="ql-editor">
        <ol>
          <li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>前端 Vue3</li>
          <li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>第一项</li>
          <li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>第二项</li>
        </ol>
      </div>
    `;
    prepareQuillListMarkersForSnap(root);
    const bulletUi = root.querySelector('li[data-list="bullet"] > .ql-ui') as HTMLElement;
    const disc = bulletUi.querySelector('[data-resume-snap-disc]') as HTMLElement;
    expect(disc).toBeTruthy();
    expect(disc.style.borderRadius).toBe('50%');
    expect(disc.style.backgroundColor).toBeTruthy();
    expect(disc.style.width).toBe('0.22em');
    const ordered = root.querySelectorAll('li[data-list="ordered"] > .ql-ui');
    expect(ordered[0]?.textContent).toBe('1. ');
    expect(ordered[1]?.textContent).toBe('2. ');
  });

  it('numbers consecutive one-li-per-ol Quill lists 1. 2. 3.', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="ql-editor">
        <ol><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>熟练 HTML</li></ol>
        <ol><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>熟悉 Vue</li></ol>
        <ol><li data-list="ordered"><span class="ql-ui" contenteditable="false"></span>掌握 Vite</li></ol>
      </div>
    `;
    prepareQuillListMarkersForSnap(root);
    const texts = Array.from(
      root.querySelectorAll('li[data-list="ordered"] > .ql-ui'),
    ).map((el) => el.textContent);
    expect(texts).toEqual(['1. ', '2. ', '3. ']);
  });

  it('resets ordered index after intervening paragraph', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="ql-editor">
        <ol><li data-list="ordered"><span class="ql-ui"></span>A</li></ol>
        <ol><li data-list="ordered"><span class="ql-ui"></span>B</li></ol>
        <p>分隔</p>
        <ol><li data-list="ordered"><span class="ql-ui"></span>C</li></ol>
      </div>
    `;
    prepareQuillListMarkersForSnap(root);
    const texts = Array.from(
      root.querySelectorAll('li[data-list="ordered"] > .ql-ui'),
    ).map((el) => el.textContent);
    expect(texts).toEqual(['1. ', '2. ', '1. ']);
  });

  it('formats nested ordered as 1. a. i. like Quill preview', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="ql-editor">
        <ol>
          <li data-list="ordered"><span class="ql-ui"></span>熟练 HTML</li>
          <li data-list="ordered" class="ql-indent-1"><span class="ql-ui"></span>熟悉 Vue3</li>
          <li data-list="ordered" class="ql-indent-1"><span class="ql-ui"></span>熟悉 React</li>
          <li data-list="ordered" class="ql-indent-2"><span class="ql-ui"></span>栈复用</li>
          <li data-list="ordered"><span class="ql-ui"></span>掌握 Vite</li>
          <li data-list="ordered"><span class="ql-ui"></span>具备低代码</li>
        </ol>
      </div>
    `;
    prepareQuillListMarkersForSnap(root);
    const texts = Array.from(
      root.querySelectorAll('li[data-list="ordered"] > .ql-ui'),
    ).map((el) => el.textContent);
    expect(texts).toEqual(['1. ', 'a. ', 'b. ', 'i. ', '2. ', '3. ']);
  });

  it('formats nested one-li-per-ol the same as merged ol', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="ql-editor">
        <ol><li data-list="ordered"><span class="ql-ui"></span>L1</li></ol>
        <ol><li data-list="ordered" class="ql-indent-1"><span class="ql-ui"></span>L2a</li></ol>
        <ol><li data-list="ordered" class="ql-indent-1"><span class="ql-ui"></span>L2b</li></ol>
        <ol><li data-list="ordered" class="ql-indent-2"><span class="ql-ui"></span>L3</li></ol>
        <ol><li data-list="ordered"><span class="ql-ui"></span>L1b</li></ol>
      </div>
    `;
    prepareQuillListMarkersForSnap(root);
    const texts = Array.from(
      root.querySelectorAll('li[data-list="ordered"] > .ql-ui'),
    ).map((el) => el.textContent);
    expect(texts).toEqual(['1. ', 'a. ', 'b. ', 'i. ', '2. ']);
  });

  it('adds disc for plain ul/li without data-list', () => {
    const root = document.createElement('div');
    root.innerHTML = `<div class="ql-editor"><ul><li>负责企业中台</li><li>性能优化</li></ul></div>`;
    prepareQuillListMarkersForSnap(root);
    const discs = root.querySelectorAll('[data-resume-snap-disc]');
    expect(discs.length).toBe(2);
  });
});
