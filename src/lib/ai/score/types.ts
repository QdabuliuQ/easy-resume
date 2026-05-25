export type ResumeAiDimensionEvaluate = {
  dimensionName: string;
  status: string;
  remark: string;
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

export type ResumeAiAnalyzeResult = {
  totalScore: number;
  dimensionEvaluate: ResumeAiDimensionEvaluate[];
  fieldOptimizeList: ResumeAiFieldOptimize[];
};

export type ResumeAiAnalyzeResponse = ResumeAiAnalyzeResult & {
  cached?: boolean;
};
