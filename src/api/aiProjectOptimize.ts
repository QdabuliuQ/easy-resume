type AiOptimizeReq = {
  postType: string;
  rawText: string;
};

type AiOptimizeRes = {
  content: string;
  error?: string;
};

export async function aiProjectOptimize(req: AiOptimizeReq): Promise<string> {
  const res = await fetch('/api/ai-project-optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  const data = (await res.json()) as AiOptimizeRes;
  if (!res.ok || data.error) {
    throw new Error(data.error || `请求失败(${res.status})`);
  }
  return data.content || '';
}
