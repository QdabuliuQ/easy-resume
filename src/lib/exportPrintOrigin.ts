/**
 * Puppeteer 打开导出页的根地址。
 * 会话在内存中，必须与创建 token 的 Node 进程同源。
 * 生产默认走本机回环，避免 Puppeteer 经 Nginx/CDN 再请求自身导致超时。
 */
export function resolveExportPrintOrigin(requestOrigin: string): string {
  const explicit = process.env.EXPORT_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') {
    const port = '3010';
    return `http://127.0.0.1:${port}`;
  }
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
