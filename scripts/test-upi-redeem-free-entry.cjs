const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createUpiRedeemFreeEntry,
} = require('../background/steps/upi-redeem/free-entry.js');

function createFailedEligibilityEntry(overrides = {}) {
  return createUpiRedeemFreeEntry({
    constants: {
      UPI_ELIGIBILITY_CHECK_MAX_ATTEMPTS: 1,
      UPI_ELIGIBILITY_CHECK_RETRY_DELAYS_MS: [],
    },
    normalizeString: (value = '') => String(value || '').trim(),
    maskAccessToken: (token = '') => String(token || '') ? 'masked-at' : '',
    toIsoTimestamp: () => '2026-07-10T02:43:22.000Z',
    getErrorMessage: (error) => error?.message || String(error || ''),
    addStepLog: async () => {},
    throwIfStopped: () => {},
    resolveVisibleStep: () => 7,
    getMergedState: async (state = {}) => state,
    parseCdkeyPoolText: () => [],
    splitPoolEntrySource: (value = []) => Array.isArray(value) ? value : [],
    parsePoolEntryEmail: (value = '') => String(value || '').trim().toLowerCase(),
    resolveSessionAccountEmail: (session = {}) => String(session.email || '').trim().toLowerCase(),
    resolveTargetRedeemEmail: (state = {}) => String(state.email || '').trim().toLowerCase(),
    assertSessionMatchesTargetEmail: ({ targetEmail, sessionEmail }) => sessionEmail || targetEmail,
    normalizeChatGptSessionPayload: (session = {}) => session,
    getChatGptSessionAccessToken: (session = {}) => String(session.accessToken || ''),
    buildCurrentUpiCredentialForMembership: () => ({}),
    normalizeTrialEligibilityApiItem: (item = {}) => item,
    isTrialEligibilityAccountIneligibleDecision: () => false,
    buildTrialEligibilityResultPatch: (decision = {}) => decision,
    isUpiAccountIneligibleError: () => false,
    isRecoverableUpiEligibilityError: () => false,
    isFlowStoppedError: () => false,
    checkUpiRedeemAccessTokenEligibility: async () => ({
      item: {
        trialEligibilityDecision: {
          trialEligibilityStatus: 'failed',
          trialEligibilityReason: '资格检查接口返回了 HTML 页面，不是有效 JSON。',
          trialEligibilityRetryable: true,
          trialEligibilityTransientFailure: true,
        },
      },
    }),
    ...overrides,
  });
}

function createCleanupEntry(overrides = {}) {
  return createUpiRedeemFreeEntry({
    constants: {},
    normalizeString: (value = '') => String(value || '').trim(),
    parseCdkeyPoolText: (value = '') => String(value || '').split(/\r?\n/).filter(Boolean),
    splitPoolEntrySource: (value = []) => Array.isArray(value) ? value : [],
    parsePoolEntryEmail: (value = '') => {
      const source = value && typeof value === 'object'
        ? (value.email || value.credential || '')
        : value;
      return String(source || '').split('----')[0].trim().toLowerCase();
    },
    ...overrides,
  });
}

test('paid subscription cleanup never deletes the custom email pool from a one-account snapshot', () => {
  const entry = createCleanupEntry();
  const updates = entry.buildSuccessfulRedeemCleanupUpdates({
    emailGenerator: 'custom-pool',
    selectedCustomEmailPoolEmail: 'registered@example.com',
    customEmailPoolEntries: [{
      email: 'registered@example.com',
      enabled: true,
      used: true,
      accessToken: 'at-registered-account',
      trialEligibilityStatus: 'eligible',
    }],
    customEmailPool: [],
  }, 'AAAA-BBBB-CCCC-DDDD', 'registered@example.com');

  assert.equal(Object.hasOwn(updates, 'customEmailPoolEntries'), false);
  assert.equal(Object.hasOwn(updates, 'customEmailPool'), false);
});

test('registration eligibility HTML failure marks the registered pool email used and retryable', async () => {
  const marks = [];
  const entry = createFailedEligibilityEntry({
    markCustomEmailPoolEntryTrialEligibility: async (_state, options) => {
      marks.push(options);
      return { updated: true };
    },
  });

  const result = await entry.checkRegistrationUpiTrialEligibility({
    state: {
      email: 'registered@example.com',
      emailGenerator: 'custom-pool',
      customEmailPoolEntries: [{ email: 'registered@example.com', enabled: true, used: false }],
    },
    session: {
      email: 'registered@example.com',
      accessToken: 'at-registered-account',
    },
  });

  assert.equal(result.trialEligibilityStatus, 'failed');
  assert.equal(marks.length, 1);
  assert.equal(marks[0].email, 'registered@example.com');
  assert.equal(marks[0].status, 'failed');
  assert.equal(marks[0].markUsed, true);
  assert.equal(marks[0].trialEligibilityRetryable, true);
  assert.equal(marks[0].trialEligibilityTransientFailure, true);
});
