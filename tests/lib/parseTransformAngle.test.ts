import { describe, expect, it } from 'vitest';
import { parseTransformAngle, parseTransformTranslate } from '@/lib/home/parseTransformAngle';

describe('parseTransformAngle', () => {
  it('reads rotate rad from transform string', () => {
    expect(parseTransformAngle('translate3d(10px, 20px, 0) rotate(0.42rad)')).toBe(0.42);
    expect(parseTransformAngle('translate3d(0px, 0px, 0)')).toBe(0);
  });

  it('reads translate px from transform string', () => {
    expect(parseTransformTranslate('translate3d(120px, 340px, 0) rotate(0.42rad)')).toEqual({
      tx: 120,
      ty: 340,
    });
  });
});
