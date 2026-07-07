const assert = require('node:assert/strict');
const test = require('node:test');

const assurivoTime = require('../background/verification/assurivo-time.js');
const verificationKeywords = require('../background/verification/verification-keywords.js');
const verificationCodeExtractor = require('../background/verification/code-extractor.js');
const assurivoFeedClient = require('../background/verification/assurivo-feed-client.js');
require('../background/verification/resend-controller.js');
require('../background/verification-flow.js');
const verificationFlow = globalThis.MultiPageBackgroundVerificationFlow;

test('standalone parseAssurivoTimestamp treats naive Assurivo time as UTC+8', () => {
  assert.equal(
    new Date(assurivoTime.parseAssurivoTimestamp('2026-01-01 08:00:00')).toISOString(),
    '2026-01-01T00:00:00.000Z'
  );
});

test('verification flow forwards supplied poll payload builder fields', () => {
  const helpers = verificationFlow.createVerificationFlowHelpers({
    addLog: async () => {},
    buildVerificationPollPayload(step, state, overrides = {}) {
      return {
        step,
        flowId: state.activeFlowId,
        senderFilters: ['custom-sender@example.com'],
        subjectFilters: ['ChatGPT verification'],
        requiredKeywords: ['otp'],
        codePatterns: ['\\d{6}'],
        targetEmail: 'builder@example.com',
        maxAttempts: 9,
        intervalMs: 1234,
        builtByTest: true,
        ...overrides,
      };
    },
    getHotmailVerificationRequestTimestamp: () => 0,
  });

  const payload = helpers.getVerificationPollPayload(4, {
    activeFlowId: 'flow-123',
    email: 'state@example.com',
    mailProvider: '2925',
  }, {
    filterAfterTimestamp: 456789,
    extraMarker: 'kept',
  });

  assert.equal(payload.builtByTest, true);
  assert.deepEqual(payload.senderFilters, ['custom-sender@example.com']);
  assert.deepEqual(payload.subjectFilters, ['ChatGPT verification']);
  assert.equal(payload.targetEmail, 'builder@example.com');
  assert.equal(payload.filterAfterTimestamp, 456789);
  assert.equal(payload.extraMarker, 'kept');
});

test('standalone isVerificationMailText handles Hindi verification phrasing', () => {
  assert.doesNotThrow(() => verificationKeywords.isVerificationMailText('यह आपका ChatGPT सत्यापन कोड है।'));
  assert.equal(
    verificationKeywords.isVerificationMailText('यह आपका ChatGPT सत्यापन कोड है।'),
    true
  );
});

test('standalone extractStrictVerificationCodeFromBody handles Hindi code bodies', () => {
  const result = verificationCodeExtractor.extractStrictVerificationCodeFromBody(
    'यह आपका ChatGPT सत्यापन कोड है: 123456। जारी रखने के लिए इस कोड का उपयोग करें।'
  );

  assert.deepEqual(result.codes, ['123456']);
  assert.equal(result.promptMatched, true);
});

test('standalone fetchAssurivoFeed uses default assurivo endpoints for entry credentials', async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          data: [
            {
              id: 'mail-1',
              from: 'noreply@openai.com',
              subject: 'ChatGPT verification code',
              body: 'Your code is 123456.',
            },
          ],
        });
      },
    };
  };

  const entries = await assurivoFeedClient.fetchAssurivoFeed({
    entry: {
      email: 'user@example.com',
      credential: 'user@example.com----secret-pass',
    },
    state: {
      assurivoMailLimit: 7,
    },
    fetchImpl,
  });

  assert.equal(requests.length, 1);
  const requestUrl = new URL(requests[0].url);
  assert.equal(requestUrl.origin, 'https://assurivo.com');
  assert.equal(requestUrl.pathname, '/console/feed.php');
  assert.equal(requestUrl.searchParams.get('mail'), 'user@example.com');
  assert.equal(requestUrl.searchParams.get('pwd'), 'secret-pass');
  assert.equal(requestUrl.searchParams.get('limit'), '7');
  assert.equal(requests[0].options.method, 'GET');
  assert.equal(requests[0].options.cache, 'no-store');
  assert.deepEqual(entries, [
    {
      id: 'mail-1',
      from: 'noreply@openai.com',
      subject: 'ChatGPT verification code',
      body: 'Your code is 123456.',
    },
  ]);
});
