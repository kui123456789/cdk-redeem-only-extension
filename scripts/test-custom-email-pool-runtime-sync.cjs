const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createRuntimeMessageDataHandler,
} = require('../sidepanel/runtime-message-data-handler.js');
const {
  createCustomEmailPoolMembershipSync,
} = require('../sidepanel/custom-email-pool-membership-sync.js');

function createScopedHandler(scopeValues) {
  let latestState = scopeValues.latestState || {};
  const dynamicScope = {
    ...scopeValues,
    syncLatestState(payload = {}) {
      latestState = {
        ...latestState,
        ...payload,
      };
    },
  };

  return createRuntimeMessageDataHandler({
    createCombinedScope(_appState, values = {}) {
      const scope = {
        ...dynamicScope,
        ...values,
      };
      return new Proxy(scope, {
        has() {
          return true;
        },
        get(target, property) {
          if (property === Symbol.unscopables) {
            return undefined;
          }
          if (property === 'latestState') {
            return latestState;
          }
          return target[property];
        },
      });
    },
  });
}

test('runtime membership result updates also refresh custom email pool', () => {
  const calls = [];
  const membershipResults = {
    items: [{
      email: 'sample@example.com',
      status: 'free',
      accessToken: 'at-token',
      trialEligibilityStatus: 'eligible',
      trialEligibilityCheckedAt: '2026-07-08T10:00:00.000Z',
    }],
  };
  const handler = createScopedHandler({
    accountRecordsManager: null,
    renderAccountRecords: () => calls.push('renderAccountRecords'),
    syncCustomEmailPoolEntriesFromMembershipResults: (results) => {
      calls.push('syncCustomEmailPoolEntriesFromMembershipResults');
      assert.equal(results, membershipResults);
      return true;
    },
    renderCustomEmailPoolEntries: () => calls.push('renderCustomEmailPoolEntries'),
    queueCustomEmailPoolRefresh: () => calls.push('queueCustomEmailPoolRefresh'),
    updateAllUpiRedeemCdkeyPoolSummaries: () => calls.push('updateAllUpiRedeemCdkeyPoolSummaries'),
    scheduleUpiRedeemCdkeyStatusAutoRefresh: () => calls.push('scheduleUpiRedeemCdkeyStatusAutoRefresh'),
    updateAccountRunHistorySettingsUI: () => calls.push('updateAccountRunHistorySettingsUI'),
    renderContributionMode: () => calls.push('renderContributionMode'),
    syncPlusManualConfirmationDialog: () => calls.push('syncPlusManualConfirmationDialog'),
  });

  handler.handleDataUpdated({
    payload: {
      upiCredentialMembershipCheckResults: membershipResults,
    },
  });

  assert.deepEqual(calls.slice(0, 4), [
    'renderAccountRecords',
    'syncCustomEmailPoolEntriesFromMembershipResults',
    'renderCustomEmailPoolEntries',
    'queueCustomEmailPoolRefresh',
  ]);
});

test('runtime customEmailPool-only updates do not replace structured entries', () => {
  const calls = [];
  const handler = createScopedHandler({
    latestState: {
      customEmailPoolEntries: [{
        id: 'entry-1',
        email: 'sample@example.com',
        enabled: true,
        used: false,
      }],
    },
    setCustomEmailPoolEntriesState: () => calls.push('setCustomEmailPoolEntriesState'),
    restoreCustomEmailPoolEntriesFromState: () => {
      calls.push('restoreCustomEmailPoolEntriesFromState');
      return [];
    },
    renderCustomEmailPoolEntries: () => calls.push('renderCustomEmailPoolEntries'),
    syncRunCountFromConfiguredEmailPool: () => calls.push('syncRunCountFromConfiguredEmailPool'),
    queueCustomEmailPoolRefresh: () => calls.push('queueCustomEmailPoolRefresh'),
    updateAccountRunHistorySettingsUI: () => calls.push('updateAccountRunHistorySettingsUI'),
    renderContributionMode: () => calls.push('renderContributionMode'),
    syncPlusManualConfirmationDialog: () => calls.push('syncPlusManualConfirmationDialog'),
  });

  handler.handleDataUpdated({
    payload: {
      customEmailPool: [],
    },
  });

  assert.equal(calls.includes('setCustomEmailPoolEntriesState'), false);
  assert.equal(calls.includes('restoreCustomEmailPoolEntriesFromState'), false);
  assert.deepEqual(calls.slice(0, 3), [
    'renderCustomEmailPoolEntries',
    'syncRunCountFromConfiguredEmailPool',
    'queueCustomEmailPoolRefresh',
  ]);
});

