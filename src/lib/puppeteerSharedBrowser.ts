import puppeteer, { type Browser } from 'puppeteer';
import { getPuppeteerLaunchOptions } from '@/lib/puppeteerLaunchOptions';

let sharedBrowser: Browser | null = null;
let connectPromise: Promise<Browser> | null = null;

export async function getSharedBrowser(): Promise<Browser> {
  if (sharedBrowser?.connected) return sharedBrowser;
  if (!connectPromise) {
    connectPromise = (async () => {
      try {
        const browser = await puppeteer.launch(getPuppeteerLaunchOptions());
        browser.once('disconnected', () => {
          sharedBrowser = null;
          connectPromise = null;
        });
        sharedBrowser = browser;
        return browser;
      } catch (e) {
        connectPromise = null;
        sharedBrowser = null;
        throw e;
      }
    })();
  }
  return connectPromise;
}
