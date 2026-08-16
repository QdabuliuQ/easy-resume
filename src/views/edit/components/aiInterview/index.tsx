'use client';
import { AudioOutlined, LoadingOutlined } from '@ant-design/icons';
import { Input, Spin } from 'antd';
import { observer } from 'mobx-react';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  interviewAbandon,
  interviewAnswer,
  interviewEnd,
  interviewReportStream,
  interviewStart,
} from '@/api/aiInterview';
import { useAppMessage } from '@/hooks/useAppMessage';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import DifficultySlider from './DifficultySlider';
import PanelHero from '../panel/components/panelHero';
import type { InterviewDifficulty, InterviewQuestion, InterviewReport } from '@/lib/ai/interview/types';
import {
  INTERVIEW_ANSWER_MAX_CHARS,
  INTERVIEW_DIFFICULTY_DEFAULT,
  INTERVIEW_Q_DEFAULT,
  INTERVIEW_Q_MAX,
  INTERVIEW_Q_MIN,
} from '@/lib/ai/interview/types';
import { cloudResumeStore, configStore } from '@/mobx';

type Phase = 'prepare' | 'session' | 'report';
type ResumeSource = 'cloud' | 'draft';
type ResumeListItem = { id: string; name: string; update_at: number };

const Q_OPTIONS = Array.from(
  { length: INTERVIEW_Q_MAX - INTERVIEW_Q_MIN + 1 },
  (_, i) => INTERVIEW_Q_MIN + i,
);

const shellClass =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.08)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%)]';
const settingsShellClass =
  'overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(180deg,rgb(var(--panel-surface-rgb)/0.06)_0%,rgb(var(--panel-surface-rgb)/0.025)_100%),rgb(var(--panel-surface-rgb)/0.03)] p-4 shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.04),var(--panel-shadow-md)] md:p-5';
const primaryBtnClass =
  'bg-add-module-gradient relative isolate inline-flex h-11 min-w-[140px] cursor-pointer select-none items-center justify-center gap-2 overflow-hidden rounded-xl px-5 text-[14px] font-semibold text-white shadow-[0_8px_24px_color-mix(in_srgb,var(--color-primary)_28%,transparent)] outline-none transition-[filter,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:brightness-110 active:scale-[0.98] active:brightness-95 disabled:pointer-events-none disabled:opacity-70 motion-reduce:transition-none';
const fieldLabelClass =
  'text-[11px] font-semibold uppercase tracking-[0.14em] text-fg/48';

