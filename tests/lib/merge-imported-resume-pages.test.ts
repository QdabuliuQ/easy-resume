import { describe, expect, it } from 'vitest';
import defaultResume from '@/json/resume.defaults';
import {
  applyImportedPagesToConfig,
  buildInfo1Layout,
  clearImportedPagesInConfig,
  mergeImportedResumePages,
} from '@/lib/mergeImportedResumePages';

type TestModule = { type: string; id?: string; options?: Record<string, unknown> };
type TestPage = { modules: TestModule[] };

describe('mergeImportedResumePages', () => {
  it('buildInfo1Layout 仅包含有值字段', () => {
    expect(
      buildInfo1Layout({
        name: '张三',
        phone: '13800000000',
        email: 'a@b.com',
      }),
    ).toEqual([['phone', 'email']]);
  });

  it('合并保留 module.id 与 avatar', () => {
    const current = JSON.parse(JSON.stringify(defaultResume));
    const info1 = current.pages[0].modules.find((m: { type: string }) => m.type === 'info1') as TestModule;
    const oldId = info1.id;
    const oldAvatar = info1.options?.avatar;

    const incoming = {
      pages: [
        {
          modules: [
            {
              type: 'info1',
              options: {
                name: '李四',
                phone: '13900000000',
                layout: [['should', 'be', 'ignored']],
                avatar: 'should-not-use',
              },
            },
          ],
        },
      ],
    };

    const merged = mergeImportedResumePages(current.pages, incoming.pages) as TestPage[];
    const nextInfo1 = merged[0]!.modules.find((m) => m.type === 'info1')!;
    expect(nextInfo1.id).toBe(oldId);
    expect(nextInfo1.options!.avatar).toBe(oldAvatar);
    expect(nextInfo1.options!.name).toBe('李四');
    expect(nextInfo1.options!.phone).toBe('13900000000');
    expect(nextInfo1.options!.layout).toEqual([['phone']]);
  });

  it('job items 补 id', () => {
    const current = JSON.parse(JSON.stringify(defaultResume));
    const incoming = {
      pages: [
        {
          modules: [
            {
              type: 'job',
              options: {
                title: '工作经历',
                items: [{ company: '新公司', post: '工程师', description: '做了很多事' }],
              },
            },
          ],
        },
      ],
    };
    const merged = mergeImportedResumePages(current.pages, incoming.pages) as TestPage[];
    const job = merged[0]!.modules.find((m) => m.type === 'job')!;
    const items = job.options!.items as Record<string, unknown>[];
    expect(items).toHaveLength(1);
    expect(typeof items[0]!.id).toBe('string');
    expect(items[0]!.company).toBe('新公司');
  });

  it('applyImportedPagesToConfig 更新 name', () => {
    const current = JSON.parse(JSON.stringify(defaultResume));
    const next = applyImportedPagesToConfig(current, [
      {
        modules: [{ type: 'info1', options: { name: '王五', phone: '10086' } }],
      },
    ]);
    expect(next.name).toBe('王五');
  });

  it('clearImportedPagesInConfig 清空 modules', () => {
    const current = JSON.parse(JSON.stringify(defaultResume));
    const info1 = current.pages[0].modules.find((m: { type: string }) => m.type === 'info1') as TestModule;
    info1.options!.name = '待清空';
    const job = current.pages[0].modules.find((m: { type: string }) => m.type === 'job') as TestModule;
    job.options!.items = [{ id: 'x', company: '旧公司' }];

    const cleared = clearImportedPagesInConfig(current);
    expect(cleared.name).toBe('');
    expect(cleared.pages[0].modules).toEqual([]);
  });

  it('空 modules 时流式合并可追加模块', () => {
    const current = JSON.parse(JSON.stringify(defaultResume));
    current.pages[0].modules = [];
    const incoming = {
      pages: [
        {
          modules: [
            { type: 'info1', options: { name: '张三', phone: '10086' } },
            { type: 'job', options: { title: '工作经历', items: [{ company: 'A 公司' }] } },
          ],
        },
      ],
    };
    const merged = mergeImportedResumePages(current.pages, incoming.pages) as TestPage[];
    expect(merged[0]!.modules).toHaveLength(2);
    expect(merged[0]!.modules.find((m) => m.type === 'info1')!.options!.name).toBe('张三');
  });
});
