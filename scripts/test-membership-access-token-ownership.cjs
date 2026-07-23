const assert = require('node:assert/strict');
const test = require('node:test');

require('../background/upi-credential-membership-checker.js');

const {
  getAccessTokenOwnership,
} = globalThis.MultiPageBackgroundUpiCredentialMembershipChecker;

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

test('saved AT from the previous email is rejected after switching accounts', () => {
  const ownership = getAccessTokenOwnership(
    buildAccessToken('old@example.com'),
    'new@example.com'
  );

  assert.deepEqual(ownership, {
    targetEmail: 'new@example.com',
    tokenEmail: 'old@example.com',
    verifiable: true,
    matches: false,
  });
});

test('saved AT remains reusable when its JWT email matches the target account', () => {
  const ownership = getAccessTokenOwnership(
    buildAccessToken('USER@example.com'),
    'user@example.com'
  );

  assert.equal(ownership.verifiable, true);
  assert.equal(ownership.matches, true);
  assert.equal(ownership.tokenEmail, 'user@example.com');
});
