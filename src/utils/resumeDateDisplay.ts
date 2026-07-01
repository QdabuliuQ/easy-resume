/** YYYY-MM-DD → YYYY-MM，其余格式原样返回 */
export const RESUME_PRESENT_END_DATE = '至今';

export function isResumePresentEndDate(raw?: string | null): boolean {
  return String(raw ?? '').trim() === RESUME_PRESENT_END_DATE;
}

export function resumeRangeEndDateString(
  end: import('dayjs').Dayjs | null | undefined,
  endIsPresent: boolean,
): string {
  if (endIsPresent) return RESUME_PRESENT_END_DATE;
  return end?.format('YYYY-MM') ?? '';
}

export function normalizeResumeDateDisplay(raw?: string | null): string {
  if (raw == null) return '';
  const t = String(raw).trim();
  if (!t) return '';
  const m = t.match(/^(\d{4}-\d{2})-\d{2}$/);
  return m ? m[1] : t;
}

export function formatResumeDateRange(start?: string | null, end?: string | null): string {
  const s = normalizeResumeDateDisplay(start);
  const e = normalizeResumeDateDisplay(end);
  if (!s && !e) return '';
  if (s && e) return `${s} - ${e}`;
  return s || e;
}
