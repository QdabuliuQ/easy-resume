import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import editHistoryStore from '@/mobx/editHistoryStore';

describe('editHistoryStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    editHistoryStore.clear();
    editHistoryStore.resume();
  });

  afterEach(() => {
    editHistoryStore.clear();
    editHistoryStore.resume();
    vi.useRealTimers();
  });

  describe('recordBefore (immediate)', () => {
    it('records snapshot and enables undo', () => {
      editHistoryStore.recordBefore({ name: 'a' });
      expect(editHistoryStore.canUndo).toBe(true);
      expect(editHistoryStore.past).toHaveLength(1);
    });

    it('supports undo then redo round-trip', () => {
      const a = { name: 'a' };
      const b = { name: 'b' };

      editHistoryStore.recordBefore(a);
      expect(editHistoryStore.popUndo(b)).toEqual(a);
      expect(editHistoryStore.canRedo).toBe(true);

      expect(editHistoryStore.popRedo(a)).toEqual(b);
      expect(editHistoryStore.canUndo).toBe(true);
      expect(editHistoryStore.canRedo).toBe(false);
    });

    it('clears pending debounce before pushing', () => {
      editHistoryStore.scheduleRecordBefore({ v: 'pending' });
      editHistoryStore.recordBefore({ v: 'immediate' });

      vi.advanceTimersByTime(400);
      expect(editHistoryStore.past).toEqual([{ v: 'immediate' }]);
    });

    it('clears redo stack on new immediate edit', () => {
      editHistoryStore.recordBefore({ v: 1 });
      editHistoryStore.popUndo({ v: 2 });
      expect(editHistoryStore.canRedo).toBe(true);

      editHistoryStore.recordBefore({ v: 2 });
      expect(editHistoryStore.canRedo).toBe(false);
    });

    it('ignores null before snapshot', () => {
      editHistoryStore.recordBefore(null);
      expect(editHistoryStore.canUndo).toBe(false);
    });

    it('deduplicates identical consecutive snapshots', () => {
      const snap = { v: 1 };
      editHistoryStore.recordBefore(snap);
      editHistoryStore.recordBefore(JSON.parse(JSON.stringify(snap)));
      expect(editHistoryStore.past).toHaveLength(1);
    });

    it('keeps distinct consecutive snapshots', () => {
      editHistoryStore.recordBefore({ v: 1 });
      editHistoryStore.recordBefore({ v: 2 });
      expect(editHistoryStore.past).toHaveLength(2);
    });
  });

  describe('scheduleRecordBefore (debounced)', () => {
    it('tracks pending session separately from canUndo', () => {
      editHistoryStore.scheduleRecordBefore({ v: 1 });
      expect(editHistoryStore.past).toHaveLength(0);
      expect(editHistoryStore.canUndo).toBe(false);
      expect(editHistoryStore.hasPendingSession).toBe(true);
    });

    it('merges rapid calls into one entry using first before snapshot', () => {
      editHistoryStore.scheduleRecordBefore({ v: 1 });
      editHistoryStore.scheduleRecordBefore({ v: 2 });
      editHistoryStore.scheduleRecordBefore({ v: 3 });
      expect(editHistoryStore.past).toHaveLength(0);

      vi.advanceTimersByTime(400);
      expect(editHistoryStore.past).toHaveLength(1);
      expect(editHistoryStore.past[0]).toEqual({ v: 1 });
    });

    it('creates separate entries after debounce windows', () => {
      editHistoryStore.scheduleRecordBefore({ v: 1 });
      vi.advanceTimersByTime(400);
      editHistoryStore.scheduleRecordBefore({ v: 2 });
      vi.advanceTimersByTime(400);

      expect(editHistoryStore.past).toEqual([{ v: 1 }, { v: 2 }]);
    });

    it('clears redo stack when scheduling new debounced edit', () => {
      editHistoryStore.recordBefore({ v: 1 });
      editHistoryStore.popUndo({ v: 2 });
      expect(editHistoryStore.canRedo).toBe(true);

      editHistoryStore.scheduleRecordBefore({ v: 2 });
      expect(editHistoryStore.canRedo).toBe(false);
    });

    it('ignores null before snapshot', () => {
      editHistoryStore.scheduleRecordBefore(null);
      vi.advanceTimersByTime(400);
      expect(editHistoryStore.past).toHaveLength(0);
      expect(editHistoryStore.canUndo).toBe(false);
    });
  });

  describe('popUndo / popRedo', () => {
    it('returns null when stacks are empty', () => {
      expect(editHistoryStore.popUndo({ v: 1 })).toBeNull();
      expect(editHistoryStore.popRedo({ v: 1 })).toBeNull();
    });

    it('reverts pending typing session without pushing to past', () => {
      editHistoryStore.scheduleRecordBefore({ v: 1 });
      editHistoryStore.scheduleRecordBefore({ v: 2 });
      expect(editHistoryStore.popUndo({ v: 'typed' })).toEqual({ v: 1 });
      expect(editHistoryStore.past).toHaveLength(0);
      expect(editHistoryStore.hasPendingSession).toBe(false);
      expect(editHistoryStore.future).toEqual([{ v: 'typed' }]);
    });

    it('does not flush pending to past before undo', () => {
      editHistoryStore.recordBefore({ v: 0 });
      editHistoryStore.scheduleRecordBefore({ v: 1 });
      expect(editHistoryStore.popUndo({ v: 2 })).toEqual({ v: 1 });
      expect(editHistoryStore.past).toEqual([{ v: 0 }]);
    });

    it('pushes current config to future on undo', () => {
      editHistoryStore.recordBefore({ v: 1 });
      editHistoryStore.popUndo({ v: 2 });
      expect(editHistoryStore.future).toEqual([{ v: 2 }]);
    });

    it('clears redo when debounced edit starts after undo', () => {
      editHistoryStore.recordBefore({ v: 1 });
      editHistoryStore.popUndo({ v: 2 });
      expect(editHistoryStore.canRedo).toBe(true);
      editHistoryStore.scheduleRecordBefore({ v: 2 });
      expect(editHistoryStore.canRedo).toBe(false);
      expect(editHistoryStore.popRedo({ v: 3 })).toBeNull();
    });

    it('pushes current config to past on redo', () => {
      editHistoryStore.recordBefore({ v: 1 });
      editHistoryStore.popUndo({ v: 2 });
      editHistoryStore.popRedo({ v: 1 });
      expect(editHistoryStore.past).toEqual([{ v: 1 }]);
      expect(editHistoryStore.future).toHaveLength(0);
    });

    it('supports multi-step undo then redo chain', () => {
      editHistoryStore.recordBefore({ step: 0 });
      editHistoryStore.recordBefore({ step: 1 });
      editHistoryStore.recordBefore({ step: 2 });

      expect(editHistoryStore.popUndo({ step: 3 })).toEqual({ step: 2 });
      expect(editHistoryStore.popUndo({ step: 2 })).toEqual({ step: 1 });
      expect(editHistoryStore.popUndo({ step: 1 })).toEqual({ step: 0 });

      expect(editHistoryStore.popRedo({ step: 0 })).toEqual({ step: 1 });
      expect(editHistoryStore.popRedo({ step: 1 })).toEqual({ step: 2 });
      expect(editHistoryStore.popRedo({ step: 2 })).toEqual({ step: 3 });
    });
  });

  describe('clear / cancelPending / flushPending', () => {
    it('clear removes stacks and pending debounce', () => {
      editHistoryStore.scheduleRecordBefore({ v: 1 });
      editHistoryStore.recordBefore({ v: 2 });
      editHistoryStore.popUndo({ v: 3 });

      editHistoryStore.clear();
      expect(editHistoryStore.canUndo).toBe(false);
      expect(editHistoryStore.canRedo).toBe(false);

      vi.advanceTimersByTime(400);
      expect(editHistoryStore.past).toHaveLength(0);
    });

    it('cancelPending drops scheduled snapshot without flushing', () => {
      editHistoryStore.scheduleRecordBefore({ v: 1 });
      editHistoryStore.cancelPending();
      expect(editHistoryStore.canUndo).toBe(false);

      vi.advanceTimersByTime(400);
      expect(editHistoryStore.past).toHaveLength(0);
    });

    it('flushPending commits pending snapshot to past', () => {
      editHistoryStore.scheduleRecordBefore({ v: 1 });
      editHistoryStore.flushPending();
      expect(editHistoryStore.past).toEqual([{ v: 1 }]);
      expect(editHistoryStore.canUndo).toBe(true);
    });
  });

  describe('pause / resume', () => {
    it('skips recording while paused', () => {
      editHistoryStore.pause();
      editHistoryStore.recordBefore({ v: 1 });
      editHistoryStore.scheduleRecordBefore({ v: 2 });
      vi.advanceTimersByTime(400);
      expect(editHistoryStore.canUndo).toBe(false);
    });

    it('records again after resume', () => {
      editHistoryStore.pause();
      editHistoryStore.recordBefore({ v: 1 });
      editHistoryStore.resume();
      editHistoryStore.recordBefore({ v: 2 });
      expect(editHistoryStore.past).toEqual([{ v: 2 }]);
    });
  });

  describe('capacity', () => {
    it('caps past stack at 50 entries', () => {
      for (let i = 0; i < 52; i += 1) {
        editHistoryStore.recordBefore({ i });
      }
      expect(editHistoryStore.past).toHaveLength(50);
      expect(editHistoryStore.past[0]).toEqual({ i: 2 });
      expect(editHistoryStore.past[49]).toEqual({ i: 51 });
    });
  });
});
