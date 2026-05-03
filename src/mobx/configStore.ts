import { makeAutoObservable } from 'mobx';
import defaultResume from '@/json/resume';

export default class ConfigStore {
  config: any = null;

  constructor() {
    makeAutoObservable(this);
  }

  /** 默认 resume 与用户配置叠加，画布/侧边布局应读此 getter，勿手写 import resume */
  get mergedGlobalStyle() {
    return {
      ...defaultResume.globalStyle,
      ...(this.config?.globalStyle ?? {}),
    };
  }

  setConfig(value: any) {
    this.config = value;
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
}
