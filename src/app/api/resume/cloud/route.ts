import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { cfApiBase, cfApiHeaders, cfApiSecret } from '@/lib/cfApi';

export const dynamic = 'force-dynamic';

async function requireUid() {
  const session = await auth();
  const uid = session?.user?.uid;
  if (!uid) return { error: NextResponse.json({ error: '请先登录 GitHub' }, { status: 401 }) };
  const base = cfApiBase();
  if (!base) return { error: NextResponse.json({ error: '未配置 CF_API_BASE_URL' }, { status: 503 }) };
  if (!cfApiSecret()) {
    return { error: NextResponse.json({ error: '未配置 CF_API_SECRET' }, { status: 503 }) };
  }
  return { uid, base };
}

export async function GET() {
  const gate = await requireUid();
  if ('error' in gate) return gate.error;

  try {
    const res = await fetch(`${gate.base}/api/resume/list?uid=${encodeURIComponent(gate.uid)}`, {
      headers: cfApiHeaders(),
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '列表服务不可用' },
      { status: 502 },
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireUid();
  if ('error' in gate) return gate.error;

  let body: { content?: unknown; id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体必须是 JSON' }, { status: 400 });
  }
  if (body.content === undefined || body.content === null) {
    return NextResponse.json({ error: '缺少 content' }, { status: 400 });
  }

  try {
    const res = await fetch(`${gate.base}/api/resume/save`, {
      method: 'POST',
      headers: cfApiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        uid: gate.uid,
        content: body.content,
        ...(body.id ? { id: body.id } : {}),
      }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '保存服务不可用' },
      { status: 502 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const gate = await requireUid();
  if ('error' in gate) return gate.error;

  const id = req.nextUrl.searchParams.get('id')?.trim();
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  try {
    const res = await fetch(
      `${gate.base}/api/resume/remove?id=${encodeURIComponent(id)}&uid=${encodeURIComponent(gate.uid)}`,
      { method: 'DELETE', headers: cfApiHeaders() },
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '删除服务不可用' },
      { status: 502 },
    );
  }
}
