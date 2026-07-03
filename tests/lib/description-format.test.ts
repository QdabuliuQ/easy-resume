import { describe, expect, it } from 'vitest';
import {
  descriptionPolishRulesForScene,
  MODIFY_CHAT_DESCRIPTION_RULES,
  RICH_TEXT_ALLOWED_TAGS_PROMPT,
} from '@/lib/ai/descriptionFormat';

describe('descriptionFormat', () => {
  it('includes allowed tags aligned with polish feature', () => {
    expect(RICH_TEXT_ALLOWED_TAGS_PROMPT).toContain('<b>');
    expect(RICH_TEXT_ALLOWED_TAGS_PROMPT).toContain('<ul>');
    expect(RICH_TEXT_ALLOWED_TAGS_PROMPT).toContain('禁止 <ol>');
  });

  it('includes STAR rules per scene', () => {
    expect(descriptionPolishRulesForScene('work')).toContain('STAR');
    expect(descriptionPolishRulesForScene('project')).toContain('项目背景');
    expect(descriptionPolishRulesForScene('skill')).toContain('核心技能');
  });

  it('modify chat rules cover module description fields', () => {
    expect(MODIFY_CHAT_DESCRIPTION_RULES).toContain('items[].description');
    expect(MODIFY_CHAT_DESCRIPTION_RULES).toContain('options.description');
  });
});
