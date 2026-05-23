export const RESUME_PAGE_SIZES = {
  A4: { width: '210mm', height: '297mm' },
  A3: { width: '297mm', height: '420mm' },
  A5: { width: '148mm', height: '210mm' },
  Letter: { width: '8.5in', height: '11in' },
} as const;

export type ResumePageSize = keyof typeof RESUME_PAGE_SIZES;

const KEYS = new Set<string>(Object.keys(RESUME_PAGE_SIZES));

export const RESUME_PAGE_SIZE_OPTIONS: { value: ResumePageSize; label: string }[] =
  [
    { value: 'A4', label: 'A4（210×297 mm）' },
    { value: 'A3', label: 'A3（297×420 mm）' },
    { value: 'A5', label: 'A5（148×210 mm）' },
    { value: 'Letter', label: 'Letter（8.5×11 in）' },
  ];

export function normResumePageSize(v: unknown): ResumePageSize {
  if (typeof v === 'string' && KEYS.has(v)) return v as ResumePageSize;
  return 'A4';
}

/** 旧数据仅有 width/height 时尽力映射到合法 pageSize */
export function resumePageSizeFromLegacyDims(
  w: unknown,
  h: unknown
): ResumePageSize | null {
  const ws = typeof w === 'string' ? w.trim().replace(/\s+/g, '') : '';
  const hs = typeof h === 'string' ? h.trim().replace(/\s+/g, '') : '';
  const pairs: [string, string, ResumePageSize][] = [
    ['210mm', '297mm', 'A4'],
    ['297mm', '420mm', 'A3'],
    ['148mm', '210mm', 'A5'],
    ['8.5in', '11in', 'Letter'],
    ['216mm', '279mm', 'Letter'],
  ];
  for (const [a, b, id] of pairs) {
    if (ws === a && hs === b) return id;
  }
  return null;
}

export function globalStylePageDimensions(gs: {
  pageSize?: unknown;
}): { width: string; height: string } {
  const id = normResumePageSize(gs.pageSize);
  return RESUME_PAGE_SIZES[id];
}

/** 将 CSS 长度（mm/in/px）转换为像素，默认按 96 DPI。 */
export function cssLengthToPx(v: string, dpi = 96): number {
  const s = String(v ?? '').trim().toLowerCase();
  if (!s) return 0;
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  if (s.endsWith('px')) return n;
  if (s.endsWith('in')) return (n * dpi);
  if (s.endsWith('mm')) return (n * dpi) / 25.4;
  return n;
}
