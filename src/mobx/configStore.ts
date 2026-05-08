import { makeAutoObservable } from 'mobx';
import defaultResume from '@/json/resume';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import type { GlobalStyle } from '@/modules/utils/common.type';

export default class ConfigStore {
  config: any = null;
  exportPages: any[] | null = null;

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

  setConfig(value: any) {
    if (!value || typeof value !== 'object') {
      this.config = value;
      return;
    }
    const v = JSON.parse(JSON.stringify(value));
    if (v.globalStyle && typeof v.globalStyle === 'object') {
      v.globalStyle = mergeGlobalStylePaper(
        defaultResume.globalStyle as GlobalStyle,
        v.globalStyle
      );
    }
    this.config = v;
  }

  setExportPages(value: any[] | null) {
    this.exportPages = value ? JSON.parse(JSON.stringify(value)) : null;
  }

  setConfigOption(id: string, option: any) {
    for (const page of this.config.pages) {
      for (const module of page.modules) {
        if (module.id === id) {
          module.options = option;
          this.config = JSON.parse(JSON.stringify(this.config));
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
