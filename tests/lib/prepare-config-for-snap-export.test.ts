// @vitest-environment node
import { describe, expect, it } from 'vitest';
import defaultResume from '@/json/resume.defaults';
import { prepareConfigForSnapExport } from '@/lib/clientSnapResumeImage';

describe('prepareConfigForSnapExport', () => {
  it('merges default globalStyle, forces A4, and resolves exportPages', () => {
    const out = prepareConfigForSnapExport(
      {
        name: '测试',
        globalStyle: { color: '#112233', pageSize: 'Letter' },
        pages: [{ modules: [{ id: 'm1', type: 'info1' }] }],
      },
      [{ modules: [{ id: 'm1' }] }],
    ) as Record<string, unknown>;
    expect(out.name).toBe('测试');
    expect((out.globalStyle as { color?: string }).color).toBe('#112233');
    expect((out.globalStyle as { pageSize?: string }).pageSize).toBe('A4');
    expect((out.globalStyle as { fontSize?: number }).fontSize).toBe(
      (defaultResume.globalStyle as { fontSize: number }).fontSize,
    );
    expect(out.exportPages).toEqual([{ modules: [{ id: 'm1' }] }]);
  });
});
