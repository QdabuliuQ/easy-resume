import { NextRequest, NextResponse } from 'next/server';
import { readAdminSession } from '@/lib/adminAuth';
import { createLocalTemplate, listLocalTemplates, type LocalTemplateRecord } from '@/lib/localTemplateStore';
import {
  getResumeImportValidationError,
  normalizeResumeImportPayload,
} from '@/lib/validateResumeImportJson';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_STYLE = {
  pageSize: 'A4',
  fontSize: 13,
  lineHeight: 1.3,
  moduleMargin: 15,
  color: '#383838',
  backgroundColor: '#fff',
  padding: 20,
  headerType: 9,
  layout: 'default',
};

function emptyConfig(name: string): LocalTemplateRecord['config'] {
  return {
    name,
    globalStyle: { ...DEFAULT_STYLE },
    pages: [{ modules: [] }],
  };
}

function parseCreateBody(body: Record<string, unknown>): {
  id?: string;
  title: string;
  config: LocalTemplateRecord['config'];
  description?: string;
  category?: string;
} {
  const hasConfigWrapper =
    body.config && typeof body.config === 'object' && !Array.isArray(body.config);
  const rawConfig = normalizeResumeImportPayload(hasConfigWrapper ? body : body);
  const validationError = getResumeImportValidationError(rawConfig);
  if (validationError && (hasConfigWrapper || Array.isArray((body as { pages?: unknown }).pages))) {
    throw new Error(`模板配置无效：${validationError}`);
  }
  if (!validationError && rawConfig && typeof rawConfig === 'object') {
    const cfg = rawConfig as LocalTemplateRecord['config'];
    const title =
      (typeof body.title === 'string' && body.title.trim()) ||
      (typeof cfg.name === 'string' && cfg.name.trim()) ||
      '';
    if (!title) throw new Error('标题不能为空');
    return {
      id: typeof body.id === 'string' ? body.id : undefined,
      title,
      config: cfg,
      description: typeof body.description === 'string' ? body.description : undefined,
      category: typeof body.category === 'string' ? body.category : undefined,
    };
  }
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) throw new Error('标题不能为空');
  return {
    id: typeof body.id === 'string' ? body.id : undefined,
    title,
    config: emptyConfig(title),
    description: typeof body.description === 'string' ? body.description : undefined,
    category: typeof body.category === 'string' ? body.category : undefined,
  };
}

export async function GET() {
  if (!(await readAdminSession())) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  return NextResponse.json({ list: await listLocalTemplates() });
}

export async function POST(req: NextRequest) {
  if (!(await readAdminSession())) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体必须是 JSON' }, { status: 400 });
  }
  try {
    const parsed = parseCreateBody(body);
    const created = await createLocalTemplate(parsed);
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '创建失败';
    const status = msg.includes('已存在') ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
