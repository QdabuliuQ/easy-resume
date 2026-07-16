import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { cfApiBase, cfApiHeaders, cfApiSecret } from '@/lib/cfApi';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const uid = session?.user?.uid;
  if (!uid) return NextResponse.json({ error: '请先登录 GitHub' }, { status: 401 });

  const id = params.id?.trim();
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  const base = cfApiBase();
  if (!base) return NextResponse.json({ error: '未配置 CF_API_BASE_URL' }, { status: 503 });
  if (!cfApiSecret()) {
    return NextResponse.json({ error: '未配置 CF_API_SECRET' }, { status: 503 });
  }

  try {
    const res = await fetch(
      `${base}/api/resume/get?id=${encodeURIComponent(id)}&uid=${encodeURIComponent(uid)}`,
      { headers: cfApiHeaders(), cache: 'no-store' },
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '加载服务不可用' },
      { status: 502 },
    );
  }
}
