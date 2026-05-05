import { forwardChatanywhereChatCompletions } from '@/lib/chatanywhereChatForward';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  return forwardChatanywhereChatCompletions(body);
}
