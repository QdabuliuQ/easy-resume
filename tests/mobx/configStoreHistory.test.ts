import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import defaultResume from '@/json/resume.defaults';
import { configStore, editHistoryStore } from '@/mobx';

function cloneResume() {
  return JSON.parse(JSON.stringify(defaultResume));
}

function resetConfigBaseline() {
  editHistoryStore.clear();
  editHistoryStore.resume();
  configStore.setConfig(cloneResume(), { source: 'reset' });
  editHistoryStore.clear();
}

function info1ModuleId() {
  return configStore.getConfig.pages[0].modules.find((m: { type: string }) => m.type === 'info1')?.id as string;
}

describe('configStore undo/redo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetConfigBaseline();
  });

  afterEach(() => {
    editHistoryStore.clear();
    editHistoryStore.resume();
    vi.useRealTimers();
  });

  describe('setConfig user edits', () => {
    it('undoes and redoes a single edit', () => {
      const base = cloneResume();
      base.name = configStore.getConfig.name;

      configStore.setConfig({ ...configStore.getConfig, name: 'Changed' });
      expect(configStore.getConfig.name).toBe('Changed');
      expect(configStore.canUndo).toBe(false);
      vi.advanceTimersByTime(400);
      expect(configStore.canUndo).toBe(true);

      expect(configStore.undo()).toBe(true);
      expect(configStore.getConfig.name).toBe(base.name);
      expect(configStore.canRedo).toBe(true);

      expect(configStore.redo()).toBe(true);
      expect(configStore.getConfig.name).toBe('Changed');
    });

    it('does not enable undo button during debounced typing', () => {
      configStore.setConfig({ ...configStore.getConfig, name: 'A' });
      configStore.setConfig({ ...configStore.getConfig, name: 'AB' });
      expect(configStore.canUndo).toBe(false);
      expect(editHistoryStore.hasPendingSession).toBe(true);
    });

    it('fully reverts continuous typing via pending session undo', () => {
      const mid = info1ModuleId();
      const originalName = configStore.getConfigOption(mid).name;

      configStore.setConfigOption(mid, { ...configStore.getConfigOption(mid), name: 'A' });
      configStore.setConfigOption(mid, { ...configStore.getConfigOption(mid), name: 'AB' });
      configStore.setConfigOption(mid, { ...configStore.getConfigOption(mid), name: 'ABC' });
      expect(configStore.getConfigOption(mid).name).toBe('ABC');
      expect(configStore.canUndo).toBe(false);

      configStore.undo();
      expect(configStore.getConfigOption(mid).name).toBe(originalName);
    });

    it('debounces rapid setConfig calls into one undo step', () => {
      const baseName = configStore.getConfig.name;

      configStore.setConfig({ ...configStore.getConfig, name: 'A' });
      configStore.setConfig({ ...configStore.getConfig, name: 'AB' });
      configStore.setConfig({ ...configStore.getConfig, name: 'ABC' });
      expect(configStore.getConfig.name).toBe('ABC');
      expect(editHistoryStore.past).toHaveLength(0);

      vi.advanceTimersByTime(400);
      expect(editHistoryStore.past).toHaveLength(1);

      configStore.undo();
      expect(configStore.getConfig.name).toBe(baseName);
    });

    it('records separate undo steps across debounce windows', () => {
      const baseName = configStore.getConfig.name;

      configStore.setConfig({ ...configStore.getConfig, name: 'First' });
      vi.advanceTimersByTime(400);
      configStore.setConfig({ ...configStore.getConfig, name: 'Second' });
      vi.advanceTimersByTime(400);

      configStore.undo();
      expect(configStore.getConfig.name).toBe('First');
      configStore.undo();
      expect(configStore.getConfig.name).toBe(baseName);
    });

    it('records immediately when immediate meta is set', () => {
      configStore.setConfig({ ...configStore.getConfig, name: 'Immediate' }, { immediate: true });
      expect(editHistoryStore.past).toHaveLength(1);
    });

    it('returns false when undo/redo stacks are empty', () => {
      expect(configStore.undo()).toBe(false);
      expect(configStore.redo()).toBe(false);
    });
  });

  describe('setConfigOption user edits', () => {
    it('captures pre-mutation snapshot (not aliased to mutated config)', () => {
      const mid = info1ModuleId();
      const originalName = configStore.getConfigOption(mid).name;

      configStore.setConfigOption(mid, { ...configStore.getConfigOption(mid), name: 'Mutated' });
      vi.advanceTimersByTime(400);

      const savedBefore = editHistoryStore.past[editHistoryStore.past.length - 1] as {
        pages: { modules: { id: string; options: { name: string } }[] }[];
      };
      const savedModule = savedBefore.pages[0].modules.find((m) => m.id === mid);
      expect(savedModule?.options.name).toBe(originalName);

      configStore.undo();
      expect(configStore.getConfigOption(mid).name).toBe(originalName);
    });

    it('undoes and redoes module option changes', () => {
      const mid = info1ModuleId();
      const before = configStore.getConfigOption(mid);
      const nextOption = { ...before, name: '新名字' };

      configStore.setConfigOption(mid, nextOption);
      expect(configStore.getConfigOption(mid).name).toBe('新名字');

      vi.advanceTimersByTime(400);
      expect(configStore.canUndo).toBe(true);
      configStore.undo();
      expect(configStore.getConfigOption(mid).name).toBe(before.name);

      configStore.redo();
      expect(configStore.getConfigOption(mid).name).toBe('新名字');
    });

    it('debounces rapid setConfigOption calls', () => {
      const mid = info1ModuleId();
      const beforeName = configStore.getConfigOption(mid).name;

      configStore.setConfigOption(mid, { ...configStore.getConfigOption(mid), name: 'A' });
      configStore.setConfigOption(mid, { ...configStore.getConfigOption(mid), name: 'AB' });
      vi.advanceTimersByTime(400);

      configStore.undo();
      expect(configStore.getConfigOption(mid).name).toBe(beforeName);
    });

    it('records immediately when immediate meta is set', () => {
      const mid = info1ModuleId();
      configStore.setConfigOption(
        mid,
        { ...configStore.getConfigOption(mid), name: 'Immediate' },
        { immediate: true },
      );
      expect(editHistoryStore.past).toHaveLength(1);
    });
  });

  describe('history skip sources', () => {
    it('does not record reset writes', () => {
      configStore.setConfig({ ...configStore.getConfig, name: 'Reset write' }, { source: 'reset' });
      expect(configStore.canUndo).toBe(false);
    });

    it('does not record while paused', () => {
      editHistoryStore.pause();
      configStore.setConfig({ ...configStore.getConfig, name: 'Paused' });
      vi.advanceTimersByTime(400);
      expect(configStore.canUndo).toBe(false);
      editHistoryStore.resume();
    });

    it('undo/redo do not append new history entries', () => {
      configStore.setConfig({ ...configStore.getConfig, name: 'Edited' }, { immediate: true });
      const pastLen = editHistoryStore.past.length;

      configStore.undo();
      expect(editHistoryStore.past.length).toBe(pastLen - 1);

      configStore.redo();
      expect(editHistoryStore.past.length).toBe(pastLen);
    });
  });

  describe('discrete module operations (immediate)', () => {
    it('records module delete as immediate undo step', () => {
      const config = cloneResume();
      configStore.setConfig(config, { source: 'reset' });
      editHistoryStore.clear();

      const modId = config.pages[0].modules.find((m: { type: string }) => m.type === 'other')?.id;
      expect(modId).toBeTruthy();

      const next = cloneResume();
      next.pages[0].modules = next.pages[0].modules.filter((m: { id: string }) => m.id !== modId);
      configStore.setConfig(next, { immediate: true });

      configStore.undo();
      const restored = configStore.getConfig.pages[0].modules.some((m: { id: string }) => m.id === modId);
      expect(restored).toBe(true);
    });

    it('records module reorder as immediate undo step', () => {
      const config = cloneResume();
      configStore.setConfig(config, { source: 'reset' });
      editHistoryStore.clear();

      const modules = [...config.pages[0].modules];
      const firstId = modules[0]?.id;
      const reordered = [modules[1], modules[0], ...modules.slice(2)];
      configStore.setConfig(
        { ...config, pages: [{ modules: reordered }, ...config.pages.slice(1)] },
        { immediate: true },
      );

      configStore.undo();
      expect(configStore.getConfig.pages[0].modules[0]?.id).toBe(firstId);
    });
  });

  describe('historyRevision', () => {
    it('increments on undo/redo for panel remount', () => {
      configStore.setConfig({ ...configStore.getConfig, name: 'Edited' }, { immediate: true });
      const rev = configStore.historyRevision;
      configStore.undo();
      expect(configStore.historyRevision).toBe(rev + 1);
      configStore.redo();
      expect(configStore.historyRevision).toBe(rev + 2);
    });
  });
});
