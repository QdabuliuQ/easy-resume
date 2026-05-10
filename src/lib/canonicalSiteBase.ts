import { headers } from 'next/headers';

function trimSlash(s: string) {
  return s.replace(/\/+$/, '');
}

const BP = process.env.NEXT_PUBLIC_BASE_PATH ?? '/easy-resume';

/** 运行时解析站点根（含 basePath）；优先 SITE_URL（不设 NEXT_PUBLIC 亦可），其次 NEXT_PUBLIC_SITE_URL，再用请求头（反代需传 X-Forwarded-*） */
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
      const basePath = BP.startsWith('/') ? BP : `/${BP}`;
      return trimSlash(`${proto}://${host}${basePath}`);
    }
  } catch {
    /* headers() unavailable */
  }
  const basePath = BP.startsWith('/') ? BP : `/${BP}`;
  return trimSlash(`http://localhost:3010${basePath}`);
}
