/**
 * Puppeteer 打开导出页的根地址。
 * 会话在内存中，必须与创建 token 的实例同源；默认用本次请求的 origin。
 * 仅当部署环境 Puppeteer 无法访问 requestOrigin 时再设 EXPORT_BASE_URL。
 */
export function resolveExportPrintOrigin(requestOrigin: string): string {
  const explicit = process.env.EXPORT_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  return requestOrigin.replace(/\/$/, '');
}

export type ExportResumeMode = 'pdf' | 'image';

export function buildExportResumeUrl(
  origin: string,
  locale: string,
  token: string,
  mode: ExportResumeMode = 'pdf',
): string {
  const loc = locale === 'en' ? 'en' : 'zh';
  const base = `${origin.replace(/\/$/, '')}/${loc}/export/resume?token=${encodeURIComponent(token)}`;
  return mode === 'image' ? `${base}&mode=image` : base;
}
