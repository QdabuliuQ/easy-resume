'use client';
import { useAppMessage } from '@/hooks/useAppMessage';
import { useMemoizedFn } from 'ahooks';
import { useLocale, useTranslations } from 'next-intl';
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { plainTextFromRichHtml, sanitizeRichTextHtml, unwrapFencedHtml } from '@/utils/sanitizeHtml';
import { MIN_POLISH_PLAIN_LENGTH } from '@/lib/ai/polish/types';
import 'quill/dist/quill.snow.css';
import '@/styles/resumeQuillContent.css';
import { Robot, RotatingForward } from '@icon-park/react';
import aiIcon from '@/assets/AI.svg';
import { uiHints } from '@/lib/uiHintStorage';
import styles from './index.module.css';

type QuillType = any;

let quillCtorPromise: Promise<QuillType> | null = null;

async function loadQuillCtor(): Promise<QuillType> {
  if (!quillCtorPromise) {
    quillCtorPromise = import('quill').then((mod) => {
      const QuillCtor = mod.default;
      const LinkFormat = QuillCtor.import('formats/link') as {
        PROTOCOL_WHITELIST: string[];
      };
      for (const p of ['ftp', 'ftps'] as const) {
        if (!LinkFormat.PROTOCOL_WHITELIST.includes(p)) {
          LinkFormat.PROTOCOL_WHITELIST.push(p);
        }
      }
      return QuillCtor;
    });
  }
  return quillCtorPromise;
}

export const RICH_TEXT_MAX_PLAIN_LENGTH = 800;

function getQuillPlainCharCount(q: QuillType): number {
  const L = q.getLength();
  return L > 0 ? L - 1 : 0;
}

function clampQuillPlainLength(q: QuillType, max: number) {
  const n = getQuillPlainCharCount(q);
  if (n <= max) return;
  q.deleteText(max, n - max, 'silent');
}

export type AiPolishStreamContext = {
  onStreamingHtml?: (htmlSoFar: string) => void;
  signal?: AbortSignal;
};

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

function mergeRichHtml(base: string, addition: string): string {
  const b = sanitizeRichTextHtml(base);
  const a = sanitizeRichTextHtml(addition);
  if (!b) return a;
  if (!a) return b;
  return `${b}<p><br></p>${a}`;
}

function QuillHtmlPreview({ html, className = '' }: { html: string; className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillType | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let disposed = false;

    void (async () => {
      const QuillCtor = await loadQuillCtor();
      if (disposed) return;
      if (!quillRef.current) {
        quillRef.current = new QuillCtor(el, {
          theme: 'snow',
          readOnly: true,
          modules: { toolbar: false },
        });
      }
      const q = quillRef.current;
      const sanitized = sanitizeRichTextHtml(html);
      if (!sanitized) {
        q.setText('');
        return;
      }
      try {
        const delta = q.clipboard.convert({ html: sanitized });
        q.setContents(delta, 'silent');
      } catch {
        q.root.innerHTML = sanitized;
      }
    })();

    return () => {
      disposed = true;
    };
  }, [html]);

  useEffect(() => {
    const el = hostRef.current;
    return () => {
      quillRef.current = null;
      if (el) el.innerHTML = '';
    };
  }, []);

  return (
    <div className={`resume-quill-embed min-w-0 ${className}`.trim()}>
      <div ref={hostRef} className="min-w-0" />
    </div>
  );
}
export const DEFAULT_QUILL_TOOLBAR_ROWS = [
  [
    'bold',
    'italic',
    'underline',
    'strike',
    { color: [] },
    'link',
    { list: 'ordered' },
    { list: 'bullet' },
  ],
] as const;

type ToolbarTrKey =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'color'
  | 'link'
  | 'listOrdered'
  | 'listBullet';

const QL_TO_TR: Partial<Record<string, ToolbarTrKey>> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strike: 'strike',
  color: 'color',
  link: 'link',
};

