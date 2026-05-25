import { StringOutputParser } from '@langchain/core/output_parsers';
import { createChatModel } from '@/lib/ai/chatModel';
import { getPolishPrompt } from '@/lib/ai/polish/prompts';
import type { PolishRequest } from '@/lib/ai/polish/types';
import { sanitizeRichTextHtml, unwrapFencedHtml } from '@/utils/sanitizeHtml';

function unset(v: string | undefined): string {
  const s = String(v ?? '').trim();
  return s || '未填写';
}

function htmlToPlain(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPromptVars(req: PolishRequest): Record<string, string> {
  const rawDescriptionPlain = htmlToPlain(req.richTextHtml);
  const intentPosts = unset(req.intentPosts);
  if (req.type === 'job') {
    const c = req.context;
    return {
      company: unset(c.company),
      time: unset(c.time),
      postDepartment: unset(c.postDepartment),
      city: unset(c.city),
      rawDescriptionPlain,
      intentPosts,
    };
  }
  if (req.type === 'project') {
    const c = req.context;
    return {
      projectName: unset(c.projectName),
      role: unset(c.role),
      rawDescriptionPlain,
      intentPosts,
    };
  }
  if (req.type === 'education') {
    const c = req.context;
    return {
      school: unset(c.school),
      degree: unset(c.degree),
      major: unset(c.major),
      city: unset(c.city),
      schoolTypeTags: unset(c.schoolTypeTags),
      academy: unset(c.academy),
      studyTime: unset(c.studyTime),
      rawDescriptionPlain,
      intentPosts,
    };
  }
  return { rawDescriptionPlain, intentPosts };
}

export async function streamPolishDescription(
  req: PolishRequest,
  onStreamingHtml?: (htmlSoFar: string) => void,
): Promise<string> {
  const prompt = getPolishPrompt(req.type);
  const llm = createChatModel({ temperature: 1 });
  const chain = prompt.pipe(llm).pipe(new StringOutputParser());
  const vars = buildPromptVars(req);
  let acc = '';
  const stream = await chain.stream(vars);
  for await (const chunk of stream) {
    acc += chunk;
    onStreamingHtml?.(acc);
  }
  const html = unwrapFencedHtml(acc);
  return sanitizeRichTextHtml(html);
}
