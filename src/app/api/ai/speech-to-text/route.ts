import crypto from 'crypto';
import { checkSpeechRateLimit, err, getClientIp, ok } from '@/lib/ai/score/routeShared';
import { getSpeechMaxAudioBytes, transcribeAudioBuffer } from '@/lib/ai/speech/transcribeService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ipHash = crypto.createHash('sha256').update(getClientIp(req)).digest('hex').slice(0, 16);
  try {
    const rate = await checkSpeechRateLimit(ipHash);
    if (!rate.allowed) return err(rate.message, 429, rate.resetIn);
  } catch (e) {
    console.error('[speech-to-text] rate limit failed:', e);
    return err('服务暂时不可用，请稍后重试', 503);
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err('请求体无效', 400);
  }
  const file = form.get('audio');
  if (!(file instanceof File)) return err('请上传 audio 字段', 400);
  if (file.size > getSpeechMaxAudioBytes()) return err('音频文件过大', 413);
  if (file.size < 256) return err('录音太短', 400);
  const mime = file.type || 'application/octet-stream';
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await transcribeAudioBuffer(buffer, mime);
    const trimmed = text.trim();
    if (!trimmed) return err('未识别到有效内容', 422);
    return ok({ text: trimmed });
  } catch (e) {
    const message = e instanceof Error ? e.message : '语音识别失败';
    console.error('[speech-to-text]', message);
    return err(message, 500);
  }
}
