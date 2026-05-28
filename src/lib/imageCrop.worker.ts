type CropImageRequest = {
  id: number;
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

type ImageCropWorkerScope = {
  onmessage: ((event: MessageEvent<CropImageRequest>) => void) | null;
  postMessage: (message: CropImageResponse) => void;
};

const ctx = self as unknown as ImageCropWorkerScope;

ctx.onmessage = async (event: MessageEvent<CropImageRequest>) => {
  const { id, source, sx, sy, sw, sh, dw, dh, type = 'image/jpeg', quality = 0.92 } = event.data;
  try {
    const bitmap = await createImageBitmap(source);
    try {
      const canvas = new OffscreenCanvas(dw, dh);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('图片裁剪上下文创建失败');
      context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh);
      const blob = await canvas.convertToBlob({ type, quality });
      ctx.postMessage({ id, blob } satisfies CropImageResponse);
    } finally {
      bitmap.close();
    }
  } catch (e) {
    ctx.postMessage({
      id,
      error: e instanceof Error ? e.message : '图片裁剪失败',
    } satisfies CropImageResponse);
  }
};

export {};