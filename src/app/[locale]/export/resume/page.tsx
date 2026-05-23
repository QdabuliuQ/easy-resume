import { headers } from 'next/headers';
import { getExportSession } from '@/lib/exportSessionStore';
import type { ExportResumeMode } from '@/lib/exportPrintOrigin';
import ResumePrintExportShell from '@/views/export/resumePrintExportShell';

export const dynamic = 'force-dynamic';

function requestOrigin(): string {
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return '';
  const proto = h.get('x-forwarded-proto') ?? 'http';
  return `${proto}://${host}`.replace(/\/$/, '');
}

export default async function ExportResumePage({
  searchParams,
}: {
  searchParams: { token?: string; mode?: string };
}) {
  const token = searchParams.token?.trim() ?? '';
  const exportMode: ExportResumeMode =
    searchParams.mode === 'image' ? 'image' : 'pdf';
  const origin = requestOrigin();
  const session = token ? getExportSession(token) : null;
  if (!token) {
    return (
      <ResumePrintExportShell
        initialError='missing token'
        assetOrigin={origin}
        exportMode={exportMode}
      />
    );
  }
  if (!session) {
    return (
      <ResumePrintExportShell
        initialError='会话无效或已过期'
        assetOrigin={origin}
        exportMode={exportMode}
      />
    );
  }
  return (
    <ResumePrintExportShell
      initialConfig={session.config}
      assetOrigin={origin}
      exportMode={exportMode}
    />
  );
}
