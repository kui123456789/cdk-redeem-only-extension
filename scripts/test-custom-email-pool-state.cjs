const test = require('node:test');
const assert = require('node:assert/strict');

const { createCustomEmailPoolState } = require('../background/custom-email-pool-state.js');
const {
  normalizeCustomEmailVerificationUrl,
  parseCustomEmailPoolEntryValue,
  parseHiddenEmailCredential,
} = require('../mail-provider-utils.js');

test('custom email pool state normalizes verification URL rows', () => {
  const state = createCustomEmailPoolState({
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
  });

  const [entry] = state.normalizeCustomEmailPoolEntryObjects([
    'sample@example.com----https://assurivo.com/console/open.php?mail=sample%40example.com&pwd=pw&limit=5',
  ]);

  assert.equal(entry.email, 'sample@example.com');
  assert.equal(entry.credential, '');
  assert.equal(entry.verificationUrl, 'https://assurivo.com/console/open.php?mail=sample%40example.com&pwd=pw&limit=5');
  assert.equal(entry.enabled, true);
  assert.equal(entry.used, false);
});

test('custom email pool recovery restores persisted entries only when runtime entries are missing', () => {
  const state = createCustomEmailPoolState({
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
  });
  const recoveryPatch = state.buildCustomEmailPoolRecoveryPatch({
    emailGenerator: 'custom-pool',
    customEmailPoolEntries: [],
    customEmailPool: [],
    selectedCustomEmailPoolEmail: 'second@example.com',
  }, {
    emailGenerator: 'custom-pool',
    customEmailPoolEntries: [
      { id: 'entry-1', email: 'first@example.com', enabled: true, used: false },
      { id: 'entry-2', email: 'second@example.com', enabled: true, used: false },
    ],
    customEmailPool: ['first@example.com', 'second@example.com'],
  });

  assert.deepEqual(recoveryPatch.customEmailPool, ['first@example.com', 'second@example.com']);
  assert.equal(recoveryPatch.customEmailPoolEntries.length, 2);
  assert.equal(recoveryPatch.selectedCustomEmailPoolEmail, 'second@example.com');
  assert.equal(state.buildCustomEmailPoolRecoveryPatch({
    emailGenerator: 'custom-pool',
    customEmailPoolEntries: [{ id: 'runtime', email: 'runtime@example.com', enabled: true, used: false }],
  }, {
    emailGenerator: 'custom-pool',
    customEmailPoolEntries: [{ id: 'persisted', email: 'persisted@example.com', enabled: true, used: false }],
  }), null);
});

test('custom email pool state marks ineligible entries used and persists state', async () => {
  const writes = [];
  const logs = [];
  let currentState = {
    customEmailPoolEntries: [
      {
        id: 'entry-1',
        email: 'sample@example.com',
        enabled: true,
        used: false,
      },
    ],
    selectedCustomEmailPoolEmail: 'sample@example.com',
  };
  const state = createCustomEmailPoolState({
    addLog: async (message, level) => logs.push({ message, level }),
    broadcastDataUpdate: (payload) => writes.push({ kind: 'broadcast', payload }),
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async (payload) => writes.push({ kind: 'persist', payload }),
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
      writes.push({ kind: 'state', payload });
    },
  });

  const result = await state.markCurrentCustomEmailPoolEntryTrialIneligible(currentState, {
    email: 'sample@example.com',
    reason: 'not-eligible',
    checkedAt: '2026-07-08T00:00:00.000Z',
    accessToken: 'at-ineligible-token',
  });

  assert.equal(result.updated, true);
  assert.equal(result.customEmailPoolEntries[0].used, true);
  assert.equal(result.customEmailPoolEntries[0].note, '无试用资格');
  assert.equal(result.customEmailPoolEntries[0].trialEligibilityStatus, 'ineligible');
  assert.deepEqual(result.customEmailPool, []);
  assert.equal(currentState.selectedCustomEmailPoolEmail, '');
  assert.equal(writes.some((write) => write.kind === 'persist'), true);
  assert.equal(writes.some((write) => write.kind === 'state'), true);
  assert.equal(logs[0].level, 'warn');
});

