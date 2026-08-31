import { createHmac } from 'node:crypto';
import { qiniuUrlSafeBase64 } from '@/lib/qiniuUpload';

function qiniuCreds() {
  const accessKey = process.env.QINIU_ACCESS_KEY || '';
  const secretKey = process.env.QINIU_SECRET_KEY || '';
  const bucketRaw = (process.env.QINIU_BUCKET || '').trim();
  const slash = bucketRaw.indexOf('/');
  const bucket = slash >= 0 ? bucketRaw.slice(0, slash) : bucketRaw;
  if (!accessKey || !secretKey || !bucket) {
    throw new Error('未配置七牛云环境变量');
  }
  return { accessKey, secretKey, bucket };
}

/** 按上传域名推断管理 / 列举域名 */
export function qiniuManageHosts() {
  const up = process.env.QINIU_UPLOAD_URL || '';
  if (up.includes('up-z2')) {
    return { rs: 'https://rs-z2.qiniuapi.com', rsf: 'https://rsf-z2.qiniuapi.com' };
  }
  if (up.includes('up-z1')) {
    return { rs: 'https://rs-z1.qiniuapi.com', rsf: 'https://rsf-z1.qiniuapi.com' };
  }
  if (up.includes('up-cn-east-2')) {
    return { rs: 'https://rs-cn-east-2.qiniuapi.com', rsf: 'https://rsf-cn-east-2.qiniuapi.com' };
  }
  return { rs: 'https://rs.qiniu.com', rsf: 'https://rsf.qiniu.com' };
}

function qboxAuthorization(
  accessKey: string,
  secretKey: string,
  pathWithQuery: string,
  body = '',
) {
  const sign = qiniuUrlSafeBase64(
    createHmac('sha1', secretKey).update(`${pathWithQuery}\n${body}`).digest(),
  );
  return `QBox ${accessKey}:${sign}`;
}

export async function listQiniuKeys(prefix = '', limit = 1000): Promise<string[]> {
  const { accessKey, secretKey, bucket } = qiniuCreds();
  const { rsf } = qiniuManageHosts();
  const keys: string[] = [];
  let marker = '';
  for (;;) {
    const qs = new URLSearchParams({
      bucket,
      limit: String(Math.min(1000, limit)),
      prefix,
    });
    if (marker) qs.set('marker', marker);
    const pathWithQuery = `/list?${qs.toString()}`;
    const res = await fetch(`${rsf}${pathWithQuery}`, {
      headers: {
        Authorization: qboxAuthorization(accessKey, secretKey, pathWithQuery),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`七牛列举失败 (${res.status}) ${text}`);
    }
    const data = (await res.json()) as {
      marker?: string;
      items?: Array<{ key?: string }>;
    };
    for (const item of data.items || []) {
      if (item.key) keys.push(item.key);
    }
    if (!data.marker) break;
    marker = data.marker;
  }
  return keys;
}

export async function deleteQiniuKeys(keys: string[]): Promise<{ deleted: number; failed: string[] }> {
  if (!keys.length) return { deleted: 0, failed: [] };
  const { accessKey, secretKey, bucket } = qiniuCreds();
  const { rs } = qiniuManageHosts();
  const failed: string[] = [];
  let deleted = 0;
  const chunkSize = 100;
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize);
    const body = chunk
      .map((key) => {
        const entry = qiniuUrlSafeBase64(`${bucket}:${key}`);
        return `op=/delete/${entry}`;
      })
      .join('&');
    const path = '/batch';
    const res = await fetch(`${rs}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: qboxAuthorization(accessKey, secretKey, path, body),
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`七牛批量删除失败 (${res.status}) ${text}`);
    }
    const results = (await res.json()) as Array<{ code?: number; data?: { error?: string } }>;
    results.forEach((r, idx) => {
      if (r.code === 200) deleted += 1;
      else failed.push(`${chunk[idx]} (${r.code}${r.data?.error ? `: ${r.data.error}` : ''})`);
    });
  }
  return { deleted, failed };
}

/** 旧预览路径：{id}/xxx.jpg 或 easy-resume/{id}/xxx.jpg；保留 easy-resume/previews/ */
export function isLegacyTemplatePreviewKey(key: string, templateIds: Set<string>): boolean {
  if (key.startsWith('easy-resume/previews/')) return false;
  const parts = key.split('/');
  if (parts.length < 2) return false;
  if (parts[0] === 'easy-resume' && parts[1] && templateIds.has(parts[1])) return true;
  if (parts[0] && templateIds.has(parts[0])) return true;
  return false;
}
