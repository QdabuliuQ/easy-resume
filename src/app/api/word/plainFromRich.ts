export function sanitizeRichText(html: string): string {
  if (!html?.trim()) return '';
  let s = html;
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  s = s.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  s = s.replace(/<\s*iframe\b[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '');
  s = s.replace(/\son\w+\s*=\s*(['"])[\s\S]*?\1/gi, '');
  s = s.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');
  s = s.replace(/javascript:/gi, '');
  return s;
}
export function plainTextFromRich(html: string): string {
  if (!html?.trim()) return '';
  const safe = sanitizeRichText(html);
  return safe.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
