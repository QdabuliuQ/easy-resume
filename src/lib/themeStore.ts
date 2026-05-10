/** 应用主题（黑/白）持久化存储；无本地记录时默认 dark。SSR 快照为 dark。 */
export type AppTheme = 'dark' | 'light';

const STORAGE_KEY = 'easy-resume-theme';
const listeners = new Set<() => void>();

function readStored(): AppTheme {
  if (typeof window === 'undefined') return 'dark';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

let current: AppTheme = 'dark';
if (typeof window !== 'undefined') {
  current = readStored();
  applyTheme(current);
}

export function getAppTheme(): AppTheme {
  return current;
}

export function setAppTheme(next: AppTheme) {
  if (current === next) return;
  current = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  applyTheme(next);
  listeners.forEach((fn) => fn());
}

export function toggleAppTheme() {
  setAppTheme(current === 'dark' ? 'light' : 'dark');
}

export function subscribeAppTheme(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** SSR snapshot（Next.js useSyncExternalStore 需要） */
export function getServerAppTheme(): AppTheme {
  return 'dark';
}
