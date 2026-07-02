import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createModifyChatModel } from '@/lib/ai/chatModel';
import { throwIfAborted } from '@/lib/ai/abortSignal';
import { retrieveModifyChatKnowledge } from '@/lib/ai/ragResume/knowledge';
import type { ModifyChatMessage } from './types';
import { formatModifyHistory, POLISH_RE } from './shared';
import { SCOPE_ROUTER_HUMAN, SCOPE_ROUTER_SYSTEM } from './prompt';
import { formatZodError, parseScopeOutput } from './parse';
import {
  buildResumeModuleSummary,
  formatModuleSummaryForPrompt,
  locateModule,
  MODULE_LABELS,
  resolveTargetsByDisplayName,
  type ModuleSummaryEntry,
} from './resumeSummary';
import type { ModifyScopeTarget, ScopeOutput } from './resumeSchema';

const scopePrompt = ChatPromptTemplate.fromMessages([
  ['system', SCOPE_ROUTER_SYSTEM],
  ['human', SCOPE_ROUTER_HUMAN],
]);

const ADD_ITEM_RE = /新增|添加|增加|补充|加一(条|个|段|项)|再加|追加/;
const REMOVE_ITEM_RE = /删除|去掉|移除|删掉|删了/;

export function inferItemsActionFromMessage(message: string): 'add' | 'remove' | null {
  const text = message.trim();
  if (!text) return null;
  if (ADD_ITEM_RE.test(text)) return 'add';
  if (REMOVE_ITEM_RE.test(text)) return 'remove';
  return null;
}
const MODULE_TYPE_HINTS: { re: RegExp; type: string }[] = [
  { re: /工作经历|工作经验|任职|公司|岗位/, type: 'job' },
  { re: /项目经历|项目经验|项目描述/, type: 'project' },
  { re: /技能|专业技能/, type: 'skill' },
  { re: /教育|学历|学校/, type: 'education' },
  { re: /个人信息|基础信息|电话|邮箱|姓名|头像/, type: 'info1' },
  { re: /证书/, type: 'certificate' },
];

const ADD_MODULE_RE = /新增|添加|增加|补充|加一个/;

export function inferAddModuleType(
  message: string,
  summary: ModuleSummaryEntry[],
): string | null {
  const text = message.trim();
  if (!text || !ADD_MODULE_RE.test(text)) return null;
  const typeHint = MODULE_TYPE_HINTS.find((h) => h.re.test(text))?.type;
  if (!typeHint || typeHint === 'info1') return null;
  if (summary.some((s) => s.type === typeHint)) return null;
  const label = MODULE_LABELS[typeHint];
  if (label && text.includes(label)) return typeHint;
  return typeHint;
}

export function inferModifyScopeHeuristic(
  message: string,
  summary: ModuleSummaryEntry[],
): ScopeOutput | null {
  const text = message.trim();
  if (!text || !summary.length) return null;
  const addModuleType = inferAddModuleType(text, summary);
  if (addModuleType) {
    return {
      scope: 'add_module',
      targets: [],
      moduleType: addModuleType as ScopeOutput['moduleType'],
      scene: null,
      action: 'add',
    };
  }
  const polish = POLISH_RE.test(text);
  const titleHits = resolveTargetsByDisplayName(text, summary);
  let targets: ModifyScopeTarget[] = titleHits.length === 1 ? [{ moduleId: titleHits[0]!.moduleId }] : [];
  const typeHint = !targets.length
    ? MODULE_TYPE_HINTS.find((h) => h.re.test(text))?.type
    : undefined;
  if (!targets.length && typeHint) {
    targets = resolveTargetsForType(summary, typeHint, text);
  }
  const itemIdxMatch = text.match(/第([一二三四五六七八九十\d]+)[条段]/);
  if (targets.length === 1 && itemIdxMatch) {
    const n = parseChineseOrDigitIndex(itemIdxMatch[1]!);
    if (n != null) targets = [{ moduleId: targets[0]!.moduleId, itemIndex: n }];
  }
  if (targets.length === 1) {
    const mod = summary.find((s) => s.id === targets[0]!.moduleId);
    const scene = mod?.type === 'job' ? 'work' : mod?.type === 'project' ? 'project' : mod?.type === 'skill' ? 'skill' : null;
    const itemsAction = inferItemsActionFromMessage(text);
    const action = itemsAction ?? (polish ? 'polish' : 'auto');
    return {
      scope: 'partial',
      targets,
      scene,
      action,
    };
  }
  if (/整体|全部|全篇|整个简历/.test(text)) {
    return {
      scope: 'global',
      targets: [],
      scene: typeHint === 'job' ? 'work' : typeHint === 'project' ? 'project' : typeHint === 'skill' ? 'skill' : null,
      action: polish ? 'polish' : 'auto',
    };
  }
  if (/^优化|^润色|^改一下|^帮我改/.test(text) && !targets.length && !typeHint && !titleHits.length) {
    const labels = summary.map((s) => `${s.label}(id=${s.id})`).join('、');
    return {
      scope: 'ambiguous',
      targets: [],
      clarifyMessage: `请说明想修改哪一部分，例如：${labels}`,
    };
  }
  return null;
}

