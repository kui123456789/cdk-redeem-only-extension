const assert = require('node:assert/strict');
const test = require('node:test');

const serviceApi = require('../background/membership/credential-pool-service.js');
const resultState = require('../background/membership/result-state.js');

test('paid PIX deletion records only the PIX tombstone and removes the PIX row', async () => {
  let savedResults = null;
  const normalizeRedeemChannel = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
  };
  const service = serviceApi.createCredentialPoolService({
    addRedeemPlusDeletedEmailsByChannel: resultState.addRedeemPlusDeletedEmailsByChannel,
    broadcastDataUpdate: () => {},
    buildRedeemChannelUsageUpdates: () => ({}),
    buildRedeemDeletionStatePatch: resultState.buildRedeemDeletionStatePatch,
    clearUpiRedeemCdkeyUsageAccountBindings: (usage) => ({ changed: false, usage }),
    getRedeemChannelUsage: () => ({}),
    getResultItemRedeemChannel: (item) => normalizeRedeemChannel(item.redeemChannel || item.channel),
    getState: async () => ({}),
    getStoredResults: async () => ({
      items: [
        { email: 'pix@example.com', status: 'paid', redeemChannel: 'pix' },
        { email: 'upi@example.com', status: 'paid', redeemChannel: 'upi' },
      ],
      completed: 2,
      redeemPlusDeletedEmailsByChannel: {},
    }),
    getUpiRedeemCdkeyUsageEntryEmail: () => '',
    isActiveUpiRedeemRemoteStatus: () => false,
    normalizeBoolean: Boolean,
    normalizeEmail: (value) => String(value || '').trim().toLowerCase(),
    normalizeEmailList: (values) => Array.from(new Set(values.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean))),
    normalizeRedeemChannel,
    normalizeString: (value) => String(value || '').trim(),
    normalizeUpiRedeemCdkeyUsage: (value) => value || {},
    saveResults: async (value) => {
      savedResults = value;
      return value;
    },
    setState: async () => {},
  });

  const result = await service.deleteUpiCredentialMembershipCheckResults({
    status: 'paid-pix',
    emails: ['pix@example.com'],
  });

  assert.equal(result.status, 'paid');
  assert.deepEqual(savedResults.items.map((item) => item.email), ['upi@example.com']);
  assert.deepEqual(savedResults.redeemPlusDeletedEmailsByChannel, {
    upi: [],
    ideal: [],
    pix: ['pix@example.com'],
  });
});
