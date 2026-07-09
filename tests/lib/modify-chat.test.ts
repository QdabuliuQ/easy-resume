import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { parseIntentOutput, parseResumeModifyOutput, parseScopeOutput } from '@/lib/ai/modifyChat/parse';
import { extractStreamingMessage } from '@/lib/ai/modifyChat/extractStreamingMessage';
import { linkAbortSignal, throwIfAborted } from '@/lib/ai/abortSignal';
import { buildModifyChatMessages } from '@/lib/ai/modifyChat/shared';
import { buildModifyChatResult } from '@/lib/ai/modifyChat/result';
import * as intentRouter from '@/lib/ai/modifyChat/intentRouter';
import { classifyIntentByRules } from '@/lib/ai/modifyChat/intentRules';
import { classifyModifyIntent } from '@/lib/ai/modifyChat/intentRouter';
import { OFF_TOPIC_REPLY, streamModifyChatPipeline } from '@/lib/ai/modifyChat/service';
import { finalizeModifiedResume, validateResumeStructureMatch } from '@/lib/ai/modifyChat/merge';
import { validateInfo1ModuleChange } from '@/utils/moduleTypeLimits';
import { getModifyChatBodySizeError } from '@/lib/ai/modifyChat/limits';
import { PROMPT_INJECTION_GUARD } from '@/lib/ai/modifyChat/prompt';
import { sanitizeResumeHtmlFields } from '@/lib/ai/modifyChat/sanitizeResume';
import { appendModuleToResume, mergeModuleIntoResume, removeModuleFromResume, validateInitModule, validatePartialModule } from '@/lib/ai/modifyChat/partialPatch';
import { resumePatchDoneEnvelope, textOnlyDoneEnvelope } from '@/lib/ai/modifyChat/protocol';
import {
  buildResumeModuleSummary,
  extractPostType,
  locateModule,
  resolveTargetsByDisplayName,
} from '@/lib/ai/modifyChat/resumeSummary';
import { inferAddModuleType, inferModifyScopeHeuristic } from '@/lib/ai/modifyChat/scopeRouter';
import { RESUME_JSON_SCHEMA_PROMPT, type ResumeConfig } from '@/lib/ai/modifyChat/resumeSchema';
import type { ModifyChatResult } from '@/lib/ai/modifyChat/types';
import { SCHEMA_GLOSSARY_FILE } from '@/lib/ai/ragResume/knowledge';
import { stripResumeAvatarForAi } from '@/lib/stripResumeAvatarForAi';

describe('resume field schema prompt', () => {
  it('uses canonical startDate/endDate and forbids legacy field names', () => {
    expect(RESUME_JSON_SCHEMA_PROMPT).toContain('startDate');
    expect(RESUME_JSON_SCHEMA_PROMPT).toContain('endDate');
    expect(RESUME_JSON_SCHEMA_PROMPT).toContain('name: string — 项目名称');
    expect(RESUME_JSON_SCHEMA_PROMPT).toContain('中专|高中|专科|本科|硕士|博士|MBA');
    expect(RESUME_JSON_SCHEMA_PROMPT).toContain('禁止 time[]、studyTime[]');
  });
});

describe('schema-field-glossary', () => {
  it('glossary documents canonical field types and forbids legacy names', async () => {
    const text = await readFile(
      path.join(process.cwd(), 'src/rag-resume-knowledge', SCHEMA_GLOSSARY_FILE),
      'utf-8',
    );
    expect(text).toContain('module: skill');
    expect(text).toContain('module: info1');
    expect(text).toContain('items[].startDate');
    expect(text).toContain('items[].post');
    expect(text).toContain('items[].name');
    expect(text).toContain('禁止 time[]');
    expect(text).toContain('add_module');
    expect(text).toContain('禁用 postDepartment');
    expect(text).toContain('禁用 studyTime');
  });
});

describe('modifyChat protocol', () => {
  it('buildModifyChatResult extracts text-only response', () => {
    const env = textOnlyDoneEnvelope('你好');
    const result = buildModifyChatResult(env);
    expect(result.intent).toBe('chat');
    expect(result.content).toBe('你好');
    expect(result.data[0]).toEqual({ type: 'text', content: '你好' });
  });

  it('buildModifyChatResult extracts resume-patch block', () => {
    const resume = { name: 't', pages: [] };
    const env = resumePatchDoneEnvelope('已优化', resume);
    const result = buildModifyChatResult(env);
    expect(result.intent).toBe('modify_resume');
    expect(result.content).toBe('已优化');
    expect(result.resume).toEqual(resume);
  });
});

