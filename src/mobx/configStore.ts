import { makeAutoObservable } from 'mobx';
import defaultResume from '@/json/resume.defaults';
import { resolveResumeAvatarRefsDeep } from '@/lib/resumeAvatarRef';
import { scheduleResumeConfigBackup } from '@/lib/resumeConfigBackup';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import type { GlobalStyle } from '@/modules/utils/common.type';
import editHistoryStore from '@/mobx/editHistoryStore';

export type ConfigWriteSource = 'user' | 'undo' | 'redo' | 'reset';

export type ConfigWriteMeta = {
  source?: ConfigWriteSource;
  /** 离散操作立即入栈，不走 debounce */
  immediate?: boolean;
};

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

  private applyConfig(value: any) {
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
    this.config = resolveResumeAvatarRefsDeep(v);
    if (typeof window !== 'undefined') scheduleResumeConfigBackup(v);
  }

  setConfig(value: any, meta?: ConfigWriteMeta) {
    const before =
      this.config == null ? null : JSON.parse(JSON.stringify(this.config));
    this.applyConfig(value);
    this.recordHistoryBefore(before, meta);
  }

  undo() {
    const snapshot = editHistoryStore.popUndo(this.config);
    if (snapshot == null) return false;
    this.applyConfig(snapshot);
    this.historyRevision += 1;
    return true;
  }

  redo() {
    const snapshot = editHistoryStore.popRedo(this.config);
    if (snapshot == null) return false;
    this.applyConfig(snapshot);
    this.historyRevision += 1;
    return true;
  }

  setExportPages(value: any[] | null) {
    this.exportPages = value ? JSON.parse(JSON.stringify(value)) : null;
  }

  setConfigOption(id: string, option: any, meta?: ConfigWriteMeta) {
    if (!this.config?.pages) return;
    const before = JSON.parse(JSON.stringify(this.config));
    for (const page of this.config.pages) {
      for (const module of page.modules) {
        if (module.id === id) {
          module.options = option;
          this.config = JSON.parse(JSON.stringify(this.config));
          this.recordHistoryBefore(before, meta);
          if (typeof window !== 'undefined') scheduleResumeConfigBackup(this.config);
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
