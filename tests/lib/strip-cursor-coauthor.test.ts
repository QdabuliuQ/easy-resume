import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const script = path.resolve('scripts/strip-cursor-coauthor.mjs');

describe('strip-cursor-coauthor', () => {
  it('removes Cursor co-author trailer from message file', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'strip-cursor-'));
    const file = path.join(dir, 'MSG');
    writeFileSync(
      file,
      'fix: demo\n\nBody.\n\nCo-authored-by: Cursor <cursoragent@cursor.com>\n',
    );
    const r = spawnSync(process.execPath, [script, file], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(readFileSync(file, 'utf8')).toBe('fix: demo\n\nBody.\n');
  });

  it('keeps other co-authors', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'strip-cursor-'));
    const file = path.join(dir, 'MSG');
    writeFileSync(
      file,
      'feat: x\n\nCo-authored-by: Ada <ada@example.com>\nCo-authored-by: Cursor <cursoragent@cursor.com>\n',
    );
    spawnSync(process.execPath, [script, file], { encoding: 'utf8' });
    expect(readFileSync(file, 'utf8')).toBe(
      'feat: x\n\nCo-authored-by: Ada <ada@example.com>\n',
    );
  });
});
