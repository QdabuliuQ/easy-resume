import {
  AI_PAYLOAD_ENC_ALG,
  AI_PAYLOAD_ENC_VERSION,
  normalizePem,
  type EncryptedAiPayload,
} from '@/lib/ai/payloadCrypto';

const AES_KEY_BYTES = 32;
const GCM_IV_BYTES = 12;
const GCM_TAG_BYTES = 16;

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = normalizePem(pem)
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function b64(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  return btoa(binary);
}

function getInlinedPublicKeyPem(): string | null {
  const raw = process.env.NEXT_PUBLIC_AI_PAYLOAD_RSA_PUBLIC_KEY?.trim();
  if (!raw) return null;
  return normalizePem(raw);
}

async function importPublicKeyFromPem(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(pem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );
}

let publicKeyPromise: Promise<CryptoKey | null> | undefined;

async function fetchRuntimePublicKeyPem(): Promise<string | null> {
  const res = await fetch('/api/ai/payload-public-key', { cache: 'no-store' });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => null)) as { publicKey?: string | null } | null;
  const pem = data?.publicKey?.trim();
  return pem || null;
}

async function loadPublicKey(): Promise<CryptoKey | null> {
  const inlined = getInlinedPublicKeyPem();
  if (inlined) {
    try {
      return await importPublicKeyFromPem(inlined);
    } catch {
      // ponytail: bad build-time PEM falls through to runtime fetch
    }
  }
  const runtimePem = await fetchRuntimePublicKeyPem();
  if (!runtimePem) return null;
  try {
    return await importPublicKeyFromPem(runtimePem);
  } catch {
    return null;
  }
}

function getPublicKey(): Promise<CryptoKey | null> {
  if (!publicKeyPromise) publicKeyPromise = loadPublicKey();
  return publicKeyPromise;
}

export async function isClientAiPayloadEncryptionEnabled(): Promise<boolean> {
  return Boolean(await getPublicKey());
}

export async function encryptAiPayloadForTransport(payload: unknown): Promise<EncryptedAiPayload | unknown> {
  const publicKey = await getPublicKey();
  if (!publicKey) return payload;
  const aesRaw = crypto.getRandomValues(new Uint8Array(AES_KEY_BYTES));
  const aesKey = await crypto.subtle.importKey('raw', aesRaw, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(GCM_IV_BYTES));
  const plain = new TextEncoder().encode(JSON.stringify(payload));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: GCM_TAG_BYTES * 8 }, aesKey, plain),
  );
  const tag = encrypted.slice(encrypted.byteLength - GCM_TAG_BYTES);
  const data = encrypted.slice(0, encrypted.byteLength - GCM_TAG_BYTES);
  const wrappedKey = new Uint8Array(await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, aesRaw));
  return {
    v: AI_PAYLOAD_ENC_VERSION,
    enc: AI_PAYLOAD_ENC_ALG,
    wrappedKey: b64(wrappedKey),
    iv: b64(iv),
    tag: b64(tag),
    data: b64(data),
  } satisfies EncryptedAiPayload;
}
