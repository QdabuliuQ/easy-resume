import { ChatPromptTemplate } from '@langchain/core/prompts';
import {
  RICH_TEXT_ALLOWED_TAGS_PROMPT,
  RICH_TEXT_LAYOUT_PROMPT,
} from '@/lib/ai/descriptionFormat';
import type { PolishType } from '@/lib/ai/polish/types';

const POLISH_TAG_RULES = `2. ${RICH_TEXT_ALLOWED_TAGS_PROMPT}；
3. ${RICH_TEXT_LAYOUT_PROMPT}；`;

const JOB_SYSTEM =
  '你是资深HR与简历优化专家，负责对用户的工作经历进行专业改写。只按用户消息中的规则与信息输出，禁止额外闲聊。';

const JOB_HUMAN = `严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：

【用户输入的工作经历信息】
公司名称：{company}
工作时间：{time}
职位/部门：{postDepartment}
工作城市：{city}
原始工作描述：{rawDescriptionPlain}
目标岗位：{intentPosts}

【输出规则】
1. 只返回优化后的工作描述HTML富文本，不做分析、不写多余说明；
${POLISH_TAG_RULES}
4. 用STAR法则重构内容，突出：业务背景/目标 → 你的核心职责与关键动作 → 量化成果与业务价值；
5. 关键岗位关键词、技术栈、核心能力用<b>加粗，技术栈/工具用<i>斜体，量化数据用<u>下划线；
6. 保留所有事实，不编造经历，替换模糊表述（如“参与/协助”）为具体动作词（如“负责/主导/搭建/优化”）；
7. 语言简洁专业，适配ATS筛选。`;

const PROJECT_SYSTEM =
  '你是资深HR简历优化专家，专门优化简历项目经历。只返回优化后的项目描述HTML富文本，不做多余分析。';

const PROJECT_HUMAN = `【输入信息】
项目名称：{projectName}
本人角色：{role}
项目原文：{rawDescriptionPlain}
目标岗位：{intentPosts}

【输出要求】
1. ${RICH_TEXT_ALLOWED_TAGS_PROMPT}；
2. ${RICH_TEXT_LAYOUT_PROMPT}；
3. 突出：项目背景/目标、你的核心职责、关键动作、量化成果与业务价值；
4. 保留事实、不编造经历，使用STAR逻辑，替换模糊表述为具体动作词；
5. 对核心关键词（如技术栈、岗位能力、量化成果）用<b>加粗，技术栈用<i>斜体，量化数据用<u>下划线。`;

const EDUCATION_SYSTEM =
  '你是资深HR与简历优化专家，负责对用户的教育经历进行专业改写。只按用户消息中的规则与信息输出，禁止额外闲聊。';

const EDUCATION_HUMAN = `严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：

【用户输入的教育经历信息】
学校名称：{school}
学位：{degree}
专业：{major}
所在城市：{city}
学校类型：{schoolTypeTags}
学院：{academy}
在读时间：{studyTime}
在校经历原始描述：{rawDescriptionPlain}
目标岗位：{intentPosts}

【输出规则】
1. 只返回优化后的在校经历HTML富文本，不做分析、不写多余说明；
${POLISH_TAG_RULES}
4. 内容优先突出：专业核心课程、相关技能、在校项目/竞赛/实习、成果与能力，匹配目标岗位需求；
5. 关键专业关键词、岗位相关能力、成果数据用<b>加粗，专业工具/技能用<i>斜体，量化成果用<u>下划线；
6. 保留所有事实，不编造经历，替换模糊表述为具体、有价值的动作和成果；
7. 语言简洁专业，适配ATS筛选。`;

const SKILL_SYSTEM =
  '你是资深HR与简历优化专家，负责对用户的技能描述进行专业改写。只按用户消息中的规则与信息输出，禁止额外闲聊。';

const SKILL_HUMAN = `严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：

【用户输入信息】
原始技能描述：{rawDescriptionPlain}
目标岗位：{intentPosts}

【输出规则】
1. 只返回优化后的技能模块HTML富文本，不做分析、不写多余说明；
${POLISH_TAG_RULES}
4. 按「核心技能/编程语言/工具框架/软技能」等维度整理，匹配目标岗位JD关键词；
5. 核心技能、岗位高频关键词用<b>加粗，工具/框架用<i>斜体，熟练度/成果用<u>下划线；
6. 保留所有事实，不编造技能，语言简洁专业，适配ATS筛选。`;

const OTHER_SYSTEM =
  '你是资深HR与简历优化专家，负责对用户的个人优势、自我评价等模块描述进行专业改写。只按用户消息中的规则与信息输出，禁止额外闲聊。';

const OTHER_HUMAN = `严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：

【用户输入信息】
模块名称：{moduleTitle}
原始描述：{rawDescriptionPlain}
目标岗位：{intentPosts}

【输出规则】
1. 只返回优化后的模块描述HTML富文本，不做分析、不写多余说明；
${POLISH_TAG_RULES}
4. 突出与目标岗位匹配的核心优势、能力与代表性成果，匹配JD关键词；
5. 核心优势、岗位关键词用<b>加粗，技能/工具用<i>斜体，量化成果用<u>下划线；
6. 保留所有事实，不编造经历，语言简洁专业，适配ATS筛选。`;

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
