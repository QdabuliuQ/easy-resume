import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createInterface } from 'readline';

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const TRANSCRIBE_TIMEOUT_MS = 45_000;
const FFMPEG_TIMEOUT_MS = 15_000;

type DaemonReply = { ok?: boolean; text?: string; error?: string; ready?: boolean };

let daemonProc: ChildProcessWithoutNullStreams | null = null;
let daemonReady = false;
let daemonBoot: Promise<void> | null = null;
const pending = new Map<number, { resolve: (text: string) => void; reject: (e: Error) => void }>();
let nextId = 0;
let activeId: number | null = null;
let writeChain = Promise.resolve();

function repoSpeechScript(): string {
  return join(process.cwd(), 'scripts/speech/transcribe_daemon.py');
}

function pythonBin(): string {
  return process.env.SPEECH_PYTHON?.trim() || 'python3';
}

function daemonScript(): string {
  return process.env.SPEECH_DAEMON_SCRIPT?.trim() || repoSpeechScript();
}

function rejectAllPending(message: string) {
  for (const [, p] of pending) p.reject(new Error(message));
  pending.clear();
}

async function ensureDaemon(): Promise<void> {
  if (daemonReady && daemonProc && !daemonProc.killed) return;
  if (daemonBoot) return daemonBoot;
  daemonBoot = new Promise<void>((resolve, reject) => {
    const proc = spawn(pythonBin(), [daemonScript()], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });
    daemonProc = proc;
    daemonReady = false;
    const rl = createInterface({ input: proc.stdout });
    const bootTimer = setTimeout(() => {
      reject(new Error('语音识别模型启动超时'));
      proc.kill();
    }, 120_000);
    rl.on('line', (line) => {
      let msg: DaemonReply;
      try {
        msg = JSON.parse(line) as DaemonReply;
      } catch {
        return;
      }
      if (msg.ready) {
        clearTimeout(bootTimer);
        daemonReady = true;
        resolve();
        return;
      }
      const id = activeId;
      if (id === null) return;
      activeId = null;
      const waiter = pending.get(id);
      if (!waiter) return;
      pending.delete(id);
      if (msg.ok && msg.text !== undefined) waiter.resolve(msg.text);
      else waiter.reject(new Error(msg.error ?? '语音识别失败'));
    });
    proc.stderr.on('data', (buf: Buffer) => {
      console.error('[speech-daemon]', buf.toString());
    });
    proc.on('exit', (code) => {
      daemonReady = false;
      daemonProc = null;
      daemonBoot = null;
      rejectAllPending(code === null ? '语音识别进程已终止' : `语音识别进程异常退出 (${code})`);
    });
    proc.on('error', (e) => {
      clearTimeout(bootTimer);
      daemonBoot = null;
      reject(new Error(`无法启动语音识别进程：${e.message}`));
    });
  });
  return daemonBoot;
}

async function transcribeWavPath(wavPath: string): Promise<string> {
  await ensureDaemon();
  if (!daemonProc?.stdin.writable) throw new Error('语音识别服务不可用');
  return new Promise<string>((resolve, reject) => {
    writeChain = writeChain.then(
      () =>
        new Promise<void>((done) => {
          const id = ++nextId;
          activeId = id;
          const timer = setTimeout(() => {
            if (activeId === id) activeId = null;
            pending.delete(id);
            reject(new Error('语音识别超时'));
            done();
          }, TRANSCRIBE_TIMEOUT_MS);
          pending.set(id, {
            resolve: (text) => {
              clearTimeout(timer);
              resolve(text);
              done();
            },
            reject: (e) => {
              clearTimeout(timer);
              reject(e);
              done();
            },
          });
          daemonProc!.stdin.write(`${wavPath}\n`);
        }),
    );
  });
}

async function runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      'ffmpeg',
      ['-y', '-i', inputPath, '-ac', '1', '-ar', '16000', '-f', 'wav', outputPath],
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
  const wavPath = join(dir, 'input.wav');
  try {
    await writeFile(inputPath, buffer);
    await runFfmpeg(inputPath, wavPath);
    await readFile(wavPath);
    return await transcribeWavPath(wavPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
