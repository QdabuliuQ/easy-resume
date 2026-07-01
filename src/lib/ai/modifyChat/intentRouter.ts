import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createModifyChatModel } from '@/lib/ai/chatModel';
import { throwIfAborted } from '@/lib/ai/abortSignal';
import { INTENT_ROUTER_HUMAN, INTENT_ROUTER_SYSTEM } from './prompt';
import { formatZodError, parseIntentOutput } from './parse';
import { formatModifyHistory } from './shared';
import type { ModifyChatIntent, ModifyChatMessage } from './types';

const intentPrompt = ChatPromptTemplate.fromMessages([
  ['system', INTENT_ROUTER_SYSTEM],
  ['human', INTENT_ROUTER_HUMAN],
]);

/** 意图分类仅由后端 LLM 判定，不做前端/规则短路 */
export async function classifyModifyIntent(
  messages: ModifyChatMessage[],
  lastUserMessage: string,
  signal?: AbortSignal,
): Promise<ModifyChatIntent> {
  throwIfAborted(signal);
  if (!lastUserMessage.trim()) return 'chat';
  const chain = intentPrompt
    .pipe(createModifyChatModel({ temperature: 0, jsonMode: true }))
    .pipe(new StringOutputParser());
  const raw = await chain.invoke(
    {
      history: formatModifyHistory(messages.slice(0, -1)),
      lastMessage: lastUserMessage,
    },
    { signal },
  );
  try {
    const parsed = parseIntentOutput(raw);
    return parsed.intent;
  } catch (e) {
    console.warn('[modifyChat] intent parse failed, fallback chat:', formatZodError(e));
    return 'chat';
  }
}
