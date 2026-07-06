const assert = require('node:assert/strict');
const test = require('node:test');

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

test('Free export rows preserve password, 2FA or Passkey marker, URL, AT, and timestamp', () => {
  const rows = resultState.buildResultExportRows({
    items: [
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
  }, 'free');

  assert.deepEqual(rows, [
    'twofa@example.com---pw-2fa---ABCDEFGH---https://assurivo.com/console/open.php?id=1---at-2fa---2023-11-15 06:13:20',
    'passkey@example.com---pw-passkey---PASSKEY:cred-123;signCount=7---https://assurivo.com/console/open.php?id=2---at-passkey---2023-11-15 07:13:20',
  ]);
});

test('normalizeResultsPayload preserves redeemPlusDeletedEmailsByChannel', () => {
  const payload = resultState.normalizeResultsPayload({
    items: [],
    redeemPlusDeletedEmailsByChannel: {
      upi: ['ONE@example.com', 'one@example.com', 'two@example.com'],
      ideal: ['IDEAL@example.com'],
    },
  });

  assert.deepEqual(payload.redeemPlusDeletedEmailsByChannel, {
    upi: ['one@example.com', 'two@example.com'],
    ideal: ['ideal@example.com'],
  });
  assert.deepEqual(payload.redeemPlusDeletedCountByChannel, {
    upi: 2,
    ideal: 1,
  });
});
