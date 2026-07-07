const test = require('node:test');
const assert = require('node:assert/strict');

const moduleApi = require('../sidepanel/app-state.js');

test('app state reads, writes, and patches latest state', () => {
  const appState = moduleApi.createSidepanelAppState({
    latestState: { foo: 1 },
    settingsDirty: false,
  });

  assert.deepEqual(appState.getLatestState(), { foo: 1 });
  assert.deepEqual(appState.patchLatestState({ bar: 2 }), { foo: 1, bar: 2 });
  assert.equal(appState.get('settingsDirty'), false);
  appState.set('settingsDirty', true);
  assert.equal(appState.get('settingsDirty'), true);
});

test('app state scope proxies tracked mutable bindings', () => {
  const appState = moduleApi.createSidepanelAppState({
    latestState: null,
    settingsSaveRevision: 0,
  });

  const scope = appState.createScope();
  scope.settingsSaveRevision = 3;
  scope.latestState = { ready: true };

  assert.equal(appState.get('settingsSaveRevision'), 3);
  assert.deepEqual(appState.getLatestState(), { ready: true });
});
