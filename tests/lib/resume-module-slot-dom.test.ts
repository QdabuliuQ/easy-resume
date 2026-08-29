import { describe, expect, it } from 'vitest';
import {
  intersectClientRects,
  unionClientRects,
} from '@/lib/resumeModuleSlotDom';

describe('resumeModuleSlotDom rect helpers', () => {
  it('intersects with slot clip', () => {
    const field = { left: 0, top: 0, right: 100, bottom: 500 };
    const slot = { left: 0, top: 0, right: 100, bottom: 200 };
    expect(intersectClientRects(field, slot)).toEqual({
      left: 0,
      top: 0,
      right: 100,
      bottom: 200,
      width: 100,
      height: 200,
    });
  });

  it('unions cross-page fragments including page gap', () => {
    const page1 = { left: 10, top: 100, right: 110, bottom: 280 };
    const page2 = { left: 10, top: 360, right: 110, bottom: 500 };
    const uni = unionClientRects([page1, page2]);
    expect(uni?.top).toBe(100);
    expect(uni?.bottom).toBe(500);
    // 280→360 之间的页间距/padding 计入高度
    expect(uni?.height).toBe(400);
  });
});
