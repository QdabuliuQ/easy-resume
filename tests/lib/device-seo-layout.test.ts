import { describe, expect, it } from 'vitest';
import {
  DEVICE_TYPE_HEADER,
  DEVICE_VIEW_COOKIE,
  isMobileUserAgent,
  localePath,
  resolveDeviceType,
} from '@/lib/device';
import { SEO_SITEMAP_ENTRIES } from '@/lib/seoRoutes';
import {
  findFirstInfo1Module,
  shouldPlaceInfo1InSideCol,
} from '@/lib/resumeSideColLayout';
import { pinInfo1ModulesFirst } from '@/lib/resumeModuleOrder';
import { resumeModuleSlotStyle } from '@/lib/resumeModuleSlotLayout';
import { info1ShowsInlineFieldLabel } from '@/lib/info1FieldLabels';
import { resumePageInnerHeightDeductionPx } from '@/lib/resumePageLayout';

describe('device', () => {
  it('detects mobile user agent', () => {
    expect(isMobileUserAgent('Mozilla/5.0 (iPhone)')).toBe(true);
    expect(isMobileUserAgent('Mozilla/5.0 (Macintosh)')).toBe(false);
  });

  it('resolveDeviceType respects cookie and ch-mobile', () => {
    expect(resolveDeviceType('desktop', 'mobile')).toBe('mobile');
    expect(resolveDeviceType('desktop', 'desktop')).toBe('desktop');
    expect(resolveDeviceType('desktop', null, '?1')).toBe('mobile');
    expect(DEVICE_VIEW_COOKIE).toBe('device-view');
    expect(DEVICE_TYPE_HEADER).toBe('x-device-type');
  });

  it('localePath builds path', () => {
    expect(localePath('zh')).toBe('/zh');
    expect(localePath('en', '/edit')).toBe('/en/edit');
  });
});

describe('seoRoutes', () => {
  it('has zh and en entries', () => {
    expect(SEO_SITEMAP_ENTRIES.some((e) => e.locale === 'zh' && e.path === '')).toBe(true);
    expect(SEO_SITEMAP_ENTRIES.some((e) => e.locale === 'en' && e.path === '/edit')).toBe(true);
  });
});

describe('resumeSideColLayout', () => {
  const resume = {
    pages: [{ modules: [{ type: 'skill', id: '2' }, { type: 'info1', id: '1' }] }],
  };

  it('findFirstInfo1Module returns first info1', () => {
    expect(findFirstInfo1Module(resume)?.id).toBe('1');
    expect(findFirstInfo1Module(null)).toBeNull();
  });

  it('shouldPlaceInfo1InSideCol for side layouts', () => {
    expect(shouldPlaceInfo1InSideCol('leftCol')).toBe(true);
    expect(shouldPlaceInfo1InSideCol('default')).toBe(false);
  });
});

describe('resumeModuleOrder', () => {
  it('pinInfo1ModulesFirst moves info1 to front', () => {
    const out = pinInfo1ModulesFirst([
      { type: 'job' },
      { type: 'info1' },
      { type: 'skill' },
    ]);
    expect(out.map((m) => m.type)).toEqual(['info1', 'job', 'skill']);
  });
});

describe('resumeModuleSlotLayout', () => {
  it('uses auto height for full module', () => {
    expect(resumeModuleSlotStyle({ viewHeight: 200, offsetY: 0, measuredModuleHeight: 180 })).toEqual({
      height: undefined,
      overflow: 'visible',
      flexShrink: 0,
    });
  });

  it('uses fixed height for clip and offset', () => {
    expect(
      resumeModuleSlotStyle({ viewHeight: 100, offsetY: 0, measuredModuleHeight: 200 }),
    ).toMatchObject({ height: 100, overflow: 'hidden' });
    expect(resumeModuleSlotStyle({ viewHeight: 80, offsetY: 40 })).toMatchObject({ height: 80 });
  });
});

describe('info1FieldLabels', () => {
  it('hides name label when showTitle', () => {
    expect(info1ShowsInlineFieldLabel('name', true)).toBe(false);
    expect(info1ShowsInlineFieldLabel('phone', true)).toBe(true);
    expect(info1ShowsInlineFieldLabel('phone', false)).toBe(false);
  });
});

describe('resumePageInnerHeightDeductionPx', () => {
  it('deducts padding twice', () => {
    expect(resumePageInnerHeightDeductionPx({ padding: 20, layout: 'default' })).toBe(40);
  });
});
