/** 主题偏好（含跟随系统）；`getAppTheme()` 返回解析后的亮/暗用于样式与 Ant Design。 */
export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

const STORAGE_KEY = 'easy-resume-theme';
const listeners = new Set<() => void>();

let preference: ThemePreference = 'dark';
let mediaMq: MediaQueryList | null = null;

function readStored(): ThemePreference {
  if (typeof window === 'undefined') return 'dark';
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'dark';
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function getResolvedTheme(): ResolvedTheme {
  if (typeof window === 'undefined') {
    return preference === 'light' ? 'light' : 'dark';
  }
  if (preference === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return preference;
}

export function getThemePreference(): ThemePreference {
  return preference;
}

function applyResolved() {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = getResolvedTheme();
}

function onMediaChange() {
  if (preference !== 'system') return;
  applyResolved();
  listeners.forEach((fn) => fn());
}

function syncMediaListener() {
  if (typeof window === 'undefined') return;
  if (mediaMq) {
    mediaMq.removeEventListener('change', onMediaChange);
    mediaMq = null;
  }
  if (preference === 'system') {
    mediaMq = window.matchMedia('(prefers-color-scheme: dark)');
    mediaMq.addEventListener('change', onMediaChange);
  }
}

if (typeof window !== 'undefined') {
  preference = readStored();
  applyResolved();
  syncMediaListener();
}

/** @deprecated 使用 getResolvedTheme；保留别名避免大范围改名 */
export function getAppTheme(): ResolvedTheme {
  return getResolvedTheme();
}

/** `preference|resolved`，供 useSyncExternalStore 单订阅同时刷新偏好与解析主题 */
export function getThemeSnapshot(): string {
  return `${preference}|${getResolvedTheme()}`;
}

export function getServerThemeSnapshot(): string {
  return 'dark|dark';
}

export function setAppTheme(next: ThemePreference) {
  if (preference === next) return;
  preference = next;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, next);
  }
  syncMediaListener();
  applyResolved();
  listeners.forEach((fn) => fn());
}

/** 深色 → 浅色 → 跟随系统 → 深色 */
export function toggleAppTheme() {
  const order: ThemePreference[] = ['dark', 'light', 'system'];
  const i = order.indexOf(preference);
  const next = order[(i + 1) % order.length];
  setAppTheme(next);
}

export function subscribeAppTheme(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getServerAppTheme(): ResolvedTheme {
  return 'dark';
}
