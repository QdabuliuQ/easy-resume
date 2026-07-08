import { configStore, editHistoryStore, moduleActiveStore, resumeImportStore } from '@/mobx';

/** 离开 /edit 时恢复编辑页 UI 态，避免 MobX 单例污染下次进入 */
export function resetEditSessionState() {
  moduleActiveStore.reset();
  resumeImportStore.reset();
  editHistoryStore.clear();
  configStore.setExportPages(null);
}
