'use client';
import { useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import ResumePrintView from './resumePrintView';

type Props = {
  initialConfig?: unknown | null;
  initialError?: string | null;
  assetOrigin?: string;
  exportMode?: 'pdf' | 'image';
};

function scheduleExportReady(mark: () => void) {
  const t = window.setTimeout(mark, 800);
  void document.fonts.ready.then(() => {
    window.setTimeout(mark, 200);
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.setTimeout(mark, 400);
    });
  });
  return () => window.clearTimeout(t);
}

export default function ResumePrintExportClient({
  initialConfig = null,
  initialError = null,
  assetOrigin = '',
  exportMode = 'pdf',
}: Props) {
  const locale = useLocale();
  const [config] = useState<unknown | null>(initialConfig ?? null);
  const [err] = useState<string | null>(initialError ?? null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!config || err) return;
    let cancelled = false;
    const mark = () => {
      if (!cancelled) setReady(true);
    };
    const clear = scheduleExportReady(mark);
    const fallback = window.setTimeout(mark, 6_000);
    return () => {
      cancelled = true;
      clear();
      window.clearTimeout(fallback);
    };
  }, [config, err]);
  if (err) {
    return (
      <p className='p-4 text-sm text-red-600' data-export-error>
        {err}
      </p>
    );
  }
  if (!config) {
    return <p className='p-4 text-sm text-fg/50'>Loading…</p>;
  }
  return (
    <div
      data-export-ready={ready ? 'true' : 'false'}
      data-export-locale={locale}
      className='min-h-0'
    >
      <ResumePrintView
        config={config}
        assetOrigin={assetOrigin}
        exportMode={exportMode}
      />
    </div>
  );
}
