const test = require('node:test');
const assert = require('node:assert/strict');
const format = require('../shared/membership-credential-format.js');

test('formats full 2FA Free rows with verification URL, AT, and timestamp', () => {
  const line = format.formatFreeCredentialLine({
    email: 'User@Test.com',
    password: 'pw',
    totpMfaSecret: 'abcd efgh',
    verificationUrl: 'https://assurivo.com/console/feed.php?mail=user%40test.com&pwd=x&limit=5',
    accessToken: 'at-token',
    checkedAt: '2026-07-07 12:00:00',
  });
  assert.equal(
    line,
    'user@test.com---pw---ABCDEFGH---https://assurivo.com/console/open.php?mail=user%40test.com&pwd=x&limit=5---at-token---2026-07-07 12:00:00',
  );
});

test('formats no-2FA Free rows as email URL AT timestamp', () => {
  const line = format.formatFreeCredentialLine({
    email: 'user@test.com',
    verificationUrl: 'https://assurivo.com/console/open.php?mail=user%40test.com&pwd=x&limit=5',
    accessToken: 'at-token',
    checkedAt: '2026-07-07 12:00:00',
    no2faFreeRoute: true,
  });
  assert.equal(
    line,
    'user@test.com---https://assurivo.com/console/open.php?mail=user%40test.com&pwd=x&limit=5---at-token---2026-07-07 12:00:00',
  );
});

test('parses Passkey marker rows without shifting AT and timestamp columns', () => {
  const row = format.parseCredentialLine(
    'user@test.com---pw---PASSKEY:cred-1;signCount=7;alg=-7---at-token---2026-07-07 12:00:00',
  );
  assert.equal(row.email, 'user@test.com');
  assert.equal(row.password, 'pw');
  assert.equal(row.passkeyEnabled, true);
  assert.equal(row.passkeyCredentialId, 'cred-1');
  assert.equal(row.passkeySignCount, 7);
  assert.equal(row.passkeyAlg, -7);
  assert.equal(row.accessToken, 'at-token');
  assert.equal(row.checkedAt, '2026-07-07 12:00:00');
});
