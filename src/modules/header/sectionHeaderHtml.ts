import type { GlobalStyle } from '@/modules/utils/common.type';

/** 与 {@link normHeaderType}（sectionHeader.tsx）一致，供 PDF/PNG 服务端渲染 */
export function normHeaderTypeHtml(gs: GlobalStyle): number {
  const n = Number(gs.headerType);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(8, Math.floor(n));
}

function moduleIconSvg(moduleType?: string): string {
  if (moduleType === 'education') {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 6.5h10a2 2 0 0 1 2 2v9h-10a2 2 0 0 0-2 2z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.5 4.5h10a2 2 0 0 1 2 2v11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 9.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }
  if (moduleType === 'job') {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.5 7V5.8A1.8 1.8 0 0 1 10.3 4h3.4a1.8 1.8 0 0 1 1.8 1.8V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 9h15v7.7A1.8 1.8 0 0 1 17.7 18.5H6.3A1.8 1.8 0 0 1 4.5 16.7z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 12h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  }
  if (moduleType === 'project') {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 7.5h5l1.6 1.8h8.4v7.4a1.8 1.8 0 0 1-1.8 1.8H6.3a1.8 1.8 0 0 1-1.8-1.8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4.5 9.3V7.2A1.7 1.7 0 0 1 6.2 5.5h2.7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  if (moduleType === 'skill') {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.2 3.8 7.8 12h3.7l-1 8.2 5.7-8.8h-3.8z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/></svg>';
  }
  if (moduleType === 'certificate') {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 4.5h6l3 3v11a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 18.5V6A1.5 1.5 0 0 1 8.5 4.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 4.8v3h3" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m9.5 14 1.6 1.6 3.4-3.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  if (moduleType === 'other') {
    return '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6.5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="17.5" cy="12" r="1.7" fill="currentColor"/></svg>';
  }
  return moduleIconSvg('education');
}

function escapeHtml(s: unknown): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 模块标题 HTML，视觉与 sectionHeader.tsx 对齐 */
export function sectionHeaderHtml(title: string, gs: GlobalStyle, moduleType?: string): string {
  const c = escapeHtml(gs.color);
  const fsRaw = Number(gs.fontSize);
  const fs = Number.isFinite(fsRaw) && fsRaw > 0 ? fsRaw : 13;
  const escT = escapeHtml(title);
  const t = normHeaderTypeHtml(gs);
  const triScale = fs / 13;
  const triH = Math.max(4, Math.round(6 * triScale));
  const triW = Math.max(6, Math.round(9 * triScale));
  if (t === 7) {
    return `<div style="position:relative;flex-shrink:0;width:5rem;align-self:stretch;min-height:0;">
<div style="position:absolute;top:0;right:0;bottom:0;width:1px;background:${c};z-index:0;"></div>
<div style="position:relative;z-index:1;padding-right:8px;">
<span style="display:block;word-wrap:break-word;overflow-wrap:break-word;font-weight:bold;font-size:${fs}px;color:${c};line-height:1.375;">${escT}</span>
</div>
</div>`;
  }
  if (t === 2) {
    return `<div style="width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;padding:4px 0;">
<span style="font-weight:bold;font-size:${fs}px;color:${c};line-height:1;">${escT}</span>
<div style="width:100%;height:1px;background:${c};flex-shrink:0;"></div>
</div>`;
  }
  if (t === 3) {
    const slantPx = 15;
    const trapClip = `polygon(0 0,calc(100% - ${slantPx}px) 0,100% 100%,0 100%)`;
    return `<div style="width:100%;display:flex;align-items:flex-end;gap:0;padding:2px 0;">
<div style="position:relative;display:inline-flex;align-items:stretch;flex-shrink:0;">
<div aria-hidden="true" style="position:absolute;z-index:0;top:2px;bottom:2px;left:7px;width:100%;background:${c};opacity:0.38;clip-path:${trapClip};"></div>
<div style="position:relative;z-index:1;display:flex;align-items:center;padding:5px 40px 5px 12px;font-weight:bold;font-size:${fs}px;line-height:1;color:#fff;background:${c};clip-path:${trapClip};">${escT}</div>
</div>
<div style="flex:1;min-height:1px;height:1px;background:${c};opacity:0.4;"></div>
</div>`;
  }
  if (t === 4) {
    return `<div style="width:100%;border-bottom:1px solid ${c};padding-bottom:3px;">
<span style="font-weight:bold;font-size:${fs}px;color:${c};line-height:1;">${escT}</span>
</div>`;
  }
  if (t === 5) {
    const clip =
      'polygon(0 0,calc(100% - 15px) 0,100% 50%,calc(100% - 15px) 100%,0 100%)';
    return `<div style="width:100%;position:relative;display:flex;align-items:stretch;">
<div aria-hidden="true" style="position:absolute;left:0;top:0;bottom:0;width:100%;opacity:0.2;background:${c};clip-path:${clip};z-index:0;"></div>
<div style="position:relative;z-index:1;display:flex;align-items:center;padding:4px 32px 4px 20px;font-weight:bold;font-size:${fs}px;line-height:1;color:#fff;background:${c};clip-path:${clip};">${escT}</div>
</div>`;
  }
  if (t === 6) {
    const tg = Math.max(3, Math.round(5 * triScale));
    return `<div style="width:100%;display:flex;align-items:center;gap:8px;padding:4px 0;">
<div style="display:flex;align-items:center;flex-shrink:0;gap:${tg}px;">
<span style="display:inline-block;width:0;height:0;border-top:${triH}px solid transparent;border-bottom:${triH}px solid transparent;border-left:${triW}px solid ${c};"></span>
<span style="display:inline-block;width:0;height:0;border-top:${triH}px solid transparent;border-bottom:${triH}px solid transparent;border-left:${triW}px solid ${c};opacity:0.4;"></span>
</div>
<span style="font-weight:bold;font-size:${fs}px;color:${c};flex-shrink:0;line-height:1;">${escT}</span>
<div style="flex:1;min-height:1px;height:1px;background:${c};"></div>
</div>`;
  }
  if (t === 8) {
    return `<div style="width:100%;display:flex;align-items:center;gap:8px;padding:4px 0;">
<span aria-hidden="true" style="display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:24px;height:24px;border-radius:999px;background:${c};color:#fff;line-height:1;">${moduleIconSvg(moduleType)}</span>
<span style="font-weight:bold;font-size:${fs}px;color:${c};line-height:1;">${escT}</span>
</div>`;
  }
  return `<div style="position:relative;display:flex;align-items:center;font-weight:bold;padding:7px 0 7px 15px;color:${c};">
<span style="line-height:1;font-size:${fs}px;">${escT}</span>
<span style="position:absolute;left:0;top:0;bottom:0;width:3px;background:${c};"></span>
<span style="position:absolute;left:0;top:0;bottom:0;width:100%;opacity:0.1;background:${c};"></span>
</div>`;
}

/** 与 sectionModuleShell.tsx（header7）布局一致：grid 5rem + 间距 10px */
export function wrapSectionModuleHtml(
  title: string,
  gs: GlobalStyle,
  bodyHtml: string,
  moduleType?: string
): string {
  const t = normHeaderTypeHtml(gs);
  if (t === 7) {
    const head = sectionHeaderHtml(title, gs, moduleType);
    return `<div style="width:100%;display:grid;grid-template-columns:5rem minmax(0,1fr);align-items:stretch;column-gap:10px;">${head}<div style="min-width:0;overflow:hidden;box-sizing:border-box;border:1px solid #e4e4e7;background:#fafafa;border-radius:2px;padding:8px 12px;">${bodyHtml}</div></div>`;
  }
  return `<div style="width:100%;">${sectionHeaderHtml(title, gs, moduleType)}<div style="margin-top:5px;">${bodyHtml}</div></div>`;
}
