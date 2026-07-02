import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createModifyChatModel } from '@/lib/ai/chatModel';
import { throwIfAborted } from '@/lib/ai/abortSignal';
import { retrieveModifyChatKnowledge } from '@/lib/ai/ragResume/knowledge';
import {
  appendModuleToResume,
  initModuleItemsRule,
  mergeModuleIntoResume,
  normalizePartialModule,
  validateInitModule,
} from './partialPatch';
import { formatZodError, parsePartialModifyOutput } from './parse';
import { PARTIAL_MODIFY_HUMAN, PARTIAL_MODIFY_SYSTEM } from './prompt';
import { extractPostType, locateModule } from './resumeSummary';
import type { AddableResumeModuleType } from '@/lib/ai/modifyChat/resumeSchema';
import { createEmptyResumeModule } from '@/utils/createResumeModule';
import { isResumeModuleTypeAtLimit, type ResumeModuleCountConfig } from '@/utils/moduleTypeLimits';

const MODULE_TYPE_LABELS: Record<string, string> = {
  certificate: '证书',
  job: '工作经历',
  project: '项目经历',
  education: '教育经历',
  skill: '专业技能',
  other: '其他',
};

export async function modifyAddModule(
  resume: unknown,
  moduleType: AddableResumeModuleType,
  lastUserMessage: string,
  signal?: AbortSignal,
): Promise<{ message: string; resume: unknown }> {
  throwIfAborted(signal);
  if (isResumeModuleTypeAtLimit(resume as ResumeModuleCountConfig, moduleType)) {
    const label = MODULE_TYPE_LABELS[moduleType] ?? moduleType;
    throw new Error(`简历中「${label}」模块已达上限`);
  }
  const empty = createEmptyResumeModule(moduleType);
  const withModule = appendModuleToResume(resume, empty);
  const loc = locateModule(withModule, empty.id);
  if (!loc) throw new Error('新建模块失败');
  const postType = extractPostType(resume);
  const moduleJson = JSON.stringify(loc.module, null, 0);
  const knowledgeContext = await retrieveModifyChatKnowledge({
    userMessage: lastUserMessage,
    postType,
    scene: null,
    moduleContext: moduleJson,
    includeSchema: true,
    schemaTopK: 4,
  });
  const chain = ChatPromptTemplate.fromMessages([
    ['system', PARTIAL_MODIFY_SYSTEM.replace('{itemsRule}', initModuleItemsRule(moduleType))],
    ['human', PARTIAL_MODIFY_HUMAN],
  ])
    .pipe(createModifyChatModel({ temperature: 0.2, jsonMode: true }))
    .pipe(new StringOutputParser());
  const raw = await chain.invoke(
    { knowledgeContext, moduleJson, lastMessage: lastUserMessage },
    { signal },
  );
  let parsed;
  try {
    parsed = parsePartialModifyOutput(raw);
  } catch (e) {
    throw new Error(formatZodError(e));
  }
  const err = validateInitModule(loc.module, parsed.module);
  if (err) throw new Error(err);
  const normalized = normalizePartialModule(loc.module, parsed.module);
  const next = mergeModuleIntoResume(withModule, loc.pageIndex, loc.moduleIndex, normalized);
  const label = MODULE_TYPE_LABELS[moduleType] ?? moduleType;
  const message = parsed.message.trim() || `已新增「${label}」模块`;
  return { message, resume: next };
}
