const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../background/bootstrap/state-patch-helpers.js');

test('keeps persisted membership results when incoming patch is stale', async () => {
  const persisted = {
    updatedAt: '2026-07-07T10:00:00.000Z',
    items: [{ email: 'a@example.com' }, { email: 'b@example.com' }],
  };
  const incoming = {
    updatedAt: '2026-07-07T09:00:00.000Z',
    items: [{ email: 'a@example.com' }],
  };
  const helpers = moduleApi.createStatePatchHelpers({
    chromeStorageLocal: {
      get: async () => ({ upiCredentialMembershipCheckResults: persisted }),
    },
    logger: { warn() {} },
  });

  const patch = { upiCredentialMembershipCheckResults: incoming };
  const result = await helpers.protectFreshMembershipResultsInStatePatch(patch);

  assert.equal(result.upiCredentialMembershipCheckResults, persisted);
});

test('aligns legacy UPI CDK aliases in a state patch', () => {
  const helpers = moduleApi.createStatePatchHelpers();
  const usage = { ABCD: { usedAt: 1 } };
  const patch = helpers.alignUpiRedeemCdkeyAliasStatePatch({
    cdkPoolText: 'ABCD',
    cdkUsage: usage,
  });

  assert.equal(patch.upiRedeemCdkeyPoolText, 'ABCD');
  assert.equal(patch.upiRedeemCdkPoolText, 'ABCD');
  assert.equal(patch.pixRedeemCdkeyPoolText, 'ABCD');
  assert.equal(patch.upiRedeemCdkeyUsage, usage);
  assert.equal(patch.upiRedeemCdkUsage, usage);
  assert.equal(patch.pixRedeemCdkeyUsage, usage);
});

test('fallback registration email state preserves previous email on clear', () => {
  const helpers = moduleApi.createStatePatchHelpers();
  const patch = helpers.buildClearedRegistrationEmailStateUpdates(
    { email: 'old@example.com' },
    { preservePrevious: true }
  );

  assert.equal(patch.email, null);
  assert.equal(patch.registrationEmailState.current, '');
  assert.equal(patch.registrationEmailState.previous, 'old@example.com');
  assert.equal(patch.registrationEmailState.source, '');
});
