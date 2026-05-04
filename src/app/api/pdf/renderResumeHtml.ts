import type { GlobalStyle } from '@/modules/utils/common.type';

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

function sectionHeader(title: string, color: string): string {
  const c = escapeHtml(color);
  return `<div style="font-weight:bold;padding:3px 3px 3px 15px;position:relative;font-size:15px;color:${c};">
<span style="line-height:1;">${escapeHtml(title)}</span>
<span style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${c};"></span>
<span style="position:absolute;inset:0;opacity:0.1;background:${c};"></span>
</div>`;
}

function renderInfo1(mod: { options: Record<string, unknown> }, gs: GlobalStyle): string {
  const opts = mod.options;
  const name = String(opts.name ?? '');
  const layout = (opts.layout as string[][]) ?? [];
  const avatar = String(opts.avatar ?? '');
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
        rowParts.push(
          `<span style="font-size:${fs}px;line-height:${lh};color:#333">${escapeHtml(val)}</span>`
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
  const src = encodeURI(avatar);
  return `<div style="width:100%;display:flex;justify-content:space-between;align-items:center;">
<div style="flex:1;min-width:0;">
<div style="margin-bottom:10px;font-size:24px;font-weight:bold;color:#333;line-height:1;">${escapeHtml(name)}</div>
<div style="width:100%">${rows.join('')}</div>
</div>
<div style="width:90px;min-width:90px;max-width:90px;flex-shrink:0;">
<img src="${src}" alt="" width="90" style="width:100%;aspect-ratio:5/7;object-fit:cover;display:block;" />
</div>
</div>`;
}

function renderCertificate(mod: { options: { title: string; items: Array<{ name: string; date: string }> } }, gs: GlobalStyle): string {
  const { title, items } = mod.options;
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
  return `<div style="width:100%;">${sectionHeader(title, gs.color)}<div style="margin-top:5px;">${rows}</div></div>`;
}

function renderSkill(mod: { options: { title: string; description: string } }, gs: GlobalStyle): string {
  const { title, description } = mod.options;
  const fs = gs.fontSize;
  const lh = gs.lineHeight;
  const inner = plainTextFromRich(description)
    ? `<div class="pdf-rich" style="font-size:${fs}px;line-height:${lh};color:#333;">${sanitizeRichText(description)}</div>`
    : '';
  return `<div style="width:100%;">${sectionHeader(title, gs.color)}<div style="margin-top:5px;">${inner}</div></div>`;
}

function renderJob(mod: { options: { title: string; items: Array<Record<string, string>> } }, gs: GlobalStyle): string {
  const { title, items } = mod.options;
  const fs = gs.fontSize;
  const lh = gs.lineHeight;
  const blocks = items
    .map((item, index) => {
      const desc = item.description ?? '';
      const descHtml = plainTextFromRich(desc)
        ? `<div class="pdf-rich" style="font-size:${fs}px;line-height:${lh};color:#333;">${sanitizeRichText(desc)}</div>`
        : '';
      const sub = [item.post, item.department].filter(Boolean).join(' ');
      const subRow =
        item.post || item.department || item.city
          ? `<div style="display:flex;justify-content:space-between;margin-bottom:5px;">
<div style="flex:0.6;">${escapeHtml(sub)}</div>
<div style="flex:0.2;text-align:right;">${escapeHtml(item.city ?? '')}</div>
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
  return `<div style="width:100%;">${sectionHeader(title, gs.color)}<div style="margin-top:5px;">${blocks}</div></div>`;
}

function renderProject(mod: { options: { title: string; items: Array<Record<string, string>> } }, gs: GlobalStyle): string {
  const { title, items } = mod.options;
  const fs = gs.fontSize;
  const lh = gs.lineHeight;
  const blocks = items
    .map((item, index) => {
      const desc = item.description ?? '';
      const descHtml = plainTextFromRich(desc)
        ? `<div class="pdf-rich" style="line-height:${lh};color:#333;">${sanitizeRichText(desc)}</div>`
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
  return `<div style="width:100%;">${sectionHeader(title, gs.color)}<div style="margin-top:5px;">${blocks}</div></div>`;
}

function renderEducation(mod: { options: { title: string; items: Array<Record<string, unknown>> } }, gs: GlobalStyle): string {
  const { title, items } = mod.options;
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
        ? `<div class="pdf-rich" style="font-size:${fs}px;line-height:${lh};color:#333;">${sanitizeRichText(desc)}</div>`
        : '';
      const degreeLine = item.degree
        ? `<div style="display:flex;justify-content:space-between;margin-bottom:5px;">
<div style="flex:0.7;">${escapeHtml(String(item.major ?? ''))} ${escapeHtml(String(item.degree ?? ''))} ${escapeHtml(String(item.academy ?? ''))}</div>
<div style="flex:0.3;text-align:right;">${escapeHtml(String(item.city ?? ''))}</div>
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
  return `<div style="width:100%;">${sectionHeader(title, gs.color)}<div style="margin-top:5px;">${blocks}</div></div>`;
}

function renderModule(mod: { type: string; options?: unknown }, gs: GlobalStyle): string {
  if (!mod?.options) return '';
  switch (mod.type) {
    case 'info1':
      return renderInfo1(mod as { options: Record<string, unknown> }, gs);
    case 'certificate':
      return renderCertificate(mod as { options: { title: string; items: Array<{ name: string; date: string }> } }, gs);
    case 'skill':
      return renderSkill(mod as { options: { title: string; description: string } }, gs);
    case 'job':
      return renderJob(mod as { options: { title: string; items: Array<Record<string, string>> } }, gs);
    case 'project':
      return renderProject(mod as { options: { title: string; items: Array<Record<string, string>> } }, gs);
    case 'education':
      return renderEducation(mod as { options: { title: string; items: Array<Record<string, unknown>> } }, gs);
    default:
      return '';
  }
}

function renderPage(page: { moduleMargin?: number; modules?: unknown[] }, gs: GlobalStyle): string {
  const mm = page.moduleMargin ?? 10;
  const modules = (page.modules ?? []) as Array<{ type: string; options?: unknown }>;
  const parts: string[] = [];
  for (let i = 0; i < modules.length; i++) {
    if (i > 0) {
      parts.push(`<div style="width:100%;height:${mm}px;flex-shrink:0;"></div>`);
    }
    parts.push(renderModule(modules[i], gs));
  }
  const { width, height, backgroundColor, padding = 0 } = gs;
  const bg = escapeHtml(backgroundColor);
  const wCss = escapeHtml(String(width));
  const hCss = escapeHtml(String(height));
  return `<div class="pdf-page" style="width:${wCss};height:${hCss};padding:${padding}px;background:${bg};margin:0 auto;box-sizing:border-box;overflow:hidden;display:flex;flex-direction:column;">
${parts.join('')}
</div>`;
}

/** 由简历配置生成完整 HTML 文档，供 Puppeteer 打印（不依赖 /edit、无用户态） */
export function renderResumeDocumentHtml(resume: {
  pages: Array<{ moduleMargin?: number; modules?: unknown[] }>;
  globalStyle: GlobalStyle;
}) {
  const gs = resume.globalStyle;
  const pages = resume.pages ?? [];
  const bodyInner = pages.map((p) => renderPage(p, gs)).join('\n');
  const docTitle = 'Resume';
  const canvasBg = escapeHtml(gs.backgroundColor ?? '#fff');
  const bbw = Math.max(0, Number(gs.bodyBorderWidth) || 0);
  const bbc = escapeHtml(gs.bodyBorderColor ?? '#d9d9d9');
  const bodyBorderCss =
    bbw > 0 ? `${bbw}px solid ${bbc}` : 'none';
  const wCss = escapeHtml(String(gs.width));
  const hCss = escapeHtml(String(gs.height));
  const pageCount = Math.max(1, pages.length);
  const bodyWidthCss =
    bbw > 0 ? `calc(${wCss} + ${2 * bbw}px)` : wCss;
  const bodyHeightCss =
    bbw > 0
      ? `calc(${pageCount} * (${hCss}) + ${2 * bbw}px)`
      : pageCount === 1
        ? hCss
        : `calc(${pageCount} * (${hCss}))`;

  /** 无头环境常无系统中文轮廓；用 Noto Sans SC 拉字库，避免 PDF 中方块/空白 */
  const fontStack =
    '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Source Han Sans SC", system-ui, sans-serif';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(docTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&display=swap" rel="stylesheet" />
<style>
  * { box-sizing: border-box; }
  html { -webkit-font-smoothing: antialiased; background: ${canvasBg}; }
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
    border: ${bodyBorderCss};
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
  .pdf-rich, .pdf-rich * { font-family: ${fontStack} !important; }
  .pdf-rich p { margin: 0.25rem 0; }
  .pdf-rich ul { margin: 0.25rem 0; padding-left: 1.25rem; list-style: disc; }
  .pdf-rich ol { margin: 0.25rem 0; padding-left: 1.25rem; list-style: decimal; }
  .pdf-rich li { margin: 0.125rem 0; }
</style>
</head>
<body>
${bodyInner}
</body>
</html>`;
}
