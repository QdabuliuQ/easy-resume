import { headers } from 'next/headers';

function trimSlash(s: string) {
  return s.replace(/\/+$/, '');
}

/** 运行时解析站点根；优先 SITE_URL，其次 NEXT_PUBLIC_SITE_URL，再用请求头 */
export async function getCanonicalSiteBase(): Promise<string> {
  const env =
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return trimSlash(env);
  try {
    const h = await headers();
    const host = (h.get('x-forwarded-host') ?? h.get('host') ?? '').split(',')[0]?.trim();
    const proto = (h.get('x-forwarded-proto') ?? 'http').split(',')[0]?.trim() || 'http';
    if (host) {
      return trimSlash(`${proto}://${host}`);
    }
  } catch {
    /* headers() unavailable */
  }
  return 'http://localhost:3010';
}
