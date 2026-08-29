import { describe, expect, it } from 'vitest';
import { moduleBracketHeightFromSpanCssPx } from '@/components/moduleOperation/moduleBracketHeight';

describe('moduleBracketHeightFromSpanCssPx', () => {
  it('uses first.top→last.bottom span (includes page gap)', () => {
    // 片段 200+300，中间页间距+padding 共 80
    expect(moduleBracketHeightFromSpanCssPx(100, 100 + 200 + 80 + 300, 1)).toBe(580);
  });

  it('divides by canvas scale', () => {
    expect(moduleBracketHeightFromSpanCssPx(0, 400, 0.5)).toBe(800);
  });

  it('does not double-count padding/gap on top of span', () => {
    const span = 580;
    const wronglyDoubled = span + 80;
    expect(moduleBracketHeightFromSpanCssPx(0, span, 1)).toBe(span);
    expect(moduleBracketHeightFromSpanCssPx(0, span, 1)).toBeLessThan(wronglyDoubled);
  });

  it('handles invalid scale', () => {
    expect(moduleBracketHeightFromSpanCssPx(10, 10, 0)).toBe(0);
    expect(moduleBracketHeightFromSpanCssPx(50, 20, 1)).toBe(0);
  });
});
