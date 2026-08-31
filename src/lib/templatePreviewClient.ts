'use client';
import {
  prepareConfigForSnapExport,
  renderResumePreviewBlobViaSnapdom,
  warmupResumeImageExportRuntime,
} from '@/lib/clientSnapResumeImage';

export async function uploadTemplatePreviewImage(templateId: string, blob: Blob): Promise<string> {
  const form = new FormData();
  form.append('file', blob, 'preview.webp');
  const res = await fetch(`/api/admin/templates/${encodeURIComponent(templateId)}/preview`, {
    method: 'POST',
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || '预览图上传失败');
  return String(data.url || '');
}

/** 与编辑页图片导出同 config 准备 + snap 管线，输出 WebP 预览 blob */
export async function captureTemplatePreviewBlob(opts: {
  config: unknown;
  locale: string;
  messages: Record<string, unknown>;
  exportPages?: unknown[] | null;
  firstPageOnly?: boolean;
}): Promise<Blob> {
  warmupResumeImageExportRuntime(undefined);
  return renderResumePreviewBlobViaSnapdom({
    config: prepareConfigForSnapExport(opts.config, opts.exportPages),
    locale: opts.locale,
    messages: opts.messages,
    firstPageOnly: opts.firstPageOnly ?? true,
  });
}

export async function captureAndUploadTemplatePreview(opts: {
  templateId: string;
  config: unknown;
  locale: string;
  messages: Record<string, unknown>;
  exportPages?: unknown[] | null;
  firstPageOnly?: boolean;
}): Promise<string> {
  const blob = await captureTemplatePreviewBlob(opts);
  return uploadTemplatePreviewImage(opts.templateId, blob);
}
