import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createChatModel, createModifyChatModel, type AppChatModel } from '@/lib/ai/chatModel';
import { buildSceneRetriever } from '@/lib/ai/ragResume/knowledge';
import { descriptionPolishRulesForScene } from '@/lib/ai/descriptionFormat';
import type { OptimizeRequest, OptimizeScene } from '@/lib/ai/ragResume/types';
import { sanitizeRichTextHtml, unwrapFencedHtml } from '@/utils/sanitizeHtml';

// 进入 RAG 前先把原始文本规整化，避免空字符串、null 等输入破坏检索质量。
function normalizeRawText(text: string): string {
  return String(text ?? '').trim();
}

const SCENE_LABEL: Record<OptimizeScene, string> = {
  skill: '技能描述',
  work: '工作经历',
  project: '项目经历',
};

const SCENE_SYSTEM: Record<OptimizeScene, string> = {
  skill:
    '你是资深HR与简历优化专家。请基于输入原文与检索到的技能规则进行润色，保持事实不变，不编造经历。',
  work:
    '你是资深HR与简历优化专家。请基于输入原文与检索到的工作经历规则进行润色，保持事实不变，不编造经历。',
  project:
    '你是资深HR与简历优化专家。请基于输入原文与检索到的项目经历规则进行润色，保持事实不变，不编造经历。',
};

const OPTIMIZE_HUMAN = `你将收到：
1) 用户目标岗位
2) 用户原始文本
3) 从本地知识库检索出的规则片段

请严格执行：
1. 只返回优化后的 HTML 富文本，不返回解释。
2. {formatRules}
3. 语言简洁、专业，符合 ATS 筛选。
4. 保留事实，不新增原文未给出的经历、数据。

【目标岗位】
{postType}

【内容类型】
{sceneLabel}

【原始文本】
{rawText}

【知识库规则片段】
{knowledgeContext}`;

export async function optimizeByScene(
  scene: OptimizeScene,
  req: OptimizeRequest,
  opts?: { llm?: AppChatModel; useModifyChatModel?: boolean },
): Promise<string> {
  const rawText = normalizeRawText(req.rawText);
  if (!rawText) throw new Error('原始文本不能为空');

  // 先做检索：根据场景 + 岗位 + 原文，从本地知识库中召回最相关的规则片段。
  const retriever = await buildSceneRetriever(scene, req.postType);
  const knowledgeContext = await retriever.retrieve(rawText);

  // Prompt 由两层组成：
  // - system: 角色与边界（不能编造事实）
  // - human: 本次任务输入，包括原始文本和检索出来的规则上下文
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SCENE_SYSTEM[scene]],
    ['human', OPTIMIZE_HUMAN],
  ]);

  const llm =
    opts?.llm ??
    (opts?.useModifyChatModel
      ? createModifyChatModel({ temperature: 0.8 })
      : createChatModel({ temperature: 0.8 }));

  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  // 如果没有命中岗位专属规则，仍然会回退到全局规则，从而保证链路可用。
  const rawHtml = await chain.invoke({
    postType: req.postType || '未指定岗位',
    sceneLabel: SCENE_LABEL[scene],
    rawText,
    knowledgeContext: knowledgeContext || '未命中岗位规则，仅应用全局规则。',
    formatRules: descriptionPolishRulesForScene(scene),
  });

  // 模型输出不可信，最后统一做一次 HTML 解围栏 + 白名单清洗，防止非法标签落入编辑器。
  return sanitizeRichTextHtml(unwrapFencedHtml(rawHtml));
}