function localizeQuillSnowToolbar(toolbarEl: Element, tr: (key: ToolbarTrKey) => string) {
  toolbarEl.querySelectorAll('button').forEach((btn) => {
    const ql = Array.from(btn.classList).find((c) => c.startsWith('ql-') && c !== 'ql-active');
    if (!ql) return;
    const key = ql.slice('ql-'.length);
    let label: string | undefined;
    if (key === 'list') {
      label = btn.getAttribute('value') === 'ordered' ? tr('listOrdered') : tr('listBullet');
    } else {
      const tk = QL_TO_TR[key];
      if (tk) label = tr(tk);
    }
    if (label) {
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
    }
  });
  toolbarEl.querySelectorAll('select').forEach((sel) => {
    const ql = Array.from(sel.classList).find((c) => c.startsWith('ql-'));
    if (!ql) return;
    const key = ql.slice('ql-'.length);
    const tk = QL_TO_TR[key];
    if (!tk) return;
    const label = tr(tk);
    sel.setAttribute('aria-label', label);
    sel.setAttribute('title', label);
  });
}

function pastePlainTextAtSelection(
  q: QuillType,
  range: { index: number; length: number },
  text: string,
) {
  const normalized = text.replace(/\r\n/g, '\n');
  if (!normalized) return;
  q.deleteText(range.index, range.length, 'user');
  q.insertText(range.index, normalized, {}, 'user');
  const nextIndex = range.index + normalized.length;
  q.setSelection(nextIndex, 0, 'silent');
  q.scrollSelectionIntoView();
}

function bindPlainTextPaste(q: QuillType): () => void {
  const clipboard = q.getModule('clipboard');
  const onPaste = (e: ClipboardEvent) => {
    if (e.defaultPrevented || !q.isEnabled()) return;
    e.preventDefault();
    e.stopPropagation();
    const range = q.getSelection(true);
    if (range == null) return;
    const html = e.clipboardData?.getData('text/html') ?? '';
    let text = e.clipboardData?.getData('text/plain') ?? '';
    if (!text && html) text = plainTextFromRichHtml(html);
    if (!text && clipboard) {
      const urlList = e.clipboardData?.getData('text/uri-list');
      if (urlList) text = clipboard.normalizeURIList(urlList);
    }
    if (!text) return;
    pastePlainTextAtSelection(q, range, text);
  };
  // Quill 构造时已 bind onCapturePaste，改属性无效；capture 阶段先于其 bubble 监听
  q.root.addEventListener('paste', onPaste, true);
  return () => q.root.removeEventListener('paste', onPaste, true);
}

