const assert = require('node:assert/strict');
const test = require('node:test');

const groupsApi = require('../sidepanel/account-records-membership-groups.js');
const deletionApi = require('../sidepanel/account-records-deletion-state.js');
const rendererApi = require('../sidepanel/account-records-membership-results-renderer.js');
const resultOpsApi = require('../sidepanel/account-records-membership-result-ops.js');
const redeemStatusApi = require('../sidepanel/account-records-redeem-status.js');
const statusMetaApi = require('../sidepanel/account-records-status-meta.js');
const redeemPolicyApi = require('../sidepanel/account-records-redeem-policy.js');
const membershipPoolOpsApi = require('../sidepanel/account-records-membership-pool-ops.js');
const trialEligibilityApi = require('../sidepanel/account-records-trial-eligibility.js');

test('membership group and deletion helpers preserve independent PIX Plus state', () => {
  const groups = groupsApi.createAccountRecordsMembershipGroupHelpers({
    membershipRowPolicy: {
      getMembershipGroup: (row) => row.redeemChannel === 'pix' ? 'pix-plus' : 'free',
    },
    normalizeRedeemChannel: (value) => value,
  });
  const deletion = deletionApi.createAccountRecordsDeletionStateHelpers();

  assert.equal(groups.getUpiCredentialMembershipUiGroup({ status: 'paid', redeemChannel: 'pix' }), 'paid-pix');
  assert.equal(groups.summarizeMembershipViewModelRows([{ status: 'paid', redeemChannel: 'pix' }])['pix-plus'], 1);
  assert.deepEqual(deletion.normalizeRedeemPlusDeletedEmailsByChannel({
    upi: ['UPI@example.com'],
    pix: ['PIX@example.com'],
  }), {
    upi: ['upi@example.com'],
    ideal: [],
    pix: ['pix@example.com'],
  });
});

test('membership renderer exposes PIX Plus export and delete controls', () => {
  const container = { innerHTML: '', querySelector: () => null };
  const row = {
    email: 'pix@example.com',
    status: 'paid',
    redeemChannel: 'pix',
    planType: 'plus',
    enabled: true,
  };
  const renderer = rendererApi.createAccountRecordsMembershipResultsRenderer({
    dom: { upiCredentialMembershipCheckResults: container },
    state: { getLatestState: () => ({}) },
    getUpiCredentialMembershipCheckResults: () => ({ items: [row], completed: 1, total: 1 }),
    buildUpiCredentialMembershipDisplayRows: () => [row],
    getUpiCredentialMembershipUiGroup: () => 'paid-pix',
    summarizeMembershipViewModelRows: () => ({ free: 0, 'upi-plus': 0, 'ideal-plus': 0, 'pix-plus': 1 }),
    getRedeemChannelLabel: (channel) => String(channel || '').toUpperCase(),
  });

  renderer.renderUpiCredentialMembershipCheckResults();

  assert.match(container.innerHTML, /PIX Plus 组/);
  assert.match(container.innerHTML, /data-upi-membership-export="paid-pix"/);
  assert.match(container.innerHTML, /data-upi-membership-delete-group="paid-pix"/);
  assert.match(container.innerHTML, /有会员 1/);
});

test('paid-pix result operations preserve PIX channel for export and deletion', async () => {
  const row = { email: 'pix@example.com', status: 'paid', redeemChannel: 'pix' };
  const messages = [];
  const locallyDeleted = [];
  const operations = resultOpsApi.createAccountRecordsMembershipResultOps({
    helpers: {
      downloadTextFile: async () => ({}),
      openConfirmModal: async () => true,
      showToast: () => {},
    },
    runtime: {
      sendMessage: async (message) => {
        messages.push(message);
        if (message.type === 'EXPORT_UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS') {
          return { count: 1, fileName: 'pix.txt', fileContent: 'pix@example.com\n' };
        }
        return { deletedCount: 1, deletedEmails: ['pix@example.com'] };
      },
    },
    getUpiCredentialMembershipCheckResults: () => ({ items: [row] }),
    refreshUpiCredentialMembershipCheckResults: async () => ({}),
    buildUpiCredentialMembershipDisplayRows: () => [row],
    isUpiCredentialMembershipRowInResultGroup: (item, status, channel) => (
      item.status === status && (!channel || item.redeemChannel === channel)
    ),
    getMembershipStatusTitle: (status) => status,
    normalizeRedeemChannel: (value) => value,
    addLocallyDeletedRedeemPlusEmails: (channel, emails) => locallyDeleted.push({ channel, emails }),
  });

  await operations.exportUpiCredentialMembershipCheckResultTextFile('paid-pix');
  await operations.deleteUpiCredentialMembershipResultGroup('paid-pix');

  assert.deepEqual(messages[0].payload, {
    status: 'paid-pix',
    emails: ['pix@example.com'],
    removeAfterExport: false,
  });
  assert.deepEqual(messages[1].payload, {
    status: 'paid',
    channel: 'pix',
    emails: ['pix@example.com'],
  });
  assert.deepEqual(locallyDeleted, [{ channel: 'pix', emails: ['pix@example.com'] }]);
});

