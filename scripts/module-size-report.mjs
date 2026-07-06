#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const codePatterns = ['*.js', '*.mjs', '*.html', '*.css'];
const ignoredTopLevelDirs = new Set([
  '.git',
  '.codegraph',
  '.codex-backups',
  '_metadata',
  'release-artifacts',
]);
const topLimit = 20;

function gitLsFiles(patterns) {
  return execFileSync('git', ['ls-files', ...patterns], {
    cwd: root,
    encoding: 'utf8',
  })
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isTrackedCodeFile(file) {
  const [topLevel] = file.split(/[\\/]/);
  return !ignoredTopLevelDirs.has(topLevel);
}

function countLines(text) {
  if (text.length === 0) return 0;
  const newlineCount = text.match(/\n/g)?.length || 0;
  return newlineCount + (text.endsWith('\n') ? 0 : 1);
}

const files = gitLsFiles(codePatterns)
  .filter(isTrackedCodeFile)
  .map((file) => {
    const absolutePath = path.join(root, file);
    const text = fs.readFileSync(absolutePath, 'utf8');
    return {
      file,
      lines: countLines(text),
      bytes: Buffer.byteLength(text),
    };
  })
  .sort((left, right) => right.lines - left.lines || right.bytes - left.bytes);

console.log(`Top ${topLimit} tracked JavaScript/HTML/CSS files by line count:`);
for (const row of files.slice(0, topLimit)) {
  console.log(`${String(row.lines).padStart(6)} ${String(row.bytes).padStart(8)} ${row.file}`);
}
