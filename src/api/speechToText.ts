export type SpeechToTextResult = { text: string };

export async function speechToText(blob: Blob, signal?: AbortSignal): Promise<SpeechToTextResult> {
  const form = new FormData();
  form.append('audio', blob, blob.type.includes('mp4') ? 'speech.m4a' : 'speech.webm');
  const res = await fetch('/api/ai/speech-to-text', { method: 'POST', body: form, signal });
  const data = (await res.json()) as { success?: boolean; data?: SpeechToTextResult; error?: string };
  if (!res.ok || !data.success || !data.data?.text) {
    throw new Error(data.error ?? '语音识别失败');
  }
  return data.data;
}
