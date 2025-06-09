import { makeAutoObservable } from 'mobx';

export default class ConfigStore {
  config: any = null;

  constructor() {
    makeAutoObservable(this);
  }

  setConfig(value: any) {
    this.config = value;
  }

  get getConfig() {
    return this.config;
  }
}
