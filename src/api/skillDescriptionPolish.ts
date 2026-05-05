import { postBigmodelChatCompletionsStream } from '@/api/bigmodelChat';
import { sanitizeRichTextHtml, unwrapFencedHtml } from '@/utils/sanitizeHtml';

const SYSTEM_PROMPT =
  '你是资深HR与简历优化专家，负责对用户的技能描述进行专业改写。只按用户消息中的规则与信息输出，禁止额外闲聊。';

function buildUserPrompt(p: {
  rawDescriptionPlain: string;
  intentPosts: string;
}) {
  return (
    '严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：\n\n' +
    '【用户输入信息】\n' +
    `原始技能描述：${p.rawDescriptionPlain || '未填写'}\n` +
    `目标岗位：${p.intentPosts || '未填写'}\n\n` +
    '【输出规则】\n' +
    '1. 只返回优化后的技能模块HTML富文本，不做分析、不写多余说明；\n' +
    '2. 仅允许使用以下HTML标签：<b>、<i>、<u>、<ul>、<li>，禁止其他标签；\n' +
    '3. 必须用<ul>无序列表 + <li>结构化展示，禁止使用<ol>有序列表；\n' +
    '4. 按「核心技能/编程语言/工具框架/软技能」分类整理，匹配目标岗位JD关键词；\n' +
    '5. 核心技能、岗位高频关键词用<b>加粗，工具/框架用<i>斜体，熟练度/成果用<u>下划线；\n' +
    '6. 保留所有事实，不编造技能，语言简洁专业，适配ATS筛选；\n' +
    '7. 每条<li>控制在1行，重点突出，不堆砌无关内容。\n\n' +
    '【输出格式参考】\n' +
    '<ul>\n' +
    '  <li><b>前端开发：</b>熟练掌握 <i>HTML/CSS/JavaScript</i>，熟悉 <i>Vue3/React</i> 框架，了解前端工程化与性能优化</li>\n' +
    '  <li><b>版本控制：</b>熟练使用 <i>Git</i> 进行团队协作开发与版本管理</li>\n' +
    '  <li><b>软技能：</b>具备良好的需求理解与沟通能力，能快速响应业务需求并独立完成开发任务</li>\n' +
    '</ul>'
  );
}

export async function polishSkillDescriptionWithBigmodel(
  p: { richTextHtml: string; intentPosts: string },
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
