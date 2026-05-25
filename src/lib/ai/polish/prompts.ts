import { ChatPromptTemplate } from '@langchain/core/prompts';
import type { PolishType } from '@/lib/ai/polish/types';

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
2. 仅允许使用以下HTML标签：<b>、<i>、<u>、<ul>、<li>，禁止其他标签；
3. 必须用<ul>无序列表 + <li>结构化展示，禁止使用<ol>有序列表；
4. 用STAR法则重构内容，突出：业务背景/目标 → 你的核心职责与关键动作 → 量化成果与业务价值；
5. 关键岗位关键词、技术栈、核心能力用<b>加粗，技术栈/工具用<i>斜体，量化数据用<u>下划线；
6. 保留所有事实，不编造经历，替换模糊表述（如“参与/协助”）为具体动作词（如“负责/主导/搭建/优化”）；
7. 每一条<li>控制在1-2行，语言简洁专业，适配ATS筛选。

【输出格式参考】
<ul>
  <li><b>业务背景：</b>为支撑公司XX业务增长，负责XX模块的全流程开发与优化</li>
  <li><b>核心职责：</b>作为<b>前端开发工程师</b>，使用 <i>Vue3 + TypeScript</i> 完成XX功能开发与维护</li>
  <li><b>关键动作：</b>主导XX页面性能优化，重构组件逻辑，解决XX线上问题</li>
  <li><b>项目成果：</b>页面加载速度提升<u>35%</u>，用户操作响应时间缩短<u>40%</u>，支撑业务月活提升</li>
</ul>`;

const PROJECT_SYSTEM =
  '你是资深HR简历优化专家，专门优化简历项目经历。输出严格要求：1.只返回优化后的项目描述HTML富文本；2.仅允许使用标签b、i、u、s、ol、ul；3.用ul li结构化展示，关键内容用b加粗，技术栈用i斜体，量化数据用u下划线；4.不做多余分析，只返回可直接渲染的HTML。';

const PROJECT_HUMAN = `【输入信息】
项目名称：{projectName}
本人角色：{role}
项目原文：{rawDescriptionPlain}
目标岗位：{intentPosts}

【输出要求】
1.  突出：项目背景/目标、你的核心职责、关键动作、量化成果与业务价值。
2.  保留事实、不编造经历，使用STAR逻辑，替换模糊表述为具体动作词。
3.  对核心关键词（如技术栈、岗位能力、量化成果）用\`<b>\`加粗，不使用其他样式。

【示例输出格式参考】
<ul>
  <li><b>项目背景：</b>为解决企业内部审批流程效率低下问题，主导搭建OA自动化管理系统</li>
  <li><b>技术实现：</b>使用 <i>Vue3 + Element Plus</i> 开发前端页面，对接后端接口完成全流程联调</li>
  <li><b>优化成果：</b>优化请求逻辑与渲染性能，页面加载速度提升<u>30%</u>，用户反馈满意度显著提高</li>
</ul>`;

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
2. 仅允许使用以下HTML标签：<b>、<i>、<u>、<ul>、<li>，禁止其他标签；
3. 必须用<ul>无序列表 + <li>结构化展示，禁止使用<ol>有序列表；
4. 内容优先突出：专业核心课程、相关技能、在校项目/竞赛/实习、成果与能力，匹配目标岗位需求；
5. 关键专业关键词、岗位相关能力、成果数据用<b>加粗，专业工具/技能用<i>斜体，量化成果用<u>下划线；
6. 保留所有事实，不编造经历，替换模糊表述为具体、有价值的动作和成果；
7. 每一条<li>控制在1-2行，语言简洁专业，适配ATS筛选。

【输出格式参考】
<ul>
  <li><b>专业学习：</b>主修<b>计算机科学与技术</b>核心课程，掌握<i>数据结构、算法、数据库原理</i>等专业知识</li>
  <li><b>项目/竞赛：</b>参与校级Web开发项目，使用<i>HTML、CSS、JavaScript</i>完成前端页面搭建，提升工程实践能力</li>
  <li><b>技能成果：</b>熟练掌握前端开发相关技能，能独立完成页面开发与调试，支撑岗位相关工作需求</li>
</ul>`;

const SKILL_SYSTEM =
  '你是资深HR与简历优化专家，负责对用户的技能描述进行专业改写。只按用户消息中的规则与信息输出，禁止额外闲聊。';

const SKILL_HUMAN = `严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：

【用户输入信息】
原始技能描述：{rawDescriptionPlain}
目标岗位：{intentPosts}

【输出规则】
1. 只返回优化后的技能模块HTML富文本，不做分析、不写多余说明；
2. 仅允许使用以下HTML标签：<b>、<i>、<u>、<ul>、<li>，禁止其他标签；
3. 必须用<ul>无序列表 + <li>结构化展示，禁止使用<ol>有序列表；
4. 按「核心技能/编程语言/工具框架/软技能」分类整理，匹配目标岗位JD关键词；
5. 核心技能、岗位高频关键词用<b>加粗，工具/框架用<i>斜体，熟练度/成果用<u>下划线；
6. 保留所有事实，不编造技能，语言简洁专业，适配ATS筛选；
7. 每条<li>控制在1行，重点突出，不堆砌无关内容。

【输出格式参考】
<ul>
  <li><b>前端开发：</b>熟练掌握 <i>HTML/CSS/JavaScript</i>，熟悉 <i>Vue3/React</i> 框架，了解前端工程化与性能优化</li>
  <li><b>版本控制：</b>熟练使用 <i>Git</i> 进行团队协作开发与版本管理</li>
  <li><b>软技能：</b>具备良好的需求理解与沟通能力，能快速响应业务需求并独立完成开发任务</li>
</ul>`;

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
};

export function getPolishPrompt(type: PolishType): ChatPromptTemplate {
  return polishPrompts[type];
}
