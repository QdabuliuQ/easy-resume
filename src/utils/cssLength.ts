/**
 * 将 CSS 长度近似为像素，仅用于必须数字的场景（viewport、Fabric、缩放计算等）。
 * 画布/PDF 版心样式仍应使用原始字符串（如 `210mm`）。
 */
export function cssLengthToApproxPx(value: string | number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  const s = String(value).trim();
  const m = s.match(/^([\d.]+)\s*(mm|px|pt|cm|in)?$/i);
  if (!m) return 794;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return 794;
  const u = (m[2] || 'px').toLowerCase();
  switch (u) {
    case 'mm':
      return Math.round((n * 96) / 25.4);
    case 'cm':
      return Math.round((n * 96) / 2.54);
    case 'in':
      return Math.round(n * 96);
    case 'pt':
      return Math.round((n * 96) / 72);
    case 'px':
    default:
      return Math.round(n);
  }
}
