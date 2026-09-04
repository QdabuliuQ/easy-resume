import { ChatOpenAI } from '@langchain/openai';
import type { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { AIMessageChunk } from '@langchain/core/messages';
import type { Runnable } from '@langchain/core/runnables';

export type AppChatModel = Runnable<BaseLanguageModelInput, AIMessageChunk>;

const DEEPSEEK_BASE_URL =
  process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash';
const MODIFY_CHAT_MODEL = process.env.MODIFY_CHAT_MODEL?.trim() || DEEPSEEK_MODEL;

const SENSENOVA_BASE_URL =
  process.env.SENSENOVA_BASE_URL?.trim() || 'https://token.sensenova.cn/v1';
const SENSENOVA_MODEL = process.env.SENSENOVA_MODEL?.trim() || 'deepseek-v4-flash';

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
    streamUsage: false,
    configuration: { baseURL: opts.baseURL },
    modelKwargs: opts.jsonMode ? { response_format: { type: 'json_object' } } : undefined,
  });
}

/** DeepSeek 官方 API：AI 评分、对话修改、模拟面试、简历导入等 */
export function createDeepSeekModel(opts?: {
  temperature?: number;
  jsonMode?: boolean;
  model?: string;
}): AppChatModel {
  const temperature = opts?.temperature ?? 0.7;
  const jsonMode = opts?.jsonMode ?? false;
  const model = createOpenAiModel({
    apiKey: process.env.DEEPSEEK_API_KEY?.trim() || process.env.BASE_API_KEY?.trim(),
    baseURL: DEEPSEEK_BASE_URL,
    model: opts?.model?.trim() || DEEPSEEK_MODEL,
    temperature,
    jsonMode,
  });
  if (!model) throw new Error('缺少 DEEPSEEK_API_KEY');
  return model;
}

/** 商汤 SenseNova：AI 润色默认 deepseek-v4-flash */
export function createSenseNovaModel(opts?: {
  temperature?: number;
  jsonMode?: boolean;
  model?: string;
}): AppChatModel {
  const temperature = opts?.temperature ?? 0.7;
  const jsonMode = opts?.jsonMode ?? false;
  const model = createOpenAiModel({
    apiKey: process.env.SENSENOVA_API_KEY?.trim(),
    baseURL: SENSENOVA_BASE_URL,
    model: opts?.model?.trim() || SENSENOVA_MODEL,
    temperature,
    jsonMode,
  });
  if (!model) throw new Error('缺少 SENSENOVA_API_KEY');
  return model;
}

/** AI 对话修改：DeepSeek 官方 API */
export function createModifyChatModel(opts?: { temperature?: number; jsonMode?: boolean }): AppChatModel {
  return createDeepSeekModel({
    temperature: opts?.temperature,
    jsonMode: opts?.jsonMode,
    model: MODIFY_CHAT_MODEL,
  });
}

/** AI 评分等通用链路：DeepSeek */
export function createChatModel(opts?: { temperature?: number; jsonMode?: boolean }): AppChatModel {
  return createDeepSeekModel({
    temperature: opts?.temperature,
    jsonMode: opts?.jsonMode,
  });
}
