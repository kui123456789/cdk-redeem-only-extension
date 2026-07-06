const test = require('node:test');
const assert = require('node:assert/strict');
const registryModule = require('../background/bootstrap/content-script-registry.js');

test('signup content scripts keep auth detectors before signup-page', () => {
  const registry = registryModule.createContentScriptRegistry();
  const files = registry.getSignupPageInjectFiles();
  assert.equal(files[0], 'content/utils.js');
  assert.ok(files.includes('content/auth-page-detectors.js'));
  assert.ok(files.includes('content/signup-page.js'));
  assert.ok(files.indexOf('content/auth-page-detectors.js') < files.indexOf('content/signup-page.js'));
  assert.equal(new Set(files).size, files.length);
});

test('normalizes duplicate and blank inject files', () => {
  assert.deepEqual(
    registryModule.normalizeInjectFileList([' a.js ', '', 'a.js', 'b.js']),
    ['a.js', 'b.js'],
  );
});

test('entry URLs remain stable', () => {
  const registry = registryModule.createContentScriptRegistry();
  assert.equal(registry.getSignupEntryUrl(), 'https://chatgpt.com/');
  assert.equal(registry.getSignupAuthEntryUrl(), 'https://chatgpt.com/auth/login');
});
