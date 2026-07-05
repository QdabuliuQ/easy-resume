const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const ASR_URL = 'https://vop.baidu.com/server_api';
const DEV_PID = 1537;
const CUID = 'easy-resume';

type TokenCache = { token: string; expiresAt: number };

type BaiduAsrResponse = {
  err_no?: number;
  err_msg?: string;
  result?: string[];
};

let tokenCache: TokenCache | null = null;

export function getBaiduSpeechCredentials(): { apiKey: string; secretKey: string } {
  const apiKey =
    process.env.BAIDU_SPEECH_API_KEY?.trim() || process.env.BAIDU_OCR_API_KEY?.trim();
  const secretKey =
    process.env.BAIDU_SPEECH_SECRET_KEY?.trim() || process.env.BAIDU_OCR_SECRET_KEY?.trim();
  if (!apiKey || !secretKey) {
    throw new Error('缺少 BAIDU_SPEECH_API_KEY/SECRET_KEY（或与 OCR 共用 BAIDU_OCR_*）');
  }
  return { apiKey, secretKey };
}

async function fetchBaiduSpeechAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }
  const { apiKey, secretKey } = getBaiduSpeechCredentials();
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: apiKey,
    client_secret: secretKey,
  });
  const res = await fetch(`${TOKEN_URL}?${params.toString()}`, { method: 'POST' });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) {
    const msg = data.error_description || data.error || `HTTP ${res.status}`;
    throw new Error(`百度语音获取 access_token 失败：${msg}`);
  }
  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 2_592_000;
  tokenCache = { token: data.access_token, expiresAt: Date.now() + expiresIn * 1000 };
  return data.access_token;
}

export function baiduAsrResultToText(result: string[] | undefined): string {
  if (!result?.length) return '';
  return result.join('').trim();
}

function formatAsrError(errNo: number, errMsg?: string): string {
  if (errNo === 3300) return '音频输入参数不正确';
  if (errNo === 3301) return '音频质量过差，请重试';
  if (errNo === 3302) return '鉴权失败，请检查语音 API 密钥';
  if (errNo === 3304) return '请求过于频繁，请稍后重试';
  if (errNo === 3310) return '音频过长，请控制在 60 秒内';
  return errMsg ? `语音识别失败（${errNo}）：${errMsg}` : `语音识别失败（${errNo}）`;
}

/** 百度短语音识别标准版：16kHz 单声道 PCM */
export async function baiduShortSpeechRecognize(pcm: Buffer): Promise<string> {
  if (!pcm.length) throw new Error('音频为空');
  const token = await fetchBaiduSpeechAccessToken();
  const res = await fetch(ASR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      format: 'pcm',
      rate: 16000,
      channel: 1,
      dev_pid: DEV_PID,
      token,
      cuid: CUID,
      len: pcm.length,
      speech: pcm.toString('base64'),
    }),
  });
  const data = (await res.json()) as BaiduAsrResponse;
  if (!res.ok) throw new Error(`百度语音请求失败：HTTP ${res.status}`);
  if (data.err_no !== 0) throw new Error(formatAsrError(data.err_no ?? -1, data.err_msg));
  return baiduAsrResultToText(data.result);
}

/** 测试用：重置 token 缓存 */
export function resetBaiduSpeechTokenCacheForTests(): void {
  tokenCache = null;
}
