const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.SidepanelAccountRecordsViewModel;
delete globalThis.SidepanelAccountRecordsExport;
delete globalThis.SidepanelAccountRecordsSubscription;
delete globalThis.SidepanelAccountRecordsMembershipGroups;
delete globalThis.SidepanelAccountRecordsRedeemStatus;
delete globalThis.SidepanelMembershipRedeemProgress;
delete globalThis.SidepanelAccountRecordsManager;
delete require.cache[require.resolve('../sidepanel/account-records-export.js')];
delete require.cache[require.resolve('../sidepanel/account-records-subscription.js')];
delete require.cache[require.resolve('../sidepanel/account-records-membership-groups.js')];
delete require.cache[require.resolve('../sidepanel/account-records-redeem-status.js')];
delete require.cache[require.resolve('../sidepanel/account-records-manager.js')];
require('../sidepanel/account-records-export.js');
require('../sidepanel/account-records-subscription.js');
require('../sidepanel/account-records-membership-groups.js');
require('../sidepanel/account-records-redeem-status.js');
require('../sidepanel/account-records-manager.js');

test('createAccountRecordsManager fails loudly when redeem progress module is unavailable', () => {
  assert.throws(
    () => globalThis.SidepanelAccountRecordsManager.createAccountRecordsManager({}),
    /Membership redeem progress module is not loaded/
  );
});

test('summarizeAccountRunHistory preserves counts when view model global is unavailable', () => {
  assert.equal(globalThis.SidepanelAccountRecordsViewModel, undefined);
  globalThis.SidepanelMembershipRedeemProgress = {
    clampRedeemProgressPercent: () => 0,
    getUpiCredentialMembershipRedeemProgressMeta: () => ({}),
    renderUpiCredentialMembershipRedeemProgress: () => '',
  };
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
