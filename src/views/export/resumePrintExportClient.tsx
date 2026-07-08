'use client';
import { useLocale } from 'next-intl';
import ResumePrintView from './resumePrintView';

type Props = {
  initialConfig?: unknown | null;
  initialError?: string | null;
  assetOrigin?: string;
  exportMode?: 'pdf' | 'image';
};

export default function ResumePrintExportClient({
  initialConfig = null,
  initialError = null,
  assetOrigin = '',
  exportMode = 'pdf',
}: Props) {
  const locale = useLocale();
  const err = initialError ?? null;
  const config = initialConfig ?? null;
  const ready = Boolean(config) && !err;

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
