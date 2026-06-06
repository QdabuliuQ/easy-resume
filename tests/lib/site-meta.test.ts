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

  it('siteJsonLdGraph includes locale WebSite and WebApplication', () => {
    const g = siteJsonLdGraph({ locale: 'en' });
    const graph = g['@graph'] as Record<string, unknown>[];
    expect(g['@context']).toBe('https://schema.org');
    expect(graph[0]['@type']).toBe('WebSite');
    expect((graph[0] as { inLanguage: string }).inLanguage).toBe('en');
    expect(graph[1]['@type']).toBe('WebApplication');
  });

  it('siteSoftwareApplicationJsonLd has offers', () => {
    const j = siteSoftwareApplicationJsonLd();
    expect(j['@type']).toBe('WebApplication');
    expect((j.offers as { price: string }).price).toBe('0');
  });
});
