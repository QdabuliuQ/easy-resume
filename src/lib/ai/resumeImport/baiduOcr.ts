import type { ResumeImportLogger } from '@/lib/ai/resumeImport/logger';

const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const OCR_URLS = {
  accurate: 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic',
  general: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',
} as const;

type OcrApi = keyof typeof OCR_URLS;

type BaiduOcrResponse = {
  words_result?: Array<{ words?: string }>;
  words_result_num?: number;
  pdf_file_size?: string;
  error_code?: number;
  error_msg?: string;
};

type TokenCache = {
  token: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;
/** 进程内记住可用接口，避免每次都先撞无权限的高精度版 */
let preferredApi: OcrApi | null = null;

function resolveConfiguredApi(): OcrApi | 'auto' {
  const raw = process.env.BAIDU_OCR_API?.trim().toLowerCase();
  if (raw === 'general' || raw === 'general_basic') return 'general';
  if (raw === 'accurate' || raw === 'accurate_basic') return 'accurate';
  return 'auto';
}

function getBaiduOcrCredentials(): { apiKey: string; secretKey: string } {
  const apiKey = process.env.BAIDU_OCR_API_KEY?.trim();
  const secretKey = process.env.BAIDU_OCR_SECRET_KEY?.trim();
  if (!apiKey || !secretKey) {
    throw new Error('缺少 BAIDU_OCR_API_KEY 或 BAIDU_OCR_SECRET_KEY');
  }
  return { apiKey, secretKey };
}

async function fetchBaiduAccessToken(log?: ResumeImportLogger): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const { apiKey, secretKey } = getBaiduOcrCredentials();
  log?.step('baidu_token_start');
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
    throw new Error(`百度 OCR 获取 access_token 失败：${msg}`);
  }

  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 2_592_000;
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  log?.step('baidu_token_done', { expiresIn });
  return data.access_token;
}

export function baiduWordsResultToText(wordsResult: Array<{ words?: string }> | undefined): string {
  if (!wordsResult?.length) return '';
  return wordsResult.map((item) => item.words ?? '').filter(Boolean).join('\n');
}

async function postOcr(
  api: OcrApi,
  body: Record<string, string>,
  log?: ResumeImportLogger,
): Promise<BaiduOcrResponse> {
  const accessToken = await fetchBaiduAccessToken(log);
  const params = new URLSearchParams(body);
  if (!params.has('language_type')) params.set('language_type', 'CHN_ENG');

  const res = await fetch(`${OCR_URLS[api]}?access_token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = (await res.json()) as BaiduOcrResponse;
  if (!res.ok) {
    throw new Error(`百度 OCR 请求失败：HTTP ${res.status}`);
  }
  return data;
}

function formatOcrError(data: BaiduOcrResponse): string {
  const code = data.error_code;
  const msg = data.error_msg ?? '未知错误';
  if (code === 6) {
    return `百度 OCR 识别失败（6）：无接口权限。请到百度智能云控制台编辑应用，勾选「通用文字识别（标准版）」或「高精度版」；也可在 .env 设置 BAIDU_OCR_API=general`;
  }
  return `百度 OCR 识别失败（${code}）：${msg}`;
}

async function callOcr(
  body: Record<string, string>,
  log?: ResumeImportLogger,
): Promise<BaiduOcrResponse> {
  const configured = resolveConfiguredApi();
  const primary: OcrApi =
    configured === 'auto' ? preferredApi ?? 'accurate' : configured;
  const fallback: OcrApi | null =
    configured === 'auto' && primary === 'accurate' ? 'general' : null;

  log?.step('baidu_ocr_call', { api: primary });
  const first = await postOcr(primary, body, log);
  if (!first.error_code) {
    preferredApi = primary;
    return first;
  }

  if (fallback && first.error_code === 6) {
    log?.step('baidu_ocr_fallback', { from: primary, to: fallback });
    const second = await postOcr(fallback, body, log);
    if (!second.error_code) {
      preferredApi = fallback;
      return second;
    }
    throw new Error(formatOcrError(second));
  }

  throw new Error(formatOcrError(first));
}

function encodeFileBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export async function baiduOcrImage(buffer: Buffer, log?: ResumeImportLogger): Promise<string> {
  log?.step('baidu_ocr_image_start', { bytes: buffer.length });
  const data = await callOcr({ image: encodeFileBase64(buffer) }, log);
  const text = baiduWordsResultToText(data.words_result);
  log?.step('baidu_ocr_image_done', {
    textLen: text.length,
    wordsResultNum: data.words_result_num ?? 0,
  });
  return text;
}

export async function baiduOcrPdf(buffer: Buffer, log?: ResumeImportLogger): Promise<string> {
  log?.step('baidu_ocr_pdf_start', { bytes: buffer.length });
  const pdfFile = encodeFileBase64(buffer);
  const firstPage = await callOcr({ pdf_file: pdfFile }, log);
  const totalPages = Math.max(1, Number.parseInt(firstPage.pdf_file_size ?? '1', 10) || 1);
  const pageTexts = [baiduWordsResultToText(firstPage.words_result)];

  for (let page = 2; page <= totalPages; page += 1) {
    log?.step('baidu_ocr_pdf_page', { page, totalPages });
    const pageData = await callOcr(
      { pdf_file: pdfFile, pdf_file_num: String(page) },
      log,
    );
    pageTexts.push(baiduWordsResultToText(pageData.words_result));
  }

  const text = pageTexts.filter(Boolean).join('\n\n');
  log?.step('baidu_ocr_pdf_done', { textLen: text.length, totalPages });
  return text;
}

/** 测试用：重置 token / 接口偏好缓存 */
export function resetBaiduOcrTokenCacheForTests(): void {
  tokenCache = null;
  preferredApi = null;
}