describe('modifyChat scope', () => {
  const resume = {
    name: 't',
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
          { type: 'info1', id: '1', options: { name: '张三', intentPosts: '前端工程师' } },
          { type: 'job', id: '2', options: { title: '工作', items: [{ company: 'A', description: '做了开发' }] } },
        ],
      },
    ],
  };

  it('buildResumeModuleSummary lists modules', () => {
    const summary = buildResumeModuleSummary(resume);
    expect(summary).toHaveLength(2);
    expect(summary[1]?.type).toBe('job');
    expect(summary[1]?.itemCount).toBe(1);
  });

  it('inferModifyScopeHeuristic resolves job polish', () => {
    const summary = buildResumeModuleSummary(resume);
    const scope = inferModifyScopeHeuristic('优化工作经历描述', summary);
    expect(scope?.scope).toBe('partial');
    expect(scope?.targets[0]?.moduleId).toBe('2');
    expect(scope?.scene).toBe('work');
    expect(scope?.action).toBe('polish');
  });

  it('inferModifyScopeHeuristic resolves skill polish', () => {
    const summary = buildResumeModuleSummary({
      ...resume,
      pages: [
        {
          modules: [
            { type: 'info1', id: '1', options: { name: '张三' } },
            { type: 'job', id: '2', options: { title: '工作', items: [] } },
            { type: 'skill', id: '3', options: { title: '专业技能', items: [{ skillName: 'Java', level: '熟练' }] } },
          ],
        },
      ],
    });
    const scope = inferModifyScopeHeuristic('帮我润色一下专业技能', summary);
    expect(scope?.scope).toBe('partial');
    expect(scope?.targets[0]?.moduleId).toBe('3');
    expect(scope?.scene).toBe('skill');
  });

  it('buildResumeModuleSummary uses options.title as label for other', () => {
    const summary = buildResumeModuleSummary({
      pages: [
        {
          modules: [
            { type: 'other', id: 'other-1', options: { title: '个人优势', description: '...' } },
          ],
        },
      ],
    });
    expect(summary[0]?.label).toBe('个人优势');
    expect(summary[0]?.type).toBe('other');
  });

  it('resolveTargetsByDisplayName matches custom other title', () => {
    const summary = buildResumeModuleSummary({
      pages: [
        {
          modules: [
            { type: 'other', id: 'other-1', options: { title: '个人优势', description: '...' } },
          ],
        },
      ],
    });
    const hits = resolveTargetsByDisplayName('润色个人优势', summary);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.moduleId).toBe('other-1');
  });

  it('inferModifyScopeHeuristic resolves other module by custom title', () => {
    const summary = buildResumeModuleSummary({
      pages: [
        {
          modules: [
            { type: 'info1', id: '1', options: { name: '张三' } },
            { type: 'other', id: 'other-1', options: { title: '个人优势', description: '...' } },
          ],
        },
      ],
    });
    const scope = inferModifyScopeHeuristic('润色个人优势', summary);
    expect(scope?.scope).toBe('partial');
    expect(scope?.targets[0]?.moduleId).toBe('other-1');
    expect(scope?.scene).toBeNull();
  });

  it('inferModifyScopeHeuristic ambiguous without module hint', () => {
    const summary = buildResumeModuleSummary(resume);
    const scope = inferModifyScopeHeuristic('优化一下', summary);
    expect(scope?.scope).toBe('ambiguous');
  });

  it('inferModifyScopeHeuristic resolves add certificate module when missing', () => {
    const summary = buildResumeModuleSummary({
      pages: [
        {
          modules: [
            { type: 'info1', id: '1', options: { name: '张三' } },
            { type: 'skill', id: '2', options: { title: '专业技能', description: '' } },
            { type: 'other', id: '3', options: { title: '个人优势', description: '' } },
            { type: 'job', id: '4', options: { title: '工作经历', items: [] } },
            { type: 'project', id: '5', options: { title: '项目经历', items: [] } },
            { type: 'education', id: '6', options: { title: '教育经历', items: [] } },
          ],
        },
      ],
    });
    const scope = inferModifyScopeHeuristic(
      '新增一个证书模块，证书有大学英语四级和大学英语六级',
      summary,
    );
    expect(scope?.scope).toBe('add_module');
    expect(scope?.moduleType).toBe('certificate');
    expect(scope?.action).toBe('add');
  });

  it('inferModifyScopeHeuristic resolves add certificate', () => {
    const summary = buildResumeModuleSummary({
      pages: [
        {
          modules: [
            {
              type: 'certificate',
              id: 'cert-1',
              options: {
                title: '证书',
                items: [{ id: 'a', name: 'A', date: '2020-01-01' }],
              },
            },
          ],
        },
      ],
    });
    const scope = inferModifyScopeHeuristic('新增一个证书，PMP项目管理', summary);
    expect(scope?.scope).toBe('partial');
    expect(scope?.targets[0]?.moduleId).toBe('cert-1');
    expect(scope?.action).toBe('add');
  });

  it('validateInitModule allows multiple certificate items on new module', () => {
    const original = {
      type: 'certificate',
      id: 'cert-new',
      options: { title: '证书', items: [] },
    };
    const modified = {
      ...original,
      options: {
        title: '证书',
        items: [
          { name: '大学英语四级', date: '2020-06-01' },
          { name: '大学英语六级', date: '2021-06-01' },
        ],
      },
    };
    expect(validateInitModule(original, modified)).toBeNull();
  });

  it('appendModuleToResume adds module to first page', () => {
    const resume = {
      name: 't',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#000',
        backgroundColor: '#fff',
      },
      pages: [{ modules: [{ type: 'info1', id: '1', options: {} }] }],
    };
    const next = appendModuleToResume(resume, {
      type: 'certificate',
      id: 'cert-1',
      options: { title: '证书', items: [] },
    });
    expect(next.pages[0]!.modules).toHaveLength(2);
    expect(next.pages[0]!.modules[1]?.type).toBe('certificate');
  });

  it('inferAddModuleType returns null when certificate module exists', () => {
    const summary = buildResumeModuleSummary({
      pages: [{ modules: [{ type: 'certificate', id: 'c1', options: { title: '证书', items: [] } }] }],
    });
    expect(inferAddModuleType('新增一个证书模块', summary)).toBeNull();
  });

  it('validatePartialModule allows add one certificate item', () => {
    const original = {
      type: 'certificate',
      id: 'cert-1',
      options: {
        title: '证书',
        items: [
          { id: 'a', name: 'A', date: '2020-01-01' },
          { id: 'b', name: 'B', date: '2021-01-01' },
        ],
      },
    };
    const modified = {
      ...original,
      options: {
        ...original.options,
        items: [
          ...original.options.items,
          { name: 'PMP', date: '2024-06-01' },
        ],
      },
    };
    expect(validatePartialModule(original, modified, { action: 'add' })).toBeNull();
    expect(validatePartialModule(original, modified)).toBe('items 须为 2 条');
  });

  it('validatePartialModule allows remove items down to zero', () => {
    const original = {
      type: 'job',
      id: '2',
      options: {
        title: '工作经历',
        items: [
          { id: 'a', company: 'A' },
          { id: 'b', company: 'B' },
        ],
      },
    };
    const modified = {
      ...original,
      options: { ...original.options, items: [] },
    };
    expect(validatePartialModule(original, modified, { action: 'remove' })).toBeNull();
  });

  it('validatePartialModule allows remove multiple items', () => {
    const original = {
      type: 'certificate',
      id: 'cert-1',
      options: {
        title: '证书',
        items: [
          { id: 'a', name: 'A', date: '2020-01-01' },
          { id: 'b', name: 'B', date: '2021-01-01' },
          { id: 'c', name: 'C', date: '2022-01-01' },
        ],
      },
    };
    const modified = {
      ...original,
      options: {
        ...original.options,
        items: [{ id: 'a', name: 'A', date: '2020-01-01' }],
      },
    };
    expect(validatePartialModule(original, modified, { action: 'remove' })).toBeNull();
  });

  it('inferAddModuleType returns null for info1', () => {
    const summary = buildResumeModuleSummary({
      pages: [{ modules: [{ type: 'job', id: '1', options: { title: '工作', items: [] } }] }],
    });
    expect(inferAddModuleType('新增个人信息模块', summary)).toBeNull();
    expect(inferAddModuleType('新增一个基础信息模块', summary)).toBeNull();
  });

  it('validateInfo1ModuleChange rejects duplicate or removed info1', () => {
    const original = {
      pages: [{ modules: [{ type: 'info1', id: '1', options: {} }, { type: 'job', id: '2', options: {} }] }],
    };
    const dup = {
      pages: [{
        modules: [
          { type: 'info1', id: '1', options: {} },
          { type: 'info1', id: '2', options: {} },
        ],
      }],
    };
    const removed = { pages: [{ modules: [{ type: 'job', id: '2', options: {} }] }] };
    expect(validateInfo1ModuleChange(original, dup)).toBe('个人信息模块只能有 1 个');
    expect(validateInfo1ModuleChange(original, removed)).toBe('个人信息模块不可删除');
  });

  it('removeModuleFromResume blocks info1', () => {
    const resume = {
      name: 't',
      globalStyle: {
        pageSize: 'A4',
        fontSize: 13,
        lineHeight: 1.3,
        moduleMargin: 15,
        color: '#000',
        backgroundColor: '#fff',
      },
      pages: [{ modules: [{ type: 'info1', id: '1', options: {} }, { type: 'job', id: '2', options: {} }] }],
    };
    expect(() => removeModuleFromResume(resume, 0, 0)).toThrow('个人信息模块不可删除');
  });

  it('removeModuleFromResume removes module from page', () => {
    const next = removeModuleFromResume(resume, 0, 1);
    expect(next.pages[0].modules).toHaveLength(1);
    expect(next.pages[0].modules[0]?.id).toBe('1');
  });

  it('parseScopeOutput validates json', () => {
    const out = parseScopeOutput('{"scope":"partial","targets":[{"moduleId":"2"}],"scene":"work","action":"polish"}');
    expect(out.scope).toBe('partial');
    expect(out.targets[0]?.moduleId).toBe('2');
  });

  it('mergeModuleIntoResume patches single module', () => {
    const loc = locateModule(resume, '2');
    expect(loc).not.toBeNull();
    const next = mergeModuleIntoResume(resume, loc!.pageIndex, loc!.moduleIndex, {
      type: 'job',
      id: '2',
      options: { title: '工作', items: [{ company: 'B', description: '新描述' }] },
    });
    expect((next.pages[0].modules[1].options.items as { company: string }[])[0]?.company).toBe('B');
    expect(next.pages[0].modules[0].options.name).toBe('张三');
  });

  it('extractPostType reads intentPosts', () => {
    expect(extractPostType(resume)).toBe('前端工程师');
  });
});

