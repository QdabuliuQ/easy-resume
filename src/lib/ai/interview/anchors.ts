import {
  INTERVIEW_ANCHOR_MIN,
  type InterviewAnchor,
} from '@/lib/ai/interview/types';

function plain(htmlOrText: unknown): string {
  if (typeof htmlOrText !== 'string') return '';
  return htmlOrText
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clip(s: string, max = 180): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function moduleLabel(type: string, options: Record<string, unknown>, item?: Record<string, unknown>): string {
  if (item) {
    const name =
      plain(item.company) ||
      plain(item.name) ||
      plain(item.school) ||
      plain(item.title) ||
      plain(item.post) ||
      '';
    if (name) return name;
  }
  const title = plain(options.title);
  if (title) return title;
  return type;
}

function excerptFromItem(type: string, item: Record<string, unknown>): string {
  const parts = [
    plain(item.description),
    plain(item.post),
    plain(item.role),
    plain(item.major),
    plain(item.degree),
    plain(item.department),
  ].filter(Boolean);
  return clip(parts.join(' · '));
}

/** 从简历 JSON 抽取可深挖锚点（全模块）。 */
export function extractInterviewAnchors(resume: unknown): InterviewAnchor[] {
  const root = asRecord(resume);
  if (!root) return [];
  const pages = Array.isArray(root.pages) ? root.pages : [];
  const anchors: InterviewAnchor[] = [];

  for (const page of pages) {
    const p = asRecord(page);
    if (!p) continue;
    const modules = Array.isArray(p.modules) ? p.modules : [];
    for (const mod of modules) {
      const m = asRecord(mod);
      if (!m) continue;
      const type = String(m.type || 'other');
      if (type === 'info1') continue;
      const moduleId = typeof m.id === 'string' ? m.id : undefined;
      const options = asRecord(m.options) || {};

      if (type === 'skill') {
        const excerpt = clip(plain(options.description) || plain(options.title));
        if (excerpt.length < 8) continue;
        anchors.push({
          moduleType: 'skill',
          moduleId,
          label: moduleLabel('skill', options),
          excerpt,
        });
        continue;
      }

      if (type === 'info') {
        const excerpt = clip(
          [plain(options.name), plain(options.intentPosts), plain(options.summary)].filter(Boolean).join(' · '),
        );
        if (excerpt.length < 6) continue;
        anchors.push({
          moduleType: 'info',
          moduleId,
          label: plain(options.name) || '基本信息',
          excerpt,
        });
        continue;
      }

      const items = Array.isArray(options.items) ? options.items : null;
      if (items) {
        items.forEach((raw, itemIndex) => {
          const item = asRecord(raw);
          if (!item) return;
          const excerpt = excerptFromItem(type, item);
          if (excerpt.length < 8) return;
          anchors.push({
            moduleType: type,
            moduleId,
            itemIndex,
            itemId: typeof item.id === 'string' ? item.id : undefined,
            label: moduleLabel(type, options, item),
            excerpt,
          });
        });
        continue;
      }

      const excerpt = clip(plain(options.description) || plain(options.content) || plain(options.title));
      if (excerpt.length < 8) continue;
      anchors.push({
        moduleType: type,
        moduleId,
        label: moduleLabel(type, options),
        excerpt,
      });
    }
  }

  const intent = plain(root.intentPosts);
  if (intent.length >= 4) {
    anchors.push({
      moduleType: 'info',
      label: '意向岗位',
      excerpt: clip(intent),
    });
  }

  return anchors;
}

export function canStartInterview(anchors: InterviewAnchor[]): boolean {
  return anchors.length >= INTERVIEW_ANCHOR_MIN;
}
