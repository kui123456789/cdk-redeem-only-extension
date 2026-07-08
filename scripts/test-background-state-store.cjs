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