test('custom email pool state marks eligible entries used and stores access token', async () => {
  const writes = [];
  let currentState = {
    customEmailPoolEntries: [
      {
        id: 'entry-1',
        email: 'sample+alias@icloud.com',
        enabled: true,
        used: false,
      },
    ],
    selectedCustomEmailPoolEmail: 'sample+alias@icloud.com',
  };
  const state = createCustomEmailPoolState({
    broadcastDataUpdate: (payload) => writes.push({ kind: 'broadcast', payload }),
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async (payload) => writes.push({ kind: 'persist', payload }),
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
      writes.push({ kind: 'state', payload });
    },
  });

  const result = await state.markCustomEmailPoolEntryTrialEligibility(currentState, {
    email: 'sample+alias@icloud.com',
    status: 'eligible',
    reason: '账号有试用资格。',
    checkedAt: '2026-07-08T00:00:00.000Z',
    accessToken: 'at-test-token',
    markUsed: true,
  });

  assert.equal(result.updated, true);
  assert.equal(result.customEmailPoolEntries[0].used, true);
  assert.equal(result.customEmailPoolEntries[0].trialEligibilityStatus, 'eligible');
  assert.equal(result.customEmailPoolEntries[0].accessToken, 'at-test-token');
  assert.deepEqual(result.customEmailPool, []);
  assert.equal(currentState.selectedCustomEmailPoolEmail, '');
  assert.equal(writes.some((write) => write.kind === 'persist'), true);
  assert.equal(writes.some((write) => write.kind === 'broadcast'), true);
});

test('custom email pool state advances selected email after eligibility mark', async () => {
  let currentState = {
    customEmailPoolEntries: [
      { id: 'entry-1', email: 'first@example.com', enabled: true, used: false, accessToken: 'at-existing-token' },
      { id: 'entry-2', email: 'second@example.com', enabled: true, used: false },
      { id: 'entry-3', email: 'third@example.com', enabled: true, used: false },
    ],
    selectedCustomEmailPoolEmail: 'stale@example.com',
  };
  const writes = [];
  const state = createCustomEmailPoolState({
    broadcastDataUpdate: (payload) => writes.push({ kind: 'broadcast', payload }),
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async (payload) => writes.push({ kind: 'persist', payload }),
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
      writes.push({ kind: 'state', payload });
    },
  });

  const result = await state.markCustomEmailPoolEntryTrialEligibility(currentState, {
    email: 'first@example.com',
    status: 'eligible',
    reason: '账号有试用资格。',
    checkedAt: '2026-07-08T00:00:00.000Z',
    accessToken: 'at-test-token',
    markUsed: true,
  });

  assert.equal(result.updated, true);
  assert.equal(result.customEmailPoolEntries[0].used, true);
  assert.deepEqual(result.customEmailPool, ['second@example.com', 'third@example.com']);
  assert.equal(currentState.selectedCustomEmailPoolEmail, 'second@example.com');
  assert.equal(writes.some((write) => write.payload.selectedCustomEmailPoolEmail === 'second@example.com'), true);
});

test('custom email pool state skips used entries when advancing selected email', async () => {
  let currentState = {
    customEmailPoolEntries: [
      { id: 'entry-1', email: 'first@example.com', enabled: true, used: false },
      { id: 'entry-2', email: 'already-used@example.com', enabled: true, used: true, accessToken: 'at-used-token' },
      { id: 'entry-3', email: 'next-unused@example.com', enabled: true, used: false },
    ],
    selectedCustomEmailPoolEmail: 'first@example.com',
  };
  const writes = [];
  const state = createCustomEmailPoolState({
    broadcastDataUpdate: (payload) => writes.push({ kind: 'broadcast', payload }),
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async (payload) => writes.push({ kind: 'persist', payload }),
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
      writes.push({ kind: 'state', payload });
    },
  });

  const result = await state.markCustomEmailPoolEntryTrialEligibility(currentState, {
    email: 'first@example.com',
    status: 'eligible',
    checkedAt: '2026-07-08T00:00:00.000Z',
    accessToken: 'at-first-token',
    markUsed: true,
  });

  assert.equal(result.updated, true);
  assert.equal(result.customEmailPoolEntries[0].used, true);
  assert.deepEqual(result.customEmailPool, ['next-unused@example.com']);
  assert.equal(currentState.selectedCustomEmailPoolEmail, 'next-unused@example.com');
  assert.equal(writes.some((write) => write.payload.selectedCustomEmailPoolEmail === 'next-unused@example.com'), true);
});

test('custom email pool current-used mark advances to next available email', async () => {
  let currentState = {
    emailGenerator: 'custom-pool',
    email: 'first@example.com',
    accessToken: 'at-current-used-token',
    customEmailPoolEntries: [
      { id: 'entry-1', email: 'first@example.com', enabled: true, used: false },
      { id: 'entry-2', email: 'second@example.com', enabled: true, used: false },
    ],
    selectedCustomEmailPoolEmail: 'first@example.com',
  };
  const state = createCustomEmailPoolState({
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async () => {},
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
    },
  });

  const result = await state.markCurrentCustomEmailPoolEntryUsed(currentState, {
    log: false,
  });

  assert.equal(result.updated, true);
  assert.equal(result.customEmailPoolEntries[0].used, true);
  assert.deepEqual(result.customEmailPool, ['second@example.com']);
  assert.equal(currentState.selectedCustomEmailPoolEmail, 'second@example.com');
});

