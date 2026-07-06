import { encryptAiPayloadForTransport } from '@/lib/ai/payloadCrypto.client';

export async function secureJsonPost(
  path: string,
  payload: unknown,
  init?: Omit<RequestInit, 'method' | 'body' | 'headers'> & { headers?: Record<string, string> },
): Promise<Response> {
  const body = await encryptAiPayloadForTransport(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...init?.headers,
  };
  if (body && typeof body === 'object' && 'v' in body && 'enc' in body) {
    headers['X-Payload-Encrypted'] = '1';
  }
  return fetch(path, {
    ...init,
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}
