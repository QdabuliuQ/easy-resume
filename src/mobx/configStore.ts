import { makeAutoObservable } from 'mobx';

export default class ConfigStore {
  config: any = null;

  constructor() {
    makeAutoObservable(this);
  }

  setConfig(value: any) {
    this.config = value;
  }

  setConfigOption(id: string, option: any) {
    for (const page of this.config.pages) {
      for (const module of page.modules) {
        if (module.id === id) {
          module.options = option;
        }
      }
    }
    this.config = {
      ...this.config,
    };
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
