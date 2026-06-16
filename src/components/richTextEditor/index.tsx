'use client';
import { useAppMessage } from '@/hooks/useAppMessage';
import { useMemoizedFn } from 'ahooks';
import { useLocale, useTranslations } from 'next-intl';
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { sanitizeRichTextHtml, unwrapFencedHtml } from '@/utils/sanitizeHtml';
import 'quill/dist/quill.snow.css';
import { Magic } from '@icon-park/react';
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

export const RICH_TEXT_MAX_PLAIN_LENGTH = 300;
export const RICH_TEXT_LONG_BODY_MAX_PLAIN_LENGTH = 2000;

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
};
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
  const pendingStreamHtmlRef = useRef<string | null>(null);
  const streamRafRef = useRef<number | null>(null);
  const lastStreamCommitAtRef = useRef(0);
  onHtmlChangeRef.current = onHtmlChange;
  const [polishing, setPolishing] = useState(false);
  const [plainCount, setPlainCount] = useState(0);
  const [loadingEditor, setLoadingEditor] = useState(true);
  const [toolbarHeight, setToolbarHeight] = useState(39);

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

    void (async () => {
      const QuillCtor = await loadQuillCtor();
      if (disposed) return;

      const q = new QuillCtor(el, {
        theme: 'snow',
        placeholder: placeholder ?? tr('placeholderDefault'),
        modules: {
          toolbar: {
            container: [...DEFAULT_QUILL_TOOLBAR_ROWS],
          },
        },
      });
      quillRef.current = q;
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
      setPlainCount(getQuillPlainCharCount(q));
      if (beforeClamp !== afterClamp) {
        onHtmlChangeRef.current(afterClamp);
      }

      const onTextChange = () => {
        clampQuillPlainLength(q, maxPlainLength);
        setPlainCount(getQuillPlainCharCount(q));
        onHtmlChangeRef.current(sanitizeRichTextHtml(q.root.innerHTML));
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
    const q = quillRef.current;
    if (!q) return;
    q.enable(!polishing);
  }, [polishing]);

  useEffect(() => {
    return () => {
      if (streamRafRef.current != null) {
        cancelAnimationFrame(streamRafRef.current);
        streamRafRef.current = null;
      }
    };
  }, []);

  const applyHtmlToQuill = useMemoizedFn((
    q: QuillType,
    nextHtml: string,
    options?: { commit?: boolean },
  ) => {
    const sanitized = sanitizeRichTextHtml(nextHtml);
    if (sanitized === lastAppliedHtmlRef.current) return;
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

  const flushStreamingHtml = useMemoizedFn((q: QuillType) => {
    streamRafRef.current = null;
    const pending = pendingStreamHtmlRef.current;
    if (pending == null) return;
    pendingStreamHtmlRef.current = null;
    const now = Date.now();
    const shouldCommit = now - lastStreamCommitAtRef.current >= 300;
    applyHtmlToQuill(q, pending, { commit: shouldCommit });
    if (shouldCommit) {
      lastStreamCommitAtRef.current = now;
    }
  });

  const enqueueStreamingHtml = useMemoizedFn((q: QuillType, htmlSoFar: string) => {
    pendingStreamHtmlRef.current = htmlSoFar;
    if (streamRafRef.current != null) return;
    streamRafRef.current = requestAnimationFrame(() => {
      flushStreamingHtml(q);
    });
  });

  const runAiPolishFromParent = useMemoizedFn(async () => {
    const q = quillRef.current;
    if (!q || polishing) return;
    if (!navigator.onLine) {
      message.warning(tr('offlineNeedNetworkBackupJson'));
      return;
    }
    const richTextHtml = sanitizeRichTextHtml(q.root.innerHTML);
    const plain = richTextHtml.replace(/<[^>]*>/g, '').trim();
    if (!plain) {
      message.warning(tr('needContentWarn'));
      return;
    }
    if (!onAiPolishClick) {
      message.info(tr('aiPendingInfo'));
      return;
    }
    setPolishing(true);
    q.enable(false);
    lastStreamCommitAtRef.current = 0;
    try {
      const polished = await onAiPolishClick(richTextHtml, {
        onStreamingHtml: (htmlSoFar) => {
          enqueueStreamingHtml(q, unwrapFencedHtml(htmlSoFar));
        },
      });
      if (streamRafRef.current != null) {
        cancelAnimationFrame(streamRafRef.current);
        streamRafRef.current = null;
      }
      pendingStreamHtmlRef.current = null;
      applyHtmlToQuill(q, polished, { commit: true });
      message.success(tr('polishOk'));
    } catch (e) {
      const errText =
        e instanceof Error && e.message?.trim()
          ? e.message.trim()
          : tr('polishFail');
      message.error(errText);
    } finally {
      setPolishing(false);
    }
  });

  return (
    <div className="min-w-0" data-panel-item-id={dataPanelItemId}>
      <div className="relative min-w-0">
        <div className={styles.host} style={tipCssVars}>
          <div ref={hostRef} className="min-w-0" />
        </div>
        {loadingEditor ? (
          <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center rounded-md bg-neutral-900/12 text-[12px] text-fg/70">
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-fg/25 border-t-[color:var(--color-primary)]" />
          </div>
        ) : null}
        {onAiPolishClick ? (
          <button
            type="button"
            aria-busy={polishing}
            disabled={polishing || loadingEditor || plainCount === 0}
            onClick={() => {
              if (!polishing) void runAiPolishFromParent();
            }}
            style={{ top: Math.max(0, (toolbarHeight - 26) / 2) }}
            className={
              'bg-gradient-primary absolute right-2 z-[4] inline-flex h-[26px] cursor-pointer select-none items-center gap-1 rounded-md px-2.5 text-[11px] font-medium text-white shadow-sm ' +
              'outline-none transition-[filter,opacity] hover:brightness-110 disabled:pointer-events-none disabled:opacity-65'
            }
          >
            {polishing ? (
              <span
                className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-white/35 border-t-white"
                aria-hidden
              />
            ) : (
              <Magic theme="outline" size="13" fill="#fff" />
            )}
            <span className='leading-[12px]'>{tr('aiPolish')}</span>
          </button>
        ) : null}
        {polishing ? (
          <div
            className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 rounded-md bg-neutral-900/55 text-[13px] font-medium text-white/95"
            role="status"
            aria-live="polite"
          >
            <span
              className="inline-block size-7 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
              aria-hidden
            />
            <span>{tr('aiGenerating')}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-neutral-400">
        <span aria-live="polite">
          {plainCount}/{maxPlainLength}
        </span>
      </div>
    </div>
  );
}

export default memo(RichTextEditor);
