const test = require('node:test');
const assert = require('node:assert/strict');

const membershipViewModel = require('../sidepanel/membership-view-model.js');

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
