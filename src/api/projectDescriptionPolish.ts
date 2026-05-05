import { postBigmodelChatCompletionsStream } from '@/api/bigmodelChat';
import { sanitizeRichTextHtml, unwrapFencedHtml } from '@/utils/sanitizeHtml';

const SYSTEM_PROMPT =
  '你是资深HR简历优化专家，专门优化简历项目经历。输出严格要求：1.只返回优化后的项目描述HTML富文本；2.仅允许使用标签b、i、u、s、ol、ul；3.用ul li结构化展示，关键内容用b加粗，技术栈用i斜体，量化数据用u下划线；4.不做多余分析，只返回可直接渲染的HTML。';

function buildUserPrompt(p: {
  projectName: string;
  role: string;
  rawDescriptionPlain: string;
  intentPosts: string;
}) {
  return (
    '【输入信息】\n' +
    `项目名称：${p.projectName || '未填写'}\n` +
    `本人角色：${p.role || '未填写'}\n` +
    `项目原文：${p.rawDescriptionPlain || '未填写'}\n` +
    `目标岗位：${p.intentPosts || '未填写'}\n\n` +
    '【输出要求】\n' +
    '1.  突出：项目背景/目标、你的核心职责、关键动作、量化成果与业务价值。\n' +
    '2.  保留事实、不编造经历，使用STAR逻辑，替换模糊表述为具体动作词。\n' +
    '3.  对核心关键词（如技术栈、岗位能力、量化成果）用`<b>`加粗，不使用其他样式。\n\n' +
    '【示例输出格式参考】\n' +
    '<ul>\n' +
    '  <li><b>项目背景：</b>为解决企业内部审批流程效率低下问题，主导搭建OA自动化管理系统</li>\n' +
    '  <li><b>技术实现：</b>使用 <i>Vue3 + Element Plus</i> 开发前端页面，对接后端接口完成全流程联调</li>\n' +
    '  <li><b>优化成果：</b>优化请求逻辑与渲染性能，页面加载速度提升<u>30%</u>，用户反馈满意度显著提高</li>\n' +
    '</ul>'
  );
}

export async function polishProjectDescriptionWithBigmodel(
  p: {
    projectName: string;
    role: string;
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
            projectName: p.projectName,
            role: p.role,
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
