const test = require('node:test');
const assert = require('node:assert/strict');

const { createAutoRunSessionRunner } = require('../background/auto-run/session-runner.js');
const { createAutoRunSummaryBuilder } = require('../background/auto-run/summary-builder.js');

test('auto-run resume keeps retry attempt on the original round when next round has no history', async () => {
  const capturedRuns = [];
  let runtimeState = {
    autoRunActive: false,
    autoRunCurrentRun: 0,
    autoRunTotalRuns: 0,
    autoRunAttemptRun: 0,
    autoRunSessionId: 0,
  };
  let appState = {
    autoRunFallbackThreadIntervalMinutes: 0,
    autoRunSessionId: 123,
  };
  const summaryBuilder = createAutoRunSummaryBuilder({ addLog: async () => {} });
  const runner = createAutoRunSessionRunner({
    ...summaryBuilder,
    addLog: async () => {},
    appendAccountRunRecord: async () => ({}),
    AUTO_RUN_MAX_RETRIES_PER_ROUND: 3,
    AUTO_RUN_RETRY_DELAY_MS: 1,
    AUTO_RUN_TIMER_KIND_BEFORE_RETRY: 'before_retry',
    AUTO_RUN_TIMER_KIND_BETWEEN_ROUNDS: 'between_rounds',
    broadcastAutoRunStatus: async () => {},
    broadcastStopToContentScripts: async () => {},
    cancelPendingCommands: () => {},
    clearStopRequest: () => {},
    createAutoRunRoundLogSnapshotMarker: () => ({}),
    createAutoRunSessionId: () => 123,
    ensureHotmailMailboxReadyForAutoRunRound: null,
    evaluateAttemptFailure: () => ({ reason: 'failed' }),
    getAutoRunRoundSnapshotReason: () => '',
    getAutoRunRoundSnapshotStatus: () => 'stopped',
    getAutoRunStatusPayload: (phase, payload) => ({
      autoRunPhase: phase,
      autoRunCurrentRun: payload.currentRun,
      autoRunTotalRuns: payload.totalRuns,
      autoRunAttemptRun: payload.attemptRun,
      autoRunSessionId: payload.sessionId,
    }),
    getErrorMessage: (error) => error?.message || String(error || ''),
    getFirstUnfinishedNodeId: () => null,
    getMaxAttemptsForRound: () => 3,
    getPendingAutoRunTimerPlan: () => null,
    getRunningNodeIds: () => [],
    getState: async () => appState,
    getStopRequested: () => false,
    hasSavedNodeProgress: () => false,
    isStopError: (error) => error?.message === 'STOP',
    launchAutoRunTimerPlan: async () => false,
    logAutoRunFinalSummary: async () => {},
    normalizeAutoRunFallbackThreadIntervalMinutes: () => 0,
    persistAutoRunTimerPlan: async () => {},
    replayPreviousSuccessfulAutoRunRoundLogSnapshot: async () => {},
    resetState: async () => {
      appState = {};
    },
    resolveAutoRunAccountRecordStatus: (status) => status,
    runAutoSequenceFromNode: async (_nodeId, context) => {
      capturedRuns.push(context);
      throw new Error('STOP');
    },
    runtime: {
      get: () => runtimeState,
      set: (patch) => {
        runtimeState = { ...runtimeState, ...patch };
      },
    },
    saveAutoRunRoundLogSnapshot: async () => null,
    selectFailureAction: () => ({ code: 'retry_generic' }),
    setState: async (patch) => {
      appState = { ...appState, ...patch };
    },
    sleepWithStop: async () => {},
    throwIfAutoRunSessionStopped: () => {},
    waitForRunningNodesToFinish: async () => appState,
    chrome: {
      runtime: {
        sendMessage: async () => {},
      },
    },
  });

  await runner.autoRunLoop(2, {
    autoRunSessionId: 123,
    mode: 'continue',
    resumeCurrentRun: 2,
    resumeAttemptRun: 2,
    resumeRoundSummaries: [
      { round: 1, status: 'pending', attempts: 1, failureReasons: ['first failed'] },
      { round: 2, status: 'pending', attempts: 0, failureReasons: [] },
    ],
  });

  assert.equal(capturedRuns.length, 1);
  assert.equal(capturedRuns[0].targetRun, 1);
  assert.equal(capturedRuns[0].attemptRuns, 2);
});

