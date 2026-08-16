import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoke = vi.fn();

vi.mock('@/lib/ai/chatModel', () => ({
  createDeepSeekModel: () => ({
    pipe: () => ({
      invoke: (...args: unknown[]) => invoke(...args),
    }),
  }),
}));

import {
  generateInterviewQuestions,
  generateInterviewReport,
  targetRoleFromResume,
} from '@/lib/ai/interview/service';
import type { InterviewAnchor } from '@/lib/ai/interview/types';

const anchors: InterviewAnchor[] = [
  {
    moduleType: 'job',
    label: '青松科技',
    excerpt: '负责性能优化与组件化落地',
    itemIndex: 0,
  },
  {
    moduleType: 'project',
    label: '简历编辑器',
    excerpt: '模块化渲染与实时预览',
    itemIndex: 0,
  },
];

describe('ai interview service', () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it('targetRoleFromResume reads info1 intentPosts', () => {
    expect(
      targetRoleFromResume({
        pages: [
          {
            modules: [{ type: 'info1', options: { intentPosts: '前端工程师 / 全栈' } }],
          },
        ],
      }),
    ).toBe('前端工程师 / 全栈');
    expect(targetRoleFromResume({ pages: [] })).toBe('');
  });

  it('generateInterviewQuestions returns questionCount items and passes difficulty', async () => {
    invoke.mockResolvedValueOnce(
      JSON.stringify({
        questions: [
          { text: '在青松科技你如何量化首屏优化？', anchorIndex: 0, focus: ['指标'] },
          { text: '简历编辑器里你的个人边界是什么？', anchorIndex: 1, focus: ['ownership'] },
          { text: '组件化落地遇到过哪些冲突？', anchorIndex: 0, focus: ['协作'] },
          { text: '实时预览如何保证性能？', anchorIndex: 1, focus: ['性能'] },
          { text: '若重做首屏优化你会改什么？', anchorIndex: 0, focus: ['复盘'] },
        ],
      }),
    );

    const questions = await generateInterviewQuestions({
      anchors,
      questionCount: 5,
      targetRole: '前端工程师',
      difficulty: 'hard',
    });

    expect(questions).toHaveLength(5);
    expect(questions[0]?.text).toContain('青松科技');
    expect(questions[0]?.anchor.label).toBe('青松科技');
    expect(questions[1]?.anchor.label).toBe('简历编辑器');
    expect(questions.every((q) => q.depth === 'L1')).toBe(true);

    const human = invoke.mock.calls[0]?.[0] as Array<{ content?: string }>;
    const body = JSON.parse(String(human?.[1]?.content || '{}')) as {
      difficulty?: string;
      questionCount?: number;
      targetRole?: string;
      resumeHint?: unknown;
      anchors?: unknown[];
    };
    expect(body.difficulty).toBe('hard');
    expect(body.questionCount).toBe(5);
    expect(body.targetRole).toBe('前端工程师');
    expect(body.resumeHint).toBeUndefined();
    expect(body.anchors).toHaveLength(2);
  });

  it('generateInterviewQuestions fills missing model rows with fallbacks', async () => {
    invoke.mockResolvedValueOnce(JSON.stringify({ questions: [{ text: '仅一题', anchorIndex: 0 }] }));
    const questions = await generateInterviewQuestions({
      anchors,
      questionCount: 3,
      targetRole: '',
      difficulty: 'easy',
    });
    expect(questions).toHaveLength(3);
    expect(questions[0]?.text).toBe('仅一题');
    expect(questions[1]?.text).toMatch(/结合/);
  });

  it('generateInterviewReport clips long answers and omits resumeHint', async () => {
    invoke.mockResolvedValueOnce(
      JSON.stringify({
        summary: '整体表达清楚，细节可再量化。',
        dimensions: {
          resumeConsistency: 80,
          detailDepth: 70,
          structure: 75,
          roleFit: 85,
        },
        actionItems: [{ text: '补充性能基线数据', anchorIndex: 0 }],
        inconsistencies: ['口头说提升 50%，简历未写'],
      }),
    );

    const long = '答'.repeat(2000);
    const report = await generateInterviewReport({
      targetRole: '前端',
      difficulty: 'medium',
      questions: [
        {
          id: 'q1',
          index: 0,
          text: '题1',
          anchor: anchors[0]!,
          depth: 'L1',
        },
      ],
      answers: [{ questionId: 'q1', text: long }],
    });

    expect(report.summary).toContain('整体表达');
    expect(report.dimensions.detailDepth).toBe(70);
    expect(report.actionItems[0]?.text).toContain('性能基线');
    expect(report.inconsistencies?.[0]).toMatch(/50%/);

    const human = invoke.mock.calls[0]?.[0] as Array<{ content?: string }>;
    const body = JSON.parse(String(human?.[1]?.content || '{}')) as {
      resumeHint?: unknown;
      turns?: Array<{ answer?: string }>;
    };
    expect(body.resumeHint).toBeUndefined();
    expect(body.turns?.[0]?.answer?.length).toBeLessThanOrEqual(1201);
  });
});
