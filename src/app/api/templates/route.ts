import { NextRequest, NextResponse } from 'next/server';
import { listLocalTemplates } from '@/lib/localTemplateStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 前台模板目录：含 overrides / 自定义 / previewImage；lite=1 去掉 modules 减首屏体积 */
export async function GET(req: NextRequest) {
  const lite = req.nextUrl.searchParams.get('lite') === '1';
  const list = await listLocalTemplates();
  return NextResponse.json({
    list: list.map((t) => ({
      id: t.id,
      title: t.title,
      previewImage: t.previewImage || undefined,
      config: lite
        ? {
            name: t.config.name,
            globalStyle: t.config.globalStyle,
            pages: [{ modules: [] }],
          }
        : t.config,
    })),
  });
}
