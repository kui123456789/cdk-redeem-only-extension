const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../sidepanel/account-records-cdk-pool-text.js');

test('account records read independent PIX pool and usage', () => {
  const helpers = moduleApi.createAccountRecordsCdkPoolTextHelpers({
    normalizeRedeemChannel: (value) => String(value || '').trim().toLowerCase(),
  });
  const state = {
    pixChannelRedeemCdkeyPoolText: 'PIX_A',
    pixChannelRedeemCdkeyUsage: { PIX_A: { remoteStatus: 'failed' } },
    pixRedeemCdkeyPoolText: 'OLD_UPI',
  };
  assert.equal(helpers.getStoredCdkPoolText(state, 'pix'), 'PIX_A');
  assert.deepEqual(helpers.getUpiRedeemCdkeyUsage(state, 'pix'), state.pixChannelRedeemCdkeyUsage);
  assert.equal(helpers.getStoredCdkPoolText(state, 'upi'), 'OLD_UPI');
});

