const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createMembershipAccessTokenRefreshService,
} = require('../background/membership/access-token-refresh-service.js');

function createHarness(overrides = {}) {
  let storedResults = {
    items: [{
      email: 'user@example.com',
      status: 'free',
      planType: 'free',
      password: 'password',
      totpMfaSecret: 'SECRET',
      accessToken: 'old-at',
      accessTokenMasked: 'old...at',
    }],
  };
  let loginCount = 0;
  const checkedTokens = [];
  const runtimeFlags = {
    batchRunning: false,
    batchStopRequested: false,
    redeemRunning: false,
    cdkeyRetryRunning: false,
  };
  const deps = {
    addLog: async () => {},
    buildFreeMembershipOverrideFields: () => ({}),
    buildMissingAccessTokenRefreshMaterialReason: (credential) => credential.password ? '' : '缺少 GPT 密码',
    checkCredentialPaidSubscription: async ({ accessToken }) => {
      checkedTokens.push(accessToken);
      if (accessToken === 'old-at') throw new Error('UPI 会员状态接口请求失败（HTTP 401）');
      return { status: 'free', planType: 'free', reason: 'no-active-subscription' };
    },
    checkUpiRedeemSubscriptionStatuses: async () => ({ items: [] }),
    getAccessTokenOwnership: () => ({ verifiable: true, matches: true }),
    getChatGptSessionAccessToken: (session = {}) => session.accessToken || '',
    getErrorMessage: (error) => error?.message || String(error || ''),
    getState: async () => ({}),
    getStoredResults: async () => storedResults,
    hasPasskeyCredential: () => false,
    isAccountDeactivatedError: (error) => /ACCOUNT_DEACTIVATED::|account_deactivated|account has been deleted or deactivated/i.test(error?.message || String(error || '')),
    isAccessTokenInvalidMembershipError: (error) => /HTTP 401/.test(error?.message || ''),
    isMembershipStopError: () => false,
    isPaidPlanType: (value) => ['plus', 'pro', 'team'].includes(String(value || '').toLowerCase()),
    loginAndReadAccessToken: async () => {
      loginCount += 1;
      return { accessToken: 'new-at' };
    },
    maskAccessToken: (token) => token ? `${token.slice(0, 3)}...` : '',
    mergeCredentialsIntoResultItems: (_items, credentials) => credentials,
    normalizeEmail: (value) => String(value || '').trim().toLowerCase(),
    normalizeResultItem: (item) => ({ ...item }),
    normalizeString: (value) => String(value || '').trim(),
    normalizeSubscriptionRuntimeState: (state) => state,
    resolveInputCredentials: (input) => Array.isArray(input.credentials) ? input.credentials : [],
    runtimeFlags,
    saveResults: async (results) => {
      storedResults = { ...results, items: Array.isArray(results.items) ? results.items : [] };
      return storedResults;
    },
    throwIfMembershipStopRequested: () => {},
    upsertResultItem: (items, next) => [
      ...items.filter((item) => item.email !== next.email),
      next,
    ],
    ...overrides,
  };
  return {
    service: createMembershipAccessTokenRefreshService(deps),
    getLoginCount: () => loginCount,
    getCheckedTokens: () => checkedTokens,
  };
}

test('batch AT refresh replaces a rejected token after login and revalidation', async () => {
  const harness = createHarness();
  const result = await harness.service.refreshUpiCredentialMembershipAccessTokens({
    source: 'free-refresh-at',
    credentials: [{
      email: 'user@example.com',
      status: 'free',
      planType: 'free',
      password: 'password',
      totpMfaSecret: 'SECRET',
      accessToken: 'old-at',
    }],
  });

  assert.equal(harness.getLoginCount(), 1);
  assert.deepEqual(harness.getCheckedTokens(), ['old-at', 'new-at']);
  assert.equal(result.refreshed.length, 1);
  assert.equal(result.results.items[0].accessToken, 'new-at');
});

test('batch AT refresh keeps a valid token without logging in', async () => {
  const harness = createHarness();
  const result = await harness.service.refreshUpiCredentialMembershipAccessTokens({
    credentials: [{
      email: 'user@example.com',
      status: 'free',
      password: 'password',
      totpMfaSecret: 'SECRET',
      accessToken: 'new-at',
    }],
  });

  assert.equal(harness.getLoginCount(), 0);
  assert.equal(result.valid.length, 1);
  assert.equal(result.refreshed.length, 0);
  assert.equal(result.results.items[0].accessToken, 'new-at');
});

