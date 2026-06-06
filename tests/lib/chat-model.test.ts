import { afterEach, describe, expect, it } from 'vitest';
import { createChatModel } from '@/lib/ai/chatModel';

describe('createChatModel', () => {
  afterEach(() => {
    delete process.env.XFYUN_MAAS_API_KEY;
    delete process.env.CHATANYWHERE_API_KEY;
  });

  it('throws when no api key configured', () => {
    expect(() => createChatModel()).toThrow('缺少 XFYUN_MAAS_API_KEY 或 CHATANYWHERE_API_KEY');
  });

  it('creates xfyun model when key set', () => {
    process.env.XFYUN_MAAS_API_KEY = 'app:secret';
    const m = createChatModel({ temperature: 0.2 });
    expect(m).toBeTruthy();
  });

  it('creates chatanywhere model when only chatanywhere key set', () => {
    process.env.CHATANYWHERE_API_KEY = 'sk-test';
    const m = createChatModel();
    expect(m).toBeTruthy();
  });

  it('uses fallbacks when both keys set', () => {
    process.env.XFYUN_MAAS_API_KEY = 'app:secret';
    process.env.CHATANYWHERE_API_KEY = 'sk-test';
    const m = createChatModel();
    expect(m.constructor.name).toBe('RunnableWithFallbacks');
  });
});