test('custom email pool used mark preserves current full pool when runtime state only carries the target email', async () => {
  let currentState = {
    emailGenerator: 'custom-pool',
    email: 'first@example.com',
    customEmailPoolEntries: [
      { id: 'entry-1', email: 'first@example.com', enabled: true, used: false },
      { id: 'entry-2', email: 'second@example.com', enabled: true, used: false },
      { id: 'entry-3', email: 'third@example.com', enabled: true, used: false },
    ],
    customEmailPool: ['first@example.com', 'second@example.com', 'third@example.com'],
    selectedCustomEmailPoolEmail: 'first@example.com',
  };
  const state = createCustomEmailPoolState({
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async () => {},
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
    },
  });

  const result = await state.markCurrentCustomEmailPoolEntryUsed({
    emailGenerator: 'custom-pool',
    email: 'first@example.com',
    accessToken: 'at-first-token',
    customEmailPoolEntries: [{ id: 'entry-1', email: 'first@example.com', enabled: true, used: false }],
    selectedCustomEmailPoolEmail: 'first@example.com',
  }, {
    log: false,
  });

  assert.equal(result.updated, true);
  assert.equal(result.customEmailPoolEntries.length, 3);
  assert.equal(result.customEmailPoolEntries[0].used, true);
  assert.deepEqual(result.customEmailPool, ['second@example.com', 'third@example.com']);
  assert.equal(currentState.selectedCustomEmailPoolEmail, 'second@example.com');
});

test('custom email pool automatic used mark refuses missing AT', async () => {
  let currentState = {
    emailGenerator: 'custom-pool',
    email: 'first@example.com',
    customEmailPoolEntries: [
      { id: 'entry-1', email: 'first@example.com', enabled: true, used: false },
      { id: 'entry-2', email: 'second@example.com', enabled: true, used: false },
    ],
    selectedCustomEmailPoolEmail: 'first@example.com',
  };
  const logs = [];
  const state = createCustomEmailPoolState({
    addLog: async (message, level) => logs.push({ message, level }),
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async () => {},
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
    },
  });

  const result = await state.markCurrentCustomEmailPoolEntryUsed(currentState, {
    logPrefix: '测试',
  });

  assert.equal(result.updated, false);
  assert.equal(result.skipped, true);
  assert.equal(currentState.customEmailPoolEntries[0].used, false);
  assert.equal(currentState.selectedCustomEmailPoolEmail, 'first@example.com');
  assert.equal(logs.some((entry) => /未读取到 AT/.test(entry.message)), true);
});

test('custom email pool registration-blocked entries are excluded without marking used', async () => {
  let currentState = {
    emailGenerator: 'custom-pool',
    email: 'first@example.com',
    customEmailPoolEntries: [
      { id: 'entry-1', email: 'first@example.com', enabled: true, used: false },
      { id: 'entry-2', email: 'second@example.com', enabled: true, used: false },
    ],
    selectedCustomEmailPoolEmail: 'first@example.com',
  };
  const writes = [];
  const state = createCustomEmailPoolState({
    broadcastDataUpdate: (payload) => writes.push({ kind: 'broadcast', payload }),
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async (payload) => writes.push({ kind: 'persist', payload }),
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
      writes.push({ kind: 'state', payload });
    },
  });

  const result = await state.markCurrentCustomEmailPoolEntryRegistrationBlocked(currentState, {
    reason: 'user_already_exists',
    log: false,
  });

  assert.equal(result.updated, true);
  assert.equal(result.customEmailPoolEntries[0].used, false);
  assert.equal(result.customEmailPoolEntries[0].registrationBlocked, true);
  assert.equal(result.customEmailPoolEntries[0].registrationBlockedReasonCode, 'user_already_exists');
  assert.deepEqual(result.customEmailPool, ['second@example.com']);
  assert.equal(currentState.selectedCustomEmailPoolEmail, 'second@example.com');
  assert.equal(state.isCustomEmailPoolEntryAvailable(result.customEmailPoolEntries[0]), false);
  assert.equal(writes.some((write) => write.kind === 'persist'), true);
});

