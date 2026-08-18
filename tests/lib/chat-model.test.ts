import { afterEach, describe, expect, it } from 'vitest';
import { ChatOpenAI } from '@langchain/openai';
import { createChatModel, createDeepSeekModel, createSenseNovaModel } from '@/lib/ai/chatModel';

function chatModelId(m: unknown): string | undefined {
  return m instanceof ChatOpenAI ? m.model : undefined;
}

describe('createChatModel', () => {
  afterEach(() => {
    delete process.env.XFYUN_MAAS_API_KEY;
    delete process.env.CHATANYWHERE_API_KEY;
  });

  it('throws when no api key configured', () => {
    delete process.env.XFYUN_MAAS_API_KEY;
    delete process.env.CHATANYWHERE_API_KEY;
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

describe('createDeepSeekModel', () => {
  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.BASE_API_KEY;
  });

  it('throws when no deepseek key', () => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.BASE_API_KEY;
    expect(() => createDeepSeekModel()).toThrow('缺少 DEEPSEEK_API_KEY');
  });

  it('creates model when key set', () => {
    process.env.DEEPSEEK_API_KEY = 'sk-test';
    expect(createDeepSeekModel({ temperature: 1 })).toBeTruthy();
    expect(chatModelId(createDeepSeekModel())).toBe('deepseek-v4-flash');
  });
});

describe('createSenseNovaModel', () => {
  afterEach(() => {
    delete process.env.SENSENOVA_API_KEY;
  });

  it('throws when no sensenova key', () => {
    delete process.env.SENSENOVA_API_KEY;
    expect(() => createSenseNovaModel()).toThrow('缺少 SENSENOVA_API_KEY');
  });

  it('creates model when key set', () => {
    process.env.SENSENOVA_API_KEY = 'sk-test';
    expect(createSenseNovaModel({ temperature: 1 })).toBeTruthy();
    expect(chatModelId(createSenseNovaModel())).toBe('deepseek-v4-flash');
  });
});