test('auto-run preserves custom email pool state and blocks already-registered emails', async () => {
  const capturedStates = [];
  const blockedCalls = [];
  let runtimeState = {
    autoRunActive: false,
    autoRunCurrentRun: 0,
    autoRunTotalRuns: 0,
    autoRunAttemptRun: 0,
    autoRunSessionId: 0,
  };
  let appState = {
    autoRunFallbackThreadIntervalMinutes: 0,
    email: 'first@example.com',
    emailGenerator: 'custom-pool',
    customEmailPoolEntries: [
      { id: 'entry-1', email: 'first@example.com', enabled: true, used: false },
      { id: 'entry-2', email: 'second@example.com', enabled: true, used: false },
    ],
    customEmailPool: ['first@example.com', 'second@example.com'],
    selectedCustomEmailPoolEmail: 'first@example.com',
  };
  const summaryBuilder = createAutoRunSummaryBuilder({ addLog: async () => {} });
  const runner = createAutoRunSessionRunner({
    ...summaryBuilder,
    addLog: async () => {},
    appendAccountRunRecord: async () => ({}),
    AUTO_RUN_MAX_RETRIES_PER_ROUND: 3,
    AUTO_RUN_RETRY_DELAY_MS: 1,
    AUTO_RUN_TIMER_KIND_BEFORE_RETRY: 'before_retry',
    AUTO_RUN_TIMER_KIND_BETWEEN_ROUNDS: 'between_rounds',
    broadcastAutoRunStatus: async () => {},
    broadcastStopToContentScripts: async () => {},
    cancelPendingCommands: () => {},
    clearStopRequest: () => {},
    createAutoRunRoundLogSnapshotMarker: () => ({}),
    createAutoRunSessionId: () => 123,
    ensureHotmailMailboxReadyForAutoRunRound: null,
    evaluateAttemptFailure: () => ({ reason: 'SIGNUP_USER_ALREADY_EXISTS::exists' }),
    getAutoRunRoundSnapshotReason: () => '',
    getAutoRunRoundSnapshotStatus: () => 'failed',
    getAutoRunStatusPayload: (phase, payload) => ({
      autoRunPhase: phase,
      autoRunCurrentRun: payload.currentRun,
      autoRunTotalRuns: payload.totalRuns,
      autoRunAttemptRun: payload.attemptRun,
      autoRunSessionId: payload.sessionId,
    }),
    getErrorMessage: (error) => error?.message || String(error || ''),
    getFirstUnfinishedNodeId: () => null,
    getMaxAttemptsForRound: () => 1,
    getPendingAutoRunTimerPlan: () => null,
    getRunningNodeIds: () => [],
    getState: async () => appState,
    getStopRequested: () => false,
    hasSavedNodeProgress: () => false,
    isStopError: () => false,
    launchAutoRunTimerPlan: async () => false,
    logAutoRunFinalSummary: async () => {},
    markCurrentRegistrationAccountRegistrationBlocked: async (state, options) => {
      blockedCalls.push({ state, options });
    },
    normalizeAutoRunFallbackThreadIntervalMinutes: () => 0,
    persistAutoRunTimerPlan: async () => {},
    replayPreviousSuccessfulAutoRunRoundLogSnapshot: async () => {},
    resetState: async () => {
      appState = {};
    },
    resolveAutoRunAccountRecordStatus: (status) => status,
    runAutoSequenceFromNode: async () => {
      capturedStates.push(JSON.parse(JSON.stringify(appState)));
      throw new Error('SIGNUP_USER_ALREADY_EXISTS::exists');
    },
    runtime: {
      get: () => runtimeState,
      set: (patch) => {
        runtimeState = { ...runtimeState, ...patch };
      },
    },
    saveAutoRunRoundLogSnapshot: async () => null,
    selectFailureAction: () => ({ code: 'fail_signup_user_already_exists' }),
    setState: async (patch) => {
      appState = { ...appState, ...patch };
    },
    sleepWithStop: async () => {},
    throwIfAutoRunSessionStopped: () => {},
    waitForRunningNodesToFinish: async () => appState,
    chrome: {
      runtime: {
        sendMessage: async () => {},
      },
    },
  });

  await runner.autoRunLoop(1);

  assert.equal(capturedStates.length, 1);
  assert.equal(capturedStates[0].selectedCustomEmailPoolEmail, 'first@example.com');
  assert.deepEqual(capturedStates[0].customEmailPool, ['first@example.com', 'second@example.com']);
  assert.equal(capturedStates[0].customEmailPoolEntries.length, 2);
  assert.equal(blockedCalls.length, 1);
  assert.equal(blockedCalls[0].state.selectedCustomEmailPoolEmail, 'first@example.com');
  assert.equal(blockedCalls[0].options.reasonCode, 'user_already_exists');
});

