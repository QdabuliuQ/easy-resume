import { normalizePem } from '@/lib/ai/payloadCrypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 运行时下发 RSA 公钥，避免 NEXT_PUBLIC 必须在 build 前注入 */
export async function GET() {
  const raw =
    process.env.AI_PAYLOAD_RSA_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_AI_PAYLOAD_RSA_PUBLIC_KEY?.trim();
  if (!raw) {
    return Response.json({ publicKey: null });
  }
  return Response.json({ publicKey: normalizePem(raw) });
}
