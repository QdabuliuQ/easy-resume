import { postBigmodelChatCompletionsStream } from '@/api/bigmodelChat';
import { sanitizeRichTextHtml, unwrapFencedHtml } from '@/utils/sanitizeHtml';

const SYSTEM_PROMPT =
  '你是资深HR与简历优化专家，负责对用户的教育经历进行专业改写。只按用户消息中的规则与信息输出，禁止额外闲聊。';

function buildUserPrompt(p: {
  school: string;
  degree: string;
  major: string;
  city: string;
  schoolTypeTags: string;
  academy: string;
  studyTime: string;
  rawDescriptionPlain: string;
  intentPosts: string;
}) {
  return (
    '严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：\n\n' +
    '【用户输入的教育经历信息】\n' +
    `学校名称：${p.school || '未填写'}\n` +
    `学位：${p.degree || '未填写'}\n` +
    `专业：${p.major || '未填写'}\n` +
    `所在城市：${p.city || '未填写'}\n` +
    `学校类型：${p.schoolTypeTags || '未填写'}\n` +
    `学院：${p.academy || '未填写'}\n` +
    `在读时间：${p.studyTime || '未填写'}\n` +
    `在校经历原始描述：${p.rawDescriptionPlain || '未填写'}\n` +
    `目标岗位：${p.intentPosts || '未填写'}\n\n` +
    '【输出规则】\n' +
    '1. 只返回优化后的在校经历HTML富文本，不做分析、不写多余说明；\n' +
    '2. 仅允许使用以下HTML标签：<b>、<i>、<u>、<ul>、<li>，禁止其他标签；\n' +
    '3. 必须用<ul>无序列表 + <li>结构化展示，禁止使用<ol>有序列表；\n' +
    '4. 内容优先突出：专业核心课程、相关技能、在校项目/竞赛/实习、成果与能力，匹配目标岗位需求；\n' +
    '5. 关键专业关键词、岗位相关能力、成果数据用<b>加粗，专业工具/技能用<i>斜体，量化成果用<u>下划线；\n' +
    '6. 保留所有事实，不编造经历，替换模糊表述为具体、有价值的动作和成果；\n' +
    '7. 每一条<li>控制在1-2行，语言简洁专业，适配ATS筛选。\n\n' +
    '【输出格式参考】\n' +
    '<ul>\n' +
    '  <li><b>专业学习：</b>主修<b>计算机科学与技术</b>核心课程，掌握<i>数据结构、算法、数据库原理</i>等专业知识</li>\n' +
    '  <li><b>项目/竞赛：</b>参与校级Web开发项目，使用<i>HTML、CSS、JavaScript</i>完成前端页面搭建，提升工程实践能力</li>\n' +
    '  <li><b>技能成果：</b>熟练掌握前端开发相关技能，能独立完成页面开发与调试，支撑岗位相关工作需求</li>\n' +
    '</ul>'
  );
}

export async function polishEducationDescriptionWithBigmodel(
  p: {
    school: string;
    degree: string;
    major: string;
    city: string;
    schoolTypeTags: string;
    academy: string;
    studyTime: string;
    richTextHtml: string;
    intentPosts: string;
  },
  onStreamingHtml?: (htmlSoFar: string) => void
): Promise<string> {
  const rawDescriptionPlain = p.richTextHtml
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  let acc = '';
  const raw = await postBigmodelChatCompletionsStream(
    {
      model: 'GLM-4.7-Flash',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildUserPrompt({
            school: p.school,
            degree: p.degree,
            major: p.major,
            city: p.city,
            schoolTypeTags: p.schoolTypeTags,
            academy: p.academy,
            studyTime: p.studyTime,
            rawDescriptionPlain,
            intentPosts: p.intentPosts,
          }),
        },
      ],
      stream: true,
      temperature: 1,
    },
    (piece) => {
      acc += piece;
      onStreamingHtml?.(acc);
    }
  );
  const html = unwrapFencedHtml(raw);
  return sanitizeRichTextHtml(html);
}