test('PIX status labels and failure progress include the PIX channel', () => {
  const redeemStatus = redeemStatusApi.createAccountRecordsRedeemStatusHelpers();
  const statusMeta = statusMetaApi.createAccountRecordsStatusMeta({
    normalizeTrialEligibilityStatus: () => 'eligible',
    getRedeemChannelFailureCount: (row, channel) => Number(row[`${channel}RedeemFailureCount`]) || 0,
    getUpiCredentialMembershipFailureLimit: () => 3,
    normalizeRedeemChannel: (value) => value,
    getRedeemChannelLabel: (value) => String(value || '').toUpperCase(),
  });

  assert.equal(redeemStatus.getRedeemChannelLabel('pix'), 'PIX');
  const meta = statusMeta.getUpiCredentialMembershipRowStatusMeta({
    email: 'pix@example.com',
    status: 'free',
    redeemStatus: 'failed',
    redeemChannel: 'pix',
    accessToken: 'at-token',
    upiRedeemFailureCount: 1,
    idealRedeemFailureCount: 2,
    pixRedeemFailureCount: 3,
  });
  assert.equal(meta.label, 'PIX 3/3');
  assert.match(meta.detail, /PIX 3\/3/);
});

test('fallback redeem policy exposes PIX-specific failure and daily-limit fields', () => {
  const policy = redeemPolicyApi.createAccountRecordsRedeemPolicy();

  assert.equal(policy.getRedeemChannelFailureField('pix'), 'pixRedeemFailureCount');
  assert.equal(policy.getRedeemChannelDailyLimitBlockedAtField('pix'), 'pixRedeemDailyLimitBlockedAt');
  assert.equal(policy.getRedeemChannelDailyLimitBlockedUntilField('pix'), 'pixRedeemDailyLimitBlockedUntil');
  assert.equal(policy.getRedeemChannelDailyLimitReasonField('pix'), 'pixRedeemDailyLimitReason');
});

test('membership pool resume keeps PIX as the selected channel', async () => {
  const calls = [];
  const poolOps = membershipPoolOpsApi.createAccountRecordsMembershipPoolOps({
    state: { getLatestState: () => ({}) },
    getUpiCredentialMembershipCheckResults: () => ({}),
    getAvailableUpiRedeemCdkeyCount: (_state, channel) => channel === 'pix' ? 1 : 0,
    getEnabledFreeUpiCredentialMembershipRowsForChannel: (channel) => channel === 'pix'
      ? [{ email: 'pix@example.com' }]
      : [],
    startUpiCredentialMembershipFreeRedeem: async (credentials, options) => {
      calls.push({ credentials, options });
    },
  });

  const result = await poolOps.resumeFreeRedeemAfterCdkImport({ channel: 'pix' });

  assert.deepEqual(result, { started: true, count: 1 });
  assert.equal(calls[0].options.channel, 'pix');
});

test('trial eligibility treats PIX-only candidates as redeemable and labels PIX blocks', () => {
  const trialEligibility = trialEligibilityApi.createAccountRecordsTrialEligibility({
    membershipRowPolicy: {
      isRedeemableFreeRowForChannel: (_row, channel) => channel === 'pix',
      isTrialEligibilityChannelAllowed: (_row, channel) => channel !== 'pix',
    },
  });

  assert.equal(trialEligibility.isRedeemableFreeUpiCredentialMembershipRow({}), true);
  assert.equal(
    trialEligibility.getTrialEligibilityChannelBlockedDetail({}, 'pix'),
    'PIX 渠道当前不可用'
  );
});
