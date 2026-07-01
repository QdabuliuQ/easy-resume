'use client';
import { memo, useEffect, useState, type ComponentType } from 'react';
import { prefetchRichTextEditor } from '@/components/richTextEditor/lazy';

type ModulePanel = ComponentType<{ moduleId?: string }>;

const panelLoaders: Record<string, () => Promise<{ default: ModulePanel }>> = {
  info1: () => import('../info1'),
  certificate: () => import('../certificate'),
  skill: () => import('../skill'),
  job: () => import('../job'),
  project: () => import('../project'),
  education: () => import('../education'),
  other: () => import('../other'),
};

const RTE_PANEL_TYPES = new Set(['skill', 'job', 'project', 'education', 'other']);

function LazyModulePanel({ type, moduleId }: { type: string; moduleId: string }) {
  const [Panel, setPanel] = useState<ModulePanel | null>(null);
  useEffect(() => {
    let cancelled = false;
    const loader = panelLoaders[type];
    if (!loader) return;
    if (RTE_PANEL_TYPES.has(type)) prefetchRichTextEditor();
    void loader().then((mod) => {
      if (!cancelled) setPanel(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [type]);
  if (!Panel) {
    return (
      <div className='flex items-center justify-center gap-2 py-10 text-[13px] text-fg/58'>
        <span
          className='inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-fg/25 border-t-[color:var(--color-primary)]'
          aria-hidden
        />
      </div>
    );
  }
  return <Panel moduleId={moduleId} />;
}

export default memo(LazyModulePanel);
