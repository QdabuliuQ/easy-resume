import { describe, expect, it } from 'vitest';
import { normalizePlainHtmlListsForQuill, sanitizeRichTextHtml } from '@/utils/sanitizeHtml';

describe('normalizePlainHtmlListsForQuill', () => {
  it('converts plain ul/li to Quill bullet list', () => {
    const raw = '<ul><li>主导<b>中台系统</b></li><li>负责优化</li></ul>';
    const out = normalizePlainHtmlListsForQuill(raw);
    expect(out).toContain('data-list="bullet"');
    expect(out).toContain('class="ql-ui"');
    expect(out).toContain('<ol>');
    expect(out).toContain('主导<b>中台系统</b>');
  });

  it('leaves Quill lists unchanged', () => {
    const quill = '<ol><li data-list="bullet"><span class="ql-ui"></span>已有</li></ol>';
    expect(normalizePlainHtmlListsForQuill(quill)).toBe(quill);
  });
});

describe('sanitizeRichTextHtml', () => {
  it('normalizes lists on server path', () => {
    const out = sanitizeRichTextHtml('<ul><li>条目一</li></ul>');
    expect(out).toContain('data-list="bullet"');
  });
});
