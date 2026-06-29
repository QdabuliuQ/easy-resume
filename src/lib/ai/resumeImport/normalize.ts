import type { ImportedModule } from '@/lib/ai/resumeImport/schema';

const MODULE_TYPES = new Set([
  'info1',
  'certificate',
  'education',
  'job',
  'project',
  'skill',
  'other',
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function normalizeModuleEntry(type: string, options: unknown): ImportedModule | null {
  if (!MODULE_TYPES.has(type)) return null;
  const t = type as ImportedModule['type'];
  if (!isRecord(options)) return { type: t, options: {} };
  return { type: t, options };
}

function normalizeModulesField(modules: unknown): ImportedModule[] {
  if (Array.isArray(modules)) {
    const out: ImportedModule[] = [];
    for (const item of modules) {
      if (!isRecord(item)) continue;
      const type = typeof item.type === 'string' ? item.type : '';
      const mod = normalizeModuleEntry(type, item.options ?? item);
      if (mod) out.push(mod);
    }
    return out;
  }
  if (isRecord(modules)) {
    const out: ImportedModule[] = [];
    for (const [type, options] of Object.entries(modules)) {
      const mod = normalizeModuleEntry(type, options);
      if (mod) out.push(mod);
    }
    return out;
  }
  return [];
}

/** 修正 LLM 常见结构偏差：modules 对象 → 数组；多页 PDF → 合并为单页 */
export function normalizeImportedPagesRaw(raw: Record<string, unknown>): Record<string, unknown> {
  const pages = raw.pages;
  if (!Array.isArray(pages)) return raw;

  const mergedModules: ImportedModule[] = [];
  for (const page of pages) {
    if (!isRecord(page)) continue;
    mergedModules.push(...normalizeModulesField(page.modules));
  }

  if (!mergedModules.length) return { pages: [{ modules: [] }] };
  return { pages: [{ modules: mergedModules }] };
}
