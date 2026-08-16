import { canStartInterview, extractInterviewAnchors } from '@/lib/ai/interview/anchors';
import { loadCloudResumeForUid } from '@/lib/ai/interview/loadResume';
import type { InterviewAnchor } from '@/lib/ai/interview/types';

export type ResolveResumeResult =
  | { resume: unknown; resumeId?: string }
  | { error: string; status: number };

/** 云端 resumeId（需登录）；本地调试可用直传 resume（编辑器草稿）。生产禁止 body.resume。 */
export async function resolveInterviewResume(opts: {
  uid?: string;
  isDev: boolean;
  resumeId?: string;
  resume?: unknown;
}): Promise<ResolveResumeResult> {
  const resumeId = typeof opts.resumeId === 'string' ? opts.resumeId.trim() : '';
  if (opts.uid && resumeId) {
    const loaded = await loadCloudResumeForUid(opts.uid, resumeId);
    if ('error' in loaded) return loaded;
    return { resume: loaded.resume, resumeId };
  }
  if (opts.isDev && opts.resume !== undefined && opts.resume !== null) {
    return { resume: opts.resume };
  }
  if (!opts.uid && !opts.isDev) return { error: '请先登录', status: 401 };
  return { error: '请选择云端已保存简历', status: 400 };
}

export function preflightFromResume(resume: unknown): {
  ok: boolean;
  anchors: InterviewAnchor[];
  message?: string;
} {
  const anchors = extractInterviewAnchors(resume);
  if (!canStartInterview(anchors)) {
    return {
      ok: false,
      anchors,
      message: '可深挖内容不足，请先完善简历各模块描述后再试',
    };
  }
  return { ok: true, anchors };
}
