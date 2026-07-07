const test = require('node:test');
const assert = require('node:assert/strict');

const { createCustomEmailPoolState } = require('../background/custom-email-pool-state.js');
const {
  normalizeCustomEmailVerificationUrl,
  parseCustomEmailPoolEntryValue,
  parseHiddenEmailCredential,
} = require('../mail-provider-utils.js');

test('custom email pool state normalizes verification URL rows', () => {
  const state = createCustomEmailPoolState({
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
  });

  const [entry] = state.normalizeCustomEmailPoolEntryObjects([
    'sample@example.com----https://assurivo.com/console/open.php?mail=sample%40example.com&pwd=pw&limit=5',
  ]);

  assert.equal(entry.email, 'sample@example.com');
  assert.equal(entry.credential, '');
  assert.equal(entry.verificationUrl, 'https://assurivo.com/console/open.php?mail=sample%40example.com&pwd=pw&limit=5');
  assert.equal(entry.enabled, true);
  assert.equal(entry.used, false);
});

test('custom email pool state marks ineligible entries used and persists state', async () => {
  const writes = [];
  const logs = [];
  let currentState = {
    customEmailPoolEntries: [
      {
        id: 'entry-1',
        email: 'sample@example.com',
        enabled: true,
        used: false,
      },
    ],
    selectedCustomEmailPoolEmail: 'sample@example.com',
  };
  const state = createCustomEmailPoolState({
    addLog: async (message, level) => logs.push({ message, level }),
    broadcastDataUpdate: (payload) => writes.push({ kind: 'broadcast', payload }),
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async (payload) => writes.push({ kind: 'persist', payload }),
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
      writes.push({ kind: 'state', payload });
    },
  });

  const result = await state.markCurrentCustomEmailPoolEntryTrialIneligible(currentState, {
    email: 'sample@example.com',
    reason: 'not-eligible',
    checkedAt: '2026-07-08T00:00:00.000Z',
  });

  assert.equal(result.updated, true);
  assert.equal(result.customEmailPoolEntries[0].used, true);
  assert.equal(result.customEmailPoolEntries[0].note, '无试用资格');
  assert.equal(result.customEmailPoolEntries[0].trialEligibilityStatus, 'ineligible');
  assert.deepEqual(result.customEmailPool, []);
  assert.equal(currentState.selectedCustomEmailPoolEmail, '');
  assert.equal(writes.some((write) => write.kind === 'persist'), true);
  assert.equal(writes.some((write) => write.kind === 'state'), true);
  assert.equal(logs[0].level, 'warn');
});
