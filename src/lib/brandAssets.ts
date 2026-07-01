export const BRAND_CDN_BASE = 'https://img.qdabuliuq.cn/easy-resume';

const cdn = (filename: string) => `${BRAND_CDN_BASE}/${filename}`;

export const logo = cdn('logo.png');
export const preview = cdn('preview.webp');
export const previewLight = cdn('preview_light.webp');
export const bgDark = cdn('bg_dark.svg');
export const bgLight = cdn('bg_light.svg');
export const photo1Dark = cdn('photo1.webp');
export const photo1Light = cdn('photo1_light.webp');
export const photo2Dark = cdn('photo2.webp');
export const photo2Light = cdn('photo2_light.webp');
export const photo3 = cdn('photo3.png');
export const photo3Light = cdn('photo3_light.png');
export const photo4 = cdn('photo4.png');
export const photo4Light = cdn('photo4_light.png');
export const photo5 = cdn('photo5.png');
export const photo5Light = cdn('photo5_light.png');

export const PHOTOS = {
  photo1Dark,
  photo1Light,
  photo2Dark,
  photo2Light,
} as const;

export const PHOTO_SIZES = {
  photo1: { width: 1672, height: 941 },
  photo2: { width: 1672, height: 941 },
} as const;

export const SITE_OG_PREVIEW_WIDTH = 1920;
export const SITE_OG_PREVIEW_HEIGHT = 993;

export function getSiteOgPreviewImage(): string {
  return preview;
}
