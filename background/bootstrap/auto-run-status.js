(function attachBackgroundAutoRunStatus(root, factory) {
  const moduleApi = factory();
  if (root) {
    root.MultiPageBackgroundAutoRunStatus = moduleApi;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = moduleApi;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createBackgroundAutoRunStatusModule() {
  const ACTIVE_PHASES = new Set([
    'scheduled',
    'running',
    'waiting_step',
    'waiting_email',
    'retrying',
    'waiting_interval',
  ]);
  const LOCKED_PHASES = new Set([
    'running',
    'waiting_step',
    'retrying',
    'waiting_interval',
  ]);
  const PAUSED_PHASE = 'waiting_email';
  const SCHEDULED_PHASE = 'scheduled';
  const DEFAULT_SCHEDULED_START_KIND = 'scheduled_start';

  function defaultNormalizeAutoRunSessionId(value) {
    return Math.max(0, Math.floor(Number(value) || 0));
  }

  function asObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }

  function normalizeTimestamp(value) {
    if (value === undefined || value === null) {
      return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  function createAutoRunStatusManager(deps = {}) {
    const getCurrentAutoRunRuntime = typeof deps.getCurrentAutoRunRuntime === 'function'
      ? deps.getCurrentAutoRunRuntime
      : () => ({});
    const normalizeAutoRunSessionId = typeof deps.normalizeAutoRunSessionId === 'function'
      ? deps.normalizeAutoRunSessionId
      : defaultNormalizeAutoRunSessionId;

    function getRuntime() {
      return asObject(getCurrentAutoRunRuntime());
    }

    function getAutoRunStatusPayload(phase, payload = {}) {
      const runtime = getRuntime();
      const source = asObject(payload);
      const scheduledAt = source.scheduledAt ?? source.scheduledAutoRunAt;
      const countdownAt = source.countdownAt ?? source.autoRunCountdownAt;
      const sessionId = source.sessionId
        ?? source.autoRunSessionId
        ?? runtime.sessionId
        ?? runtime.autoRunSessionId;

      return {
        autoRunning: ACTIVE_PHASES.has(phase),
        autoRunPhase: phase,
        autoRunCurrentRun: source.currentRun ?? runtime.currentRun ?? 0,
        autoRunTotalRuns: source.totalRuns ?? runtime.totalRuns ?? 1,
        autoRunAttemptRun: source.attemptRun ?? runtime.attemptRun ?? 0,
        autoRunSessionId: normalizeAutoRunSessionId(sessionId),
        scheduledAutoRunAt: normalizeTimestamp(scheduledAt),
        autoRunCountdownAt: normalizeTimestamp(countdownAt),
        autoRunCountdownTitle: source.countdownTitle === undefined ? '' : String(source.countdownTitle || ''),
        autoRunCountdownNote: source.countdownNote === undefined ? '' : String(source.countdownNote || ''),
      };
    }

    function isAutoRunLockedState(state = {}) {
      const source = asObject(state);
      return Boolean(source.autoRunning) && LOCKED_PHASES.has(source.autoRunPhase);
    }

    function isAutoRunPausedState(state = {}) {
      const source = asObject(state);
      return Boolean(source.autoRunning) && source.autoRunPhase === PAUSED_PHASE;
    }

    function getScheduledPlan(state, options = {}) {
      if (typeof options.getPendingAutoRunTimerPlan === 'function') {
        return options.getPendingAutoRunTimerPlan(state);
      }
      if (typeof deps.getPendingAutoRunTimerPlan === 'function') {
        return deps.getPendingAutoRunTimerPlan(state);
      }
      return state.autoRunTimerPlan || null;
    }

    function isAutoRunScheduledState(state = {}, options = {}) {
      const source = asObject(state);
      const scheduledAt = normalizeTimestamp(source.scheduledAutoRunAt);
      const scheduledStartKind = options.scheduledStartKind
        ?? options.kindScheduledStart
        ?? DEFAULT_SCHEDULED_START_KIND;
      const plan = asObject(getScheduledPlan(source, options));
      return Boolean(source.autoRunning)
        && source.autoRunPhase === SCHEDULED_PHASE
        && scheduledAt !== null
        && plan.kind === scheduledStartKind;
    }

    return {
      getAutoRunStatusPayload,
      isAutoRunLockedState,
      isAutoRunPausedState,
      isAutoRunScheduledState,
    };
  }

  return {
    createAutoRunStatusManager,
  };
});
