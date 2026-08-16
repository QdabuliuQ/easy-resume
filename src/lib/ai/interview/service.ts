import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createDeepSeekModel } from '@/lib/ai/chatModel';
import { parseAiJsonObject } from '@/lib/ai/parseAiJson';
import { INTERVIEW_QUESTION_SYSTEM, INTERVIEW_REPORT_SYSTEM } from '@/lib/ai/interview/prompts';
import type {
  InterviewAnchor,
  InterviewAnswer,
  InterviewDifficulty,
  InterviewQuestion,
  InterviewReport,
} from '@/lib/ai/interview/types';
import { stripResumeForAiAnalyze } from '@/lib/stripResumeForAiAnalyze';
import { intentPostsFromResumeConfig } from '@/utils/intentPosts';
import { randomUUID } from 'crypto';

function pickAnchor(anchors: InterviewAnchor[], index: unknown): InterviewAnchor {
  const i = typeof index === 'number' ? index : Number(index);
  if (Number.isFinite(i) && i >= 0 && i < anchors.length) return anchors[i]!;
  return anchors[0]!;
}

async function invokeJson(system: string, payload: string, temperature: number): Promise<string> {
  const llm = createDeepSeekModel({ temperature, jsonMode: true });
  return llm
    .pipe(new StringOutputParser())
    .invoke([new SystemMessage(system), new HumanMessage(payload)]);
}

export function targetRoleFromResume(resume: unknown): string {
  return intentPostsFromResumeConfig(
    resume as {
      pages?: { modules?: { type?: string; options?: { intentPosts?: string } }[] }[];
    } | null,
  );
}

export async function generateInterviewQuestions(opts: {
  resume: unknown;
  anchors: InterviewAnchor[];
  questionCount: number;
  targetRole: string;
  difficulty: InterviewDifficulty;
}): Promise<InterviewQuestion[]> {
  const sanitized = stripResumeForAiAnalyze(opts.resume);
  const payload = JSON.stringify({
    questionCount: opts.questionCount,
    targetRole: opts.targetRole || '',
    difficulty: opts.difficulty,
    anchors: opts.anchors.map((a, i) => ({
      index: i,
      moduleType: a.moduleType,
      label: a.label,
      excerpt: a.excerpt,
    })),
    resumeHint: sanitized,
  });
  const temperature = opts.difficulty === 'easy' ? 0.5 : opts.difficulty === 'hard' ? 0.75 : 0.6;
  const raw = await invokeJson(INTERVIEW_QUESTION_SYSTEM, payload, temperature);
  const j = parseAiJsonObject(raw);
  const rows = Array.isArray(j.questions) ? j.questions : [];
  const questions: InterviewQuestion[] = [];
  for (let i = 0; i < opts.questionCount; i++) {
    const row = (rows[i] && typeof rows[i] === 'object' ? rows[i] : {}) as Record<string, unknown>;
    const text =
      String(row.text || '').trim() ||
      `请结合「${opts.anchors[i % opts.anchors.length]!.label}」说明你的具体贡献与结果。`;
    const anchor = pickAnchor(opts.anchors, row.anchorIndex ?? i % opts.anchors.length);
    questions.push({
      id: randomUUID(),
      index: i,
      text,
      anchor,
      depth: 'L1',
    });
  }
  return questions;
}

export async function generateInterviewReport(opts: {
  resume: unknown;
  targetRole: string;
  difficulty: InterviewDifficulty;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
}): Promise<InterviewReport> {
  const sanitized = stripResumeForAiAnalyze(opts.resume);
  const turns = opts.questions.map((q) => {
    const a = opts.answers.find((x) => x.questionId === q.id);
    return {
      question: q.text,
      anchor: q.anchor,
      skipped: Boolean(a?.skipped),
      answer: a?.skipped ? '' : a?.text || '',
    };
  });
  const payload = JSON.stringify({
    targetRole: opts.targetRole || '',
    difficulty: opts.difficulty,
    resumeHint: sanitized,
    turns,
  });
  const raw = await invokeJson(INTERVIEW_REPORT_SYSTEM, payload, 0.4);
  const j = parseAiJsonObject(raw);
  const dim = (j.dimensions && typeof j.dimensions === 'object' ? j.dimensions : {}) as Record<
    string,
    unknown
  >;
  const clampScore = (v: unknown) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return 60;
    return Math.min(100, Math.max(0, Math.round(n)));
  };
  const actionItemsRaw = Array.isArray(j.actionItems) ? j.actionItems : [];
  const actionItems = actionItemsRaw
    .map((row) => {
      const r = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
      const text = String(r.text || '').trim();
      const ai = Number(r.anchorIndex);
      const anchor =
        Number.isFinite(ai) && ai >= 0 && ai < opts.questions.length
          ? opts.questions[ai]!.anchor
          : undefined;
      return { text: text || '补充经历中的量化结果与个人边界', anchor };
    })
    .filter((x) => x.text);

  const inconsistencies = Array.isArray(j.inconsistencies)
    ? j.inconsistencies.map((x) => String(x || '').trim()).filter(Boolean)
    : undefined;

  return {
    summary: String(j.summary || '').trim() || '本轮模拟面试已完成，建议结合报告建议回改简历表述。',
    dimensions: {
      resumeConsistency: clampScore(dim.resumeConsistency),
      detailDepth: clampScore(dim.detailDepth),
      structure: clampScore(dim.structure),
      roleFit: clampScore(dim.roleFit),
    },
    actionItems: actionItems.length
      ? actionItems
      : [{ text: '把空泛动词改成可验证的指标与个人贡献' }],
    inconsistencies,
  };
}
