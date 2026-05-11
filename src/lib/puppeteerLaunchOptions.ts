import type { LaunchOptions } from 'puppeteer';

const PROD_CHROMIUM = '/usr/bin/chromium-browser';

export function getPuppeteerLaunchOptions(): LaunchOptions {
  const base: LaunchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
    ],
  };
  if (process.env.NODE_ENV === 'production') {
    base.executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH?.trim() || PROD_CHROMIUM;
  }
  return base;
}
