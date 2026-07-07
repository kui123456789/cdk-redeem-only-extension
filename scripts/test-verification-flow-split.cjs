const assert = require('node:assert/strict');
const test = require('node:test');

require('../background/verification/assurivo-time.js');
const verificationKeywords = require('../background/verification/verification-keywords.js');
const verificationCodeExtractor = require('../background/verification/code-extractor.js');
require('../background/verification/assurivo-feed-client.js');
require('../background/verification/resend-controller.js');
require('../background/verification-flow.js');
const verificationFlow = globalThis.MultiPageBackgroundVerificationFlow;

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
