export const RESUME_IMPORT_MAX_PDF_BYTES = 10 * 1024 * 1024;
export const RESUME_IMPORT_MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const PDF_MIMES = new Set(['application/pdf']);
const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png']);

export type ResumeImportFileKind = 'pdf' | 'image';

export function resolveResumeImportFileKind(mimeType: string, fileName?: string): ResumeImportFileKind | null {
  const mime = mimeType.toLowerCase().split(';')[0]?.trim() ?? '';
  if (PDF_MIMES.has(mime)) return 'pdf';
  if (IMAGE_MIMES.has(mime)) return 'image';
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') return 'image';
  return null;
}

export function getResumeImportMaxBytes(kind: ResumeImportFileKind): number {
  return kind === 'pdf' ? RESUME_IMPORT_MAX_PDF_BYTES : RESUME_IMPORT_MAX_IMAGE_BYTES;
}

export function formatResumeImportMaxSizeMb(kind: ResumeImportFileKind): number {
  return getResumeImportMaxBytes(kind) / (1024 * 1024);
}

export type ResumeImportFileValidation =
  | { ok: true; kind: ResumeImportFileKind }
  | { ok: false; code: 'empty' | 'unsupported' | 'too_large'; kind?: ResumeImportFileKind };

export function validateResumeImportFile(file: {
  size: number;
  type?: string;
  name?: string;
}): ResumeImportFileValidation {
  if (file.size <= 0) return { ok: false, code: 'empty' };
  const kind = resolveResumeImportFileKind(file.type ?? '', file.name);
  if (!kind) return { ok: false, code: 'unsupported' };
  if (file.size > getResumeImportMaxBytes(kind)) {
    return { ok: false, code: 'too_large', kind };
  }
  return { ok: true, kind };
}

export function resumeImportFileValidationMessage(v: Exclude<ResumeImportFileValidation, { ok: true }>): string {
  if (v.code === 'empty') return '文件为空';
  if (v.code === 'unsupported') return '不支持的文件类型，请上传 PDF 或 JPG/PNG 图片';
  if (v.kind === 'pdf') return `文件过大，PDF 最大 ${formatResumeImportMaxSizeMb('pdf')}MB`;
  return `文件过大，图片最大 ${formatResumeImportMaxSizeMb('image')}MB`;
}
