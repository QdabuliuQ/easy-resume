'use client';
import { useRef } from 'react';
import { useAppMessage } from '@/hooks/useAppMessage';
import { useResponsiveConfirm } from '@/hooks/useResponsiveConfirm';
import { useTranslations } from 'next-intl';
import { importResumeFromFile } from '@/api/importResumeFromFile';
import { configStore, resumeImportStore } from '@/mobx';
import { flushResumeBackupImmediate } from '@/lib/resumeConfigBackup';
import { resetAiModifyChatSession } from '@/lib/aiModifyChatSessionStorage';
import {
  applyImportedPagesToConfig,
  clearImportedPagesInConfig,
  type IncomingResumePageDraft,
} from '@/lib/mergeImportedResumePages';
import { getResumeImportValidationError } from '@/lib/validateResumeImportJson';
import { validateResumeImportFile } from '@/lib/ai/resumeImport/fileLimits';

function findInfo1Avatar(pages: { modules?: { type: string; options?: Record<string, unknown> }[] }[]): string | undefined {
  for (const page of pages) {
    for (const mod of page.modules ?? []) {
      if (mod.type !== 'info1' || !mod.options) continue;
      const avatar = mod.options.avatar;
      if (typeof avatar === 'string' && avatar.trim()) return avatar;
    }
  }
  return undefined;
}

function patchInfo1Avatar<T extends { pages?: { modules?: { type: string; options?: Record<string, unknown> }[] }[] }>(
  config: T,
  avatar?: string,
): T {
  if (!avatar) return config;
  const next = JSON.parse(JSON.stringify(config)) as T;
  for (const page of next.pages ?? []) {
    const info1 = page.modules?.find((m) => m.type === 'info1');
    if (info1?.options) {
      info1.options.avatar = avatar;
      break;
    }
  }
  return next;
}

export function useResumeImport() {
  const message = useAppMessage();
  const t = useTranslations('Edit.header');
  const { confirm, contextHolder } = useResponsiveConfirm();
  const fileRef = useRef<HTMLInputElement>(null);
  const clearedBaseRef = useRef<ReturnType<typeof clearImportedPagesInConfig> | null>(null);
  const preservedAvatarRef = useRef<string | undefined>(undefined);

  const applyPages = (incomingPages: IncomingResumePageDraft[]) => {
    const base = clearedBaseRef.current;
    if (!base) return;
    let merged = applyImportedPagesToConfig(base, incomingPages);
    merged = patchInfo1Avatar(merged, preservedAvatarRef.current);
    configStore.setConfig(merged);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || resumeImportStore.loading) return;
    if (!navigator.onLine) {
      message.warning(t('importResumeFail'));
      return;
    }
    const fileCheck = validateResumeImportFile({ size: f.size, type: f.type, name: f.name });
    if (!fileCheck.ok) {
      if (fileCheck.code === 'empty') message.error(t('importResumeFileEmpty'));
      else if (fileCheck.code === 'unsupported') message.error(t('importResumeFileUnsupported'));
      else if (fileCheck.kind === 'pdf') message.error(t('importResumeFileTooLargePdf'));
      else message.error(t('importResumeFileTooLargeImage'));
      return;
    }
    const current = configStore.getConfig;
    if (!current?.pages?.length) {
      message.error(t('importResumeFail'));
      return;
    }
    preservedAvatarRef.current = findInfo1Avatar(current.pages);
    const clearedBase = clearImportedPagesInConfig(current);
    clearedBaseRef.current = clearedBase;
    resetAiModifyChatSession();
    configStore.setConfig(clearedBase);
    resumeImportStore.setActive(true, t('importResumeParsing'));
    let rafId: number | null = null;
    let pendingPages: IncomingResumePageDraft[] | null = null;
    const flushPages = () => {
      rafId = null;
      if (!pendingPages) return;
      applyPages(pendingPages);
      pendingPages = null;
    };
    const schedulePages = (pages: IncomingResumePageDraft[]) => {
      pendingPages = pages;
      if (rafId != null) return;
      rafId = requestAnimationFrame(flushPages);
    };
    try {
      const pages = await importResumeFromFile(f, (evt) => {
        if ('phase' in evt && evt.phase === 'extract') {
          resumeImportStore.setActive(true, evt.status || t('importResumeExtract'));
          return;
        }
        if ('phase' in evt && evt.phase === 'llm') {
          resumeImportStore.setActive(true, evt.status || t('importResumeLlm'));
          return;
        }
        if ('pages' in evt && evt.pages?.length) schedulePages(evt.pages);
      });
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      applyPages(pages);
      const merged = configStore.getConfig;
      const err = getResumeImportValidationError(merged);
      if (err) throw new Error(t('importResumeFail'));
      message.success(t('importResumeOk'));
      flushResumeBackupImmediate(configStore.getConfig);
    } catch (err) {
      if (rafId != null) cancelAnimationFrame(rafId);
      message.error(err instanceof Error ? err.message : t('importResumeFail'));
    } finally {
      clearedBaseRef.current = null;
      preservedAvatarRef.current = undefined;
      resumeImportStore.setActive(false);
    }
  };

  const pickFile = () => fileRef.current?.click();

  const confirmThenPick = () => {
    confirm({
      title: t('confirmImportResumeTitle'),
      content: t('confirmImportResumeContent'),
      okText: t('okContinue'),
      cancelText: t('cancel'),
      onOk: pickFile,
    });
  };

  return {
    contextHolder,
    fileRef,
    onFileChange,
    confirmThenPick,
    loading: resumeImportStore.loading,
  };
}
