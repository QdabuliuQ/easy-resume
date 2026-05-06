import { city as cityTree } from '@/modules/utils/constant';

/** 统一省市展示为「省/市」，兼容「广东/东莞」「湖南 - 长沙」「湖南-长沙」等录入方式 */
export function normalizeResumeCityDisplay(raw: string | undefined | null): string {
  if (raw == null) return '';
  const t = String(raw).trim();
  if (!t) return '';
  const parts = t
    .split(/\s*[/／]\s*|\s*[-－–—]+\s*|·/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return parts.join('/');
  return t;
}

/** 根据叶子城市名（或「省·市」字符串）解析为 Cascader 路径，供意向城市多选 */
export function findCityCascaderPath(leafOrPath: string): string[] | null {
  const t = leafOrPath.trim();
  if (!t) return null;
  const norm = normalizeResumeCityDisplay(t.replace(/·/g, '/'));
  const parts = norm.split('/').filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts[1]];
  const leaf = parts[0] ?? t;
  for (const prov of cityTree) {
    const children = 'children' in prov ? prov.children : undefined;
    if (!children?.length) {
      if (prov.value === leaf || prov.label === leaf) return [String(prov.value)];
      continue;
    }
    for (const c of children) {
      if (c.value === leaf || c.label === leaf) return [String(prov.value), String(c.value)];
    }
  }
  return null;
}

/** 简历 JSON → Cascader 多选值 `string[][]` */
export function normalizeIntentCityToCascaderValue(raw: unknown): string[][] {
  if (Array.isArray(raw)) {
    if (!raw.length) return [];
    if (Array.isArray(raw[0])) return raw as string[][];
    return [raw as string[]];
  }
  if (typeof raw !== 'string' || !raw.trim()) return [];
  const segments = raw.split(/[、,，]/).map((s) => s.trim()).filter(Boolean);
  const out: string[][] = [];
  for (const seg of segments) {
    const p = findCityCascaderPath(seg);
    if (p?.length) out.push(p);
  }
  return out;
}

/** 意向城市展示：`string[][]` 仅展示路径最后一级（市），「，」拼接；存储仍为完整路径；旧字符串兼容 */
export function formatIntentCityDisplay(raw: unknown): string {
  if (Array.isArray(raw)) {
    if (raw.length && Array.isArray(raw[0])) {
      return (raw as string[][])
        .map((path) => {
          const seg = path.filter((x) => x != null && String(x).trim()).at(-1);
          return seg != null ? String(seg).trim() : '';
        })
        .filter(Boolean)
        .join('，');
    }
    if (raw.every((x) => typeof x === 'string')) {
      return normalizeResumeCityDisplay((raw as string[]).join('/'));
    }
  }
  if (typeof raw === 'string') return normalizeResumeCityDisplay(raw);
  return '';
}
