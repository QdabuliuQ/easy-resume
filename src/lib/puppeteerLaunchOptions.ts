import { existsSync } from 'node:fs';
import type { LaunchOptions } from 'puppeteer';

const PROD_CHROMIUM_CANDIDATES = [
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome-stable',
];

/** Linux / Docker 无头环境 PDF 导出推荐参数 */
export const HEADLESS_CHROMIUM_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--disable-software-rasterizer',
  '--no-first-run',
  '--disable-extensions',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-extensions-http-throttling',
] as const;

function resolveProdChromiumPath(): string | undefined {
  for (const p of PROD_CHROMIUM_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  return PROD_CHROMIUM_CANDIDATES[0];
}

export function getPuppeteerLaunchOptions(): LaunchOptions {
  const isProd = process.env.NODE_ENV === 'production';
  const base: LaunchOptions = {
    headless: true,
    args: [...HEADLESS_CHROMIUM_ARGS],
  };
  if (isProd) {
    base.env = {
      ...process.env,
      DBUS_SESSION_BUS_ADDRESS:
        process.env.DBUS_SESSION_BUS_ADDRESS ?? '/dev/null',
    };
  }
  const customExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (customExecutablePath) {
    base.executablePath = customExecutablePath;
  } else if (isProd) {
    base.executablePath = resolveProdChromiumPath();
  }
  return base;
}
