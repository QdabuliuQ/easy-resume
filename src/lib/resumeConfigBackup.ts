import { getBackupDirectoryHandle } from '@/lib/backupDirectoryStore';
import { ensureReadWritePermission, writeUtf8TextFile } from '@/lib/fileSystemAccessDirectory';

const INVALID = /[/\\?%*:|"<>]/g;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 500;
function safeBase(raw: unknown): string {
  const t = String(raw ?? '').trim().replace(INVALID, '_').replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, 120) : 'resume';
}
export function resumeBackupJsonFileName(config: any): string {
  return `${safeBase(config?.name)}.json`;
}
export async function flushResumeConfigBackup(config: any): Promise<void> {
  if (!config || typeof config !== 'object') return;
  const dir = getBackupDirectoryHandle();
  if (!dir) return;
  if (!(await ensureReadWritePermission(dir))) return;
  await writeUtf8TextFile(dir, resumeBackupJsonFileName(config), JSON.stringify(config, null, 2));
}
export function scheduleResumeConfigBackup(config: any): void {
  if (typeof window === 'undefined' || !config || typeof config !== 'object') return;
  if (!getBackupDirectoryHandle()) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void flushResumeConfigBackup(config);
  }, DEBOUNCE_MS);
}
export function flushResumeBackupImmediate(config: any): void {
  if (typeof window === 'undefined') return;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  void flushResumeConfigBackup(config);
}
