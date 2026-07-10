const test = require('node:test');
const assert = require('node:assert/strict');

const { createSettingsRoutes } = require('../background/routes/settings-routes.js');

function createRouteHarness() {
  const writes = [];
  let state = {
    customEmailPoolEntries: [
      { email: 'one@example.com', enabled: true, used: false },
      { email: 'two@example.com', enabled: true, used: false },
    ],
    customEmailPool: ['one@example.com', 'two@example.com'],
    selectedCustomEmailPoolEmail: 'one@example.com',
  };
  const routes = createSettingsRoutes({
    addLog: async () => {},
    broadcastDataUpdate: () => {},
    buildLuckmailSessionSettingsPayload: () => ({}),
    buildPersistentSettingsPayload: (payload = {}) => {
      const { allowEmptyCustomEmailPool, ...settings } = payload;
      return settings;
    },
    exportSettingsBundle: async () => ({}),
    getState: async () => state,
    importSettingsBundle: async () => ({}),
    normalizeHotmailAccounts: (value = []) => Array.isArray(value) ? value : [],
    resolveSignupMethod: () => 'email',
    setPersistentSettings: async (updates) => writes.push({ ...updates }),
    setState: async (updates) => {
      state = { ...state, ...updates };
    },
    validateModeSwitch: () => ({ normalizedUpdates: {} }),
  });
  return { routes, writes, getState: () => state };
}

test('ordinary settings save cannot replace a populated custom email pool with empty arrays', async () => {
  const harness = createRouteHarness();

  await harness.routes.SAVE_SETTING({
    customEmailPoolEntries: [],
    customEmailPool: [],
    selectedCustomEmailPoolEmail: '',
  });

  assert.equal(Object.hasOwn(harness.writes[0], 'customEmailPoolEntries'), false);
  assert.equal(Object.hasOwn(harness.writes[0], 'customEmailPool'), false);
  assert.equal(harness.getState().customEmailPoolEntries.length, 2);
  assert.equal(harness.getState().customEmailPool.length, 2);
  assert.equal(harness.getState().selectedCustomEmailPoolEmail, 'one@example.com');
});

test('explicit custom email pool deletion may persist empty arrays', async () => {
  const harness = createRouteHarness();

  await harness.routes.SAVE_SETTING({
    customEmailPoolEntries: [],
    customEmailPool: [],
    selectedCustomEmailPoolEmail: '',
    allowEmptyCustomEmailPool: true,
  });

  assert.deepEqual(harness.writes[0].customEmailPoolEntries, []);
  assert.deepEqual(harness.writes[0].customEmailPool, []);
  assert.equal(harness.getState().customEmailPoolEntries.length, 0);
});
