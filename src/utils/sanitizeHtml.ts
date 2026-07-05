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

/** 将 AI / 外部 HTML 的 plain ul/ol/li 转为 Quill 2 列表格式 */
export function normalizePlainHtmlListsForQuill(html: string): string {
  if (!html?.trim() || !/<(?:ul|ol)[\s>]/i.test(html)) return html;
  if (typeof document !== 'undefined') {
    const root = document.createElement('div');
    root.innerHTML = html;
    for (const ul of Array.from(root.querySelectorAll('ul'))) {
      const ol = document.createElement('ol');
      for (const li of Array.from(ul.querySelectorAll(':scope > li'))) {
        ol.appendChild(toQuillListItem(li, 'bullet'));
      }
      ul.replaceWith(ol);
    }
    for (const ol of Array.from(root.querySelectorAll('ol'))) {
      const items = Array.from(ol.querySelectorAll(':scope > li'));
      if (items.length === 0 || items.some((li) => li.hasAttribute('data-list'))) {
        for (const li of items) cleanupQuillListItem(li);
        continue;
      }
      const nextOl = document.createElement('ol');
      for (const li of items) {
        nextOl.appendChild(toQuillListItem(li, 'bullet'));
      }
      ol.replaceWith(nextOl);
    }
    mergeSiblingOls(root);
    stripListInterItemWhitespace(root);
    return root.innerHTML;
  }
  let out = html.replace(/<ul\b[^>]*>([\s\S]*?)<\/ul>/gi, (_full, inner: string) => {
    const body = normalizeListItemHtml(inner, 'bullet');
    return `<ol>${body}</ol>`;
  });
  out = out.replace(/<ol\b[^>]*>([\s\S]*?)<\/ol>/gi, (full, inner: string) => {
    if (/data-list\s*=/.test(inner)) {
      return `<ol>${collapseListInterItemWhitespace(inner)}</ol>`;
    }
    return `<ol>${normalizeListItemHtml(inner, 'bullet')}</ol>`;
  });
  return collapseListInterItemWhitespace(out);
}

function trimListItemBody(li: Element): string {
  let out = '';
  for (const node of Array.from(li.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? '';
      continue;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    if (el.classList.contains('ql-ui')) continue;
    out += el.outerHTML;
  }
  return out.trim();
}

function cleanupQuillListItem(li: Element): void {
  flattenLiParagraphs(li);
  const ui = li.querySelector(':scope > .ql-ui');
  if (ui?.nextSibling?.nodeType === Node.TEXT_NODE) {
    const t = ui.nextSibling.textContent ?? '';
    ui.nextSibling.textContent = t.replace(/^\s+/, '');
  }
  while (li.firstChild && li.firstChild !== ui && li.firstChild.nodeType === Node.TEXT_NODE && !li.firstChild.textContent?.trim()) {
    li.firstChild.remove();
  }
}

function stripListInterItemWhitespace(container: Element): void {
  for (const list of Array.from(container.querySelectorAll('ol, ul'))) {
    for (const node of Array.from(list.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()) node.remove();
    }
  }
}

function collapseListInterItemWhitespace(html: string): string {
  return html.replace(/(<\/li>)\s+(?=<li\b)/gi, '$1');
}

function mergeSiblingOls(container: Element): void {
  let prev: HTMLOListElement | null = null;
  for (const child of Array.from(container.children)) {
    if (child.tagName === 'OL' && child.querySelector(':scope > li[data-list]')) {
      const ol = child as HTMLOListElement;
      if (prev) {
        while (ol.firstChild) prev.appendChild(ol.firstChild);
        ol.remove();
        continue;
      }
      prev = ol;
      continue;
    }
    prev = null;
    mergeSiblingOls(child);
  }
}

function flattenLiParagraphs(li: Element): void {
  for (const p of Array.from(li.querySelectorAll(':scope > p'))) {
    while (p.firstChild) li.insertBefore(p.firstChild, p);
    p.remove();
  }
}

function toQuillListItem(li: Element, listType: 'bullet' | 'ordered'): HTMLLIElement {
  flattenLiParagraphs(li);
  const next = document.createElement('li');
  if (li.hasAttribute('data-list')) {
    next.setAttribute('data-list', li.getAttribute('data-list') ?? listType);
    next.innerHTML = li.innerHTML;
    cleanupQuillListItem(next);
    return next;
  }
  next.setAttribute('data-list', listType);
  const body = trimListItemBody(li);
  next.innerHTML = `<span class="ql-ui" contenteditable="false"></span>${body}`;
  return next;
}

function normalizeListItemHtml(inner: string, listType: 'bullet' | 'ordered'): string {
  return inner.replace(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi, (match, attrs: string, content: string) => {
    if (/data-list\s*=/.test(attrs)) {
      return match.replace(/(<span class="ql-ui"[^>]*><\/span>)\s+/i, '$1');
    }
    const body = content.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, '$1').replace(/\s+/g, ' ').trim();
    return `<li data-list="${listType}"><span class="ql-ui" contenteditable="false"></span>${body}</li>`;
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
