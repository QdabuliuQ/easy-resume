import DOMPurify from 'dompurify';

/** Quill 等富文本在 dangerouslySetInnerHTML 前必须通过此函数 */
export function sanitizeRichTextHtml(html: string): string {
  if (!html?.trim()) return '';
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
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
