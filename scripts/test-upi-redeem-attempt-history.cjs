const assert = require('node:assert/strict');
const test = require('node:test');

delete globalThis.MultiPageRedeemChannelState;
delete globalThis.MultiPageRedeemAttemptHistory;
delete globalThis.MultiPageRedeemCdkeyUsage;
require('../shared/redeem-channel-state.js');
require('../background/membership/redeem-attempt-history.js');
const usageHelpers = require('../background/redeem/redeem-cdkey-usage.js');
const { createUpiRedeemChannelSubmission } = require('../background/steps/upi-redeem/channel-submission.js');

test('reserving a CDK submission persists the target and real AT email in bounded history', async () => {
  const nowMs = Date.parse('2026-07-23T00:00:00.000Z');
  let state = { upiRedeemCdkeyUsage: {} };
  const writes = [];
  const submission = createUpiRedeemChannelSubmission({
    constants: {},
    now: () => nowMs,
    normalizeString: (value = '') => String(value || '').trim(),
    normalizeBoolean: (value) => value === true,
    normalizeSubscriptionPlanType: (value = '') => String(value || '').trim().toLowerCase(),
    normalizeRedeemChannel: (value = '') => globalThis.MultiPageRedeemChannelState.normalizeRedeemChannel(value),
    getRedeemChannelStateHelpers: () => globalThis.MultiPageRedeemChannelState,
    getRedeemCdkeyUsageHelpers: () => usageHelpers,
    getMergedState: async (patch = {}) => ({ ...state, ...patch }),
    setState: async (patch) => {
      writes.push(patch);
      state = { ...state, ...patch };
    },
    maskAccessToken: () => 'masked-at',
  });

  await submission.reserveCdkeyForRedeemSubmission({
    cdkey: 'CDK-A',
    channel: 'upi',
    email: 'current@example.com',
    tokenEmail: 'previous@example.com',
    accessToken: 'header.payload.signature',
    attemptAt: nowMs,
  });

  const entry = writes.at(-1).upiRedeemCdkeyUsage['CDK-A'];
  assert.equal(entry.redeemAttemptHistory.length, 1);
  assert.equal(entry.redeemAttemptHistory[0].submittedEmail, 'current@example.com');
  assert.equal(entry.redeemAttemptHistory[0].tokenEmail, 'previous@example.com');
  assert.equal(entry.redeemAttemptHistory[0].accessToken, 'header.payload.signature');
});
