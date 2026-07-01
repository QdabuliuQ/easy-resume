import { describe, expect, it, beforeEach } from 'vitest';
import { isEditTourDone, markEditTourDone } from '@/lib/editTourStorage';

describe('editTourStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('marks tour done in localStorage', () => {
    expect(isEditTourDone()).toBe(false);
    markEditTourDone();
    expect(isEditTourDone()).toBe(true);
  });
});
