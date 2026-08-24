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
  const [pdfkitLoading, setPdfkitLoading] = useState(false);
  const [imagePdfLoading, setImagePdfLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const name = configStore.getConfig?.name ?? defaultResume.name;
  const exporting =
    pdfLoading || pdfkitLoading || imagePdfLoading || imageLoading || docxLoading;

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
      void import('@/lib/clientPdfkitExport').then((mod) => {
        if (canceled) return;
        mod.warmupPdfkitExportRuntime(resumeFont);
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
    if (typeof window === 'undefined' || exporting) return;
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
  const exportPdfkit = async () => {
    if (typeof window === 'undefined' || exporting) return;
    setPdfkitLoading(true);
    const hide = message.loading(t('exportPdfkitLoading'), 0);
    try {
      const { downloadResumePdfkit } = await import('@/lib/clientPdfkitExport');
      const safe = safeName();
      await downloadResumePdfkit({
        config: snapshotForExport(),
        filename: `${safe}.pdf`,
        locale,
        messages: messages as Record<string, unknown>,
      });
      hide();
      message.success(t('exportPdfkitOk'));
    } catch (e) {
      hide();
      message.error(e instanceof Error ? e.message : t('exportFail'));
    } finally {
      setPdfkitLoading(false);
    }
  };
  const exportImagePdf = async () => {
    if (typeof window === 'undefined' || exporting) return;
    setImagePdfLoading(true);
    const hide = message.loading(t('exportImagePdfLoading'), 0);
    try {
      const snapClient = await loadSnapClient();
      const safe = safeName();
      await snapClient.downloadResumeImagePdfViaSnapdom({
        config: snapshotForExport(),
        filename: `${safe}.pdf`,
        locale,
        messages: messages as Record<string, unknown>,
      });
      hide();
      message.success(t('exportImagePdfOk'));
    } catch (e) {
      hide();
      message.error(e instanceof Error ? e.message : t('exportFail'));
    } finally {
      setImagePdfLoading(false);
    }
  };
  const exportImage = async () => {
    if (typeof window === 'undefined' || exporting) return;
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
  const exportDocx = async () => {
    if (typeof window === 'undefined' || exporting) return;
    setDocxLoading(true);
    const hide = message.loading(t('exportDocxLoading'), 0);
    try {
      const { downloadResumeDocx } = await import('@/lib/clientDocxExport');
      const safe = safeName();
      await downloadResumeDocx({
        config: snapshotForExport(),
        filename: `${safe}.docx`,
        locale,
        messages: messages as Record<string, unknown>,
      });
      hide();
      message.success(t('exportDocxOk'));
    } catch (e) {
      hide();
      message.error(e instanceof Error ? e.message : t('exportFail'));
    } finally {
      setDocxLoading(false);
    }
  };
  return {
    exportPdf,
    exportPdfkit,
    exportImagePdf,
    exportImage,
    exportJson,
    exportDocx,
    pdfLoading,
    pdfkitLoading,
    imagePdfLoading,
    imageLoading,
    docxLoading,
    exporting,
  };
}
