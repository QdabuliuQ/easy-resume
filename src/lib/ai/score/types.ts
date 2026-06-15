export type ResumeAiDimensionEvaluate = {
  dimensionName: string;
  status: string;
  remark: string;
};

export type ResumeAiScoreRuleDelta = {
  ruleId: string;
  reason: string;
  delta: number;
  evidencePath?: string;
};

export type ResumeAiFieldOptimize = {
  pageIndex: number;
  moduleType: string;
  moduleId: string;
  moduleItemId?: string;
  fieldKey: string;
  optimizeReason: string;
  optimizeValue: string;
};

export type ResumeAiScoreResult = {
  totalScore: number;
  dimensionEvaluate: ResumeAiDimensionEvaluate[];
  hitRules?: string[];
  deductions?: ResumeAiScoreRuleDelta[];
  bonuses?: ResumeAiScoreRuleDelta[];
};

export type ResumeAiOptimizeResult = {
  fieldOptimizeList: ResumeAiFieldOptimize[];
};

export type ResumeAiAnalyzeResult = ResumeAiScoreResult & ResumeAiOptimizeResult;

export type ResumeAiScoreResponse = ResumeAiScoreResult & { cached?: boolean };
export type ResumeAiOptimizeResponse = ResumeAiOptimizeResult & { cached?: boolean };
export type ResumeAiAnalyzeResponse = ResumeAiAnalyzeResult & { cached?: boolean };
