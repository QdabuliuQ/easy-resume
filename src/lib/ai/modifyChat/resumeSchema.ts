import { z } from 'zod';
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
  scope: z.enum(['partial', 'global', 'ambiguous']),
  targets: z.array(modifyScopeTargetSchema).default([]),
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
export type PartialModifyOutput = z.infer<typeof partialModifyOutputSchema>;

export const RESUME_JSON_SCHEMA_PROMPT = `
简历根对象 resume：
- name: string — 简历标题
- globalStyle: object — pageSize(A4|A3|A5|Letter), fontSize(number), lineHeight(number), moduleMargin(number), color(string), backgroundColor(string), padding?(number), headerType?(number), resumeFont?(string), layout?(default|line|rounded|leftCol|rightCol)
- pages: array — 至少 1 页
- exportPages?: number[] | null

每页 pages[i]：
- modules: array — 至少 1 个模块

每个模块 modules[j]：
- type: info1 | certificate | education | job | project | skill | other
- id: string — 须与输入一致；用户要求删除模块时可从 pages 中移除，每页至少保留 1 个模块
- options: object — 模块数据；按 type 常见字段：
  - info1.options: name, phone, email, city, status, intentCity, intentPosts, wechat, birthday, gender, site, expectedSalary, showKeys, position...（不含 avatar）
  - job.options: title, items[] — items[].company, postDepartment, city, time[], description(HTML)
  - project.options: title, items[] — items[].projectName, role, time[], description(HTML)
  - education.options: title, items[] — school, degree, major, city, studyTime[], description(HTML)
  - skill.options: title, items[] — skillName, level
  - certificate.options: title, items[]
  - other.options: title, items[]
`.trim();
