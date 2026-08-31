import type { ResumeTemplateItem } from '@/json/resumeTemplates';

let cache: ResumeTemplateItem[] | null = null;
let cacheAt = 0;
let cacheLite = false;
const CACHE_MS = 30_000;

export async function loadResumeTemplates(opts?: {
  /** 首页物理卡片：只要预览图 + 纸张尺寸，不要整份 modules */
  lite?: boolean;
}): Promise<ResumeTemplateItem[]> {
  const lite = Boolean(opts?.lite);
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_MS && cacheLite === lite) return cache;

  try {
    if (typeof window === 'undefined') {
      const { listLocalTemplates } = await import('@/lib/localTemplateStore');
      const list = await listLocalTemplates();
      cache = list.map((t) => ({
        id: t.id,
        title: t.title,
        previewImage: t.previewImage,
        config: lite
          ? {
              name: t.config.name,
              globalStyle: t.config.globalStyle,
              pages: [{ modules: [] as never[] }],
            }
          : t.config,
      }));
      cacheLite = lite;
      cacheAt = now;
      return cache;
    }
    const res = await fetch(`/api/templates${lite ? '?lite=1' : ''}`, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { list?: ResumeTemplateItem[] };
      if (Array.isArray(data.list) && data.list.length) {
        cache = data.list;
        cacheLite = lite;
        cacheAt = now;
        return cache;
      }
    }
  } catch {
    /* fall through */
  }

  const mod = await import('@/json/resumeTemplates');
  cache = lite
    ? mod.resumeTemplates.map((t) => ({
        id: t.id,
        title: t.title,
        previewImage: t.previewImage,
        config: {
          name: t.config.name,
          globalStyle: t.config.globalStyle,
          pages: [{ modules: [] as never[] }],
        },
      }))
    : mod.resumeTemplates;
  cacheLite = lite;
  cacheAt = now;
  return cache;
}

export async function loadResumeTemplateByIndex(index: number): Promise<ResumeTemplateItem | null> {
  const list = await loadResumeTemplates();
  if (!Number.isFinite(index) || index < 1 || index > list.length) return null;
  return list[index - 1] ?? null;
}
