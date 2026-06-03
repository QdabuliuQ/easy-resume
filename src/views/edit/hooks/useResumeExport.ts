'use client';

import { useLocale, useMessages, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAppMessage } from '@/hooks/useAppMessage';
import { configStore } from '@/mobx';
import defaultResume from '@/json/resume.defaults';

let snapClientPromise: Promise<typeof import('@/lib/clientSnapResumeImage')> | null = null;

function loadSnapClient() {
  if (!snapClientPromise) {
    snapClientPromise = import('@/lib/clientSnapResumeImage');
  }
  return snapClientPromise;
}

export function useResumeExport() {
  const message = useAppMessage();
  const t = useTranslations('Edit.header');
  const locale = useLocale();
  const messages = useMessages();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const name = configStore.getConfig?.name ?? defaultResume.name;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let canceled = false;

    const runWarmup = () => {
      if (canceled) return;
      const resumeFont = configStore.mergedGlobalStyle?.resumeFont ?? 'system';
      void loadSnapClient().then((mod) => {
        if (canceled) return;
        mod.warmupResumeImageExportRuntime(resumeFont);
      });
    };

    runWarmup();

    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(runWarmup, { timeout: 1200 });
      return () => {
        canceled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timer = globalThis.setTimeout(runWarmup, 300);
    return () => {
      canceled = true;
      globalThis.clearTimeout(timer);
    };
  }, []);

  const snapshotForExport = () => {
    const raw = configStore.getConfig;
    if (!raw) return JSON.parse(JSON.stringify(defaultResume));
    return JSON.parse(
      JSON.stringify({
        ...raw,
        globalStyle: configStore.mergedGlobalStyle,
        exportPages: configStore.getExportPages,
      }),
    );
  };
  const safeName = () => {
    const base = (name || t('resumeDefaultName')).trim() || t('resumeDefaultName');
    return base.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 80);
  };
  const exportPdf = async () => {
    if (typeof window === 'undefined' || pdfLoading || imageLoading) return;
    if (!navigator.onLine) {
      message.warning(t('offlineNeedNetworkBackupJson'));
      return;
    }
    setPdfLoading(true);
    const hide = message.loading(t('exportPdfLoading'), 0);
    try {
      const safe = safeName();
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: snapshotForExport(),
          filename: `${safe}.pdf`,
          locale: locale === 'en' ? 'en' : 'zh',
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.error === 'string' ? data.error : t('requestFailed', { status: res.status }),
        );
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.pdf`;
      a.click();
      URL.revokeObjectURL(href);
      hide();
      message.success(t('exportPdfOk'));
    } catch (e) {
      hide();
      message.error(e instanceof Error ? e.message : t('exportFail'));
    } finally {
      setPdfLoading(false);
    }
  };
  const exportImage = async () => {
    if (typeof window === 'undefined' || imageLoading || pdfLoading) return;
    if (!navigator.onLine) {
      message.warning(t('offlineNeedNetworkBackupJson'));
      return;
    }
    setImageLoading(true);
    const hide = message.loading(t('exportImageLoading'), 0);
    try {
      const snapClient = await loadSnapClient();
      const safe = safeName();
      await snapClient.downloadResumeJpegViaSnapdom({
        config: snapshotForExport(),
        filename: `${safe}.jpg`,
        locale,
        messages: messages as Record<string, unknown>,
      });
      hide();
      message.success(t('exportImageOk'));
    } catch (e) {
      hide();
      message.error(e instanceof Error ? e.message : t('exportFail'));
    } finally {
      setImageLoading(false);
    }
  };
  const exportJson = () => {
    try {
      const cfg = snapshotForExport();
      const safe = safeName();
      const json = JSON.stringify(cfg, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${safe}.json`;
      a.click();
      URL.revokeObjectURL(href);
      message.success(t('exportJsonOk'));
    } catch (e) {
      message.error(e instanceof Error ? e.message : t('exportFail'));
    }
  };
  return {
    exportPdf,
    exportImage,
    exportJson,
    pdfLoading,
    imageLoading,
    exporting: pdfLoading || imageLoading,
  };
}
