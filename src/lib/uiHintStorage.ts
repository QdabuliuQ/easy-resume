const PREFIX = 'easy-resume-hint-';

function isDismissed(key: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(`${PREFIX}${key}`) === '1';
  } catch {
    return true;
  }
}

function dismiss(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${PREFIX}${key}`, '1');
  } catch {
    /* noop */
  }
}

export const uiHints = {
  aiModifyMenu: {
    isDismissed: () => isDismissed('ai-modify-menu'),
    dismiss: () => dismiss('ai-modify-menu'),
  },
  aiScoreMenu: {
    isDismissed: () => isDismissed('ai-score-menu'),
    dismiss: () => dismiss('ai-score-menu'),
  },
  aiPolishBtn: {
    isDismissed: () => isDismissed('ai-polish-btn'),
    dismiss: () => dismiss('ai-polish-btn'),
  },
};
