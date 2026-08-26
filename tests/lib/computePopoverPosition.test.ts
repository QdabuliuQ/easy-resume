import { describe, expect, it } from 'vitest';
import {
  computeAnchorHighlightRect,
  computeAnchorHighlightRectFromElement,
  computePopoverPosition,
  unionClipBoxes,
} from '@/lib/inlineFieldEdit/computePopoverPosition';

function mockContainer(rect: DOMRect, scroll = { top: 0, left: 0 }): HTMLElement {
  return {
    getBoundingClientRect: () => rect,
    scrollTop: scroll.top,
    scrollLeft: scroll.left,
    clientWidth: rect.width,
    clientHeight: rect.height,
    querySelector: () => null,
  } as HTMLElement;
}

describe('computePopoverPosition', () => {
  it('highlight rect expands width by 6px horizontally', () => {
    const container = mockContainer(new DOMRect(100, 50, 800, 600));
    const anchor = new DOMRect(200, 200, 80, 20);
    const rect = computeAnchorHighlightRect(anchor, container);
    expect(rect.top).toBe(anchor.top - 50);
    expect(rect.left).toBe(anchor.left - 100 - 3);
    expect(rect.width).toBe(anchor.width + 6);
    expect(rect.height).toBe(anchor.height);
  });

  it('places popover below highlight when space allows', () => {
    const container = mockContainer(new DOMRect(100, 50, 800, 600));
    const anchor = new DOMRect(200, 200, 120, 24);
    const pos = computePopoverPosition(anchor, container, 480, 320);
    expect(pos.placement).toBe('below');
    expect(pos.top).toBe(anchor.bottom - 50 + 8);
    expect(pos.left).toBe(anchor.left - 100 - 3);
  });

  it('places popover above highlight without overlapping', () => {
    const container = mockContainer(new DOMRect(0, 0, 800, 600));
    const anchor = new DOMRect(200, 520, 120, 24);
    const highlightTop = anchor.top;
    const popoverHeight = 320;
    const pos = computePopoverPosition(anchor, container, 480, popoverHeight);
    expect(pos.placement).toBe('above');
    expect(pos.top + popoverHeight).toBeLessThanOrEqual(highlightTop - 8);
  });

  it('clips highlight to anchor page visible area only', () => {
    const container = mockContainer(new DOMRect(0, 0, 800, 600));
    const anchor = {
      getAttribute: () => null,
      closest: () => null,
    } as unknown as HTMLElement;
    expect(computeAnchorHighlightRectFromElement(anchor, container)).toBeNull();
  });

  it('locks highlight width to anchor horizontal bounds across pages', () => {
    const container = mockContainer(new DOMRect(0, 0, 800, 600));
    const anchorPart = { x: 120, y: 200, w: 360, h: 60 };
    const page2Part = { x: 80, y: 320, w: 480, h: 40 };
    const vertical = unionClipBoxes([anchorPart, page2Part]);
    expect(vertical?.h).toBe(160);
    const merged = { x: anchorPart.x, y: vertical!.y, w: anchorPart.w, h: vertical!.h };
    expect(merged).toEqual({ x: 120, y: 200, w: 360, h: 160 });
  });
});
