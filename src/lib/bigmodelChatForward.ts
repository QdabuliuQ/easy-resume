const UPSTREAM = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
type Msg = { role: string; content: string | unknown[] };
function coerceUpstreamStream(v: unknown): boolean {
  if (v === false || v === 'false' || v === 0 || v === '') return false;
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  return true;
}
export async function forwardBigmodelChatCompletions(body: unknown): Promise<Response> {
  const key = process.env.BIGMODEL_API_KEY;
  if (!key) {
    return Response.json({ error: '缺少 BIGMODEL_API_KEY' }, { status: 500 });
  }
  if (!body || typeof body !== 'object') {
    return Response.json({ error: '无效 JSON' }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const { model, messages, stream, temperature, ...rest } = o as {
    model?: string;
    messages?: Msg[];
    stream?: boolean;
    temperature?: number;
    [k: string]: unknown;
  };
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: '缺少 messages' }, { status: 400 });
  }
  const payload = {
    ...rest,
    model: typeof model === 'string' && model.trim() ? model : 'GLM-4.7-Flash',
    messages,
    stream: coerceUpstreamStream(stream),
    temperature: typeof temperature === 'number' ? temperature : 1,
  };
  const res = await fetch(UPSTREAM, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (payload.stream) {
    if (!res.ok) {
      const errText = await res.text();
      return new Response(errText, {
        status: res.status,
        headers: {
          'Content-Type': res.headers.get('content-type') || 'application/json',
        },
      });
    }
    if (!res.body) {
      return Response.json({ error: '上游无 body' }, { status: 502 });
    }
    const ct = res.headers.get('content-type') || 'text/event-stream';
    return new Response(res.body, {
      status: res.status,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  }
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      return Response.json(JSON.parse(text), { status: res.status });
    } catch {
      return new Response(text, { status: res.status });
    }
  }
  return new Response(text, { status: res.status });
}
