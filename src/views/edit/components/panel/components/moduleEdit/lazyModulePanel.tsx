'use client';
import { memo, useEffect, useState, type ComponentType } from 'react';
import { prefetchRichTextEditor } from '@/components/richTextEditor/lazy';
import { ModulePanelSkeleton } from '../settingsSkeletons';

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
    return <ModulePanelSkeleton />;
  }
  return <Panel moduleId={moduleId} />;
}

export default memo(LazyModulePanel);
