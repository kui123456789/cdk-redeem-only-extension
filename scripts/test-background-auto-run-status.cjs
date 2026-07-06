const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.MultiPageBackgroundAutoRunStatus;
const statusModule = require('../background/bootstrap/auto-run-status.js');

function createStatusManager(runtime = {}) {
  return statusModule.createAutoRunStatusManager({
    getCurrentAutoRunRuntime: () => runtime,
    normalizeAutoRunSessionId: (value) => Math.max(0, Math.floor(Number(value) || 0)),
  });
}

test('running payload uses current auto-run runtime defaults', () => {
  const manager = statusModule.createAutoRunStatusManager({
    getCurrentAutoRunRuntime: () => ({
      currentRun: 2,
      totalRuns: 5,
      attemptRun: 1,
      sessionId: 88,
    }),
    normalizeAutoRunSessionId: (value) => Math.max(0, Math.floor(Number(value) || 0)),
  });

  assert.deepEqual(manager.getAutoRunStatusPayload('running'), {
    autoRunning: true,
    autoRunPhase: 'running',
    autoRunCurrentRun: 2,
    autoRunTotalRuns: 5,
    autoRunAttemptRun: 1,
    autoRunSessionId: 88,
    scheduledAutoRunAt: null,
    autoRunCountdownAt: null,
    autoRunCountdownTitle: '',
    autoRunCountdownNote: '',
  });
});

test('scheduled payload normalizes timer fields and session id', () => {
  const manager = createStatusManager();

  assert.deepEqual(manager.getAutoRunStatusPayload('scheduled', {
    currentRun: 0,
    totalRuns: 3,
    attemptRun: 0,
    sessionId: '42',
    scheduledAt: '1000',
    countdownAt: '2000',
    countdownTitle: '标题',
    countdownNote: '说明',
  }), {
    autoRunning: true,
    autoRunPhase: 'scheduled',
    autoRunCurrentRun: 0,
    autoRunTotalRuns: 3,
    autoRunAttemptRun: 0,
    autoRunSessionId: 42,
    scheduledAutoRunAt: 1000,
    autoRunCountdownAt: 2000,
    autoRunCountdownTitle: '标题',
    autoRunCountdownNote: '说明',
  });
});

test('phase predicates classify locked paused and scheduled states', () => {
  const manager = createStatusManager();

  for (const phase of ['running', 'waiting_step', 'retrying', 'waiting_interval']) {
    assert.equal(manager.isAutoRunLockedState({ autoRunning: true, autoRunPhase: phase }), true);
  }
  assert.equal(manager.isAutoRunLockedState({ autoRunning: true, autoRunPhase: 'scheduled' }), false);
  assert.equal(manager.isAutoRunPausedState({ autoRunning: true, autoRunPhase: 'waiting_email' }), true);
  assert.equal(manager.isAutoRunPausedState({ autoRunning: true, autoRunPhase: 'running' }), false);
  assert.equal(manager.isAutoRunScheduledState({
    autoRunning: true,
    autoRunPhase: 'scheduled',
    scheduledAutoRunAt: '1000',
  }, {
    getPendingAutoRunTimerPlan: () => ({ kind: 'scheduled_start' }),
    scheduledStartKind: 'scheduled_start',
  }), true);
});
