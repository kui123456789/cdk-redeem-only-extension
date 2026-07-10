const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadModule() {
  const sandbox = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../sidepanel/settings-transfer-manager.js'), 'utf8'),
    sandbox,
    { filename: 'sidepanel/settings-transfer-manager.js' }
  );
  return sandbox.window.SidepanelSettingsTransferManager;
}

test('settings export persists the visible custom email pool before reading background settings', async () => {
  const calls = [];
  const manager = loadModule().createSettingsTransferManager({
    controls: {},
    helpers: {
      requestTextFileSaveTarget: async () => ({ handle: 'save-target' }),
      buildDownloadFileTimestamp: () => '20260710-000000',
      closeConfigMenu: () => {},
      flushPendingSettingsBeforeExport: async () => calls.push('flush'),
      persistCustomEmailPoolBeforeExport: async () => calls.push('pool'),
      downloadTextFile: async () => ({ fileName: 'settings.json' }),
      showToast: () => {},
    },
    runtime: {
      sendMessage: async () => {
        calls.push('export');
        return { fileContent: '{}', fileName: 'settings.json' };
      },
    },
  });

  await manager.exportSettingsFile();

  assert.deepEqual(calls, ['flush', 'pool', 'export']);
});
