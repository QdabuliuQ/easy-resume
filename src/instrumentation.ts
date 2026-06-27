/** Next 服务启动时预热 Puppeteer 全局 Browser 单例 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { warmupSharedBrowser } = await import('@/lib/puppeteerSharedBrowser');
  await warmupSharedBrowser().catch(() => undefined);
}
