import { describe, expect, it } from 'vitest';
import { parseAiJsonObject } from '@/lib/ai/parseAiJson';

describe('parseAiJsonObject', () => {
  it('parses fenced json', () => {
    const raw = '```json\n{"totalScore":80,"dimensionEvaluate":[]}\n```';
    expect(parseAiJsonObject(raw).totalScore).toBe(80);
  });

  it('repairs spaced status key', () => {
    const raw = `{
  "totalScore": 85,
  "dimensionEvaluate": [
    {
      "dimensionName": "简历结构",
      " "status": "优秀",
      "remark": "结构清晰"
    }
  ]
}`;
    const j = parseAiJsonObject(raw);
    expect(j.totalScore).toBe(85);
    expect((j.dimensionEvaluate as { status: string }[])[0].status).toBe('优秀');
  });
});
