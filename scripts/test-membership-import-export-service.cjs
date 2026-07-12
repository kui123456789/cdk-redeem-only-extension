const assert = require('node:assert/strict');
const test = require('node:test');

const api = require('../background/membership/import-export-service.js');
const resultState = require('../background/membership/result-state.js');

function createService({ buildRows, deleteResults, results, state = {} }) {
  return api.createImportExportService({
    buildRedeemAccountUnlockedPatch: () => ({}),
    buildResultExportRows: buildRows,
    buildTimestampedFileName: (prefix) => `${prefix}-20260710.txt`,
    deleteUpiCredentialMembershipCheckResults: deleteResults || (async () => ({ deletedCount: 0 })),
    getActiveRedeemCdkeyUsageEmailSetFromState: () => new Set(),
    getResultItemRedeemChannel: (item) => item.redeemChannel || 'upi',
    getState: async () => state,
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
    buildRows(...args) {
      const options = args[4];
      capturedOptions.push(options);
      return resultState.buildResultExportRows(...args);
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
  assert.equal(withUrl.fileName, '');
});

test('Free export defaults to URL-bearing no-2FA rows and filename', async () => {
  let capturedOptions;
  const service = createService({
    buildRows(...args) {
      capturedOptions = args[4];
      return resultState.buildResultExportRows(...args);
    },
    results: {
      items: [{
        email: 'with-url@example.com',
        status: 'free',
        no2faFreeRoute: true,
        verificationUrl: 'https://verify.example.com/record',
        accessToken: 'at-token',
        recordedAt: 1700000000,
      }],
    },
  });

  const output = await service.exportUpiCredentialMembershipCheckResults({
    status: 'free', emails: ['with-url@example.com'],
  });

  assert.deepEqual(capturedOptions, { includeVerificationUrl: true });
  assert.match(output.fileName, /^upi-membership-free-email-url-at-/);
  assert.equal(
    output.fileContent,
    'with-url@example.com---https://verify.example.com/record---at-token---2023-11-15 06:13:20\n'
  );
});

test('Free export backfills a missing pickup URL from the email pool when the toggle is on', async () => {
  const email = 'user@example.com';
  const verificationUrl = 'https://pickup.example/show/account-token';
  const service = createService({
    buildRows: resultState.buildResultExportRows,
    results: {
      items: [{
        email,
        password: 'password123',
        totpMfaSecret: 'ABCDEFGHIJKLMNOP234567ABCDEFG',
        accessToken: 'header.payload.signature',
        checkedAt: '2026-07-12 11:27:30',
        status: 'free',
        planType: 'free',
      }],
    },
    state: {
      customEmailPoolEntries: [{ email, verificationUrl }],
    },
  });

  const exported = await service.exportUpiCredentialMembershipCheckResults({
    status: 'free',
    includeVerificationUrl: true,
  });

  const fields = exported.fileContent.trim().split('---');
  assert.equal(fields.length, 6);
  assert.equal(fields[3], verificationUrl);
});
