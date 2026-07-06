const assert = require('node:assert/strict');
const test = require('node:test');

const moduleApi = require('../background/membership/results-store.js');

test('saveResults normalizes, merges deletion state, persists, and broadcasts', async () => {
  const stored = {
    upiCredentialMembershipCheckResults: {
      items: [{ email: 'old@example.com' }],
      redeemPlusDeletedEmailsByChannel: { ideal: ['gone@example.com'] },
    },
  };
  const writes = [];
  const broadcasts = [];
  const store = moduleApi.createMembershipResultsStore({
    chromeApi: {
      storage: {
        local: {
          get: async () => stored,
          set: async (patch) => writes.push(patch),
        },
      },
    },
    storageKey: 'upiCredentialMembershipCheckResults',
    normalizeResultsPayload: (value) => ({
      items: Array.isArray(value?.items) ? value.items : [],
      redeemPlusDeletedEmailsByChannel: value?.redeemPlusDeletedEmailsByChannel || {},
    }),
    mergeRedeemDeletionStateForSave: (previous) => ({
      redeemPlusDeletedEmailsByChannel: previous.redeemPlusDeletedEmailsByChannel,
    }),
    broadcastDataUpdate: (patch) => broadcasts.push(patch),
  });

  const saved = await store.saveResults({ items: [{ email: 'new@example.com' }] });

  assert.equal(saved.items[0].email, 'new@example.com');
  assert.deepEqual(saved.redeemPlusDeletedEmailsByChannel, { ideal: ['gone@example.com'] });
  assert.deepEqual(writes, [{ upiCredentialMembershipCheckResults: saved }]);
  assert.deepEqual(broadcasts, [{ upiCredentialMembershipCheckResults: saved }]);
});

test('getStoredResults falls back to an empty stored payload when storage read fails', async () => {
  const store = moduleApi.createMembershipResultsStore({
    chromeApi: {
      storage: {
        local: {
          get: async () => {
            throw new Error('storage unavailable');
          },
          set: async () => {},
        },
      },
    },
    storageKey: 'upiCredentialMembershipCheckResults',
    normalizeResultsPayload: (value) => ({
      items: Array.isArray(value?.items) ? value.items : [],
      running: value?.running === true,
    }),
    broadcastDataUpdate: () => {},
  });

  assert.deepEqual(await store.getStoredResults(), { items: [], running: false });
});

test('saveResults ignores setState failures after storage persist', async () => {
  const writes = [];
  const broadcasts = [];
  const store = moduleApi.createMembershipResultsStore({
    chromeApi: {
      storage: {
        local: {
          get: async () => ({}),
          set: async (patch) => writes.push(patch),
        },
      },
    },
    storageKey: 'upiCredentialMembershipCheckResults',
    normalizeResultsPayload: (value) => ({
      items: Array.isArray(value?.items) ? value.items : [],
      redeemPlusDeletedEmailsByChannel: value?.redeemPlusDeletedEmailsByChannel || {},
    }),
    mergeRedeemDeletionStateForSave: () => ({}),
    setState: async () => {
      throw new Error('state write failed');
    },
    broadcastDataUpdate: (patch) => broadcasts.push(patch),
  });

  const saved = await store.saveResults({ items: [{ email: 'new@example.com' }] });

  assert.equal(saved.items[0].email, 'new@example.com');
  assert.equal(writes.length, 1);
  assert.deepEqual(broadcasts, [{ upiCredentialMembershipCheckResults: saved }]);
});
