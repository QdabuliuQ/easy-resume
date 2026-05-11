import type { GlobalStyle } from '@/modules/utils/common.type';
import { inlineQuillHtml } from '@/lib/inlineQuillHtml';
import { readQuillSnowCss } from '@/lib/quillSnowCss';
import { resumeFontStack } from '@/lib/resumeFont';
import { globalStylePageDimensions } from '@/lib/resumePageSize';
import { resumePdfFontLinkTags } from '@/lib/resumePdfFontLinkTags';
import { wrapSectionModuleHtml } from '@/modules/header/sectionHeaderHtml';
import {
  formatIntentCityDisplay,
  normalizeResumeCityDisplay,
} from '@/utils/resumeCityDisplay';
import { ensureAnchorsOpenBlank } from '@/utils/sanitizeHtml';

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

function wrapQuillRichHtml(html: string, gs: GlobalStyle): string {
  const body = ensureAnchorsOpenBlank(
    rewriteAnchorsForPdfHtml(sanitizeRichText(html))
  );
  if (!body) return '';
  const fs = Number(gs.fontSize);
  const fontSizePx = Number.isFinite(fs) && fs > 0 ? fs : 14;
  const inlined = inlineQuillHtml(body, {
    fontSizePx,
    lineHeight: gs.lineHeight,
    color: '#333',
  });
  const lh = gs.lineHeight;
  return `<div class="pdf-rich" style="width:100%;box-sizing:border-box;font-size:${fontSizePx}px;line-height:${lh};color:#333;">${inlined}</div>`;
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

function shellSectionOrdinalForPdfMod(
  ordCtx: { shellOrd: number },
  mod: { type?: string; continuation?: boolean }
): number | undefined {
  if (mod.type === 'info1') return undefined;
  if (!mod.continuation) ordCtx.shellOrd += 1;
  return ordCtx.shellOrd;
}

function wrapSectionModuleMaybe(
  title: string,
  gs: GlobalStyle,
  bodyHtml: string,
  showHeader: boolean = true,
  moduleType?: string,
  sectionOrdinal?: number
): string {
  if (showHeader) {
    return wrapSectionModuleHtml(title, gs, bodyHtml, moduleType, sectionOrdinal);
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
  const positionRaw = String(opts.position ?? 'right');
  const position =
    positionRaw === 'left' || positionRaw === 'center' || positionRaw === 'right'
      ? positionRaw
      : 'right';
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
    const rowFlex =
      position === 'center'
        ? 'display:flex;align-items:center;flex-wrap:wrap;justify-content:center;'
        : position === 'left'
          ? 'display:flex;align-items:center;flex-wrap:wrap;justify-content:flex-end;'
          : 'display:flex;align-items:center;flex-wrap:wrap;';
    rows.push(
      `<div style="${rowFlex}${i < layout.length - 1 ? 'margin-bottom:5px;' : ''}">${rowParts.join('')}</div>`
    );
  }
  const textAlign =
    position === 'center'
      ? 'text-align:center;'
      : position === 'left'
        ? 'text-align:right;'
        : '';
  const leftInner = `<div style="margin-bottom:10px;font-size:24px;font-weight:bold;color:#333;line-height:1;${textAlign}">${escapeHtml(name)}</div>
<div style="width:100%;${textAlign}">${rows.join('')}</div>`;
  const textColStyle =
    position === 'center'
      ? 'width:100%;'
      : showAvatar
        ? 'flex:1;min-width:0;'
        : 'width:100%;';
  const leftCol = `<div style="${textColStyle}">${leftInner}</div>`;
  if (!showAvatar) {
    return `<div style="width:100%;display:flex;align-items:center;">${leftCol}</div>`;
  }
  const avatarHtml = `<img src="${encodeURI(avatarSrc)}" alt="" width="90" style="width:100%;aspect-ratio:5/7;object-fit:cover;display:block;" />`;
  const avatarWrap = `<div style="width:90px;min-width:90px;max-width:90px;flex-shrink:0;">${avatarHtml}</div>`;
  if (position === 'center') {
    return `<div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:12px;">${avatarWrap}${leftCol}</div>`;
  }
  if (position === 'left') {
    return `<div style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;">${avatarWrap}${leftCol}</div>`;
  }
  return `<div style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;">${leftCol}${avatarWrap}</div>`;
}

function renderCertificate(
  mod: { options: { title: string; items: Array<{ name: string; date: string }> }; showHeader?: boolean },
  gs: GlobalStyle,
  sectionOrdinal?: number
): string {
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
  return wrapSectionModuleMaybe(title, gs, rows, mod.showHeader !== false, 'certificate', sectionOrdinal);
}

function renderSkill(
  mod: { options: { title: string; description: string }; showHeader?: boolean },
  gs: GlobalStyle,
  sectionOrdinal?: number
): string {
  const opts = mod.options as Record<string, unknown>;
  const title = String(opts.title ?? '专业技能');
  const description = String(opts.description ?? '');
  const inner = plainTextFromRich(description)
    ? wrapQuillRichHtml(description, gs)
    : '';
  // 即使 inner 为空也渲染，wrapSectionModuleMaybe 会保留 header
  return wrapSectionModuleMaybe(title, gs, inner, mod.showHeader !== false, 'skill', sectionOrdinal);
}

function renderJob(
  mod: { options: { title: string; items: Array<Record<string, string>> }; showHeader?: boolean },
  gs: GlobalStyle,
  sectionOrdinal?: number
): string {
  const opts = mod.options as Record<string, unknown>;
  const title = String(opts.title ?? '工作经历');
  const items = (opts.items as Array<Record<string, string>>) ?? [];
  const fs = gs.fontSize;
  const blocks = items
    .map((item, index) => {
      const desc = item.description ?? '';
      const descHtml = plainTextFromRich(desc)
        ? wrapQuillRichHtml(desc, gs)
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
  return wrapSectionModuleMaybe(title, gs, blocks, mod.showHeader !== false, 'job', sectionOrdinal);
}

function renderProject(
  mod: { options: { title: string; items: Array<Record<string, string>> }; showHeader?: boolean },
  gs: GlobalStyle,
  sectionOrdinal?: number
): string {
  const opts = mod.options as Record<string, unknown>;
  const title = String(opts.title ?? '项目经历');
  const items = (opts.items as Array<Record<string, string>>) ?? [];
  const fs = gs.fontSize;
  const blocks = items
    .map((item, index) => {
      const desc = item.description ?? '';
      const descHtml = plainTextFromRich(desc)
        ? wrapQuillRichHtml(desc, gs)
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
  return wrapSectionModuleMaybe(title, gs, blocks, mod.showHeader !== false, 'project', sectionOrdinal);
}

function renderEducation(
  mod: { options: { title: string; items: Array<Record<string, unknown>> }; showHeader?: boolean },
  gs: GlobalStyle,
  sectionOrdinal?: number
): string {
  const opts = mod.options as Record<string, unknown>;
  const title = String(opts.title ?? '教育经历');
  const items = (opts.items as Array<Record<string, unknown>>) ?? [];
  const fs = gs.fontSize;
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
        ? wrapQuillRichHtml(desc, gs)
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
  return wrapSectionModuleMaybe(title, gs, blocks, mod.showHeader !== false, 'education', sectionOrdinal);
}

function renderModule(
  mod: { type: string; options?: unknown; showHeader?: boolean; continuation?: boolean },
  gs: GlobalStyle,
  sectionOrdinal?: number
): string {
  const modWithOpts = { ...mod, options: (mod?.options ?? {}) as Record<string, unknown> };
  switch (mod.type) {
    case 'info1':
      return renderInfo1(modWithOpts as unknown as { options: Record<string, unknown> }, gs);
    case 'certificate':
      return renderCertificate(
        modWithOpts as unknown as { options: { title: string; items: Array<{ name: string; date: string }> } },
        gs,
        sectionOrdinal
      );
    case 'skill':
      return renderSkill(
        modWithOpts as unknown as { options: { title: string; description: string } },
        gs,
        sectionOrdinal
      );
    case 'other':
      return renderSkill(
        modWithOpts as unknown as { options: { title: string; description: string } },
        gs,
        sectionOrdinal
      );
    case 'job':
      return renderJob(
        modWithOpts as unknown as { options: { title: string; items: Array<Record<string, string>> } },
        gs,
        sectionOrdinal
      );
    case 'project':
      return renderProject(
        modWithOpts as unknown as { options: { title: string; items: Array<Record<string, string>> } },
        gs,
        sectionOrdinal
      );
    case 'education':
      return renderEducation(
        modWithOpts as unknown as { options: { title: string; items: Array<Record<string, unknown>> } },
        gs,
        sectionOrdinal
      );
    default:
      return '';
  }
}

function renderPage(
  page: { moduleMargin?: number; modules?: unknown[] },
  gs: GlobalStyle,
  ordCtx: { shellOrd: number }
): string {
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
    fullModuleHeight?: number;
    measuredModuleHeight?: number;
  }>;
  const parts: string[] = [];
  let hasPlacedAnyModule = false;
  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    if (hasPlacedAnyModule && !mod.continuation) {
      parts.push(`<div style="width:100%;height:${mm}px;flex-shrink:0;"></div>`);
    }

    const sectionOrd = shellSectionOrdinalForPdfMod(ordCtx, mod);
    const rendered = renderModule(mod, gs, sectionOrd);
    if (!rendered) continue;

    const viewHeight = Number(mod.viewHeight);
    const offsetY = Number(mod.offsetY);
    const msMH = Number(mod.measuredModuleHeight);
    const fullMH = Number(mod.fullModuleHeight);
    const hasViewHeight = Number.isFinite(viewHeight) && viewHeight > 0;
    const hasOffset = Number.isFinite(offsetY) && offsetY > 0;
    const mh = Number.isFinite(msMH) ? msMH : Number.isFinite(fullMH) ? fullMH : NaN;

    if (hasViewHeight || hasOffset) {
      const clip = hasViewHeight ? viewHeight : 0;
      const clips =
        Number.isFinite(mh) && clip > 0 && mh > clip && !hasOffset;
      const shell: string[] = [
        'width:100%',
        clips ? 'overflow:hidden' : 'overflow:visible',
        'flex-shrink:0',
      ];
      if (clip > 0) shell.push(`height:${clip}px`);
      const inner = hasOffset
        ? `<div style="transform:translateY(-${offsetY}px);">${rendered}</div>`
        : rendered;
      parts.push(`<div style="${shell.join(';')}">${inner}</div>`);
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
  gs: GlobalStyle,
  ordCtx: { shellOrd: number }
): string {
  const mm = Number(gs.moduleMargin) || 10;
  const parts: string[] = [];
  let firstModule = true;

  for (const page of pages) {
    const modules = (page.modules ?? []) as Array<{
      type: string;
      options?: unknown;
      showHeader?: boolean;
      continuation?: boolean;
    }>;

    for (const module of modules) {
      const sectionOrd = shellSectionOrdinalForPdfMod(ordCtx, module);
      const rendered = renderModule(module, gs, sectionOrd);
      if (!rendered) continue;
      if (!firstModule) {
        parts.push(`<div style="width:100%;height:${mm}px;flex-shrink:0;"></div>`);
      }
      parts.push(rendered);
      firstModule = false;
    }
  }

  const { width: pw, height: ph } = globalStylePageDimensions(gs);
  const { backgroundColor, padding = 0 } = gs;
  const bg = escapeHtml(backgroundColor);
  const wCss = escapeHtml(String(pw));
  const hCss = escapeHtml(String(ph));
  const innerWCss = `calc(${wCss} - ${padding * 2}px)`;

  return `<div class="png-page" style="width:${wCss};min-height:${hCss};padding:${padding}px;background:${bg};margin:0 auto;box-sizing:border-box;">
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
  const ordCtx = { shellOrd: 0 };
  const bodyInner = pages.map((p) => renderPage(p, gs, ordCtx)).join('\n');
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
  const quillSnow = readQuillSnowCss();
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
    exportPages?: Array<{ moduleMargin?: number; modules?: unknown[] }>;
    globalStyle: GlobalStyle;
  },
  opts?: { assetOrigin?: string; basePath?: string }
) {
  const gs = resume.globalStyle;
  const { width: pageW } = globalStylePageDimensions(gs);
  const pages = resume.exportPages ?? resume.pages ?? [];
  const ordCtx = { shellOrd: 0 };
  const bodyInner = renderContinuousPage(pages, gs, ordCtx);
  const docTitle = 'Resume';
  const canvasBg = escapeHtml(gs.backgroundColor ?? '#fff');
  const wCss = escapeHtml(String(pageW));

  const fontStack =
    gs.resumeFont === 'system'
      ? `'Noto Sans SC', ${resumeFontStack(gs.resumeFont)}`
      : resumeFontStack(gs.resumeFont);
  const quillSnow = readQuillSnowCss();
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
  html {
    height: auto !important;
    min-height: 0 !important;
  }
  body {
    margin: 0;
    padding: 0;
    width: ${wCss};
    height: auto !important;
    min-height: 0 !important;
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
