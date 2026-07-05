'use client';
import { App } from 'antd';
import { Briefcase, Copy, DeleteOne, Down, EditOne, Right, Star, User } from '@icon-park/react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { memo, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { modifyChat, type ModifyChatMessage, type ModifyChatStreamStatus } from '@/api/modifyChat';
import { photo5, photo5Light } from '@/lib/brandAssets';
import { applyResumeDiffs, diffResumeJson } from '@/lib/resumeDiff';
import { flushResumeBackupImmediate } from '@/lib/resumeConfigBackup';
import { trimModifyChatMessages } from '@/lib/ai/modifyChat/shared';
import { stripResumeAvatarForAi } from '@/lib/stripResumeAvatarForAi';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  subscribeAppTheme,
} from '@/lib/themeStore';
import {
  clearAiModifyChatMessages,
  loadAiModifyChatMessages,
  saveAiModifyChatMessages,
  subscribeAiModifyChatReset,
  toStoredAiModifyChatMessages,
  type StoredAiModifyChatItem,
} from '@/lib/aiModifyChatSessionStorage';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { configStore } from '@/mobx';
import ModifyDiffBubble from './modifyDiffBubble';
import { RichHtmlOrText, looksLikeRichHtml } from '@/components/resumeQuillHtml';
import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';

type PendingModify = NonNullable<StoredAiModifyChatItem['pendingModify']>;

type ChatItem = StoredAiModifyChatItem & {
  isStreaming?: boolean;
};

const panelShellClass =
  'flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),rgb(var(--panel-surface-rgb)/0.03)] shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-md)]';
const sendBtnClass =
  'relative isolate inline-flex h-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-gradient-primary px-4 text-[13px] font-medium text-white shadow-[var(--panel-shadow-primary-glow)] outline-none transition-[filter,opacity] duration-200 hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100';
const stopBtnClass =
  'relative isolate inline-flex h-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-fg/[0.14] bg-surface/[0.08] px-4 text-[13px] font-medium text-fg/88 outline-none transition-[border-color,background-color] duration-200 hover:border-fg/[0.22] hover:bg-surface/[0.12] active:bg-surface/[0.06]';
const clearChatBtnClass =
  'inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-fg/48 outline-none transition-[color,background-color] duration-200 hover:bg-surface/[0.06] hover:text-fg/72 disabled:cursor-not-allowed disabled:opacity-45';
const scrollBottomBtnClass =
  'absolute bottom-3 right-3 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full border border-fg/[0.12] bg-[var(--panel-inset-bg)] text-fg/72 shadow-[var(--panel-shadow-md)] outline-none transition-[transform,border-color,color,box-shadow] duration-200 hover:border-[color-mix(in_srgb,var(--color-primary)_32%,transparent)] hover:text-[var(--color-primary)] hover:shadow-[var(--panel-shadow-hover-btn)] active:scale-95';
const userActionBtnClass =
  'inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-fg/42 outline-none transition-[color,background-color] duration-200 hover:bg-surface/[0.08] hover:text-fg/72 disabled:cursor-not-allowed disabled:opacity-45';

function userMessagePlainText(content: string): string {
  if (!content.trim()) return '';
  return looksLikeRichHtml(content) ? plainTextFromRichHtml(content) : content;
}

function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  return e instanceof Error && e.name === 'AbortError';
}

const SUGGEST_KEYS = ['suggest1', 'suggest2', 'suggest3', 'suggest4'] as const;
const SUGGEST_ICONS: ComponentType<{ theme?: 'outline'; size?: string | number; fill?: string }>[] = [
  Briefcase,
  User,
  Star,
  EditOne,
];

