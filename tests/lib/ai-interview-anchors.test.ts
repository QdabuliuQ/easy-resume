import { describe, expect, it } from 'vitest';
import {
  canStartInterview,
  extractInterviewAnchors,
} from '@/lib/ai/interview/anchors';
import { preflightFromResume } from '@/lib/ai/interview/resolveResume';
import {
  clampQuestionCount,
  normalizeInterviewDifficulty,
} from '@/lib/ai/interview/types';

function richResume() {
  return {
    pages: [
      {
        modules: [
          {
            type: 'info1',
            id: 'i1',
            options: { name: '张三', intentPosts: '前端工程师' },
          },
          {
            type: 'job',
            id: 'j1',
            options: {
              items: [
                {
                  id: 'ji1',
                  company: '青松科技',
                  post: '前端',
                  description: '<p>负责性能优化，将首屏从 3s 降到 1.2s，并推动组件化落地</p>',
                },
              ],
            },
          },
          {
            type: 'project',
            id: 'p1',
            options: {
              items: [
                {
                  id: 'pi1',
                  name: '简历编辑器',
                  role: '负责人',
                  description: '设计模块化渲染与实时预览，支持导出 PDF 与云同步',
                },
              ],
            },
          },
          {
            type: 'education',
            id: 'e1',
            options: {
              items: [
                {
                  id: 'ei1',
                  school: '某某大学',
                  major: '计算机',
                  description: '完成分布式系统课程设计，实现简易 KV 存储与一致性实验',
                },
              ],
            },
          },
          {
            type: 'skill',
            id: 's1',
            options: {
              title: '专业技能',
              description: '熟悉 React、TypeScript、Node.js 与性能调优，有工程化实践',
            },
          },
          {
            type: 'certificate',
            id: 'c1',
            options: {
              items: [
                {
                  id: 'ci1',
                  name: 'AWS SAA',
                  description: '掌握云计算基础架构设计与高可用部署实践经验',
                },
              ],
            },
          },
          {
            type: 'other',
            id: 'o1',
            options: {
              title: '开源贡献',
              description: '维护内部组件库文档，推动设计规范在业务线落地应用',
            },
          },
        ],
      },
    ],
    intentPosts: '全栈工程师',
  };
}

describe('ai interview anchors', () => {
  it('extracts diggable anchors across modules', () => {
    const anchors = extractInterviewAnchors(richResume());
    expect(anchors.length).toBeGreaterThanOrEqual(5);
    expect(canStartInterview(anchors)).toBe(true);
    expect(anchors.some((a) => a.moduleType === 'job' && a.label === '青松科技')).toBe(true);
    expect(anchors.some((a) => a.moduleType === 'project')).toBe(true);
    expect(anchors.some((a) => a.moduleType === 'education')).toBe(true);
    expect(anchors.some((a) => a.moduleType === 'skill')).toBe(true);
    expect(anchors.some((a) => a.moduleType === 'certificate')).toBe(true);
    expect(anchors.some((a) => a.moduleType === 'other')).toBe(true);
    expect(anchors.some((a) => a.label === '意向岗位' && a.excerpt.includes('全栈'))).toBe(true);
  });

  it('skips info1 modules and thin excerpts', () => {
    const anchors = extractInterviewAnchors({
      pages: [
        {
          modules: [
            { type: 'info1', id: 'x', options: { name: 'A', intentPosts: '前端' } },
            {
              type: 'job',
              options: { items: [{ company: '短', description: '短' }] },
            },
          ],
        },
      ],
    });
    expect(anchors.every((a) => a.moduleType !== 'info1')).toBe(true);
    expect(canStartInterview(anchors)).toBe(false);
  });

  it('preflightFromResume gates start', () => {
    const ok = preflightFromResume(richResume());
    expect(ok.ok).toBe(true);
    expect(ok.anchors.length).toBeGreaterThanOrEqual(2);

    const bad = preflightFromResume({ pages: [] });
    expect(bad.ok).toBe(false);
    expect(bad.message).toMatch(/不足/);
  });
});

describe('ai interview helpers', () => {
  it('clamps question count to 5-10', () => {
    expect(clampQuestionCount(3)).toBe(5);
    expect(clampQuestionCount(6)).toBe(6);
    expect(clampQuestionCount(20)).toBe(10);
    expect(clampQuestionCount('x')).toBe(6);
  });

  it('normalizes difficulty', () => {
    expect(normalizeInterviewDifficulty('easy')).toBe('easy');
    expect(normalizeInterviewDifficulty('medium')).toBe('medium');
    expect(normalizeInterviewDifficulty('hard')).toBe('hard');
    expect(normalizeInterviewDifficulty('unknown')).toBe('medium');
    expect(normalizeInterviewDifficulty(null)).toBe('medium');
  });
});
