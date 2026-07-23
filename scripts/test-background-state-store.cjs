const test = require('node:test');
const assert = require('node:assert/strict');

globalThis.self = globalThis;
require('../background/bootstrap/state-store.js');

const { createBackgroundStateStore } = globalThis.MultiPageBackgroundStateStore;

test('background state restores persisted custom email pool when session has stale empty pool', async () => {
  const sessionData = {
    customEmailPoolEntries: [],
    customEmailPool: [],
    selectedCustomEmailPoolEmail: '',
  };
  const persistedSettings = {
    customEmailPoolEntries: [{
      id: 'entry-1',
      email: 'saved@example.com',
      enabled: true,
      used: false,
    }],
    customEmailPool: ['saved@example.com'],
    selectedCustomEmailPoolEmail: 'saved@example.com',
  };
  const store = createBackgroundStateStore({
    chrome: {
      storage: {
        session: {
          get: async () => sessionData,
        },
        local: {
          get: async () => ({}),
        },
      },
    },
    defaultState: {
      customEmailPoolEntries: [],
      customEmailPool: [],
      selectedCustomEmailPoolEmail: '',
      upiCredentialMembershipCheckResults: { items: [] },
    },
    getPersistedSettings: async () => persistedSettings,
    buildStateViewWithRuntimeState: (state) => state,
  });

  const state = await store.getState();

  assert.deepEqual(state.customEmailPoolEntries, persistedSettings.customEmailPoolEntries);
  assert.deepEqual(state.customEmailPool, persistedSettings.customEmailPool);
  assert.equal(state.selectedCustomEmailPoolEmail, 'saved@example.com');
});

test('background state merges a partial session pool into the persisted full pool', async () => {
  const sessionData = {
    customEmailPoolEntries: [{
      id: 'entry-1',
      email: 'used@example.com',
      enabled: true,
      used: true,
      accessToken: 'at-current',
    }],
    customEmailPool: [],
    selectedCustomEmailPoolEmail: 'next@example.com',
  };
  const persistedSettings = {
    customEmailPoolEntries: [
      { id: 'entry-1', email: 'used@example.com', enabled: true, used: false },
      { id: 'entry-2', email: 'next@example.com', enabled: true, used: false },
      { id: 'entry-3', email: 'later@example.com', enabled: true, used: false },
    ],
    customEmailPool: ['next@example.com', 'later@example.com'],
    selectedCustomEmailPoolEmail: 'next@example.com',
  };
  const store = createBackgroundStateStore({
    chrome: {
      storage: {
        session: { get: async () => sessionData },
        local: { get: async () => ({}) },
      },
    },
    defaultState: { upiCredentialMembershipCheckResults: { items: [] } },
    getPersistedSettings: async () => persistedSettings,
    buildStateViewWithRuntimeState: (state) => state,
  });

  const state = await store.getState();

  assert.equal(state.customEmailPoolEntries.length, 3);
  assert.deepEqual(state.customEmailPoolEntries[0], sessionData.customEmailPoolEntries[0]);
  assert.deepEqual(state.customEmailPoolEntries.slice(1), persistedSettings.customEmailPoolEntries.slice(1));
  assert.deepEqual(state.customEmailPool, persistedSettings.customEmailPool);
  assert.equal(state.selectedCustomEmailPoolEmail, 'next@example.com');
});

test('background state keeps empty custom email pool when persisted settings are also empty', async () => {
  const store = createBackgroundStateStore({
    chrome: {
      storage: {
        session: {
          get: async () => ({
            customEmailPoolEntries: [],
            customEmailPool: [],
          }),
        },
        local: {
          get: async () => ({}),
        },
      },
    },
    defaultState: {
      customEmailPoolEntries: [],
      customEmailPool: [],
      upiCredentialMembershipCheckResults: { items: [] },
    },
    getPersistedSettings: async () => ({
      customEmailPoolEntries: [],
      customEmailPool: [],
    }),
    buildStateViewWithRuntimeState: (state) => state,
  });

  const state = await store.getState();

  assert.deepEqual(state.customEmailPoolEntries, []);
  assert.deepEqual(state.customEmailPool, []);
});

test('background state persists bounded CDK attempt history for every redeem channel', async () => {
  const localWrites = [];
  const sessionData = {};
  const history = [{
    submittedEmail: 'current@example.com',
    tokenEmail: 'previous@example.com',
    accessToken: 'old-at',
    submittedAt: 123,
  }];
  const store = createBackgroundStateStore({
    chrome: {
      storage: {
        session: {
          get: async () => sessionData,
          set: async (patch) => Object.assign(sessionData, patch),
        },
        local: {
          get: async () => ({}),
          set: async (patch) => localWrites.push(patch),
        },
      },
    },
    defaultState: { upiCredentialMembershipCheckResults: { items: [] } },
    alignUpiRedeemCdkeyAliasStatePatch: (value) => value,
    buildStatePatchWithRuntimeState: (_current, updates) => updates,
    normalizePersistentSettingValue: (_key, value) => value,
  });

  await store.setState({
    upiRedeemCdkeyUsage: { UPI: { redeemAttemptHistory: history } },
    idealRedeemCdkeyUsage: { IDEAL: { redeemAttemptHistory: history } },
    pixChannelRedeemCdkeyUsage: { PIX: { redeemAttemptHistory: history } },
  });

  assert.deepEqual(localWrites, [
    { upiRedeemCdkeyUsage: { UPI: { redeemAttemptHistory: history } } },
    { idealRedeemCdkeyUsage: { IDEAL: { redeemAttemptHistory: history } } },
    { pixChannelRedeemCdkeyUsage: { PIX: { redeemAttemptHistory: history } } },
  ]);
});
