import type { OptimizeScene } from '@/lib/ai/ragResume/types';

/** 与富文本编辑器工具栏一致：加粗/斜体/下划线/删除线/颜色/链接/有序与无序列表 */
export const RICH_TEXT_ALLOWED_TAGS_PROMPT =
  '仅允许 HTML 标签：<b>、<i>、<u>、<s>、<p>、<ul>、<ol>、<li>、<a href="…">、<span style="color:…">；禁止 <script>、<style>、<iframe> 及其他标签。颜色只用 style="color:…"，勿用 background；链接须带合法 http(s) href';

export const RICH_TEXT_LAYOUT_PROMPT =
  '排版与原文一致：原文是段落则仍用 <p>；无序列表用 <ul><li>，有序列表用 <ol><li>；勿强行把段落改成列表或把列表拆成段落。原文已有加粗/斜体/下划线/删除线/颜色/链接时尽量保留同类标记';

/** description 字段润色：勿把表单元数据写进正文 */
export const RICH_TEXT_BODY_ONLY_PROMPT =
  '只改写 description 正文，禁止在结果中重复公司名、职位、部门、城市、时间、项目名、角色、学校、专业、学位、模块标题等已在表单单独填写的字段；不要输出「项目名称：」「担任角色：」等前缀';

const EMPHASIS =
  '岗位关键词、核心能力用 <b> 加粗，技术栈/工具用 <i> 斜体，量化数据用 <u> 下划线；可按需用 <s> 删除线、<span style="color:#0e9c8d"> 标色、<a href> 外链；步骤用 <ol>，要点用 <ul>';

const STAR_WORK = `用 STAR 法则重构描述：业务背景/目标 → 核心职责与关键动作 → 量化成果与业务价值。
${RICH_TEXT_LAYOUT_PROMPT}
${EMPHASIS}。
语言简洁专业，替换「参与/协助」等模糊词为「负责/主导/搭建/优化」等动作词。`;

const STAR_PROJECT = `用 STAR 结构：项目背景 → 个人任务 → 执行动作 → 最终成果。
${RICH_TEXT_LAYOUT_PROMPT}
关键贡献、岗位能力用 <b> 加粗，技术栈用 <i> 斜体，量化成果用 <u> 下划线；可按需用 <s>、<span style="color:#…">、<a href>、<ol>/<ul>。
突出个人贡献，保留事实、不编造经历。`;

const STAR_SKILL = `技能描述按「核心技能/编程语言/工具框架/软技能」等维度整理，匹配目标岗位关键词。
${RICH_TEXT_LAYOUT_PROMPT}
核心技能、岗位高频词用 <b> 加粗，工具/框架用 <i> 斜体，熟练度或成果用 <u> 下划线；可按需用列表与颜色强调。`;

const STAR_EDUCATION = `在校经历/教育描述突出：专业课程、竞赛项目、实习、成果与岗位相关能力。
${RICH_TEXT_LAYOUT_PROMPT}
专业关键词、岗位相关能力用 <b> 加粗，工具/技能用 <i> 斜体，成果用 <u> 下划线；可按需用列表与链接。`;

const STAR_OTHER = `自定义模块（如个人优势）描述突出与目标岗位匹配的能力与成果。
${RICH_TEXT_LAYOUT_PROMPT}
关键词用 <b> 加粗，技能/工具用 <i> 斜体，量化成果用 <u> 下划线；可按需用列表、颜色与链接。`;

const SCENE_STAR: Record<OptimizeScene, string> = {
  work: STAR_WORK,
  project: STAR_PROJECT,
  skill: STAR_SKILL,
};

export function descriptionPolishRulesForScene(scene: OptimizeScene | null): string {
  const star = scene ? SCENE_STAR[scene] : STAR_OTHER;
  return `${RICH_TEXT_ALLOWED_TAGS_PROMPT}\n${RICH_TEXT_BODY_ONLY_PROMPT}\n${star}`;
}

export const MODIFY_CHAT_DESCRIPTION_RULES = `润色/优化 description 等富文本字段时：
1. ${RICH_TEXT_ALLOWED_TAGS_PROMPT}
2. ${RICH_TEXT_BODY_ONLY_PROMPT}
3. 工作经历 items[].description：${STAR_WORK}
4. 项目经历 items[].description：${STAR_PROJECT}
5. 技能模块 options.description 或 items：${STAR_SKILL}
6. 教育经历 items[].description：${STAR_EDUCATION}
7. other 等模块 options.description：${STAR_OTHER}
8. 只返回可直接渲染的 HTML，保留事实、严禁虚构数据。`;
