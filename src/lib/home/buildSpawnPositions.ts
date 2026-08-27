import { MAX_RESUME_TILT } from '@/lib/home/resumeTiltLimits';

export type SpawnPoint = {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  angularVelocity: number;
};

function seededUnit(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** ponytail: 伪随机散落；刷新后立即下落 */
export function buildSpawnPositions(
  count: number,
  viewW: number,
  rowStride: number,
): SpawnPoint[] {
  const margin = 40;
  const usableW = Math.max(80, viewW - margin * 2);
  return Array.from({ length: count }, (_, i) => {
    const r1 = seededUnit(i, 1);
    const r2 = seededUnit(i, 2);
    const r3 = seededUnit(i, 3);
    const r4 = seededUnit(i, 4);
    const r5 = seededUnit(i, 5);
    const x = margin + r1 * usableW + (seededUnit(i, 6) - 0.5) * 28;
    const y = -90 - r2 * rowStride * 5.2 - seededUnit(i, 7) * rowStride * 2.4 - i * 14;
    const angle = (r3 - 0.5) * 2 * MAX_RESUME_TILT;
    const vx = (r4 - 0.5) * 3.4;
    const vy = r5 * 1.2;
    const angularVelocity = (r3 - 0.5) * 0.42;
    return { x, y, angle, vx, vy, angularVelocity };
  });
}
