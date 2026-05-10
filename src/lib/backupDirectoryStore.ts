const listeners = new Set<() => void>();
let dirHandle: FileSystemDirectoryHandle | null = null;
let permissionOk = false;
let backupReady = false;
function recompute() {
  const next = dirHandle !== null && permissionOk;
  if (next === backupReady) return false;
  backupReady = next;
  return true;
}
export function setBackupDirectoryState(h: FileSystemDirectoryHandle | null, ok: boolean) {
  dirHandle = h;
  permissionOk = ok;
  if (recompute()) listeners.forEach((fn) => fn());
}
export function getBackupReady(): boolean {
  return backupReady;
}
export function getServerBackupReady(): boolean {
  return false;
}
export function subscribeBackupDirectory(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function getBackupDirectoryHandle(): FileSystemDirectoryHandle | null {
  return backupReady ? dirHandle : null;
}
export function getBackupDirectorySnapshot(): {
  handle: FileSystemDirectoryHandle | null;
  permissionOk: boolean;
} {
  return { handle: dirHandle, permissionOk };
}
