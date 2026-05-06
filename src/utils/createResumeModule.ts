import defaultResume from '@/json/resume';

export type ResumeModuleType =
  | 'info1'
  | 'certificate'
  | 'skill'
  | 'job'
  | 'project'
  | 'education'
  | 'other';

export function createEmptyResumeModule(type: ResumeModuleType) {
  const template = defaultResume.pages[0].modules.find(
    (m: { type: string }) => m.type === type
  );
  if (!template) {
    throw new Error(`No template for module type: ${type}`);
  }
  const id =
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `m-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    type: template.type,
    id,
    options: JSON.parse(JSON.stringify(template.options)),
  } as {
    type: string;
    id: string;
    options: Record<string, unknown>;
  };
}
