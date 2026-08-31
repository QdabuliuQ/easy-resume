import { createHmac } from 'node:crypto';

/** 七牛 URL 安全 Base64：替换 +/，保留 = padding（Node base64url 会去 padding，导致 401） */
export function qiniuUrlSafeBase64(input: string | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

export function makeQiniuUploadToken(accessKey: string, secretKey: string, policy: object): string {
  const encodedPolicy = qiniuUrlSafeBase64(JSON.stringify(policy));
  const encodedSign = qiniuUrlSafeBase64(
    createHmac('sha1', secretKey).update(encodedPolicy).digest(),
  );
  return `${accessKey}:${encodedSign}:${encodedPolicy}`;
}

function uploadUrl() {
  return process.env.QINIU_UPLOAD_URL || 'https://up.qiniup.com';
}

export async function uploadToQiniu(file: Blob, key: string) {
  const accessKey = process.env.QINIU_ACCESS_KEY || '';
  const secretKey = process.env.QINIU_SECRET_KEY || '';
  // 兼容误写成「空间名/目录」：只取第一段作空间名
  const bucketRaw = (process.env.QINIU_BUCKET || '').trim();
  const slash = bucketRaw.indexOf('/');
  const bucket = slash >= 0 ? bucketRaw.slice(0, slash) : bucketRaw;
  const keyPrefix = slash >= 0 ? bucketRaw.slice(slash + 1).replace(/^\/+|\/+$/g, '') : '';
  const domain = (process.env.QINIU_DOMAIN || '').replace(/\/$/, '');
  if (!accessKey || !secretKey || !bucket || !domain) {
    throw new Error('未配置七牛云环境变量');
  }
  const objectKey =
    keyPrefix && !key.startsWith(`${keyPrefix}/`) && key !== keyPrefix
      ? `${keyPrefix}/${key}`
      : key;
  const token = makeQiniuUploadToken(accessKey, secretKey, {
    scope: `${bucket}:${objectKey}`,
    deadline: Math.floor(Date.now() / 1000) + 3600,
  });
  const form = new FormData();
  form.append('token', token);
  form.append('key', objectKey);
  form.append('file', file, objectKey.split('/').pop() || 'preview.webp');
  const response = await fetch(uploadUrl(), { method: 'POST', body: form });
  if (!response.ok) {
    let detail = '';
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) detail = `: ${body.error}`;
    } catch {
      /* ignore */
    }
    throw new Error(`七牛云上传失败 (${response.status})${detail}`);
  }
  return `${domain}/${objectKey}`;
}
