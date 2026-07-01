import { describe, expect, it } from 'vitest';
import { applyResumeDiffs, diffResumeJson } from '@/lib/resumeDiff';

const base = {
  name: '测试简历',
  globalStyle: {
    pageSize: 'A4',
    fontSize: 13,
    lineHeight: 1.3,
    moduleMargin: 15,
    color: '#000',
    backgroundColor: '#fff',
  },
  pages: [
    {
      modules: [
        {
          type: 'info1',
          id: '1',
          options: { name: '张三', phone: '10086' },
        },
        {
          type: 'job',
          id: '2',
          options: {
            title: '工作经历',
            items: [{ company: 'A公司', description: '<p>旧描述</p>' }],
          },
        },
      ],
    },
  ],
};

describe('resumeDiff', () => {
  it('finds changed leaf fields', () => {
    const proposed = JSON.parse(JSON.stringify(base)) as typeof base;
    proposed.name = '新标题';
    proposed.pages[0].modules[1].options.items[0].description = '<p>新描述</p>';
    const diffs = diffResumeJson(base, proposed);
    expect(diffs.some((d) => d.label.includes('简历标题') && d.kind === 'update')).toBe(true);
    expect(diffs.some((d) => d.newDisplay.includes('新描述') && d.kind === 'update')).toBe(true);
  });

  it('applyResumeDiffs patches only selected paths', () => {
    const proposed = JSON.parse(JSON.stringify(base)) as typeof base;
    proposed.name = '新标题';
    proposed.pages[0].modules[0].options.phone = '10010';
    const diffs = diffResumeJson(base, proposed);
    const nameDiff = diffs.find((d) => d.pathKeys[0] === 'name');
    expect(nameDiff).toBeTruthy();
    const next = applyResumeDiffs(base, proposed, diffs, [nameDiff!.id]) as typeof base;
    expect(next.name).toBe('新标题');
    expect(next.pages[0].modules[0].options.phone).toBe('10086');
  });

  it('ignores avatar differences', () => {
    const withAvatar = JSON.parse(JSON.stringify(base)) as typeof base;
    withAvatar.pages[0].modules[0].options.avatar = 'data:image/png;base64,x';
    const proposed = JSON.parse(JSON.stringify(withAvatar)) as typeof base;
    delete (proposed.pages[0].modules[0].options as { avatar?: string }).avatar;
    const diffs = diffResumeJson(withAvatar, proposed);
    expect(diffs.some((d) => String(d.pathKeys.at(-1)) === 'avatar')).toBe(false);
  });

  it('applyResumeDiffs inserts new module item from proposed', () => {
    const current = JSON.parse(JSON.stringify(base)) as typeof base;
    current.pages[0].modules.push({
      type: 'certificate',
      id: 'cert-1',
      options: {
        title: '证书',
        items: [
          { id: 'a', name: 'A', date: '2020-01-01' },
          { id: 'b', name: 'B', date: '2021-01-01' },
        ],
      },
    });
    const proposed = JSON.parse(JSON.stringify(current)) as typeof current;
    proposed.pages[0].modules[2].options.items.push({
      id: 'c',
      name: 'PMP项目管理',
      date: '2024-06-01',
    });
    const diffs = diffResumeJson(current, proposed);
    const addDiff = diffs.find((d) => d.kind === 'add' && d.newDisplay.includes('PMP'));
    expect(addDiff).toBeTruthy();
    const next = applyResumeDiffs(current, proposed, diffs, [addDiff!.id]) as typeof current;
    expect(next.pages[0].modules[2].options.items).toHaveLength(3);
    expect(next.pages[0].modules[2].options.items[2]).toEqual({
      id: 'c',
      name: 'PMP项目管理',
      date: '2024-06-01',
    });
  });

  it('applyResumeDiffs removes module item when selected', () => {
    const current = JSON.parse(JSON.stringify(base)) as typeof base;
    current.pages[0].modules[1].options.items.push({
      id: 'j2',
      company: 'B公司',
      description: '<p>B</p>',
    });
    const proposed = JSON.parse(JSON.stringify(base)) as typeof base;
    const diffs = diffResumeJson(current, proposed);
    const removedDiff = diffs.find(
      (d) => d.kind === 'remove' && d.oldDisplay.includes('B公司'),
    );
    expect(removedDiff).toBeTruthy();
    expect(removedDiff?.pathKeys.length).toBeGreaterThan(6);
    expect(removedDiff?.kind).toBe('remove');
    const next = applyResumeDiffs(current, proposed, diffs, [removedDiff!.id]) as typeof base;
    expect(next.pages[0].modules[1].options.items).toHaveLength(1);
  });
});