function DimScore({ label, value }: { label: string; value: number }) {
  const v = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className='relative overflow-hidden rounded-xl border border-fg/[0.07] bg-fg/[0.025] px-3.5 py-3.5'>
      <div className='flex items-baseline justify-between gap-2'>
        <span className='text-[12px] font-medium text-fg/55'>{label}</span>
        <span className='text-[22px] font-semibold tabular-nums tracking-[-0.03em] text-fg/92'>{v}</span>
      </div>
      <div className='mt-2.5 h-0.5 overflow-hidden rounded-full bg-fg/[0.06]'>
        <div
          className='h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

const DIM_LABELS = ['与简历一致性', '细节深度', '表达结构', '岗位匹配'] as const;

function ReportStatusChip({ step }: { step: 0 | 1 | 2 }) {
  const copy =
    step === 0 ? '正在生成报告…' : step === 1 ? '正在撰写总评…' : '正在整理改进建议…';
  const pct = step === 0 ? 28 : step === 1 ? 62 : 88;
  return (
    <div
      className='space-y-2.5 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)] px-3.5 py-3'
      role='status'
      aria-live='polite'
    >
      <div className='flex items-center gap-2.5'>
        <span className='relative flex size-2 shrink-0'>
          <span className='absolute inset-0 animate-ping rounded-full bg-[var(--color-primary)]/45 motion-reduce:animate-none' />
          <span className='relative size-2 rounded-full bg-[var(--color-primary)]' />
        </span>
        <p className='text-[12px] font-medium text-fg/78'>{copy}</p>
      </div>
      <div className='h-1 overflow-hidden rounded-full bg-fg/[0.08]'>
        <div
          className='h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className='text-[11px] leading-relaxed text-fg/45'>
        生成开始后会计费；离开本页会中断本场面试，无法取消已产生的扣费。
      </p>
    </div>
  );
}

function DimScoreSkeleton() {
  return (
    <div className='grid gap-2.5 sm:grid-cols-2' aria-hidden>
      {DIM_LABELS.map((label) => (
        <div
          key={label}
          className='ui-hint-shimmer relative rounded-xl border border-fg/[0.07] bg-fg/[0.025] px-3.5 py-3.5'
        >
          <div className='flex items-baseline justify-between gap-2'>
            <span className='text-[12px] font-medium text-fg/40'>{label}</span>
            <span className='h-5 w-9 animate-pulse rounded-md bg-fg/[0.08] motion-reduce:animate-none' />
          </div>
          <div className='mt-2.5 h-0.5 overflow-hidden rounded-full bg-fg/[0.06]' />
        </div>
      ))}
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className='mt-3 space-y-2.5' aria-hidden>
      {[92, 78, 86, 64, 48].map((w, i) => (
        <div
          key={i}
          className='h-3.5 animate-pulse rounded-md bg-fg/[0.06] motion-reduce:animate-none'
          style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  );
}

function ActionsSkeleton() {
  return (
    <div aria-hidden>
      <h3 className='mb-3 text-[13px] font-semibold tracking-[-0.01em] text-fg/40'>改进建议</h3>
      <ol className='overflow-hidden rounded-2xl border border-fg/[0.08] bg-fg/[0.02] divide-y divide-fg/[0.06]'>
        {[0, 1, 2].map((i) => (
          <li key={i} className='flex gap-3 px-4 py-3.5'>
            <span className='mt-0.5 w-5 shrink-0 text-[12px] font-semibold tabular-nums text-fg/25'>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className='flex min-w-0 flex-1 flex-col gap-2 pt-0.5'>
              <div
                className='h-3 animate-pulse rounded bg-fg/[0.07] motion-reduce:animate-none'
                style={{ width: `${88 - i * 12}%` }}
              />
              <div
                className='h-3 animate-pulse rounded bg-fg/[0.05] motion-reduce:animate-none'
                style={{ width: `${62 - i * 8}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default observer(function AiInterviewPage({
  onLiveChange,
}: {
  onLiveChange?: (live: boolean) => void;
} = {}) {
  const message = useAppMessage();
  const { confirm, contextHolder } = useResponsiveConfirm();
  const { status, data: session } = useSession();
  const signedIn = status === 'authenticated' && Boolean(session?.user?.uid);
  const isDev = process.env.NODE_ENV !== 'production';

  const [phase, setPhase] = useState<Phase>('prepare');
  const [source, setSource] = useState<ResumeSource>('cloud');
  const [list, setList] = useState<ResumeListItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(cloudResumeStore.resumeId);
  const [questionCount, setQuestionCount] = useState(INTERVIEW_Q_DEFAULT);
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>(INTERVIEW_DIFFICULTY_DEFAULT);
  const [busy, setBusy] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [progress, setProgress] = useState({ index: 0, total: 0 });
  const [answerText, setAnswerText] = useState('');

  const [dimensions, setDimensions] = useState<InterviewReport['dimensions'] | null>(null);
  const [summary, setSummary] = useState('');
  const [actionTexts, setActionTexts] = useState<string[]>([]);
  const [finalReport, setFinalReport] = useState<InterviewReport | null>(null);
  const [reportStreaming, setReportStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>('prepare');
  const listEpoch = cloudResumeStore.listEpoch;

  sessionIdRef.current = sessionId;
  phaseRef.current = phase;
  const live = Boolean(sessionId) && phase !== 'prepare';

  const voice = useVoiceInput({
    onText: (text) => setAnswerText((prev) => (prev ? `${prev}${text}` : text)),
    onError: (msg) => message.error(msg),
    disabled: phase !== 'session' || busy,
  });

  const resetSession = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    const sid = sessionIdRef.current;
    if (sid) interviewAbandon(sid);
    sessionIdRef.current = null;
    setPhase('prepare');
    setSessionId(null);
    setQuestion(null);
    setProgress({ index: 0, total: 0 });
    setAnswerText('');
    setDimensions(null);
    setSummary('');
    setActionTexts([]);
    setFinalReport(null);
    setReportStreaming(false);
    setBusy(false);
  }, []);

  const requestLeaveInterview = useCallback(() => {
    if (!live) {
      resetSession();
      return;
    }
    confirm({
      title: '确认退出面试？',
      content: '退出后本场进度将丢失，无法恢复。',
      okText: '确认退出',
      cancelText: '继续面试',
      danger: true,
      onOk: () => resetSession(),
    });
  }, [live, confirm, resetSession]);

  const streamReport = useCallback(
    async (sid: string) => {
      setPhase('report');
      setReportStreaming(true);
      setDimensions(null);
      setSummary('');
      setActionTexts([]);
      setFinalReport(null);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const report = await interviewReportStream(
          sid,
          {
            onMeta: (dims) => setDimensions(dims),
            onDelta: (evt) => {
              if (evt.field === 'summary') {
                setSummary((s) => s + evt.textDelta);
                return;
              }
              if (evt.field === 'actionItem' && typeof evt.index === 'number') {
                setActionTexts((prev) => {
                  const next = [...prev];
                  next[evt.index!] = (next[evt.index!] || '') + evt.textDelta;
                  return next;
                });
              }
            },
            onDone: (r) => setFinalReport(r),
          },
          ac.signal,
        );
        if (report) setFinalReport(report);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        message.error(e instanceof Error ? e.message : '报告生成失败');
      } finally {
        setReportStreaming(false);
      }
    },
    [message],
  );

  useEffect(() => {
    onLiveChange?.(live);
    return () => onLiveChange?.(false);
  }, [live, onLiveChange]);

  useEffect(() => {
    if (!live) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [live]);

  // 切走菜单 / 关页：中断本场，再进从准备页开始
  useEffect(() => {
    const abandonLive = () => {
      abortRef.current?.abort();
      const sid = sessionIdRef.current;
      if (!sid || phaseRef.current === 'prepare') return;
      interviewAbandon(sid);
      sessionIdRef.current = null;
    };
    const onPageHide = () => abandonLive();
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      abandonLive();
    };
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (signedIn) {
      setSource((s) => (s === 'draft' && isDev ? 'draft' : 'cloud'));
      return;
    }
    if (isDev) setSource('draft');
  }, [status, signedIn, isDev]);

  useEffect(() => {
    if (!signedIn) {
      setList([]);
      return;
    }
    void listEpoch;
    let cancelled = false;
    setListLoading(true);
    void fetch('/api/resume/cloud', { cache: 'no-store' })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as {
          list?: ResumeListItem[];
          error?: string;
        } | null;
        if (!res.ok) throw new Error(data?.error || '加载简历列表失败');
        if (!cancelled) setList(Array.isArray(data?.list) ? data!.list! : []);
      })
      .catch((e) => {
        if (!cancelled) message.error(e instanceof Error ? e.message : '加载失败');
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, message, listEpoch]);

  const buildBody = useCallback(() => {
    if (source === 'cloud' && resumeId) return { resumeId };
    if (source === 'draft' && isDev) return { resume: configStore.getConfig };
    return null;
  }, [source, resumeId, isDev]);

  const ready = Boolean(buildBody());

  const startInterview = useCallback(async () => {
    const body = buildBody();
    if (!body) {
      message.warning(isDev ? '请先选择简历来源' : '请先选择一份云端简历');
      return;
    }
    setBusy(true);
    try {
      const started = await interviewStart({
        ...body,
        questionCount,
        difficulty,
      });
      setSessionId(started.sessionId);
      setQuestion(started.question);
      setProgress(started.progress);
      setAnswerText('');
      setPhase('session');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '开始失败');
    } finally {
      setBusy(false);
    }
  }, [buildBody, message, questionCount, difficulty, isDev]);

  const submitAnswer = useCallback(
    async (skipped?: boolean) => {
      if (!sessionId || !question) return;
      setBusy(true);
      try {
        const res = await interviewAnswer(sessionId, {
          questionId: question.id,
          text: skipped ? undefined : answerText.trim(),
          skipped,
        });
        if (res.phase === 'reporting') {
          await streamReport(sessionId);
          return;
        }
        setQuestion(res.question);
        setProgress(res.progress);
        setAnswerText('');
      } catch (e) {
        message.error(e instanceof Error ? e.message : '提交失败');
      } finally {
        setBusy(false);
      }
    },
    [sessionId, question, answerText, streamReport, message],
  );

  const endEarly = useCallback(async () => {
    if (!sessionId) return;
    setBusy(true);
    try {
      await interviewEnd(sessionId);
      await streamReport(sessionId);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '结束失败');
    } finally {
      setBusy(false);
    }
  }, [sessionId, streamReport, message]);

  const canEnter = signedIn || isDev;
  const sourceLabel = useMemo(() => {
    if (source === 'cloud' && resumeId) {
      return list.find((x) => x.id === resumeId)?.name || resumeId;
    }
    if (source === 'draft') return '当前编辑器草稿';
    return '未选择';
  }, [source, resumeId, list]);

  const showSourceTabs = signedIn && isDev;
  const segBtn = (on: boolean) =>
    `rounded-lg px-3.5 py-2 text-[12px] font-medium transition-[background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
      on
        ? 'bg-[var(--editor-shell-panel-strong)] text-[var(--color-primary)] shadow-[0_6px_18px_rgb(var(--surface-fg-rgb)/0.08)]'
        : 'text-fg/55 hover:text-fg/80'
    }`;

  return (
    <div className='flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden'>
      {contextHolder}
      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-5'>
        <div className='mx-auto flex w-full max-w-[720px] flex-col gap-5'>
          {phase === 'session' || phase === 'report' ? (
            <header className='flex items-center justify-between gap-3 px-0.5'>
              <div className='min-w-0'>
                <h2 className='text-[15px] font-semibold tracking-[-0.02em] text-fg/90'>
                  {phase === 'report' ? '面试总结' : 'AI 面试'}
                </h2>
                <p className='mt-0.5 truncate text-[11px] text-fg/45'>
                  {phase === 'report'
                    ? reportStreaming
                      ? '正在生成报告…'
                      : '模拟练习，仅供参考'
                    : '模拟练习，语音或文字作答'}
                </p>
              </div>
              <button
                type='button'
                onClick={requestLeaveInterview}
                className='shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-fg/50 transition-colors hover:bg-fg/[0.05] hover:text-fg/80'
              >
                返回准备
              </button>
            </header>
          ) : (
            <PanelHero
              className='!mb-0'
              eyebrow='PRACTICE'
              title='AI 面试'
              description='按简历内容深挖提问，语音作答，结束后生成流式报告。'
              chip='模拟练习'
            />
          )}

          {!canEnter ? (
            <div className={`${shellClass} px-5 py-8 text-center`}>
              <p className='text-[14px] font-medium text-fg/82'>请先登录后再使用 AI 面试</p>
              <p className='mx-auto mt-1.5 max-w-[32ch] text-[12px] leading-relaxed text-fg/52'>
                登录后可选择云端已保存简历开始练习。
              </p>
            </div>
          ) : null}

          {canEnter && phase === 'prepare' ? (
            <>
              <section className={`${shellClass} p-4 md:p-5`}>
                <div className='mb-3 flex items-center justify-between gap-2'>
                  <h3 className='text-[13px] font-semibold text-fg/88'>简历来源</h3>
                  <span className='truncate text-[11px] text-fg/42'>{sourceLabel}</span>
                </div>
                {showSourceTabs ? (
                  <div className='mb-4 flex flex-wrap gap-1 rounded-xl bg-fg/[0.04] p-1'>
                    <button type='button' className={segBtn(source === 'cloud')} onClick={() => setSource('cloud')}>
                      云端已保存
                    </button>
                    <button type='button' className={segBtn(source === 'draft')} onClick={() => setSource('draft')}>
                      当前草稿
                    </button>
                  </div>
                ) : null}

                {source === 'cloud' ? (
                  listLoading ? (
                    <div className='flex justify-center py-10'>
                      <Spin indicator={<LoadingOutlined spin />} />
                    </div>
                  ) : list.length === 0 ? (
                    <div className='rounded-xl border border-dashed border-fg/[0.12] bg-[var(--panel-inset-bg)] px-4 py-6 text-center'>
                      <p className='text-[13px] font-medium text-fg/78'>暂无云端简历</p>
                      <p className='mt-1 text-[11px] text-fg/48'>请先在「我的简历」保存后再来开始面试。</p>
                    </div>
                  ) : (
                    <div className='grid max-h-[240px] gap-2 overflow-y-auto sm:grid-cols-2'>
                      {list.map((item) => {
                        const on = resumeId === item.id;
                        return (
                          <button
                            key={item.id}
                            type='button'
                            onClick={() => setResumeId(item.id)}
                            className={`rounded-xl border px-3.5 py-3 text-left transition-[border-color,background-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.99] motion-reduce:transition-none ${
                              on
                                ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_14%,transparent)]'
                                : 'border-fg/[0.08] bg-surface/[0.02] hover:border-fg/20 hover:bg-surface/[0.04]'
                            }`}
                          >
                            <div className='truncate text-[13px] font-semibold text-fg/90'>
                              {item.name || '未命名简历'}
                            </div>
                            <div className='mt-1 text-[11px] tabular-nums text-fg/42'>
                              {item.update_at
                                ? new Date(
                                    item.update_at < 1e12 ? item.update_at * 1000 : item.update_at,
                                  ).toLocaleString('zh-CN', { hour12: false })
                                : item.id}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : null}

                {source === 'draft' ? (
                  <div className='rounded-xl border border-fg/[0.08] bg-fg/[0.03] px-4 py-3 text-[12px] leading-relaxed text-fg/58'>
                    本地调试模式：将使用当前编辑器中的简历草稿开场。
                  </div>
                ) : null}
              </section>

              <section className={settingsShellClass}>
                <div className='mb-4 flex items-end justify-between gap-3'>
                  <div>
                    <p className={fieldLabelClass}>Session</p>
                    <h3 className='mt-1 text-[15px] font-semibold tracking-[-0.015em] text-fg/92'>
                      面试设置
                    </h3>
                  </div>
                  <p className='text-right text-[11px] leading-snug text-fg/42'>
                    <span className='tabular-nums text-fg/70'>{questionCount}</span> 题
                    <span className='mx-1 text-fg/25'>·</span>
                    <span className='text-fg/62'>
                      {difficulty === 'easy' ? '简单' : difficulty === 'hard' ? '困难' : '中等'}
                    </span>
                  </p>
                </div>

                <div className='space-y-5'>
                  <div>
                    <div className='mb-2.5 flex items-baseline justify-between gap-2'>
                      <span className={fieldLabelClass}>题量</span>
                      <span className='text-[11px] text-fg/40'>
                        {INTERVIEW_Q_MIN}–{INTERVIEW_Q_MAX}，默认 {INTERVIEW_Q_DEFAULT}
                      </span>
                    </div>
                    <div
                      className='grid grid-cols-6 gap-1.5 rounded-xl bg-fg/[0.035] p-1.5'
                      role='radiogroup'
                      aria-label='题量'
                    >
                      {Q_OPTIONS.map((n) => {
                        const on = questionCount === n;
                        return (
                          <button
                            key={n}
                            type='button'
                            role='radio'
                            aria-checked={on}
                            onClick={() => setQuestionCount(n)}
                            className={`relative h-10 rounded-lg text-[13px] font-semibold tabular-nums transition-[background-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] motion-reduce:transition-none ${
                              on
                                ? 'bg-[var(--editor-shell-panel-strong)] text-[var(--color-primary)] shadow-[0_6px_16px_rgb(var(--surface-fg-rgb)/0.1),0_0_0_1px_color-mix(in_srgb,var(--color-primary)_28%,transparent)]'
                                : 'text-fg/55 hover:bg-surface/[0.05] hover:text-fg/80'
                            }`}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                    <p className='mt-2 text-[11px] leading-relaxed text-fg/42'>
                      {questionCount <= 6
                        ? '短场：适合开场热身，覆盖核心经历。'
                        : '加长场：适合投递前深挖，覆盖面更广。'}
                    </p>
                  </div>

                  <div>
                    <div className='mb-2.5 flex items-baseline justify-between gap-2'>
                      <span className={fieldLabelClass}>难度</span>
                      <span className='text-[11px] text-fg/40'>横向拖拽或点击标签</span>
                    </div>
                    <DifficultySlider value={difficulty} onChange={setDifficulty} />
                  </div>
                </div>
              </section>

              <div className='flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-[11px] leading-relaxed text-fg/40'>模拟练习，仅供参考，不构成录用评估。</p>
                <button
                  type='button'
                  className={primaryBtnClass}
                  disabled={!ready || busy}
                  onClick={() => void startInterview()}
                >
                  {busy ? (
                    <>
                      <LoadingOutlined spin />
                      出题中…
                    </>
                  ) : (
                    '开始面试'
                  )}
                </button>
              </div>
            </>
          ) : null}

          {phase === 'session' && question ? (
            <section className='space-y-5'>
              <div className='flex items-end justify-between gap-3'>
                <div className='min-w-0 flex-1'>
                  <div className='mb-2 flex items-baseline gap-2'>
                    <span className='text-[20px] font-semibold tabular-nums tracking-[-0.03em] text-fg/92'>
                      {progress.index + 1}
                    </span>
                    <span className='text-[12px] tabular-nums text-fg/40'>/ {progress.total}</span>
                  </div>
                  <div
                    className='flex gap-1'
                    role='progressbar'
                    aria-valuemin={1}
                    aria-valuemax={progress.total}
                    aria-valuenow={progress.index + 1}
                    aria-label='面试进度'
                  >
                    {Array.from({ length: Math.max(progress.total, 1) }, (_, i) => {
                      const done = i < progress.index;
                      const current = i === progress.index;
                      return (
                        <span
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                            current
                              ? 'bg-[var(--color-primary)]'
                              : done
                                ? 'bg-[color-mix(in_srgb,var(--color-primary)_45%,transparent)]'
                                : 'bg-fg/[0.08]'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
                <button
                  type='button'
                  className='shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-rose-400/85 transition-colors hover:bg-rose-400/10 hover:text-rose-400 disabled:opacity-50'
                  onClick={() => void endEarly()}
                  disabled={busy}
                >
                  提前结束
                </button>
              </div>

              <article className='relative overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(165deg,rgb(var(--panel-surface-rgb)/0.1)_0%,rgb(var(--panel-surface-rgb)/0.03)_55%,transparent_100%)] px-5 py-6 shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.06),0_16px_40px_rgb(var(--surface-fg-rgb)/0.06)] md:px-6 md:py-7'>
                <div
                  className='pointer-events-none absolute left-0 top-0 h-full w-[3px] rounded-l-2xl'
                  style={{
                    background:
                      'linear-gradient(180deg, var(--color-primary-gradient-start), var(--color-primary))',
                  }}
                />
                <p className='text-[11px] font-medium leading-snug text-fg/48'>
                  <span className='text-[var(--color-primary)]'>针对</span>
                  <span className='mx-1.5 text-fg/20'>/</span>
                  <span className='text-fg/70'>{question.anchor.label}</span>
                  <span className='ml-1.5 rounded-md bg-fg/[0.05] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-fg/42'>
                    {question.anchor.moduleType}
                  </span>
                </p>
                <p className='mt-4 max-w-[58ch] text-[17px] font-medium leading-[1.65] tracking-[-0.015em] text-fg/93 text-pretty md:text-[18px]'>
                  {question.text}
                </p>
              </article>

              <div
                className={`overflow-hidden rounded-2xl border bg-[var(--panel-inset-bg)] transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  voice.phase === 'recording'
                    ? 'border-rose-400/40 shadow-[0_0_0_3px_color-mix(in_srgb,#fb7185_12%,transparent)]'
                    : 'border-fg/[0.1] focus-within:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]'
                }`}
              >
                <Input.TextArea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  rows={7}
                  maxLength={INTERVIEW_ANSWER_MAX_CHARS}
                  showCount
                  placeholder='语音转写会出现在这里，也可手动微调后再提交'
                  disabled={busy}
                  variant='borderless'
                  className='!bg-transparent !px-4 !py-3.5 !text-[14px] !leading-relaxed !text-fg/90 placeholder:!text-fg/35'
                />
                <div className='flex flex-wrap items-center gap-2 border-t border-fg/[0.06] bg-fg/[0.02] px-3 py-2.5'>
                  <button
                    type='button'
                    onClick={() => voice.toggle()}
                    disabled={busy || voice.phase === 'transcribing'}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-[13px] font-medium transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.98] disabled:opacity-50 motion-reduce:transition-none ${
                      voice.phase === 'recording'
                        ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/35'
                        : 'bg-fg/[0.05] text-fg/70 hover:bg-fg/[0.08] hover:text-fg/90'
                    }`}
                  >
                    <AudioOutlined
                      className={
                        voice.phase === 'recording'
                          ? 'animate-pulse motion-reduce:animate-none'
                          : undefined
                      }
                    />
                    {voice.phase === 'recording'
                      ? '停止录音'
                      : voice.phase === 'transcribing'
                        ? '识别中…'
                        : '语音作答'}
                  </button>
                  <div className='ml-auto flex flex-wrap items-center gap-2'>
                    <button
                      type='button'
                      className='h-10 rounded-xl px-3.5 text-[13px] font-medium text-fg/50 transition-colors hover:bg-fg/[0.06] hover:text-fg/75 disabled:opacity-50'
                      onClick={() => void submitAnswer(true)}
                      disabled={busy}
                    >
                      跳过
                    </button>
                    <button
                      type='button'
                      className={`${primaryBtnClass} !min-w-[120px] !h-10`}
                      disabled={busy}
                      onClick={() => void submitAnswer(false)}
                    >
                      {busy ? (
                        <>
                          <LoadingOutlined spin />
                          提交中…
                        </>
                      ) : (
                        '提交回答'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {phase === 'report' ? (
            <section className='space-y-5'>
              {reportStreaming ? (
                <ReportStatusChip
                  step={!dimensions ? 0 : actionTexts.length > 0 || finalReport ? 2 : 1}
                />
              ) : null}

              <div>
                {dimensions ? (
                  <div className='grid gap-2.5 sm:grid-cols-2'>
                    <DimScore label='与简历一致性' value={dimensions.resumeConsistency} />
                    <DimScore label='细节深度' value={dimensions.detailDepth} />
                    <DimScore label='表达结构' value={dimensions.structure} />
                    <DimScore label='岗位匹配' value={dimensions.roleFit} />
                  </div>
                ) : (
                  <DimScoreSkeleton />
                )}
              </div>

              <article className='relative overflow-hidden rounded-2xl border border-fg/[0.08] bg-[linear-gradient(165deg,rgb(var(--panel-surface-rgb)/0.1)_0%,rgb(var(--panel-surface-rgb)/0.03)_55%,transparent_100%)] px-5 py-6 shadow-[inset_0_1px_0_rgb(var(--panel-surface-rgb)/0.06)] md:px-6'>
                <div
                  className='pointer-events-none absolute left-0 top-0 h-full w-[3px] rounded-l-2xl'
                  style={{
                    background:
                      'linear-gradient(180deg, var(--color-primary-gradient-start), var(--color-primary))',
                  }}
                />
                <h3 className='text-[13px] font-semibold tracking-[-0.01em] text-fg/88'>总评</h3>
                {summary ? (
                  <p className='mt-3 w-full whitespace-pre-wrap text-[15px] leading-[1.7] tracking-[-0.01em] text-fg/88 text-pretty'>
                    {summary}
                    {reportStreaming ? (
                      <span
                        className='ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] animate-pulse bg-[var(--color-primary)] align-baseline motion-reduce:animate-none'
                        aria-hidden
                      />
                    ) : null}
                  </p>
                ) : (
                  <SummarySkeleton />
                )}
              </article>

              {actionTexts.length > 0 || finalReport?.actionItems?.length ? (
                <div>
                  <h3 className='mb-3 text-[13px] font-semibold tracking-[-0.01em] text-fg/88'>改进建议</h3>
                  <ol className='space-y-0 divide-y divide-fg/[0.06] overflow-hidden rounded-2xl border border-fg/[0.08] bg-fg/[0.02]'>
                    {(finalReport?.actionItems?.map((a) => a.text) || actionTexts).map((t, i, arr) => (
                      <li key={i} className='flex gap-3 px-4 py-3.5'>
                        <span className='mt-0.5 w-5 shrink-0 text-[12px] font-semibold tabular-nums text-[var(--color-primary)]'>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className='min-w-0 text-[13px] leading-relaxed text-fg/80 text-pretty'>
                          {t}
                          {reportStreaming && !finalReport && i === arr.length - 1 ? (
                            <span
                              className='ml-0.5 inline-block h-[1em] w-[2px] translate-y-[1px] animate-pulse bg-[var(--color-primary)] align-baseline motion-reduce:animate-none'
                              aria-hidden
                            />
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : reportStreaming ? (
                <ActionsSkeleton />
              ) : null}

              {finalReport?.inconsistencies?.length ? (
                <div className='rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-4'>
                  <h3 className='text-[13px] font-semibold text-amber-200/90'>与简历不一致</h3>
                  <ul className='mt-2.5 space-y-2'>
                    {finalReport.inconsistencies.map((t, i) => (
                      <li key={i} className='text-[13px] leading-relaxed text-fg/72 text-pretty'>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className='flex flex-col gap-2 border-t border-fg/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-[11px] leading-relaxed text-fg/40'>模拟练习，仅供参考，不构成录用评估。</p>
                <button
                  type='button'
                  className={`${primaryBtnClass} sm:shrink-0`}
                  onClick={requestLeaveInterview}
                  disabled={reportStreaming}
                >
                  {reportStreaming ? (
                    <>
                      <LoadingOutlined spin />
                      生成中…
                    </>
                  ) : (
                    '再练一次'
                  )}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
});
