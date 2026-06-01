'use client';
import { useAppMessage } from '@/hooks/useAppMessage';
import { useMemoizedFn } from 'ahooks';
import { useLocale, useTranslations } from 'next-intl';
import Quill from 'quill';
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { sanitizeRichTextHtml, unwrapFencedHtml } from '@/utils/sanitizeHtml';
import 'quill/dist/quill.snow.css';
import { Magic } from '@icon-park/react';
import styles from './index.module.css';

const LinkFormat = Quill.import('formats/link') as { PROTOCOL_WHITELIST: string[] };
for (const p of ['ftp', 'ftps'] as const) {
  if (!LinkFormat.PROTOCOL_WHITELIST.includes(p)) {
    LinkFormat.PROTOCOL_WHITELIST.push(p);
  }
}

export const RICH_TEXT_MAX_PLAIN_LENGTH = 300;
export const RICH_TEXT_LONG_BODY_MAX_PLAIN_LENGTH = 2000;

function getQuillPlainCharCount(q: Quill): number {
  const L = q.getLength();
  return L > 0 ? L - 1 : 0;
}

function clampQuillPlainLength(q: Quill, max: number) {
  const n = getQuillPlainCharCount(q);
  if (n <= max) return;
  q.deleteText(max, n - max, Quill.sources.SILENT);
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
    'link',
    { list: 'ordered' },
    { list: 'bullet' },
  ],
] as const;

type ToolbarTrKey = 'bold' | 'italic' | 'underline' | 'strike' | 'link' | 'listOrdered' | 'listBullet';

const QL_TO_TR: Partial<Record<string, ToolbarTrKey>> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strike: 'strike',
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
}

function RichTextEditor({
  instanceKey,
  html,
  onHtmlChange,
  placeholder,
  onAiPolishClick,
  maxPlainLength = RICH_TEXT_MAX_PLAIN_LENGTH,
}: {
  instanceKey: string;
  html: string;
  onHtmlChange: (next: string) => void;
  placeholder?: string;
  onAiPolishClick?: (richTextHtml: string, ctx?: AiPolishStreamContext) => Promise<string>;
  maxPlainLength?: number;
}) {
  const message = useAppMessage();
  const tr = useTranslations('Edit.richText');
  const locale = useLocale();
  const hostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onHtmlChangeRef = useRef(onHtmlChange);
  onHtmlChangeRef.current = onHtmlChange;
  const [polishing, setPolishing] = useState(false);
  const [plainCount, setPlainCount] = useState(0);

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

    const q = new Quill(el, {
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

    return () => {
      quillRef.current = null;
      q.off('text-change', onTextChange);
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

  const applyHtmlToQuill = useMemoizedFn((q: Quill, nextHtml: string) => {
    const sanitized = sanitizeRichTextHtml(nextHtml);
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
    setPlainCount(getQuillPlainCharCount(q));
    onHtmlChangeRef.current(sanitizeRichTextHtml(q.root.innerHTML));
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
    try {
      const polished = await onAiPolishClick(richTextHtml, {
        onStreamingHtml: (htmlSoFar) => {
          applyHtmlToQuill(q, unwrapFencedHtml(htmlSoFar));
        },
      });
      applyHtmlToQuill(q, polished);
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
    <div className="min-w-0">
      <div className="relative min-w-0">
        <div className={styles.host} style={tipCssVars}>
          <div ref={hostRef} className="min-w-0" />
        </div>
        {onAiPolishClick ? (
          <button
            type="button"
            aria-busy={polishing}
            disabled={polishing}
            onClick={() => {
              if (!polishing) void runAiPolishFromParent();
            }}
            className={
              'bg-gradient-primary absolute right-2 top-[7px] z-[4] inline-flex h-[26px] cursor-pointer select-none items-center gap-1 rounded-md px-2.5 text-[11px] font-medium text-white shadow-sm ' +
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
            {tr('aiPolish')}
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
