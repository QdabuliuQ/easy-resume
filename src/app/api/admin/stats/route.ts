import { NextResponse } from 'next/server';
import { readAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

function cfBase() {
  return (process.env.CF_API_BASE_URL || '').replace(/\/$/, '');
}

export async function GET() {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const base = cfBase();
  const secret = process.env.ADMIN_SECRET || '';
  if (!base) return NextResponse.json({ error: '未配置 CF_API_BASE_URL' }, { status: 503 });
  if (!secret) return NextResponse.json({ error: '未配置 ADMIN_SECRET' }, { status: 503 });

  try {
    const res = await fetch(`${base}/api/admin/stats`, {
      headers: { 'X-Admin-Key': secret },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '统计服务不可用' },
      { status: 502 },
    );
  }
}
