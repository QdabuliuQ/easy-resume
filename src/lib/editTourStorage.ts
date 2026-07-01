const EDIT_TOUR_DONE_KEY = 'easy-resume-edit-tour-done';

export function isEditTourDone(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(EDIT_TOUR_DONE_KEY) === '1';
  } catch {
    return true;
  }
}

export function markEditTourDone(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(EDIT_TOUR_DONE_KEY, '1');
  } catch {
    /* noop */
  }
}
