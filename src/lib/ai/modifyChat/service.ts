import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createModifyChatModel } from '@/lib/ai/chatModel';
import { consumeAsyncIterable, isAbortError, throwIfAborted } from '@/lib/ai/abortSignal';
import { classifyModifyIntent } from './intentRouter';
import { resolveModifyScope } from './scopeRouter';
import { executeScopedModify } from './executeScopeModify';
import { extractStreamingMessage } from './extractStreamingMessage';
import { validateResumeStructureMatch } from './merge';
import { formatZodError, parseResumeModifyOutput } from './parse';
import {
  dataStartEnvelope,
  intentEnvelope,
  resumePatchDoneEnvelope,
  statusEnvelope,
  streamingTextEnvelope,
  textOnlyDoneEnvelope,
  type ModifyChatProtocolEnvelope,
} from './protocol';
import { RESUME_MODIFY_HUMAN, RESUME_MODIFY_SYSTEM } from './prompt';
import { formatModifyHistory } from './shared';
import type { ModifyChatMessage } from './types';

export const OFF_TOPIC_REPLY =
  '我是青松简历 AI 帮写助手，暂不支持闲聊。我可以帮您撰写与润色工作经历、项目、教育描述及技能等板块，请直接说明要写什么。';

/** 送入 LLM 的简历 JSON 字符上限；超大简历仍可能被截断，与 MODIFY_CHAT_MAX_RESUME_BYTES 对齐 */
const MAX_RESUME_CHARS = 200_000;
const MAX_MODIFY_RETRIES = 2;
const PROGRESS_EMIT_MS = 400;

function resumeProgressStatus(raw: string): ModifyChatProtocolEnvelope {
  return statusEnvelope('generating_resume', undefined, raw.length);
}

function buildModifyPrompt(knowledgeContext?: string) {
  const knowledgeSection = knowledgeContext?.trim()
    ? `知识库规则（润色时须参考，严禁编造事实）：\n${knowledgeContext.trim()}`
    : '';
  return ChatPromptTemplate.fromMessages([
    ['system', RESUME_MODIFY_SYSTEM.replace('{knowledgeSection}', knowledgeSection)],
    ['human', RESUME_MODIFY_HUMAN],
  ]);
}

function trimResumeJson(resume: unknown): string {
  const raw = JSON.stringify(resume ?? {});
  return raw.length > MAX_RESUME_CHARS ? `${raw.slice(0, MAX_RESUME_CHARS)}…` : raw;
}

async function streamModifyRaw(
  messages: ModifyChatMessage[],
  resume: unknown,
  jsonMode: boolean,
  onContent: (content: string) => void,
  onStatus: (status: ModifyChatProtocolEnvelope) => void,
  knowledgeContext?: string,
  signal?: AbortSignal,
): Promise<string> {
  throwIfAborted(signal);
  const lastUser = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
  const chain = buildModifyPrompt(knowledgeContext)
    .pipe(createModifyChatModel({ temperature: jsonMode ? 0.2 : 0, jsonMode }))
    .pipe(new StringOutputParser());
  const stream = await chain.stream(
    {
      resumeJson: trimResumeJson(resume),
      history: formatModifyHistory(messages.slice(0, -1)),
      lastMessage: lastUser,
    },
    { signal },
  );
  let raw = '';
  let lastPartial = '';
  let lastProgressAt = 0;
  await consumeAsyncIterable(
    stream,
    (chunk) => {
      raw += chunk;
      const now = Date.now();
      if (now - lastProgressAt >= PROGRESS_EMIT_MS) {
        lastProgressAt = now;
        onStatus(resumeProgressStatus(raw));
      }
      const partial = extractStreamingMessage(raw);
      if (partial && partial !== lastPartial) {
        lastPartial = partial;
        onContent(partial);
      }
    },
    signal,
  );
  if (!raw.trim()) throw new Error('模型返回为空');
  return raw;
}

async function streamResumeModify(
  messages: ModifyChatMessage[],
  resume: unknown,
  onContent: (content: string) => void,
  onStatus: (status: ModifyChatProtocolEnvelope) => void,
  knowledgeContext?: string,
  signal?: AbortSignal,
) {
  const attempts: { jsonMode: boolean }[] = [{ jsonMode: true }, { jsonMode: true }, { jsonMode: false }];
  let lastError: Error | undefined;
  for (let i = 0; i <= MAX_MODIFY_RETRIES; i++) {
    throwIfAborted(signal);
    if (i > 0) onStatus(statusEnvelope('retry', i + 1));
    const attempt = attempts[i] ?? attempts[attempts.length - 1];
    try {
      const raw = await streamModifyRaw(
        messages,
        resume,
        attempt.jsonMode,
        i === 0 ? onContent : () => {},
        i === 0 ? onStatus : () => {},
        knowledgeContext,
        signal,
      );
      onStatus(statusEnvelope('parsing'));
      const parsed = parseResumeModifyOutput(raw);
      const structureErr = validateResumeStructureMatch(resume, parsed.resume);
      if (structureErr) throw new Error(structureErr);
      return { message: parsed.message.trim(), resume: parsed.resume };
    } catch (e) {
      if (isAbortError(e)) throw e;
      lastError = new Error(formatZodError(e));
    }
  }
  throw lastError ?? new Error('简历修改结果校验失败，请换个说法重试');
}

export async function streamModifyChatPipeline(
  messages: ModifyChatMessage[],
  resume: unknown | undefined,
  emit: (evt: ModifyChatProtocolEnvelope) => void,
  signal?: AbortSignal,
): Promise<void> {
  const lastUser = messages.filter((m) => m.role === 'user').pop()?.content?.trim() ?? '';
  if (!lastUser) throw new Error('消息不能为空');
  throwIfAborted(signal);
  emit(statusEnvelope('classifying'));
  const intent = await classifyModifyIntent(messages, lastUser, signal);
  emit({ ...intentEnvelope(intent), meta: { intent } });
  if (intent === 'chat') {
    emit(textOnlyDoneEnvelope(OFF_TOPIC_REPLY));
    return;
  }
  if (!resume || typeof resume !== 'object') {
    throw new Error('暂无简历配置，请先编辑简历');
  }
  emit(statusEnvelope('resolving_scope'));
  const scope = await resolveModifyScope(messages, resume, lastUser, signal);
  if (scope.scope === 'ambiguous') {
    const hint =
      scope.clarifyMessage?.trim() ||
      '请具体说明想修改哪一部分，例如「优化第一段工作经历」或「把电话改成…」。';
    emit(textOnlyDoneEnvelope(hint));
    return;
  }
  emit(statusEnvelope('generating_resume'));
  const { message, resume: nextResume } = await executeScopedModify(
    resume,
    scope,
    lastUser,
    signal,
    async (knowledgeContext) =>
      streamResumeModify(
        messages,
        resume,
        (content) => emit(streamingTextEnvelope(content)),
        (status) => emit(status),
        knowledgeContext,
        signal,
      ),
  );
  emit(dataStartEnvelope());
  emit(resumePatchDoneEnvelope(message, nextResume));
}
