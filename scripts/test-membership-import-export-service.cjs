const assert = require('node:assert/strict');
const test = require('node:test');

const api = require('../background/membership/import-export-service.js');

function createService({ buildRows, deleteResults, results }) {
  return api.createImportExportService({
    buildRedeemAccountUnlockedPatch: () => ({}),
    buildResultExportRows: buildRows,
    buildTimestampedFileName: (prefix) => `${prefix}-20260710.txt`,
    deleteUpiCredentialMembershipCheckResults: deleteResults || (async () => ({ deletedCount: 0 })),
    getActiveRedeemCdkeyUsageEmailSetFromState: () => new Set(),
    getResultItemRedeemChannel: (item) => item.redeemChannel || 'upi',
    getState: async () => ({}),
    getStoredResults: async () => results,
    isActiveUpiCredentialMembershipRedeemResultItem: () => false,
    isBatchRunning: () => false,
    isCdkeyRetryRunning: () => false,
    isLikelyVerificationUrl: (value) => /^https?:\/\//i.test(String(value || '')),
    isPasskeyExportMarker: (value) => /^PASSKEY:/i.test(String(value || '')),
    isRedeemRunning: () => false,
    isResultItemHiddenByPlusDeletion: () => false,
    isResultItemPasskeyExportableForStatus: () => false,
    normalizeEmail: (value) => String(value || '').trim().toLowerCase(),
    normalizeEmailList: (values) => values.map((value) => String(value || '').trim().toLowerCase()),
    normalizeRedeemChannel: (value) => String(value || '').trim().toLowerCase() === 'ideal' ? 'ideal' : 'upi',
    normalizeResultItem: (item) => item,
    normalizeResultsPayload: (value) => value,
    normalizeString: (value) => String(value || '').trim().toLowerCase(),
    resolveInputCredentials: () => [],
    saveResults: async (value) => value,
  });
}

test('Free export forwards URL option, names no-2FA rows, and permits URL-free removal', async () => {
  const capturedOptions = [];
  let deletedEmails;
  const results = {
    items: [{
      email: 'a@example.com',
      status: 'free',
      no2faFreeRoute: true,
      accessToken: 'at-token',
    }],
  };
  const service = createService({
    buildRows(_results, _status, _channel, _emails, options) {
      capturedOptions.push(options);
      return options.includeVerificationUrl
        ? ['a@example.com---https://verify.example.com---at-token---2026-07-10 12:00:00']
        : ['a@example.com---at-token---2026-07-10 12:00:00'];
    },
    deleteResults: async ({ emails }) => {
      deletedEmails = emails;
      return { deletedCount: emails.length };
    },
    results,
  });

  const withoutUrl = await service.exportUpiCredentialMembershipCheckResults({
    status: 'free', emails: ['a@example.com'], includeVerificationUrl: false, removeAfterExport: true,
  });
  assert.deepEqual(capturedOptions[0], { includeVerificationUrl: false });
  assert.match(withoutUrl.fileName, /^upi-membership-free-email-at-/);
  assert.deepEqual(deletedEmails, ['a@example.com']);

  const withUrl = await service.exportUpiCredentialMembershipCheckResults({
    status: 'free', emails: ['a@example.com'],
  });
  assert.deepEqual(capturedOptions[1], { includeVerificationUrl: true });
  assert.match(withUrl.fileName, /^upi-membership-free-email-url-at-/);
});
