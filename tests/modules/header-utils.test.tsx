import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  HEADER11_DOT_PX,
  header11DotPx,
  header11TitleRowMinHeightPx,
  SectionHeaderType11TimelineLayout,
  SectionHeaderType11TitleOnly,
  SectionHeaderType11TitleRow
} from '@/modules/header/sectionHeader';
import { sectionHeaderFontSizeCss, sectionHeaderFontSizeNum } from '@/modules/header/sectionHeaderFont';
import { normHeaderTypeHtml, sectionHeaderHtml, wrapSectionModuleHtml } from '@/modules/header/sectionHeaderHtml';
import {
  SECTION_HEADER_ROW_HEIGHT_PX,
  sectionHeaderRowHeightCss,
  sectionHeaderRowHeightStyle
} from '@/modules/header/sectionHeaderLayout';
import { makeGlobalStyle } from './fixtures';

describe('header utility functions', () => {
  it('calculates header font size with valid and invalid values', () => {
    expect(sectionHeaderFontSizeNum(makeGlobalStyle({ fontSize: 16 }))).toBe(16);
    expect(sectionHeaderFontSizeCss(makeGlobalStyle({ fontSize: 16 }))).toBe('16px');
    expect(sectionHeaderFontSizeNum(makeGlobalStyle({ fontSize: 0 }))).toBe(13);
    expect(sectionHeaderFontSizeNum(makeGlobalStyle({ fontSize: Number.NaN }))).toBe(13);
  });

  it('exposes shared header row height constants and CSS', () => {
    expect(SECTION_HEADER_ROW_HEIGHT_PX).toBe(27);
    expect(sectionHeaderRowHeightStyle).toMatchObject({
      minHeight: 27,
      height: 27,
      boxSizing: 'border-box'
    });
    expect(sectionHeaderRowHeightCss()).toBe('min-height:27px;height:27px;box-sizing:border-box;');
  });

  it('exposes type 11 layout constants', () => {
    expect(HEADER11_DOT_PX).toBe(9);
    expect(header11DotPx()).toBe(9);
    expect(header11TitleRowMinHeightPx()).toBe(SECTION_HEADER_ROW_HEIGHT_PX);
  });

  it('normalizes HTML header type consistently', () => {
    expect(normHeaderTypeHtml(makeGlobalStyle({ headerType: undefined }))).toBe(1);
    expect(normHeaderTypeHtml(makeGlobalStyle({ headerType: 0 }))).toBe(1);
    expect(normHeaderTypeHtml(makeGlobalStyle({ headerType: 4.9 }))).toBe(4);
    expect(normHeaderTypeHtml(makeGlobalStyle({ headerType: 42 }))).toBe(11);
  });

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])('generates escaped HTML for header type %s', (headerType) => {
    const html = sectionHeaderHtml('<标题&内容>', makeGlobalStyle({ headerType }), 'project', 3.8);

    expect(html).toContain('&lt;标题&amp;内容&gt;');
    expect(html).toContain('#1677ff');
    expect(html).not.toContain('<标题&内容>');
  });

  it('generates module-specific icon HTML and falls back to education icon', () => {
    const education = sectionHeaderHtml('教育', makeGlobalStyle({ headerType: 8 }), 'education');
    const job = sectionHeaderHtml('工作', makeGlobalStyle({ headerType: 8 }), 'job');
    const unknown = sectionHeaderHtml('未知', makeGlobalStyle({ headerType: 8 }), 'unknown');

    expect(education).toContain('M4.5 6.5h10');
    expect(job).toContain('M8.5 7V5.8');
    expect(unknown).toContain('M4.5 6.5h10');
  });

  it('wraps module HTML for default, type 7 and type 11 layouts', () => {
    expect(wrapSectionModuleHtml('默认', makeGlobalStyle(), '<p>body</p>', 'skill')).toContain('margin-top:5px');
    expect(wrapSectionModuleHtml('左栏', makeGlobalStyle({ headerType: 7 }), '<p>body</p>', 'skill')).toContain(
      'grid-template-columns:5rem minmax(0,1fr)'
    );
    expect(wrapSectionModuleHtml('时间线', makeGlobalStyle({ headerType: 11 }), '<p>body</p>', 'skill')).toContain(
      `width:${header11DotPx()}px`
    );
  });
});

describe('type 11 header components', () => {
  it('renders title row, title only and timeline layout', () => {
    const globalStyle = makeGlobalStyle({ headerType: 11, color: '#fa541c', fontSize: 18 });
    const { rerender, container } = render(<SectionHeaderType11TitleRow title='时间线标题' globalStyle={globalStyle} />);

    expect(screen.getByText('时间线标题')).toHaveStyle({ color: '#fa541c', fontSize: '18px' });
    expect(container.querySelector('[aria-hidden="true"]')).toHaveStyle({ backgroundColor: '#fa541c' });

    rerender(<SectionHeaderType11TitleOnly title='仅标题' globalStyle={makeGlobalStyle({ fontSize: 0 })} />);
    expect(screen.getByText('仅标题')).toHaveStyle({ fontSize: '13px' });

    rerender(
      <SectionHeaderType11TimelineLayout title='时间线' globalStyle={globalStyle}>
        <span>正文</span>
      </SectionHeaderType11TimelineLayout>
    );
    expect(screen.getByText('时间线')).toBeInTheDocument();
    expect(screen.getByText('正文')).toBeInTheDocument();
  });
});
