import { afterEach, describe, expect, it } from 'vitest';
import { hexForColorInput } from '@/lib/resumeColorHex';
import { mergeGlobalStylePaper } from '@/lib/resumeGlobalStyleMerge';
import {
  cssLengthToPx,
  globalStylePageDimensions,
  normResumePageSize,
  resumePageSizeFromLegacyDims,
} from '@/lib/resumePageSize';
import {
  normResumePageLayout,
  resumeInfo1FieldSeparatorColor,
  resumeInfo1FieldTextColor,
  resumePageContentInnerWidthCss,
  resumePageHasSideCol,
  RESUME_PAGE_SIDE_COL_WIDTH_RATIO,
} from '@/lib/resumePageLayout';
import { resolveExportPrintOrigin, buildExportResumeUrl } from '@/lib/exportPrintOrigin';
import { makeGlobalStyle } from '../modules/fixtures';

describe('lib helpers', () => {
  afterEach(() => {
    delete process.env.EXPORT_BASE_URL;
  });

  it('normalizes hex and rgb color values', () => {
    expect(hexForColorInput('rgb(255, 0, 16)', '#000000')).toBe('#ff0010');
    expect(hexForColorInput('#abc', '#000000')).toBe('#aabbcc');
    expect(hexForColorInput('abc', '#000000')).toBe('#aabbcc');
    expect(hexForColorInput('invalid', '#123456')).toBe('#123456');
    expect(hexForColorInput('rgba(0,0,0,0.5)', '#fff')).toBe('#000000');
  });

  it('merges global style and maps legacy dims to pageSize', () => {
    const base = makeGlobalStyle({ pageSize: 'A4', layout: 'default' });
    const merged = mergeGlobalStylePaper(base, {
      width: '297mm',
      height: '420mm',
      layout: 'left',
    });

    expect(merged.pageSize).toBe('A3');
    expect(merged.layout).toBe('leftCol');
  });

  it('normalizes page size and resolves dimensions', () => {
    expect(normResumePageSize('Letter')).toBe('Letter');
    expect(normResumePageSize('Unknown')).toBe('A4');
    expect(resumePageSizeFromLegacyDims('216mm', '279mm')).toBe('Letter');
    expect(globalStylePageDimensions({ pageSize: 'A5' })).toEqual({ width: '148mm', height: '210mm' });
  });

  it('converts css lengths to px', () => {
    expect(cssLengthToPx('96px')).toBe(96);
    expect(cssLengthToPx('1in')).toBe(96);
    expect(cssLengthToPx('25.4mm')).toBeCloseTo(96, 6);
    expect(cssLengthToPx('')).toBe(0);
    expect(cssLengthToPx('bad')).toBe(0);
  });

  it('handles page layout helpers', () => {
    expect(normResumePageLayout('right')).toBe('rightCol');
    expect(resumePageHasSideCol('leftCol')).toBe(true);
    expect(resumePageHasSideCol('default')).toBe(false);
    expect(resumeInfo1FieldTextColor('leftCol')).toBe('#fff');
    expect(resumeInfo1FieldSeparatorColor('default')).toBe('#999');
    expect(resumePageContentInnerWidthCss('210mm', 'leftCol', 20)).toContain(
      `calc(210mm * ${1 - RESUME_PAGE_SIDE_COL_WIDTH_RATIO} - 40px)`,
    );
  });

  it('resolves export origin and builds export url', () => {
    expect(resolveExportPrintOrigin('https://a.com/')).toBe('https://a.com');
    process.env.EXPORT_BASE_URL = 'https://b.com/';
    expect(resolveExportPrintOrigin('https://a.com')).toBe('https://b.com');

    const url = buildExportResumeUrl('https://a.com/', 'zh', 'token + 1', 'image');
    expect(url).toContain('/zh/export/resume?token=token%20%2B%201');
    expect(url.endsWith('&mode=image')).toBe(true);

    const enUrl = buildExportResumeUrl('https://a.com', 'en', 't');
    expect(enUrl).toBe('https://a.com/en/export/resume?token=t');
  });
});
