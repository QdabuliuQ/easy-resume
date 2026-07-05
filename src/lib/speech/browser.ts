export type SpeechInputSupport =
  | { ok: true }
  | { ok: false; reason: 'insecure' | 'unsupported' | 'wechat' };

export function isWeChatBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /MicroMessenger/i.test(navigator.userAgent);
}

export function getSpeechInputSupport(): SpeechInputSupport {
  if (typeof window === 'undefined') return { ok: false, reason: 'unsupported' };
  if (!window.isSecureContext) return { ok: false, reason: 'insecure' };
  if (isWeChatBrowser()) return { ok: false, reason: 'wechat' };
  if (!navigator.mediaDevices?.getUserMedia) return { ok: false, reason: 'unsupported' };
  if (typeof MediaRecorder === 'undefined') return { ok: false, reason: 'unsupported' };
  return { ok: true };
}

export function getRecordMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

export const MAX_RECORD_SEC = 60;
