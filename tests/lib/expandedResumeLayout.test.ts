import { describe, expect, it } from 'vitest';
import {
  captureExpandFromPhysics,
  computeExpandToCenter,
  computeExpandedTarget,
  frameCenter,
  frameFromCenter,
} from '@/lib/homeV2/expandedResumeLayout';
import { parseTransformTranslate } from '@/lib/homeV2/parseTransformAngle';

const BODY_W = 128;
const BODY_H = 201;
const TITLE_H = 20;

describe('expandedResumeLayout', () => {
  it('fits page into viewport with native aspect ratio', () => {
    const target = computeExpandedTarget(794, 1123, 1200, 900);
    expect(target.scale).toBeLessThanOrEqual(1);
    expect(target.width / target.height).toBeCloseTo(794 / 1123, 5);
  });

  it('captures physics transform without bounding-box distortion', () => {
    const transform = 'translate3d(120px, 340px, 0) rotate(0.42rad)';
    const from = captureExpandFromPhysics(transform, BODY_W, BODY_H);
    expect(from).toEqual({
      tx: 120,
      ty: 340,
      rot: 0.42,
      cardWidth: BODY_W,
      shellH: BODY_H,
    });
    expect(parseTransformTranslate(transform)).toEqual({ tx: 120, ty: 340 });
  });

  it('offsets physics transform into viewport space', () => {
    const transform = 'translate3d(120px, 340px, 0) rotate(0.42rad)';
    const from = captureExpandFromPhysics(transform, BODY_W, BODY_H, { left: 16, top: 24 });
    expect(from.tx).toBe(136);
    expect(from.ty).toBe(364);
    expect(from.cardWidth).toBe(BODY_W);
    expect(from.shellH).toBe(BODY_H);
  });

  it('expands to viewport center including title band', () => {
    const to = computeExpandToCenter(794, 1123, 1200, 900, TITLE_H);
    expect(to.rot).toBe(0);
    expect(to.cardWidth).toBeGreaterThan(BODY_W);
    expect(to.shellH - TITLE_H).toBeCloseTo(to.cardWidth * (1123 / 794), 1);
    expect(to.tx).toBe(600 - to.cardWidth / 2);
    expect(to.ty).toBe(450 - to.shellH / 2);
  });

  it('derives top-left from center when size changes under rotation', () => {
    const base = captureExpandFromPhysics('translate3d(80px, 200px, 0) rotate(0.5rad)', BODY_W, BODY_H);
    const { cx, cy } = frameCenter(base);
    const wide = frameFromCenter(cx, cy, 0.5, 320, 420);
    expect(wide.tx).toBe(cx - 160);
    expect(wide.ty).toBe(cy - 210);
    const back = frameFromCenter(cx, cy, 0.5, BODY_W, BODY_H);
    expect(back.tx).toBe(base.tx);
    expect(back.ty).toBe(base.ty);
  });
});
