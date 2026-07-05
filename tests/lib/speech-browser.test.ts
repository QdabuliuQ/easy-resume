import { describe, expect, it } from 'vitest';
import { getRecordMimeType, getSpeechInputSupport } from '@/lib/speech/browser';

describe('speech browser', () => {
  it('getSpeechInputSupport 非安全上下文不可用', () => {
    const r = getSpeechInputSupport();
    expect(r.ok).toBe(false);
  });

  it('getRecordMimeType 无 MediaRecorder 返回空', () => {
    expect(getRecordMimeType()).toBe('');
  });
});
