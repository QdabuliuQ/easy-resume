#!/usr/bin/env node
/**
 * Strip Cursor Co-authored-by from a message file, or from stdin → stdout.
 * Usage:
 *   node scripts/strip-cursor-coauthor.mjs <message-file>
 *   git filter-branch --msg-filter 'node scripts/strip-cursor-coauthor.mjs'
 */
import { readFileSync, writeFileSync } from 'node:fs';

function strip(text) {
  const lines = text.split(/\r?\n/);
  const kept = lines.filter((line) => !/^Co-authored-by:\s*Cursor\b/i.test(line));
  while (kept.length > 0 && kept[kept.length - 1] === '') kept.pop();
  return kept.length ? `${kept.join('\n')}\n` : '\n';
}

const file = process.argv[2];
if (file) {
  const raw = readFileSync(file, 'utf8');
  const next = strip(raw);
  if (next !== raw) writeFileSync(file, next);
} else {
  process.stdout.write(strip(readFileSync(0, 'utf8')));
}
