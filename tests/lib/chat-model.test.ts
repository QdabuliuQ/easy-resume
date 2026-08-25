import { afterEach, describe, expect, it } from 'vitest';
import { ChatOpenAI } from '@langchain/openai';
import { createChatModel, createDeepSeekModel, createSenseNovaModel } from '@/lib/ai/chatModel';

function chatModelId(m: unknown): string | undefined {
  return m instanceof ChatOpenAI ? m.model : undefined;
}

describe('createChatModel', () => {
  afterEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.BASE_API_KEY;
  });

  it('throws when no deepseek key', () => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.BASE_API_KEY;
    expect(() => createChatModel()).toThrow('缺少 DEEPSEEK_API_KEY');
  });

  it('creates deepseek model when key set', () => {
    process.env.DEEPSEEK_API_KEY = 'sk-test';
    expect(createChatModel({ temperature: 0.2 })).toBeTruthy();
    expect(chatModelId(createChatModel())).toBe('deepseek-v4-flash');
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
