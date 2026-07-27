import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { cfApiBase, cfApiHeaders, cfApiSecret } from '@/lib/cfApi';

export const dynamic = 'force-dynamic';

async function requireUid() {
  const session = await auth();
  const uid = session?.user?.uid;
  if (!uid) return { error: NextResponse.json({ error: '请先登录后再分享' }, { status: 401 }) };
  const base = cfApiBase();
  if (!base) return { error: NextResponse.json({ error: '未配置 CF_API_BASE_URL' }, { status: 503 }) };
  if (!cfApiSecret()) {
    return { error: NextResponse.json({ error: '未配置 CF_API_SECRET' }, { status: 503 }) };
  }
  return { uid, base };
}

/** GET /api/resume/share?id= — 当前简历分享状态 */
export async function GET(req: NextRequest) {
  const gate = await requireUid();
  if ('error' in gate) return gate.error;

  const id = req.nextUrl.searchParams.get('id')?.trim();
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  try {
    const res = await fetch(
      `${gate.base}/api/resume/share?id=${encodeURIComponent(id)}&uid=${encodeURIComponent(gate.uid)}`,
      { headers: cfApiHeaders(), cache: 'no-store' },
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '分享服务不可用' },
      { status: 502 },
    );
  }
}

/** POST /api/resume/share — 开启/关闭/更新过期/轮换 token */
export async function POST(req: NextRequest) {
  const gate = await requireUid();
  if ('error' in gate) return gate.error;

  let body: {
    id?: string;
    enabled?: boolean;
    expires_at?: number | null;
    rotate?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体必须是 JSON' }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });
  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: '缺少 enabled' }, { status: 400 });
  }

  try {
    const res = await fetch(`${gate.base}/api/resume/share`, {
      method: 'POST',
      headers: cfApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        uid: gate.uid,
        id,
        enabled: body.enabled,
        ...(body.expires_at !== undefined ? { expires_at: body.expires_at } : {}),
        ...(body.rotate === true ? { rotate: true } : {}),
      }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '分享服务不可用' },
      { status: 502 },
    );
  }
}
