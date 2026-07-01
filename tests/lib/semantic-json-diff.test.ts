import { describe, expect, it } from 'vitest';
import { semanticJsonDiff } from '@/lib/semanticJsonDiff';
import { diffResumeJson } from '@/lib/resumeDiff';

const base = {
  name: '测试简历',
  pages: [
    {
      modules: [
        { type: 'info1', id: '1', options: { name: '张三', phone: '10086' } },
        {
          type: 'job',
          id: '2',
          options: {
            title: '工作经历',
            items: [
              { id: 'j1', company: 'A公司', description: '<p>旧描述</p>' },
            ],
          },
        },
      ],
    },
  ],
};

describe('semanticJsonDiff', () => {
  it('matches list items by id not index', () => {
    const proposed = JSON.parse(JSON.stringify(base)) as typeof base;
    proposed.pages[0].modules[1].options.items.push({
      id: 'j2',
      company: 'B公司',
      description: '<p>B</p>',
    });
    const diffs = semanticJsonDiff(base, proposed);
    expect(diffs.some((d) => d.type === 'ITEM_ADDED' && String(d.path).includes('j2'))).toBe(true);
  });

  it('detects module deletion by id', () => {
    const proposed = JSON.parse(JSON.stringify(base)) as typeof base;
    proposed.pages[0].modules = proposed.pages[0].modules.filter((m) => m.id !== '2');
    const diffs = semanticJsonDiff(base, proposed);
    expect(diffs.some((d) => d.type === 'MODULE_DELETED')).toBe(true);
  });

  it('diffResumeJson converts semantic paths to resume diffs', () => {
    const proposed = JSON.parse(JSON.stringify(base)) as typeof base;
    proposed.name = '新标题';
    const diffs = diffResumeJson(base, proposed);
    expect(diffs.some((d) => d.kind === 'update' && d.label.includes('简历标题'))).toBe(true);
  });
});
