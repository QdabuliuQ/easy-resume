/** YYYY-MM-DD → YYYY-MM，其余格式原样返回 */
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
