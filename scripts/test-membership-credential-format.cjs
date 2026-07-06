const test = require('node:test');
const assert = require('node:assert/strict');

const format = require('../shared/membership-credential-format.js');

test('parses full 2FA Free row with URL and access token', () => {
  const row = format.parseCredentialLine(
    'a@icloud.com---pw---SECRET---https://assurivo.com/console/feed.php?mail=a%40icloud.com&pwd=x&limit=5---at-token---2026-07-06 15:00:00',
    { source: 'txt', nowMs: Date.parse('2026-07-06T07:00:00.000Z') }
  );
  assert.equal(row.email, 'a@icloud.com');
  assert.equal(row.password, 'pw');
  assert.equal(row.gptPassword, 'pw');
  assert.equal(row.totpMfaSecret, 'SECRET');
  assert.equal(row.verificationUrl, 'https://assurivo.com/console/open.php?mail=a%40icloud.com&pwd=x&limit=5');
  assert.equal(row.accessToken, 'at-token');
  assert.equal(row.accessTokenUpdatedAt, '2026-07-06 15:00:00');
  assert.equal(row.checkedAt, '2026-07-06 15:00:00');
  assert.equal(row.twoFactorEnabled, true);
  assert.equal(row.source, 'txt');
});

test('parses no-2FA Free row without shifting columns', () => {
  const row = format.parseCredentialLine(
    'a@icloud.com---https://assurivo.com/console/open.php?mail=a%40icloud.com&pwd=x&limit=5---at-token---2026-07-06 15:00:00',
    { source: 'txt' }
  );
  assert.equal(row.password, '');
  assert.equal(row.gptPassword, '');
  assert.equal(row.totpMfaSecret, '');
  assert.equal(row.no2faFreeRoute, true);
  assert.equal(row.twoFactorEnabled, false);
  assert.equal(row.accessToken, 'at-token');
});

test('parses Passkey marker with semicolon metadata', () => {
  const row = format.parseCredentialLine(
    'a@icloud.com---pw---PASSKEY:cred-1;signCount=7;alg=-7---https://assurivo.com/console/open.php?mail=a%40icloud.com&pwd=x&limit=5---at-token---2026-07-06 15:00:00',
    { source: 'txt' }
  );
  assert.equal(row.passkeyEnabled, true);
  assert.equal(row.passkeyCredentialId, 'cred-1');
  assert.equal(row.passkeySignCount, 7);
  assert.equal(row.passkeyAlg, -7);
  assert.equal(row.totpMfaSecret, '');
  assert.equal(row.twoFactorEnabled, true);
});

test('does not infer twoFactorEnabled for fallback partial rows', () => {
  const row = format.parseCredentialLine(
    'a@icloud.com---pw---SECRET---at-token---2026-07-06 15:00:00',
    { source: 'txt' }
  );
  assert.equal(row.totpMfaSecret, 'SECRET');
  assert.equal(row.twoFactorEnabled, undefined);
});

test('formats current Free export row shapes', () => {
  assert.equal(format.formatFreeCredentialLine({
    email: 'a@icloud.com',
    no2faFreeRoute: true,
    verificationUrl: 'https://assurivo.com/console/feed.php?mail=a%40icloud.com&pwd=x&limit=5',
    accessToken: 'at-token',
    checkedAt: '2026-07-06 15:00:00',
  }), 'a@icloud.com---https://assurivo.com/console/open.php?mail=a%40icloud.com&pwd=x&limit=5---at-token---2026-07-06 15:00:00');

  assert.equal(format.formatFreeCredentialLine({
    email: 'a@icloud.com',
    password: 'pw',
    totpMfaSecret: 'SECRET',
    verificationUrl: 'https://assurivo.com/console/feed.php?mail=a%40icloud.com&pwd=x&limit=5',
    accessToken: 'at-token',
    checkedAt: '2026-07-06 15:00:00',
  }), 'a@icloud.com---pw---SECRET---https://assurivo.com/console/open.php?mail=a%40icloud.com&pwd=x&limit=5---at-token---2026-07-06 15:00:00');

  assert.equal(format.formatFreeCredentialLine({
    email: 'a@icloud.com',
    password: 'pw',
    totpMfaSecret: 'SECRET',
    accessToken: 'at-token',
    checkedAt: '2026-07-06 15:00:00',
  }), 'a@icloud.com---pw---SECRET---at-token---2026-07-06 15:00:00');

  assert.equal(format.formatFreeCredentialLine({
    email: 'a@icloud.com',
    password: 'pw',
    passkeyEnabled: true,
    passkeyCredentialId: 'cred',
    passkeySignCount: 7,
    passkeyAlg: -7,
    verificationUrl: 'https://assurivo.com/console/feed.php?mail=a%40icloud.com&pwd=x&limit=5',
    accessToken: 'at-token',
    checkedAt: '2026-07-06 15:00:00',
  }), 'a@icloud.com---pw---PASSKEY:cred;signCount=7;alg=-7---https://assurivo.com/console/open.php?mail=a%40icloud.com&pwd=x&limit=5---at-token---2026-07-06 15:00:00');

  assert.equal(format.formatFreeCredentialLine({
    email: 'a@icloud.com',
    password: 'pw',
    passkeyEnabled: true,
    passkeyCredentialId: 'cred',
    passkeySignCount: 7,
    passkeyAlg: -7,
    accessToken: 'at-token',
    checkedAt: '2026-07-06 15:00:00',
  }), 'a@icloud.com---pw---PASSKEY:cred;signCount=7;alg=-7---at-token---2026-07-06 15:00:00');

  assert.equal(format.formatFreeCredentialLine({
    email: 'a@icloud.com',
    password: 'pw',
    gptPassword: 'different',
    totpMfaSecret: 'SECRET',
    accessToken: 'at-token',
    checkedAt: '2026-07-06 15:00:00',
  }), 'a@icloud.com---pw---SECRET---at-token---2026-07-06 15:00:00');

  assert.equal(format.formatFreeCredentialLine({
    email: 'a@icloud.com',
    password: 'pw',
    passkeyEnabled: true,
    passkeyCredentialId: 'cred',
    passkeySignCount: 7,
    passkeyAlg: -7,
    totpMfaSecret: 'SECRET',
    accessToken: 'at-token',
    checkedAt: '2026-07-06 15:00:00',
  }), 'a@icloud.com---pw---SECRET---at-token---2026-07-06 15:00:00');
});
