import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createModifyChatModel } from '@/lib/ai/chatModel';
import { throwIfAborted } from '@/lib/ai/abortSignal';
import type { OptimizeScene } from '@/lib/ai/ragResume/types';
import { retrieveModifyChatKnowledge } from '@/lib/ai/ragResume/knowledge';
import { mergeModuleIntoResume, normalizePartialModule, partialItemsRule, removeModuleFromResume, validatePartialModule, isWholeModuleRemoveIntent } from './partialPatch';
import { formatZodError, parsePartialModifyOutput } from './parse';
import { PARTIAL_MODIFY_HUMAN, PARTIAL_MODIFY_SYSTEM } from './prompt';
import { extractPostType, locateModule } from './resumeSummary';
import { sceneForModuleType } from './scopeRouter';
import type { ModifyScopeTarget, ScopeOutput } from './resumeSchema';

export async function modifyPartialModule(
  resume: unknown,
  target: ModifyScopeTarget,
  lastUserMessage: string,
  scope: ScopeOutput,
  signal?: AbortSignal,
): Promise<{ message: string; resume: unknown }> {
  throwIfAborted(signal);
  const loc = locateModule(resume, target.moduleId);
  if (!loc) throw new Error(`未找到模块 ${target.moduleId}`);
  if (isWholeModuleRemoveIntent(scope, target, loc.module.type, lastUserMessage)) {
    const next = removeModuleFromResume(resume, loc.pageIndex, loc.moduleIndex);
    const label = (loc.module.options as { title?: string } | undefined)?.title ?? loc.module.type;
    return { message: `已删除「${label}」模块`, resume: next };
  }
  const postType = extractPostType(resume);
  const moduleJson = JSON.stringify(loc.module, null, 0);
  const scene = (scope.scene ?? sceneForModuleType(loc.module.type)) as OptimizeScene | null;
  const knowledgeContext = await retrieveModifyChatKnowledge({
    userMessage: lastUserMessage,
    postType,
    scene,
    moduleContext: moduleJson,
    includeSchema: true,
    schemaTopK: 4,
  });
  const chain = ChatPromptTemplate.fromMessages([
    ['system', PARTIAL_MODIFY_SYSTEM.replace('{itemsRule}', partialItemsRule(scope))],
    ['human', PARTIAL_MODIFY_HUMAN],
  ])
    .pipe(createModifyChatModel({ temperature: 0.2, jsonMode: true }))
    .pipe(new StringOutputParser());
  const raw = await chain.invoke(
    {
      knowledgeContext,
      moduleJson,
      lastMessage: lastUserMessage,
    },
    { signal },
  );
  let parsed;
  try {
    parsed = parsePartialModifyOutput(raw);
  } catch (e) {
    throw new Error(formatZodError(e));
  }
  const err = validatePartialModule(loc.module, parsed.module, scope);
  if (err) throw new Error(err);
  const normalized = normalizePartialModule(loc.module, parsed.module);
  const next = mergeModuleIntoResume(resume, loc.pageIndex, loc.moduleIndex, normalized);
  return { message: parsed.message.trim(), resume: next };
}

export async function modifyPartialScope(
  resume: unknown,
  scope: ScopeOutput,
  lastUserMessage: string,
  signal?: AbortSignal,
): Promise<{ message: string; resume: unknown }> {
  const targets = scope.targets;
  if (!targets.length) throw new Error('partial 范围缺少 targets');
  let next = resume;
  const messages: string[] = [];
  for (const t of targets) {
    const result = await modifyPartialModule(next, t, lastUserMessage, scope, signal);
    next = result.resume;
    messages.push(result.message);
  }
  return { message: messages.join('\n'), resume: next };
}
