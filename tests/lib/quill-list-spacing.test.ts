import { describe, it, expect } from 'vitest';
import Quill from 'quill';
import { sanitizeRichTextHtml } from '@/utils/sanitizeHtml';

function quillDomFromHtml(html: string): string {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const q = new Quill(el, { theme: 'snow', readOnly: true, modules: { toolbar: false } });
  const delta = q.clipboard.convert({ html });
  q.setContents(delta, 'silent');
  const out = q.root.innerHTML;
  document.body.removeChild(el);
  return out;
}

describe('quill list spacing', () => {
  it('does not insert blank blocks between bullet items', () => {
    const raw =
      '<ul><li><b>前端开发：</b>熟练使用 <i>HTML5/CSS3/JavaScript ES6+</i>，熟悉 <i>Vue3/React/Next.js</i> 等主流框架</li><li><b>工程化与性能优化：</b>熟悉 <i>Vite/Webpack</i> 构建工具，具备 <u>性能优化</u> 实践经验</li></ul>';
    const sanitized = sanitizeRichTextHtml(raw);
    const out = quillDomFromHtml(sanitized);
    expect(out).not.toMatch(/<p><br><\/p>/);
    expect(out.match(/data-list="bullet"/g)?.length).toBe(2);
    expect(out).not.toMatch(/<\/li>\s*<p>/);
  });

  it('matches editor path when applying sanitized polish html', () => {
    const raw =
      '<ul><li><b>A：</b>line one</li><li><b>B：</b>line two</li></ul>';
    const sanitized = sanitizeRichTextHtml(raw);
    expect(quillDomFromHtml(raw)).toBe(quillDomFromHtml(sanitized));
  });

  it('merges adjacent single-item ul blocks from AI output', () => {
    const split =
      '<ul><li><b>A：</b>one</li></ul><ul><li><b>B：</b>two</li></ul>';
    const out = quillDomFromHtml(sanitizeRichTextHtml(split));
    expect(out.match(/data-list="bullet"/g)?.length).toBe(2);
    expect(out.match(/<ol>/g)?.length).toBe(1);
  });
});
