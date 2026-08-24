import '@/lib/pdfkitExport/browserEnv';
import wawoff2Module from 'wawoff2/build/decompress_binding.js';

type HbSubset = {
  memory: WebAssembly.Memory;
  malloc: (n: number) => number;
  free: (p: number) => void;
  hb_subset_input_create_or_fail: () => number;
  hb_subset_input_destroy: (input: number) => void;
  hb_subset_input_set: (input: number, set: number) => number;
  hb_subset_input_unicode_set: (input: number) => number;
  hb_set_clear: (set: number) => void;
  hb_set_invert: (set: number) => void;
  hb_set_add: (set: number, v: number) => void;
  hb_blob_create: (
    data: number,
    length: number,
    mode: number,
    userData: number,
    destroy: number,
  ) => number;
  hb_blob_destroy: (blob: number) => void;
  hb_blob_get_data: (blob: number, lengthPtr: number) => number;
  hb_blob_get_length: (blob: number) => number;
  hb_face_create: (blob: number, index: number) => number;
  hb_face_destroy: (face: number) => void;
  hb_face_reference_blob: (face: number) => number;
  hb_subset_or_fail: (face: number, input: number) => number;
};

const HB_MEMORY_MODE_WRITABLE = 2;
const HB_SUBSET_SETS_LAYOUT_FEATURE_TAG = 6;

let hbPromise: Promise<HbSubset> | null = null;

async function loadHb(): Promise<HbSubset> {
  if (!hbPromise) {
    hbPromise = (async () => {
      const res = await fetch('/wasm/hb-subset.wasm');
      if (!res.ok) throw new Error('缺少 hb-subset.wasm');
      const { instance } = await WebAssembly.instantiate(await res.arrayBuffer());
      return instance.exports as unknown as HbSubset;
    })();
  }
  return hbPromise;
}

/** 编辑页预热：实例化 hb + 触发 wawoff2 模块解析 */
export async function preloadHbSubset(): Promise<void> {
  await loadHb();
  try {
    wawoff2();
  } catch {
    // ignore
  }
}

function heap(hb: HbSubset): Uint8Array {
  return new Uint8Array(hb.memory.buffer);
}

function wawoff2(): typeof wawoff2Module {
  const m = wawoff2Module as unknown as {
    decompress?: typeof wawoff2Module['decompress'];
    default?: typeof wawoff2Module;
  };
  if (typeof m.decompress === 'function') return m as typeof wawoff2Module;
  if (m.default) return m.default;
  throw new Error('wawoff2 加载失败');
}

async function decompressWoff2(src: Uint8Array): Promise<Uint8Array> {
  const mod = wawoff2();
  if (!mod.calledRun) {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('字体解压初始化超时')), 20_000);
      const prev = mod.onRuntimeInitialized;
      mod.onRuntimeInitialized = () => {
        clearTimeout(t);
        prev?.();
        resolve();
      };
      if (mod.calledRun) {
        clearTimeout(t);
        resolve();
      }
    });
  }
  const result = mod.decompress(src);
  if (result === false) throw new Error('ConvertWOFF2ToTTF failed');
  return new Uint8Array(result);
}

/** 仅解压 woff2，供 DOCX 字体嵌入在子集失败时保留完整字体。 */
export async function woff2ToSfnt(src: Uint8Array): Promise<Uint8Array> {
  return decompressWoff2(src);
}

/** woff2 → ttf，再 hb-subset；与 subset-font 同路径 */
export async function subsetWoff2ToSfnt(src: Uint8Array, text: string): Promise<Uint8Array> {
  const ttf = await decompressWoff2(src);
  const hb = await loadHb();
  const input = hb.hb_subset_input_create_or_fail();
  if (!input) throw new Error('hb_subset_input_create_or_fail failed');
  const fontBuffer = hb.malloc(ttf.byteLength);
  heap(hb).set(ttf, fontBuffer);
  const blob = hb.hb_blob_create(
    fontBuffer,
    ttf.byteLength,
    HB_MEMORY_MODE_WRITABLE,
    0,
    0,
  );
  const face = hb.hb_face_create(blob, 0);
  hb.hb_blob_destroy(blob);
  const layoutFeatures = hb.hb_subset_input_set(input, HB_SUBSET_SETS_LAYOUT_FEATURE_TAG);
  hb.hb_set_clear(layoutFeatures);
  hb.hb_set_invert(layoutFeatures);
  const unicodes = hb.hb_subset_input_unicode_set(input);
  const glyphs = text || ' ';
  for (const ch of glyphs) hb.hb_set_add(unicodes, ch.codePointAt(0) ?? 32);
  let subset = 0;
  try {
    subset = hb.hb_subset_or_fail(face, input);
    if (!subset) throw new Error('hb_subset_or_fail failed');
  } finally {
    hb.hb_subset_input_destroy(input);
  }
  const result = hb.hb_face_reference_blob(subset);
  const offset = hb.hb_blob_get_data(result, 0);
  const len = hb.hb_blob_get_length(result);
  if (!len) {
    hb.hb_blob_destroy(result);
    hb.hb_face_destroy(subset);
    hb.hb_face_destroy(face);
    hb.free(fontBuffer);
    throw new Error('Failed to create subset font');
  }
  const out = heap(hb).slice(offset, offset + len);
  hb.hb_blob_destroy(result);
  hb.hb_face_destroy(subset);
  hb.hb_face_destroy(face);
  hb.free(fontBuffer);
  return out;
}
