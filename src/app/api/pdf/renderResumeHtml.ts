import fs from 'node:fs';
import path from 'node:path';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { resumeFontStack } from '@/lib/resumeFont';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import { resumePdfFontLinkTags } from '@/lib/resumePdfFontLinkTags';
import { wrapSectionModuleHtml } from '@/modules/header/sectionHeaderHtml';
import {
  formatIntentCityDisplay,
  normalizeResumeCityDisplay,
} from '@/utils/resumeCityDisplay';
import { ensureAnchorsOpenBlank } from '@/utils/sanitizeHtml';

let quillSnowCssCache: string | null = null;
function getQuillSnowCss(): string {
  if (quillSnowCssCache == null) {
    const p = path.join(process.cwd(), 'node_modules/quill/dist/quill.snow.css');
    quillSnowCssCache = fs.readFileSync(p, 'utf8');
  }
  return quillSnowCssCache;
}

/** PDF 专用：无 JSDOM 环境下的富文本清理（内容来自用户自己的简历 JSON） */
function sanitizeRichText(html: string): string {
  if (!html?.trim()) return '';
  let s = html;
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  s = s.replace(/<\s*iframe\b[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '');
  s = s.replace(/\son\w+\s*=\s*(['"])[\s\S]*?\1/gi, '');
  s = s.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');
  s = s.replace(/javascript:/gi, '');
  return s;
}

/** Chromium 打印 PDF 时，相对路径的 <a href> 往往不产生 /URI 注释，多数阅读器无法点击 */
function getPdfLinkBase(): string {
  const explicit =
    process.env.PDF_LINK_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const v = process.env.VERCEL_URL?.trim();
  if (v) return `https://${v.replace(/\/$/, '')}`;
  return '';
}

function normalizeHrefForPdf(href: string, base: string): string {
  const raw = href.trim();
  if (!raw || /^javascript:/i.test(raw)) return raw;
  if (/^(https?:|ftps?:|mailto:|tel:|sms:)/i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (raw.startsWith('/') && base) return `${base}${raw}`;
  if (raw.startsWith('#')) return raw;
  if (!raw.includes('://')) {
    const hostish =
      /^(?:[\w-]+\.)+\w{2,}(\/.*)?$/i.test(raw) || /^www\./i.test(raw);
    if (hostish) return `https://${raw.replace(/^\/+/, '')}`;
  }
  return raw;
}

function rewriteAnchorsForPdfHtml(html: string): string {
  const base = getPdfLinkBase();
  return html.replace(/<a\b([^>]*)>/gi, (full, attrs: string) => {
    const dq = attrs.match(/\bhref\s*=\s*"([^"]*)"/i);
    const sq = attrs.match(/\bhref\s*=\s*'([^']*)'/i);
    const m = dq || sq;
    if (!m) return full;
    const quote = dq ? '"' : "'";
    const hrefVal = m[1];
    const next = normalizeHrefForPdf(hrefVal, base);
    if (next === hrefVal) return full;
    const esc =
      quote === '"'
        ? next.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        : next.replace(/&/g, '&amp;').replace(/'/g, '&#39;');
    const newAttrs = attrs.replace(
      /\bhref\s*=\s*(["'])[^"']*\1/i,
      `href=${quote}${esc}${quote}`,
    );
    return `<a${newAttrs}>`;
  });
}

function wrapQuillRichHtml(html: string, style: string): string {
  const body = ensureAnchorsOpenBlank(
    rewriteAnchorsForPdfHtml(sanitizeRichText(html))
  );
  if (!body) return '';
  return `<div class="pdf-rich resume-quill-embed" style="width:100%;box-sizing:border-box;${style}"><div class="ql-editor">${body}</div></div>`;
}

function escapeHtml(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function plainTextFromRich(html: string): string {
  if (!html?.trim()) return '';
  const safe = sanitizeRichText(html);
  return safe.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wrapSectionModuleMaybe(
  title: string,
  gs: GlobalStyle,
  bodyHtml: string,
  showHeader: boolean = true,
  moduleType?: string
): string {
  if (showHeader) {
    return wrapSectionModuleHtml(title, gs, bodyHtml, moduleType);
  }
  const headerType = Number(gs.headerType);
  if (Number.isFinite(headerType) && Math.floor(headerType) === 7) {
    return `<div style="width:100%;"><div style="min-width:0;border:1px solid #e4e4e7;background:#fafafa;border-radius:2px;padding:8px 12px;">${bodyHtml}</div></div>`;
  }
  return `<div style="width:100%;">${bodyHtml}</div>`;
}

function renderInfo1(mod: { options: Record<string, unknown> }, gs: GlobalStyle): string {
  const opts = mod.options;
  const name = String(opts.name ?? '');
  const layout = (opts.layout as string[][]) ?? [];
  const avatar = String(opts.avatar ?? '');
  const avatarSrc = avatar.trim();
  const showAvatar = !!avatarSrc && avatarSrc !== 'avatar';
  const fs = gs.fontSize;
  const lh = gs.lineHeight;
  const rows: string[] = [];
  for (let i = 0; i < layout.length; i++) {
    const row = layout[i];
    const rowParts: string[] = [];
    for (let j = 0; j < row.length; j++) {
      const key = row[j];
      if (key === 'avatar' || key === 'name' || key === 'layout') {
        continue;
      }
      if (key === 'expectedSalary') {
        const arr = opts.expectedSalary as [unknown, unknown] | undefined;
        rowParts.push(
          `<span style="font-size:${fs}px;line-height:${lh};color:#333">${escapeHtml(arr?.[0])} - ${escapeHtml(arr?.[1])}</span>`
        );
      } else if (opts[key as keyof typeof opts]) {
        const val = opts[key as keyof typeof opts];
        const out =
          key === 'city'
            ? normalizeResumeCityDisplay(String(val))
            : key === 'intentCity'
              ? formatIntentCityDisplay(val as unknown)
              : String(val);
        rowParts.push(
          `<span style="font-size:${fs}px;line-height:${lh};color:#333">${escapeHtml(out)}</span>`
        );
      }
      if (j !== row.length - 1) {
        rowParts.push(
          `<span style="display:inline-block;margin:0 10px;color:#999;font-size:${fs}px;line-height:${lh}">|</span>`
        );
      }
    }
    rows.push(
      `<div style="display:flex;align-items:center;flex-wrap:wrap;${i < layout.length - 1 ? 'margin-bottom:5px;' : ''}">${rowParts.join('')}</div>`
    );
  }
  const avatarHtml = showAvatar
    ? `<img src="${encodeURI(avatarSrc)}" alt="" width="90" style="width:100%;aspect-ratio:5/7;object-fit:cover;display:block;" />`
    : `<div style="width:100%;aspect-ratio:5/7;"></div>`;
  return `<div style="width:100%;display:flex;justify-content:space-between;align-items:center;">
<div style="flex:1;min-width:0;">
<div style="margin-bottom:10px;font-size:24px;font-weight:bold;color:#333;line-height:1;">${escapeHtml(name)}</div>
<div style="width:100%">${rows.join('')}</div>
</div>
<div style="width:90px;min-width:90px;max-width:90px;flex-shrink:0;">
${avatarHtml}
</div>
</div>`;
}

function renderCertificate(mod: { options: { title: string; items: Array<{ name: string; date: string }> }; showHeader?: boolean }, gs: GlobalStyle): string {
  const opts = mod.options as Record<string, unknown>;
  const title = String(opts.title ?? '证书');
  const items = (opts.items as Array<{ name: string; date: string }>) ?? [];
  const fs = gs.fontSize;
  const rows = items
    .map(
      (item, index) =>
        `<div style="display:flex;justify-content:space-between;width:100%;${index < items.length - 1 ? 'margin-bottom:5px;' : ''}font-size:${fs}px;color:#000;">
<div style="flex:0.6;min-width:0;">${escapeHtml(item.name)}</div>
<div style="flex:0.4;text-align:right;">${escapeHtml(item.date)}</div>
</div>`
    )
    .join('');
  return wrapSectionModuleMaybe(title, gs, rows, mod.showHeader !== false, 'certificate');
}

function renderSkill(mod: { options: { title: string; description: string }; showHeader?: boolean }, gs: GlobalStyle): string {
  const opts = mod.options as Record<string, unknown>;
  const title = String(opts.title ?? '专业技能');
  const description = String(opts.description ?? '');
  const fs = gs.fontSize;
  const lh = gs.lineHeight;
  const inner = plainTextFromRich(description)
    ? wrapQuillRichHtml(description, `font-size:${fs}px;line-height:${lh};color:#333;`)
    : '';
  // 即使 inner 为空也渲染，wrapSectionModuleMaybe 会保留 header
  return wrapSectionModuleMaybe(title, gs, inner, mod.showHeader !== false, 'skill');
}

function renderJob(mod: { options: { title: string; items: Array<Record<string, string>> }; showHeader?: boolean }, gs: GlobalStyle): string {
  const opts = mod.options as Record<string, unknown>;
  const title = String(opts.title ?? '工作经历');
  const items = (opts.items as Array<Record<string, string>>) ?? [];
  const fs = gs.fontSize;
  const lh = gs.lineHeight;
  const blocks = items
    .map((item, index) => {
      const desc = item.description ?? '';
      const descHtml = plainTextFromRich(desc)
        ? wrapQuillRichHtml(desc, `font-size:${fs}px;line-height:${lh};color:#333;`)
        : '';
      const sub = [item.post, item.department].filter(Boolean).join(' ');
      const subRow =
        item.post || item.department || item.city
          ? `<div style="display:flex;justify-content:space-between;margin-bottom:5px;">
<div style="flex:0.6;">${escapeHtml(sub)}</div>
<div style="flex:0.2;text-align:right;">${escapeHtml(normalizeResumeCityDisplay(item.city ?? ''))}</div>
</div>`
          : '';
      return `<div style="width:100%;color:#333;${index < items.length - 1 ? 'margin-bottom:10px;' : ''}font-size:${fs}px;">
<div style="display:flex;justify-content:space-between;margin-bottom:5px;">
<div style="flex:0.5;font-weight:bold;">${escapeHtml(item.company ?? '')}</div>
<div style="flex:0.5;text-align:right;">${escapeHtml(item.startDate ?? '')} - ${escapeHtml(item.endDate ?? '')}</div>
</div>
${subRow}
${descHtml}
</div>`;
    })
    .join('');
  return wrapSectionModuleMaybe(title, gs, blocks, mod.showHeader !== false, 'job');
}

function renderProject(mod: { options: { title: string; items: Array<Record<string, string>> }; showHeader?: boolean }, gs: GlobalStyle): string {
  const opts = mod.options as Record<string, unknown>;
  const title = String(opts.title ?? '项目经历');
  const items = (opts.items as Array<Record<string, string>>) ?? [];
  const fs = gs.fontSize;
  const lh = gs.lineHeight;
  const blocks = items
    .map((item, index) => {
      const desc = item.description ?? '';
      const descHtml = plainTextFromRich(desc)
        ? wrapQuillRichHtml(desc, `font-size:${fs}px;line-height:${lh};color:#333;`)
        : '';
      const roleRow = item.role
        ? `<div style="display:flex;justify-content:space-between;margin-bottom:5px;"><div style="flex:0.6;">${escapeHtml(item.role)}</div></div>`
        : '';
      return `<div style="width:100%;color:#333;${index < items.length - 1 ? 'margin-bottom:10px;' : ''}font-size:${fs}px;">
<div style="display:flex;justify-content:space-between;margin-bottom:5px;">
<div style="flex:0.7;font-weight:bold;">${escapeHtml(item.name ?? '')}</div>
<div style="flex:0.3;text-align:right;">${escapeHtml(item.startDate ?? '')} - ${escapeHtml(item.endDate ?? '')}</div>
</div>
${roleRow}
${descHtml}
</div>`;
    })
    .join('');
  return wrapSectionModuleMaybe(title, gs, blocks, mod.showHeader !== false, 'project');
}

function renderEducation(mod: { options: { title: string; items: Array<Record<string, unknown>> }; showHeader?: boolean }, gs: GlobalStyle): string {
  const opts = mod.options as Record<string, unknown>;
  const title = String(opts.title ?? '教育经历');
  const items = (opts.items as Array<Record<string, unknown>>) ?? [];
  const fs = gs.fontSize;
  const lh = gs.lineHeight;
  const color = gs.color;
  const blocks = items
    .map((item, index) => {
      const tags = (item.tags as string[]) ?? [];
      const tagHtml = tags
        .map(
          (tag, ti) =>
            `<span style="display:inline-block;background:${escapeHtml(color)};color:#fff;font-size:${Math.max(8, fs - 4)}px;padding:2px 5px;border-radius:5px;${ti < tags.length - 1 ? 'margin-right:5px;' : ''}">${escapeHtml(tag)}</span>`
        )
        .join('');
      const desc = String(item.description ?? '');
      const descHtml = plainTextFromRich(desc)
        ? wrapQuillRichHtml(desc, `font-size:${fs}px;line-height:${lh};color:#333;`)
        : '';
      const degreeLine = item.degree
        ? `<div style="display:flex;justify-content:space-between;margin-bottom:5px;">
<div style="flex:0.7;">${escapeHtml(String(item.major ?? ''))} ${escapeHtml(String(item.degree ?? ''))} ${escapeHtml(String(item.academy ?? ''))}</div>
<div style="flex:0.3;text-align:right;">${escapeHtml(normalizeResumeCityDisplay(String(item.city ?? '')))}</div>
</div>`
        : '';
      return `<div style="width:100%;color:#333;${index < items.length - 1 ? 'margin-bottom:10px;' : ''}font-size:${fs}px;">
<div style="display:flex;justify-content:space-between;margin-bottom:5px;">
<div style="flex:0.7;display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
<span style="font-weight:bold;">${escapeHtml(String(item.school ?? ''))}</span>
<div style="margin-left:10px;display:flex;flex-wrap:wrap;align-items:center;">${tagHtml}</div>
</div>
<div style="flex:0.3;text-align:right;">${escapeHtml(String(item.startDate ?? ''))} - ${escapeHtml(String(item.endDate ?? ''))}</div>
</div>
${degreeLine}
${descHtml}
</div>`;
    })
    .join('');
  return wrapSectionModuleMaybe(title, gs, blocks, mod.showHeader !== false, 'education');
}

function renderModule(mod: { type: string; options?: unknown; showHeader?: boolean }, gs: GlobalStyle): string {
  // options 缺失时补空对象，确保 header 仍能渲染
  const modWithOpts = { ...mod, options: (mod?.options ?? {}) as Record<string, unknown> };
  switch (mod.type) {
    case 'info1':
      return renderInfo1(modWithOpts as unknown as { options: Record<string, unknown> }, gs);
    case 'certificate':
      return renderCertificate(modWithOpts as unknown as { options: { title: string; items: Array<{ name: string; date: string }> } }, gs);
    case 'skill':
      return renderSkill(modWithOpts as unknown as { options: { title: string; description: string } }, gs);
    case 'other':
      return renderSkill(modWithOpts as unknown as { options: { title: string; description: string } }, gs);
    case 'job':
      return renderJob(modWithOpts as unknown as { options: { title: string; items: Array<Record<string, string>> } }, gs);
    case 'project':
      return renderProject(modWithOpts as unknown as { options: { title: string; items: Array<Record<string, string>> } }, gs);
    case 'education':
      return renderEducation(modWithOpts as unknown as { options: { title: string; items: Array<Record<string, unknown>> } }, gs);
    default:
      return '';
  }
}

function renderPage(page: { moduleMargin?: number; modules?: unknown[] }, gs: GlobalStyle): string {
  const mm =
    Number(gs.moduleMargin) ||
    Number(page.moduleMargin) ||
    10;
  const modules = (page.modules ?? []) as Array<{
    type: string;
    options?: unknown;
    showHeader?: boolean;
    viewHeight?: number;
    offsetY?: number;
    continuation?: boolean;
  }>;
  const parts: string[] = [];
  let hasPlacedAnyModule = false;
  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    if (hasPlacedAnyModule && !mod.continuation) {
      parts.push(`<div style="width:100%;height:${mm}px;flex-shrink:0;"></div>`);
    }

    const rendered = renderModule(mod, gs);
    if (!rendered) continue;

    const viewHeight = Number(mod.viewHeight);
    const offsetY = Number(mod.offsetY);
    const hasViewHeight = Number.isFinite(viewHeight) && viewHeight > 0;
    const hasOffset = Number.isFinite(offsetY) && offsetY > 0;

    if (hasViewHeight || hasOffset) {
      const h = hasViewHeight ? viewHeight : 0;
      const inner = hasOffset
        ? `<div style="transform:translateY(-${offsetY}px);">${rendered}</div>`
        : rendered;
      parts.push(`<div style="width:100%;height:${h}px;overflow:hidden;flex-shrink:0;">${inner}</div>`);
    } else {
      parts.push(rendered);
    }
    hasPlacedAnyModule = true;
  }
  const { width: pw, height: ph } = globalStylePageDimensions(gs);
  const { backgroundColor, padding = 0 } = gs;
  const bg = escapeHtml(backgroundColor);
  const wCss = escapeHtml(String(pw));
  const hCss = escapeHtml(String(ph));
  const innerWCss = `calc(${wCss} - ${padding * 2}px)`;
  const innerHCss = `calc(${hCss} - ${padding * 2}px)`;
  return `<div class="pdf-page" style="width:${wCss};height:${hCss};padding:${padding}px;background:${bg};margin:0 auto;box-sizing:border-box;overflow:hidden;">
<div style="width:${innerWCss};height:${innerHCss};overflow:hidden;display:flex;flex-direction:column;">
${parts.join('')}
</div>
</div>`;
}

function renderContinuousPage(
  pages: Array<{ moduleMargin?: number; modules?: unknown[] }>,
  gs: GlobalStyle
): string {
  const mm = Number(gs.moduleMargin) || 10;
  const parts: string[] = [];
  let firstModule = true;

  for (const page of pages) {
    const modules = (page.modules ?? []) as Array<{
      type: string;
      options?: unknown;
      showHeader?: boolean;
    }>;

    for (const module of modules) {
      const rendered = renderModule(module, gs);
      if (!rendered) continue;
      if (!firstModule) {
        parts.push(`<div style="width:100%;height:${mm}px;flex-shrink:0;"></div>`);
      }
      parts.push(rendered);
      firstModule = false;
    }
  }

  const { width: pw } = globalStylePageDimensions(gs);
  const { backgroundColor, padding = 0 } = gs;
  const bg = escapeHtml(backgroundColor);
  const wCss = escapeHtml(String(pw));
  const innerWCss = `calc(${wCss} - ${padding * 2}px)`;

  return `<div class="png-page" style="width:${wCss};padding:${padding}px;background:${bg};margin:0 auto;box-sizing:border-box;">
<div style="width:${innerWCss};display:flex;flex-direction:column;">
${parts.join('')}
</div>
</div>`;
}

/** 共用简历样式：quill 重置 + 字体，PDF 和 PNG 保持完全一致 */
function buildResumeSharedStyles(fontStack: string, canvasBg: string): string {
  return `  * { box-sizing: border-box; }
  html { -webkit-font-smoothing: antialiased; background: ${canvasBg}; }
  .pdf-page, .png-page { font-family: ${fontStack}; }
  .pdf-page *, .png-page * { font-family: inherit !important; }
  .pdf-rich, .pdf-rich * { font-family: ${fontStack} !important; }
  .resume-quill-embed {
    --spacing: 0.25rem;
    display: block;
    width: 100%;
    box-sizing: border-box;
  }
  .resume-quill-embed .ql-editor li {
    margin-block: calc(var(--spacing) * 0.5);
  }
  .resume-quill-embed .ql-editor {
    padding: 0 !important;
    margin: 0 !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    overflow: visible !important;
    outline: none !important;
    color: inherit;
    font-size: inherit;
    line-height: inherit;
    white-space: normal;
    word-wrap: break-word;
    word-break: break-word;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  .resume-quill-embed .ql-editor ol,
  .resume-quill-embed .ql-editor ul {
    padding-left: 0 !important;
    margin: 0 !important;
  }`;
}
export function renderResumeDocumentHtml(resume: {
  pages: Array<{ moduleMargin?: number; modules?: unknown[] }>;
  exportPages?: Array<{ moduleMargin?: number; modules?: unknown[] }>;
  globalStyle: GlobalStyle;
}, opts?: { assetOrigin?: string; basePath?: string }) {
  const gs = resume.globalStyle;
  const { width: pageW, height: pageH } = globalStylePageDimensions(gs);
  const pages = resume.exportPages ?? resume.pages ?? [];
  const bodyInner = pages.map((p) => renderPage(p, gs)).join('\n');
  const docTitle = 'Resume';
  const canvasBg = escapeHtml(gs.backgroundColor ?? '#fff');
  const wCss = escapeHtml(String(pageW));
  const hCss = escapeHtml(String(pageH));
  const pageCount = Math.max(1, pages.length);
  const bodyWidthCss = wCss;
  const bodyHeightCss =
    pageCount === 1
      ? hCss
      : `calc(${pageCount} * (${hCss}))`;

  const fontStack =
    gs.resumeFont === 'system'
      ? `'Noto Sans SC', ${resumeFontStack(gs.resumeFont)}`
      : resumeFontStack(gs.resumeFont);
  const quillSnow = getQuillSnowCss();
  const fontLinks = resumePdfFontLinkTags(gs.resumeFont, {
    assetOrigin: opts?.assetOrigin,
    basePath: opts?.basePath,
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(docTitle)}</title>
${fontLinks}
<style>
${quillSnow}
${buildResumeSharedStyles(fontStack, canvasBg)}
  @page {
    size: ${wCss} ${hCss};
    margin: 0;
  }
  body {
    margin: 0;
    padding: 0;
    width: ${bodyWidthCss};
    height: ${bodyHeightCss};
    background: ${canvasBg};
    font-family: ${fontStack};
    box-sizing: border-box;
  }
  .pdf-page {
    page-break-after: always;
    break-after: page;
  }
  .pdf-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
</style>
</head>
<body>
${bodyInner}
</body>
</html>`;
}

export function renderResumePngHtml(
  resume: {
    pages: Array<{ moduleMargin?: number; modules?: unknown[] }>;
    globalStyle: GlobalStyle;
  },
  opts?: { assetOrigin?: string; basePath?: string }
) {
  const gs = resume.globalStyle;
  const { width: pageW } = globalStylePageDimensions(gs);
  const pages = resume.pages ?? [];
  const bodyInner = renderContinuousPage(pages, gs);
  const docTitle = 'Resume';
  const canvasBg = escapeHtml(gs.backgroundColor ?? '#fff');
  const wCss = escapeHtml(String(pageW));

  const fontStack =
    gs.resumeFont === 'system'
      ? `'Noto Sans SC', ${resumeFontStack(gs.resumeFont)}`
      : resumeFontStack(gs.resumeFont);
  const quillSnow = getQuillSnowCss();
  const fontLinks = resumePdfFontLinkTags(gs.resumeFont, {
    assetOrigin: opts?.assetOrigin,
    basePath: opts?.basePath,
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(docTitle)}</title>
${fontLinks}
<style>
${quillSnow}
${buildResumeSharedStyles(fontStack, canvasBg)}
  body {
    margin: 0;
    padding: 0;
    width: ${wCss};
    background: ${canvasBg};
    font-family: ${fontStack};
    box-sizing: border-box;
  }
</style>
</head>
<body>
${bodyInner}
</body>
</html>`;
}