test('runtime empty customEmailPoolEntries update preserves existing structured entries', () => {
  const calls = [];
  const existingEntries = [{
    id: 'entry-1',
    email: 'sample@example.com',
    enabled: true,
    used: true,
  }];
  const handler = createScopedHandler({
    latestState: {
      customEmailPoolEntries: existingEntries,
    },
    getNormalizedCustomEmailPoolEntriesState: () => existingEntries,
    restoreCustomEmailPoolEntriesFromState: (state) => {
      calls.push('restoreCustomEmailPoolEntriesFromState');
      assert.deepEqual(state.customEmailPoolEntries, existingEntries);
      return state.customEmailPoolEntries;
    },
    setCustomEmailPoolEntriesState: (entries) => {
      calls.push('setCustomEmailPoolEntriesState');
      assert.deepEqual(entries, existingEntries);
    },
    syncCustomEmailPoolEntriesFromMembershipResults: () => calls.push('syncCustomEmailPoolEntriesFromMembershipResults'),
    renderCustomEmailPoolEntries: () => calls.push('renderCustomEmailPoolEntries'),
    syncRunCountFromConfiguredEmailPool: () => calls.push('syncRunCountFromConfiguredEmailPool'),
    queueCustomEmailPoolRefresh: () => calls.push('queueCustomEmailPoolRefresh'),
    updateAccountRunHistorySettingsUI: () => calls.push('updateAccountRunHistorySettingsUI'),
    renderContributionMode: () => calls.push('renderContributionMode'),
    syncPlusManualConfirmationDialog: () => calls.push('syncPlusManualConfirmationDialog'),
  });

  handler.handleDataUpdated({
    payload: {
      customEmailPoolEntries: [],
      customEmailPool: [],
    },
  });

  assert.deepEqual(calls.slice(0, 4), [
    'restoreCustomEmailPoolEntriesFromState',
    'setCustomEmailPoolEntriesState',
    'syncCustomEmailPoolEntriesFromMembershipResults',
    'renderCustomEmailPoolEntries',
  ]);
});

test('runtime email update immediately refreshes custom email current marker', () => {
  const calls = [];
  const inputEmail = { value: '' };
  const handler = createScopedHandler({
    inputEmail,
    renderCustomEmailPoolEntries: () => calls.push('renderCustomEmailPoolEntries'),
    queueCustomEmailPoolRefresh: () => calls.push('queueCustomEmailPoolRefresh'),
    updateAccountRunHistorySettingsUI: () => calls.push('updateAccountRunHistorySettingsUI'),
    renderContributionMode: () => calls.push('renderContributionMode'),
    syncPlusManualConfirmationDialog: () => calls.push('syncPlusManualConfirmationDialog'),
  });

  handler.handleDataUpdated({
    payload: {
      email: 'selected@example.com',
      selectedCustomEmailPoolEmail: 'selected@example.com',
    },
  });

  assert.equal(inputEmail.value, 'selected@example.com');
  assert.deepEqual(calls.slice(0, 2), [
    'renderCustomEmailPoolEntries',
    'queueCustomEmailPoolRefresh',
  ]);
});

test('custom email pool membership sync marks matching eligible Free result used', () => {
  const syncer = createCustomEmailPoolMembershipSync({
    now: () => 123456,
  });

  const result = syncer.mergeEntriesWithMembershipResults([
    {
      id: 'entry-1',
      email: 'sample@example.com',
      enabled: true,
      used: false,
      lastUsedAt: 0,
      accessToken: '',
      accessTokenMasked: '',
      trialEligibilityStatus: '',
    },
  ], {
    items: [{
      email: 'SAMPLE@example.com',
      status: 'free',
      accessToken: 'at-token-value-123456',
      trialEligibilityStatus: 'eligible',
      trialEligibilityCheckedAt: '2026-07-08T10:00:00.000Z',
      trialEligibilityReason: 'eligible',
    }],
  });

  assert.equal(result.changed, true);
  assert.equal(result.entries[0].used, true);
  assert.equal(result.entries[0].trialEligibilityStatus, 'eligible');
  assert.equal(result.entries[0].accessToken, 'at-token-value-123456');
  assert.equal(result.entries[0].trialEligibilityCheckedAt, '2026-07-08T10:00:00.000Z');
});

test('custom email pool membership sync refuses used state without AT', () => {
  const syncer = createCustomEmailPoolMembershipSync({
    now: () => 123456,
  });

  const result = syncer.mergeEntriesWithMembershipResults([
    {
      id: 'entry-1',
      email: 'sample@example.com',
      enabled: true,
      used: false,
      lastUsedAt: 0,
      accessToken: '',
      accessTokenMasked: '',
      trialEligibilityStatus: '',
    },
  ], {
    items: [{
      email: 'sample@example.com',
      status: 'free',
      trialEligibilityStatus: 'eligible',
      trialEligibilityCheckedAt: '2026-07-08T10:00:00.000Z',
      trialEligibilityReason: 'eligible',
    }],
  });

  assert.equal(result.changed, false);
  assert.equal(result.entries[0].used, false);
  assert.equal(result.entries[0].accessToken, '');
});
