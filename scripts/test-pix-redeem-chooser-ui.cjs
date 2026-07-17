const assert = require('node:assert/strict');
const test = require('node:test');

const rendererApi = require('../sidepanel/account-records-membership-results-renderer.js');
const panelEventsApi = require('../sidepanel/account-records-panel-events.js');

test('Free actions render a direct PIX redeem button and chooser-based all redeem button', () => {
  const container = {
    innerHTML: '',
    querySelector: () => null,
  };
  const row = {
    email: 'free@example.com',
    status: 'free',
    enabled: true,
    accessToken: 'at-token',
    password: 'pw',
    totpMfaSecret: 'secret',
  };
  const renderer = rendererApi.createAccountRecordsMembershipResultsRenderer({
    dom: { upiCredentialMembershipCheckResults: container },
    state: { getLatestState: () => ({}) },
    getUpiCredentialMembershipCheckResults: () => ({ items: [row], completed: 1, total: 1 }),
    buildUpiCredentialMembershipDisplayRows: () => [row],
    getUpiCredentialMembershipUiGroup: () => 'free',
    summarizeMembershipViewModelRows: () => ({ free: 1, 'upi-plus': 0, 'ideal-plus': 0, 'pix-plus': 0 }),
    isRedeemableFreeUpiCredentialMembershipRow: () => true,
    isRedeemableFreeUpiCredentialMembershipRowForChannel: () => true,
    getAvailableUpiRedeemCdkeyCount: (_state, channel) => ({ upi: 1, ideal: 2, pix: 3 }[channel] || 0),
  });

  renderer.renderUpiCredentialMembershipCheckResults();

  assert.match(container.innerHTML, /data-upi-membership-redeem-channel="pix"/);
  assert.match(container.innerHTML, /一键兑换 PIX\(1\/1\)/);
  assert.match(container.innerHTML, /data-upi-membership-redeem-all/);
  assert.match(container.innerHTML, /选择要使用的卡密池/);
});

test('all redeem click waits for the channel chooser and runs the selected PIX channel', async () => {
  const target = {};
  const calls = [];
  const events = panelEventsApi.createAccountRecordsPanelEvents({
    findClosest: (_target, selector) => selector === '[data-upi-membership-redeem-all]' ? target : null,
    openRedeemChannelChoiceDialog: async () => {
      calls.push('choose');
      return 'pix';
    },
    startUpiCredentialMembershipAllRedeem: async (channel) => {
      calls.push(`redeem:${channel}`);
    },
  });

  await events.handleUpiCredentialMembershipCheckResultsClick({ target });

  assert.deepEqual(calls, ['choose', 'redeem:pix']);
});
