import { NextRequest, NextResponse } from 'next/server';
import { cfApiBase, cfApiHeaders, cfApiSecret } from '@/lib/cfApi';

export const dynamic = 'force-dynamic';

/** GET /api/resume/share/[token] — 访客只读拉取 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } },
) {
  const token = params.token?.trim();
  if (!token || token.length < 16) {
    return NextResponse.json({ error: '链接无效', code: 'not_found' }, { status: 404 });
  }

  const base = cfApiBase();
  if (!base) return NextResponse.json({ error: '未配置 CF_API_BASE_URL' }, { status: 503 });
  if (!cfApiSecret()) {
    return NextResponse.json({ error: '未配置 CF_API_SECRET' }, { status: 503 });
  }

  try {
    const res = await fetch(
      `${base}/api/resume/public?token=${encodeURIComponent(token)}`,
      { headers: cfApiHeaders(), cache: 'no-store' },
    );
    const data = await res.json();
    return NextResponse.json(data, {
      status: res.status,
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '分享服务不可用' },
      { status: 502 },
    );
  }
}
