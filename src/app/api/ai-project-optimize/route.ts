import { z } from 'zod';
import { optimizeByScene } from '@/lib/ai/ragResume/optimize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  postType: z.string().optional().default(''),
  rawText: z.string().optional().default(''),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: '参数无效' }, { status: 400 });
    }

    const content = await optimizeByScene('project', parsed.data);
    return Response.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : '服务异常';
    return Response.json({ error: message }, { status: 500 });
  }
}
