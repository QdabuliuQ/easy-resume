import type { ImportedModule } from '@/lib/ai/resumeImport/schema';
import {
  createEmptyResumeModule,
  ensureResumeModuleItemsId,
  makeResumeItemId,
  type ResumeModuleType,
} from '@/utils/createResumeModule';

export type ResumePageDraft = {
  modules?: ResumeModuleDraft[];
};

export type ResumeModuleDraft = {
  type: string;
  id: string;
  options?: Record<string, unknown>;
};

export type IncomingResumeModuleDraft = {
  type: string;
  options?: Record<string, unknown>;
};

export type IncomingResumePageDraft = {
  modules?: IncomingResumeModuleDraft[];
};

const INFO1_CONTENT_KEYS = [
  'name',
  'phone',
  'email',
  'city',
  'status',
  'intentCity',
  'intentPosts',
  'wechat',
  'birthday',
  'gender',
  'stature',
  'weight',
  'ethnic',
  'origin',
  'maritalStatus',
  'politicalStatus',
  'site',
  'expectedSalary',
] as const;

const INFO1_LAYOUT_ORDER = INFO1_CONTENT_KEYS.filter((k) => k !== 'name');

const LIST_MODULE_TYPES = new Set(['job', 'project', 'education', 'certificate']);

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function hasInfo1Value(key: string, options: Record<string, unknown>): boolean {
  const v = options[key];
  if (v == null || v === '') return false;
  if (key === 'expectedSalary' && Array.isArray(v)) {
    return v.some((x) => x != null && String(x).trim() !== '');
  }
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim() !== '';
}

export function buildInfo1Layout(options: Record<string, unknown>): string[][] {
  const keys = INFO1_LAYOUT_ORDER.filter((k) => hasInfo1Value(k, options));
  if (!keys.length) return [['phone', 'email', 'city']];
  const layout: string[][] = [];
  for (let i = 0; i < keys.length; i += 3) {
    layout.push(keys.slice(i, i + 3));
  }
  return layout;
}

function mergeInfo1Options(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = {
    ...current,
    avatar: current.avatar,
    position: current.position,
  };
  for (const key of INFO1_CONTENT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(incoming, key)) {
      merged[key] = incoming[key];
    } else {
      merged[key] = key === 'expectedSalary' ? ['', ''] : '';
    }
  }
  merged.layout = buildInfo1Layout(merged);
  return merged;
}

function mergeListModuleOptions(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const items = Array.isArray(incoming.items) ? incoming.items : [];
  return {
    ...current,
    ...(typeof incoming.title === 'string' && incoming.title.trim()
      ? { title: incoming.title }
      : {}),
    items: items.filter((it) => isRecord(it)).map((it) => ({ ...it })),
  };
}

function mergeTextModuleOptions(
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...current,
    ...(typeof incoming.title === 'string' && incoming.title.trim()
      ? { title: incoming.title }
      : {}),
    ...(typeof incoming.description === 'string' ? { description: incoming.description } : {}),
  };
}

function mergeModuleOptions(
  type: string,
  current: Record<string, unknown>,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  if (type === 'info1') return mergeInfo1Options(current, incoming);
  if (LIST_MODULE_TYPES.has(type)) return mergeListModuleOptions(current, incoming);
  return mergeTextModuleOptions(current, incoming);
}

function takeIncomingModule(
  pool: Map<string, ImportedModule[]>,
  type: string,
): ImportedModule | undefined {
  const list = pool.get(type);
  if (!list?.length) return undefined;
  return list.shift();
}

function poolIncomingModules(modules: Array<{ type: string; options?: unknown }>): Map<string, ImportedModule[]> {
  const pool = new Map<string, ImportedModule[]>();
  for (const mod of modules) {
    if (!isRecord(mod.options)) continue;
    const entry: ImportedModule = { type: mod.type as ImportedModule['type'], options: mod.options };
    const list = pool.get(mod.type) ?? [];
    list.push(entry);
    pool.set(mod.type, list);
  }
  return pool;
}

function finalizeModule(mod: ResumeModuleDraft): ResumeModuleDraft {
  const withIds = ensureResumeModuleItemsId({
    ...mod,
    id: mod.id?.trim() || makeResumeItemId(),
  });
  return withIds as ResumeModuleDraft;
}

function deriveResumeName(pages: ResumePageDraft[]): string | undefined {
  for (const page of pages) {
    for (const mod of page.modules ?? []) {
      if (mod.type !== 'info1' || !isRecord(mod.options)) continue;
      const name = mod.options.name;
      if (typeof name === 'string' && name.trim()) return name.trim();
    }
  }
  return undefined;
}

/** 识别前清空 page.modules，保留 page 壳与 globalStyle */
export function clearResumePagesForImport(pages: ResumePageDraft[]): ResumePageDraft[] {
  return clone(pages).map((page) => ({ ...page, modules: [] }));
}

/** @deprecated 仅清空字段，保留模块槽位 */
export function clearResumePagesContent(pages: ResumePageDraft[]): ResumePageDraft[] {
  return clone(pages).map((page) => ({
    ...page,
    modules: (page.modules ?? []).map((mod) => {
      const empty = createEmptyResumeModule(mod.type as ResumeModuleType);
      if (mod.type === 'info1' && isRecord(mod.options)) {
        return finalizeModule({
          ...mod,
          id: mod.id,
          options: {
            ...empty.options,
            avatar: mod.options.avatar,
            position: mod.options.position ?? empty.options.position,
          },
        });
      }
      return finalizeModule({ ...mod, id: mod.id, options: empty.options });
    }),
  }));
}

export function clearImportedPagesInConfig<T extends { pages?: ResumePageDraft[]; name?: string }>(
  config: T,
): T {
  const base = clone(config);
  return { ...base, pages: clearResumePagesForImport(base.pages ?? []), name: '' } as T;
}

/** 将 LLM 返回的 pages 合并进当前 config.pages，保留 module.id / avatar / globalStyle */
export function mergeImportedResumePages(
  currentPages: ResumePageDraft[],
  incomingPages: IncomingResumePageDraft[],
): ResumePageDraft[] {
  const current = clone(currentPages);
  const incoming = clone(incomingPages);

  return current.map((page, pageIndex) => {
    const incomingPage = incoming[pageIndex] ?? incoming[0];
    const pool = poolIncomingModules(incomingPage?.modules ?? []);
    const modules = (page.modules ?? []).map((mod) => {
      const hit = takeIncomingModule(pool, mod.type);
      if (!hit?.options || !isRecord(hit.options)) return mod;
      const options = mergeModuleOptions(
        mod.type,
        isRecord(mod.options) ? mod.options : {},
        hit.options,
      );
      return finalizeModule({ ...mod, options });
    });

    for (const [type, list] of Array.from(pool.entries())) {
      for (const extra of list) {
        if (!extra.options || !isRecord(extra.options)) continue;
        const empty = createEmptyResumeModule(type as ResumeModuleType);
        const options = mergeModuleOptions(type, empty.options, extra.options);
        modules.push(finalizeModule({ ...empty, options }));
      }
    }

    return { ...page, modules };
  });
}

export function applyImportedPagesToConfig<T extends { pages?: ResumePageDraft[]; name?: string }>(
  currentConfig: T,
  incomingPages: IncomingResumePageDraft[],
): T {
  const base = clone(currentConfig);
  const pages = mergeImportedResumePages(base.pages ?? [], incomingPages);
  const next = { ...base, pages } as T;
  const name = deriveResumeName(pages);
  if (name) next.name = name;
  return next;
}
