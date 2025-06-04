import { makeAutoObservable } from "mobx";

export default class ModuleActiveStore {
    moduleActive = ""

    constructor() {
        makeAutoObservable(this)
    }

    setModuleActive(value: string) {
        this.moduleActive = value
    }

    get getModuleActive(): string {
        return this.moduleActive
    }
}