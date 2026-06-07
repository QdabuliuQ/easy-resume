import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createChatModel } from '@/lib/ai/chatModel';
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

function stripAssistantJsonFence(s: string): string {
  const t = s.trim();
  const m = /^```(?:json)?\s*\r?\n?([\s\S]*?)```$/im.exec(t);
  if (m) return m[1].trim();
  return t;
}

function extractJsonObject(raw: string): Record<string, unknown> {
  const text = stripAssistantJsonFence(raw);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('模型返回中未找到 JSON 对象');
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

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
  const j = extractJsonObject(raw);
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
  const j = extractJsonObject(raw);
  return {
    fieldOptimizeList: parseFieldOptimizeList(j.fieldOptimizeList),
  };
}

async function invokeAi(prompt: ChatPromptTemplate, analyzePrompt: string, resumeJson: unknown) {
  const jsonText = JSON.stringify(resumeJson ?? {});
  const chain = prompt
    .pipe(createChatModel({ temperature: 0.2 }))
    .pipe(new StringOutputParser());
  const raw = await chain.invoke({ analyzePrompt, jsonText });
  if (!raw.trim()) throw new Error('模型返回为空');
  return raw;
}

export async function analyzeResumeScore(resumeJson: unknown): Promise<ResumeAiScoreResult> {
  const raw = await invokeAi(scorePrompt, RESUME_AI_SCORE_PROMPT, resumeJson);
  return parseResumeAiScoreResult(raw);
}

export async function analyzeResumeOptimize(resumeJson: unknown): Promise<ResumeAiOptimizeResult> {
  const raw = await invokeAi(optimizePrompt, RESUME_AI_OPTIMIZE_PROMPT, resumeJson);
  return parseResumeAiOptimizeResult(raw);
}

/** @deprecated 使用 analyzeResumeScore + analyzeResumeOptimize */
export async function analyzeResumeWithAi(resumeJson: unknown) {
  const [score, optimize] = await Promise.all([
    analyzeResumeScore(resumeJson),
    analyzeResumeOptimize(resumeJson),
  ]);
  return { ...score, ...optimize };
}
