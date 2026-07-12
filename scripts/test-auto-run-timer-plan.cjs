const test = require('node:test');
const assert = require('node:assert/strict');

delete globalThis.MultiPageBackgroundAutoRunTimerPlan;
globalThis.self = globalThis;
require('../background/bootstrap/auto-run-timer-plan.js');

const manager = globalThis.MultiPageBackgroundAutoRunTimerPlan.createAutoRunTimerPlanManager({
  autoRunMaxRetriesPerRound: 3,
  kindBeforeRetry: 'before_retry',
  kindBetweenRounds: 'between_rounds',
  kindScheduledStart: 'scheduled_start',
  formatAutoRunScheduleTime: (timestamp) => String(timestamp || ''),
  normalizeAutoRunSessionId: (value) => Math.max(0, Math.floor(Number(value) || 0)),
  serializeAutoRunRoundSummaries: (_totalRuns, roundSummaries = []) => (
    Array.isArray(roundSummaries) ? roundSummaries : []
  ),
});

test('before-retry timer plans can resume the current attempt in continue mode', () => {
  const plan = manager.normalizeAutoRunTimerPlan({
    kind: 'before_retry',
    fireAt: Date.now() + 60000,
    totalRuns: 35,
    currentRun: 26,
    attemptRun: 1,
    autoRunSessionId: 123,
    mode: 'continue',
  });

  assert.equal(plan.mode, 'continue');
  assert.equal(plan.currentRun, 26);
  assert.equal(plan.attemptRun, 1);
});
