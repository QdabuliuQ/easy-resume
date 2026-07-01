/** 从流式 JSON 中提取 message 字段已生成部分（供 UI 增量展示） */
export function extractStreamingMessage(raw: string): string {
  const key = '"message"';
  const start = raw.indexOf(key);
  if (start < 0) return '';
  const colon = raw.indexOf(':', start + key.length);
  if (colon < 0) return '';
  let i = colon + 1;
  while (i < raw.length && /\s/.test(raw[i]!)) i += 1;
  if (raw[i] !== '"') return '';
  i += 1;
  let out = '';
  while (i < raw.length) {
    const ch = raw[i]!;
    if (ch === '\\') {
      const next = raw[i + 1];
      if (next === 'n') out += '\n';
      else if (next === 't') out += '\t';
      else if (next === '"') out += '"';
      else if (next === '\\') out += '\\';
      else if (next) out += next;
      i += 2;
      continue;
    }
    if (ch === '"') break;
    out += ch;
    i += 1;
  }
  return out;
}
