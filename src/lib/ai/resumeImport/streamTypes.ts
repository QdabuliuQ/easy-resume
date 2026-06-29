import type { ImportedPagesPayload } from '@/lib/ai/resumeImport/schema';

export type ResumeImportStreamEvent =
  | { phase: 'extract'; status: string }
  | { phase: 'llm'; status: string }
  | { pages: ImportedPagesPayload['pages'] }
  | { done: true; pages: ImportedPagesPayload['pages'] }
  | { error: string };
