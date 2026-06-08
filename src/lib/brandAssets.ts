import logo from '@/assets/brand/logo.png';
import preview from '@/assets/brand/preview.webp';
import previewLight from '@/assets/brand/preview_light.webp';
import { getSiteUrl } from '@/lib/siteMeta';

export { logo, preview, previewLight };

export const SITE_OG_PREVIEW_WIDTH = preview.width;
export const SITE_OG_PREVIEW_HEIGHT = preview.height;

export function getSiteOgPreviewImage(): string {
  return new URL(preview.src, getSiteUrl()).href;
}
