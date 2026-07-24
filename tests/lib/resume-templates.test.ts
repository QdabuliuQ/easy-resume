import { describe, expect, it } from 'vitest';
import { resumeTemplates } from '@/json/resumeTemplates';

function walkDescriptions(obj: unknown, out: string[]) {
  if (Array.isArray(obj)) {
    for (const v of obj) walkDescriptions(v, out);
    return;
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (k === 'description' && typeof v === 'string' && v.trim()) out.push(v);
      else walkDescriptions(v, out);
    }
  }
}

describe('resumeTemplates', () => {
  it('registers 30 role templates with unique ids', () => {
    expect(resumeTemplates).toHaveLength(30);
    const ids = resumeTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(30);
    expect(ids).toEqual(
      expect.arrayContaining([
        'fe',
        'be',
        'data-analyst',
        'marketing',
        'mechanical',
        'customer-service',
        'algo',
        'logistics',
        'bank-rm',
        'interior',
        'java-dev',
        'new-media',
        'project-manager',
        'foreign-trade',
        'financial-analyst',
        'electrical',
      ]),
    );
  });

  it('resolves template avatars to data urls', () => {
    for (const tpl of resumeTemplates) {
      const info = (tpl.config.pages[0]?.modules as Array<{ type?: string; options?: { avatar?: string } }>).find(
        (m) => m.type === 'info1',
      );
      expect(info?.options?.avatar).toMatch(/^data:image\/png;base64,/);
    }
  });

  it('uses rich-text list markup in descriptions', () => {
    let total = 0;
    for (const tpl of resumeTemplates) {
      const descs: string[] = [];
      walkDescriptions(tpl.config, descs);
      expect(descs.length).toBeGreaterThan(0);
      for (const d of descs) {
        expect(d).toMatch(/<\s*ul\b/i);
        expect(d).toMatch(/<\s*li\b/i);
      }
      total += descs.length;
    }
    expect(total).toBeGreaterThan(100);
  });

  it('keeps required config shape', () => {
    for (const tpl of resumeTemplates) {
      expect(tpl.title).toBeTruthy();
      expect(tpl.config.name).toBeTruthy();
      expect(tpl.config.globalStyle).toBeTruthy();
      expect(Array.isArray(tpl.config.pages)).toBe(true);
      expect(tpl.config.pages[0]?.modules?.length).toBeGreaterThan(0);
    }
  });
});
