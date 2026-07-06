const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.MultiPageRedeemChannelState;
const policy = require('../shared/redeem-channel-state.js');

test('legacy failure count applies only when legacy channel matches', () => {
  assert.equal(policy.getRedeemChannelFailureCount({ redeemChannel: 'ideal', redeemFailureCount: 2 }, 'ideal'), 2);
  assert.equal(policy.getRedeemChannelFailureCount({ redeemChannel: 'ideal', redeemFailureCount: 2 }, 'upi'), 0);
});

test('UPI failures do not block an otherwise eligible UPI account', () => {
  assert.equal(policy.shouldRedeemItemUseChannel({ trialEligibilityStatus: 'eligible', upiRedeemFailureCount: 9 }, 'upi'), true);
});

test('trial eligibility and channel eligibility are preserved', () => {
  assert.equal(policy.shouldRedeemItemUseChannel({ trialEligibilityStatus: 'unknown' }, 'upi'), false);
  assert.equal(policy.shouldRedeemItemUseChannel(
    { trialEligibilityStatus: 'eligible' },
    'ideal',
    { isTrialEligibilityChannelAllowed: () => false }
  ), false);
});

test('IDEAL is locked after three IDEAL failures', () => {
  assert.equal(policy.isRedeemAccountLocked({ idealRedeemFailureCount: 3 }), true);
  assert.equal(policy.shouldRedeemItemUseChannel({ trialEligibilityStatus: 'eligible', idealRedeemFailureCount: 3 }, 'ideal'), false);
});

test('daily-limit blocking supports explicit until and legacy reason fields', () => {
  const nowMs = Date.parse('2026-07-06T00:00:00.000Z');
  assert.equal(policy.isRedeemChannelDailyLimitBlocked({
    upiRedeemDailyLimitBlockedUntil: '2026-07-06T01:00:00.000Z',
  }, 'upi', { nowMs }), true);
  assert.equal(policy.isRedeemChannelDailyLimitBlocked({
    redeemChannel: 'ideal',
    redeemReason: '该邮箱在该渠道今日提交次数已达上限 3 次 请 24 小时后再试',
    redeemLastFailedAt: '2026-07-05T23:00:00.000Z',
  }, 'ideal', { nowMs }), true);
});
