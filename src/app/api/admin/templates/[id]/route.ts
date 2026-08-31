import { NextRequest, NextResponse } from 'next/server';
import { readAdminSession } from '@/lib/adminAuth';
import { deleteLocalTemplate, getLocalTemplate, saveLocalTemplate } from '@/lib/localTemplateStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function gate() {
  return (await readAdminSession())
    ? null
    : NextResponse.json({ error: '请先登录' }, { status: 401 });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await gate();
  if (denied) return denied;
  const template = await getLocalTemplate(params.id);
  return template
    ? NextResponse.json(template)
    : NextResponse.json({ error: '模板不存在' }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await gate();
  if (denied) return denied;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体必须是 JSON' }, { status: 400 });
  }
  const config = body.config;
  if (!config || typeof config !== 'object' || !Array.isArray((config as any).pages)) {
    return NextResponse.json({ error: '模板配置无效：缺少 pages' }, { status: 400 });
  }
  const saved = await saveLocalTemplate(params.id, {
    title: typeof body.title === 'string' ? body.title.trim() : undefined,
    description: typeof body.description === 'string' ? body.description : undefined,
    category: typeof body.category === 'string' ? body.category : undefined,
    status: body.status === 'offline' || body.status === 'draft' ? body.status : 'published',
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : undefined,
    config: config as any,
  });
  return saved
    ? NextResponse.json(saved)
    : NextResponse.json({ error: '模板不存在' }, { status: 404 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await gate();
  if (denied) return denied;
  const ok = await deleteLocalTemplate(params.id);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: '模板不存在' }, { status: 404 });
}
