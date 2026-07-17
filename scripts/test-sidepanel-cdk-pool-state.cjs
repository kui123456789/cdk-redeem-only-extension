const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../sidepanel/cdk-pool-state.js');

test('normalizes and deduplicates CDK pool text', () => {
  const helpers = moduleApi.createCdkPoolStateHelpers();
  assert.equal(
    helpers.normalizeUpiRedeemCdkeyPoolTextValue(' ABCD \r\n\nEFGH\nABCD\n '),
    'ABCD\nEFGH'
  );
  assert.deepEqual(helpers.parseUpiRedeemCdkeyPoolTextValue(' ABCD \n EFGH '), ['ABCD', 'EFGH']);
});

test('builds UPI and IDEAL state patches with expected aliases', () => {
  const helpers = moduleApi.createCdkPoolStateHelpers();
  const upiPatch = helpers.buildCdkPoolStatePatch('UPI-1', { 'UPI-1': { enabled: true } }, 'upi');
  assert.equal(upiPatch.cdkPoolText, 'UPI-1');
  assert.equal(upiPatch.upiRedeemCdkeyPoolText, 'UPI-1');
  assert.equal(upiPatch.pixRedeemCdkeyPoolText, 'UPI-1');
  assert.ok(upiPatch.cdkUsage['UPI-1']);
  assert.ok(upiPatch.upiRedeemCdkeyUsage['UPI-1']);

  const idealPatch = helpers.buildCdkPoolStatePatch('IDEAL-1', { 'IDEAL-1': { enabled: true } }, 'ideal');
  assert.deepEqual(Object.keys(idealPatch).sort(), ['idealRedeemCdkeyPoolText', 'idealRedeemCdkeyUsage']);
  assert.equal(idealPatch.idealRedeemCdkeyPoolText, 'IDEAL-1');
});

test('PIX pool patch uses canonical PIX fields without UPI aliases', () => {
  const helpers = moduleApi.createCdkPoolStateHelpers();
  const patch = helpers.buildCdkPoolStatePatch('PIX-1', { 'PIX-1': { enabled: true } }, 'pix');
  assert.equal(patch.pixChannelRedeemCdkeyPoolText, 'PIX-1');
  assert.ok(patch.pixChannelRedeemCdkeyUsage['PIX-1']);
  assert.equal(patch.upiRedeemCdkeyPoolText, undefined);
  assert.equal(patch.pixRedeemCdkeyPoolText, undefined);
  assert.equal(helpers.getStoredCdkPoolText(patch, 'pix'), 'PIX-1');
  assert.ok(helpers.getStoredCdkUsage(patch, 'pix')['PIX-1']);
});

test('selectability blocks active success duplicate and subscription CDKs', () => {
  const helpers = moduleApi.createCdkPoolStateHelpers();
  assert.equal(helpers.isUpiRedeemCdkeySelectableForRedeem({ enabled: true }), true);
  assert.equal(helpers.isUpiRedeemCdkeySelectableForRedeem({ enabled: false }), false);
  assert.equal(helpers.isUpiRedeemCdkeySelectableForRedeem({ enabled: true, remoteStatus: 'success' }), false);
  assert.equal(helpers.isUpiRedeemCdkeySelectableForRedeem({ enabled: true, remoteStatus: 'running' }), false);
  assert.equal(helpers.isUpiRedeemCdkeySelectableForRedeem({ enabled: true, remoteMessage: 'CDK already submitted' }), false);
  assert.equal(helpers.isUpiRedeemCdkeySelectableForRedeem({ enabled: true, subscriptionActive: true }), false);
});

test('remote status helpers preserve UI classes and retry/cancel policy', () => {
  const helpers = moduleApi.createCdkPoolStateHelpers();
  assert.equal(helpers.normalizeUpiRedeemRemoteStatusValue('兑换中'), 'processing');
  assert.equal(helpers.getUpiRedeemRemoteStatusLabel('pending_dispatch'), '等待兑换');
  assert.equal(helpers.getUpiRedeemRemoteStatusClass('running'), 'running');
  assert.equal(helpers.getUpiRedeemRemoteStatusClass('failed'), 'failed');
  assert.equal(helpers.canCancelUpiRedeemCdkeyJob({ enabled: true, remoteStatus: 'running' }), true);
  assert.equal(helpers.canRetryUpiRedeemCdkeyJob({
    enabled: true,
    canRetry: true,
    canReuseToken: true,
    hasAccessToken: true,
    remoteStatus: 'failed',
  }), true);
});
