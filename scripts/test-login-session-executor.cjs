const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildLoginFailureReason,
  hasLoginVerificationChallenge,
  isEmailVerificationChallenge,
  isTotpVerificationChallenge,
} = require('../background/membership/login-session-executor.js');

test('login executor helper snapshot: email verification challenge', () => {
  const snapshot = {
    state: 'verification_page',
    verificationReady: true,
    verificationKind: 'email',
    displayedEmail: 'user@example.com',
    url: 'https://chatgpt.com/auth/email-verification',
  };

  assert.equal(hasLoginVerificationChallenge(snapshot), true);
  assert.equal(isEmailVerificationChallenge(snapshot), true);
  assert.equal(isTotpVerificationChallenge(snapshot), false);
  assert.equal(buildLoginFailureReason(snapshot), '登录后需要邮箱一次性验证码');
});

test('login executor helper snapshot: totp verification challenge', () => {
  const snapshot = {
    state: 'verification_page',
    verificationVisible: true,
    verificationKind: '2fa',
    path: '/auth/mfa',
  };

  assert.equal(hasLoginVerificationChallenge(snapshot), true);
  assert.equal(isEmailVerificationChallenge(snapshot), false);
  assert.equal(isTotpVerificationChallenge(snapshot), true);
  assert.equal(buildLoginFailureReason(snapshot), '登录后仍停留在 2FA 验证码页面');
});

test('login executor helper snapshot: unknown verification state uses fallback', () => {
  const snapshot = {
    state: 'verification_page',
    verificationVisible: true,
    verificationKind: 'unknown',
    path: '/auth/challenge',
  };

  assert.equal(hasLoginVerificationChallenge(snapshot), true);
  assert.equal(isEmailVerificationChallenge(snapshot), false);
  assert.equal(isTotpVerificationChallenge(snapshot), false);
  assert.equal(buildLoginFailureReason(snapshot, '自定义失败原因'), '自定义失败原因');
});

test('login executor helper snapshot: failure reason formatting', () => {
  assert.equal(
    buildLoginFailureReason({ state: 'password_page' }),
    '登录密码未通过或仍停留在密码页'
  );
  assert.equal(
    buildLoginFailureReason({ state: 'login_timeout_error_page' }),
    '认证页登录超时或触发重试/风控'
  );
  assert.equal(
    buildLoginFailureReason({ state: 'email_page' }),
    '登录后仍停留在邮箱输入页'
  );
  assert.equal(
    buildLoginFailureReason({ state: 'unexpected_state' }),
    '未进入 ChatGPT 已登录态（unexpected_state）'
  );
  assert.equal(
    buildLoginFailureReason({}, '读取 session 失败'),
    '读取 session 失败'
  );
});
