import { signIn } from 'next-auth/react';
import { configStore } from '@/mobx';
import { isEditPath, persistResumeAuthDraft } from '@/lib/resumeAuthDraft';

/** 编辑页登录前把当前简历写入 sessionStorage，避免 OAuth 整页跳转丢稿 */
export async function signInPreservingResume(provider: 'github' | 'qq') {
  if (typeof window !== 'undefined' && isEditPath(window.location.pathname)) {
    persistResumeAuthDraft(configStore.getConfig);
  }
  return signIn(provider, { redirectTo: window.location.href, redirect: true });
}
