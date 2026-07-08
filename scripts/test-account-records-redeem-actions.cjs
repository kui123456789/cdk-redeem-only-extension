const assert = require('node:assert/strict');
const test = require('node:test');

delete globalThis.SidepanelAccountRecordsRedeemActions;
const redeemActionsApi = require('../sidepanel/account-records-redeem-actions.js');

test('one-click Free redeem refreshes latest results before selecting candidates', async () => {
  let refreshed = false;
  const messages = [];
  const actions = redeemActionsApi.createAccountRecordsRedeemActions({
    state: { syncLatestState: () => {} },
    helpers: { showToast: () => {} },
    runtime: {
      sendMessage: async (message) => {
        messages.push(message);
        return {
          results: {
            paidCount: 0,
            freeCount: 1,
            failedCount: 0,
            items: [],
          },
        };
      },
    },
    refreshUpiCredentialMembershipCheckResults: async () => {
      refreshed = true;
      return {};
    },
    getEnabledFreeUpiCredentialMembershipRowsForChannel: () => (
      refreshed
        ? [{ email: 'fresh@example.com', accessToken: 'at-fresh', password: 'pw', totpMfaSecret: 'secret' }]
        : []
    ),
    getUpiCredentialMembershipPoolSource: () => 'txt-free',
  });

  const outcome = await actions.startUpiCredentialMembershipFreeRedeem(null, { channel: 'upi' });

  assert.equal(outcome.ok, true);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].type, 'REDEEM_UPI_CREDENTIAL_MEMBERSHIP_FREE');
  assert.deepEqual(messages[0].payload.credentials.map((item) => item.email), ['fresh@example.com']);
});
