export const SYSTEM_PATH_STORAGE_KEY = 'easy-resume-system-path';
export function getSystemPath() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(SYSTEM_PATH_STORAGE_KEY) ?? '';
}
export function setSystemPath(p: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SYSTEM_PATH_STORAGE_KEY, p);
}
