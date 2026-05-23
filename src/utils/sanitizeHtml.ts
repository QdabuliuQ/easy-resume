/** Node / SSR：无 DOMPurify（需 window），与 PDF 导出同源规则 */
function sanitizeRichTextOnServer(html: string): string {
  let s = html;
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  s = s.replace(/<\s*iframe\b[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '');
  s = s.replace(/\son\w+\s*=\s*(['"])[\s\S]*?\1/gi, '');
  s = s.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');
  s = s.replace(/javascript:/gi, '');
  return s;
}

/** 为外链补充新窗口打开（跳过纯 # 锚点） */
export function ensureAnchorsOpenBlank(html: string): string {
  if (!html?.trim()) return html;
  return html.replace(/<a\b([^>]*)>/gi, (full, attrs: string) => {
    if (/\btarget\s*=/i.test(attrs)) return full;
    const dq = attrs.match(/\bhref\s*=\s*"([^"]*)"/i);
    const sq = attrs.match(/\bhref\s*=\s*'([^']*)'/i);
    const href = (dq?.[1] ?? sq?.[1] ?? '').trim();
    if (!href || href.startsWith('#')) return full;
    const inner = attrs.trim();
    return `<a ${inner} target="_blank" rel="noopener noreferrer">`;
  });
}

/** Quill 等富文本在 dangerouslySetInnerHTML 前必须通过此函数 */
export function sanitizeRichTextHtml(html: string): string {
  if (!html?.trim()) return '';
  if (typeof window === 'undefined') {
    return ensureAnchorsOpenBlank(sanitizeRichTextOnServer(html));
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DOMPurify = require('dompurify') as {
    sanitize: (dirty: string, cfg?: { USE_PROFILES?: { html?: boolean } }) => string;
  };
  const safe = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
  return ensureAnchorsOpenBlank(safe);
}
export function unwrapFencedHtml(s: string): string {
  const t = s.trim();
  const m = /^```(?:html)?\s*\r?\n?([\s\S]*?)```$/im.exec(t);
  if (m) return m[1].trim();
  return t;
}

/** 从富文本中取纯文本（先 sanitize 再取 text，避免脚本影响是否判空） */
export function plainTextFromRichHtml(html: string): string {
  if (!html?.trim()) return '';
  const safe = sanitizeRichTextHtml(html);
  if (typeof document === 'undefined') {
    return safe.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const el = document.createElement('div');
  el.innerHTML = safe;
  return (el.textContent || '').trim();
}
