import { NextRequest, NextResponse } from 'next/server';
import { readAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

function cfBase() {
  return (process.env.CF_API_BASE_URL || '').replace(/\/$/, '');
}

async function proxyAdmin(path: string) {
  const session = await readAdminSession();
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  const base = cfBase();
  const secret = process.env.ADMIN_SECRET || '';
  if (!base) return NextResponse.json({ error: '未配置 CF_API_BASE_URL' }, { status: 503 });
  if (!secret) return NextResponse.json({ error: '未配置 ADMIN_SECRET' }, { status: 503 });

  try {
    const res = await fetch(`${base}${path}`, {
      headers: { 'X-Admin-Key': secret },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '服务不可用' },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  const uid = req.nextUrl.searchParams.get('uid')?.trim() || '';
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (uid) params.set('uid', uid);
  const qs = params.toString() ? `?${params}` : '';
  return proxyAdmin(`/api/admin/resumes${qs}`);
}
