import type { ModifyChatMessage } from './types';

export const POLISH_RE = /优化|润色|改写|提升|完善|美化|加强|改进|精炼|突出|量化/;
export const MODIFY_CHAT_MAX_ROUNDS = 4;
export const MODIFY_CHAT_MAX_MESSAGES = MODIFY_CHAT_MAX_ROUNDS * 2;

export function trimModifyChatMessages(messages: ModifyChatMessage[]): ModifyChatMessage[] {
  return messages.slice(-MODIFY_CHAT_MAX_MESSAGES);
}

export function formatModifyHistory(
  messages: ModifyChatMessage[],
  limit = MODIFY_CHAT_MAX_MESSAGES,
): string {
  return messages
    .slice(-limit)
    .map((m) => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`)
    .join('\n');
}

function normalizeMessage(m: ModifyChatMessage): ModifyChatMessage | null {
  const content = m.content.trim();
  if (!content) return null;
  return { role: m.role, content };
}

export function buildModifyChatMessages(
  message: string,
  history: ModifyChatMessage[] = [],
): ModifyChatMessage[] {
  const text = message.trim();
  if (!text) throw new Error('消息不能为空');
  const prior = history
    .map(normalizeMessage)
    .filter((m): m is ModifyChatMessage => m != null);
  return trimModifyChatMessages([...prior, { role: 'user', content: text }]);
}
