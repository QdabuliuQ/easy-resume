import InstanceStore from "./instanceStore"
import ModuleActiveStore from "./moduleActiveStore"


const moduleActiveStore = new ModuleActiveStore()
const instanceStore = new InstanceStore()
export {
    moduleActiveStore,
    instanceStore
}