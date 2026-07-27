export function buildShareUrl(origin: string, locale: string, token: string) {
  const base = origin.replace(/\/$/, '');
  const loc = locale === 'en' ? 'en' : 'zh';
  return `${base}/${loc}/s/${encodeURIComponent(token)}`;
}
