import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT_DIR = process.cwd();
const TARGET_FILES = [
  'manifest.json',
  'background.js',
  'background/message-router.js',
  'background/runtime-state.js',
  'background/settings-normalizers.js',
  'sidepanel/sidepanel.js',
  'sidepanel/sidepanel.css',
  'sidepanel/sidepanel.html',
  'sidepanel/settings-transfer-manager.js',
  'sidepanel/styles/settings.css',
  'scripts/audit-smoke-tests.mjs',
];

const FORMER_STORAGE_KEY_PREFIX = 'removed' + 'Network';
const FORMER_STORAGE_KEY_SUFFIXES = [
  'AccountCurrent',
  'AccountCurrentIndex',
  'AccountLifeMinutes',
  'AccountList',
  'AccountPool',
  'AccountSessionPrefix',
  'ApiCurrent',
  'ApiCurrentIndex',
  'ApiPool',
  'ApiUrl',
  'Applied',
  'AppliedAt',
  'AppliedError',
  'AppliedExitDetecting',
  'AppliedExitEndpoint',
  'AppliedExitError',
  'AppliedExitIp',
  'AppliedExitRegion',
  'AppliedExitSource',
  'AppliedHasAuth',
  'AppliedHost',
  'AppliedPort',
  'AppliedProvider',
  'AppliedReason',
  'AppliedRegion',
  'AppliedWarning',
  'AutoSyncEnabled',
  'AutoSyncIntervalMinutes',
  'Current',
  'CurrentIndex',
  'Enabled',
  'ExitRegion',
  'Host',
  'Mode',
  'Password',
  'Pool',
  'PoolTargetCount',
  'Port',
  'Protocol',
  'Region',
  'Service',
  'ServiceProfiles',
  'Username',
];

const REMNANT_PATTERNS = [
  { label: 'removedNetwork identifier', pattern: /removedNetwork/ },
  { label: 'RemovedNetwork identifier', pattern: /RemovedNetwork/ },
  { label: 'REMOVED_NETWORK constant', pattern: /REMOVED_NETWORK/ },
  { label: 'removed-network token', pattern: /removed-network/i },
  { label: 'Removed Network label', pattern: /Removed\s+Network/i },
  { label: 'IP proxy pool text', pattern: /(?:IP\s*代理|IP\s*proxy|proxy\s+pool|代理池)/i },
  { label: 'runtime proxy field mapping', pattern: /RUNTIME_PROXY_FIELDS|serviceState\.proxy/ },
  ...FORMER_STORAGE_KEY_SUFFIXES.map((suffix) => ({
    label: `former storage key ${FORMER_STORAGE_KEY_PREFIX}${suffix}`,
    pattern: new RegExp(`${FORMER_STORAGE_KEY_PREFIX}${suffix}`),
  })),
];

const matches = [];

for (const relativePath of TARGET_FILES) {
  const absolutePath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing audit target: ${relativePath}`);
  }

  const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const { label, pattern } of REMNANT_PATTERNS) {
      if (pattern.test(line)) {
        matches.push({
          file: relativePath,
          line: index + 1,
          label,
          text: line.trim(),
        });
      }
    }
  });
}

if (matches.length) {
  console.error('Removed Network remnants found:');
  for (const match of matches) {
    console.error(`${match.file}:${match.line}: ${match.label}: ${match.text}`);
  }
  process.exit(1);
}

console.log('No Removed Network remnants found.');
