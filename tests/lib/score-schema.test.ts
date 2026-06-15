import { describe, expect, it } from 'vitest';
import { resumeAiScoreResultSchema } from '@/lib/ai/score/schema';

describe('resumeAiScoreResultSchema', () => {
  it('accepts extended score payload with rule traces', () => {
    const sample = {
      totalScore: 84,
      dimensionEvaluate: [
        { dimensionName: '简历结构', status: '优秀', remark: '结构完整，阅读路径清晰。' },
        {
          dimensionName: '内容逻辑与STAR法则',
          status: '待优化',
          remark: '描述以职责为主，任务与动作链路可再明确。',
        },
        { dimensionName: '专业用词与表达', status: '优秀', remark: '术语较统一，表达客观。' },
        {
          dimensionName: '量化成果与数据支撑',
          status: '待补充',
          remark: '部分经历缺少可对比的数据结果。',
        },
      ],
      hitRules: ['STR_JOB_001', 'QNT_RESULT_001', 'STR_ORDER_001'],
      deductions: [
        {
          ruleId: 'QNT_RESULT_001',
          reason: '工作经历中量化指标偏少。',
          delta: 10,
          evidencePath: 'pages[0].modules[type=job].options.items[*].description',
        },
      ],
      bonuses: [
        {
          ruleId: 'STR_ORDER_001',
          reason: '模块顺序清晰。',
          delta: 3,
          evidencePath: 'pages[0].modules[*].type',
        },
      ],
    };

    const parsed = resumeAiScoreResultSchema.parse(sample);
    expect(parsed.totalScore).toBe(84);
    expect(parsed.hitRules).toEqual(['STR_JOB_001', 'QNT_RESULT_001', 'STR_ORDER_001']);
    expect(parsed.deductions?.[0]?.delta).toBe(10);
    expect(parsed.bonuses?.[0]?.delta).toBe(3);
  });

  it('rejects non-positive delta in deductions', () => {
    const sample = {
      totalScore: 80,
      dimensionEvaluate: [
        { dimensionName: '简历结构', status: '优秀', remark: 'ok' },
        { dimensionName: '内容逻辑与STAR法则', status: '优秀', remark: 'ok' },
        { dimensionName: '专业用词与表达', status: '优秀', remark: 'ok' },
        { dimensionName: '量化成果与数据支撑', status: '优秀', remark: 'ok' },
      ],
      deductions: [{ ruleId: 'QNT_RESULT_001', reason: 'bad', delta: 0 }],
    };

    expect(() => resumeAiScoreResultSchema.parse(sample)).toThrow();
  });
});
