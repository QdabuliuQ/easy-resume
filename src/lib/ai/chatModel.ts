import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

const XFYUN_MAAS_BASE_URL =
  process.env.XFYUN_MAAS_BASE_URL?.trim() ||
  'https://maas-coding-api.cn-huabei-1.xf-yun.com/v2';
const XFYUN_MAAS_MODEL =
  process.env.XFYUN_MAAS_MODEL?.trim() || 'astron-code-latest';

const CHATANYWHERE_BASE_URL = 'https://api.chatanywhere.tech/v1';
const CHATANYWHERE_MODEL = 'deepseek-v4-flash';

function createXfyunMaasModel(temperature: number): BaseChatModel | null {
  const key = process.env.XFYUN_MAAS_API_KEY?.trim();
  if (!key) return null;
  return new ChatOpenAI({
    apiKey: key,
    model: XFYUN_MAAS_MODEL,
    temperature,
    configuration: { baseURL: XFYUN_MAAS_BASE_URL },
  });
}

function createChatanywhereModel(temperature: number): BaseChatModel | null {
  const key = process.env.CHATANYWHERE_API_KEY?.trim();
  if (!key) return null;
  return new ChatOpenAI({
    apiKey: key,
    model: CHATANYWHERE_MODEL,
    temperature,
    configuration: { baseURL: CHATANYWHERE_BASE_URL },
  });
}

/** 优先讯飞星辰 Coding Plan MaaS，失败时降级 ChatAnywhere */
export function createChatModel(opts?: { temperature?: number }): BaseChatModel {
  const temperature = opts?.temperature ?? 0.7;
  const primary = createXfyunMaasModel(temperature);
  const fallback = createChatanywhereModel(temperature);
  if (primary && fallback) {
    return primary.withFallbacks([fallback]);
  }
  if (primary) return primary;
  if (fallback) return fallback;
  throw new Error('缺少 XFYUN_MAAS_API_KEY 或 CHATANYWHERE_API_KEY');
}
