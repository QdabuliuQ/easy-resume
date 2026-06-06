import { describe, expect, it } from 'vitest';
import defaultResume from '@/json/resume.defaults';
import {
  getResumeImportValidationError,
  normalizeResumeImportPayload,
} from '@/lib/validateResumeImportJson';

describe('validateResumeImportJson', () => {
  const valid = {
    name: '测试',
    globalStyle: defaultResume.globalStyle,
    pages: defaultResume.pages.slice(0, 1),
  };

  it('normalizeResumeImportPayload unwraps template config', () => {
    const wrapped = { config: valid, id: 'tpl-1' };
    expect(normalizeResumeImportPayload(wrapped)).toEqual(valid);
    expect(normalizeResumeImportPayload(valid)).toBe(valid);
  });

  it('accepts valid resume', () => {
    expect(getResumeImportValidationError(valid)).toBeNull();
  });

  it('rejects invalid root', () => {
    expect(getResumeImportValidationError(null)).toBe('根须为对象');
    expect(getResumeImportValidationError([])).toBe('根须为对象');
  });

  it('rejects missing name', () => {
    const err = getResumeImportValidationError({ ...valid, name: 1 });
    expect(err).toBe('name 须为字符串');
  });

  it('rejects invalid pageSize', () => {
    const err = getResumeImportValidationError({
      ...valid,
      globalStyle: { ...valid.globalStyle, pageSize: 'B5' },
    });
    expect(err).toBe('globalStyle.pageSize 无效');
  });

  it('rejects unknown module type', () => {
    const pages = JSON.parse(JSON.stringify(valid.pages));
    pages[0].modules[0].type = 'unknown';
    const err = getResumeImportValidationError({ ...valid, pages });
    expect(err).toContain('未知模块 type');
  });

  it('rejects invalid exportPages', () => {
    const err = getResumeImportValidationError({ ...valid, exportPages: {} });
    expect(err).toBe('exportPages 须为数组');
  });
});
