import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import defaultResume from '@/json/resume.defaults';
import { configStore, editHistoryStore } from '@/mobx';
import { resetEditSessionState } from '@/mobx/resetEditSessionState';

function cloneResume() {
  return JSON.parse(JSON.stringify(defaultResume));
}

function resetConfigBaseline() {
  editHistoryStore.clear();
  editHistoryStore.resume();
  configStore.setConfig(cloneResume(), { source: 'reset' });
  editHistoryStore.clear();
}

/** 模拟 useResumeImport：clear + pause + 流式 reset 写入 + resume */
function simulateResumeImportParsing() {
  editHistoryStore.clear();
  editHistoryStore.pause();

  configStore.setConfig({ ...configStore.getConfig, name: 'Cleared' }, { source: 'reset' });
  configStore.setConfig({ ...configStore.getConfig, name: 'Partial 1' }, { source: 'reset' });
  configStore.setConfig({ ...configStore.getConfig, name: 'Partial 2' }, { source: 'reset' });
  configStore.setConfig({ ...configStore.getConfig, name: 'Imported Final' }, { source: 'reset' });

  editHistoryStore.resume();
}

/** 模拟菜单 JSON 导入 */
function simulateJsonImport() {
  editHistoryStore.clear();
  configStore.setConfig({ ...cloneResume(), name: 'Imported JSON' }, { source: 'reset' });
}

/** 模拟模板替换 */
function simulateTemplateReplace() {
  editHistoryStore.clear();
  configStore.setConfig({ ...cloneResume(), name: 'Template Applied' }, { source: 'reset' });
}

describe('edit history lifecycle scenarios', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetConfigBaseline();
  });

  afterEach(() => {
    editHistoryStore.clear();
    editHistoryStore.resume();
    vi.useRealTimers();
  });

  describe('import resume (AI parse)', () => {
    it('does not record history during paused streaming import', () => {
      simulateResumeImportParsing();
      expect(configStore.getConfig.name).toBe('Imported Final');
      expect(configStore.canUndo).toBe(false);
    });

    it('allows undo only for edits after import completes', () => {
      simulateResumeImportParsing();

      configStore.setConfig({ ...configStore.getConfig, name: 'Post Import Edit' });
      vi.advanceTimersByTime(400);

      configStore.undo();
      expect(configStore.getConfig.name).toBe('Imported Final');
      expect(configStore.canUndo).toBe(false);
    });

    it('clears prior history when import starts', () => {
      configStore.setConfig({ ...configStore.getConfig, name: 'Before Import' }, { immediate: true });
      expect(configStore.canUndo).toBe(true);

      editHistoryStore.clear();
      editHistoryStore.pause();
      configStore.setConfig({ ...configStore.getConfig, name: 'During Import' }, { source: 'reset' });
      editHistoryStore.resume();

      expect(configStore.canUndo).toBe(false);
    });

    it('does not record import failure rollback while paused', () => {
      const snapshot = cloneResume();
      snapshot.name = 'Before Import';

      editHistoryStore.clear();
      editHistoryStore.pause();
      configStore.setConfig({ ...snapshot, name: 'During Import' }, { source: 'reset' });
      configStore.setConfig(cloneResume(), { source: 'reset' });
      editHistoryStore.resume();

      expect(configStore.canUndo).toBe(false);
    });
  });

  describe('JSON import', () => {
    it('clears history and leaves no undo after import', () => {
      configStore.setConfig({ ...configStore.getConfig, name: 'User Edit' }, { immediate: true });
      simulateJsonImport();

      expect(configStore.getConfig.name).toBe('Imported JSON');
      expect(configStore.canUndo).toBe(false);
    });
  });

  describe('template replace', () => {
    it('clears history and leaves no undo after template apply', () => {
      configStore.setConfig({ ...configStore.getConfig, name: 'User Edit' }, { immediate: true });
      simulateTemplateReplace();

      expect(configStore.getConfig.name).toBe('Template Applied');
      expect(configStore.canUndo).toBe(false);
    });

    it('allows undo for post-template edits only', () => {
      simulateTemplateReplace();
      configStore.setConfig({ ...configStore.getConfig, name: 'After Template Edit' }, { immediate: true });

      configStore.undo();
      expect(configStore.getConfig.name).toBe('Template Applied');
    });
  });

  describe('initial load / URL template', () => {
    it('reset baseline does not create undo history', () => {
      resetConfigBaseline();
      expect(configStore.canUndo).toBe(false);
    });

    it('simulated URL template load clears prior edits', () => {
      configStore.setConfig({ ...configStore.getConfig, name: 'Prior Edit' }, { immediate: true });
      editHistoryStore.clear();
      configStore.setConfig({ ...cloneResume(), name: 'URL Template' }, { source: 'reset' });

      expect(configStore.getConfig.name).toBe('URL Template');
      expect(configStore.canUndo).toBe(false);
    });
  });

  describe('leave edit session', () => {
    it('resetEditSessionState clears history stack', () => {
      configStore.setConfig({ ...configStore.getConfig, name: 'Edited' }, { immediate: true });
      expect(configStore.canUndo).toBe(true);

      resetEditSessionState();
      expect(configStore.canUndo).toBe(false);
    });
  });

  describe('canvas defensive normalize', () => {
    it('reset source normalize does not pollute undo stack', () => {
      configStore.setConfig({ ...configStore.getConfig, name: 'Edited' }, { immediate: true });
      const pastLen = editHistoryStore.past.length;

      configStore.setConfig(configStore.getConfig, { source: 'reset' });
      expect(editHistoryStore.past.length).toBe(pastLen);
    });
  });

  describe('keyboard-eligible multi-step workflow', () => {
    it('supports undo then new edit clearing redo branch', () => {
      const base = configStore.getConfig.name;

      configStore.setConfig({ ...configStore.getConfig, name: 'Step 1' }, { immediate: true });
      configStore.setConfig({ ...configStore.getConfig, name: 'Step 2' }, { immediate: true });
      configStore.undo();
      expect(configStore.canRedo).toBe(true);

      configStore.setConfig({ ...configStore.getConfig, name: 'Branch Edit' }, { immediate: true });
      expect(configStore.canRedo).toBe(false);

      configStore.undo();
      expect(configStore.getConfig.name).toBe('Step 1');

      configStore.undo();
      expect(configStore.getConfig.name).toBe(base);
    });
  });
});
