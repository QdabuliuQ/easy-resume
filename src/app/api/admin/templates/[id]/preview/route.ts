import { NextRequest, NextResponse } from 'next/server';
import { readAdminSession } from '@/lib/adminAuth';
import { saveLocalTemplate } from '@/lib/localTemplateStore';
import { deleteQiniuKeys } from '@/lib/qiniuManage';
import { uploadToQiniu } from '@/lib/qiniuUpload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await readAdminSession())) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) return NextResponse.json({ error: '缺少图片文件' }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: '图片不能超过 8MB' }, { status: 400 });
  try {
    // 扁平 key：WebP 体积更小；覆盖上传 + ?v= 防缓存
    const key = `easy-resume/previews/${params.id}.webp`;
    const url = await uploadToQiniu(file, key);
    // 清掉旧 jpg，避免同模板两份预览
    void deleteQiniuKeys([`easy-resume/previews/${params.id}.jpg`]).catch(() => undefined);
    const previewImage = `${url}?v=${Date.now()}`;
    const saved = await saveLocalTemplate(params.id, { previewImage });
    if (!saved) return NextResponse.json({ error: '模板不存在' }, { status: 404 });
    return NextResponse.json({ url: previewImage, template: saved });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : '图片上传失败' }, { status: 503 });
  }
}