function AiModifyEmpty({
  ta,
  loading,
  onSuggest,
}: {
  ta: ReturnType<typeof useTranslations<'Edit.aiModify'>>;
  loading: boolean;
  onSuggest: (text: string) => void;
}) {
  const themeSnap = useSyncExternalStore(
    subscribeAppTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const [, appTheme] = themeSnap.split('|') as ['dark' | 'light' | 'system', 'dark' | 'light'];
  return (
    <div className='flex flex-col items-center px-8 pb-3 pt-2'>
      <div className='w-[min(220px,72%)] shrink-0'>
        <Image
          src={appTheme === 'dark' ? photo5 : photo5Light}
          alt={ta('emptyGreetingHighlight')}
          width={500}
          height={500}
          className='h-auto w-full'
          priority
        />
      </div>
      <h3 className='mt-1 text-center text-[15px] font-semibold leading-snug text-fg/92'>
        {ta('emptyGreetingPrefix')}
        <span className='text-[color:var(--color-primary)]'>{ta('emptyGreetingHighlight')}</span>
      </h3>
      <p className='mt-2 max-w-[34ch] text-center text-[12px] leading-[1.65] text-fg/55'>
        {ta('emptyDesc')}
      </p>
      <div className='my-4 flex w-full items-center gap-2.5'>
        <span className='h-px flex-1 bg-fg/[0.08]' aria-hidden />
        <span className='shrink-0 text-[11px] text-fg/40'>{ta('emptyTryAsk')}</span>
        <span className='h-px flex-1 bg-fg/[0.08]' aria-hidden />
      </div>
      <ul className='flex w-full flex-col gap-2'>
        {SUGGEST_KEYS.map((key, i) => {
          const Icon = SUGGEST_ICONS[i];
          const text = ta(key);
          return (
            <li key={key}>
              <button
                type='button'
                disabled={loading}
                onClick={() => onSuggest(text)}
                className='flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-fg/[0.08] bg-surface/[0.04] px-3 py-2.5 text-left outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:border-[color-mix(in_srgb,var(--color-primary)_32%,transparent)] hover:bg-surface/[0.07] hover:shadow-[0_4px_14px_color-mix(in_srgb,var(--color-primary)_8%,transparent)] disabled:cursor-not-allowed disabled:opacity-50'
              >
                <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]'>
                  <Icon theme='outline' size={16} fill='var(--color-primary)' />
                </span>
                <span className='min-w-0 flex-1 text-[12px] leading-snug text-fg/78'>{text}</span>
                <Right theme='outline' size={14} fill='var(--panel-form-icon)' className='shrink-0 opacity-45' />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TypingDots() {
  return (
    <span className='inline-flex min-h-[18px] min-w-[44px] items-end gap-1 py-0.5' aria-hidden>
      <span className='size-1.5 animate-bounce rounded-full bg-fg/45 [animation-duration:560ms]' />
      <span className='size-1.5 animate-bounce rounded-full bg-fg/45 [animation-delay:140ms] [animation-duration:560ms]' />
      <span className='size-1.5 animate-bounce rounded-full bg-fg/45 [animation-delay:280ms] [animation-duration:560ms]' />
    </span>
  );
}

function DiffSkeleton() {
  return (
    <div className='mt-2.5 flex w-full min-w-[220px] flex-col gap-2.5 rounded-xl border border-fg/[0.08] bg-surface/[0.03] p-2.5'>
      <div className='h-3 w-24 animate-pulse rounded bg-fg/[0.08]' />
      <div className='flex min-h-[88px] w-full flex-col gap-2'>
        <div className='h-3 w-16 animate-pulse rounded bg-fg/[0.06]' />
        <div className='min-h-[36px] w-full animate-pulse rounded-md bg-fg/[0.06]' />
        <div className='h-3 w-16 animate-pulse rounded bg-fg/[0.05]' />
        <div className='min-h-[36px] w-full animate-pulse rounded-md bg-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]' />
      </div>
    </div>
  );
}

function StreamStatusLine({
  status,
  progressBytes,
  elapsedSec,
  ta,
}: {
  status: ModifyChatStreamStatus | 'streaming' | null;
  progressBytes?: number;
  elapsedSec: number;
  ta: ReturnType<typeof useTranslations<'Edit.aiModify'>>;
}) {
  let text = '';
  if (status === 'classifying') text = ta('statusClassifying');
  else if (status === 'resolving_scope') text = ta('statusResolvingScope');
  else if (status === 'generating_resume') {
    text = progressBytes && progressBytes > 512
      ? ta('statusGeneratingProgress', { kb: Math.max(1, Math.round(progressBytes / 1024)) })
      : ta('statusGenerating');
  } else if (status === 'parsing') text = ta('statusParsing');
  else if (status === 'retry') text = ta('statusRetry');
  else if (status === 'streaming') text = ta('statusGenerating');
  if (!text) return null;
  return (
    <p className='mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] leading-relaxed text-fg/52'>
      <span className='inline-flex items-center gap-1.5'>
        <span className='size-1.5 animate-pulse rounded-full bg-[var(--color-primary)]/70' />
        {text}
      </span>
      {elapsedSec >= 3 ? (
        <span className='text-fg/38'>{ta('statusElapsed', { s: elapsedSec })}</span>
      ) : null}
    </p>
  );
}

function ChatMessageRow({
  index,
  message: m,
  messageCount,
  activeStatus,
  progressBytes,
  elapsedSec,
  ta,
  onApplyOne,
  onCancelOne,
  onApplyBatch,
  onCopyUser,
  onEditUser,
}: {
  index: number;
  message: ChatItem;
  messageCount: number;
  activeStatus: ModifyChatStreamStatus | 'streaming' | null;
  progressBytes: number;
  elapsedSec: number;
  ta: ReturnType<typeof useTranslations<'Edit.aiModify'>>;
  onApplyOne: (index: number, id: string) => void;
  onCancelOne: (index: number, id: string) => void;
  onApplyBatch: (index: number) => void;
  onCopyUser: (content: string) => void;
  onEditUser: (content: string) => void;
}) {
  const isUser = m.role === 'user';
  const userText = isUser ? userMessagePlainText(m.content) : '';
  return (
    <div className={`pb-3${index === 0 ? ' pt-3' : ''} ${isUser ? 'flex justify-end' : ''} px-3`}>
      <div className={isUser ? 'flex max-w-[88%] flex-col items-end' : 'w-full'}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 ${
            isUser
              ? 'w-fit whitespace-pre-wrap break-words bg-gradient-primary text-[13px] leading-[1.55] text-white shadow-[var(--panel-shadow-primary-glow)]'
              : `mr-auto max-w-[92%] border border-fg/[0.07] bg-[var(--panel-inset-bg)] text-fg/84${m.pendingModify || m.isStreaming ? ' w-full' : ' w-fit'}${m.isStreaming ? ' min-h-[52px] min-w-[200px]' : ''}`
          }`}
        >
        {m.role === 'assistant' && m.pendingModify ? (
          <ModifyDiffBubble
            content={m.content}
            diffs={m.pendingModify.diffs}
            visibleCount={
              m.pendingModify.resolved || m.pendingModify.revealCount === undefined
                ? undefined
                : m.pendingModify.revealCount
            }
            resolved={m.pendingModify.resolved}
            appliedIds={m.pendingModify.appliedIds}
            cancelledIds={m.pendingModify.cancelledIds}
            onApplyOne={(id) => onApplyOne(index, id)}
            onCancelOne={(id) => onCancelOne(index, id)}
            onApplyBatch={() => onApplyBatch(index)}
          />
        ) : (
          <div className='flex flex-col'>
            {m.content.trim() ? (
              <RichHtmlOrText
                value={m.content}
                plainClassName='whitespace-pre-wrap break-words text-[13px] leading-[1.55]'
              />
            ) : m.isStreaming ? (
              <TypingDots />
            ) : null}
            {m.isStreaming && index === messageCount - 1 ? (
              <>
                <StreamStatusLine
                  status={activeStatus}
                  progressBytes={progressBytes}
                  elapsedSec={elapsedSec}
                  ta={ta}
                />
                {(m.content.trim() || activeStatus === 'generating_resume' || activeStatus === 'parsing' || activeStatus === 'resolving_scope')
                && activeStatus !== 'streaming'
                && activeStatus !== 'classifying' ? (
                  <DiffSkeleton />
                ) : null}
              </>
            ) : null}
          </div>
        )}
        </div>
        {isUser && userText ? (
          <div className='mt-1 flex items-center gap-0.5'>
            <button
              type='button'
              className={userActionBtnClass}
              aria-label={ta('copyMessage')}
              onClick={() => onCopyUser(m.content)}
            >
              <Copy theme='outline' size={15} fill='currentColor' />
            </button>
            <button
              type='button'
              className={userActionBtnClass}
              aria-label={ta('editMessage')}
              onClick={() => onEditUser(m.content)}
            >
              <EditOne theme='outline' size={15} fill='currentColor' />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const MemoChatMessageRow = memo(ChatMessageRow);

function AiModify() {
  const ta = useTranslations('Edit.aiModify');
  const { message: messageApi } = App.useApp();
  const { confirm, contextHolder } = useResponsiveConfirm();
  const [messages, setMessages] = useState<ChatItem[]>(() =>
    typeof window === 'undefined' ? [] : loadAiModifyChatMessages(),
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<ModifyChatStreamStatus | 'streaming' | null>(null);
  const [progressBytes, setProgressBytes] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [atBottom, setAtBottom] = useState(true);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<ChatItem[]>([]);
  messagesRef.current = messages;
  const abortRef = useRef<AbortController | null>(null);
  const chatEpochRef = useRef(0);
  const waitStartedAtRef = useRef(0);
  const scrollEnd = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({
      index: 'LAST',
      behavior: 'auto',
      align: 'end',
    });
  }, []);
  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({
      index: 'LAST',
      behavior: 'smooth',
      align: 'end',
    });
  }, []);
  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);
  const resetChat = useCallback(() => {
    chatEpochRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setLoadingStatus(null);
    setProgressBytes(0);
    setElapsedSec(0);
    setInput('');
    setMessages([]);
    setAtBottom(true);
    clearAiModifyChatMessages();
  }, []);
  const clearChat = useCallback(() => {
    confirm({
      title: ta('clearChatConfirmTitle'),
      content: ta('clearChatConfirmContent'),
      okText: ta('clearChat'),
      cancelText: ta('cancel'),
      danger: true,
      onOk: resetChat,
    });
  }, [confirm, resetChat, ta]);
  const upsertAssistant = useCallback((content: string, pendingModify?: PendingModify, isStreaming = true) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      const nextItem: ChatItem = { role: 'assistant', content, pendingModify, isStreaming };
      if (last?.role === 'assistant') {
        return [...prev.slice(0, -1), {
          ...nextItem,
          pendingModify: pendingModify ?? last.pendingModify,
          isStreaming: pendingModify ? false : isStreaming,
        }];
      }
      return [...prev, nextItem];
    });
    requestAnimationFrame(scrollEnd);
  }, [scrollEnd]);
  const cleanupStreamingAssistant = useCallback(() => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role !== 'assistant' || !last.isStreaming) return prev;
      if (!last.content.trim() && !last.pendingModify) return prev.slice(0, -1);
      return [...prev.slice(0, -1), { ...last, isStreaming: false }];
    });
  }, []);
  const resolvePending = useCallback((index: number, patch: Partial<PendingModify>) => {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === index && m.pendingModify
          ? { ...m, pendingModify: { ...m.pendingModify, ...patch } }
          : m,
      ),
    );
  }, []);
  const allDiffsHandled = useCallback((pm: PendingModify) => {
    const applied = new Set(pm.appliedIds ?? []);
    const cancelled = new Set(pm.cancelledIds ?? []);
    return pm.diffs.every((d) => applied.has(d.id) || cancelled.has(d.id));
  }, []);
  const finalizePendingIfDone = useCallback(
    (index: number, patch: Partial<PendingModify>) => {
      const item = messagesRef.current[index];
      if (!item?.pendingModify) return;
      const nextPm: PendingModify = { ...item.pendingModify, ...patch };
      if (!allDiffsHandled(nextPm)) {
        resolvePending(index, patch);
        return;
      }
      const anyApplied = (nextPm.appliedIds?.length ?? 0) > 0;
      resolvePending(index, {
        ...patch,
        resolved: anyApplied ? 'applied' : 'cancelled',
      });
      requestAnimationFrame(scrollEnd);
    },
    [allDiffsHandled, resolvePending, scrollEnd],
  );
  const applyOnePending = useCallback(
    (index: number, id: string) => {
      const item = messagesRef.current[index];
      const pm = item?.pendingModify;
      if (!pm || pm.resolved) return;
      const next = applyResumeDiffs(configStore.getConfig, pm.proposedResume, pm.diffs, [id]);
      configStore.setConfig(next);
      flushResumeBackupImmediate(configStore.getConfig);
      finalizePendingIfDone(index, { appliedIds: [...(pm.appliedIds ?? []), id] });
      messageApi.success(ta('appliedOk'));
    },
    [finalizePendingIfDone, messageApi, ta],
  );
  const cancelOnePending = useCallback(
    (index: number, id: string) => {
      const item = messagesRef.current[index];
      const pm = item?.pendingModify;
      if (!pm || pm.resolved) return;
      finalizePendingIfDone(index, { cancelledIds: [...(pm.cancelledIds ?? []), id] });
    },
    [finalizePendingIfDone],
  );
  const applyBatchPending = useCallback(
    (index: number) => {
      const item = messagesRef.current[index];
      const pm = item?.pendingModify;
      if (!pm || pm.resolved) return;
      const applied = new Set(pm.appliedIds ?? []);
      const cancelled = new Set(pm.cancelledIds ?? []);
      const pendingIds = pm.diffs.map((d) => d.id).filter((id) => !applied.has(id) && !cancelled.has(id));
      if (!pendingIds.length) return;
      const next = applyResumeDiffs(configStore.getConfig, pm.proposedResume, pm.diffs, pendingIds);
      configStore.setConfig(next);
      flushResumeBackupImmediate(configStore.getConfig);
      resolvePending(index, {
        appliedIds: [...(pm.appliedIds ?? []), ...pendingIds],
        resolved: 'applied',
      });
      messageApi.success(ta('appliedOk'));
      requestAnimationFrame(scrollEnd);
    },
    [messageApi, resolvePending, scrollEnd, ta],
  );
  const copyUserMessage = useCallback(async (content: string) => {
    const text = userMessagePlainText(content);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      messageApi.success(ta('copyOk'));
    } catch {
      messageApi.error(ta('copyFail'));
    }
  }, [messageApi, ta]);
  const editUserMessage = useCallback((content: string) => {
    const text = userMessagePlainText(content);
    if (!text) return;
    setInput(text);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(text.length, text.length);
    });
  }, []);
  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    const epoch = chatEpochRef.current;
    if (!overrideText) setInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: '', isStreaming: true },
    ]);
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setLoadingStatus('classifying');
    setProgressBytes(0);
    waitStartedAtRef.current = Date.now();
    setElapsedSec(0);
    requestAnimationFrame(scrollEnd);
    try {
      const cfg = configStore.getConfig;
      const resume = cfg?.pages?.length ? stripResumeAvatarForAi(cfg) : undefined;
      const prior: ModifyChatMessage[] = messagesRef.current
        .filter((m) => !m.isStreaming && m.content.trim())
        .map((m) => ({ role: m.role as ModifyChatMessage['role'], content: m.content.trim() }));
      const apiMessages = trimModifyChatMessages([
        ...prior,
        { role: 'user' as const, content: text },
      ]);
      const result = await modifyChat(apiMessages, resume, ac.signal, {
        onText: (content) => {
          if (epoch !== chatEpochRef.current) return;
          setLoadingStatus('streaming');
          upsertAssistant(content);
        },
        onStatus: (status, _attempt, bytes) => {
          if (epoch !== chatEpochRef.current) return;
          setLoadingStatus(status);
          if (typeof bytes === 'number' && bytes > 0) setProgressBytes(bytes);
        },
      });
      if (epoch !== chatEpochRef.current) return;
      if (result.intent === 'modify_resume' && !result.resume) {
        upsertAssistant(result.content || ta('missingResumeJson'), undefined, false);
        messageApi.error(ta('missingResumeJson'));
        return;
      }
      if (result.intent === 'modify_resume' && result.resume) {
        const baseline = cfg?.pages?.length ? cfg : configStore.getConfig;
        const allDiffs = diffResumeJson(baseline, result.resume);
        upsertAssistant(
          result.content,
          { diffs: allDiffs, proposedResume: result.resume, revealCount: 0 },
          false,
        );
        if (!allDiffs.length) messageApi.info(ta('diffNoChanges'));
        return;
      }
      upsertAssistant(result.content, undefined, false);
    } catch (e) {
      if (isAbortError(e)) return;
      if (epoch !== chatEpochRef.current) return;
      messageApi.error(e instanceof Error ? e.message : ta('sendFail'));
    } finally {
      if (epoch === chatEpochRef.current) {
        if (abortRef.current === ac) abortRef.current = null;
        cleanupStreamingAssistant();
        setLoading(false);
        setLoadingStatus(null);
        setProgressBytes(0);
        requestAnimationFrame(scrollEnd);
      }
    }
  }, [input, loading, messageApi, scrollEnd, ta, upsertAssistant, cleanupStreamingAssistant]);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => subscribeAiModifyChatReset(resetChat), [resetChat]);
  useEffect(() => {
    const tick = () => scrollEnd();
    requestAnimationFrame(() => requestAnimationFrame(tick));
    const id = window.setTimeout(tick, 120);
    return () => window.clearTimeout(id);
  }, [scrollEnd]);
  useEffect(() => {
    const id = window.setTimeout(() => {
      saveAiModifyChatMessages(toStoredAiModifyChatMessages(messages));
    }, 200);
    return () => window.clearTimeout(id);
  }, [messages]);
  useEffect(() => {
    const lastIdx = messages.length - 1;
    const last = messages[lastIdx];
    const pm = last?.pendingModify;
    if (!pm || pm.resolved || pm.revealCount === undefined) return;
    if (pm.revealCount >= pm.diffs.length) return;
    const id = window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((m, i) =>
          i === lastIdx && m.pendingModify
            ? {
              ...m,
              pendingModify: {
                ...m.pendingModify,
                revealCount: (m.pendingModify.revealCount ?? 0) + 1,
              },
            }
            : m,
        ),
      );
      requestAnimationFrame(scrollEnd);
    }, 500);
    return () => window.clearTimeout(id);
  }, [messages, scrollEnd]);
  useEffect(() => {
    if (!loading) return;
    const tick = () => setElapsedSec(Math.floor((Date.now() - waitStartedAtRef.current) / 1000));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [loading]);
  const activeStatus = loading ? loadingStatus : null;
  const renderMessage = useCallback(
    (index: number, m: ChatItem) => (
      <MemoChatMessageRow
        index={index}
        message={m}
        messageCount={messages.length}
        activeStatus={activeStatus}
        progressBytes={progressBytes}
        elapsedSec={elapsedSec}
        ta={ta}
        onApplyOne={applyOnePending}
        onCancelOne={cancelOnePending}
        onApplyBatch={applyBatchPending}
        onCopyUser={(content) => void copyUserMessage(content)}
        onEditUser={editUserMessage}
      />
    ),
    [
      activeStatus,
      applyBatchPending,
      applyOnePending,
      cancelOnePending,
      copyUserMessage,
      editUserMessage,
      elapsedSec,
      messages.length,
      progressBytes,
      ta,
    ],
  );
  return (
    <div className={panelShellClass}>
      {contextHolder}
      {messages.length > 0 ? (
        <div className='flex shrink-0 justify-end border-b border-fg/[0.06] px-3 py-1.5'>
          <button
            type='button'
            disabled={loading}
            onClick={clearChat}
            className={clearChatBtnClass}
          >
            <DeleteOne theme='outline' size={13} fill='currentColor' />
            {ta('clearChat')}
          </button>
        </div>
      ) : null}
      <div className='relative min-h-0 flex-1'>
        {messages.length === 0 ? (
          <div className='h-full overflow-y-auto overscroll-contain'>
            <AiModifyEmpty ta={ta} loading={loading} onSuggest={(text) => void send(text)} />
          </div>
        ) : (
          <>
            <Virtuoso
              ref={virtuosoRef}
              className='h-full overscroll-contain'
              data={messages}
              computeItemKey={(index, m) => `${m.role}-${index}`}
              followOutput='auto'
              alignToBottom
              atBottomThreshold={64}
              atBottomStateChange={setAtBottom}
              increaseViewportBy={{ top: 320, bottom: 320 }}
              initialTopMostItemIndex={Math.max(0, messages.length - 1)}
              itemContent={renderMessage}
            />
            {!atBottom ? (
              <button
                type='button'
                onClick={scrollToBottom}
                aria-label={ta('scrollToBottom')}
                className={scrollBottomBtnClass}
              >
                <Down theme='outline' size={18} fill='currentColor' />
              </button>
            ) : null}
          </>
        )}
      </div>
      <div className='shrink-0 border-t border-fg/[0.06] bg-[var(--panel-inset-bg)] p-3'>
        <div className='flex items-end gap-2'>
          <div className='relative flex-1' style={{height: '70px'}}>
            <textarea
              ref={inputRef}
              value={input}
              disabled={loading}
              placeholder={ta('placeholder')}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!loading) void send();
                }
              }}
              className='absolute inset-0 box-border h-full w-full resize-none rounded-xl border border-fg/[0.08] bg-surface/[0.04] px-3 py-2.5 text-[13px] leading-relaxed text-fg/90 outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-fg/42 hover:border-fg/[0.14] hover:bg-surface/[0.06] focus:border-[color-mix(in_srgb,var(--color-primary)_45%,transparent)] focus:bg-surface/[0.08] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_12%,transparent)] disabled:opacity-60 disabled:hover:border-fg/[0.08] disabled:hover:bg-surface/[0.04]'
            />
          </div>
          <button
            type='button'
            disabled={!loading && !input.trim()}
            onClick={() => (loading ? cancel() : void send())}
            className={loading ? stopBtnClass : sendBtnClass}
            aria-busy={loading}
          >
            {loading ? ta('stop') : ta('send')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(AiModify);
