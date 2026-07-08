import { makeAutoObservable } from 'mobx';

const MAX_HISTORY = 50;
const DEBOUNCE_MS = 400;

function cloneSnapshot(value: unknown): unknown {
  if (value == null || typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value));
}

function snapshotEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

class EditHistoryStore {
  past: unknown[] = [];
  future: unknown[] = [];
  paused = false;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingBefore: unknown | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  /** 已入栈、可撤回的历史（debounce 期间不点亮按钮） */
  get canUndo() {
    return this.past.length > 0;
  }

  get hasPendingSession() {
    return this.pendingBefore != null;
  }

  get canRedo() {
    return this.future.length > 0;
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  clear() {
    this.cancelPending();
    this.past = [];
    this.future = [];
  }

  cancelPending() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingBefore = null;
  }

  flushPending() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.pendingBefore != null) {
      this.pushPast(this.pendingBefore);
      this.pendingBefore = null;
    }
  }

  private pushPast(snapshot: unknown) {
    const cloned = cloneSnapshot(snapshot);
    const top = this.past[this.past.length - 1];
    if (top != null && snapshotEqual(top, cloned)) return;
    this.past.push(cloned);
    if (this.past.length > MAX_HISTORY) this.past.shift();
  }

  recordBefore(before: unknown) {
    if (this.paused || before == null) return;
    this.cancelPending();
    this.future = [];
    this.pushPast(before);
  }

  scheduleRecordBefore(before: unknown) {
    if (this.paused || before == null) return;
    this.future = [];
    if (this.pendingBefore == null) {
      this.pendingBefore = cloneSnapshot(before);
    }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      if (this.pendingBefore != null) {
        this.pushPast(this.pendingBefore);
        this.pendingBefore = null;
      }
    }, DEBOUNCE_MS);
  }

  popUndo(current: unknown): unknown | null {
    if (this.pendingBefore != null) {
      const target = cloneSnapshot(this.pendingBefore);
      this.cancelPending();
      if (current != null) this.future.push(cloneSnapshot(current));
      return target;
    }
    if (!this.past.length) return null;
    const prev = this.past.pop()!;
    if (current != null) this.future.push(cloneSnapshot(current));
    return prev;
  }

  popRedo(current: unknown): unknown | null {
    this.cancelPending();
    if (!this.future.length) return null;
    const next = this.future.pop()!;
    if (current != null) this.past.push(cloneSnapshot(current));
    return next;
  }
}

export default new EditHistoryStore();
