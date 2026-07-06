import crypto from 'crypto';

export const AI_PAYLOAD_ENC_VERSION = 2 as const;
export const AI_PAYLOAD_ENC_ALG = 'hybrid-rsa-aes-gcm' as const;
const AES_KEY_BYTES = 32;
const GCM_IV_BYTES = 12;

export type EncryptedAiPayload = {
  v: typeof AI_PAYLOAD_ENC_VERSION;
  enc: typeof AI_PAYLOAD_ENC_ALG;
  wrappedKey: string;
  iv: string;
  tag: string;
  data: string;
};

export function normalizePem(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.includes('\\n') ? trimmed.replace(/\\n/g, '\n') : trimmed;
}

export function isEncryptedAiPayload(body: unknown): body is EncryptedAiPayload {
  if (!body || typeof body !== 'object') return false;
  const o = body as Record<string, unknown>;
  return (
    o.v === AI_PAYLOAD_ENC_VERSION &&
    o.enc === AI_PAYLOAD_ENC_ALG &&
    typeof o.wrappedKey === 'string' &&
    typeof o.iv === 'string' &&
    typeof o.tag === 'string' &&
    typeof o.data === 'string'
  );
}

function getPrivateKeyPem(): string | null {
  const raw = process.env.AI_PAYLOAD_RSA_PRIVATE_KEY?.trim();
  if (!raw) return null;
  return normalizePem(raw);
}

export function isAiPayloadEncryptionRequired(): boolean {
  return Boolean(getPrivateKeyPem());
}

function unwrapAesKey(wrappedKeyB64: string): Buffer {
  const pem = getPrivateKeyPem();
  if (!pem) throw new Error('服务端未配置 AI_PAYLOAD_RSA_PRIVATE_KEY');
  const wrapped = Buffer.from(wrappedKeyB64, 'base64');
  const aesKey = crypto.privateDecrypt(
    {
      key: pem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    wrapped,
  );
  if (aesKey.length !== AES_KEY_BYTES) throw new Error('AES 会话密钥无效');
  return aesKey;
}

function decryptAesGcm(aesKey: Buffer, ivB64: string, tagB64: string, dataB64: string): string {
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  if (iv.length !== GCM_IV_BYTES) throw new Error('IV 无效');
  const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** 测试/脚本用：公钥加密生成 hybrid envelope */
export function encryptAiPayloadHybrid(plaintext: string, publicKeyPem: string): EncryptedAiPayload {
  const aesKey = crypto.randomBytes(AES_KEY_BYTES);
  const iv = crypto.randomBytes(GCM_IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const wrappedKey = crypto.publicEncrypt(
    {
      key: normalizePem(publicKeyPem),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    aesKey,
  );
  return {
    v: AI_PAYLOAD_ENC_VERSION,
    enc: AI_PAYLOAD_ENC_ALG,
    wrappedKey: wrappedKey.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: ciphertext.toString('base64'),
  };
}

export function generateRsaKeyPairPem(): { publicKey: string; privateKey: string } {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

export function decryptAiPayloadJson(body: unknown): unknown {
  if (isEncryptedAiPayload(body)) {
    const aesKey = unwrapAesKey(body.wrappedKey);
    const plain = decryptAesGcm(aesKey, body.iv, body.tag, body.data);
    return JSON.parse(plain) as unknown;
  }
  if (isAiPayloadEncryptionRequired()) {
    throw new Error('请求体须为加密格式');
  }
  return body;
}
