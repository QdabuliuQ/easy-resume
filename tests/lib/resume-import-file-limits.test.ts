import { describe, expect, it } from 'vitest';
import {
  RESUME_IMPORT_MAX_IMAGE_BYTES,
  RESUME_IMPORT_MAX_PDF_BYTES,
  validateResumeImportFile,
} from '@/lib/ai/resumeImport/fileLimits';

describe('validateResumeImportFile', () => {
  it('PDF 在限制内通过', () => {
    expect(
      validateResumeImportFile({
        size: RESUME_IMPORT_MAX_PDF_BYTES,
        type: 'application/pdf',
        name: 'a.pdf',
      }),
    ).toEqual({ ok: true, kind: 'pdf' });
  });

  it('PDF 超限拒绝', () => {
    expect(
      validateResumeImportFile({
        size: RESUME_IMPORT_MAX_PDF_BYTES + 1,
        type: 'application/pdf',
      }).ok,
    ).toBe(false);
  });

  it('图片在限制内通过', () => {
    expect(
      validateResumeImportFile({
        size: RESUME_IMPORT_MAX_IMAGE_BYTES,
        type: 'image/png',
        name: 'a.png',
      }),
    ).toEqual({ ok: true, kind: 'image' });
  });

  it('图片超限拒绝', () => {
    expect(
      validateResumeImportFile({
        size: RESUME_IMPORT_MAX_IMAGE_BYTES + 1,
        type: 'image/jpeg',
      }).ok,
    ).toBe(false);
  });

  it('WebP 拒绝', () => {
    expect(
      validateResumeImportFile({
        size: 1024,
        type: 'image/webp',
        name: 'a.webp',
      }),
    ).toEqual({ ok: false, code: 'unsupported' });
  });
});