describe('stripResumeAvatarForAi', () => {
  it('removes info1 avatar from payload', () => {
    const cfg = {
      name: 't',
      pages: [
        {
          modules: [
            { type: 'info1', id: '1', options: { name: 'a', avatar: 'data:image/png;base64,xxx' } },
          ],
        },
      ],
    };
    const out = stripResumeAvatarForAi(cfg);
    expect(out.pages[0].modules[0].options).toEqual({ name: 'a' });
    expect(cfg.pages[0].modules[0].options.avatar).toBe('data:image/png;base64,xxx');
  });
});

describe('modifyChat intent', () => {
  it('parseIntentOutput accepts valid json', () => {
    expect(parseIntentOutput('{"intent":"chat"}').intent).toBe('chat');
    expect(parseIntentOutput('```json\n{"intent":"modify_resume"}\n```').intent).toBe('modify_resume');
  });

  it('classifyModifyIntent returns chat for empty message without LLM', async () => {
    const intent = await classifyModifyIntent([], '');
    expect(intent).toBe('chat');
  });

  it('classifyIntentByRules negated polish consult → chat', () => {
    expect(classifyIntentByRules('不用帮我润色，我就想问问这个岗位怎么样')).toBe('chat');
    expect(classifyIntentByRules('别优化了，今天天气怎么样')).toBe('chat');
  });

  it('classifyIntentByRules partial negation with positive edit → modify_resume', () => {
    expect(classifyIntentByRules('不要改我的格式，只改错别字')).toBe('modify_resume');
    expect(classifyIntentByRules('不用润色，把第二段工作经历的日期改对')).toBe('modify_resume');
  });

  it('classifyIntentByRules clear modify → modify_resume', () => {
    expect(classifyIntentByRules('帮我润色一下')).toBe('modify_resume');
    expect(classifyIntentByRules('优化第一段工作经历')).toBe('modify_resume');
  });

  it('classifyIntentByRules no action keywords → null', () => {
    expect(classifyIntentByRules('给我讲个笑话')).toBe(null);
  });

  it('classifyModifyIntent uses rules without LLM for negated polish', async () => {
    const intent = await classifyModifyIntent([], '不用帮我润色，我就想问问这个岗位怎么样');
    expect(intent).toBe('chat');
  });
});

