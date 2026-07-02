import { describe, expect, it, beforeEach } from 'vitest';
import {
  AI_MODIFY_CHAT_STORAGE_KEY,
  clearAiModifyChatMessages,
  loadAiModifyChatMessages,
  resetAiModifyChatSession,
  saveAiModifyChatMessages,
  subscribeAiModifyChatReset,
  toStoredAiModifyChatMessages,
} from '@/lib/aiModifyChatSessionStorage';

describe('aiModifyChatSessionStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('round-trips messages excluding streaming', () => {
    saveAiModifyChatMessages([
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '好的' },
    ]);
    expect(loadAiModifyChatMessages()).toEqual([
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '好的' },
    ]);
  });

  it('toStoredAiModifyChatMessages drops streaming assistant', () => {
    const stored = toStoredAiModifyChatMessages([
      { role: 'user', content: '问' },
      { role: 'assistant', content: '', isStreaming: true },
    ]);
    expect(stored).toEqual([{ role: 'user', content: '问' }]);
  });

  it('clears storage when saving empty list', () => {
    sessionStorage.setItem(AI_MODIFY_CHAT_STORAGE_KEY, '[]');
    saveAiModifyChatMessages([]);
    expect(sessionStorage.getItem(AI_MODIFY_CHAT_STORAGE_KEY)).toBeNull();
  });

  it('clearAiModifyChatMessages removes persisted chat', () => {
    saveAiModifyChatMessages([{ role: 'user', content: 'hi' }]);
    clearAiModifyChatMessages();
    expect(loadAiModifyChatMessages()).toEqual([]);
    expect(sessionStorage.getItem(AI_MODIFY_CHAT_STORAGE_KEY)).toBeNull();
  });

  it('resetAiModifyChatSession clears storage and notifies subscribers', () => {
    saveAiModifyChatMessages([{ role: 'user', content: 'old' }]);
    let notified = 0;
    const unsub = subscribeAiModifyChatReset(() => {
      notified += 1;
    });
    resetAiModifyChatSession();
    unsub();
    expect(loadAiModifyChatMessages()).toEqual([]);
    expect(notified).toBe(1);
  });
});
