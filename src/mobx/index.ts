import InstanceStore from "./instanceStore"
import ModuleActiveStore from "./moduleActiveStore"
import ConfigStore from "./configStore"

const moduleActiveStore = new ModuleActiveStore()
const instanceStore = new InstanceStore()
const configStore = new ConfigStore()
export {
    moduleActiveStore,
    instanceStore,
    configStore
}