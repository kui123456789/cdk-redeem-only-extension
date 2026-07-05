const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildPasskeyLoginRequest,
  normalizePasskeyLoginResponse,
  normalizeCookieEntries,
  getLoginFailureMessage,
} = require('../background/passkey-login-core.js');

test('builds passkey login request with allowed optional fields only', () => {
  const privateJwk = { kty: 'EC', crv: 'P-256', x: 'x', y: 'y', d: 'd' };
  assert.deepEqual(buildPasskeyLoginRequest(' USER@example.com ', {
    deviceId: 'device-1',
    credentialId: 'credential-1',
    privateJwk,
    rpId: 'openai.com',
    userHandle: 'handle-1',
    signCount: 0,
    alg: -7,
    ignored: 'value',
  }), {
    email: 'user@example.com',
    deviceId: 'device-1',
    credentialId: 'credential-1',
    privateJwk,
    rpId: 'openai.com',
    userHandle: 'handle-1',
    signCount: 0,
    alg: -7,
  });
});

test('normalizes object cookies and accessToken from login response', () => {
  const response = {
    ok: true,
    email: 'user@example.com',
    accessToken: `eyJ${'a'.repeat(120)}`,
    cookies: {
      '__Secure-next-auth.session-token': `eyJ${'s'.repeat(120)}`,
      '__Host-next-auth.csrf-token': 'csrf-value',
    },
  };
  const result = normalizePasskeyLoginResponse(response);
  assert.equal(result.email, 'user@example.com');
  assert.equal(result.accessToken, response.accessToken);
  assert.equal(result.cookieEntries.length, 2);
  assert.equal(result.cookieEntries[0].domain, '.chatgpt.com');
  assert.equal(result.cookieEntries[0].path, '/');
  assert.equal(result.cookieEntries[0].secure, true);
});

test('normalizes __Host cookies without domain', () => {
  const entries = normalizeCookieEntries([
    {
      name: '__Host-next-auth.csrf-token',
      value: 'csrf-value',
      domain: '.chatgpt.com',
      path: '/wrong',
      secure: false,
      sameSite: 'none',
    },
  ]);
  assert.deepEqual(entries[0], {
    name: '__Host-next-auth.csrf-token',
    value: 'csrf-value',
    path: '/',
    secure: true,
    httpOnly: false,
    sameSite: 'no_restriction',
  });
});

test('falls back to sessionToken without cookies', () => {
  const sessionToken = `eyJ${'s'.repeat(120)}`;
  const result = normalizePasskeyLoginResponse({
    ok: true,
    email: 'user@example.com',
    sessionToken,
  });
  assert.equal(result.sessionToken, sessionToken);
  assert.equal(result.sessionRaw, JSON.stringify({ sessionToken }));
});

test('allows accessToken-only response for AT supplement', () => {
  const accessToken = `eyJ${'a'.repeat(120)}`;
  const result = normalizePasskeyLoginResponse({
    ok: true,
    email: 'user@example.com',
    accessToken,
  });
  assert.equal(result.accessToken, accessToken);
  assert.deepEqual(result.cookieEntries, []);
});

test('maps backend failure reasons', () => {
  assert.equal(getLoginFailureMessage({ ok: false, reason: 'missing-credential' }), '没有找到该邮箱的 Passkey 凭据');
  assert.equal(getLoginFailureMessage({ ok: false, reason: 'rate-limited' }), '请求太频繁，请稍后再试');
  assert.equal(getLoginFailureMessage({ ok: false, reason: 'server-error' }), '服务器错误，请稍后重试');
  assert.equal(getLoginFailureMessage({ ok: false, reason: '__proto__' }), '登录失败，请稍后重试');
});