test('custom email pool registration block falls back to selected email', async () => {
  let currentState = {
    emailGenerator: 'custom-pool',
    customEmailPoolEntries: [
      { id: 'entry-1', email: 'selected@example.com', enabled: true, used: false },
      { id: 'entry-2', email: 'next@example.com', enabled: true, used: false },
    ],
    selectedCustomEmailPoolEmail: 'selected@example.com',
  };
  const state = createCustomEmailPoolState({
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async () => {},
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
    },
  });

  const result = await state.markCurrentCustomEmailPoolEntryRegistrationBlocked(currentState, {
    reason: 'user_already_exists',
    log: false,
  });

  assert.equal(result.updated, true);
  assert.equal(result.email, 'selected@example.com');
  assert.equal(result.customEmailPoolEntries[0].registrationBlocked, true);
  assert.deepEqual(result.customEmailPool, ['next@example.com']);
  assert.equal(currentState.selectedCustomEmailPoolEmail, 'next@example.com');
});

test('custom email pool manual skipped entry may be used without AT', async () => {
  let currentState = {
    emailGenerator: 'custom-pool',
    email: 'first@example.com',
    customEmailPoolEntries: [
      { id: 'entry-1', email: 'first@example.com', enabled: true, used: false },
      { id: 'entry-2', email: 'second@example.com', enabled: true, used: false },
    ],
    selectedCustomEmailPoolEmail: 'first@example.com',
  };
  const state = createCustomEmailPoolState({
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async () => {},
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
    },
  });

  const result = await state.markCurrentCustomEmailPoolEntryUsed(currentState, {
    manualSkipped: true,
    log: false,
  });

  assert.equal(result.updated, true);
  assert.equal(result.customEmailPoolEntries[0].used, true);
  assert.equal(result.customEmailPoolEntries[0].manualSkipped, true);
  assert.equal(result.customEmailPoolEntries[0].accessToken, '');
  assert.equal(currentState.selectedCustomEmailPoolEmail, 'second@example.com');
});

test('custom email pool state uses persisted entries when provided runtime state is stale', async () => {
  const writes = [];
  let currentState = {
    customEmailPoolEntries: [
      {
        id: 'entry-1',
        email: 'stale-runtime@example.com',
        enabled: true,
        used: false,
      },
    ],
    customEmailPool: ['stale-runtime@example.com'],
    selectedCustomEmailPoolEmail: 'stale-runtime@example.com',
  };
  const state = createCustomEmailPoolState({
    broadcastDataUpdate: (payload) => writes.push({ kind: 'broadcast', payload }),
    getState: async () => currentState,
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
    setPersistentSettings: async (payload) => writes.push({ kind: 'persist', payload }),
    setState: async (payload) => {
      currentState = { ...currentState, ...payload };
      writes.push({ kind: 'state', payload });
    },
  });

  const result = await state.markCustomEmailPoolEntryTrialEligibility({
    email: 'stale-runtime@example.com',
    customEmailPoolEntries: [],
    customEmailPool: [],
    selectedCustomEmailPoolEmail: 'stale-runtime@example.com',
  }, {
    email: 'stale-runtime@example.com',
    status: 'ineligible',
    reason: 'not-eligible',
    checkedAt: '2026-07-08T00:00:00.000Z',
    accessToken: 'at-stale-token',
  });

  assert.equal(result.updated, true);
  assert.equal(result.customEmailPoolEntries[0].used, true);
  assert.equal(result.customEmailPoolEntries[0].accessToken, 'at-stale-token');
  assert.equal(result.customEmailPoolEntries[0].trialEligibilityStatus, 'ineligible');
  assert.deepEqual(result.customEmailPool, []);
  assert.equal(currentState.selectedCustomEmailPoolEmail, '');
  assert.equal(writes.some((write) => write.kind === 'persist'), true);
});

test('custom email pool run selection keeps selected email only while available', () => {
  const state = createCustomEmailPoolState({
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
  });

  assert.equal(
    state.getCustomEmailPoolEmailForRun({
      selectedCustomEmailPoolEmail: 'selected@example.com',
      customEmailPoolEntries: [
        { email: 'selected@example.com', enabled: true, used: false },
        { email: 'next@example.com', enabled: true, used: false },
      ],
    }),
    'selected@example.com'
  );
});

test('custom email pool run selection skips stale selected entries', () => {
  const state = createCustomEmailPoolState({
    normalizeCustomEmailVerificationUrl,
    parseCustomEmailPoolEntryValue,
    parseHiddenEmailCredential,
  });

  for (const staleSelectedEntry of [
    { email: 'selected@example.com', enabled: true, used: true, accessToken: 'at-used-token' },
    { email: 'selected@example.com', enabled: false, used: false },
    {
      email: 'selected@example.com',
      enabled: true,
      used: false,
      trialEligibilityStatus: 'ineligible',
    },
  ]) {
    assert.equal(
      state.getCustomEmailPoolEmailForRun({
        selectedCustomEmailPoolEmail: 'selected@example.com',
        customEmailPoolEntries: [
          staleSelectedEntry,
          { email: 'next@example.com', enabled: true, used: false },
        ],
      }),
      'next@example.com'
    );
  }
});
