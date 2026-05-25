import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createChatModel } from '@/lib/ai/chatModel';
import {
  RESUME_AI_ANALYZE_PROMPT,
  RESUME_AI_SCORE_SYSTEM,
} from '@/lib/ai/score/prompt';
import type { ResumeAiAnalyzeResult } from '@/lib/ai/score/types';

const scorePrompt = ChatPromptTemplate.fromMessages([
  ['system', RESUME_AI_SCORE_SYSTEM],
  ['human', '{analyzePrompt}\n{jsonText}'],
]);

function stripAssistantJsonFence(s: string): string {
  const t = s.trim();
  const m = /^```(?:json)?\s*\r?\n?([\s\S]*?)```$/im.exec(t);
  if (m) return m[1].trim();
  return t;
}

function parseResumeAiAnalyzeResult(raw: string): ResumeAiAnalyzeResult {
  const text = stripAssistantJsonFence(raw);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('模型返回中未找到 JSON 对象');
  const j = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  const totalScore = Number(j.totalScore);
  if (!Number.isFinite(totalScore)) throw new Error('totalScore 无效');
  const dimensionEvaluate = Array.isArray(j.dimensionEvaluate) ? j.dimensionEvaluate : [];
  const fieldOptimizeList = Array.isArray(j.fieldOptimizeList) ? j.fieldOptimizeList : [];
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
    fieldOptimizeList: fieldOptimizeList.map((row) => {
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
    }),
  };
}

export async function analyzeResumeWithAi(
  resumeJson: unknown,
): Promise<ResumeAiAnalyzeResult> {
  const jsonText = JSON.stringify(resumeJson ?? {});
  const chain = scorePrompt
    .pipe(createChatModel({ temperature: 0.2 }))
    .pipe(new StringOutputParser());
  const raw = await chain.invoke({
    analyzePrompt: RESUME_AI_ANALYZE_PROMPT,
    jsonText,
  });
  if (!raw.trim()) throw new Error('模型返回为空');
  return parseResumeAiAnalyzeResult(raw);
}
