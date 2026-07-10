const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const backgroundSource = fs.readFileSync(
  path.join(__dirname, '..', 'background.js'),
  'utf8'
);

test('background defines one auto-email readiness function with pool recovery', () => {
  const definitions = backgroundSource.match(/async function ensureAutoEmailReady\s*\(/g) || [];

  assert.equal(definitions.length, 1, 'ensureAutoEmailReady must have exactly one definition');
  assert.match(
    backgroundSource,
    /async function ensureAutoEmailReady\s*\([^)]*\)\s*\{[\s\S]*?restoreCustomEmailPoolForAutoRunIfNeeded\(currentState\)/,
    'ensureAutoEmailReady must recover a missing runtime custom email pool'
  );
});
