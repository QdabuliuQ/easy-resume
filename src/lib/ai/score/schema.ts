import { z } from 'zod';

const scoreDimensionSchema = z.object({
  dimensionName: z.string().trim(),
  status: z.string().trim(),
  remark: z.string().trim(),
});

const scoreRuleDeltaSchema = z.object({
  ruleId: z.string().trim(),
  reason: z.string().trim(),
  delta: z.coerce.number().positive('delta 必须是正数'),
  evidencePath: z.string().trim().optional(),
});

export const resumeAiScoreResultSchema = z.object({
  totalScore: z.coerce
    .number()
    .int('totalScore 必须是整数')
    .min(0, 'totalScore 不能小于 0')
    .max(100, 'totalScore 不能大于 100'),
  dimensionEvaluate: z.array(scoreDimensionSchema),
  hitRules: z.array(z.string().trim()).optional(),
  deductions: z.array(scoreRuleDeltaSchema).optional(),
  bonuses: z.array(scoreRuleDeltaSchema).optional(),
});

const fieldOptimizeSchema = z.object({
  pageIndex: z.coerce
    .number()
    .int('pageIndex 必须是整数')
    .min(0, 'pageIndex 不能小于 0'),
  moduleType: z.string().trim(),
  moduleId: z.string().trim(),
  moduleItemId: z.string().trim().optional(),
  fieldKey: z.string().trim(),
  optimizeReason: z.string().trim(),
  optimizeValue: z.string(),
});

export const resumeAiOptimizeResultSchema = z.object({
  fieldOptimizeList: z.array(fieldOptimizeSchema).default([]),
});
