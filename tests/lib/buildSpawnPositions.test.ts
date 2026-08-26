import { describe, expect, it } from 'vitest';
import { buildSpawnPositions } from '@/lib/homeV2/buildSpawnPositions';
import { clampResumeTilt, MAX_RESUME_TILT } from '@/lib/homeV2/resumeTiltLimits';

describe('resumeTiltLimits', () => {
  it('keeps tilt under 90° and blocks upside-down', () => {
    expect(clampResumeTilt(0)).toBe(0);
    expect(clampResumeTilt(Math.PI / 2)).toBeLessThan(Math.PI / 2);
    expect(Math.abs(clampResumeTilt(Math.PI))).toBeLessThan(0.05);
    expect(Math.abs(clampResumeTilt(-Math.PI))).toBeLessThan(0.05);
    expect(Math.abs(clampResumeTilt(2.4))).toBeLessThanOrEqual(MAX_RESUME_TILT);
  });
});

describe('buildSpawnPositions', () => {
  it('returns scattered spawns above the viewport', () => {
    const spawns = buildSpawnPositions(30, 960, 200);
    expect(spawns).toHaveLength(30);
    expect(spawns.every((s) => s.y < -80)).toBe(true);
    expect(spawns.every((s) => s.x > 30 && s.x < 930)).toBe(true);
    const xs = spawns.map((s) => Math.round(s.x / 20));
    expect(new Set(xs).size).toBeGreaterThan(12);
    expect(spawns.every((s) => Math.abs(s.angle) <= MAX_RESUME_TILT)).toBe(true);
  });
});
