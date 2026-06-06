import { afterEach, describe, expect, it } from 'vitest';
import {
  getSiteName,
  getSiteUrl,
  siteJsonLdGraph,
  siteSoftwareApplicationJsonLd,
  SITE_NAME_EN,
  SITE_NAME_ZH,
} from '@/lib/siteMeta';

describe('siteMeta', () => {
  afterEach(() => {
    delete process.env.SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
  });

  it('getSiteName by locale', () => {
    expect(getSiteName('en')).toBe(SITE_NAME_EN);
    expect(getSiteName('zh')).toBe(SITE_NAME_ZH);
    expect(getSiteName()).toBe(SITE_NAME_ZH);
  });

  it('getSiteUrl uses env', () => {
    process.env.SITE_URL = 'https://resume.example.com/';
    expect(getSiteUrl().href).toBe('https://resume.example.com/');
  });

  it('getSiteUrl falls back to localhost', () => {
    expect(getSiteUrl().href).toBe('http://localhost:3010/');
  });

  it('siteJsonLdGraph includes locale', () => {
    const g = siteJsonLdGraph({ locale: 'en' });
    expect(g.inLanguage).toBe('en');
    expect(g['@type']).toBe('WebSite');
  });

  it('siteSoftwareApplicationJsonLd has offers', () => {
    const j = siteSoftwareApplicationJsonLd();
    expect(j['@type']).toBe('SoftwareApplication');
    expect((j.offers as { price: string }).price).toBe('0');
  });
});
