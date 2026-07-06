const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.SidepanelAutoRunState;
const autoRunState = require('../sidepanel/auto-run-state.js');

test('syncAutoRunState maps background aliases and phase predicates', () => {
  const model = autoRunState.createAutoRunStateModel();

  const state = model.syncAutoRunState({
    autoRunning: true,
    autoRunPhase: 'waiting_step',
    autoRunCurrentRun: 2,
    autoRunTotalRuns: 5,
    autoRunAttemptRun: 3,
    scheduledAutoRunAt: 2000,
    autoRunCountdownAt: 3000,
    autoRunCountdownTitle: '标题',
    autoRunCountdownNote: '说明',
  });

  assert.deepEqual(state, {
    autoRunning: true,
    phase: 'waiting_step',
    currentRun: 2,
    totalRuns: 5,
    attemptRun: 3,
    scheduledAt: 2000,
    countdownAt: 3000,
    countdownTitle: '标题',
    countdownNote: '说明',
  });
  assert.equal(model.isAutoRunLockedPhase(), true);
  assert.equal(model.isAutoRunWaitingStepPhase(), true);
});

test('pending start run count gates source run-count sync until matching value arrives', () => {
  const model = autoRunState.createAutoRunStateModel();

  model.registerPendingAutoRunStartRunCount(10);

  assert.equal(
    model.shouldSyncRunCountFromAutoRunSource({ autoRunning: true, autoRunTotalRuns: 2 }),
    false
  );
  assert.equal(
    model.shouldSyncRunCountFromAutoRunSource({ autoRunning: true, autoRunTotalRuns: 10 }),
    true
  );
  assert.equal(model.getPendingAutoRunStartRunCount(), 0);
});

test('getAutoRunLabel formats scheduled, running, and single-run attempts', () => {
  const model = autoRunState.createAutoRunStateModel();

  assert.equal(model.getAutoRunLabel({ phase: 'scheduled', totalRuns: 3 }), ' (3轮)');
  assert.equal(
    model.getAutoRunLabel({ phase: 'running', currentRun: 2, totalRuns: 5, attemptRun: 3 }),
    ' (2/5 · 尝试3)'
  );
  assert.equal(
    model.getAutoRunLabel({ phase: 'running', currentRun: 1, totalRuns: 1, attemptRun: 2 }),
    ' (尝试2)'
  );
});
