const test = require('node:test');
const assert = require('node:assert/strict');

const moduleApi = require('../background/steps/upi-redeem/channel-submission.js');

function createSubmission(payload, status = 403) {
  return moduleApi.createUpiRedeemChannelSubmission({
    constants: {
      UPI_REDEEM_TIMEOUT_MS: 1000,
      UPI_REDEEM_AUTH_ERROR_PREFIX: 'UPI_REDEEM_AUTH_ERROR::',
      UPI_REDEEM_NETWORK_ERROR_PREFIX: 'UPI_REDEEM_NETWORK_ERROR::',
      UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX: 'UPI_ACCESS_TOKEN_EXPIRED::',
    },
    fetchImpl: async () => ({}),
    upiRedeemApiClient: {
      postJson: async () => ({
        response: { ok: false, status },
        payload,
      }),
    },
    normalizeString: (value = '') => String(value ?? '').trim(),
    getErrorMessage: (error) => String(error?.message || error || '').replace(/^UPI_REDEEM_AUTH_ERROR::/, ''),
    maskExternalApiKey: (value = '') => value ? '***' : '',
    isFetchNetworkError: () => false,
  });
}

function createSubscriptionSubmission(payload, status = 200) {
  return moduleApi.createUpiRedeemChannelSubmission({
    constants: {
      UPI_REDEEM_TIMEOUT_MS: 1000,
      UPI_REDEEM_AUTH_ERROR_PREFIX: 'UPI_REDEEM_AUTH_ERROR::',
      UPI_REDEEM_NETWORK_ERROR_PREFIX: 'UPI_REDEEM_NETWORK_ERROR::',
      UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX: 'UPI_ACCESS_TOKEN_EXPIRED::',
    },
    fetchImpl: async () => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(payload),
    }),
    normalizeString: (value = '') => String(value ?? '').trim(),
    getErrorMessage: (error) => String(error?.message || error || ''),
    isFetchNetworkError: () => false,
  });
}

test('account scoped HTTP 403 redeem failures do not stop the whole redeem batch', async () => {
  const submission = createSubmission({ error: 'pm-unavailable' });

  await assert.rejects(
    () => submission.postUPIJson({
      apiUrl: 'https://example.test/redeem',
      externalApiKey: 'key',
      clientId: 'client',
      body: {},
    }),
    (error) => {
      assert.match(error.message, /UPI 兑换接口请求失败（HTTP 403）：pm-unavailable/);
      assert.equal(submission.isUpiRedeemApiAuthError(error), false);
      return true;
    }
  );
});

test('global external API key failures still stop the redeem batch', async () => {
  const submission = createSubmission({ error: 'Invalid External API Key' });

  await assert.rejects(
    () => submission.postUPIJson({
      apiUrl: 'https://example.test/redeem',
      externalApiKey: 'key',
      clientId: 'client',
      body: {},
    }),
    (error) => {
      assert.match(error.message, /^UPI_REDEEM_AUTH_ERROR::/);
      assert.equal(submission.isUpiRedeemApiAuthError(error), true);
      return true;
    }
  );
});

test('empty HTTP 401 or 403 response remains a global auth failure', async () => {
  const submission = createSubmission(null, 401);

  await assert.rejects(
    () => submission.postUPIJson({
      apiUrl: 'https://example.test/redeem',
      externalApiKey: 'key',
      clientId: 'client',
      body: {},
    }),
    (error) => {
      assert.match(error.message, /^UPI_REDEEM_AUTH_ERROR::/);
      assert.equal(submission.isUpiRedeemApiAuthError(error), true);
      return true;
    }
  );
});

test('subscription token-401 payload is promoted to an access-token-expired error', async () => {
  const submission = createSubscriptionSubmission({ reason: 'token-401' });

  await assert.rejects(
    () => submission.postSubscriptionJson({
      apiUrl: 'https://example.test/api/v1/subscription',
      token: 'at',
    }),
    (error) => {
      assert.match(error.message, /^UPI_ACCESS_TOKEN_EXPIRED::/);
      assert.match(error.message, /token-401/);
      return true;
    }
  );
});

test('successful free subscription payload remains a normal membership response', async () => {
  const submission = createSubscriptionSubmission({ ok: true, plan_type: 'free' });

  await assert.doesNotReject(async () => {
    const payload = await submission.postSubscriptionJson({
      apiUrl: 'https://example.test/api/v1/subscription',
      token: 'at',
    });
    assert.deepEqual(payload, { ok: true, plan_type: 'free' });
  });
});
