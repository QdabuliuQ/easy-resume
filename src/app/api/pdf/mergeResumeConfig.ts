import defaultResume from '@/json/resume';

function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function normalizeCssLength(v: unknown, fallback: string): string {
  if (typeof v === 'string' && v.trim()) return v.trim();
  if (typeof v === 'number' && Number.isFinite(v)) return `${v}px`;
  return fallback;
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
    const ug = u.globalStyle as Record<string, unknown>;
    const fbW = String(base.globalStyle.width);
    const fbH = String(base.globalStyle.height);
    base.globalStyle = {
      ...base.globalStyle,
      ...ug,
      width: normalizeCssLength(ug.width, fbW),
      height: normalizeCssLength(ug.height, fbH),
    } as typeof base.globalStyle;
  }
  if (Array.isArray(u.pages) && u.pages.length > 0) {
    base.pages = deepClone(u.pages) as typeof base.pages;
  }
  return base;
}
