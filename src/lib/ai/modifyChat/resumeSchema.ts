import { z } from 'zod';
import { RESUME_JSON_SCHEMA_PROMPT } from '@/lib/ai/resumeFieldSchema';
import { RESUME_PAGE_SIZES } from '@/lib/resumePageSize';

export const RESUME_MODULE_TYPES = [
  'info1',
  'certificate',
  'education',
  'job',
  'project',
  'skill',
  'other',
] as const;

/** AI 对话可新增的模块类型（不含 info1：有且只能有一个，不可对话新增） */
export const ADDABLE_RESUME_MODULE_TYPES = [
  'certificate',
  'education',
  'job',
  'project',
  'skill',
  'other',
] as const;

const LAYOUT_VALUES = ['default', 'line', 'rounded', 'leftCol', 'rightCol'] as const;
const PAGE_SIZE_KEYS = Object.keys(RESUME_PAGE_SIZES);

export const resumeModuleSchema = z.object({
  type: z.enum(RESUME_MODULE_TYPES),
  id: z.string().min(1),
  options: z.record(z.string(), z.unknown()),
});

export const resumePageSchema = z
  .object({
    modules: z.array(resumeModuleSchema).min(1),
  })
  .passthrough();

export const globalStyleSchema = z
  .object({
    pageSize: z.string().refine((v) => PAGE_SIZE_KEYS.includes(v), 'invalid pageSize'),
    fontSize: z.number(),
    lineHeight: z.number(),
    moduleMargin: z.number(),
    color: z.string(),
    backgroundColor: z.string(),
    padding: z.number().optional(),
    headerType: z.number().optional(),
    resumeFont: z.string().optional(),
    layout: z.enum(LAYOUT_VALUES).optional(),
  })
  .passthrough();

export const resumeConfigSchema = z
  .object({
    name: z.string(),
    globalStyle: globalStyleSchema,
    pages: z.array(resumePageSchema).min(1),
    exportPages: z.array(z.number()).optional().nullable(),
  })
  .passthrough();

export const resumeModifyOutputSchema = z.object({
  message: z.string().min(1),
  resume: resumeConfigSchema,
});

export const intentOutputSchema = z.object({
  intent: z.enum(['modify_resume', 'chat']),
});

export const modifyScopeTargetSchema = z.object({
  moduleId: z.string().min(1),
  itemIndex: z.number().int().min(0).optional(),
});

export const scopeOutputSchema = z.object({
  scope: z.enum(['partial', 'global', 'ambiguous', 'add_module']),
  targets: z.array(modifyScopeTargetSchema).default([]),
  moduleType: z.enum(ADDABLE_RESUME_MODULE_TYPES).optional(),
  scene: z.enum(['work', 'project', 'skill']).nullable().optional(),
  action: z.enum(['polish', 'edit', 'add', 'remove', 'auto']).optional(),
  clarifyMessage: z.string().optional(),
});

export const partialModifyOutputSchema = z.object({
  message: z.string().min(1),
  module: resumeModuleSchema,
});

export type ResumeConfig = z.infer<typeof resumeConfigSchema>;
export type ResumeModifyOutput = z.infer<typeof resumeModifyOutputSchema>;
export type IntentOutput = z.infer<typeof intentOutputSchema>;
export type ModifyScopeTarget = z.infer<typeof modifyScopeTargetSchema>;
export type ScopeOutput = z.infer<typeof scopeOutputSchema>;
export type AddableResumeModuleType = (typeof ADDABLE_RESUME_MODULE_TYPES)[number];
export type PartialModifyOutput = z.infer<typeof partialModifyOutputSchema>;

export { RESUME_JSON_SCHEMA_PROMPT };
