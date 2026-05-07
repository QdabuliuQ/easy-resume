import ModuleActiveStore from "./moduleActiveStore"
import ConfigStore from "./configStore"

const moduleActiveStore = new ModuleActiveStore()
const configStore = new ConfigStore()
export {
    moduleActiveStore,
    configStore
}