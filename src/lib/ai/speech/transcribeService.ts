import { spawn } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { baiduShortSpeechRecognize } from '@/lib/ai/speech/baiduSpeech';

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const FFMPEG_TIMEOUT_MS = 15_000;

async function runFfmpegToPcm(inputPath: string, outputPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      'ffmpeg',
      ['-y', '-i', inputPath, '-ac', '1', '-ar', '16000', '-f', 's16le', outputPath],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
    const timer = setTimeout(() => {
      proc.kill();
      reject(new Error('音频转码超时'));
    }, FFMPEG_TIMEOUT_MS);
    proc.stderr.on('data', () => {});
    proc.on('error', () => {
      clearTimeout(timer);
      reject(new Error('未找到 ffmpeg，请先安装 ffmpeg'));
    });
    proc.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error('音频转码失败'));
    });
  });
}

export function getSpeechMaxAudioBytes(): number {
  return MAX_AUDIO_BYTES;
}

export async function transcribeAudioBuffer(buffer: Buffer, mime: string): Promise<string> {
  if (buffer.length > MAX_AUDIO_BYTES) throw new Error('音频文件过大');
  const dir = await mkdtemp(join(tmpdir(), 'easy-resume-speech-'));
  const ext = mime.includes('mp4') ? 'm4a' : mime.includes('wav') ? 'wav' : 'webm';
  const inputPath = join(dir, `input.${ext}`);
  const pcmPath = join(dir, 'input.pcm');
  try {
    await writeFile(inputPath, buffer);
    await runFfmpegToPcm(inputPath, pcmPath);
    const pcm = await readFile(pcmPath);
    return await baiduShortSpeechRecognize(pcm);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
