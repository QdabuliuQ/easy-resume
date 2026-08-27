/** 最大倾斜（弧度）：小于 90°，避免完全横放 */
export const MAX_RESUME_TILT = Math.PI / 2 - 0.1;

/** 将角度约束在正面半球内，且倾斜不超过 MAX_RESUME_TILT */
export function clampResumeTilt(angle: number): number {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  if (a > Math.PI / 2) a -= Math.PI;
  if (a < -Math.PI / 2) a += Math.PI;
  return Math.max(-MAX_RESUME_TILT, Math.min(MAX_RESUME_TILT, a));
}
