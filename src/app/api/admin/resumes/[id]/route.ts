import { NextRequest, NextResponse } from 'next/server';
import { readAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

function cfBase() {
  return (process.env.CF_API_BASE_URL || '').replace(/\/$/, '');
}

async function adminGate() {
  const session = await readAdminSession();
  if (!session) return { error: NextResponse.json({ error: '请先登录' }, { status: 401 }) };
  const base = cfBase();
  const secret = process.env.ADMIN_SECRET || '';
  if (!base) return { error: NextResponse.json({ error: '未配置 CF_API_BASE_URL' }, { status: 503 }) };
  if (!secret) return { error: NextResponse.json({ error: '未配置 ADMIN_SECRET' }, { status: 503 }) };
  return { base, secret };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const gate = await adminGate();
  if ('error' in gate) return gate.error;

  const id = params.id?.trim();
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  try {
    const res = await fetch(`${gate.base}/api/admin/resume?id=${encodeURIComponent(id)}`, {
      headers: { 'X-Admin-Key': gate.secret },
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const gate = await adminGate();
  if ('error' in gate) return gate.error;

  const id = params.id?.trim();
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });

  try {
    const res = await fetch(`${gate.base}/api/admin/resume?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Key': gate.secret },
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
