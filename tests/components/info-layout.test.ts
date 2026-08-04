import { describe, expect, it } from 'vitest';
import {
  moveField,
  sanitizeLayoutRows,
} from '@/components/infoLayout';

describe('infoLayout layout helpers', () => {
  it('sanitizeLayoutRows packs overflow beyond 4 cols', () => {
    expect(
      sanitizeLayoutRows([['a', 'b', 'c', 'd', 'e'], ['f'], []]),
    ).toEqual([['a', 'b', 'c', 'd'], ['e'], ['f']]);
  });

  it('moveField reorders within a row', () => {
    expect(
      moveField([['phone', 'email', 'city']], 'phone', 'city'),
    ).toEqual([['email', 'city', 'phone']]);
  });

  it('moveField spills to next row when target is full', () => {
    expect(
      moveField(
        [
          ['phone', 'email', 'city', 'wechat'],
          ['birthday'],
        ],
        'birthday',
        'phone',
      ),
    ).toEqual([
      ['birthday', 'phone', 'email', 'city'],
      ['wechat'],
    ]);
  });

  it('moveField creates a new row via row-new', () => {
    expect(
      moveField([['phone', 'email', 'city']], 'email', 'row-new'),
    ).toEqual([['phone', 'city'], ['email']]);
  });

  it('moveField appends via empty slot at row end', () => {
    expect(
      moveField(
        [
          ['phone', 'email', 'city'],
          ['wechat', 'birthday', 'gender', 'stature'],
        ],
        'stature',
        'slot-0-3',
      ),
    ).toEqual([
      ['phone', 'email', 'city', 'stature'],
      ['wechat', 'birthday', 'gender'],
    ]);
  });
});
