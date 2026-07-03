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

  it('converts plain ol/li from LLM to Quill bullet list', () => {
    const raw = '<ol><li><b>前端</b> Vue3</li><li><b>工程化</b> Vite</li></ol>';
    const out = normalizePlainHtmlListsForQuill(raw);
    expect(out).toContain('data-list="bullet"');
    expect(out).toContain('class="ql-ui"');
    expect(out).not.toMatch(/<li(?![^>]*data-list)/);
  });

  it('flattens p inside li', () => {
    const raw = '<ul><li><p>条目一</p></li><li><p>条目二</p></li></ul>';
    const out = normalizePlainHtmlListsForQuill(raw);
    expect(out).not.toContain('<p>');
    expect(out).toContain('条目一');
    expect(out).toContain('条目二');
  });

  it('strips whitespace after ql-ui in existing Quill list', () => {
    const raw =
      '<ol><li data-list="bullet"><span class="ql-ui"></span>\n<b>前端</b> Vue3</li></ol>';
    const out = normalizePlainHtmlListsForQuill(raw);
    expect(out).not.toMatch(/ql-ui"><\/span>\s*\n/);
    expect(out).toContain('<b>前端</b>');
  });
});

describe('sanitizeRichTextHtml', () => {
  it('normalizes lists on server path', () => {
    const out = sanitizeRichTextHtml('<ul><li>条目一</li></ul>');
    expect(out).toContain('data-list="bullet"');
  });

  it('normalizes plain ol on server path', () => {
    const out = sanitizeRichTextHtml('<ol><li>条目一</li><li>条目二</li></ol>');
    expect(out).toContain('data-list="bullet"');
    expect(out).toContain('ql-ui');
  });

  it('strips pasted background styles', () => {
    const out = sanitizeRichTextHtml(
      '<p><span style="background-color: yellow; color: red">文本</span></p>',
    );
    expect(out).not.toMatch(/background/i);
    expect(out).toContain('color: red');
    expect(out).toContain('文本');
  });

  it('preserves multiple spaces in html', () => {
    const out = sanitizeRichTextHtml('<p>hello  world</p>');
    expect(out).toMatch(/hello {2}world/);
  });
});
