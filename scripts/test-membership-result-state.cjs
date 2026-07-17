const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const resultState = require('../background/membership/result-state.js');

test('deleted UPI Plus tombstones do not hide IDEAL Plus exports', () => {
  const rows = resultState.buildResultExportRows({
    items: [{
      email: 'plus@example.com',
      password: 'pw',
      totpMfaSecret: 'abcd efgh',
      status: 'paid',
      redeemChannel: 'ideal',
      redeemSuccessAt: '2026-07-07T01:02:03.000Z',
    }],
    redeemPlusDeletedEmailsByChannel: {
      upi: ['PLUS@example.com'],
      ideal: [],
    },
  }, 'paid', 'ideal');

  assert.deepEqual(rows, [
    'plus@example.com----pw---ABCDEFGH---2026-07-07T01:02:03.000Z',
  ]);
  assert.deepEqual(resultState.buildResultExportRows({
    items: [{
      email: 'plus@example.com',
      password: 'pw',
      totpMfaSecret: 'ABCDEFGH',
      status: 'paid',
      redeemChannel: 'upi',
    }],
    redeemPlusDeletedEmailsByChannel: {
      upi: ['plus@example.com'],
      ideal: [],
    },
  }, 'paid', 'upi'), []);
});

test('Plus exports mail.334401 retrieval URLs as web show pages', () => {
  const rows = resultState.buildResultExportRows({
    items: [
      {
        email: 'twofa@example.com',
        password: 'pw-2fa',
        totpMfaSecret: 'abcd efgh',
        verificationUrl: 'https://mail.334401.xyz/json/token-1/twofa%40example.com',
        status: 'paid',
        redeemChannel: 'upi',
        redeemSuccessAt: '2026-07-10T01:02:03.000Z',
      },
      {
        email: 'passkey@example.com',
        password: 'pw-passkey',
        passkeyEnabled: true,
        passkeyCredentialId: 'cred-123',
        verificationUrl: 'https://mail.334401.xyz/json/token-2/passkey%40example.com',
        status: 'paid',
        redeemChannel: 'ideal',
        redeemSuccessAt: '2026-07-10T02:03:04.000Z',
      },
    ],
  }, 'paid');

  assert.deepEqual(rows, [
    'twofa@example.com----pw-2fa---ABCDEFGH---https://mail.334401.xyz/show/token-1/twofa%40example.com---2026-07-10T01:02:03.000Z',
    'passkey@example.com----pw-passkey---PASSKEY:cred-123---https://mail.334401.xyz/show/token-2/passkey%40example.com---2026-07-10T02:03:04.000Z',
  ]);
});

test('duplicate emails keep the newest updated result', () => {
  const items = resultState.dedupeResultItemsByEmail([
    {
      email: 'DUP@example.com',
      status: 'free',
      checkedAt: '2026-07-07T01:00:00.000Z',
      reason: 'older',
    },
    {
      email: 'dup@example.com',
      status: 'paid',
      checkedAt: '2026-07-07T02:00:00.000Z',
      reason: 'newer',
    },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0].email, 'dup@example.com');
  assert.equal(items[0].status, 'paid');
  assert.equal(items[0].reason, 'newer');
  assert.equal(items[0].checkedAt, '2026-07-07T02:00:00.000Z');
});

test('duplicate emails keep the newest result when newer item appears first', () => {
  const items = resultState.dedupeResultItemsByEmail([
    {
      email: 'dup@example.com',
      status: 'paid',
      updatedAt: '2026-07-07T03:00:00.000Z',
      checkedAt: '2026-07-07T02:00:00.000Z',
      reason: 'newer-first',
    },
    {
      email: 'DUP@example.com',
      status: 'free',
      updatedAt: 1700000000,
      checkedAt: '2026-07-07T01:00:00.000Z',
      reason: 'older-later',
    },
  ]);

  assert.equal(items.length, 1);
  assert.equal(items[0].email, 'dup@example.com');
  assert.equal(items[0].status, 'paid');
  assert.equal(items[0].reason, 'newer-first');
  assert.equal(items[0].checkedAt, '2026-07-07T02:00:00.000Z');
});

test('Free export rows omit verification URLs when disabled', () => {
  const rows = resultState.buildResultExportRows({
    items: [
      {
        email: 'no2fa@example.com',
        no2faFreeRoute: true,
        verificationUrl: 'https://assurivo.com/console/open.php?id=0',
        accessToken: 'at-no2fa',
        recordedAt: 1700000000,
        status: 'free',
      },
      {
        email: 'twofa@example.com',
        password: 'pw-2fa',
        totpMfaSecret: 'abcd efgh',
        verificationUrl: 'https://assurivo.com/console/feed.php?id=1',
        accessToken: 'at-2fa',
        recordedAt: 1700000000,
        status: 'free',
      },
      {
        email: 'passkey@example.com',
        password: 'pw-passkey',
        passkeyEnabled: true,
        passkeyCredentialId: 'cred-123',
        passkeySignCount: 7,
        verificationUrl: 'https://assurivo.com/console/open.php?id=2',
        accessToken: 'at-passkey',
        recordedAt: 1700003600,
        status: 'free',
      },
    ],
  }, 'free', '', [], { includeVerificationUrl: false });

  assert.deepEqual(rows, [
    'no2fa@example.com---at-no2fa---2023-11-15 06:13:20',
    'twofa@example.com---pw-2fa---ABCDEFGH---at-2fa---2023-11-15 06:13:20',
    'passkey@example.com---pw-passkey---PASSKEY:cred-123;signCount=7---at-passkey---2023-11-15 07:13:20',
  ]);
});

