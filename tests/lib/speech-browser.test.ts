import { describe, expect, it, vi } from 'vitest';
import { getRecordMimeType, getSpeechInputSupport, isWeChatBrowser } from '@/lib/speech/browser';

describe('speech browser helpers', () => {
  it('detects wechat ua', () => {
    vi.stubGlobal('navigator', { userAgent: 'MicroMessenger/8.0' });
    expect(isWeChatBrowser()).toBe(true);
  });

  it('blocks insecure context', () => {
    vi.stubGlobal('window', { isSecureContext: false });
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() }, userAgent: '' });
    vi.stubGlobal('MediaRecorder', class {});
    expect(getSpeechInputSupport()).toEqual({ ok: false, reason: 'insecure' });
  });

  it('picks supported mime type', () => {
    vi.stubGlobal('MediaRecorder', {
      isTypeSupported: (t: string) => t.startsWith('audio/webm'),
    });
    expect(getRecordMimeType()).toBe('audio/webm;codecs=opus');
  });
});
