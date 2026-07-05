'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { speechToText } from '@/api/speechToText';
import {
  getRecordMimeType,
  getSpeechInputSupport,
  MAX_RECORD_SEC,
  type SpeechInputSupport,
} from '@/lib/speech/browser';

export type VoiceInputPhase = 'idle' | 'recording' | 'transcribing';

type UseVoiceInputOptions = {
  onText: (text: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
};

export function useVoiceInput({ onText, onError, disabled }: UseVoiceInputOptions) {
  const [phase, setPhase] = useState<VoiceInputPhase>('idle');
  const [support] = useState<SpeechInputSupport>(() => getSpeechInputSupport());
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const mimeRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);
  const phaseRef = useRef<VoiceInputPhase>('idle');
  phaseRef.current = phase;

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (phaseRef.current !== 'recording') return;
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      cleanupStream();
      setPhase('idle');
      return;
    }
    const blob = await new Promise<Blob>((resolve, reject) => {
      recorder.addEventListener(
        'stop',
        () => {
          const type = mimeRef.current || recorder.mimeType || 'audio/webm';
          resolve(new Blob(chunksRef.current, { type }));
        },
        { once: true },
      );
      recorder.addEventListener('error', () => reject(new Error('录音失败')), { once: true });
      recorder.stop();
    });
    cleanupStream();
    if (blob.size < 256) {
      setPhase('idle');
      onError('录音太短，请重试');
      return;
    }
    setPhase('transcribing');
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const { text } = await speechToText(blob, abortRef.current.signal);
      const trimmed = text.trim();
      if (!trimmed) {
        onError('未识别到有效内容');
      } else {
        onText(trimmed);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      onError(e instanceof Error ? e.message : '语音识别失败');
    } finally {
      setPhase('idle');
    }
  }, [cleanupStream, onError, onText]);

  const startRecording = useCallback(async () => {
    if (disabled || phaseRef.current !== 'idle') return;
    if (!support.ok) {
      onError(
        support.reason === 'wechat'
          ? '微信内无法录音，请在系统浏览器中打开'
          : support.reason === 'insecure'
            ? '语音输入需要 HTTPS 或 localhost 环境'
            : '当前浏览器不支持语音输入',
      );
      return;
    }
    const mime = getRecordMimeType();
    if (!mime) {
      onError('当前浏览器不支持录音格式');
      return;
    }
    mimeRef.current = mime;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 128000 });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.addEventListener('dataavailable', (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      });
      recorder.start(250);
      setPhase('recording');
      timerRef.current = window.setTimeout(() => {
        void stopRecording();
      }, MAX_RECORD_SEC * 1000);
    } catch {
      cleanupStream();
      setPhase('idle');
      onError('无法访问麦克风，请检查权限设置');
    }
  }, [cleanupStream, disabled, onError, stopRecording, support]);

  const toggle = useCallback(() => {
    if (phaseRef.current === 'recording') void stopRecording();
    else void startRecording();
  }, [startRecording, stopRecording]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      cleanupStream();
    },
    [cleanupStream],
  );

  return {
    phase,
    toggle,
    stop: stopRecording,
  };
}
