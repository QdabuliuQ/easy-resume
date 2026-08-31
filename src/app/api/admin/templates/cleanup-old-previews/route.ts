import { NextResponse } from 'next/server';
import { readAdminSession } from '@/lib/adminAuth';
import {
  deleteQiniuKeys,
  isLegacyTemplatePreviewKey,
  listQiniuKeys,
} from '@/lib/qiniuManage';
import { listLocalTemplates } from '@/lib/localTemplateStore';
import { resumeTemplates } from '@/json/resumeTemplates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  if (!(await readAdminSession())) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 });
  }
  try {
    const locals = await listLocalTemplates();
    const ids = new Set<string>([
      ...resumeTemplates.map((t) => t.id),
      ...locals.map((t) => t.id),
    ]);
    const allKeys = await listQiniuKeys('');
    const legacy = allKeys.filter((k) => isLegacyTemplatePreviewKey(k, ids));
    const { deleted, failed } = await deleteQiniuKeys(legacy);
    return NextResponse.json({
      scanned: allKeys.length,
      matched: legacy.length,
      deleted,
      failed,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '清理失败' },
      { status: 503 },
    );
  }
}
