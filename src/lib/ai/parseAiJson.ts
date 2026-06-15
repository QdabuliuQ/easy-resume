const JSON_KEY_ALIASES = [
  'totalScore',
  'dimensionEvaluate',
  'dimensionName',
  'status',
  'remark',
  'hitRules',
  'deductions',
  'bonuses',
  'ruleId',
  'reason',
  'delta',
  'evidencePath',
  'fieldOptimizeList',
  'pageIndex',
  'moduleType',
  'moduleId',
  'moduleItemId',
  'fieldKey',
  'optimizeReason',
  'optimizeValue',
] as const;

export function stripAssistantJsonFence(s: string): string {
  const t = s.trim();
  const m = /^```(?:json)?\s*\r?\n?([\s\S]*?)```$/im.exec(t);
  if (m) return m[1].trim();
  return t;
}

function repairAiJsonText(text: string): string {
  let s = text
    .replace(/^\uFEFF/, '')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
  for (const key of JSON_KEY_ALIASES) {
    const spaced = new RegExp(`"\\s+"${key}"`, 'g');
    s = s.replace(spaced, `"${key}"`);
    const broken = new RegExp(`"\\s*${key}\\s*"`, 'g');
    s = s.replace(broken, `"${key}"`);
  }
  s = s.replace(/,\s*([\]}])/g, '$1');
  return s;
}

function extractJsonSlice(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('模型返回中未找到 JSON 对象');
  return text.slice(start, end + 1);
}

export function parseAiJsonObject(raw: string): Record<string, unknown> {
  const text = stripAssistantJsonFence(raw);
  const slice = extractJsonSlice(text);
  const candidates = [slice, repairAiJsonText(slice)];
  let lastError: Error | undefined;
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('模型返回的 JSON 不是对象');
      }
      return parsed as Record<string, unknown>;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw new Error(lastError?.message ?? '模型返回 JSON 无法解析');
}