describe('linkAbortSignal', () => {
  it('aborts linked controller when parent aborts', async () => {
    const parent = new AbortController();
    const linked = linkAbortSignal(parent.signal);
    parent.abort();
    await new Promise((r) => setTimeout(r, 0));
    expect(linked.signal.aborted).toBe(true);
    expect(() => throwIfAborted(linked.signal)).toThrow();
  });
});

describe('extractStreamingMessage', () => {
  it('extracts partial message from streaming json', () => {
    expect(extractStreamingMessage('{"message":"你好')).toBe('你好');
    expect(extractStreamingMessage('{"message":"已优化\\n第二行')).toBe('已优化\n第二行');
  });

});

describe('buildModifyChatMessages', () => {
  it('wraps user message with role on server', () => {
    expect(buildModifyChatMessages('优化工作经历')).toEqual([
      { role: 'user', content: '优化工作经历' },
    ]);
  });

  it('merges history and keeps 4-round sliding window', () => {
    const history = Array.from({ length: 8 }, (_, i) => ({
      role: (i % 2 ? 'assistant' : 'user') as 'user' | 'assistant',
      content: `m${i}`,
    }));
    const out = buildModifyChatMessages('latest', history);
    expect(out).toHaveLength(8);
    expect(out[out.length - 1]).toEqual({ role: 'user', content: 'latest' });
    expect(out[0].content).toBe('m1');
  });
});

