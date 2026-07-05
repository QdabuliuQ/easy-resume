import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  extractPdfEmbeddedText,
  isPdfEmbeddedTextUsable,
} from '@/lib/ai/resumeImport/extractPdfText';

describe('isPdfEmbeddedTextUsable', () => {
  it('拒绝过短文本', () => {
    expect(isPdfEmbeddedTextUsable('')).toBe(false);
    expect(isPdfEmbeddedTextUsable('abc')).toBe(false);
  });

  it('接受足够长的简历样文本', () => {
    const text = [
      '张三 13812345678 zhang@email.com',
      '教育经历 北京大学 计算机科学与技术 本科 2018-2022',
      '工作经历 某某科技有限公司 前端工程师 2022-至今 负责核心业务开发',
    ].join('\n');
    expect(isPdfEmbeddedTextUsable(text)).toBe(true);
  });
});

describe('extractPdfEmbeddedText', () => {
  it('从最小 PDF 提取内嵌文字', async () => {
    const buffer = readFileSync(join(process.cwd(), 'tests/fixtures/minimal-text.pdf'));
    const text = await extractPdfEmbeddedText(buffer);
    expect(text).toContain('Hello Resume');
    expect(isPdfEmbeddedTextUsable(text)).toBe(false);
  });
});
