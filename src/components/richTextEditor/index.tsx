import { ThunderboltOutlined } from '@ant-design/icons';
import { message } from 'antd';
import { useMemoizedFn } from 'ahooks';
import Quill from 'quill';
import { memo, useEffect, useRef, useState } from 'react';
import { sanitizeRichTextHtml } from '@/utils/sanitizeHtml';
import 'quill/dist/quill.snow.css';

/** 直接使用 Quill，避免 react-quill 依赖 ReactDOM.findDOMNode（React 19 已移除） */

const quillHostClass =
  'min-w-0 overflow-hidden rounded-md border border-white/[0.08] ' +
  '[&_.ql-toolbar.ql-snow]:![border-color:#2d2d2d] ' +
  '[&_.ql-container]:!rounded-none [&_.ql-container]:rounded-b-md [&_.ql-container]:!border-0 [&_.ql-container]:border-t [&_.ql-container]:border-white/10 [&_.ql-container]:!bg-[#1a1a1d] ' +
  '[&_.ql-snow_.ql-stroke]:![stroke:#ffffff] [&_.ql-snow_.ql-fill]:![fill:#ffffff] ' +
  '[&_.ql-toolbar]:rounded-t-md [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar.ql-snow]:!border-b-[#2d2d2d] [&_.ql-toolbar]:bg-[#2a2a2e] [&_.ql-toolbar]:px-2 [&_.ql-toolbar]:py-1.5 ' +
  '[&_.ql-toolbar_button]:!mr-0 [&_.ql-toolbar_button]:text-white/85 [&_.ql-toolbar_button:hover]:!bg-white/10 [&_.ql-toolbar_button.ql-active]:!bg-white/[0.18] ' +
  '[&_.ql-toolbar_.ql-picker-label]:text-white/85 ' +
  '[&_.ql-toolbar_.ql-formats_button_.ql-stroke]:[stroke:#ea580c] [&_.ql-toolbar_button_.ql-stroke]:[stroke:#ea580c] [&_.ql-toolbar_.ql-picker-label_.ql-stroke]:[stroke:#ea580c] ' +
  '[&_.ql-toolbar_.ql-formats_button:hover_.ql-stroke]:[stroke:#fb923c] [&_.ql-toolbar_button:hover_.ql-stroke]:[stroke:#fb923c] [&_.ql-toolbar_.ql-picker-label:hover_.ql-stroke]:[stroke:#fb923c] ' +
  '[&_.ql-toolbar_.ql-picker-options]:!rounded-md [&_.ql-toolbar_.ql-picker-options]:!border [&_.ql-toolbar_.ql-picker-options]:!border-white/15 [&_.ql-toolbar_.ql-picker-options]:!bg-[#323236] ' +
  '[&_.ql-toolbar_.ql-picker-item]:!text-white/90 [&_.ql-toolbar_.ql-picker-item:hover]:!bg-white/10 ' +
  '[&_.ql-editor]:min-h-[180px] [&_.ql-editor]:!text-[13px] [&_.ql-editor]:!text-white/[0.92] ' +
  '[&_.ql-editor_a]:!text-sky-400 [&_.ql-editor.ql-blank::before]:!left-4 [&_.ql-editor.ql-blank::before]:!not-italic [&_.ql-editor.ql-blank::before]:!text-white/35';

export const DEFAULT_QUILL_TOOLBAR = {
  toolbar: [
    [
      'bold',
      'italic',
      'underline',
      'strike',
      { list: 'ordered' },
      { list: 'bullet' },
    ],
  ],
};

function RichTextEditor({
  instanceKey,
  html,
  onHtmlChange,
  placeholder,
  onAiPolish,
}: {
  instanceKey: string;
  html: string;
  onHtmlChange: (next: string) => void;
  placeholder?: string;
  /** 接入后端时传入；返回润色后的 HTML 片段（会再走 sanitize） */
  onAiPolish?: (currentHtml: string) => Promise<string>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onHtmlChangeRef = useRef(onHtmlChange);
  onHtmlChangeRef.current = onHtmlChange;
  const [polishing, setPolishing] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    el.innerHTML = '';

    const q = new Quill(el, {
      theme: 'snow',
      placeholder: placeholder ?? '',
      modules: {
        toolbar: DEFAULT_QUILL_TOOLBAR.toolbar,
      },
    });
    quillRef.current = q;

    const initial = sanitizeRichTextHtml(html ?? '');
    if (initial) {
      try {
        const delta = q.clipboard.convert({ html: initial });
        q.setContents(delta, 'silent');
      } catch {
        q.root.innerHTML = initial;
      }
    }

    const onTextChange = () => {
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
  }, [instanceKey]);

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
    onHtmlChangeRef.current(sanitizeRichTextHtml(q.root.innerHTML));
  });

  const handleAiPolish = useMemoizedFn(async () => {
    const q = quillRef.current;
    if (!q || polishing) return;
    const raw = sanitizeRichTextHtml(q.root.innerHTML);
    const plain = raw.replace(/<[^>]*>/g, '').trim();
    if (!plain) {
      message.warning('请先输入内容');
      return;
    }
    if (!onAiPolish) {
      message.info('AI 润色接口接入后即可使用');
      return;
    }
    setPolishing(true);
    try {
      const polished = await onAiPolish(raw);
      applyHtmlToQuill(q, polished);
      message.success('润色完成');
    } catch {
      message.error('润色失败，请稍后重试');
    } finally {
      setPolishing(false);
    }
  });

  // 工具栏 DOM 在 quill.container 外侧（与前一个兄弟节点），包一层才能让 [&_.ql-toolbar] 等选择器生效
  return (
    <div className="min-w-0">
      <div className={quillHostClass}>
        <div ref={hostRef} className="min-w-0" />
      </div>
      <div className="mt-2 flex justify-end">
        <div
          role="button"
          tabIndex={polishing ? -1 : 0}
          aria-busy={polishing}
          aria-disabled={polishing}
          onClick={() => {
            if (!polishing) void handleAiPolish();
          }}
          onKeyDown={(e) => {
            if (polishing) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              void handleAiPolish();
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
            <ThunderboltOutlined className="text-[13px]" />
          )}
          AI润色
        </div>
      </div>
    </div>
  );
}

export default memo(RichTextEditor);
