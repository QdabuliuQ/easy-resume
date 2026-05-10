/** 曾用于保存目录句柄，现已改为仅 localStorage 存文件夹名；启动时删除以免误以为仍持久化授权 */
const LEGACY_IDB_NAME = 'easy-resume-fs-access';

export function removeLegacyDirectoryHandleDatabase(): void {
  if (typeof indexedDB === 'undefined') return;
  try {
    indexedDB.deleteDatabase(LEGACY_IDB_NAME);
  } catch {
    /* noop */
  }
}

export function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!supportsDirectoryPicker()) return null;
  try {
    return await window.showDirectoryPicker({ mode: 'readwrite' });
  } catch (e) {
    const err = e as DOMException;
    if (err?.name === 'AbortError') return null;
    throw e;
  }
}

export async function ensureReadWritePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' as const };
  try {
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    return (await handle.requestPermission(opts)) === 'granted';
  } catch {
    return false;
  }
}

export async function writeUtf8TextFile(
  dir: FileSystemDirectoryHandle,
  fileName: string,
  content: string
): Promise<void> {
  const fh = await dir.getFileHandle(fileName, { create: true });
  const w = await fh.createWritable();
  try {
    await w.write(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  } finally {
    await w.close();
  }
}
