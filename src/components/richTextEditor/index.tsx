import { message } from 'antd';
import { useMemoizedFn } from 'ahooks';
import Quill from 'quill';
import { memo, useEffect, useRef, useState } from 'react';
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

/** 默认可编辑纯文本上限（段落类模块可传 maxPlainLength 覆盖） */
export const RICH_TEXT_MAX_PLAIN_LENGTH = 300;
/** 专业技能 / 个人优势等长段落模块上限 */
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
const TOOLBAR_BTN_ZH: Record<string, string> = {
  bold: '粗体',
  italic: '斜体',
  underline: '下划线',
  strike: '删除线',
  link: '插入链接',
};
function localizeQuillSnowToolbar(toolbarEl: Element) {
  toolbarEl.querySelectorAll('button').forEach((btn) => {
    const ql = Array.from(btn.classList).find((c) => c.startsWith('ql-') && c !== 'ql-active');
    if (!ql) return;
    const key = ql.slice('ql-'.length);
    let zh = TOOLBAR_BTN_ZH[key];
    if (key === 'list') {
      zh = btn.getAttribute('value') === 'ordered' ? '有序列表' : '无序列表';
    }
    if (zh) {
      btn.setAttribute('aria-label', zh);
      btn.setAttribute('title', zh);
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
  /** 点击 AI 润色时调用；ctx.onStreamingHtml 可流式写入当前累积 HTML；返回最终 HTML（会再走 sanitize 并写回编辑器） */
  onAiPolishClick?: (richTextHtml: string, ctx?: AiPolishStreamContext) => Promise<string>;
  maxPlainLength?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onHtmlChangeRef = useRef(onHtmlChange);
  onHtmlChangeRef.current = onHtmlChange;
  const [polishing, setPolishing] = useState(false);
  const [plainCount, setPlainCount] = useState(0);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    el.innerHTML = '';

    const q = new Quill(el, {
      theme: 'snow',
      placeholder: placeholder ?? '请输入内容',
      modules: {
        toolbar: {
          container: [...DEFAULT_QUILL_TOOLBAR_ROWS],
        },
      },
    });
    quillRef.current = q;
    const tb = el.previousElementSibling;
    if (tb?.classList.contains('ql-toolbar')) localizeQuillSnowToolbar(tb);
    const tipInput = el.querySelector('.ql-tooltip input[type="text"]');
    if (tipInput)
      tipInput.setAttribute(
        'data-link',
        '完整地址即可跳转任意网站（如 https://github.com/user/repo）',
      );

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
      // 数组型 toolbar 会 insertBefore 到 quill.container 之前，仅清空 innerHTML 不会删掉工具栏；
      // Strict Mode 下会重复挂载，若不移除则会出现多个 .ql-toolbar.ql-snow。
      let prev = el.previousElementSibling;
      while (prev?.classList.contains('ql-toolbar')) {
        const toRemove = prev;
        prev = prev.previousElementSibling;
        toRemove.remove();
      }
      el.innerHTML = '';
    };
  }, [instanceKey, maxPlainLength]);

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
    const richTextHtml = sanitizeRichTextHtml(q.root.innerHTML);
    const plain = richTextHtml.replace(/<[^>]*>/g, '').trim();
    if (!plain) {
      message.warning('请先输入内容');
      return;
    }
    if (!onAiPolishClick) {
      message.info('AI 润色接口接入后即可使用');
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
      message.success('润色完成');
    } catch (e) {
      const errText =
        e instanceof Error && e.message?.trim()
          ? e.message.trim()
          : '润色失败，请稍后重试';
      message.error(errText);
    } finally {
      setPolishing(false);
    }
  });

  return (
    <div className="min-w-0">
      <div className="relative min-w-0">
        <div className={styles.host}>
          <div ref={hostRef} className="min-w-0" />
        </div>
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
            <span>AI生成中...</span>
          </div>
        ) : null}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-neutral-400">
        <span aria-live="polite">
          {plainCount}/{maxPlainLength}
        </span>
      </div>
      <div className="mt-2 flex justify-end">
        <div
          role="button"
          tabIndex={polishing ? -1 : 0}
          aria-busy={polishing}
          aria-disabled={polishing}
          onClick={() => {
            if (!polishing) void runAiPolishFromParent();
          }}
          onKeyDown={(e) => {
            if (polishing) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              void runAiPolishFromParent();
            }
          }}
          className={
            'bg-gradient-primary inline-flex cursor-pointer select-none items-center gap-1 rounded-md px-3 py-1 text-xs font-medium text-white shadow-md text-[11px]' +
            'outline-none transition-[filter,opacity] hover:brightness-110 ' +
            (polishing ? 'pointer-events-none opacity-65' : '')
          }
        >
          {polishing ? (
            <span
              className="inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-white/35 border-t-white"
              aria-hidden
            />
          ) : (
            <Magic theme="outline" size="13" fill="#fff"/>
          )}
          AI润色
        </div>
      </div>
    </div>
  );
}

export default memo(RichTextEditor);