function RichTextEditor({
  instanceKey,
  html,
  onHtmlChange,
  placeholder,
  onAiPolishClick,
  maxPlainLength = RICH_TEXT_MAX_PLAIN_LENGTH,
  dataPanelItemId,
}: {
  instanceKey: string;
  html: string;
  onHtmlChange: (next: string) => void;
  placeholder?: string;
  onAiPolishClick?: (richTextHtml: string, ctx?: AiPolishStreamContext) => Promise<string>;
  maxPlainLength?: number;
  dataPanelItemId?: string;
}) {
  const message = useAppMessage();
  const tr = useTranslations('Edit.richText');
  const locale = useLocale();
  const hostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillType | null>(null);
  const onHtmlChangeRef = useRef(onHtmlChange);
  const lastAppliedHtmlRef = useRef('');
  const pendingPolishHtmlRef = useRef('');
  const streamRafRef = useRef<number | null>(null);
  const polishAbortRef = useRef<AbortController | null>(null);
  onHtmlChangeRef.current = onHtmlChange;
  const [polishing, setPolishing] = useState(false);
  const [polishResultHtml, setPolishResultHtml] = useState('');
  const [plainCount, setPlainCount] = useState(0);
  const [loadingEditor, setLoadingEditor] = useState(true);
  const [toolbarHeight, setToolbarHeight] = useState(39);
  const [showAiPolishHint, setShowAiPolishHint] = useState(false);
  useEffect(() => {
    setShowAiPolishHint(!uiHints.aiPolishBtn.isDismissed());
  }, []);

  const tipCssVars = useMemo(() => {
    const q = JSON.stringify;
    return {
      '--rte-q-tip-visit': q(tr('tooltipVisitLink')),
      '--rte-q-tip-formula': q(tr('tooltipFormula')),
      '--rte-q-tip-video': q(tr('tooltipVideo')),
      '--rte-q-tip-edit': q(tr('tooltipEdit')),
      '--rte-q-tip-save': q(tr('tooltipSave')),
      '--rte-q-tip-remove': q(tr('tooltipRemove')),
    } as CSSProperties;
  }, [tr]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    el.innerHTML = '';
    setLoadingEditor(true);
    let disposed = false;
    let unbindPlainPaste: (() => void) | undefined;

    void (async () => {
      const QuillCtor = await loadQuillCtor();
      if (disposed) return;

      const q = new QuillCtor(el, {
        theme: 'snow',
        bounds: el.parentElement ?? undefined,
        placeholder: placeholder ?? tr('placeholderDefault'),
        modules: {
          toolbar: {
            container: [...DEFAULT_QUILL_TOOLBAR_ROWS],
          },
        },
      });
      quillRef.current = q;
      unbindPlainPaste = bindPlainTextPaste(q);
      const tb = el.previousElementSibling;
      if (tb?.classList.contains('ql-toolbar')) localizeQuillSnowToolbar(tb, tr);
      const tipInput = el.querySelector('.ql-tooltip input[type="text"]');
      if (tipInput) tipInput.setAttribute('data-link', tr('linkHint'));

      const initial = sanitizeRichTextHtml(html ?? '');
      if (initial) {
        try {
          const delta = q.clipboard.convert({ html: initial });
          q.setContents(delta, 'silent');
        } catch {
          q.root.innerHTML = initial;
        }
      }
      const beforeClamp = sanitizeRichTextHtml(q.root.innerHTML);
      clampQuillPlainLength(q, maxPlainLength);
      const afterClamp = sanitizeRichTextHtml(q.root.innerHTML);
      lastAppliedHtmlRef.current = afterClamp;
      setPlainCount(getQuillPlainCharCount(q));
      if (beforeClamp !== afterClamp) {
        onHtmlChangeRef.current(afterClamp);
      }

      const onTextChange = () => {
        clampQuillPlainLength(q, maxPlainLength);
        setPlainCount(getQuillPlainCharCount(q));
        const safeHtml = sanitizeRichTextHtml(q.root.innerHTML);
        lastAppliedHtmlRef.current = safeHtml;
        onHtmlChangeRef.current(safeHtml);
      };
      q.on('text-change', onTextChange);
      setLoadingEditor(false);

      const toolbar = el.previousElementSibling;
      if (toolbar instanceof HTMLElement && toolbar.classList.contains('ql-toolbar')) {
        setToolbarHeight(toolbar.getBoundingClientRect().height - 1);
      }

      if (disposed) {
        q.off('text-change', onTextChange);
        quillRef.current = null;
        let prev = el.previousElementSibling;
        while (prev?.classList.contains('ql-toolbar')) {
          const toRemove = prev;
          prev = prev.previousElementSibling;
          toRemove.remove();
        }
        el.innerHTML = '';
      }
    })();

    return () => {
      disposed = true;
      unbindPlainPaste?.();
      quillRef.current = null;
      let prev = el.previousElementSibling;
      while (prev?.classList.contains('ql-toolbar')) {
        const toRemove = prev;
        prev = prev.previousElementSibling;
        toRemove.remove();
      }
      el.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- omit html/tr: syncing html here would reset editor every keystroke
  }, [instanceKey, maxPlainLength, locale]);

  useEffect(() => {
    return () => {
      polishAbortRef.current?.abort();
      if (streamRafRef.current != null) {
        cancelAnimationFrame(streamRafRef.current);
        streamRafRef.current = null;
      }
    };
  }, []);

  const applyHtmlToQuill = useMemoizedFn((
    q: QuillType,
    nextHtml: string,
    options?: { commit?: boolean; force?: boolean },
  ) => {
    const sanitized = sanitizeRichTextHtml(nextHtml);
    if (sanitized === lastAppliedHtmlRef.current && !options?.force) return;
    if (sanitized) {
      try {
        const delta = q.clipboard.convert({ html: sanitized });
        q.setContents(delta, 'silent');
      } catch {
        q.root.innerHTML = sanitized;
      }
    } else {
      q.setText('');
    }
    clampQuillPlainLength(q, maxPlainLength);
    const currentSafeHtml = sanitizeRichTextHtml(q.root.innerHTML);
    lastAppliedHtmlRef.current = currentSafeHtml;
    setPlainCount(getQuillPlainCharCount(q));
    if (options?.commit ?? true) {
      onHtmlChangeRef.current(currentSafeHtml);
    }
  });

  useEffect(() => {
    const q = quillRef.current;
    if (!q) return;
    const incoming = sanitizeRichTextHtml(html ?? '');
    const current = sanitizeRichTextHtml(q.root.innerHTML);
    if (incoming === current) {
      lastAppliedHtmlRef.current = current;
      return;
    }
    applyHtmlToQuill(q, incoming, { commit: false });
  }, [html, applyHtmlToQuill]);

  const enqueuePolishPreviewHtml = useMemoizedFn((htmlSoFar: string) => {
    pendingPolishHtmlRef.current = sanitizeRichTextHtml(unwrapFencedHtml(htmlSoFar));
    if (streamRafRef.current != null) return;
    streamRafRef.current = requestAnimationFrame(() => {
      streamRafRef.current = null;
      setPolishResultHtml(pendingPolishHtmlRef.current);
    });
  });

  const clearPolishPanel = useMemoizedFn(() => {
    setPolishResultHtml('');
    pendingPolishHtmlRef.current = '';
  });

  const cancelAiPolish = useMemoizedFn(() => {
    polishAbortRef.current?.abort();
  });

  const applyPolishReplace = useMemoizedFn(() => {
    const q = quillRef.current;
    if (!q || !polishResultHtml) return;
    applyHtmlToQuill(q, polishResultHtml, { commit: true });
    clearPolishPanel();
  });

  const applyPolishAppend = useMemoizedFn(() => {
    const q = quillRef.current;
    if (!q || !polishResultHtml) return;
    const merged = mergeRichHtml(q.root.innerHTML, polishResultHtml);
    applyHtmlToQuill(q, merged, { commit: true });
    clearPolishPanel();
  });

  const runAiPolishFromParent = useMemoizedFn(async () => {
    const q = quillRef.current;
    if (!q || polishing) return;
    if (!navigator.onLine) {
      message.warning(tr('offlineNeedNetworkBackupJson'));
      return;
    }
    const richTextHtml = sanitizeRichTextHtml(q.root.innerHTML);
    if (plainCount < MIN_POLISH_PLAIN_LENGTH) {
      message.warning(tr('needContentMinLengthWarn', { min: MIN_POLISH_PLAIN_LENGTH }));
      return;
    }
    if (!onAiPolishClick) {
      message.info(tr('aiPendingInfo'));
      return;
    }
    polishAbortRef.current?.abort();
    const abortController = new AbortController();
    polishAbortRef.current = abortController;
    pendingPolishHtmlRef.current = '';
    setPolishResultHtml('');
    setPolishing(true);
    try {
      const polished = await onAiPolishClick(richTextHtml, {
        signal: abortController.signal,
        onStreamingHtml: enqueuePolishPreviewHtml,
      });
      if (streamRafRef.current != null) {
        cancelAnimationFrame(streamRafRef.current);
        streamRafRef.current = null;
      }
      const finalHtml = sanitizeRichTextHtml(unwrapFencedHtml(polished));
      pendingPolishHtmlRef.current = finalHtml;
      setPolishResultHtml(finalHtml);
    } catch (e) {
      if (streamRafRef.current != null) {
        cancelAnimationFrame(streamRafRef.current);
        streamRafRef.current = null;
      }
      if (isAbortError(e)) {
        if (pendingPolishHtmlRef.current) {
          setPolishResultHtml(pendingPolishHtmlRef.current);
        } else {
          clearPolishPanel();
        }
        return;
      }
      clearPolishPanel();
      const errText =
        e instanceof Error && e.message?.trim()
          ? e.message.trim()
          : tr('polishFail');
      message.error(errText);
    } finally {
      if (polishAbortRef.current === abortController) {
        polishAbortRef.current = null;
      }
      setPolishing(false);
    }
  });

  const showPolishPanel = polishing || !!polishResultHtml;

  return (
    <div className="min-w-0" data-panel-item-id={dataPanelItemId}>
      <div className="relative min-w-0">
        <div className={`${styles.host} rte-quill-sync`} style={tipCssVars}>
          <div ref={hostRef} className="min-w-0" />
          {onAiPolishClick && !loadingEditor ? (
            <button
              type="button"
              aria-busy={polishing}
              disabled={polishing || plainCount < MIN_POLISH_PLAIN_LENGTH}
              onClick={() => {
                if (showAiPolishHint) {
                  uiHints.aiPolishBtn.dismiss();
                  setShowAiPolishHint(false);
                }
                if (!polishing) void runAiPolishFromParent();
              }}
              style={{ top: Math.max(0, (toolbarHeight - 26) / 2 + 1) }}
              className={
                `${styles.aiPolishBtn}${showAiPolishHint && !polishing ? ` ${styles.aiPolishBtnHint}` : ''} inline-flex h-[26px] cursor-pointer select-none items-center gap-1 rounded-md px-4 text-[11px] font-medium text-white ` +
                'outline-none transition-[filter,opacity] disabled:pointer-events-none disabled:opacity-65'
              }
            >
              {polishing ? (
                <span
                  className="inline-block size-3 shrink-0 animate-spin rounded-full border-2 border-white/35 border-t-white"
                  aria-hidden
                />
              ) : (
                <img src={aiIcon.src} alt="" className="size-2.5 shrink-0" aria-hidden />
              )}
              <span className="leading-none font-bold text-[12px]">{tr('aiPolish')}</span>
            </button>
          ) : null}
        </div>
        {loadingEditor ? (
          <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center rounded-md bg-neutral-900/12 text-[12px] text-fg/70">
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-fg/25 border-t-[color:var(--color-primary)]" />
          </div>
        ) : null}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-neutral-400">
        <span aria-live="polite">
          {plainCount}/{maxPlainLength}
        </span>
      </div>
      {showPolishPanel ? (
        <div
          className={`${styles.polishPanel} mt-2 rounded-lg px-3 py-2.5`}
          role="region"
          aria-live="polite"
          aria-label={tr('aiPolish')}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            {polishing ? (
              <div className={`flex min-w-0 flex-1 items-center gap-1.5 text-[13px] font-medium ${styles.polishAccentText}`}>
                <span
                  className={`inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 ${styles.polishSpinner}`}
                  aria-hidden
                />
                <span>{tr('aiGenerating')}</span>
              </div>
            ) : (
              <div className={`flex min-w-0 items-center gap-1.5 text-[13px] font-medium ${styles.polishAccentText}`}>
                <Robot theme="filled" size="16" fill="currentColor" />
                <span>{tr('polishSuccess')}</span>
              </div>
            )}
            {polishing ? (
              <button
                type="button"
                onClick={cancelAiPolish}
                className={`inline-flex h-6 shrink-0 cursor-pointer select-none items-center rounded-md px-2.5 text-[12px] font-medium outline-none transition-[background-color,border-color] ${styles.polishCancelBtn}`}
              >
                {tr('aiCancel')}
              </button>
            ) : null}
          </div>
          {polishResultHtml ? (
            <div className={`${styles.polishPreview} ${styles.polishPreviewBox} mb-2 max-h-[240px] overflow-y-auto rounded-md px-3 py-2`}>
              <QuillHtmlPreview html={polishResultHtml} />
            </div>
          ) : null}
          {!polishing && polishResultHtml ? (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <button
                  type="button"
                  disabled={polishing}
                  onClick={() => {
                    if (!polishing) void runAiPolishFromParent();
                  }}
                  className={`inline-flex cursor-pointer select-none items-center gap-1 border-0 bg-transparent p-0 text-[12px] font-medium outline-none transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 ${styles.polishRepolishBtn}`}
                >
                  <RotatingForward theme="outline" size="14" fill="currentColor" />
                  {tr('polishRepolish')}
                </button>
                <span className={`text-[11px] ${styles.polishDisclaimer}`}>{tr('polishDisclaimer')}</span>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={applyPolishAppend}
                  className={`inline-flex h-7 cursor-pointer select-none items-center rounded-md px-3 text-[11px] font-medium outline-none transition-[background-color,border-color] ${styles.polishAppendBtn}`}
                >
                  {tr('polishAppend')}
                </button>
                <button
                  type="button"
                  onClick={applyPolishReplace}
                  className={`${styles.polishReplaceBtn} inline-flex h-7 cursor-pointer select-none items-center rounded-md px-3 text-[11px] font-medium text-white outline-none transition-[filter]`}
                >
                  {tr('polishReplace')}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default memo(RichTextEditor);
