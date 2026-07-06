const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.MultiPageRedeemChannelState;
delete globalThis.MultiPageRedeemCdkeyUsage;
require('../shared/redeem-channel-state.js');
const usage = require('../background/redeem/redeem-cdkey-usage.js');

test('reads legacy UPI CDK pool aliases', () => {
  assert.equal(usage.getRedeemChannelPoolText({ cdkPoolText: 'A\nB' }, 'upi'), 'A\nB');
});

test('filters unavailable CDKs from pool text without treating usedAt alone as unavailable', () => {
  assert.deepEqual(usage.getAvailableCdkeys('A\nB\nC', {
    A: { enabled: false },
    B: { usedAt: '2026-07-06T00:00:00.000Z' },
    C: { remoteStatus: 'failed' },
  }), ['B', 'C']);
  assert.deepEqual(usage.getAvailableCdkeys('A\nB', {
    A: { remoteStatus: 'pending' },
    B: { usedAt: '2026-07-06T00:00:00.000Z' },
  }), ['B']);
});

test('deduplicates CDK pool lines while preserving first-seen order', () => {
  assert.deepEqual(usage.parseCdkeyPoolText(' A \r\nB\nA\n\n C \nB'), ['A', 'B', 'C']);
  assert.deepEqual(usage.getAvailableCdkeys('A\nB\nA\nC\nB', {}), ['A', 'B', 'C']);
});

test('reads channel usage with fallback defaults', () => {
  const defaultValue = { D: { remoteStatus: 'failed' } };
  assert.equal(usage.getRedeemChannelUsage({}, 'upi'), undefined);
  assert.equal(usage.getRedeemChannelUsage({}, 'upi', { defaultValue }), defaultValue);
  assert.equal(usage.getRedeemChannelUsage({}, 'ideal', { defaultValue }), defaultValue);
  assert.deepEqual(
    usage.getRedeemChannelUsage({ cdkUsage: { A: { remoteStatus: 'failed' } } }, 'upi'),
    { A: { remoteStatus: 'failed' } }
  );
});

test('normalizes usage keys before filtering available CDKs', () => {
  assert.deepEqual(usage.getAvailableCdkeys('A\nB', {
    ' A ': { remoteStatus: 'submitted' },
    B: { remoteStatus: 'failed' },
  }), ['B']);
});

test('matches runtime selectability for active, consumed, invalid, duplicate, and subscription states', () => {
  assert.deepEqual(usage.getAvailableCdkeys([
    'USED_AT_NUMBER',
    'USED_AT_ISO',
    'UNDER_REVIEW_STATUS',
    'UNDER_REVIEW_MESSAGE',
    'PROCESSING_CN_STATUS',
    'REDEEMING_CN_MESSAGE',
    'QUEUED',
    'DISPATCHING',
    'PENDING_MESSAGE',
    'RETRYING',
    'SUCCESS',
    'INVALID',
    'DUPLICATE',
    'SUB_ACTIVE',
    'SUB_INACTIVE_BUSY',
    'FAILED',
    'CANCELED',
    'UNUSED',
  ].join('\n'), {
    USED_AT_NUMBER: { usedAt: 123 },
    USED_AT_ISO: { usedAt: '2026-07-06T00:00:00.000Z' },
    UNDER_REVIEW_STATUS: { remoteStatus: '审核中' },
    UNDER_REVIEW_MESSAGE: { remoteMessage: '审核中' },
    PROCESSING_CN_STATUS: { remoteStatus: '处理中' },
    REDEEMING_CN_MESSAGE: { remoteMessage: '正在兑换' },
    QUEUED: { remoteStatus: 'queued' },
    DISPATCHING: { remoteStatus: 'dispatching' },
    PENDING_MESSAGE: { remoteMessage: '待派发', email: 'user@example.com' },
    RETRYING: { retrying: true },
    SUCCESS: { remoteStatus: 'succeeded' },
    INVALID: { remoteMessage: '无效' },
    DUPLICATE: { lastError: 'CDK already submitted' },
    SUB_ACTIVE: { subscriptionActive: true, remoteStatus: 'failed' },
    SUB_INACTIVE_BUSY: { subscriptionActive: false, remoteStatus: 'processing' },
    FAILED: { remoteStatus: 'failed' },
    CANCELED: { remoteStatus: 'cancelled' },
    UNUSED: { remoteMessage: '可用' },
  }), ['USED_AT_NUMBER', 'USED_AT_ISO', 'UNDER_REVIEW_STATUS', 'UNDER_REVIEW_MESSAGE', 'FAILED', 'CANCELED', 'UNUSED']);
});
