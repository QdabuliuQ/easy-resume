import { ChatOpenAI } from '@langchain/openai';
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AIMessageChunk } from '@langchain/core/messages';
import type { Runnable } from '@langchain/core/runnables';

export type AppChatModel = Runnable<BaseLanguageModelInput, AIMessageChunk>;

const XFYUN_MAAS_BASE_URL =
  process.env.XFYUN_MAAS_BASE_URL?.trim() ||
  'https://maas-coding-api.cn-huabei-1.xf-yun.com/v2';
const XFYUN_MAAS_MODEL =
  process.env.XFYUN_MAAS_MODEL?.trim() || 'xsparkx2flash';

const CHATANYWHERE_BASE_URL = 'https://api.chatanywhere.tech/v1';
const CHATANYWHERE_MODEL = 'deepseek-v4-flash';

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash';
const MODIFY_CHAT_MODEL = process.env.MODIFY_CHAT_MODEL?.trim() || DEEPSEEK_MODEL;

function createOpenAiModel(opts: {
  apiKey?: string;
  baseURL: string;
  model: string;
  temperature: number;
  jsonMode?: boolean;
}): BaseChatModel | null {
  const key = opts.apiKey?.trim();
  if (!key) return null;
  return new ChatOpenAI({
    apiKey: key,
    model: opts.model,
    temperature: opts.temperature,
    configuration: { baseURL: opts.baseURL },
    modelKwargs: opts.jsonMode ? { response_format: { type: 'json_object' } } : undefined,
  });
}

/** AI 对话修改专用：DeepSeek 官方 API */
export function createModifyChatModel(opts?: { temperature?: number; jsonMode?: boolean }): AppChatModel {
  const temperature = opts?.temperature ?? 0.7;
  const jsonMode = opts?.jsonMode ?? false;
  const model = createOpenAiModel({
    apiKey: process.env.DEEPSEEK_API_KEY?.trim() || process.env.BASE_API_KEY?.trim(),
    baseURL: DEEPSEEK_BASE_URL,
    model: MODIFY_CHAT_MODEL,
    temperature,
    jsonMode,
  });
  if (!model) throw new Error('缺少 DEEPSEEK_API_KEY（对话修改需 DeepSeek 官方 Key）');
  return model;
}

/** 优先讯飞星辰 Coding Plan MaaS，失败时降级 ChatAnywhere */
export function createChatModel(opts?: { temperature?: number; jsonMode?: boolean }): AppChatModel {
  const temperature = opts?.temperature ?? 0.7;
  const jsonMode = opts?.jsonMode ?? false;
  const primary = createOpenAiModel({
    apiKey: process.env.XFYUN_MAAS_API_KEY?.trim(),
    baseURL: XFYUN_MAAS_BASE_URL,
    model: XFYUN_MAAS_MODEL,
    temperature,
    jsonMode,
  });
  const fallback = createOpenAiModel({
    apiKey: process.env.CHATANYWHERE_API_KEY?.trim(),
    baseURL: CHATANYWHERE_BASE_URL,
    model: CHATANYWHERE_MODEL,
    temperature,
    jsonMode,
  });
  if (primary && fallback) return primary.withFallbacks([fallback]);
  if (primary) return primary;
  if (fallback) return fallback;
  throw new Error('缺少 XFYUN_MAAS_API_KEY 或 CHATANYWHERE_API_KEY');
}
