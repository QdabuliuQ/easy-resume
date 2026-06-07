import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createChatModel } from '@/lib/ai/chatModel';
import { parseAiJsonObject } from '@/lib/ai/parseAiJson';
import {
  RESUME_AI_OPTIMIZE_PROMPT,
  RESUME_AI_OPTIMIZE_SYSTEM,
  RESUME_AI_SCORE_PROMPT,
  RESUME_AI_SCORE_SYSTEM,
} from '@/lib/ai/score/prompt';
import type {
  ResumeAiFieldOptimize,
  ResumeAiOptimizeResult,
  ResumeAiScoreResult,
} from '@/lib/ai/score/types';

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
  const totalScore = Number(j.totalScore);
  if (!Number.isFinite(totalScore)) throw new Error('totalScore 无效');
  const dimensionEvaluate = Array.isArray(j.dimensionEvaluate) ? j.dimensionEvaluate : [];
  return {
    totalScore,
    dimensionEvaluate: dimensionEvaluate.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        dimensionName: String(r.dimensionName ?? ''),
        status: String(r.status ?? ''),
        remark: String(r.remark ?? ''),
      };
    }),
  };
}

function parseResumeAiOptimizeResult(raw: string): ResumeAiOptimizeResult {
  const j = parseAiJsonObject(raw);
  return {
    fieldOptimizeList: parseFieldOptimizeList(j.fieldOptimizeList),
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
  return invokeAiParsed(scorePrompt, RESUME_AI_SCORE_PROMPT, resumeJson, parseResumeAiScoreResult);
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
