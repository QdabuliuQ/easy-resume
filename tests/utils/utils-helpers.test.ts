import { describe, expect, it, vi } from 'vitest';
import {
  createEmptyResumeModule,
  ensureResumeModuleItemsId,
  makeResumeItemId,
} from '@/utils/createResumeModule';
import { cssLengthToApproxPx } from '@/utils/cssLength';
import { intentPostsFromResumeConfig } from '@/utils/intentPosts';
import {
  RESUME_MODULE_ITEM_MAX_COUNT,
  canAddResumeModuleItem,
  countResumeModulesByType,
  getResumeModuleItemMaxCount,
  isResumeModuleTypeAtLimit,
  resumeModuleItemLimitMessage,
} from '@/utils/moduleTypeLimits';
import {
  ensureAnchorsOpenBlank,
  plainTextFromRichHtml,
  sanitizeRichTextHtml,
  unwrapFencedHtml,
} from '@/utils/sanitizeHtml';
import { flattenModules } from '@/utils/resumePages';

describe('utils helpers', () => {
  it('creates empty modules and keeps options independent', () => {
    const a = createEmptyResumeModule('job');
    const b = createEmptyResumeModule('job');

    expect(a.type).toBe('job');
    expect(a.id).not.toBe(b.id);
    (a.options.items as unknown[]).push({ x: 1 });
    expect((b.options.items as unknown[]).length).toBe(0);
  });

  it('fills missing item ids while preserving existing id', () => {
    const fixed = ensureResumeModuleItemsId({
      options: {
        items: [{ id: 'keep' }, { name: 'new-1' }, { id: '' }],
      },
    });

    const items = fixed.options?.items as Array<{ id: string }>;
    expect(items[0].id).toBe('keep');
    expect(items[1].id).toBeTruthy();
    expect(items[2].id).toBeTruthy();
  });

  it('uses randomUUID in makeResumeItemId when available', () => {
    const spy = vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('uuid-fixed');
    expect(makeResumeItemId()).toBe('uuid-fixed');
    spy.mockRestore();
  });

  it('converts css lengths approximately', () => {
    expect(cssLengthToApproxPx('25.4mm')).toBe(96);
    expect(cssLengthToApproxPx('1in')).toBe(96);
    expect(cssLengthToApproxPx('72pt')).toBe(96);
    expect(cssLengthToApproxPx('bad')).toBe(794);
  });

  it('extracts intent posts from first info1 module', () => {
    const v = intentPostsFromResumeConfig({
      pages: [
        { modules: [{ type: 'job', options: {} }] },
        { modules: [{ type: 'info1', options: { intentPosts: '  前端工程师  ' } }] },
      ],
    });
    expect(v).toBe('前端工程师');
  });

  it('checks module and item limits', () => {
    expect(getResumeModuleItemMaxCount('job')).toBe(RESUME_MODULE_ITEM_MAX_COUNT.job);
    expect(getResumeModuleItemMaxCount('skill')).toBeUndefined();
    expect(canAddResumeModuleItem('education', 7)).toBe(true);
    expect(canAddResumeModuleItem('education', 8)).toBe(false);
    expect(resumeModuleItemLimitMessage('project')).toContain('10');

    const cfg = {
      pages: [
        { modules: [{ type: 'info1' }, { type: 'job' }, { type: 'job' }] },
        { modules: [{ type: 'job' }] },
      ],
    };
    expect(countResumeModulesByType(cfg as any, 'job')).toBe(3);
    expect(isResumeModuleTypeAtLimit(cfg as any, 'info1')).toBe(true);
  });

  it('sanitizes html helpers and unwraps fenced content', () => {
    const linked = ensureAnchorsOpenBlank('<a href="https://x.com">x</a> <a href="#x">y</a>');
    expect(linked).toContain('target="_blank"');
    expect(linked).toContain('href="#x"');

    expect(unwrapFencedHtml('```html\n<p>x</p>\n```')).toBe('<p>x</p>');

    const safe = sanitizeRichTextHtml('<p>Hello</p><script>alert(1)</script>');
    expect(safe).toContain('Hello');
    expect(safe.toLowerCase()).not.toContain('script');

    expect(plainTextFromRichHtml('<p>A</p><p>B</p>')).toContain('A');
  });

  it('flattens modules in page order', () => {
    const arr = flattenModules({
      pages: [
        { modules: [{ id: 1 }, { id: 2 }] },
        { modules: [{ id: 3 }] },
      ],
    });
    expect(arr.map((x) => x.id)).toEqual([1, 2, 3]);
    expect(flattenModules(null)).toEqual([]);
  });
});
