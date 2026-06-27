import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const launchMock = vi.fn();
const closeMock = vi.fn();
const onceMock = vi.fn();

vi.mock('puppeteer', () => ({
  default: {
    launch: (...args: unknown[]) => launchMock(...args),
  },
}));

vi.mock('@/lib/puppeteerLaunchOptions', () => ({
  getPuppeteerLaunchOptions: () => ({ headless: true, args: [] }),
}));

describe('puppeteerSharedBrowser singleton', () => {
  beforeEach(() => {
    launchMock.mockReset();
    closeMock.mockReset();
    onceMock.mockReset();
    launchMock.mockResolvedValue({
      connected: true,
      close: closeMock.mockResolvedValue(undefined),
      once: onceMock,
      newPage: vi.fn(),
    });
  });

  afterEach(async () => {
    vi.resetModules();
  });

  it('reuses one browser instance across getSharedBrowser calls', async () => {
    const mod = await import('@/lib/puppeteerSharedBrowser');
    const a = await mod.getSharedBrowser();
    const b = await mod.getSharedBrowser();
    expect(a).toBe(b);
    expect(launchMock).toHaveBeenCalledTimes(1);
    await mod.resetSharedBrowser();
  });

  it('warmupSharedBrowser launches browser once', async () => {
    const mod = await import('@/lib/puppeteerSharedBrowser');
    await mod.warmupSharedBrowser();
    await mod.getSharedBrowser();
    expect(launchMock).toHaveBeenCalledTimes(1);
    await mod.resetSharedBrowser();
  });
});
