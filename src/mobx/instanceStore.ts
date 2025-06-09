import { makeAutoObservable } from 'mobx';

export default class InstanceStore {
  instances: Array<fabric.Canvas> = [];

  constructor() {
    makeAutoObservable(this);
  }

  setInstances(value: Array<fabric.Canvas>) {
    this.instances = value;
  }

  get getInstances(): Array<fabric.Canvas> {
    return this.instances;
  }
}
