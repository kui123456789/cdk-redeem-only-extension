const assert = require('node:assert/strict');
const test = require('node:test');

const {
  appendRedeemAttempt,
  buildRedeemOwnershipRecoveryResult,
  markRedeemAttemptRecovered,
  recoverPaidRedeemAttempt,
} = require('../background/membership/redeem-attempt-history.js');

const DAY_MS = 24 * 60 * 60 * 1000;

function encodeBase64Url(value) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function buildAccessToken(email) {
  return [
    encodeBase64Url({ alg: 'none', typ: 'JWT' }),
    encodeBase64Url({
      'https://api.openai.com/profile': { email },
      iat: 1_700_000_000,
    }),
    'signature',
  ].join('.');
}

test('redeem attempt history keeps the newest five submissions within thirty days', () => {
  const nowMs = Date.parse('2026-07-23T00:00:00.000Z');
  const existing = [
    { accessToken: 'expired', submittedAt: nowMs - (31 * DAY_MS) },
    { accessToken: 'one', submittedAt: nowMs - (5 * DAY_MS) },
    { accessToken: 'two', submittedAt: nowMs - (4 * DAY_MS) },
    { accessToken: 'three', submittedAt: nowMs - (3 * DAY_MS) },
    { accessToken: 'four', submittedAt: nowMs - (2 * DAY_MS) },
    { accessToken: 'five', submittedAt: nowMs - DAY_MS },
  ];

  const history = appendRedeemAttempt(existing, {
    submittedEmail: 'current@example.com',
    tokenEmail: 'actual@example.com',
    accessToken: 'newest',
    submittedAt: nowMs,
  }, { nowMs });

  assert.deepEqual(history.map((entry) => entry.accessToken), [
    'newest',
    'five',
    'four',
    'three',
    'two',
  ]);
  assert.equal(history[0].submittedEmail, 'current@example.com');
  assert.equal(history[0].tokenEmail, 'actual@example.com');
  assert.match(history[0].accessTokenFingerprint, /^at_[0-9a-f]{8}$/);
});

test('successful CDK history recovers Plus only for the AT real email', async () => {
  const nowMs = Date.parse('2026-07-23T00:00:00.000Z');
  const currentToken = buildAccessToken('current@example.com');
  const previousToken = buildAccessToken('previous@example.com');
  const checked = [];
  const state = {
    upiRedeemCdkeyUsage: {
      'CDK-RECOVER': {
        remoteStatus: 'success',
        email: 'current@example.com',
        accessToken: currentToken,
        lastAttemptAt: nowMs,
        redeemAttemptHistory: [
          {
            submittedEmail: 'current@example.com',
            accessToken: currentToken,
            submittedAt: nowMs,
          },
          {
            submittedEmail: 'current@example.com',
            accessToken: previousToken,
            submittedAt: nowMs - 1_000,
          },
          {
            submittedEmail: 'current@example.com',
            accessToken: 'opaque-token-without-email',
            submittedAt: nowMs - 2_000,
          },
        ],
      },
    },
  };

  const recovered = await recoverPaidRedeemAttempt({
    state,
    currentEmail: 'current@example.com',
    nowMs,
    checkSubscription: async ({ email, accessToken }) => {
      checked.push({ email, accessToken });
      return {
        status: email === 'previous@example.com' ? 'paid' : 'free',
        planType: email === 'previous@example.com' ? 'plus' : 'free',
        reason: email === 'previous@example.com' ? 'Plus active' : 'Free',
      };
    },
  });

  assert.deepEqual(checked, [{
    email: 'previous@example.com',
    accessToken: previousToken,
  }]);
  assert.equal(recovered.email, 'previous@example.com');
  assert.equal(recovered.cdkey, 'CDK-RECOVER');
  assert.equal(recovered.channel, 'upi');
  assert.equal(recovered.planType, 'plus');
  assert.equal(recovered.accessToken, previousToken);
});

test('confirmed recovery redacts the full historical AT but keeps its audit identity', () => {
  const nowMs = Date.parse('2026-07-23T00:00:00.000Z');
  const recoveredToken = buildAccessToken('previous@example.com');
  const history = appendRedeemAttempt([], {
    submittedEmail: 'current@example.com',
    tokenEmail: 'previous@example.com',
    accessToken: recoveredToken,
    submittedAt: nowMs - 1_000,
  }, { nowMs });

  const redacted = markRedeemAttemptRecovered(history, {
    accessToken: recoveredToken,
    recoveredEmail: 'previous@example.com',
    planType: 'plus',
    recoveredAt: nowMs,
  }, { nowMs });

  assert.equal(redacted.length, 1);
  assert.equal(redacted[0].accessToken, '');
  assert.match(redacted[0].accessTokenFingerprint, /^at_[0-9a-f]{8}$/);
  assert.equal(redacted[0].recoveredEmail, 'previous@example.com');
  assert.equal(redacted[0].recoveredPlanType, 'plus');
  assert.equal(redacted[0].recoveredAt, nowMs);
});

test('ownership recovery keeps the queried email Free and moves Plus to the AT real email', () => {
  const checkedAt = '2026-07-23T00:00:00.000Z';
  const recovery = buildRedeemOwnershipRecoveryResult({
    currentItem: {
      email: 'current@example.com',
      status: 'free',
      planType: 'free',
      reason: '未查询到 Plus',
    },
    recoveredBaseItem: {
      email: 'previous@example.com',
      password: 'keep-existing-password',
    },
    recovery: {
      email: 'previous@example.com',
      accessToken: 'old-at',
      accessTokenFingerprint: 'at_12345678',
      cdkey: 'CDK-RECOVER',
      channel: 'pix',
      planType: 'plus',
      reason: 'Plus active',
    },
    checkedAt,
  });

  assert.equal(recovery.currentItem.status, 'free');
  assert.equal(recovery.currentItem.email, 'current@example.com');
  assert.equal(recovery.currentItem.accessToken, undefined);
  assert.equal(recovery.currentItem.redeemRecoveryStatus, 'at_ownership_mismatch');
  assert.equal(recovery.recoveredItem.email, 'previous@example.com');
  assert.equal(recovery.recoveredItem.status, 'paid');
  assert.equal(recovery.recoveredItem.planType, 'plus');
  assert.equal(recovery.recoveredItem.password, 'keep-existing-password');
  assert.equal(recovery.recoveredItem.redeemChannel, 'pix');
  assert.equal(recovery.recoveredItem.upiRedeemCdkey, 'CDK-RECOVER');
  assert.equal(recovery.recoveredItem.redeemRecoveredFromEmail, 'current@example.com');
});