describe('modifyChat pipeline off-topic', () => {
  it('returns fixed hint without resume modify', async () => {
    vi.spyOn(intentRouter, 'classifyModifyIntent').mockResolvedValue('chat');
    let result: ModifyChatResult | null = null;
    await streamModifyChatPipeline(buildModifyChatMessages('给我讲个笑话'), undefined, (evt) => {
      if (evt.error || evt.code !== 0) throw new Error(evt.error ?? evt.message);
      if (evt.done) result = buildModifyChatResult(evt);
    });
    if (!result) throw new Error('模型返回为空');
    const out = result as ModifyChatResult;
    expect(out.intent).toBe('chat');
    expect(out.content).toBe(OFF_TOPIC_REPLY);
    expect(out.data[0]).toEqual({ type: 'text', content: OFF_TOPIC_REPLY });
    expect(out.resume).toBeUndefined();
  });
});

describe('modifyChat parse resume output', () => {
  it('parseResumeModifyOutput validates structure', () => {
    const raw = JSON.stringify({
      message: '已优化',
      resume: {
        name: '测试',
        globalStyle: {
          pageSize: 'A4',
          fontSize: 13,
          lineHeight: 1.3,
          moduleMargin: 15,
          color: '#000',
          backgroundColor: '#fff',
        },
        pages: [{ modules: [{ type: 'info1', id: '1', options: { name: '张三' } }] }],
      },
    });
    const out = parseResumeModifyOutput(raw);
    expect(out.message).toBe('已优化');
    expect(out.resume.name).toBe('测试');
  });
});

