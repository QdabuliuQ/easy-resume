import Quill from 'quill';
import { memo, useEffect, useRef } from 'react';
import { sanitizeRichTextHtml } from '@/utils/sanitizeHtml';
import 'react-quill/dist/quill.snow.css';
import styles from './index.module.less';

/** 直接使用 Quill，避免 react-quill 依赖 ReactDOM.findDOMNode（React 19 已移除） */

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
}: {
  instanceKey: string;
  html: string;
  onHtmlChange: (next: string) => void;
  placeholder?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onHtmlChangeRef = useRef(onHtmlChange);
  onHtmlChangeRef.current = onHtmlChange;

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
      q.off('text-change', onTextChange);
      el.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- html 仅用初始写入，避免随输入反复挂载
  }, [instanceKey]);

  return <div ref={hostRef} className={styles.quillWrap} />;
}

export default memo(RichTextEditor);
