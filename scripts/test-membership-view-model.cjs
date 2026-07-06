const test = require('node:test');
const assert = require('node:assert/strict');

const membershipViewModel = require('../sidepanel/membership-view-model.js');
const membershipRowPolicy = require('../sidepanel/membership-row-policy.js');

test('groups paid rows by redeem channel', () => {
  assert.equal(membershipViewModel.getGroup({ status: 'paid', redeemChannel: 'ideal' }), 'ideal-plus');
  assert.equal(membershipViewModel.getGroup({ status: 'paid', redeemChannel: 'upi' }), 'upi-plus');
  assert.equal(membershipViewModel.getGroup({ status: 'free', redeemChannel: 'ideal' }), 'free');
});

test('buildRows normalizes emails and summarize counts membership groups', () => {
  const rows = membershipViewModel.buildRows({
    items: [
      { email: ' Free@Example.COM ', status: 'free', accessToken: 'free-at' },
      { email: ' upi@example.com ', status: 'paid', redeemChannel: 'upi' },
      { email: ' IDEAL@Example.com ', status: 'paid', redeemChannel: 'ideal', access_token: 'ideal-at' },
      { email: '', status: 'paid', redeemChannel: 'upi' },
    ],
  });

  assert.deepEqual(rows.map((row) => row.email), [
    'free@example.com',
    'upi@example.com',
    'ideal@example.com',
  ]);
  assert.deepEqual(membershipViewModel.summarize(rows), {
    total: 3,
    withAt: 2,
    free: 1,
    'upi-plus': 1,
    'ideal-plus': 1,
  });
});

function buildEligibleFreeRow(overrides = {}) {
  return {
    email: 'candidate@example.com',
    status: 'free',
    enabled: true,
    trialEligibilityStatus: 'eligible',
    accessToken: 'at-token',
    ...overrides,
  };
}

test('UPI manual candidate ignores generic failure count', () => {
  const row = buildEligibleFreeRow({
    redeemStatus: 'failed',
    redeemChannel: 'upi',
    redeemFailureCount: 3,
    upiRedeemFailureCount: 3,
  });

  assert.equal(membershipRowPolicy.isRedeemableFreeRowForChannel(row, 'upi'), true);
  assert.equal(membershipRowPolicy.isRedeemableFreeRowForChannel(row, 'ideal'), true);
});

test('pm-unavailable and cross-region payment rows are not redeemable', () => {
  const pmUnavailableRow = buildEligibleFreeRow({
    upiChannelEligibilityStatus: 'pm-unavailable',
    idealChannelEligibilityStatus: 'pm-unavailable',
  });
  const crossRegionRow = buildEligibleFreeRow({
    upiChannelEligibilityStatus: 'cross-region-payment',
    idealChannelEligibilityStatus: 'cross-region-payment',
  });

  assert.equal(membershipRowPolicy.isRedeemableFreeRowForChannel(pmUnavailableRow, 'upi'), false);
  assert.equal(membershipRowPolicy.isRedeemableFreeRowForChannel(pmUnavailableRow, 'ideal'), false);
  assert.equal(membershipRowPolicy.isRedeemableFreeRowForChannel(crossRegionRow, 'upi'), false);
  assert.equal(membershipRowPolicy.isRedeemableFreeRowForChannel(crossRegionRow, 'ideal'), false);
});

test('deleted UPI Plus tombstone does not hide IDEAL Plus', () => {
  const deletedEmailSets = {
    upi: new Set(['plus@example.com']),
    ideal: new Set(),
  };

  assert.equal(membershipRowPolicy.isRedeemPlusDeletedDisplayRow({
    email: 'plus@example.com',
    status: 'paid',
    redeemChannel: 'upi',
  }, deletedEmailSets), true);
  assert.equal(membershipRowPolicy.isRedeemPlusDeletedDisplayRow({
    email: 'plus@example.com',
    status: 'paid',
    redeemChannel: 'ideal',
  }, deletedEmailSets), false);
});

test('missing AT rows are counted as not redeemable', () => {
  const rows = [
    buildEligibleFreeRow({ email: 'ready@example.com' }),
    buildEligibleFreeRow({ email: 'missing@example.com', accessToken: '' }),
  ];
  const summary = membershipRowPolicy.summarizeRows(rows);

  assert.equal(summary.missingAtCount, 1);
  assert.equal(summary.redeemableFreeCount, 1);
  assert.equal(membershipRowPolicy.isRedeemableFreeRowForChannel(rows[1], 'upi'), false);
});
