import { render, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

describe('home motion', () => {
  it('HeroMotion reduceMotion ends at visible final state', async () => {
    const { default: HeroMotion } = await import('@/components/home/HeroMotion');
    const onIntroComplete = vi.fn();
    const { container } = render(
      <HeroMotion reduceMotion ready onIntroComplete={onIntroComplete}>
        <p data-home-hero>badge</p>
        <div data-home-hero-preview>preview</div>
      </HeroMotion>,
    );
    await waitFor(() => expect(onIntroComplete).toHaveBeenCalled());
    const badge = container.querySelector('[data-home-hero]') as HTMLElement;
    expect(badge.style.opacity === '' || badge.style.opacity === '1').toBe(true);
  });

  it('ScrollReveal reduceMotion leaves items visible', async () => {
    const { default: ScrollReveal } = await import('@/components/home/ScrollReveal');
    const { container } = render(
      <ScrollReveal reduceMotion>
        <div data-home-reveal>block</div>
      </ScrollReveal>,
    );
    await waitFor(() => {
      const el = container.querySelector('[data-home-reveal]') as HTMLElement;
      expect(el).toBeTruthy();
      expect(el.style.opacity === '' || el.style.opacity === '1').toBe(true);
    });
  });
});
