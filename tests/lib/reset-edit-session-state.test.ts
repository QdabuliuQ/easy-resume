import { describe, expect, it } from 'vitest';
import { configStore, moduleActiveStore, resumeImportStore } from '@/mobx';
import { resetEditSessionState } from '@/mobx/resetEditSessionState';

describe('resetEditSessionState', () => {
  it('restores edit UI defaults on leave', () => {
    moduleActiveStore.setModuleActive('job-1');
    resumeImportStore.setActive(true, 'parsing');
    configStore.setExportPages([{ modules: [] }]);
    resetEditSessionState();
    expect(moduleActiveStore.getModuleActive).toBe('global');
    expect(resumeImportStore.loading).toBe(false);
    expect(resumeImportStore.statusText).toBe('');
    expect(configStore.getExportPages).toBeNull();
  });
});
