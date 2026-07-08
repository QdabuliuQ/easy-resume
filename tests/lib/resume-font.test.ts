import { describe, expect, it } from 'vitest';
import {
  normResumeFont,
  resumeExportFontFacesCss,
  resumeExportFontStack,
  resumeFontForExport,
  resumeFontStack,
  resumeLocalFontFacesCss,
  resumePrimaryFontFamily,
  resumeSnapLocalFonts,
} from '@/lib/resumeFont';
import { resumePdfFontLinkTags } from '@/lib/resumePdfFontLinkTags';

describe('resumeFont', () => {
  it('normResumeFont maps legacy ids', () => {
    expect(normResumeFont('noto-sans')).toBe('noto-sans-sc');
    expect(normResumeFont('noto-serif')).toBe('noto-serif-sc');
    expect(normResumeFont('unknown')).toBe('system');
  });

  it('resumeFontForExport falls back system to noto-sans-sc', () => {
    expect(resumeFontForExport('system')).toBe('noto-sans-sc');
    expect(resumeFontForExport('noto-serif-sc')).toBe('noto-serif-sc');
  });

  it('resumeFontStack returns stack string', () => {
    expect(resumeFontStack('noto-sans-sc')).toContain('Noto Sans SC');
    expect(resumeFontStack('system')).toContain('PingFang SC');
  });

  it('resumeExportFontStack prefixes Noto for system', () => {
    expect(resumeExportFontStack('system')).toContain('Noto Sans SC');
  });

  it('resumeLocalFontFacesCss empty for system', () => {
    expect(resumeLocalFontFacesCss('system')).toBe('');
    expect(resumeLocalFontFacesCss('noto-sans-sc')).toContain('NotoSansSC-Regular.ttf');
  });

  it('resumeSnapLocalFonts builds font urls', () => {
    const fonts = resumeSnapLocalFonts('https://a.com/', 'noto-sans-sc');
    expect(fonts).toHaveLength(2);
    expect(fonts[0].src).toBe('https://a.com/fonts/NotoSansSC-Regular.ttf');
    expect(resumePrimaryFontFamily('noto-serif-sc')).toBe('Noto Serif SC');
  });

  it('resumePdfFontLinkTags uses local fonts only', () => {
    const html = resumePdfFontLinkTags('noto-sans-sc', { assetOrigin: 'https://x.com' });
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).toContain('NotoSansSC-Regular.ttf');
    expect(html).toContain('https://x.com/fonts/NotoSansSC-Regular.ttf');
  });

  it('resumeExportFontFacesCss maps system to noto-sans-sc', () => {
    const css = resumeExportFontFacesCss('https://x.com', 'system');
    expect(css).toContain('NotoSansSC-Regular.ttf');
  });
});
