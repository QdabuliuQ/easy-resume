import { describe, expect, it } from 'vitest';
import {
  applyResumeAiFieldOptimize,
  fieldOptimizeListKey,
  findResumeModule,
  resumeModuleItemLabel,
} from '@/lib/resumeAiFieldApply';

describe('resumeAiFieldApply', () => {
  const draft = {
    pages: [
      {
        modules: [
          {
            id: 'job-1',
            type: 'job',
            options: {
              items: [
                { id: 'item-1', company: 'ACME', description: 'old' },
              ],
            },
          },
          {
            id: 'skill-1',
            type: 'skill',
            options: { description: 'old skill' },
          },
        ],
      },
    ],
  };

  it('findResumeModule locates module by id', () => {
    const mod = findResumeModule(draft, 0, 'job-1');
    expect(mod?.type).toBe('job');
  });

  it('resumeModuleItemLabel returns company name', () => {
    const mod = findResumeModule(draft, 0, 'job-1');
    expect(resumeModuleItemLabel(mod, 'item-1')).toBe('ACME');
  });

  it('applyResumeAiFieldOptimize updates item field', () => {
    const ok = applyResumeAiFieldOptimize(draft, {
      pageIndex: 0,
      moduleType: 'job',
      moduleId: 'job-1',
      moduleItemId: 'item-1',
      fieldKey: 'description',
      optimizeReason: 'test',
      optimizeValue: 'new desc',
    });
    expect(ok).toBe(true);
    const item = (draft.pages![0].modules![0].options as { items: { description: string }[] })
      .items[0];
    expect(item.description).toBe('new desc');
  });

  it('applyResumeAiFieldOptimize updates flat skill field', () => {
    const ok = applyResumeAiFieldOptimize(draft, {
      pageIndex: 0,
      moduleType: 'skill',
      moduleId: 'skill-1',
      fieldKey: 'description',
      optimizeReason: 'test',
      optimizeValue: 'new skill',
    });
    expect(ok).toBe(true);
    expect((draft.pages![0].modules![1].options as { description: string }).description).toBe(
      'new skill',
    );
  });

  it('fieldOptimizeListKey is stable', () => {
    expect(
      fieldOptimizeListKey({
        pageIndex: 0,
        moduleType: 'job',
        moduleId: '1',
        moduleItemId: '2',
        fieldKey: 'description',
        optimizeReason: '',
        optimizeValue: '',
      }),
    ).toBe('0-1-2-description');
  });
});
