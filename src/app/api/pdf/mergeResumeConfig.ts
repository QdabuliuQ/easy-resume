import defaultResume from '@/json/resume.json';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import { normResumeFont } from '@/lib/resumeFont';
import type { GlobalStyle } from '@/modules/utils/common.type';

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

/** 与画布一致：用户配置缺项时用默认 JSON 补齐，避免 PDF 缺字段 */
export function mergeResumeConfig(user: unknown) {
  const base = deepClone(defaultResume);
  if (!user || typeof user !== 'object') {
    return base;
  }
  const u = user as Record<string, unknown>;
  if (typeof u.name === 'string') {
    base.name = u.name;
  }
  if (u.globalStyle && typeof u.globalStyle === 'object') {
    base.globalStyle = mergeGlobalStylePaper(
      base.globalStyle as GlobalStyle,
      u.globalStyle
    ) as (typeof base)['globalStyle'];
  }
  base.globalStyle.resumeFont = normResumeFont(base.globalStyle.resumeFont);
  if (Array.isArray(u.pages) && u.pages.length > 0) {
    base.pages = deepClone(u.pages) as typeof base.pages;
  }
  if (Array.isArray(u.exportPages) && u.exportPages.length > 0) {
    (base as typeof base & { exportPages?: unknown[] }).exportPages = deepClone(
      u.exportPages
    );
  }
  return base;
}