function resolveTargetsForType(
  summary: ModuleSummaryEntry[],
  typeHint: string,
  text: string,
): ModifyScopeTarget[] {
  const mods = summary.filter((s) => s.type === typeHint);
  if (mods.length === 1) return [{ moduleId: mods[0]!.id }];
  if (mods.length > 1) {
    const idxMatch = text.match(/第([一二三四五六七八九十\d]+)[个条段]/);
    if (idxMatch) {
      const n = parseChineseOrDigitIndex(idxMatch[1]!);
      if (n != null && n >= 0 && n < mods.length) return [{ moduleId: mods[n]!.id }];
    }
  }
  return [];
}

function parseChineseOrDigitIndex(raw: string): number | null {
  const digit = Number(raw);
  if (!Number.isNaN(digit) && digit > 0) return digit - 1;
  const map: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  const v = map[raw];
  return v != null ? v - 1 : null;
}

export async function resolveModifyScope(
  messages: ModifyChatMessage[],
  resume: unknown,
  lastUserMessage: string,
  signal?: AbortSignal,
): Promise<ScopeOutput> {
  throwIfAborted(signal);
  const summary = buildResumeModuleSummary(resume);
  const heuristic = inferModifyScopeHeuristic(lastUserMessage, summary);
  if (heuristic && heuristic.scope !== 'ambiguous') return heuristic;
  const chain = scopePrompt
    .pipe(createModifyChatModel({ temperature: 0, jsonMode: true }))
    .pipe(new StringOutputParser());
  let schemaHint = '';
  try {
    schemaHint = await retrieveModifyChatKnowledge({
      userMessage: lastUserMessage,
      moduleContext: formatModuleSummaryForPrompt(summary),
      scene: null,
      includeSchema: true,
      schemaTopK: 5,
    });
  } catch {
    schemaHint = '';
  }
  try {
    const raw = await chain.invoke(
      {
        moduleSummary: formatModuleSummaryForPrompt(summary),
        schemaHint: schemaHint ? `相关 JSON 字段说明：\n${schemaHint}` : '（无）',
        history: formatModifyHistory(messages.slice(0, -1)),
        lastMessage: lastUserMessage,
      },
      { signal },
    );
    const parsed = parseScopeOutput(raw);
    if (parsed.scope === 'add_module' && !parsed.moduleType) {
      return {
        scope: 'ambiguous',
        targets: [],
        clarifyMessage: '请说明要新增哪种模块，例如证书、工作经历、项目经历。',
      };
    }
    if (parsed.scope === 'partial' && parsed.targets.length) {
      for (const t of parsed.targets) {
        if (!locateModule(resume, t.moduleId)) {
          return heuristic ?? {
            scope: 'ambiguous',
            targets: [],
            clarifyMessage: parsed.clarifyMessage ?? `未找到模块 ${t.moduleId}，请说明要改哪一部分。`,
          };
        }
      }
    }
    return parsed;
  } catch (e) {
    console.warn('[modifyChat] scope parse failed, fallback heuristic:', formatZodError(e));
    if (heuristic) return heuristic;
    return {
      scope: 'global',
      targets: [],
      action: 'auto',
    };
  }
}

export function sceneForModuleType(type: string): 'work' | 'project' | 'skill' | null {
  if (type === 'job') return 'work';
  if (type === 'project') return 'project';
  if (type === 'skill') return 'skill';
  return null;
}

export function isRagEligible(scope: ScopeOutput, moduleType: string, userMessage: string): boolean {
  const scene = scope.scene ?? sceneForModuleType(moduleType);
  if (!scene) return false;
  if (scope.action === 'edit' || scope.action === 'add' || scope.action === 'remove') return false;
  if (scope.action === 'polish') return true;
  return POLISH_RE.test(userMessage);
}
