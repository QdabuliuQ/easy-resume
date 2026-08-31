import { describe, expect, it } from 'vitest';
import {
  HOME_EXPAND_THUMB_W,
  HOME_LIST_THUMB_W,
  PANEL_LIST_THUMB_W,
  cdnThumbUrl,
  homeExpandThumbUrl,
  homeListThumbUrl,
  panelListThumbUrl,
} from '@/lib/cdnThumbUrl';

describe('cdnThumbUrl', () => {
  it('appends imageView2 with & when query exists', () => {
    expect(cdnThumbUrl('https://cdn/a.webp?v=1', 128)).toBe(
      'https://cdn/a.webp?v=1&imageView2/2/w/128/format/webp',
    );
  });
  it('uses ? when no query', () => {
    expect(cdnThumbUrl('https://cdn/a.webp', 128)).toBe(
      'https://cdn/a.webp?imageView2/2/w/128/format/webp',
    );
  });
  it('home list is softer, panel sharper, expand sharpest', () => {
    expect(HOME_LIST_THUMB_W).toBe(256);
    expect(PANEL_LIST_THUMB_W).toBe(480);
    expect(HOME_EXPAND_THUMB_W).toBe(1400);
    expect(HOME_LIST_THUMB_W).toBeLessThan(PANEL_LIST_THUMB_W);
    expect(PANEL_LIST_THUMB_W).toBeLessThan(HOME_EXPAND_THUMB_W);
    const base = 'https://cdn/a.webp?v=1';
    expect(homeListThumbUrl(base)).toBe(cdnThumbUrl(base, HOME_LIST_THUMB_W));
    expect(panelListThumbUrl(base)).toBe(cdnThumbUrl(base, PANEL_LIST_THUMB_W));
    expect(homeExpandThumbUrl(base)).toBe(cdnThumbUrl(base, HOME_EXPAND_THUMB_W));
  });
});
