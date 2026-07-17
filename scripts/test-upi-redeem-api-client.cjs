const test = require('node:test');
const assert = require('node:assert/strict');

const api = require('../background/redeem/upi-redeem-api-client.js');

test('redeemCdkey posts JSON with auth headers', async () => {
  const requests = [];
  const client = api.createUpiRedeemApiClient({
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) };
    },
  });
  const payload = await client.redeemCdkey({
    apiUrl: 'https://example.test/redeem',
    externalApiKey: 'key',
    clientId: 'client',
    cdkey: 'CDK',
    session: 'session',
    accessToken: 'at',
    channel: 'ideal',
  });

  assert.deepEqual(payload, { ok: true });
  assert.equal(requests[0].url, 'https://example.test/redeem');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers.authorization, 'Bearer key');
  assert.equal(requests[0].options.headers['x-client-id'], 'client');
  assert.equal(requests[0].options.headers['content-type'], 'application/json');
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    cdkey: 'CDK',
    session: 'session',
    accessToken: 'at',
    channel: 'ideal',
  });
});

test('postJson throws payload error on non-OK response', async () => {
  const client = api.createUpiRedeemApiClient({
    fetchImpl: async () => ({ ok: false, status: 400, text: async () => JSON.stringify({ error: 'bad cdk' }) }),
  });
  await assert.rejects(() => client.postJson({ url: 'https://example.test', body: {} }), /bad cdk/);
});

test('postJson preserves legacy wrapper headers and body when error throwing is disabled', async () => {
  const requests = [];
  const client = api.createUpiRedeemApiClient({
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return { ok: false, status: 409, text: async () => JSON.stringify({ error: 'duplicate' }) };
    },
  });

  const result = await client.postJson({
    apiUrl: 'https://example.test/status',
    headers: {
      'X-External-Api-Key': 'key',
      'X-Client-Id': 'client',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: { items: [{ cdkey: 'CDK' }], channel: 'upi' },
    returnResponse: true,
    throwOnError: false,
  });

  assert.equal(result.response.status, 409);
  assert.deepEqual(result.payload, { error: 'duplicate' });
  assert.deepEqual(requests[0].options.headers, {
    'X-External-Api-Key': 'key',
    'X-Client-Id': 'client',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  });
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    items: [{ cdkey: 'CDK' }],
    channel: 'upi',
  });
});

test('checkEligibility posts token and promoId as JSON', async () => {
  const requests = [];
  const client = api.createUpiRedeemApiClient({
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, status: 200, text: async () => JSON.stringify({ token_ok: true, eligible: true }) };
    },
  });

  const payload = await client.checkEligibility({
    apiUrl: 'https://example.test/check',
    token: ' token ',
    promoId: ' promo ',
  });

  assert.deepEqual(payload, { token_ok: true, eligible: true });
  assert.deepEqual(JSON.parse(requests[0].options.body), { token: 'token', promoId: 'promo' });
});

test('redeemCdkey sends the PIX channel to the remote API', async () => {
  const requests = [];
  const client = api.createUpiRedeemApiClient({
    fetchImpl: async (_url, options) => {
      requests.push(JSON.parse(options.body));
      return { ok: true, status: 200, text: async () => JSON.stringify({ status: 'queued' }) };
    },
  });

  await client.redeemCdkey({
    apiUrl: 'https://example.test/redeem',
    cdkey: 'PIX-A',
    channel: 'pix',
  });

  assert.equal(requests[0].channel, 'pix');
});
