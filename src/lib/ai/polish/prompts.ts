import { ChatPromptTemplate } from '@langchain/core/prompts';
import {
  RICH_TEXT_ALLOWED_TAGS_PROMPT,
  RICH_TEXT_LAYOUT_PROMPT,
} from '@/lib/ai/descriptionFormat';
import type { PolishType } from '@/lib/ai/polish/types';

/** 元数据仅供理解上下文，禁止写进润色结果 */
const OUTPUT_BODY_ONLY =
  '只输出「描述/正文」的优化 HTML，禁止重复写入上方已单独填写的字段（如公司名、职位、部门、城市、时间、项目名、角色、学校、专业、学位、模块标题等）；不要输出标题行、字段标签或「项目名称：xxx」「担任角色：xxx」这类前缀；若原文开头已重复这些表单字段，润色时删掉重复部分，只保留真正的描述正文';

const POLISH_TAG_RULES = `2. ${RICH_TEXT_ALLOWED_TAGS_PROMPT}；
3. ${RICH_TEXT_LAYOUT_PROMPT}；
4. ${OUTPUT_BODY_ONLY}；`;

const JOB_SYSTEM =
  '你是资深HR与简历优化专家，只改写工作描述正文。公司/职位/时间等已在表单中填写，结果中不要再写这些字段。';

const JOB_HUMAN = `严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：

【上下文（仅供理解，禁止写入输出）】
公司名称：{company}
工作时间：{time}
职位/部门：{postDepartment}
工作城市：{city}
目标岗位：{intentPosts}

【待润色的工作描述正文】
{rawDescriptionPlain}

【输出规则】
1. 只返回优化后的工作描述 HTML 富文本，不做分析、不写多余说明；
${POLISH_TAG_RULES}
5. 用 STAR 法则重构正文：业务背景/目标 → 核心职责与关键动作 → 量化成果与业务价值；
6. 关键岗位关键词、技术栈、核心能力用<b>加粗，技术栈/工具用<i>斜体，量化数据用<u>下划线；可按需用<s>删除线、<span style="color:#…">标色、<a href>链接、<ol>/<ul>列表；
7. 保留所有事实，不编造经历，替换模糊表述（如“参与/协助”）为具体动作词（如“负责/主导/搭建/优化”）；
8. 语言简洁专业，适配 ATS 筛选。`;

const PROJECT_SYSTEM =
  '你是资深HR简历优化专家，只改写项目描述正文。项目名称、角色、时间等已在表单中填写，结果中不要再写这些字段。';

const PROJECT_HUMAN = `【上下文（仅供理解，禁止写入输出）】
项目名称：{projectName}
本人角色：{role}
目标岗位：{intentPosts}

【待润色的项目描述正文】
{rawDescriptionPlain}

【输出要求】
1. ${RICH_TEXT_ALLOWED_TAGS_PROMPT}；
2. ${RICH_TEXT_LAYOUT_PROMPT}；
3. ${OUTPUT_BODY_ONLY}；
4. 突出：项目背景/目标、你的核心职责、关键动作、量化成果与业务价值（写在正文里，不要单独再写「项目名称」「担任角色」）；
5. 保留事实、不编造经历，使用 STAR 逻辑，替换模糊表述为具体动作词；
6. 对核心关键词（如技术栈、岗位能力、量化成果）用<b>加粗，技术栈用<i>斜体，量化数据用<u>下划线；可按需用<s>、<span style="color:#…">、<a href>、<ol>/<ul>。`;

const EDUCATION_SYSTEM =
  '你是资深HR与简历优化专家，只改写在校经历/教育描述正文。学校、专业、学位、时间等已在表单中填写，结果中不要再写这些字段。';

const EDUCATION_HUMAN = `严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：

【上下文（仅供理解，禁止写入输出）】
学校名称：{school}
学位：{degree}
专业：{major}
所在城市：{city}
学校类型：{schoolTypeTags}
学院：{academy}
在读时间：{studyTime}
目标岗位：{intentPosts}

【待润色的在校经历正文】
{rawDescriptionPlain}

【输出规则】
1. 只返回优化后的在校经历 HTML 富文本，不做分析、不写多余说明；
${POLISH_TAG_RULES}
5. 内容优先突出：专业核心课程、相关技能、在校项目/竞赛/实习、成果与能力，匹配目标岗位需求；
6. 关键专业关键词、岗位相关能力、成果数据用<b>加粗，专业工具/技能用<i>斜体，量化成果用<u>下划线；可按需用<s>、<span style="color:#…">、<a href>、<ol>/<ul>；
7. 保留所有事实，不编造经历，替换模糊表述为具体、有价值的动作和成果；
8. 语言简洁专业，适配 ATS 筛选。`;

const SKILL_SYSTEM =
  '你是资深HR与简历优化专家，只改写技能描述正文，禁止额外闲聊。';

const SKILL_HUMAN = `严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：

【上下文（仅供理解，禁止写入输出）】
目标岗位：{intentPosts}

【待润色的技能描述正文】
{rawDescriptionPlain}

【输出规则】
1. 只返回优化后的技能模块 HTML 富文本，不做分析、不写多余说明；
${POLISH_TAG_RULES}
5. 按「核心技能/编程语言/工具框架/软技能」等维度整理，匹配目标岗位 JD 关键词；
6. 核心技能、岗位高频关键词用<b>加粗，工具/框架用<i>斜体，熟练度/成果用<u>下划线；可按需用列表、颜色与链接；
7. 保留所有事实，不编造技能，语言简洁专业，适配 ATS 筛选。`;

const OTHER_SYSTEM =
  '你是资深HR与简历优化专家，只改写模块描述正文。模块标题已在表单中填写，结果中不要再写标题。';

const OTHER_HUMAN = `严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：

【上下文（仅供理解，禁止写入输出）】
模块名称：{moduleTitle}
目标岗位：{intentPosts}

【待润色的模块描述正文】
{rawDescriptionPlain}

【输出规则】
1. 只返回优化后的模块描述 HTML 富文本，不做分析、不写多余说明；
${POLISH_TAG_RULES}
5. 突出与目标岗位匹配的核心优势、能力与代表性成果，匹配 JD 关键词；
6. 核心优势、岗位关键词用<b>加粗，技能/工具用<i>斜体，量化成果用<u>下划线；可按需用列表、颜色与链接；
7. 保留所有事实，不编造经历，语言简洁专业，适配 ATS 筛选。`;

const polishPrompts: Record<PolishType, ChatPromptTemplate> = {
  job: ChatPromptTemplate.fromMessages([
    ['system', JOB_SYSTEM],
    ['human', JOB_HUMAN],
  ]),
  project: ChatPromptTemplate.fromMessages([
    ['system', PROJECT_SYSTEM],
    ['human', PROJECT_HUMAN],
  ]),
  education: ChatPromptTemplate.fromMessages([
    ['system', EDUCATION_SYSTEM],
    ['human', EDUCATION_HUMAN],
  ]),
  skill: ChatPromptTemplate.fromMessages([
    ['system', SKILL_SYSTEM],
    ['human', SKILL_HUMAN],
  ]),
  other: ChatPromptTemplate.fromMessages([
    ['system', OTHER_SYSTEM],
    ['human', OTHER_HUMAN],
  ]),
};

export function getPolishPrompt(type: PolishType): ChatPromptTemplate {
  return polishPrompts[type];
}
