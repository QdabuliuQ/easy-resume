import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ZodError } from 'zod';
import { createChatModel } from '@/lib/ai/chatModel';
import { parseAiJsonObject } from '@/lib/ai/parseAiJson';
import { extractResumeImportText } from '@/lib/ai/resumeImport/extractText';
import type { ResumeImportLogger } from '@/lib/ai/resumeImport/logger';
import { normalizeImportedPagesRaw } from '@/lib/ai/resumeImport/normalize';
import { extractCompletedModulesFromResumeJson } from '@/lib/ai/resumeImport/parsePartialJson';
import { RESUME_IMPORT_HUMAN, RESUME_IMPORT_SYSTEM } from '@/lib/ai/resumeImport/prompt';
import {
  importedPagesSchema,
  type ImportedPagesPayload,
} from '@/lib/ai/resumeImport/schema';
import type { ResumeImportStreamEvent } from '@/lib/ai/resumeImport/streamTypes';

const importPrompt = ChatPromptTemplate.fromMessages([
  ['system', RESUME_IMPORT_SYSTEM],
  ['human', RESUME_IMPORT_HUMAN],
]);

const MAX_TEXT_LEN = 24_000;

function trimResumeText(text: string): string {
  const t = text.replace(/\r\n/g, '\n').trim();
  if (t.length <= MAX_TEXT_LEN) return t;
  return `${t.slice(0, MAX_TEXT_LEN)}\n\n[文本已截断]`;
}

function describePagesShape(raw: Record<string, unknown>): Record<string, unknown> {
  const pages = raw.pages;
  if (!Array.isArray(pages)) return { pagesType: typeof pages };
  return {
    pageCount: pages.length,
    pageModulesTypes: pages.slice(0, 3).map((page, i) => {
      if (!page || typeof page !== 'object') return { index: i, modulesType: typeof page };
      const modules = (page as Record<string, unknown>).modules;
      return {
        index: i,
        modulesType: Array.isArray(modules) ? 'array' : typeof modules,
        modulesLen: Array.isArray(modules) ? modules.length : undefined,
      };
    }),
  };
}

function formatZodError(e: ZodError): string {
  return e.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
}

function emitPartialPages(
  modules: ImportedPagesPayload['pages'][number]['modules'],
  onEvent: (event: ResumeImportStreamEvent) => void,
  lastSnapshot: { value: string },
): void {
  if (!modules.length) return;
  const snapshot = JSON.stringify(modules);
  if (snapshot === lastSnapshot.value) return;
  lastSnapshot.value = snapshot;
  onEvent({ pages: [{ modules }] });
}

async function streamLlmParseResumePages(
  resumeText: string,
  log: ResumeImportLogger,
  onEvent: (event: ResumeImportStreamEvent) => void,
): Promise<ImportedPagesPayload['pages']> {
  const attempts = [{ jsonMode: true as const }, { jsonMode: false as const }];
  let lastError: Error | undefined;
  for (const attempt of attempts) {
    log.step('llm_start', { jsonMode: attempt.jsonMode, textLen: resumeText.length });
    onEvent({ phase: 'llm', status: '正在解析简历结构…' });
    try {
      const chain = importPrompt
        .pipe(createChatModel({ temperature: 0.2, jsonMode: attempt.jsonMode }))
        .pipe(new StringOutputParser());
      let acc = '';
      const lastSnapshot = { value: '' };
      const stream = await chain.stream({ resumeText });
      for await (const chunk of stream) {
        acc += chunk;
        const modules = extractCompletedModulesFromResumeJson(acc);
        emitPartialPages(modules, onEvent, lastSnapshot);
      }
      log.step('llm_done', { jsonMode: attempt.jsonMode, rawLen: acc.length });
      const parsed = parseAiJsonObject(acc);
      log.step('llm_json_parsed', describePagesShape(parsed));
      const normalized = normalizeImportedPagesRaw(parsed);
      log.step('llm_json_normalized', describePagesShape(normalized));
      const { pages } = importedPagesSchema.parse(normalized);
      onEvent({ pages });
      return pages;
    } catch (e) {
      if (e instanceof ZodError) {
        log.step('llm_validate_failed', { issues: e.issues.slice(0, 6) });
      } else {
        log.step('llm_attempt_failed', {
          jsonMode: attempt.jsonMode,
          error: e instanceof Error ? e.message : String(e),
        });
      }
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  if (lastError instanceof ZodError) {
    throw new Error(formatZodError(lastError));
  }
  throw lastError ?? new Error('简历解析失败');
}

export async function streamResumeFileToPages(
  buffer: Buffer,
  mimeType: string,
  log: ResumeImportLogger,
  onEvent: (event: ResumeImportStreamEvent) => void,
): Promise<ImportedPagesPayload['pages']> {
  log.step('extract_start', { mimeType, bytes: buffer.length });
  onEvent({ phase: 'extract', status: '正在提取文件文本…' });
  const rawText = await extractResumeImportText(buffer, mimeType, log);
  log.step('extract_done', { rawTextLen: rawText.length });
  onEvent({ phase: 'extract', status: '文本提取完成' });
  const resumeText = trimResumeText(rawText);
  if (!resumeText) {
    throw new Error('未能从文件中提取文本，请尝试更清晰的 PDF 或图片');
  }
  log.step('text_ready', { resumeTextLen: resumeText.length, trimmed: resumeText.length !== rawText.length });
  const pages = await streamLlmParseResumePages(resumeText, log, onEvent);
  log.step('parse_complete', { pageCount: pages.length, moduleCount: pages[0]?.modules?.length ?? 0 });
  return pages;
}

/** @deprecated 非流式调用，保留兼容 */
export async function parseResumeFileToPages(
  buffer: Buffer,
  mimeType: string,
  log: ResumeImportLogger,
): Promise<ImportedPagesPayload['pages']> {
  return streamResumeFileToPages(buffer, mimeType, log, () => undefined);
}
