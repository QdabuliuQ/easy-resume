import { makeAutoObservable } from 'mobx';

class ResumeImportStore {
  loading = false;
  statusText = '';

  constructor() {
    makeAutoObservable(this);
  }

  setActive(loading: boolean, statusText = '') {
    this.loading = loading;
    this.statusText = statusText;
  }
}

export default new ResumeImportStore();
