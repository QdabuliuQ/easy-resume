import type { z } from 'zod';
import { parseAiJsonObject } from '@/lib/ai/parseAiJson';
import {
  intentOutputSchema,
  partialModifyOutputSchema,
  resumeModifyOutputSchema,
  scopeOutputSchema,
  type IntentOutput,
  type PartialModifyOutput,
  type ResumeModifyOutput,
  type ScopeOutput,
} from './resumeSchema';

function parseWithSchema<T>(raw: string, schema: z.ZodType<T>): T {
  return schema.parse(parseAiJsonObject(raw));
}

export const parseIntentOutput = (raw: string): IntentOutput =>
  parseWithSchema(raw, intentOutputSchema);

export const parseScopeOutput = (raw: string): ScopeOutput =>
  parseWithSchema(raw, scopeOutputSchema);

export const parsePartialModifyOutput = (raw: string): PartialModifyOutput =>
  parseWithSchema(raw, partialModifyOutputSchema);

export const parseResumeModifyOutput = (raw: string): ResumeModifyOutput =>
  parseWithSchema(raw, resumeModifyOutputSchema);

export function formatZodError(e: unknown): string {
  if (e && typeof e === 'object' && 'issues' in e) {
    const issues = (e as { issues: { path: unknown[]; message: string }[] }).issues;
    if (issues.length) {
      return issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
        .join('; ');
    }
  }
  return e instanceof Error ? e.message : String(e);
}
