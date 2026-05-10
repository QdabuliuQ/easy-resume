/** 曾用于保存目录句柄，现已改为仅 localStorage 存文件夹名；启动时删除以免误以为仍持久化授权 */
const LEGACY_IDB_NAME = 'easy-resume-fs-access';

type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
};

type DirectoryHandleReadWrite = FileSystemDirectoryHandle & {
  queryPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission?(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
};

function win(): WindowWithDirectoryPicker {
  return window as WindowWithDirectoryPicker;
}

export function removeLegacyDirectoryHandleDatabase(): void {
  if (typeof indexedDB === 'undefined') return;
  try {
    indexedDB.deleteDatabase(LEGACY_IDB_NAME);
  } catch {
    /* noop */
  }
}

export function supportsDirectoryPicker(): boolean {
  return typeof window !== 'undefined' && typeof win().showDirectoryPicker === 'function';
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  const pick = win().showDirectoryPicker;
  if (typeof pick !== 'function') return null;
  try {
    return await pick.call(window, { mode: 'readwrite' });
  } catch (e) {
    const err = e as DOMException;
    if (err?.name === 'AbortError') return null;
    throw e;
  }
}

export async function ensureReadWritePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  const h = handle as DirectoryHandleReadWrite;
  const opts = { mode: 'readwrite' as const };
  try {
    const q = h.queryPermission;
    const r = h.requestPermission;
    if (typeof q !== 'function' || typeof r !== 'function') return false;
    if ((await q.call(h, opts)) === 'granted') return true;
    return (await r.call(h, opts)) === 'granted';
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