test('auto-run stops immediately when the custom email pool is exhausted', async () => {
  const logs = [];
  const phases = [];
  let attempts = 0;
  let runtimeState = {
    autoRunActive: false,
    autoRunCurrentRun: 0,
    autoRunTotalRuns: 0,
    autoRunAttemptRun: 0,
    autoRunSessionId: 0,
  };
  let appState = { autoRunFallbackThreadIntervalMinutes: 0 };
  const summaryBuilder = createAutoRunSummaryBuilder({
    addLog: async (message) => logs.push(message),
  });
  const runner = createAutoRunSessionRunner({
    ...summaryBuilder,
    addLog: async (message) => logs.push(message),
    appendAccountRunRecord: async () => ({}),
    AUTO_RUN_MAX_RETRIES_PER_ROUND: 3,
    AUTO_RUN_RETRY_DELAY_MS: 1,
    AUTO_RUN_TIMER_KIND_BEFORE_RETRY: 'before_retry',
    AUTO_RUN_TIMER_KIND_BETWEEN_ROUNDS: 'between_rounds',
    broadcastAutoRunStatus: async (phase) => phases.push(phase),
    broadcastStopToContentScripts: async () => {},
    cancelPendingCommands: () => {},
    clearStopRequest: () => {},
    createAutoRunRoundLogSnapshotMarker: () => ({}),
    createAutoRunSessionId: () => 456,
    ensureHotmailMailboxReadyForAutoRunRound: null,
    evaluateAttemptFailure: (options) => ({
      reason: options.error.message,
      blockedByCustomEmailPoolEmpty: true,
      canRetry: false,
      autoRunSkipFailures: true,
    }),
    getAutoRunRoundSnapshotReason: () => '',
    getAutoRunRoundSnapshotStatus: () => 'failed',
    getAutoRunStatusPayload: (phase, payload) => ({
      autoRunPhase: phase,
      autoRunCurrentRun: payload.currentRun,
      autoRunTotalRuns: payload.totalRuns,
      autoRunAttemptRun: payload.attemptRun,
      autoRunSessionId: payload.sessionId,
    }),
    getErrorMessage: (error) => error?.message || String(error || ''),
    getFirstUnfinishedNodeId: () => null,
    getMaxAttemptsForRound: () => 4,
    getPendingAutoRunTimerPlan: () => null,
    getRunningNodeIds: () => [],
    getState: async () => appState,
    getStopRequested: () => false,
    hasSavedNodeProgress: () => false,
    isStopError: () => false,
    launchAutoRunTimerPlan: async () => false,
    logAutoRunFinalSummary: async () => {},
    normalizeAutoRunFallbackThreadIntervalMinutes: () => 0,
    persistAutoRunTimerPlan: async () => {},
    replayPreviousSuccessfulAutoRunRoundLogSnapshot: async () => {},
    resetState: async () => {
      appState = {};
    },
    resolveAutoRunAccountRecordStatus: (status) => status,
    runAutoSequenceFromNode: async () => {
      attempts += 1;
      throw new Error('CUSTOM_EMAIL_POOL_EXHAUSTED::自定义邮箱池没有可用邮箱。');
    },
    runtime: {
      get: () => runtimeState,
      set: (patch) => {
        runtimeState = { ...runtimeState, ...patch };
      },
    },
    saveAutoRunRoundLogSnapshot: async () => null,
    selectFailureAction: () => ({
      code: 'fail_custom_email_pool_empty',
      shouldFailRound: true,
      shouldStop: true,
    }),
    setState: async (patch) => {
      appState = { ...appState, ...patch };
    },
    sleepWithStop: async () => {},
    throwIfAutoRunSessionStopped: () => {},
    waitForRunningNodesToFinish: async () => appState,
    chrome: {
      runtime: {
        sendMessage: async () => {},
      },
    },
  });

  await runner.autoRunLoop(3, { autoRunSkipFailures: true });

  assert.equal(attempts, 1);
  assert.equal(phases.includes('stopped'), true);
  assert.equal(logs.some((message) => message.includes('没有可用邮箱')), true);
});
