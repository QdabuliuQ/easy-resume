import type { OptimizeScene } from '@/lib/ai/ragResume/types';

/** 与面板 AI 润色、富文本编辑器一致的可输出标签 */
export const RICH_TEXT_ALLOWED_TAGS_PROMPT =
  '仅允许 HTML 标签：<b>、<i>、<u>、<p>、<ul>、<li>；禁止 <ol>、<script>、<style> 及其他标签';

export const RICH_TEXT_LAYOUT_PROMPT =
  '排版与原文一致：原文是段落则仍用 <p>，原文是列表则用 <ul><li>；勿强行把段落改成列表或把列表拆成段落';

const STAR_WORK = `用 STAR 法则重构描述：业务背景/目标 → 核心职责与关键动作 → 量化成果与业务价值。
${RICH_TEXT_LAYOUT_PROMPT}
岗位关键词、核心能力用 <b> 加粗，技术栈/工具用 <i> 斜体，量化数据用 <u> 下划线。
语言简洁专业，替换「参与/协助」等模糊词为「负责/主导/搭建/优化」等动作词。`;

const STAR_PROJECT = `用 STAR 结构：项目背景 → 个人任务 → 执行动作 → 最终成果。
${RICH_TEXT_LAYOUT_PROMPT}
关键贡献、岗位能力用 <b> 加粗，技术栈用 <i> 斜体，量化成果用 <u> 下划线。
突出个人贡献，保留事实、不编造经历。`;

const STAR_SKILL = `技能描述按「核心技能/编程语言/工具框架/软技能」等维度整理，匹配目标岗位关键词。
${RICH_TEXT_LAYOUT_PROMPT}
核心技能、岗位高频词用 <b> 加粗，工具/框架用 <i> 斜体，熟练度或成果用 <u> 下划线。`;

const STAR_EDUCATION = `在校经历/教育描述突出：专业课程、竞赛项目、实习、成果与岗位相关能力。
${RICH_TEXT_LAYOUT_PROMPT}
专业关键词、岗位相关能力用 <b> 加粗，工具/技能用 <i> 斜体，成果用 <u> 下划线。`;

const STAR_OTHER = `自定义模块（如个人优势）描述突出与目标岗位匹配的能力与成果。
${RICH_TEXT_LAYOUT_PROMPT}
关键词用 <b> 加粗，技能/工具用 <i> 斜体，量化成果用 <u> 下划线。`;

const SCENE_STAR: Record<OptimizeScene, string> = {
  work: STAR_WORK,
  project: STAR_PROJECT,
  skill: STAR_SKILL,
};

export function descriptionPolishRulesForScene(scene: OptimizeScene | null): string {
  const star = scene ? SCENE_STAR[scene] : STAR_OTHER;
  return `${RICH_TEXT_ALLOWED_TAGS_PROMPT}\n${star}`;
}

export const MODIFY_CHAT_DESCRIPTION_RULES = `润色/优化 description 等富文本字段时：
1. ${RICH_TEXT_ALLOWED_TAGS_PROMPT}
2. 工作经历 items[].description：${STAR_WORK}
3. 项目经历 items[].description：${STAR_PROJECT}
4. 技能模块 options.description 或 items：${STAR_SKILL}
5. 教育经历 items[].description：${STAR_EDUCATION}
6. other 等模块 options.description：${STAR_OTHER}
7. 只返回可直接渲染的 HTML，保留事实、严禁虚构数据。`;