test('URL-less no-2FA Free rows export only when verification URLs are disabled', () => {
  const results = {
    items: [{
      email: 'url-less@example.com',
      no2faFreeRoute: true,
      accessToken: 'at-url-less',
      recordedAt: 1700000000,
      status: 'free',
    }],
  };

  assert.deepEqual(resultState.buildResultExportRows(
    results,
    'free',
    '',
    [],
    { includeVerificationUrl: false }
  ), ['url-less@example.com---at-url-less---2023-11-15 06:13:20']);
  assert.deepEqual(resultState.buildResultExportRows(results, 'free'), []);
});

test('normalizeResultsPayload preserves redeemPlusDeletedEmailsByChannel', () => {
  const payload = resultState.normalizeResultsPayload({
    items: [],
    redeemPlusDeletedEmailsByChannel: {
      upi: ['ONE@example.com', 'one@example.com', 'two@example.com'],
      ideal: ['IDEAL@example.com'],
      pix: ['PIX@example.com'],
    },
  });

  assert.deepEqual(payload.redeemPlusDeletedEmailsByChannel, {
    upi: ['one@example.com', 'two@example.com'],
    ideal: ['ideal@example.com'],
    pix: ['pix@example.com'],
  });
  assert.deepEqual(payload.redeemPlusDeletedCountByChannel, {
    upi: 2,
    ideal: 1,
    pix: 1,
  });
});

test('normalizeResultItem preserves PIX channel-specific fields', () => {
  const item = resultState.normalizeResultItem({
    email: 'pix@example.com',
    status: 'paid',
    redeemChannel: 'pix',
    pixRedeemFailureCount: 2,
    pixRedeemDailyLimitBlockedUntil: '2026-07-18T00:00:00.000Z',
    pixRedeemDailyLimitReason: 'pix limit',
    pixChannelEligibilityStatus: 'eligible',
    pixChannelEligibilityReason: 'pix ok',
  });

  assert.equal(item.redeemChannel, 'pix');
  assert.equal(item.pixRedeemFailureCount, 2);
  assert.equal(item.pixRedeemDailyLimitBlockedUntil, '2026-07-18T00:00:00.000Z');
  assert.equal(item.pixRedeemDailyLimitReason, 'pix limit');
  assert.equal(item.pixChannelEligibilityStatus, 'eligible');
  assert.equal(item.pixChannelEligibilityReason, 'pix ok');
});

test('normalizeResultItem clears internal redeem failure-limit errors', () => {
  for (const message of [
    'REDEEM_CHANNEL_FAILURE_LIMIT is not defined',
    'context.parseCdkeyPoolText is not a function',
  ]) {
    const item = resultState.normalizeResultItem({
      email: 'fresh@example.com',
      status: 'free',
      planType: 'free',
      reason: `UPI Free 账号兑换失败：${message}`,
      redeemStatus: 'failed',
      redeemReason: message,
      redeemChannel: 'upi',
      redeemFailureCount: 3,
      redeemFailureLimit: 3,
      upiRedeemFailureCount: 3,
      idealRedeemFailureCount: 1,
      redeemLastFailedAt: '2026-07-08T10:00:00.000Z',
      redeemAttemptedAt: '2026-07-08T09:00:00.000Z',
      upiRedeemCdkey: 'CDK-TEST',
      lastFailedUpiRedeemCdkey: 'CDK-TEST',
      trialEligibilityStatus: 'eligible',
      trialEligibilityReason: '账号有试用资格。',
      accessToken: 'at-test',
    });

    assert.equal(item.status, 'free');
    assert.equal(item.reason, '账号有试用资格。');
    assert.equal(item.redeemStatus, '');
    assert.equal(item.redeemReason, '');
    assert.equal(item.redeemChannel, '');
    assert.equal(item.redeemFailureCount, 0);
    assert.equal(item.upiRedeemFailureCount, 0);
    assert.equal(item.idealRedeemFailureCount, 0);
    assert.equal(item.redeemLocked, false);
    assert.equal(item.redeemLastFailedAt, '');
    assert.equal(item.redeemAttemptedAt, '');
    assert.equal(item.upiRedeemCdkey, '');
    assert.equal(item.lastFailedUpiRedeemCdkey, '');
  }
});

test('free membership override fields reset redeem failure state', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'background', 'upi-credential-membership-checker.js'),
    'utf8'
  );
  const match = source.match(/function buildFreeMembershipOverrideFields[\s\S]*?return \{([\s\S]*?)\n\s*\};/);
  assert.ok(match, 'buildFreeMembershipOverrideFields should exist');
  const body = match[1];

  for (const field of [
    'redeemStatus',
    'redeemReason',
    'redeemFailureCount',
    'upiRedeemFailureCount',
    'idealRedeemFailureCount',
    'pixRedeemFailureCount',
    'redeemLocked',
    'redeemLockedReason',
    'redeemLockedAt',
  ]) {
    assert.match(body, new RegExp(`\\b${field}\\b`));
  }
});
