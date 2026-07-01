import { sanitizeRichTextHtml, unwrapFencedHtml } from '@/utils/sanitizeHtml';

const MODULE_DESC_TYPES = new Set(['skill', 'other']);
const ITEM_DESC_TYPES = new Set(['job', 'project', 'education', 'certificate']);

function sanitizeHtmlString(value: string): string {
  return sanitizeRichTextHtml(unwrapFencedHtml(value));
}

function sanitizeModuleOptions(type: string, options: Record<string, unknown>): void {
  if (MODULE_DESC_TYPES.has(type) && typeof options.description === 'string') {
    options.description = sanitizeHtmlString(options.description);
  }
  if (!ITEM_DESC_TYPES.has(type) || !Array.isArray(options.items)) return;
  for (const item of options.items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (typeof row.description === 'string') {
      row.description = sanitizeHtmlString(row.description);
    }
  }
}

/** 仅清洗 AI 输出中的富文本 HTML 字段，不动姓名/电话等纯文本 */
export function sanitizeResumeHtmlFields<T>(resume: T): T {
  if (!resume || typeof resume !== 'object' || Array.isArray(resume)) return resume;
  const next = JSON.parse(JSON.stringify(resume)) as Record<string, unknown>;
  const pages = next.pages;
  if (!Array.isArray(pages)) return next as T;
  for (const page of pages) {
    if (!page || typeof page !== 'object') continue;
    const modules = (page as { modules?: unknown }).modules;
    if (!Array.isArray(modules)) continue;
    for (const mod of modules) {
      if (!mod || typeof mod !== 'object') continue;
      const m = mod as { type?: string; options?: Record<string, unknown> };
      if (!m.options || typeof m.options !== 'object') continue;
      sanitizeModuleOptions(m.type ?? '', m.options);
    }
  }
  return next as T;
}
