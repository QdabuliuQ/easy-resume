import ModuleActiveStore from './moduleActiveStore';
import { configStore } from './configStore';
import resumeImportStore from './resumeImportStore';
import editHistoryStore from './editHistoryStore';
import { cloudResumeStore } from './cloudResumeStore';

const moduleActiveStore = new ModuleActiveStore();
export {
  moduleActiveStore,
  configStore,
  resumeImportStore,
  editHistoryStore,
  cloudResumeStore,
};
