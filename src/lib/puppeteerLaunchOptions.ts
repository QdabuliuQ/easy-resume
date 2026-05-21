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
    ],
  };
  const customExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (customExecutablePath) {
    base.executablePath = customExecutablePath;
  } else if (process.env.NODE_ENV === 'production') {
    base.executablePath = PROD_CHROMIUM;
  }
  return base;
}
