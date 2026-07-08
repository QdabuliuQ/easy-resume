import { resumeExportFontFacesCss } from '@/lib/resumeFont';

/** 服务端 PDF 导出：仅注入本地 TTF，不请求 Google Fonts */
export function resumePdfFontLinkTags(
  font: unknown,
  opts?: { assetOrigin?: string },
): string {
  const origin = (opts?.assetOrigin ?? '').replace(/\/$/, '');
  const css = resumeExportFontFacesCss(origin, font);
  return css ? `<style>${css}</style>` : '';
}
