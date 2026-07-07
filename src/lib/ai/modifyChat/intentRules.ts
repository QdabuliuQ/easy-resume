import type { ModifyChatIntent } from './types';

/** 否定词，长词优先匹配 */
export const NEG_WORDS = ['不用', '不需要', '不要', '不是', '没有', '别', '莫', '勿', '非', '无', '不', '没'] as const;

export const MODIFY_ACTION_WORDS = [
  '润色',
  '优化',
  '改写',
  '修改',
  '删除',
  '添加',
  '补充',
  '换成',
  '改为',
  '改成',
  '调整',
  '改',
] as const;

export const POLISH_ACTION_WORDS = [
  '润色',
  '优化',
  '改写',
  '提升',
  '完善',
  '美化',
  '加强',
  '改进',
  '精炼',
  '突出',
  '量化',
] as const;

const CONSULT_RE = /问问|怎么样|如何|咨询|想了解|想知道|请问/;
const DEFAULT_NEG_WINDOW = 4;

const sortedModifyWords = [...MODIFY_ACTION_WORDS].sort((a, b) => b.length - a.length);
const sortedPolishWords = [...POLISH_ACTION_WORDS].sort((a, b) => b.length - a.length);

export function isActionNegated(
  text: string,
  actionIndex: number,
  actionLen: number,
  window = DEFAULT_NEG_WINDOW,
): boolean {
  const start = Math.max(0, actionIndex - window);
  // ponytail: 仅查动词前窗口，避免「错别字」里的「别」误判
  const slice = text.slice(start, actionIndex + actionLen);
  return NEG_WORDS.some((neg) => slice.includes(neg));
}

function findActionHits(text: string, words: readonly string[]): { word: string; index: number }[] {
  const hits: { word: string; index: number }[] = [];
  for (const word of words) {
    let idx = text.indexOf(word);
    while (idx !== -1) {
      const overlap = hits.some((h) => idx >= h.index && idx < h.index + h.word.length);
      if (!overlap) hits.push({ word, index: idx });
      idx = text.indexOf(word, idx + word.length);
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

export function hasPositiveModifyAction(text: string): boolean {
  const hits = findActionHits(text, sortedModifyWords);
  return hits.some((h) => !isActionNegated(text, h.index, h.word.length));
}

/** scope 层：润色类动词是否未被否定 */
export function hasUnnegatedPolishAction(text: string): boolean {
  const hits = findActionHits(text, sortedPolishWords);
  return hits.some((h) => !isActionNegated(text, h.index, h.word.length));
}

/**
 * 规则层意图预判：命中则直接返回，null 交给 LLM。
 * - 全部改简历动词被否定 → chat
 * - 存在未被否定的改简历动词 → modify_resume
 */
export function classifyIntentByRules(message: string): ModifyChatIntent | null {
  const text = message.trim();
  if (!text) return 'chat';
  const hits = findActionHits(text, sortedModifyWords);
  if (!hits.length) return null;
  const hasPositive = hits.some((h) => !isActionNegated(text, h.index, h.word.length));
  if (!hasPositive) {
    if (CONSULT_RE.test(text)) return 'chat';
    return 'chat';
  }
  return 'modify_resume';
}
