import ModuleActiveStore from "./moduleActiveStore"
import ConfigStore from "./configStore"
import resumeImportStore from "./resumeImportStore"
import editHistoryStore from "./editHistoryStore"

const moduleActiveStore = new ModuleActiveStore()
const configStore = new ConfigStore()
export {
    moduleActiveStore,
    configStore,
    resumeImportStore,
    editHistoryStore,
}