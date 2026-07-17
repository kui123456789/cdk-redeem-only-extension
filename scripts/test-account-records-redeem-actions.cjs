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

test('selected PIX all-redeem path refreshes state and runs only PIX', async () => {
  let refreshed = false;
  const requestedChannels = [];
  const messages = [];
  const actions = redeemActionsApi.createAccountRecordsRedeemActions({
    state: {
      getLatestState: () => ({ pixChannelRedeemCdkeyPoolText: 'PIX_A' }),
      syncLatestState: () => {},
    },
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
    normalizeRedeemChannel: (value) => ['upi', 'ideal', 'pix'].includes(value) ? value : 'upi',
    getRedeemChannelLabel: (value) => String(value || '').toUpperCase(),
    refreshUpiCredentialMembershipCheckResults: async () => {
      refreshed = true;
      return {};
    },
    getUpiCredentialMembershipCheckResults: () => ({ items: [] }),
    getEnabledFreeUpiCredentialMembershipRowsForChannel: (channel) => {
      requestedChannels.push(channel);
      return refreshed && channel === 'pix'
        ? [{ email: 'pix@example.com', accessToken: 'at-pix', password: 'pw', totpMfaSecret: 'secret' }]
        : [];
    },
    getAvailableUpiRedeemCdkeyCount: (_state, channel) => channel === 'pix' ? 1 : 0,
    getUpiCredentialMembershipPoolSource: () => 'txt-free',
  });

  await actions.startUpiCredentialMembershipAllRedeem('pix');

  assert.deepEqual(requestedChannels, ['pix']);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].payload.channel, 'pix');
  assert.equal(messages[0].payload.source, 'free-all-pix');
  assert.deepEqual(messages[0].payload.credentials.map((item) => item.email), ['pix@example.com']);
});

test('cancel PIX redeem job preserves PIX channel and canonical pool field', async () => {
  const messages = [];
  const actions = redeemActionsApi.createAccountRecordsRedeemActions({
    state: {
      getLatestState: () => ({ pixChannelRedeemCdkeyPoolText: 'PIX_A' }),
      syncLatestState: () => {},
    },
    helpers: { showToast: () => {} },
    runtime: {
      sendMessage: async (message) => {
        messages.push(message);
        return { items: [{ cdkey: 'PIX_A', cancelled: true }] };
      },
    },
    normalizeRedeemChannel: (value) => ['upi', 'ideal', 'pix'].includes(value) ? value : 'upi',
    getUpiCredentialMembershipDisplayRowByEmail: () => ({ email: 'pix@example.com', redeemChannel: 'pix' }),
    getStoredCdkPoolText: (_state, channel) => channel === 'pix' ? 'PIX_A' : '',
    refreshUpiCredentialMembershipCheckResults: async () => ({}),
  });

  await actions.cancelUpiCredentialMembershipRedeemJob('pix@example.com', 'PIX_A', 'pix');

  assert.equal(messages.length, 1);
  assert.equal(messages[0].payload.channel, 'pix');
  assert.equal(messages[0].payload.pixChannelRedeemCdkeyPoolText, 'PIX_A');
});
