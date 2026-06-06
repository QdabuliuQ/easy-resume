import { afterEach, describe, expect, it } from 'vitest';
import { getPuppeteerLaunchOptions } from '@/lib/puppeteerLaunchOptions';

describe('puppeteerLaunchOptions', () => {
  const origEnv = process.env.NODE_ENV;
  const origExec = process.env.PUPPETEER_EXECUTABLE_PATH;

  afterEach(() => {
    process.env.NODE_ENV = origEnv;
    if (origExec) process.env.PUPPETEER_EXECUTABLE_PATH = origExec;
    else delete process.env.PUPPETEER_EXECUTABLE_PATH;
  });

  it('returns headless launch args', () => {
    const opts = getPuppeteerLaunchOptions();
    expect(opts.headless).toBe(true);
    expect(opts.args).toContain('--no-sandbox');
  });

  it('uses custom executable path', () => {
    process.env.PUPPETEER_EXECUTABLE_PATH = '/custom/chrome';
    expect(getPuppeteerLaunchOptions().executablePath).toBe('/custom/chrome');
  });

  it('uses prod chromium when NODE_ENV production', () => {
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
    process.env.NODE_ENV = 'production';
    expect(getPuppeteerLaunchOptions().executablePath).toBe('/usr/bin/chromium-browser');
  });
});
