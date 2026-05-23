function normHex(s: string) {
  const t = s.trim().toLowerCase();
  return t.startsWith('#') ? t : `#${t}`;
}
function rgbToHex(s: string) {
  const m = s.trim().match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (!m) return null;
  const clamp = (n: string) => Math.min(255, Math.max(0, parseInt(n, 10)));
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(clamp(m[1]))}${hex(clamp(m[2]))}${hex(clamp(m[3]))}`;
}
export function hexForColorInput(s: string, fb: string) {
  const fromRgb = rgbToHex(s);
  if (fromRgb) return fromRgb;
  const n = normHex(s);
  if (/^#[0-9a-f]{6}$/.test(n)) return n;
  if (/^#[0-9a-f]{3}$/.test(n)) {
    const x = n.slice(1);
    return `#${x[0]}${x[0]}${x[1]}${x[1]}${x[2]}${x[2]}`;
  }
  return fb;
}
