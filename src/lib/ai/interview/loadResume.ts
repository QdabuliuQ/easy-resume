import { cfApiBase, cfApiHeaders, cfApiSecret } from '@/lib/cfApi';

export async function loadCloudResumeForUid(
  uid: string,
  resumeId: string,
): Promise<{ resume: unknown } | { error: string; status: number }> {
  const base = cfApiBase();
  if (!base) return { error: '未配置 CF_API_BASE_URL', status: 503 };
  if (!cfApiSecret()) return { error: '未配置 CF_API_SECRET', status: 503 };
  try {
    const res = await fetch(
      `${base}/api/resume/get?id=${encodeURIComponent(resumeId)}&uid=${encodeURIComponent(uid)}`,
      { headers: cfApiHeaders(), cache: 'no-store' },
    );
    const data = (await res.json().catch(() => null)) as {
      content?: unknown;
      error?: string;
    } | null;
    if (!res.ok) {
      return { error: data?.error || '加载简历失败', status: res.status };
    }
    const resume = data?.content;
    if (resume === undefined || resume === null) {
      return { error: '简历内容为空', status: 404 };
    }
    return { resume };
  } catch (e) {
    return { error: e instanceof Error ? e.message : '加载简历失败', status: 502 };
  }
}
