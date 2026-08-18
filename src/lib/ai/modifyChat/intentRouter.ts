import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createModifyChatModel } from '@/lib/ai/chatModel';
import { throwIfAborted } from '@/lib/ai/abortSignal';
import { INTENT_ROUTER_HUMAN, INTENT_ROUTER_SYSTEM } from './prompt';
import { classifyIntentByRules } from './intentRules';
import { formatZodError, parseIntentOutput } from './parse';
import { formatModifyHistory } from './shared';
import type { ModifyChatIntent, ModifyChatMessage } from './types';

const intentPrompt = ChatPromptTemplate.fromMessages([
  ['system', INTENT_ROUTER_SYSTEM],
  ['human', INTENT_ROUTER_HUMAN],
]);

/** 意图分类：规则层预判 → LLM 兜底 */
export async function classifyModifyIntent(
  messages: ModifyChatMessage[],
  lastUserMessage: string,
  signal?: AbortSignal,
): Promise<ModifyChatIntent> {
  throwIfAborted(signal);
  if (!lastUserMessage.trim()) return 'chat';
  const ruled = classifyIntentByRules(lastUserMessage);
  if (ruled) return ruled;
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