describe('modifyChat resume structure', () => {
  const original = {
    name: '原简历',
    globalStyle: {
      pageSize: 'A4',
      fontSize: 13,
      lineHeight: 1.3,
      moduleMargin: 15,
      color: '#000',
      backgroundColor: '#fff',
    },
    exportPages: [0],
    pages: [
      {
        modules: [
          { type: 'info1', id: '1', options: { name: '张三', avatar: 'data:image/png;base64,x' } },
          { type: 'job', id: '2', options: { title: '工作', items: [] } },
        ],
      },
    ],
  };

  it('validateResumeStructureMatch rejects missing modules', () => {
    const modified = {
      name: '原简历',
      globalStyle: original.globalStyle,
      pages: [{ modules: [{ type: 'info1', id: '1', options: { name: '李四' } }] }],
    };
    expect(validateResumeStructureMatch(original, modified as ResumeConfig)).toBeNull();
  });

  it('validateResumeStructureMatch rejects unknown module id', () => {
    const modified = {
      name: '原简历',
      globalStyle: original.globalStyle,
      pages: [
        {
          modules: [
            { type: 'info1', id: '1', options: { name: '李四' } },
            { type: 'job', id: 'unknown', options: { title: '工作', items: [] } },
          ],
        },
      ],
    };
    expect(validateResumeStructureMatch(original, modified as ResumeConfig)).toMatch(/须为 2/);
  });

  it('validateResumeStructureMatch rejects extra modules', () => {
    const modified = {
      name: '原简历',
      globalStyle: original.globalStyle,
      pages: [
        {
          modules: [
            { type: 'info1', id: '1', options: { name: '张三' } },
            { type: 'job', id: '2', options: { title: '工作', items: [] } },
            { type: 'skill', id: '3', options: { title: '技能', description: 'x' } },
          ],
        },
      ],
    };
    expect(validateResumeStructureMatch(original, modified as ResumeConfig)).toMatch(/不能超过/);
  });

  it('finalizeModifiedResume preserves avatar and exportPages', () => {
    const modified = {
      name: '新标题',
      globalStyle: original.globalStyle,
      pages: [
        {
          modules: [
            { type: 'info1', id: '1', options: { name: '李四' } },
            { type: 'job', id: '2', options: { title: '工作', items: [{ company: 'A' }] } },
          ],
        },
      ],
    };
    const out = finalizeModifiedResume(original, modified as ResumeConfig);
    expect(out.name).toBe('新标题');
    expect(out.exportPages).toEqual([0]);
    expect(out.pages[0].modules[0].options.avatar).toBe('data:image/png;base64,x');
    expect(out.pages[0].modules[0].options.name).toBe('李四');
  });
});

describe('modifyChat security', () => {
  it('sanitizeResumeHtmlFields strips script from description', () => {
    const resume = {
      name: 't',
      pages: [
        {
          modules: [
            {
              type: 'other',
              id: '1',
              options: { title: '优势', description: '<p>ok</p><script>alert(1)</script>' },
            },
            {
              type: 'job',
              id: '2',
              options: {
                title: '工作',
                items: [{ company: 'A', description: '<p>x</p><script>evil()</script>' }],
              },
            },
          ],
        },
      ],
    };
    const out = sanitizeResumeHtmlFields(resume);
    const skill = out.pages[0]!.modules[0]!;
    const job = out.pages[0]!.modules[1]!;
    expect(skill.options!.description).not.toContain('<script');
    expect(skill.options!.description).toContain('<p>ok</p>');
    expect((job.options!.items as Record<string, unknown>[])[0]!.description).not.toContain('<script');
    expect((job.options!.items as Record<string, unknown>[])[0]!.description).toContain('<p>x</p>');
    expect(skill.options!.title).toBe('优势');
  });

  it('getModifyChatBodySizeError returns error when too large', () => {
    const big = 'x'.repeat(600 * 1024);
    expect(getModifyChatBodySizeError({ message: 'hi', resume: { data: big } })).toMatch(/请求体过大/);
    expect(getModifyChatBodySizeError({ message: 'hi' }, { resume: { data: big } })).toMatch(/简历数据过大/);
    expect(getModifyChatBodySizeError({ message: 'ok', resume: { name: 't' } })).toBeNull();
  });

  it('prompt templates contain PROMPT_INJECTION_GUARD', async () => {
    const { INTENT_ROUTER_SYSTEM, SCOPE_ROUTER_SYSTEM, RESUME_MODIFY_SYSTEM, PARTIAL_MODIFY_SYSTEM } =
      await import('@/lib/ai/modifyChat/prompt');
    for (const tpl of [INTENT_ROUTER_SYSTEM, SCOPE_ROUTER_SYSTEM, RESUME_MODIFY_SYSTEM, PARTIAL_MODIFY_SYSTEM]) {
      expect(tpl).toContain(PROMPT_INJECTION_GUARD);
    }
  });
});
