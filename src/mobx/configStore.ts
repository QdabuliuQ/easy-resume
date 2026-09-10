import { makeAutoObservable } from 'mobx';
import defaultResume from '@/json/resume.defaults';
import { resolveResumeAvatarRefsDeep } from '@/lib/resumeAvatarRef';
import { scheduleResumeConfigBackup } from '@/lib/resumeConfigBackup';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import type { GlobalStyle } from '@/modules/utils/common.type';
import { ensureResumeModuleItemsId } from '@/utils/createResumeModule';
import editHistoryStore from '@/mobx/editHistoryStore';

export type ConfigWriteSource = 'user' | 'undo' | 'redo' | 'reset' | 'hydrate';

export type ConfigWriteMeta = {
  source?: ConfigWriteSource;
  /** 离散操作立即入栈，不走 debounce */
  immediate?: boolean;
  /** 草稿写入仅更新画布，不记录历史、备份或云端自动保存 */
  draft?: boolean;
};

function notifyCloudResume(source?: ConfigWriteSource) {
  if (typeof window === 'undefined') return;
  void import('@/mobx/cloudResumeStore').then(({ cloudResumeStore }) => {
    cloudResumeStore.onConfigWrite(source);
  });
}

function cloneWrittenValue<T>(value: T): T {
  if (value == null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

export default class ConfigStore {
  config: any = null;
  exportPages: any[] | null = null;
  /** undo/redo 后递增，驱动面板非受控字段 remount */
  historyRevision = 0;

  constructor() {
    makeAutoObservable(this);
  }

  /** 默认 resume 与用户配置叠加，画布/侧边布局应读此 getter，勿手写 import resume */
  get mergedGlobalStyle() {
    return mergeGlobalStylePaper(
      defaultResume.globalStyle as GlobalStyle,
      this.config?.globalStyle ?? {}
    );
  }

  get canUndo() {
    return editHistoryStore.canUndo;
  }

  get canRedo() {
    return editHistoryStore.canRedo;
  }

  private shouldRecordHistory(meta?: ConfigWriteMeta) {
    return (meta?.source ?? 'user') === 'user' && !editHistoryStore.paused;
  }

  private recordHistoryBefore(before: unknown, meta?: ConfigWriteMeta) {
    if (!this.shouldRecordHistory(meta) || before == null) return;
    if (meta?.immediate) editHistoryStore.recordBefore(before);
    else editHistoryStore.scheduleRecordBefore(before);
  }

  private applyConfig(value: any, meta?: ConfigWriteMeta) {
    if (!value || typeof value !== 'object') {
      this.config = value;
      return;
    }
    const v = JSON.parse(JSON.stringify(value));
    const hasValidPages =
      Array.isArray(v.pages) &&
      v.pages.some((p: any) => Array.isArray(p?.modules) && p.modules.length > 0);
    if (!hasValidPages) {
      // 防御历史异常数据：pages 为空时恢复默认模块，避免编辑面板无可编辑项
      v.pages = JSON.parse(JSON.stringify(defaultResume.pages ?? []));
      if (typeof console !== 'undefined') {
        console.warn('[ConfigStore] invalid empty pages detected, fallback to default pages');
      }
    }
    if (v.globalStyle && typeof v.globalStyle === 'object') {
      v.globalStyle = mergeGlobalStylePaper(
        defaultResume.globalStyle as GlobalStyle,
        v.globalStyle
      );
    }
    const normalizedPages = v.pages.map((page: any) => ({
      ...page,
      modules: Array.isArray(page.modules)
        ? page.modules.map((module: any) =>
            ['job', 'project', 'education', 'certificate'].includes(module?.type)
              ? ensureResumeModuleItemsId(module)
              : module,
          )
        : page.modules,
    }));
    v.pages = normalizedPages;
    this.config = resolveResumeAvatarRefsDeep(v);
    if (typeof window !== 'undefined' && !meta?.draft) scheduleResumeConfigBackup(v);
  }

  setConfig(value: any, meta?: ConfigWriteMeta) {
    const before =
      meta?.draft || this.config == null ? null : JSON.parse(JSON.stringify(this.config));
    this.applyConfig(value, meta);
    if (!meta?.draft) {
      this.recordHistoryBefore(before, meta);
      notifyCloudResume(meta?.source ?? 'user');
    }
  }

  undo() {
    const snapshot = editHistoryStore.popUndo(this.config);
    if (snapshot == null) return false;
    this.applyConfig(snapshot);
    this.historyRevision += 1;
    notifyCloudResume('undo');
    return true;
  }

  redo() {
    const snapshot = editHistoryStore.popRedo(this.config);
    if (snapshot == null) return false;
    this.applyConfig(snapshot);
    this.historyRevision += 1;
    notifyCloudResume('redo');
    return true;
  }

  setExportPages(value: any[] | null) {
    this.exportPages = value ? JSON.parse(JSON.stringify(value)) : null;
  }

  private commitIncrementalConfig(nextConfig: any, before: unknown, meta?: ConfigWriteMeta) {
    this.config = nextConfig;
    if (meta?.draft) return;
    this.recordHistoryBefore(before, meta);
    if (typeof window !== 'undefined') scheduleResumeConfigBackup(nextConfig);
    notifyCloudResume(meta?.source ?? 'user');
  }

  /** Patch globalStyle without deep-cloning pages (shared array ref). */
  patchGlobalStyle(patch: Partial<GlobalStyle>, meta?: ConfigWriteMeta) {
    const current = this.config;
    const before =
      meta?.draft
        ? null
        : current != null
          ? JSON.parse(JSON.stringify(current))
          : JSON.parse(JSON.stringify(defaultResume));
    const base =
      current ??
      ({
        ...defaultResume,
        pages: JSON.parse(JSON.stringify(defaultResume.pages ?? [])),
        globalStyle: { ...defaultResume.globalStyle },
      } as typeof defaultResume);
    const next = {
      ...base,
      globalStyle: {
        ...defaultResume.globalStyle,
        ...(base.globalStyle ?? {}),
        ...patch,
      },
    };
    this.commitIncrementalConfig(next, before, meta);
  }

  updateModuleField(
    id: string,
    path: string | string[],
    value: unknown | ((current: unknown) => unknown),
    meta?: ConfigWriteMeta,
  ) {
    if (!this.config?.pages) return false;
    const segments = Array.isArray(path) ? path : path.split('.').filter(Boolean);
    if (!segments.length) return false;

    const before = meta?.draft ? null : JSON.parse(JSON.stringify(this.config));
    let updated = false;
    const pages = this.config.pages.map((page: any) => {
      if (!Array.isArray(page.modules)) return page;
      const modules = page.modules.map((module: any) => {
        if (updated || module?.id !== id) return module;
        const resolveKey = (container: any, segment: string) => {
          if (!Array.isArray(container)) return segment;
          if (/^\d+$/.test(segment)) return Number(segment);
          return container.findIndex((item: any) => item?.id === segment);
        };
        let cursor = module.options;
        if (!cursor || typeof cursor !== 'object') return module;
        const resolvedKeys: Array<string | number> = [];
        for (let i = 0; i < segments.length; i += 1) {
          const key = resolveKey(cursor, segments[i]);
          if (key === -1 || cursor == null || typeof cursor !== 'object' || !(key in cursor)) {
            return module;
          }
          resolvedKeys.push(key);
          if (i < segments.length - 1) cursor = cursor[key];
        }
        const leaf = resolvedKeys[resolvedKeys.length - 1];
        const current = cursor[leaf];
        const nextValue = cloneWrittenValue(
          typeof value === 'function'
            ? (value as (current: unknown) => unknown)(current)
            : value,
        );
        const nextOptions = { ...module.options };
        let nextCursor: any = nextOptions;
        for (let i = 0; i < resolvedKeys.length - 1; i += 1) {
          const key = resolvedKeys[i];
          nextCursor[key] = Array.isArray(nextCursor[key])
            ? [...nextCursor[key]]
            : { ...nextCursor[key] };
          nextCursor = nextCursor[key];
        }
        nextCursor[leaf] = nextValue;
        updated = true;
        return { ...module, options: nextOptions };
      });
      return modules === page.modules ? page : { ...page, modules };
    });
    if (!updated) return false;
    this.commitIncrementalConfig({ ...this.config, pages }, before, meta);
    return true;
  }

  setConfigOption(id: string, option: any, meta?: ConfigWriteMeta) {
    if (!this.config?.pages) return;
    for (let pageIndex = 0; pageIndex < this.config.pages.length; pageIndex += 1) {
      const page = this.config.pages[pageIndex];
      for (let moduleIndex = 0; moduleIndex < page.modules.length; moduleIndex += 1) {
        const module = page.modules[moduleIndex];
        if (module.id === id) {
          const pages = [...this.config.pages];
          pages[pageIndex] = {
            ...page,
            modules: [...page.modules],
          };
          pages[pageIndex].modules[moduleIndex] = { ...module, options: option };
          this.setConfig({ ...this.config, pages }, meta);
          return;
        }
      }
    }
  }

  getConfigOption(id: string) {
    for (const page of this.config.pages) {
      for (const module of page.modules) {
        if (module.id === id) {
          return module.options;
        }
      }
    }
  }

  get getConfig() {
    return this.config;
  }

  get getExportPages() {
    return this.exportPages;
  }
}

const configStore = new ConfigStore();
export { configStore };
