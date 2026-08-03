import { describe, expect, it } from 'vitest';
import {
  PAGE_FIT_EPSILON_PX,
  pickSplitFromSortedBodyRects,
  resolveSplitAwayFromCut,
} from '@/lib/pageSplitAvoidCut';

describe('resolveSplitAwayFromCut', () => {
  it('returns null when anchor fully above cut', () => {
    expect(resolveSplitAwayFromCut(10, 30, 0, 100)).toBeNull();
  });

  it('returns null when anchor fully below cut', () => {
    expect(resolveSplitAwayFromCut(120, 140, 0, 100)).toBeNull();
  });

  it('pulls cut up to line top when straddling page seam', () => {
    expect(resolveSplitAwayFromCut(90, 110, 0, 100)).toEqual({
      viewHeight: 90,
      nextOffsetY: 90,
      pullBackPx: 10,
    });
  });

  it('accounts for continuation offsetY', () => {
    expect(resolveSplitAwayFromCut(270, 290, 200, 80)).toEqual({
      viewHeight: 70,
      nextOffsetY: 270,
      pullBackPx: 10,
    });
  });

  it('returns empty-page when little/no room above the cut line', () => {
    expect(resolveSplitAwayFromCut(0, 20, 0, 10)).toBe('empty-page');
    expect(resolveSplitAwayFromCut(PAGE_FIT_EPSILON_PX, 20, 0, 10)).toBe('empty-page');
  });
});

describe('pickSplitFromSortedBodyRects', () => {
  it('picks the first straddling rect', () => {
    const rects = [
      { top: 10, bottom: 30 },
      { top: 90, bottom: 110 },
      { top: 120, bottom: 140 },
    ];
    expect(pickSplitFromSortedBodyRects(rects, 0, 100)).toEqual({
      viewHeight: 90,
      nextOffsetY: 90,
      pullBackPx: 10,
    });
  });

  it('stops when a rect is entirely below cutY (does not use later rects)', () => {
    // intentional non-sorted tail: a later straddler must be ignored after break
    const rects = [
      { top: 10, bottom: 30 },
      { top: 120, bottom: 140 },
      { top: 90, bottom: 110 },
    ];
    expect(pickSplitFromSortedBodyRects(rects, 0, 100)).toBeNull();
  });

  it('returns empty-page when first hit has no room above the line', () => {
    expect(
      pickSplitFromSortedBodyRects([{ top: 0, bottom: 18 }], 0, 10),
    ).toBe('empty-page');
  });

  it('returns null when no rect straddles the cut', () => {
    expect(
      pickSplitFromSortedBodyRects(
        [
          { top: 10, bottom: 30 },
          { top: 40, bottom: 60 },
        ],
        0,
        100,
      ),
    ).toBeNull();
  });

  it('works with continuation offset on body lines', () => {
    expect(
      pickSplitFromSortedBodyRects(
        [
          { top: 210, bottom: 230 },
          { top: 270, bottom: 288 },
          { top: 300, bottom: 320 },
        ],
        200,
        80,
      ),
    ).toEqual({ viewHeight: 70, nextOffsetY: 270, pullBackPx: 10 });
  });
});
