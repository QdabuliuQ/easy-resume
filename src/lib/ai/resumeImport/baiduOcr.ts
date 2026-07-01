import type { ResumeImportLogger } from '@/lib/ai/resumeImport/logger';

const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
const OCR_URL = 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic';

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

async function callAccurateBasicOcr(
  body: Record<string, string>,
  log?: ResumeImportLogger,
): Promise<BaiduOcrResponse> {
  const accessToken = await fetchBaiduAccessToken(log);
  const params = new URLSearchParams(body);
  if (!params.has('language_type')) params.set('language_type', 'CHN_ENG');

  const res = await fetch(`${OCR_URL}?access_token=${accessToken}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = (await res.json()) as BaiduOcrResponse;
  if (!res.ok) {
    throw new Error(`百度 OCR 请求失败：HTTP ${res.status}`);
  }
  if (data.error_code) {
    throw new Error(`百度 OCR 识别失败（${data.error_code}）：${data.error_msg ?? '未知错误'}`);
  }
  return data;
}

function encodeFileBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export async function baiduOcrImage(buffer: Buffer, log?: ResumeImportLogger): Promise<string> {
  log?.step('baidu_ocr_image_start', { bytes: buffer.length });
  const data = await callAccurateBasicOcr({ image: encodeFileBase64(buffer) }, log);
  const text = baiduWordsResultToText(data.words_result);
  log?.step('baidu_ocr_image_done', {
    textLen: text.length,
    wordsResultNum: data.words_result_num ?? 0,
  });
  log?.step('ocr_result', { text });
  return text;
}

export async function baiduOcrPdf(buffer: Buffer, log?: ResumeImportLogger): Promise<string> {
  log?.step('baidu_ocr_pdf_start', { bytes: buffer.length });
  const pdfFile = encodeFileBase64(buffer);
  const firstPage = await callAccurateBasicOcr({ pdf_file: pdfFile }, log);
  const totalPages = Math.max(1, Number.parseInt(firstPage.pdf_file_size ?? '1', 10) || 1);
  const pageTexts = [baiduWordsResultToText(firstPage.words_result)];

  for (let page = 2; page <= totalPages; page += 1) {
    log?.step('baidu_ocr_pdf_page', { page, totalPages });
    const pageData = await callAccurateBasicOcr(
      { pdf_file: pdfFile, pdf_file_num: String(page) },
      log,
    );
    pageTexts.push(baiduWordsResultToText(pageData.words_result));
  }

  const text = pageTexts.filter(Boolean).join('\n\n');
  log?.step('baidu_ocr_pdf_done', { textLen: text.length, totalPages });
  log?.step('ocr_result', { text });
  return text;
}

/** 测试用：重置 token 缓存 */
export function resetBaiduOcrTokenCacheForTests(): void {
  tokenCache = null;
}
