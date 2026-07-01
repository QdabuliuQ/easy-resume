import type { ResumeDiff } from '@/lib/resumeDiff';

export const AI_MODIFY_CHAT_STORAGE_KEY = 'easy-resume-ai-modify-chat';

export type StoredAiModifyChatItem = {
  role: 'user' | 'assistant';
  content: string;
  pendingModify?: {
    diffs: ResumeDiff[];
    proposedResume: unknown;
    revealCount?: number;
    resolved?: 'applied' | 'cancelled';
    appliedIds?: string[];
    cancelledIds?: string[];
  };
};

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function isValidStoredItem(v: unknown): v is StoredAiModifyChatItem {
  if (!v || typeof v !== 'object') return false;
  const m = v as StoredAiModifyChatItem;
  return (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string';
}

function normalizeRestoredItem(m: StoredAiModifyChatItem): StoredAiModifyChatItem {
  if (!m.pendingModify?.resolved && m.pendingModify?.revealCount !== undefined) {
    return { ...m, pendingModify: { ...m.pendingModify, revealCount: undefined } };
  }
  return m;
}

export function loadAiModifyChatMessages(): StoredAiModifyChatItem[] {
  if (!canUseSessionStorage()) return [];
  try {
    const raw = window.sessionStorage.getItem(AI_MODIFY_CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidStoredItem).map(normalizeRestoredItem);
  } catch {
    return [];
  }
}

export function clearAiModifyChatMessages(): void {
  saveAiModifyChatMessages([]);
}

export function saveAiModifyChatMessages(messages: StoredAiModifyChatItem[]): void {
  if (!canUseSessionStorage()) return;
  try {
    if (!messages.length) {
      window.sessionStorage.removeItem(AI_MODIFY_CHAT_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(AI_MODIFY_CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // quota / private mode
  }
}

export function toStoredAiModifyChatMessages(
  messages: Array<StoredAiModifyChatItem & { isStreaming?: boolean }>,
): StoredAiModifyChatItem[] {
  return messages
    .filter((m) => !m.isStreaming)
    .map(({ role, content, pendingModify }) => ({ role, content, pendingModify }));
}
