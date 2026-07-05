import { describe, expect, it } from 'vitest';
import { baiduAsrResultToText } from '@/lib/ai/speech/baiduSpeech';

describe('baiduAsrResultToText', () => {
  it('拼接识别结果', () => {
    expect(baiduAsrResultToText(['你好，', '世界'])).toBe('你好，世界');
  });

  it('空结果返回空字符串', () => {
    expect(baiduAsrResultToText([])).toBe('');
    expect(baiduAsrResultToText(undefined)).toBe('');
  });
});
