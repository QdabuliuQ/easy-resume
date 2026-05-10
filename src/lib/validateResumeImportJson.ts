import { RESUME_PAGE_SIZES } from '@/lib/resumePageSize';
import { moduleType } from '@/modules/utils/constant';

const MODULE_TYPES = new Set(Object.keys(moduleType));
const PAGE_SIZE_KEYS = new Set(Object.keys(RESUME_PAGE_SIZES));

/** 支持根级简历对象或 resumeTemplates 条目 `{ config: {...} }` */
export function normalizeResumeImportPayload(data: unknown): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const o = data as Record<string, unknown>;
  const c = o.config;
  if (c && typeof c === 'object' && !Array.isArray(c)) {
    const cfg = c as Record<string, unknown>;
    if (typeof cfg.name === 'string' && cfg.globalStyle && Array.isArray(cfg.pages)) return c;
  }
  return data;
}

export function getResumeImportValidationError(data: unknown): string | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return '根须为对象';
  const o = data as Record<string, unknown>;
  if (typeof o.name !== 'string') return 'name 须为字符串';
  if (!o.globalStyle || typeof o.globalStyle !== 'object' || Array.isArray(o.globalStyle))
    return 'globalStyle 无效';
  const gs = o.globalStyle as Record<string, unknown>;
  if (typeof gs.pageSize !== 'string' || !PAGE_SIZE_KEYS.has(gs.pageSize))
    return 'globalStyle.pageSize 无效';
  if (typeof gs.fontSize !== 'number') return 'globalStyle.fontSize 须为数字';
  if (typeof gs.lineHeight !== 'number') return 'globalStyle.lineHeight 须为数字';
  if (typeof gs.moduleMargin !== 'number') return 'globalStyle.moduleMargin 须为数字';
  if (typeof gs.color !== 'string') return 'globalStyle.color 须为字符串';
  if (typeof gs.backgroundColor !== 'string') return 'globalStyle.backgroundColor 须为字符串';
  if (gs.padding !== undefined && typeof gs.padding !== 'number') return 'globalStyle.padding 无效';
  if (gs.headerType !== undefined && typeof gs.headerType !== 'number') return 'globalStyle.headerType 无效';
  if (
    gs.resumeFont !== undefined &&
    typeof gs.resumeFont !== 'string'
  )
    return 'globalStyle.resumeFont 无效';
  if (!Array.isArray(o.pages) || o.pages.length === 0) return 'pages 须为非空数组';
  for (let pi = 0; pi < o.pages.length; pi++) {
    const p = o.pages[pi];
    if (!p || typeof p !== 'object' || Array.isArray(p)) return `pages[${pi}] 无效`;
    const pg = p as Record<string, unknown>;
    if (!Array.isArray(pg.modules)) return `pages[${pi}].modules 须为数组`;
    for (let mi = 0; mi < pg.modules.length; mi++) {
      const m = pg.modules[mi];
      if (!m || typeof m !== 'object' || Array.isArray(m)) return `模块 pages[${pi}].modules[${mi}] 无效`;
      const mod = m as Record<string, unknown>;
      if (typeof mod.type !== 'string' || !MODULE_TYPES.has(mod.type))
        return `未知模块 type：${String(mod.type)}`;
      if (typeof mod.id !== 'string' || !mod.id.trim()) return `模块 id 无效`;
      if (!mod.options || typeof mod.options !== 'object' || Array.isArray(mod.options))
        return `模块 options 无效`;
    }
  }
  if (
    o.exportPages !== undefined &&
    o.exportPages !== null &&
    !Array.isArray(o.exportPages)
  )
    return 'exportPages 须为数组';
  return null;
}
