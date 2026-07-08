const test = require('node:test');
const assert = require('node:assert/strict');

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};

require('../sidepanel/custom-email-pool-storage.js');

const storage = globalThis.SidepanelCustomEmailPoolStorage;
const normalizeEntries = (entries) => (Array.isArray(entries) ? entries.filter((entry) => entry?.email) : []);

test('custom email pool storage restores persisted entries before backup', () => {
  storage.writeEntriesBackup([{ email: 'backup@example.com' }]);

  const restored = storage.restoreEntriesFromState({
    customEmailPoolEntries: [{ email: 'persisted@example.com' }],
  }, normalizeEntries);

  assert.deepEqual(restored, [{ email: 'persisted@example.com' }]);
});

test('custom email pool storage falls back to backup when state is empty', () => {
  storage.writeEntriesBackup([{ email: 'backup@example.com' }]);

  const restored = storage.restoreEntriesFromState({
    customEmailPoolEntries: [],
    customEmailPool: [],
  }, normalizeEntries);

  assert.deepEqual(restored, [{ email: 'backup@example.com' }]);
});

test('custom email pool storage clears backup only when requested', () => {
  storage.writeEntriesBackup([{ email: 'backup@example.com' }]);
  storage.syncEntriesBackup([], { clearBackup: true });

  const restored = storage.restoreEntriesFromState({}, normalizeEntries);

  assert.deepEqual(restored, []);
});
