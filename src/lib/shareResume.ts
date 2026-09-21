import { cfApiBase, cfApiHeaders, cfApiSecret } from '@/lib/cfApi';

export type PublicShareResult =
  | { ok: true; content: unknown; response: Record<string, unknown> }
  | { ok: false; status: number; code?: string; error?: string };

/** 服务端读取分享简历；页面和 API 路由共用，避免分享页首屏再发一次请求。 */
export async function getPublicShareResume(tokenInput: string): Promise<PublicShareResult> {
  const token = tokenInput.trim();
  if (!token || token.length < 16) {
    return { ok: false, status: 404, code: 'not_found', error: '链接无效' };
  }

  const base = cfApiBase();
  if (!base) return { ok: false, status: 503, error: '未配置 CF_API_BASE_URL' };
  if (!cfApiSecret()) return { ok: false, status: 503, error: '未配置 CF_API_SECRET' };

  try {
    const res = await fetch(
      `${base}/api/resume/public?token=${encodeURIComponent(token)}`,
      { headers: cfApiHeaders(), cache: 'no-store' },
    );
    const data = (await res.json()) as { content?: unknown; code?: string; error?: string };
    if (!res.ok || !data.content) {
      return { ok: false, status: res.status, code: data.code, error: data.error };
    }
    return { ok: true, content: data.content, response: data as Record<string, unknown> };
  } catch (e) {
    return { ok: false, status: 502, error: e instanceof Error ? e.message : '分享服务不可用' };
  }
}
