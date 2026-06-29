import { z } from 'zod';

const MODULE_TYPES = [
  'info1',
  'certificate',
  'education',
  'job',
  'project',
  'skill',
  'other',
] as const;

export const importedModuleSchema = z.object({
  type: z.enum(MODULE_TYPES),
  options: z.record(z.string(), z.unknown()),
});

export const importedPagesSchema = z.object({
  pages: z
    .array(
      z.object({
        modules: z.array(importedModuleSchema).min(1),
      }),
    )
    .min(1),
});

export type ImportedModule = z.infer<typeof importedModuleSchema>;
export type ImportedPagesPayload = z.infer<typeof importedPagesSchema>;
