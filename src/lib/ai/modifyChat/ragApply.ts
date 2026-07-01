import { plainTextFromRichHtml } from '@/utils/sanitizeHtml';
import { optimizeByScene } from '@/lib/ai/ragResume/optimize';
import type { OptimizeScene } from '@/lib/ai/ragResume/types';
import { mergeModuleIntoResume } from './partialPatch';
import { buildResumeModuleSummary, locateModule } from './resumeSummary';
import type { ScopeOutput } from './resumeSchema';
import { POLISH_RE } from './shared';
import { isRagEligible, sceneForModuleType } from './scopeRouter';

type ItemLike = Record<string, unknown>;

function itemDescription(item: ItemLike): string {
  const desc = item.description;
  if (typeof desc === 'string' && desc.trim()) return desc;
  const skillName = item.skillName;
  if (typeof skillName === 'string') return skillName;
  return '';
}

function setItemDescription(item: ItemLike, html: string, moduleType: string): void {
  if (moduleType === 'skill' && !item.description && typeof item.skillName === 'string') {
    item.skillName = plainTextFromRichHtml(html).slice(0, 200) || item.skillName;
    return;
  }
  item.description = html;
}

async function polishModuleItems(
  module: { type: string; id: string; options?: Record<string, unknown> },
  scene: OptimizeScene,
  postType: string,
  itemIndexes?: number[],
): Promise<{ changed: number; labels: string[] }> {
  const items = module.options?.items;
  let changed = 0;
  const labels: string[] = [];
  if (Array.isArray(items) && items.length) {
    const indexes =
      itemIndexes?.length
        ? itemIndexes.filter((i) => i >= 0 && i < items.length)
        : items.map((_, i) => i);
    for (const idx of indexes) {
      const item = items[idx] as ItemLike;
      const raw = itemDescription(item);
      const plain = raw.includes('<') ? plainTextFromRichHtml(raw) : raw;
      if (!plain.trim()) continue;
      const optimized = await optimizeByScene(scene, { postType, rawText: plain }, { useModifyChatModel: true });
      if (optimized && optimized !== raw) {
        setItemDescription(item, optimized, module.type);
        changed += 1;
        labels.push(`第 ${idx + 1} 条`);
      }
    }
  }
  const moduleDesc = module.options?.description;
  if (
    changed === 0
    && typeof moduleDesc === 'string'
    && moduleDesc.trim()
    && (module.type === 'skill' || module.type === 'other' || !Array.isArray(items) || !items.length)
  ) {
    const plain = moduleDesc.includes('<') ? plainTextFromRichHtml(moduleDesc) : moduleDesc;
    if (plain.trim()) {
      const optimized = await optimizeByScene(scene, { postType, rawText: plain }, { useModifyChatModel: true });
      if (optimized && optimized !== moduleDesc) {
        module.options!.description = optimized;
        changed += 1;
        labels.push('描述');
      }
    }
  }
  return { changed, labels };
}

export function scopeTargetsForRag(
  resume: unknown,
  scope: ScopeOutput,
  userMessage: string,
): { moduleId: string; itemIndex?: number; scene: OptimizeScene }[] {
  const ragTypes = new Set(['job', 'project', 'skill']);
  const out: { moduleId: string; itemIndex?: number; scene: OptimizeScene }[] = [];
  if (scope.scope === 'partial' && scope.targets.length) {
    for (const t of scope.targets) {
      const loc = locateModule(resume, t.moduleId);
      if (!loc || !ragTypes.has(loc.module.type)) continue;
      if (!isRagEligible(scope, loc.module.type, userMessage)) continue;
      const scene = (scope.scene ?? sceneForModuleType(loc.module.type)) as OptimizeScene | null;
      if (!scene) continue;
      out.push({ moduleId: t.moduleId, itemIndex: t.itemIndex, scene });
    }
    return out;
  }
  if (scope.scope === 'global' && (scope.action === 'polish' || POLISH_RE.test(userMessage))) {
    for (const mod of buildResumeModuleSummary(resume)) {
      if (!ragTypes.has(mod.type)) continue;
      const scene = (scope.scene ?? sceneForModuleType(mod.type)) as OptimizeScene | null;
      if (!scene) continue;
      out.push({ moduleId: mod.id, scene });
    }
  }
  return out;
}

export async function applyRagScopeModify(
  resume: unknown,
  postType: string,
  targets: { moduleId: string; itemIndex?: number; scene: OptimizeScene }[],
): Promise<{ message: string; resume: unknown } | null> {
  if (!targets.length) return null;
  let next = resume;
  const parts: string[] = [];
  let totalChanged = 0;
  for (const t of targets) {
    const loc = locateModule(next, t.moduleId);
    if (!loc) continue;
    const mod = JSON.parse(JSON.stringify(loc.module));
    const itemIndexes = t.itemIndex != null ? [t.itemIndex] : undefined;
    const { changed, labels } = await polishModuleItems(mod, t.scene, postType, itemIndexes);
    if (changed > 0) {
      next = mergeModuleIntoResume(next, loc.pageIndex, loc.moduleIndex, mod);
      totalChanged += changed;
      const sceneLabel = t.scene === 'work' ? '工作经历' : t.scene === 'project' ? '项目经历' : '技能';
      parts.push(`${sceneLabel}（${labels.join('、')}）`);
    }
  }
  if (totalChanged === 0) return null;
  return {
    message: `已根据知识库规则优化 ${parts.join('；')}，共 ${totalChanged} 处描述。`,
    resume: next,
  };
}
