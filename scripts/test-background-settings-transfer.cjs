const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../background/bootstrap/settings-transfer.js');

function createTransfer(overrides = {}) {
  return moduleApi.createSettingsTransfer({
    chromeApi: {
      runtime: { getManifest: () => ({ version: '9.9.9' }) },
      storage: { local: { get: async () => ({}), set: async () => {} } },
    },
    settingsExportFilenamePrefix: 'multipage-settings',
    settingsExportSchemaVersion: 1,
    storageKeys: {
      membershipResults: 'upiCredentialMembershipCheckResults',
      credentialBackups: 'upiAccountCredentialBackups',
      accountRunHistory: 'accountRunHistory',
    },
    defaultState: { upiCredentialMembershipCheckResults: { items: [] } },
    ...overrides,
  });
}

test('builds stable settings export filenames', () => {
  const transfer = createTransfer();
  const date = new Date(2026, 6, 7, 8, 9, 5);
  assert.equal(
    transfer.buildSettingsExportFilename(date),
    'multipage-settings-20260707-080905.json'
  );
});

test('normalizes membership runtime results and clears active flags', () => {
  const transfer = createTransfer();
  const result = transfer.normalizeSettingsRuntimeMembershipResults({
    running: true,
    redeeming: true,
    items: [
      { email: 'a@example.com', status: 'paid' },
      { email: 'b@example.com', status: 'free' },
      { email: 'c@example.com', status: 'failed' },
    ],
    total: 1,
    completed: 1,
  });

  assert.equal(result.running, false);
  assert.equal(result.redeeming, false);
  assert.equal(result.total, 3);
  assert.equal(result.completed, 3);
  assert.equal(result.paidCount, 1);
  assert.equal(result.freeCount, 1);
  assert.equal(result.failedCount, 1);
});

test('builds runtime import updates for membership backups history and alias state', () => {
  const transfer = createTransfer({
    persistentAliasStateKeys: ['manualAliasUsage', 'preservedAliases', 'icloudAliasCache', 'icloudAliasCacheAt'],
    normalizeBooleanMap: (value = {}) => Object.fromEntries(
      Object.entries(value || {}).map(([key, item]) => [String(key).toLowerCase(), item === true])
    ),
    normalizeIcloudAliasCacheList: (value = []) => Array.isArray(value) ? value.map((item) => ({ ...item })) : [],
  });

  const updates = transfer.buildSettingsRuntimeDataImportUpdates({
    runtimeData: {
      upiCredentialMembershipCheckResults: { items: [{ email: 'a@example.com', status: 'free' }] },
      upiAccountCredentialBackups: { 'A@EXAMPLE.COM': { password: 'pw' } },
      accountRunHistory: [{ id: '1' }],
      aliasState: {
        manualAliasUsage: { 'A@EXAMPLE.COM': true },
        preservedAliases: { 'B@EXAMPLE.COM': false },
        icloudAliasCache: [{ email: 'alias@example.com' }],
        icloudAliasCacheAt: 123,
      },
    },
  });

  assert.equal(updates.upiCredentialMembershipCheckResults.items.length, 1);
  assert.equal(updates.upiAccountCredentialBackups['a@example.com'].email, 'a@example.com');
  assert.equal(updates.accountRunHistory.length, 1);
  assert.equal(updates.manualAliasUsage['a@example.com'], true);
  assert.equal(updates.icloudAliasCacheAt, 123);
});
