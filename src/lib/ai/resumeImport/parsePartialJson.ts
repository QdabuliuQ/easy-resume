import type { ImportedModule } from '@/lib/ai/resumeImport/schema';

const MODULE_TYPES = new Set([
  'info1',
  'certificate',
  'education',
  'job',
  'project',
  'skill',
  'other',
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

function parseModuleObject(objStr: string): ImportedModule | null {
  try {
    const mod = JSON.parse(objStr) as unknown;
    if (!isRecord(mod) || typeof mod.type !== 'string') return null;
    if (!MODULE_TYPES.has(mod.type)) return null;
    const options = mod.options;
    return {
      type: mod.type as ImportedModule['type'],
      options: isRecord(options) ? options : {},
    };
  } catch {
    return null;
  }
}

/** 从 LLM 流式 JSON 文本中提取已闭合的 module 对象 */
export function extractCompletedModulesFromResumeJson(text: string): ImportedModule[] {
  const modulesIdx = text.indexOf('"modules"');
  if (modulesIdx < 0) return [];
  const arrayStart = text.indexOf('[', modulesIdx);
  if (arrayStart < 0) return [];

  const modules: ImportedModule[] = [];
  let i = arrayStart + 1;
  while (i < text.length) {
    while (i < text.length && /[\s,]/.test(text[i]!)) i += 1;
    if (text[i] === ']') break;
    if (text[i] !== '{') break;

    const objStart = i;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (; i < text.length; i += 1) {
      const c = text[i]!;
      if (inString) {
        if (escape) escape = false;
        else if (c === '\\') escape = true;
        else if (c === '"') inString = false;
        continue;
      }
      if (c === '"') {
        inString = true;
        continue;
      }
      if (c === '{') depth += 1;
      if (c === '}') {
        depth -= 1;
        if (depth === 0) {
          i += 1;
          const mod = parseModuleObject(text.slice(objStart, i));
          if (mod) modules.push(mod);
          break;
        }
      }
    }
  }
  return modules;
}
