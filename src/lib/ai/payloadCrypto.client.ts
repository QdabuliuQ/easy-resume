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
  return btoa(String.fromCharCode(...buf));
}

function getPublicKeyPem(): string | null {
  const raw = process.env.NEXT_PUBLIC_AI_PAYLOAD_RSA_PUBLIC_KEY?.trim();
  if (!raw) return null;
  return normalizePem(raw);
}

async function importPublicKey(): Promise<CryptoKey | null> {
  const pem = getPublicKeyPem();
  if (!pem) return null;
  return crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(pem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );
}

let publicKeyPromise: Promise<CryptoKey | null> | undefined;

function loadPublicKey(): Promise<CryptoKey | null> {
  if (!publicKeyPromise) publicKeyPromise = importPublicKey();
  return publicKeyPromise;
}

export async function isClientAiPayloadEncryptionEnabled(): Promise<boolean> {
  return Boolean(getPublicKeyPem());
}

export async function encryptAiPayloadForTransport(payload: unknown): Promise<EncryptedAiPayload | unknown> {
  const publicKey = await loadPublicKey();
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
