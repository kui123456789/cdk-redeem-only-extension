const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../sidepanel/upi-info-helper-state.js');

test('normalizes UPI_INFO auto-mode permission values', () => {
  const state = moduleApi.createUpiInfoHelperState();

  assert.equal(state.normalizeUpiInfoAutoModePermissionValue(true), true);
  assert.equal(state.normalizeUpiInfoAutoModePermissionValue(1), true);
  assert.equal(state.normalizeUpiInfoAutoModePermissionValue('enabled'), true);
  assert.equal(state.normalizeUpiInfoAutoModePermissionValue(false), false);
  assert.equal(state.normalizeUpiInfoAutoModePermissionValue(0), false);
  assert.equal(state.normalizeUpiInfoAutoModePermissionValue('disabled'), false);
  assert.equal(state.normalizeUpiInfoAutoModePermissionValue('unknown'), null);
});

test('reads nested auto-mode permission payloads', () => {
  const state = moduleApi.createUpiInfoHelperState();

  assert.equal(state.getUpiInfoAutoModePermissionFromPayload({ data: { auto_mode_enabled: 'yes' } }), true);
  assert.equal(state.getUpiInfoAutoModePermissionFromPayload({ data: { autoEnabled: 'no' } }), false);
  assert.equal(state.hasUpiInfoAutoModePermissionField({ data: { autoEnabled: 'no' } }), true);
  assert.equal(state.isUpiInfoAutoModePermissionDenied({
    legacyPayHelperBalancePayload: { data: { auto_enabled: 0 } },
  }), true);
});

test('normalizes UPI_INFO remaining uses from common response shapes', () => {
  const state = moduleApi.createUpiInfoHelperState();

  assert.equal(state.normalizeUpiInfoRemainingUsesValue('4.9'), 4);
  assert.equal(state.normalizeUpiInfoRemainingUsesValue('-2'), 0);
  assert.equal(state.normalizeUpiInfoRemainingUsesValue('bad'), null);
  assert.equal(state.getUpiInfoBalanceRemainingUsesFromResponse({ data: { remaining_uses: '7' } }), 7);
  assert.equal(state.getUpiInfoBalanceRemainingUsesFromResponse({ payload: { remainingUses: 3 } }), 3);
});

test('delegates to dynamic LegacyPayUtils when available', () => {
  let legacyPayUtils = {
    normalizeUpiInfoRemainingUses: () => 11,
    getUpiInfoBalanceRemainingUses: () => 12,
    isUpiInfoAutoModeEnabled: () => true,
    normalizeUpiInfoOtpChannel: () => 'sms',
  };
  const state = moduleApi.createUpiInfoHelperState({
    legacyPayUtils: () => legacyPayUtils,
  });

  assert.equal(state.normalizeUpiInfoRemainingUsesValue('x'), 11);
  assert.equal(state.getUpiInfoBalanceRemainingUsesFromResponse({}), 12);
  assert.equal(state.getUpiInfoAutoModeEnabledFromResponse({}), true);
  assert.equal(state.normalizeUpiInfoOtpChannelValue('whatsapp'), 'sms');

  legacyPayUtils = null;
  assert.equal(state.normalizeUpiInfoOtpChannelValue('sms'), 'whatsapp');
});