test('batch AT refresh preserves the token on a non-auth network failure', async () => {
  const harness = createHarness({
    checkCredentialPaidSubscription: async () => {
      throw new Error('UPI 会员状态接口网络请求失败');
    },
  });
  const result = await harness.service.refreshUpiCredentialMembershipAccessTokens({
    credentials: [{
      email: 'user@example.com',
      status: 'free',
      password: 'password',
      totpMfaSecret: 'SECRET',
      accessToken: 'old-at',
    }],
  });

  assert.equal(harness.getLoginCount(), 0);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].tokenInvalid, false);
  assert.equal(result.results.items[0].accessToken, 'old-at');
});

test('batch AT refresh clears a rejected token when login material is missing', async () => {
  const harness = createHarness();
  const result = await harness.service.refreshUpiCredentialMembershipAccessTokens({
    credentials: [{
      email: 'user@example.com',
      status: 'free',
      accessToken: 'old-at',
    }],
  });

  assert.equal(harness.getLoginCount(), 0);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].tokenInvalid, true);
  assert.equal(result.results.items[0].accessToken, '');
});

test('batch AT refresh rejects and clears a refreshed token owned by another account', async () => {
  const harness = createHarness({
    getAccessTokenOwnership: () => ({
      targetEmail: 'user@example.com',
      tokenEmail: 'other@example.com',
      verifiable: true,
      matches: false,
    }),
  });
  const result = await harness.service.refreshUpiCredentialMembershipAccessTokens({
    credentials: [{
      email: 'user@example.com',
      status: 'free',
      password: 'password',
      totpMfaSecret: 'SECRET',
      accessToken: 'old-at',
    }],
  });

  assert.equal(harness.getLoginCount(), 1);
  assert.equal(result.refreshed.length, 0);
  assert.equal(result.failed.length, 1);
  assert.match(result.failed[0].reason, /other@example\.com/);
  assert.equal(result.results.items[0].accessToken, '');
});

test('batch AT refresh reports partial progress when stopped before the first account completes', async () => {
  const stopError = Object.assign(new Error('stopped'), { code: 'STOPPED' });
  const harness = createHarness({
    checkCredentialPaidSubscription: async () => {
      throw stopError;
    },
    isMembershipStopError: (error) => error?.code === 'STOPPED',
  });
  const result = await harness.service.refreshUpiCredentialMembershipAccessTokens({
    credentials: [{
      email: 'user@example.com',
      status: 'free',
      password: 'password',
      totpMfaSecret: 'SECRET',
      accessToken: 'old-at',
    }],
  });

  assert.equal(result.results.total, 1);
  assert.equal(result.results.completed, 0);
  assert.ok(result.results.stoppedAt);
  assert.equal(result.results.items[0].accessToken, 'old-at');
});

test('batch AT refresh clears a rejected token when re-login fails', async () => {
  const harness = createHarness({
    loginAndReadAccessToken: async () => {
      throw new Error('登录密码未通过');
    },
  });
  const result = await harness.service.refreshUpiCredentialMembershipAccessTokens({
    credentials: [{
      email: 'user@example.com',
      status: 'free',
      password: 'password',
      totpMfaSecret: 'SECRET',
      accessToken: 'old-at',
    }],
  });

  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].tokenInvalid, true);
  assert.match(result.failed[0].reason, /登录密码未通过/);
  assert.equal(result.results.items[0].accessToken, '');
});

test('batch AT refresh marks a deleted account unavailable and does not retry login', async () => {
  let loginCalls = 0;
  const harness = createHarness({
    loginAndReadAccessToken: async () => {
      loginCalls += 1;
      throw new Error('ACCOUNT_DEACTIVATED::账号已删除或停用，账户不可用');
    },
  });
  const result = await harness.service.refreshUpiCredentialMembershipAccessTokens({
    credentials: [{
      email: 'user@example.com',
      status: 'free',
      password: 'password',
      totpMfaSecret: 'SECRET',
      accessToken: 'old-at',
    }],
  });

  assert.equal(loginCalls, 1);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].accountDeactivated, true);
  assert.equal(result.failed[0].tokenInvalid, false);
  assert.equal(result.results.items[0].status, 'failed');
  assert.equal(result.results.items[0].accessToken, '');
  assert.match(result.results.items[0].reason, /账号已删除或停用/);
});
