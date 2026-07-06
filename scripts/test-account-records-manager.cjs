const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.SidepanelAccountRecordsViewModel;
delete globalThis.SidepanelAccountRecordsManager;
delete require.cache[require.resolve('../sidepanel/account-records-manager.js')];
require('../sidepanel/account-records-manager.js');

test('summarizeAccountRunHistory preserves counts when view model global is unavailable', () => {
  assert.equal(globalThis.SidepanelAccountRecordsViewModel, undefined);
  const manager = globalThis.SidepanelAccountRecordsManager.createAccountRecordsManager({});

  assert.deepEqual(manager.summarizeAccountRunHistory([
    { displayStatus: 'success', retryCount: 0 },
    { finalStatus: 'running', retryCount: '2' },
    { displayStatus: 'failed', retryCount: 1 },
    { finalStatus: 'stopped', retryCount: -1 },
    { displayStatus: 'unknown', retryCount: 'bad' },
  ]), {
    total: 5,
    success: 1,
    running: 1,
    failed: 1,
    stopped: 1,
    retryRecordCount: 2,
    retryTotal: 3,
  });
});
