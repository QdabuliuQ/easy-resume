import { describe, expect, it } from 'vitest';
import { baiduWordsResultToText } from '@/lib/ai/resumeImport/baiduOcr';

describe('baiduWordsResultToText', () => {
  it('拼接 words 为换行文本', () => {
    expect(
      baiduWordsResultToText([{ words: '张三' }, { words: '13800000000' }, { words: '' }]),
    ).toBe('张三\n13800000000');
  });

  it('空结果返回空字符串', () => {
    expect(baiduWordsResultToText([])).toBe('');
    expect(baiduWordsResultToText(undefined)).toBe('');
  });
});
