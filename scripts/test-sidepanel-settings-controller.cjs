const test = require('node:test');
const assert = require('node:assert/strict');

const appStateModule = require('../sidepanel/app-state.js');
const settingsControllerModule = require('../sidepanel/settings-controller.js');

function createButton() {
  return {
    disabled: false,
    textContent: '',
  };
}

test('settings controller marks dirty state and updates save button', () => {
  const appState = appStateModule.createSidepanelAppState({
    latestState: {},
    settingsDirty: false,
    settingsSaveInFlight: false,
    settingsAutoSaveTimer: null,
    settingsSaveRevision: 0,
    customPasswordSaveRevision: 0,
  });
  const btnSaveSettings = createButton();
  let configMenuUpdates = 0;

  const controller = settingsControllerModule.createSettingsController({
    appState,
    scopeValues: {
      btnSaveSettings,
      collectSettingsPayload: () => ({}),
      applySettingsState: () => {},
      syncLatestState: () => {},
      updatePanelModeUI: () => {},
      updateMailProviderUI: () => {},
      updateButtonStates: () => {},
      updateConfigMenuControls: () => {
        configMenuUpdates += 1;
      },
      showToast: () => {},
      currentAutoRun: { autoRunning: false },
      chrome: { runtime: { sendMessage: async () => ({}) } },
    },
  });

  controller.markSettingsDirty(true);

  assert.equal(appState.get('settingsDirty'), true);
  assert.equal(appState.get('settingsSaveRevision'), 1);
  assert.equal(btnSaveSettings.disabled, false);
  assert.equal(btnSaveSettings.textContent, '保存');
  assert.equal(configMenuUpdates > 0, true);
});

test('settings controller saves settings through runtime bridge and clears dirty flag', async () => {
  const appState = appStateModule.createSidepanelAppState({
    latestState: { preserved: true },
    settingsDirty: true,
    settingsSaveInFlight: false,
    settingsAutoSaveTimer: null,
    settingsSaveRevision: 4,
    customPasswordSaveRevision: 0,
  });
  const btnSaveSettings = createButton();
  const sentMessages = [];
  const syncedStates = [];

  const controller = settingsControllerModule.createSettingsController({
    appState,
    scopeValues: {
      btnSaveSettings,
      collectSettingsPayload: () => ({ alpha: 'beta' }),
      applySettingsState: () => {},
      syncLatestState: (payload) => {
        syncedStates.push(payload);
        appState.patchLatestState(payload);
        appState.set('settingsDirty', false);
      },
      updatePanelModeUI: () => {},
      updateMailProviderUI: () => {},
      updateButtonStates: () => {},
      updateConfigMenuControls: () => {},
      showToast: () => {},
      currentAutoRun: { autoRunning: false },
      chrome: {
        runtime: {
          sendMessage: async (message) => {
            sentMessages.push(message);
            return {};
          },
        },
      },
    },
  });

  await controller.saveSettings({ silent: true });

  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].type, 'SAVE_SETTING');
  assert.deepEqual(sentMessages[0].payload, { alpha: 'beta' });
  assert.deepEqual(syncedStates, [{ alpha: 'beta' }]);
  assert.equal(appState.get('settingsDirty'), false);
  assert.equal(appState.get('settingsSaveInFlight'), false);
  assert.equal(btnSaveSettings.textContent, '保存');
});
