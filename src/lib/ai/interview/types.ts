export type InterviewAnchorModule =
  | 'job'
  | 'project'
  | 'education'
  | 'skill'
  | 'certificate'
  | 'other'
  | 'info'
  | (string & {});

export type InterviewAnchor = {
  moduleType: InterviewAnchorModule;
  moduleId?: string;
  itemIndex?: number;
  itemId?: string;
  label: string;
  excerpt: string;
};

export type InterviewQuestion = {
  id: string;
  index: number;
  text: string;
  anchor: InterviewAnchor;
  depth: 'L1' | 'L2';
};

export type InterviewAnswer = {
  questionId: string;
  text?: string;
  skipped?: boolean;
};

export type InterviewReport = {
  summary: string;
  dimensions: {
    resumeConsistency: number;
    detailDepth: number;
    structure: number;
    roleFit: number;
  };
  actionItems: Array<{ text: string; anchor?: InterviewAnchor }>;
  inconsistencies?: string[];
};

export type InterviewDifficulty = 'easy' | 'medium' | 'hard';

export type InterviewSessionStatus = 'active' | 'reporting' | 'done';

export type InterviewSession = {
  id: string;
  ownerKey: string;
  resumeId?: string;
  resume: unknown;
  targetRole: string;
  difficulty: InterviewDifficulty;
  questionCount: number;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  currentIndex: number;
  status: InterviewSessionStatus;
  report?: InterviewReport;
  createdAt: number;
  expiresAt: number;
};

export const INTERVIEW_Q_MIN = 5;
export const INTERVIEW_Q_MAX = 10;
export const INTERVIEW_Q_DEFAULT = 6;
export const INTERVIEW_ANCHOR_MIN = 2;
export const INTERVIEW_SESSION_TTL_MS = 2 * 60 * 60 * 1000;
export const INTERVIEW_DIFFICULTY_DEFAULT: InterviewDifficulty = 'medium';

export function clampQuestionCount(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return INTERVIEW_Q_DEFAULT;
  return Math.min(INTERVIEW_Q_MAX, Math.max(INTERVIEW_Q_MIN, Math.round(v)));
}

export function normalizeInterviewDifficulty(v: unknown): InterviewDifficulty {
  if (v === 'easy' || v === 'medium' || v === 'hard') return v;
  return INTERVIEW_DIFFICULTY_DEFAULT;
}
