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
    expect(resumeLocalFontFacesCss('noto-sans-sc')).toContain('NotoSansSC-Regular.woff2');
    expect(resumeLocalFontFacesCss('noto-sans-sc')).toContain("format('woff2')");
  });

  it('resumeSnapLocalFonts builds font urls', () => {
    const fonts = resumeSnapLocalFonts('https://a.com/', 'noto-sans-sc');
    expect(fonts).toHaveLength(2);
    expect(fonts[0].src).toBe('https://a.com/fonts/NotoSansSC-Regular.woff2');
    expect(resumePrimaryFontFamily('noto-serif-sc')).toBe('Noto Serif SC');
  });

  it('supports qyn-flavor 檎风黑体', () => {
    expect(normResumeFont('qyn-flavor')).toBe('qyn-flavor');
    expect(resumePrimaryFontFamily('qyn-flavor')).toBe('檎风黑体');
    expect(resumeFontStack('qyn-flavor')).toContain('檎风黑体');
    expect(resumeLocalFontFacesCss('qyn-flavor')).toContain('QynFlavorAltCHS-Regular.woff2');
    expect(resumeSnapLocalFonts('https://a.com', 'qyn-flavor')[0].src).toBe(
      'https://a.com/fonts/QynFlavorAltCHS-Regular.woff2',
    );
  });

  it('supports chill-huo-fangsong 寒蝉活仿宋', () => {
    expect(normResumeFont('chill-huo-fangsong')).toBe('chill-huo-fangsong');
    expect(resumePrimaryFontFamily('chill-huo-fangsong')).toBe('寒蝉活仿宋');
    expect(resumeLocalFontFacesCss('chill-huo-fangsong')).toContain(
      'ChillHuoFangSong-Regular.woff2',
    );
  });

  it('supports moon-stars-kai 月星楷', () => {
    expect(normResumeFont('moon-stars-kai')).toBe('moon-stars-kai');
    expect(resumePrimaryFontFamily('moon-stars-kai')).toBe('月星楷');
    expect(resumeLocalFontFacesCss('moon-stars-kai')).toContain('MoonStarsKai-Regular.woff2');
  });

  it('supports shanggu-round / shanggu-serif', () => {
    expect(normResumeFont('shanggu-round')).toBe('shanggu-round');
    expect(resumePrimaryFontFamily('shanggu-round')).toBe('尚古圆体');
    expect(resumeLocalFontFacesCss('shanggu-round')).toContain('ShangguRound-Regular.woff2');
    expect(normResumeFont('shanggu-serif')).toBe('shanggu-serif');
    expect(resumePrimaryFontFamily('shanggu-serif')).toBe('尚古明体');
    expect(resumeLocalFontFacesCss('shanggu-serif')).toContain('ShangguSerif-Regular.woff2');
  });

  it('supports chill-round-f 寒蝉全圆体', () => {
    expect(normResumeFont('chill-round-f')).toBe('chill-round-f');
    expect(resumePrimaryFontFamily('chill-round-f')).toBe('寒蝉全圆体');
    expect(resumeLocalFontFacesCss('chill-round-f')).toContain('ChillRoundF-Regular.woff2');
  });

  it('supports acy Acy手写体', () => {
    expect(normResumeFont('acy')).toBe('acy');
    expect(resumePrimaryFontFamily('acy')).toBe('Acy手写体');
    expect(resumeLocalFontFacesCss('acy')).toContain('Acy-Regular.woff2');
  });

  it('resumePdfFontLinkTags uses local fonts only', () => {
    const html = resumePdfFontLinkTags('noto-sans-sc', { assetOrigin: 'https://x.com' });
    expect(html).not.toContain('fonts.googleapis.com');
    expect(html).toContain('NotoSansSC-Regular.woff2');
    expect(html).toContain('https://x.com/fonts/NotoSansSC-Regular.woff2');
  });

  it('resumeExportFontFacesCss maps system to noto-sans-sc', () => {
    const css = resumeExportFontFacesCss('https://x.com', 'system');
    expect(css).toContain('NotoSansSC-Regular.woff2');
  });
});
