/** 子集字体缓存：内存 LRU + IndexedDB（刷新后二次导出可跳过 woff2/hb） */

const MEM_MAX = 12;
const IDB_NAME = 'easy-resume-pdfkit';
const IDB_STORE = 'subset-fonts';
const IDB_VER = 1;

const mem = new Map<string, Uint8Array>();

export function fingerprintGlyphs(text: string): string {
  const cps: number[] = [];
  for (const ch of text || ' ') {
    cps.push(ch.codePointAt(0) ?? 32);
  }
  cps.sort((a, b) => a - b);
  let h = 2166136261;
  for (const c of cps) {
    h ^= c & 0xff;
    h = Math.imul(h, 16777619);
    h ^= (c >>> 8) & 0xff;
    h = Math.imul(h, 16777619);
    h ^= (c >>> 16) & 0xff;
    h = Math.imul(h, 16777619);
  }
  return `${(h >>> 0).toString(36)}:${cps.length}`;
}

export function subsetCacheKey(fontFile: string, text: string): string {
  return `${fontFile}:${fingerprintGlyphs(text)}`;
}

function memGet(key: string): Uint8Array | undefined {
  const hit = mem.get(key);
  if (!hit) return undefined;
  mem.delete(key);
  mem.set(key, hit);
  return hit;
}

function memSet(key: string, value: Uint8Array) {
  if (mem.has(key)) mem.delete(key);
  mem.set(key, value);
  while (mem.size > MEM_MAX) {
    const oldest = mem.keys().next().value;
    if (oldest == null) break;
    mem.delete(oldest);
  }
}

function idbOpen(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VER);
      req.onerror = () => resolve(null);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet(key: string): Promise<Uint8Array | null> {
  const db = await idbOpen();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onerror = () => {
        db.close();
        resolve(null);
      };
      req.onsuccess = () => {
        db.close();
        const v = req.result;
        if (v instanceof ArrayBuffer) resolve(new Uint8Array(v));
        else if (v instanceof Uint8Array) resolve(v);
        else resolve(null);
      };
    } catch {
      try {
        db.close();
      } catch {
        // ignore
      }
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: Uint8Array): Promise<void> {
  const db = await idbOpen();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
      tx.objectStore(IDB_STORE).put(value.slice().buffer, key);
    } catch {
      try {
        db.close();
      } catch {
        // ignore
      }
      resolve();
    }
  });
}

export async function getCachedSubset(key: string): Promise<Uint8Array | null> {
  const hit = memGet(key);
  if (hit) return hit;
  const disk = await idbGet(key);
  if (disk) {
    memSet(key, disk);
    return disk;
  }
  return null;
}

export function setCachedSubset(key: string, value: Uint8Array): void {
  memSet(key, value);
  void idbSet(key, value);
}
