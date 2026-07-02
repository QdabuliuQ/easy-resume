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

/** 将 AI 输出的 plain <ul><li> 转为 Quill 2 可渲染的无序列表 */
export function normalizePlainHtmlListsForQuill(html: string): string {
  if (!html?.trim() || !/<ul[\s>]/i.test(html)) return html;
  if (typeof document !== 'undefined') {
    const root = document.createElement('div');
    root.innerHTML = html;
    for (const ul of Array.from(root.querySelectorAll('ul'))) {
      const ol = document.createElement('ol');
      for (const li of Array.from(ul.querySelectorAll(':scope > li'))) {
        const next = document.createElement('li');
        if (li.hasAttribute('data-list')) {
          next.setAttribute('data-list', li.getAttribute('data-list') ?? 'bullet');
          next.innerHTML = li.innerHTML;
        } else {
          next.setAttribute('data-list', 'bullet');
          next.innerHTML = `<span class="ql-ui" contenteditable="false"></span>${li.innerHTML}`;
        }
        ol.appendChild(next);
      }
      ul.replaceWith(ol);
    }
    return root.innerHTML;
  }
  return html.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_full, inner: string) => {
    const body = inner.replace(
      /<li\b([^>]*)>([\s\S]*?)<\/li>/gi,
      (match, attrs: string, content: string) => {
        if (/data-list\s*=/.test(attrs)) return match;
        return `<li data-list="bullet"><span class="ql-ui" contenteditable="false"></span>${content}</li>`;
      },
    );
    return `<ol>${body}</ol>`;
  });
}

export function looksLikeRichHtml(value: string): boolean {
  return /<[^>]+>/.test(value.trim());
}

function stripForeignRichTextStyles(html: string): string {
  if (!html?.trim()) return html;
  if (typeof document === 'undefined') {
    return html
      .replace(/\sclass="[^"]*\bql-bg-[^"\s]*[^"]*"/gi, (m) => {
        const next = m
          .slice(8, -1)
          .split(/\s+/)
          .filter((c) => !c.startsWith('ql-bg-'))
          .join(' ');
        return next ? ` class="${next}"` : '';
      })
      .replace(/\bbackground(?:-color|-image)?\s*:[^;"']*;?/gi, '');
  }
  const root = document.createElement('div');
  root.innerHTML = html;
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[style]'))) {
    el.style.removeProperty('background');
    el.style.removeProperty('background-color');
    el.style.removeProperty('background-image');
    if (!el.getAttribute('style')?.trim()) el.removeAttribute('style');
  }
  for (const el of Array.from(root.querySelectorAll('[class*="ql-bg-"]'))) {
    for (const cls of Array.from(el.classList)) {
      if (cls.startsWith('ql-bg-')) el.classList.remove(cls);
    }
  }
  return root.innerHTML;
}

/** Quill 等富文本在 dangerouslySetInnerHTML 前必须通过此函数 */
export function sanitizeRichTextHtml(html: string): string {
  if (!html?.trim()) return '';
  let safe: string;
  if (typeof window === 'undefined') {
    safe = sanitizeRichTextOnServer(html);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require('dompurify') as {
      sanitize: (dirty: string, cfg?: { USE_PROFILES?: { html?: boolean } }) => string;
    };
    safe = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
    });
  }
  return stripForeignRichTextStyles(
    ensureAnchorsOpenBlank(normalizePlainHtmlListsForQuill(safe)),
  );
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
