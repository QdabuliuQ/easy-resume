import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPuppeteerLaunchOptions } from '@/lib/puppeteerLaunchOptions';

describe('puppeteerLaunchOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns headless launch args for linux server', () => {
    const opts = getPuppeteerLaunchOptions();
    expect(opts.headless).toBe(true);
    expect(opts.args).toContain('--no-sandbox');
    expect(opts.args).toContain('--disable-setuid-sandbox');
    expect(opts.args).toContain('--disable-dev-shm-usage');
    expect(opts.args).toContain('--disable-gpu');
    expect(opts.args).toContain('--disable-background-timer-throttling');
    expect(opts.args).toContain('--disable-extensions-http-throttling');
  });

  it('sets dbus env in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const opts = getPuppeteerLaunchOptions();
    expect(opts.env?.DBUS_SESSION_BUS_ADDRESS).toBe('/dev/null');
  });

  it('uses custom executable path', () => {
    vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', '/custom/chrome');
    expect(getPuppeteerLaunchOptions().executablePath).toBe('/custom/chrome');
  });

  it('uses prod chromium when NODE_ENV production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PUPPETEER_EXECUTABLE_PATH', '');
    expect(getPuppeteerLaunchOptions().executablePath).toBe('/usr/bin/chromium-browser');
  });
});
