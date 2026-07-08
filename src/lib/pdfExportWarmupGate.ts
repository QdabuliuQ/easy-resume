/** 是否应在 Node 服务启动时预热 Puppeteer（仅生产 next start） */
export function shouldWarmupPdfBrowser(): boolean {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return false;
  if (process.env.NODE_ENV !== 'production') return false;
  if (process.env.PDF_EXPORT_WARMUP === '0') return false;
  return true;
}
