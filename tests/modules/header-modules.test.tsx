import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SectionHeader, { normHeaderType } from '@/modules/header/sectionHeader';
import { HeaderTypeIcon } from '@/modules/header/headerTypeIcon';
import { makeGlobalStyle } from './fixtures';

describe('header modules', () => {
  it.each([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
  ])('renders section header type %s', (headerType) => {
    const { container } = render(
      <SectionHeader
        config={{ title: `标题${headerType}`, moduleType: 'education', sectionOrdinal: 3 }}
        globalStyle={makeGlobalStyle({ headerType })}
      />
    );

    expect(container.textContent).toContain(`标题${headerType}`);
  });

  it('normalizes invalid header types into supported range', () => {
    expect(normHeaderType(makeGlobalStyle({ headerType: undefined }))).toBe(1);
    expect(normHeaderType(makeGlobalStyle({ headerType: -1 }))).toBe(1);
    expect(normHeaderType(makeGlobalStyle({ headerType: 99 }))).toBe(26);
    expect(normHeaderType(makeGlobalStyle({ headerType: 6.8 }))).toBe(6);
  });

  it.each([
    ['education'],
    ['job'],
    ['project'],
    ['skill'],
    ['certificate'],
    ['other'],
    [undefined]
  ])('renders header icon for module type %s', (moduleType) => {
    const { container } = render(<HeaderTypeIcon moduleType={moduleType} color='#1677ff' />);

    expect(container.firstElementChild).toBeInTheDocument();
  });
});
