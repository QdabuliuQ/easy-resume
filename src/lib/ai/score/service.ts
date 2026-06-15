import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createChatModel } from '@/lib/ai/chatModel';
import { parseAiJsonObject } from '@/lib/ai/parseAiJson';
import { retrieveScoreRulesContext } from '@/lib/ai/score/knowledge';
import {
  RESUME_AI_OPTIMIZE_PROMPT,
  RESUME_AI_OPTIMIZE_SYSTEM,
  RESUME_AI_SCORE_PROMPT,
  RESUME_AI_SCORE_SYSTEM,
} from '@/lib/ai/score/prompt';
import { resumeAiOptimizeResultSchema, resumeAiScoreResultSchema } from '@/lib/ai/score/schema';
import type { ResumeAiFieldOptimize, ResumeAiOptimizeResult, ResumeAiScoreResult } from '@/lib/ai/score/types';

const scorePrompt = ChatPromptTemplate.fromMessages([
  ['system', RESUME_AI_SCORE_SYSTEM],
  ['human', '{analyzePrompt}\n{jsonText}'],
]);

const optimizePrompt = ChatPromptTemplate.fromMessages([
  ['system', RESUME_AI_OPTIMIZE_SYSTEM],
  ['human', '{analyzePrompt}\n{jsonText}'],
]);

function parseFieldOptimizeList(rows: unknown): ResumeAiFieldOptimize[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    const moduleItemIdRaw = r.moduleItemId;
    const moduleItemId =
      typeof moduleItemIdRaw === 'string' && moduleItemIdRaw.trim()
        ? moduleItemIdRaw.trim()
        : undefined;
    return {
      pageIndex: Number(r.pageIndex) || 0,
      moduleType: String(r.moduleType ?? ''),
      moduleId: String(r.moduleId ?? ''),
      moduleItemId,
      fieldKey: String(r.fieldKey ?? ''),
      optimizeReason: String(r.optimizeReason ?? ''),
      optimizeValue:
        typeof r.optimizeValue === 'string'
          ? r.optimizeValue
          : String(r.optimizeValue ?? ''),
    };
  });
}

function parseResumeAiScoreResult(raw: string): ResumeAiScoreResult {
  const j = parseAiJsonObject(raw);
  return resumeAiScoreResultSchema.parse(j);
}

function parseResumeAiOptimizeResult(raw: string): ResumeAiOptimizeResult {
  const j = parseAiJsonObject(raw);
  const parsed = resumeAiOptimizeResultSchema.parse(j);
  return {
    fieldOptimizeList: parseFieldOptimizeList(parsed.fieldOptimizeList),
  };
}

async function invokeAiRaw(
  prompt: ChatPromptTemplate,
  analyzePrompt: string,
  resumeJson: unknown,
  opts: { jsonMode: boolean; temperature: number },
): Promise<string> {
  const jsonText = JSON.stringify(resumeJson ?? {});
  const chain = prompt
    .pipe(createChatModel({ temperature: opts.temperature, jsonMode: opts.jsonMode }))
    .pipe(new StringOutputParser());
  const raw = await chain.invoke({ analyzePrompt, jsonText });
  if (!raw.trim()) throw new Error('模型返回为空');
  return raw;
}

async function invokeAiParsed<T>(
  prompt: ChatPromptTemplate,
  analyzePrompt: string,
  resumeJson: unknown,
  parse: (raw: string) => T,
): Promise<T> {
  const attempts: { jsonMode: boolean; temperature: number }[] = [
    { jsonMode: true, temperature: 0.2 },
    { jsonMode: false, temperature: 0 },
  ];
  let lastError: Error | undefined;
  for (const attempt of attempts) {
    try {
      const raw = await invokeAiRaw(prompt, analyzePrompt, resumeJson, attempt);
      return parse(raw);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error('AI 解析失败');
}

export async function analyzeResumeScore(resumeJson: unknown): Promise<ResumeAiScoreResult> {
  let analyzePrompt = RESUME_AI_SCORE_PROMPT;
  try {
    const rulesContext = await retrieveScoreRulesContext(resumeJson, 6);
    if (rulesContext.trim()) {
      analyzePrompt = `${RESUME_AI_SCORE_PROMPT}\n\n### 五、评分规则知识库上下文（优先依据本节规则）\n${rulesContext}`;
    }
  } catch {
    // Ignore retrieval failures and fallback to base score prompt.
  }
  return invokeAiParsed(scorePrompt, analyzePrompt, resumeJson, parseResumeAiScoreResult);
}

export async function analyzeResumeOptimize(resumeJson: unknown): Promise<ResumeAiOptimizeResult> {
  return invokeAiParsed(
    optimizePrompt,
    RESUME_AI_OPTIMIZE_PROMPT,
    resumeJson,
    parseResumeAiOptimizeResult,
  );
}

/** @deprecated 使用 analyzeResumeScore + analyzeResumeOptimize */
export async function analyzeResumeWithAi(resumeJson: unknown) {
  const [score, optimize] = await Promise.all([
    analyzeResumeScore(resumeJson),
    analyzeResumeOptimize(resumeJson),
  ]);
  return { ...score, ...optimize };
}
