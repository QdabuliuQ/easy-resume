import { existsSync } from 'node:fs';
import type { LaunchOptions } from 'puppeteer';

const PROD_CHROMIUM_CANDIDATES = [
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/usr/bin/google-chrome-stable',
];

function resolveProdChromiumPath(): string | undefined {
  for (const p of PROD_CHROMIUM_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  return PROD_CHROMIUM_CANDIDATES[0];
}

export function getPuppeteerLaunchOptions(): LaunchOptions {
  const base: LaunchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--disable-extensions',
    ],
  };
  const customExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  if (customExecutablePath) {
    base.executablePath = customExecutablePath;
  } else if (process.env.NODE_ENV === 'production') {
    base.executablePath = resolveProdChromiumPath();
  }
  return base;
}
