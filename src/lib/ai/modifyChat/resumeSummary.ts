import type { ResumeConfig } from './resumeSchema';

const MODULE_LABELS: Record<string, string> = {
  info1: '个人信息',
  job: '工作经历',
  project: '项目经历',
  education: '教育经历',
  skill: '技能',
  certificate: '证书',
  other: '其他',
};

export type ModuleSummaryEntry = {
  pageIndex: number;
  moduleIndex: number;
  id: string;
  type: string;
  /** 用户可见模块名：优先 options.title，否则 type 默认名 */
  label: string;
  /** options.title 原文（若有） */
  title?: string;
  itemCount?: number;
};

export type ModuleLocation = {
  pageIndex: number;
  moduleIndex: number;
  module: { type: string; id: string; options?: Record<string, unknown> };
};

function moduleDisplayTitle(type: string, options?: Record<string, unknown>): { label: string; title?: string } {
  const rawTitle = typeof options?.title === 'string' ? options.title.trim() : '';
  const typeLabel = MODULE_LABELS[type] ?? type;
  if (rawTitle) return { label: rawTitle, title: rawTitle };
  return { label: typeLabel };
}

export function buildResumeModuleSummary(resume: unknown): ModuleSummaryEntry[] {
  if (!resume || typeof resume !== 'object') return [];
  const pages = (resume as { pages?: unknown[] }).pages;
  if (!Array.isArray(pages)) return [];
  const out: ModuleSummaryEntry[] = [];
  pages.forEach((page, pageIndex) => {
    const modules = (page as { modules?: unknown[] })?.modules;
    if (!Array.isArray(modules)) return;
    modules.forEach((mod, moduleIndex) => {
      const m = mod as { type?: string; id?: string; options?: Record<string, unknown> };
      if (!m?.id || !m?.type) return;
      const { label, title } = moduleDisplayTitle(m.type, m.options);
      const entry: ModuleSummaryEntry = {
        pageIndex,
        moduleIndex,
        id: m.id,
        type: m.type,
        label,
        title,
      };
      const items = m.options?.items;
      if (Array.isArray(items)) entry.itemCount = items.length;
      out.push(entry);
    });
  });
  return out;
}

/** 用户消息包含模块 title/label 时定位 moduleId（最长匹配优先） */
export function resolveTargetsByDisplayName(
  message: string,
  summary: ModuleSummaryEntry[],
): { moduleId: string; matched: string }[] {
  const text = message.trim();
  if (!text || !summary.length) return [];
  const hits: { moduleId: string; matched: string; len: number }[] = [];
  for (const m of summary) {
    const candidates = new Set<string>();
    if (m.title) candidates.add(m.title);
    candidates.add(m.label);
    const typeLabel = MODULE_LABELS[m.type];
    if (typeLabel) candidates.add(typeLabel);
    for (const name of Array.from(candidates)) {
      if (name.length < 2) continue;
      if (text.includes(name)) {
        hits.push({ moduleId: m.id, matched: name, len: name.length });
      }
    }
  }
  if (!hits.length) return [];
  hits.sort((a, b) => b.len - a.len);
  const best = hits[0]!;
  const top = hits.filter((h) => h.len === best.len);
  const moduleIds = new Set(top.map((h) => h.moduleId));
  if (moduleIds.size !== 1) return [];
  return [{ moduleId: best.moduleId, matched: best.matched }];
}

export function formatModuleSummaryForPrompt(entries: ModuleSummaryEntry[]): string {
  if (!entries.length) return '（无模块）';
  return entries
    .map((e) => {
      const items = e.itemCount != null ? `，${e.itemCount} 条` : '';
      const typeHint = MODULE_LABELS[e.type] && e.label !== MODULE_LABELS[e.type]
        ? `，type=${e.type}`
        : ` type=${e.type}`;
      return `- id=${e.id}${typeHint} label=${e.label}${items}`;
    })
    .join('\n');
}

export function locateModule(resume: unknown, moduleId: string): ModuleLocation | null {
  if (!resume || typeof resume !== 'object') return null;
  const pages = (resume as { pages?: unknown[] }).pages;
  if (!Array.isArray(pages)) return null;
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const modules = (pages[pageIndex] as { modules?: unknown[] })?.modules;
    if (!Array.isArray(modules)) continue;
    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const mod = modules[moduleIndex] as { type?: string; id?: string; options?: Record<string, unknown> };
      if (mod?.id === moduleId && mod.type) {
        return { pageIndex, moduleIndex, module: mod as ModuleLocation['module'] };
      }
    }
  }
  return null;
}

export function extractPostType(resume: unknown): string {
  if (!resume || typeof resume !== 'object') return '未指定岗位';
  const pages = (resume as { pages?: unknown[] }).pages;
  if (!Array.isArray(pages)) return '未指定岗位';
  for (const page of pages) {
    const modules = (page as { modules?: unknown[] })?.modules;
    if (!Array.isArray(modules)) continue;
    for (const mod of modules) {
      const m = mod as { type?: string; options?: Record<string, unknown> };
      if (m.type === 'info1') {
        const posts = m.options?.intentPosts;
        if (typeof posts === 'string' && posts.trim()) return posts.trim();
      }
    }
  }
  return '未指定岗位';
}

export function cloneResumeConfig(resume: unknown): ResumeConfig {
  return JSON.parse(JSON.stringify(resume ?? {})) as ResumeConfig;
}
