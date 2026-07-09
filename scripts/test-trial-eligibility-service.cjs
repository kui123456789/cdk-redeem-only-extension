const test = require('node:test');
const assert = require('node:assert/strict');

globalThis.MultiPageTrialEligibilityApi = require('../shared/trial-eligibility-api.js');
const { createTrialEligibilityService } = require('../background/membership/trial-eligibility-service.js');

test('email-pool trial check marks explicit ineligible entries used and clears current selection', async () => {
  const marks = [];
  const logs = [];
  const saved = [];
  let batchRunning = false;
  let batchStopRequested = true;
  const service = createTrialEligibilityService({
    addLog: async (message, level) => logs.push({ message, level }),
    checkUpiRedeemAccessTokenEligibility: async () => ({
      item: {
        token_ok: true,
        eligible: false,
        reason: 'not-eligible',
        email: 'sample@example.com',
      },
    }),
    getState: async () => ({
      selectedCustomEmailPoolEmail: 'sample@example.com',
      customEmailPoolEntries: [
        { email: 'sample@example.com', enabled: true, used: false },
      ],
    }),
    getStoredResults: async () => ({ items: [] }),
    markCustomEmailPoolEntryTrialEligibility: async (state, options) => {
      marks.push({ state, options });
      return { updated: true };
    },
    maskAccessToken: (token = '') => token ? 'at****' : '',
    resolveInputCredentials: () => [
      { email: 'sample@example.com', accessToken: 'at-test-token' },
    ],
    saveResults: async (results) => {
      saved.push(results);
      return results;
    },
    setBatchRunning: (value) => {
      batchRunning = value;
    },
    setBatchStopRequested: (value) => {
      batchStopRequested = value;
    },
  });

  const result = await service.checkUpiCredentialMembershipTrialEligibility({
    emailPoolOnly: true,
    source: 'custom-email-pool-trial-eligibility-check',
  });

  assert.equal(result.ineligible.length, 1);
  assert.equal(marks.length, 1);
  assert.equal(marks[0].options.status, 'ineligible');
  assert.equal(marks[0].options.markUsed, true);
  assert.equal(marks[0].options.clearSelectedEmail, true);
  assert.equal(batchRunning, false);
  assert.equal(batchStopRequested, false);
  assert.equal(saved.at(-1).running, false);
  assert.equal(logs.some((entry) => /无试用资格/.test(entry.message)), true);
});

test('email-pool ineligible check preserves AT read during login', async () => {
  const marks = [];
  const service = createTrialEligibilityService({
    addLog: async () => {},
    checkUpiRedeemAccessTokenEligibility: async () => {
      throw new Error('UPI_ACCOUNT_INELIGIBLE::not-eligible');
    },
    getState: async () => ({
      selectedCustomEmailPoolEmail: 'sample@example.com',
      customEmailPoolEntries: [
        { email: 'sample@example.com', enabled: true, used: false },
      ],
    }),
    getStoredResults: async () => ({ items: [] }),
    loginAndReadAccessToken: async () => ({ accessToken: 'fresh-at-token' }),
    markCustomEmailPoolEntryTrialEligibility: async (state, options) => {
      marks.push({ state, options });
      return { updated: true };
    },
    maskAccessToken: (token = '') => token ? 'masked-at' : '',
    resolveInputCredentials: () => [
      { email: 'sample@example.com', password: 'pw' },
    ],
    saveResults: async (results) => results,
    setBatchRunning: () => {},
    setBatchStopRequested: () => {},
  });

  const result = await service.checkUpiCredentialMembershipTrialEligibility({
    emailPoolOnly: true,
    source: 'custom-email-pool-trial-eligibility-check',
  });

  assert.equal(result.ineligible.length, 1);
  assert.equal(marks.length, 1);
  assert.equal(marks[0].options.status, 'ineligible');
  assert.equal(marks[0].options.accessToken, 'fresh-at-token');
  assert.equal(marks[0].options.accessTokenMasked, 'masked-at');
  assert.equal(marks[0].options.markUsed, true);
});
