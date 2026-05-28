'use client';

type CropImageOptions = {
  source: Blob;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dw: number;
  dh: number;
  type?: string;
  quality?: number;
};

type CropImageResponse = {
  id: number;
  blob?: Blob;
  error?: string;
};

let worker: Worker | null = null;
let nextRequestId = 1;
const pending = new Map<number, { resolve: (blob: Blob) => void; reject: (error: Error) => void }>();

function getImageCropWorker(): Worker | null {
  if (typeof window === 'undefined') return null;
  if (!('Worker' in window) || !('OffscreenCanvas' in window) || !('createImageBitmap' in window)) {
    return null;
  }
  if (worker) return worker;
  worker = new Worker(new URL('./imageCrop.worker.ts', import.meta.url));
  worker.onmessage = (event: MessageEvent<CropImageResponse>) => {
    const { id, blob, error } = event.data;
    const request = pending.get(id);
    if (!request) return;
    pending.delete(id);
    if (blob) {
      request.resolve(blob);
    } else {
      request.reject(new Error(error || '图片裁剪失败'));
    }
  };
  worker.onerror = (event) => {
    const error = new Error(event.message || '图片裁剪 Worker 运行失败');
    Array.from(pending.values()).forEach((request) => request.reject(error));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

async function cropImageOnMainThread(opts: CropImageOptions): Promise<Blob> {
  const bitmap = await createImageBitmap(opts.source);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = opts.dw;
    canvas.height = opts.dh;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('图片裁剪上下文创建失败');
    context.drawImage(bitmap, opts.sx, opts.sy, opts.sw, opts.sh, 0, 0, opts.dw, opts.dh);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), opts.type ?? 'image/jpeg', opts.quality ?? 0.92);
    });
    if (!blob) throw new Error('图片编码失败');
    return blob;
  } finally {
    bitmap.close();
  }
}

export async function cropImageBlob(opts: CropImageOptions): Promise<Blob> {
  const imageWorker = getImageCropWorker();
  if (!imageWorker) return cropImageOnMainThread(opts);

  const id = nextRequestId;
  nextRequestId += 1;
  return new Promise<Blob>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    imageWorker.postMessage({ id, ...opts });
  }).catch(async () => cropImageOnMainThread(opts));
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('图片读取失败'));
    reader.readAsDataURL(blob);
  });
}