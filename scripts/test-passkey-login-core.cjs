const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildPasskeyLoginRequest,
  normalizePasskeyLoginResponse,
  normalizeCookieEntries,
  getLoginFailureMessage,
} = require('../background/passkey-login-core.js');
require('../background/passkey-api-login-executor.js');

const {
  buildPasskeyExportMarker,
  getPasskeyCredentialIdFromExportMarker,
  parsePasskeyExportMarker,
} = globalThis.MultiPagePasskeyApiLoginExecutor;

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

test('builds passkey text marker with numeric metadata when present', () => {
  assert.equal(
    buildPasskeyExportMarker({
      passkeyCredentialId: 'credential-1',
      passkeySignCount: 0,
      passkeyAlg: -7,
    }),
    'PASSKEY:credential-1;signCount=0;alg=-7'
  );
  assert.equal(
    buildPasskeyExportMarker({
      passkeyCredentialId: 'credential-2',
      passkeySignCount: '',
      passkeyAlg: undefined,
    }),
    'PASSKEY:credential-2'
  );
});

test('parses passkey text marker metadata with backward compatibility', () => {
  assert.equal(getPasskeyCredentialIdFromExportMarker('PASSKEY:old-credential'), 'old-credential');
  assert.deepEqual(parsePasskeyExportMarker('PASSKEY:credential-1;signCount=0;alg=-7;ignored=1'), {
    credentialId: 'credential-1',
    passkeySignCount: 0,
    passkeyAlg: -7,
  });
  assert.deepEqual(parsePasskeyExportMarker('PASSKEY:credential-2;sign_count=12'), {
    credentialId: 'credential-2',
    passkeySignCount: 12,
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

test('defaults normal array cookies to chatgpt domain', () => {
  const entries = normalizeCookieEntries([
    { name: 'regular', value: 'v' },
  ]);
  assert.deepEqual(entries[0], {
    name: 'regular',
    value: 'v',
    path: '/',
    secure: true,
    httpOnly: false,
    sameSite: 'lax',
    domain: '.chatgpt.com',
  });
});

test('preserves host-only array cookies without adding domain', () => {
  const entries = normalizeCookieEntries([
    { name: 'regular', value: 'v', hostOnly: true },
  ]);
  assert.deepEqual(entries[0], {
    name: 'regular',
    value: 'v',
    path: '/',
    secure: true,
    httpOnly: false,
    sameSite: 'lax',
    hostOnly: true,
  });
});

test('preserves host-only object-map cookies without adding domain', () => {
  const entries = normalizeCookieEntries({
    regular: { value: 'v', hostOnly: true },
  });
  assert.deepEqual(entries[0], {
    name: 'regular',
    value: 'v',
    path: '/',
    secure: true,
    httpOnly: false,
    sameSite: 'lax',
    hostOnly: true,
  });
});

test('omits cookies with foreign backend domains', () => {
  const entries = normalizeCookieEntries([
    { name: 'regular', value: 'v', domain: '.evil.example' },
    { name: 'valid', value: 'ok', domain: '.chatgpt.com' },
  ]);
  assert.deepEqual(entries.map((entry) => entry.name), ['valid']);
});

test('accepts intended ChatGPT and OpenAI cookie domains', () => {
  const entries = normalizeCookieEntries([
    { name: 'root-chatgpt', value: 'v1', domain: 'chatgpt.com' },
    { name: 'dot-chatgpt', value: 'v2', domain: '.chatgpt.com' },
    { name: 'auth-openai', value: 'v3', domain: 'auth.openai.com' },
    { name: 'dot-openai', value: 'v4', domain: '.openai.com' },
  ]);
  assert.deepEqual(entries.map((entry) => entry.domain), [
    'chatgpt.com',
    '.chatgpt.com',
    'auth.openai.com',
    '.openai.com',
  ]);
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

test('falls back from whitespace-only camelCase token aliases', () => {
  const accessToken = `eyJ${'a'.repeat(120)}`;
  const sessionToken = `eyJ${'s'.repeat(120)}`;
  const result = normalizePasskeyLoginResponse({
    accessToken: '   ',
    access_token: accessToken,
    sessionToken: '\t\n  ',
    session_token: sessionToken,
  });
  assert.equal(result.accessToken, accessToken);
  assert.equal(result.sessionToken, sessionToken);
});

test('allows accessToken-only response without ok field', () => {
  const accessToken = `eyJ${'a'.repeat(120)}`;
  const result = normalizePasskeyLoginResponse({ accessToken });
  assert.equal(result.accessToken, accessToken);
  assert.deepEqual(result.cookieEntries, []);
});

test('ignores inherited accessToken and email fields', () => {
  const accessToken = `eyJ${'a'.repeat(120)}`;
  const response = Object.create({ accessToken, email: 'x@example.com' });
  assert.throws(
    () => normalizePasskeyLoginResponse(response),
    /后端未返回可导入的 cookies、sessionToken 或 accessToken/
  );
});

test('ignores inherited cookies and sessionToken fields', () => {
  const sessionToken = `eyJ${'s'.repeat(120)}`;
  const response = Object.create({
    cookies: {
      '__Secure-next-auth.session-token': sessionToken,
    },
    sessionToken,
  });
  assert.throws(
    () => normalizePasskeyLoginResponse(response),
    /后端未返回可导入的 cookies、sessionToken 或 accessToken/
  );
});

test('ignores inherited ok false when own accessToken is valid', () => {
  const accessToken = `eyJ${'a'.repeat(120)}`;
  const response = Object.create({ ok: false, reason: 'missing-credential' });
  response.accessToken = accessToken;
  const result = normalizePasskeyLoginResponse(response);
  assert.equal(result.accessToken, accessToken);
  assert.deepEqual(result.cookieEntries, []);
});

test('rejects explicit backend failures even with accessToken', () => {
  const accessToken = `eyJ${'a'.repeat(120)}`;
  assert.throws(
    () => normalizePasskeyLoginResponse({ ok: false, reason: 'missing-credential', accessToken }),
    /没有找到该邮箱的 Passkey 凭据/
  );
});

test('maps backend failure reasons', () => {
  assert.equal(getLoginFailureMessage({ ok: false, reason: 'missing-credential' }), '没有找到该邮箱的 Passkey 凭据');
  assert.equal(getLoginFailureMessage({ ok: false, reason: 'rate-limited' }), '请求太频繁，请稍后再试');
  assert.equal(getLoginFailureMessage({ ok: false, reason: 'server-error' }), '服务器错误，请稍后重试');
  assert.equal(getLoginFailureMessage({ ok: false, reason: '__proto__' }), '登录失败，请稍后重试');
});

test('falls back for own explicit failure with empty message and error', () => {
  assert.throws(
    () => normalizePasskeyLoginResponse({ ok: false, message: '', error: '' }),
    /登录失败，请稍后重试/
  );
});
