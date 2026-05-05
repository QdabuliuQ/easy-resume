import { forwardBigmodelChatCompletions } from '@/lib/bigmodelChatForward';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  return forwardBigmodelChatCompletions(body);
}
