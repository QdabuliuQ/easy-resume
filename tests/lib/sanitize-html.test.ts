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

  it('converts plain ol/li from LLM to Quill ordered list', () => {
    const raw = '<ol><li><b>前端</b> Vue3</li><li><b>工程化</b> Vite</li></ol>';
    const out = normalizePlainHtmlListsForQuill(raw);
    expect(out).toContain('data-list="ordered"');
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

  it('strips whitespace between Quill list items from LLM output', () => {
    const raw =
      '<ol>\n<li data-list="bullet"><span class="ql-ui"></span><b>A</b></li>\n<li data-list="bullet"><span class="ql-ui"></span><b>B</b></li>\n</ol>';
    const out = normalizePlainHtmlListsForQuill(raw);
    expect(out).not.toMatch(/<\/li>\s+<li/);
    expect(out).toContain('<b>A</b>');
    expect(out).toContain('<b>B</b>');
  });
});

describe('sanitizeRichTextHtml', () => {
  it('normalizes lists on server path', () => {
    const out = sanitizeRichTextHtml('<ul><li>条目一</li></ul>');
    expect(out).toContain('data-list="bullet"');
  });

  it('normalizes plain ol on server path', () => {
    const out = sanitizeRichTextHtml('<ol><li>条目一</li><li>条目二</li></ol>');
    expect(out).toContain('data-list="ordered"');
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

  it('promotes color from wrapping span onto the link', () => {
    const out = sanitizeRichTextHtml(
      '<p><span style="color: rgb(230, 0, 0);"><a href="https://example.com">红链</a></span></p>',
    );
    expect(out).toMatch(/<a[^>]*style="[^"]*color:\s*rgb\(230,\s*0,\s*0\)/);
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('红链');
    expect(out).not.toMatch(/<span[^>]*color[^>]*>\s*<a/);
  });

  it('promotes color from inner span onto the link', () => {
    const out = sanitizeRichTextHtml(
      '<p><a href="https://example.com"><span style="color: rgb(255, 153, 0);">橙链</span></a></p>',
    );
    expect(out).toMatch(/<a[^>]*style="[^"]*color:\s*rgb\(255,\s*153,\s*0\)/);
    expect(out).toContain('橙链');
  });
});
