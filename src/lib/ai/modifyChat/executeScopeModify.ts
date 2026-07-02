import { retrieveModifyChatKnowledge } from '@/lib/ai/ragResume/knowledge';
import { modifyAddModule } from './addModuleModify';
import { finalizeModifiedResume } from './merge';
import { modifyPartialScope } from './partialModify';
import { applyRagScopeModify, scopeTargetsForRag } from './ragApply';
import { extractPostType } from './resumeSummary';
import type { ScopeOutput } from './resumeSchema';

export async function executeScopedModify(
  resume: unknown,
  scope: ScopeOutput,
  lastUserMessage: string,
  signal?: AbortSignal,
  fullModify?: (
    knowledgeContext: string,
  ) => Promise<{ message: string; resume: unknown }>,
): Promise<{ message: string; resume: unknown }> {
  const postType = extractPostType(resume);
  const ragTargets = scopeTargetsForRag(resume, scope, lastUserMessage);
  let result: { message: string; resume: unknown } | null = null;
  if (ragTargets.length && scope.action !== 'edit') {
    result = await applyRagScopeModify(resume, postType, ragTargets);
  }
  if (!result && scope.scope === 'add_module') {
    if (!scope.moduleType) {
      throw new Error('无法确定要新增的模块类型');
    }
    result = await modifyAddModule(resume, scope.moduleType, lastUserMessage, signal);
  }
  if (!result && scope.scope === 'partial' && scope.targets.length) {
    result = await modifyPartialScope(resume, scope, lastUserMessage, signal);
  }
  if (!result && fullModify) {
    const scene =
      scope.scene ??
      (scopeTargetsForRag(resume, scope, lastUserMessage)[0]?.scene ?? null);
    const knowledgeContext = await retrieveModifyChatKnowledge({
      userMessage: lastUserMessage,
      postType,
      scene,
      moduleContext: JSON.stringify(resume).slice(0, 4000),
      includeSchema: true,
      schemaTopK: 5,
    });
    result = await fullModify(knowledgeContext);
  }
  if (!result) throw new Error('无法确定修改范围，请具体说明要改哪一部分');
  return {
    message: result.message,
    resume: finalizeModifiedResume(resume, result.resume as never),
  };
}
