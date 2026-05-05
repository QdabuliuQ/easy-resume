import { postBigmodelChatCompletionsStream } from '@/api/bigmodelChat';
import { sanitizeRichTextHtml, unwrapFencedHtml } from '@/utils/sanitizeHtml';

const SYSTEM_PROMPT =
  '你是资深HR与简历优化专家，负责对用户的工作经历进行专业改写。只按用户消息中的规则与信息输出，禁止额外闲聊。';

function buildUserPrompt(p: {
  company: string;
  time: string;
  postDepartment: string;
  city: string;
  rawDescriptionPlain: string;
  intentPosts: string;
}) {
  return (
    '严格按照以下规则输出，禁止额外闲聊、禁止添加无关内容：\n\n' +
    '【用户输入的工作经历信息】\n' +
    `公司名称：${p.company || '未填写'}\n` +
    `工作时间：${p.time || '未填写'}\n` +
    `职位/部门：${p.postDepartment || '未填写'}\n` +
    `工作城市：${p.city || '未填写'}\n` +
    `原始工作描述：${p.rawDescriptionPlain || '未填写'}\n` +
    `目标岗位：${p.intentPosts || '未填写'}\n\n` +
    '【输出规则】\n' +
    '1. 只返回优化后的工作描述HTML富文本，不做分析、不写多余说明；\n' +
    '2. 仅允许使用以下HTML标签：<b>、<i>、<u>、<ul>、<li>，禁止其他标签；\n' +
    '3. 必须用<ul>无序列表 + <li>结构化展示，禁止使用<ol>有序列表；\n' +
    '4. 用STAR法则重构内容，突出：业务背景/目标 → 你的核心职责与关键动作 → 量化成果与业务价值；\n' +
    '5. 关键岗位关键词、技术栈、核心能力用<b>加粗，技术栈/工具用<i>斜体，量化数据用<u>下划线；\n' +
    '6. 保留所有事实，不编造经历，替换模糊表述（如“参与/协助”）为具体动作词（如“负责/主导/搭建/优化”）；\n' +
    '7. 每一条<li>控制在1-2行，语言简洁专业，适配ATS筛选。\n\n' +
    '【输出格式参考】\n' +
    '<ul>\n' +
    '  <li><b>业务背景：</b>为支撑公司XX业务增长，负责XX模块的全流程开发与优化</li>\n' +
    '  <li><b>核心职责：</b>作为<b>前端开发工程师</b>，使用 <i>Vue3 + TypeScript</i> 完成XX功能开发与维护</li>\n' +
    '  <li><b>关键动作：</b>主导XX页面性能优化，重构组件逻辑，解决XX线上问题</li>\n' +
    '  <li><b>项目成果：</b>页面加载速度提升<u>35%</u>，用户操作响应时间缩短<u>40%</u>，支撑业务月活提升</li>\n' +
    '</ul>'
  );
}

export async function polishJobDescriptionWithBigmodel(
  p: {
    company: string;
    time: string;
    postDepartment: string;
    city: string;
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
            company: p.company,
            time: p.time,
            postDepartment: p.postDepartment,
            city: p.city,
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
