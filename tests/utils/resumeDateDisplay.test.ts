import { describe, expect, it } from 'vitest';
import { formatResumeDateRange, normalizeResumeDateDisplay } from '@/utils/resumeDateDisplay';

describe('resumeDateDisplay', () => {
  it('normalizes YYYY-MM-DD to YYYY-MM', () => {
    expect(normalizeResumeDateDisplay('2021-03-01')).toBe('2021-03');
    expect(normalizeResumeDateDisplay('2025-04-01')).toBe('2025-04');
  });

  it('keeps YYYY-MM and custom formats', () => {
    expect(normalizeResumeDateDisplay('2021-03')).toBe('2021-03');
    expect(normalizeResumeDateDisplay('2018.09')).toBe('2018.09');
    expect(normalizeResumeDateDisplay('至今')).toBe('至今');
  });

  it('returns empty range when both dates missing', () => {
    expect(formatResumeDateRange('', '')).toBe('');
    expect(formatResumeDateRange(undefined, null)).toBe('');
  });

  it('formats range with dash separator', () => {
    expect(formatResumeDateRange('2021-03-01', '2025-04-01')).toBe('2021-03 - 2025-04');
    expect(formatResumeDateRange('2022.07', '至今')).toBe('2022.07 - 至今');
  });
});
