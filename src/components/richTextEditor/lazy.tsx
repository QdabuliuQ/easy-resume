'use client';
import { lazy, memo, Suspense } from 'react';
import { loadRichTextEditor, type RichTextEditorProps } from './loadRichTextEditor';

const RichTextEditorLazy = lazy(() => loadRichTextEditor());

function RichTextEditorFallback() {
  return (
    <div className='relative min-h-[120px] min-w-0 rounded-md border border-fg/[0.1] bg-surface/[0.03]'>
      <div className='flex h-[120px] items-center justify-center'>
        <span
          className='inline-block size-4 animate-spin rounded-full border-2 border-fg/25 border-t-[color:var(--color-primary)]'
          aria-hidden
        />
      </div>
    </div>
  );
}

function LazyRichTextEditor(props: RichTextEditorProps) {
  return (
    <Suspense fallback={<RichTextEditorFallback />}>
      <RichTextEditorLazy {...props} />
    </Suspense>
  );
}

export default memo(LazyRichTextEditor);
export { prefetchRichTextEditor } from './loadRichTextEditor';
export type { RichTextEditorProps } from './loadRichTextEditor';
