import { afterEach, describe, expect, it } from 'vitest';
import {
  decryptAiPayloadJson,
  encryptAiPayloadHybrid,
  generateRsaKeyPairPem,
  isEncryptedAiPayload,
} from '@/lib/ai/payloadCrypto';
import { stripResumeForAiAnalyze } from '@/lib/stripResumeForAiAnalyze';

describe('payloadCrypto hybrid rsa-aes', () => {
  const pair = generateRsaKeyPairPem();
  const prevPrivate = process.env.AI_PAYLOAD_RSA_PRIVATE_KEY;

  afterEach(() => {
    if (prevPrivate === undefined) delete process.env.AI_PAYLOAD_RSA_PRIVATE_KEY;
    else process.env.AI_PAYLOAD_RSA_PRIVATE_KEY = prevPrivate;
  });

  it('encrypt/decrypt roundtrip', () => {
    process.env.AI_PAYLOAD_RSA_PRIVATE_KEY = pair.privateKey;
    const payload = { pages: [{ modules: [{ type: 'job', id: '1' }] }], analyzeSessionId: 's1' };
    const enc = encryptAiPayloadHybrid(JSON.stringify(payload), pair.publicKey);
    expect(isEncryptedAiPayload(enc)).toBe(true);
    expect(enc.wrappedKey).toBeTruthy();
    const out = decryptAiPayloadJson(enc) as typeof payload;
    expect(out).toEqual(payload);
  });

  it('rejects plaintext when encryption required', () => {
    process.env.AI_PAYLOAD_RSA_PRIVATE_KEY = pair.privateKey;
    expect(() => decryptAiPayloadJson({ pages: [] })).toThrow(/加密格式/);
  });

  it('accepts plaintext when key unset', () => {
    delete process.env.AI_PAYLOAD_RSA_PRIVATE_KEY;
    const body = { message: 'hi' };
    expect(decryptAiPayloadJson(body)).toEqual(body);
  });
});

describe('stripResumeForAiAnalyze', () => {
  it('removes entire info1 modules from pages', () => {
    const cfg = {
      pages: [
        {
          modules: [
            { type: 'info1', id: '1', options: { name: 'a', avatar: 'data:image/png;base64,x' } },
            { type: 'job', id: '2', options: { title: '工作', items: [] } },
          ],
        },
      ],
    };
    const out = stripResumeForAiAnalyze(cfg);
    expect(out.pages[0].modules).toHaveLength(1);
    expect((out.pages[0].modules[0] as { type: string }).type).toBe('job');
    expect(cfg.pages[0].modules).toHaveLength(2);
  });
});
