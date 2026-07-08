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
