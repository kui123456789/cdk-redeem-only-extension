(function attachSidepanelAutoRunState(globalScope) {
  const PENDING_START_RUN_COUNT_TTL_MS = 30000;
  const ACTIVE_SYNC_PHASES = ['scheduled', 'running', 'waiting_step', 'waiting_email', 'retrying', 'waiting_interval'];
  const LOCKED_PHASES = ['running', 'waiting_step', 'retrying', 'waiting_interval'];

  function createDefaultAutoRunState() {
    return {
      autoRunning: false,
      phase: 'idle',
      currentRun: 0,
      totalRuns: 1,
      attemptRun: 0,
      scheduledAt: null,
      countdownAt: null,
      countdownTitle: '',
      countdownNote: '',
    };
  }

  function hasOwnStateValue(source, key) {
    return source && Object.prototype.hasOwnProperty.call(source, key);
  }

  function readAutoRunStateValue(source, keys, fallback) {
    for (const key of keys) {
      if (hasOwnStateValue(source, key)) {
        return source[key];
      }
    }
    return fallback;
  }

  function normalizePendingAutoRunStartRunCount(value) {
    const numeric = Math.floor(Number(value) || 0);
    return numeric > 0 ? numeric : 0;
  }

  function createAutoRunStateModel(options = {}) {
    const now = typeof options.now === 'function' ? options.now : () => Date.now();
    let state = {
      ...createDefaultAutoRunState(),
      ...(options.initialState || {}),
    };
    let pendingAutoRunStartTotalRuns = 0;
    let pendingAutoRunStartExpiresAt = 0;

    function getAutoRunState() {
      return { ...state };
    }

    function isAutoRunSourceSyncPhase(phase) {
      return ACTIVE_SYNC_PHASES.includes(phase);
    }

    function syncAutoRunState(source = {}) {
      const phase = readAutoRunStateValue(source, ['autoRunPhase', 'phase'], state.phase);
      const hasAutoRunning = hasOwnStateValue(source, 'autoRunning');
      const hasPhase = hasOwnStateValue(source, 'autoRunPhase') || hasOwnStateValue(source, 'phase');
      const autoRunning = hasAutoRunning
        ? Boolean(source.autoRunning)
        : (hasPhase ? isAutoRunSourceSyncPhase(phase) : state.autoRunning);

      state = {
        autoRunning,
        phase,
        currentRun: readAutoRunStateValue(source, ['autoRunCurrentRun', 'currentRun'], state.currentRun),
        totalRuns: readAutoRunStateValue(source, ['autoRunTotalRuns', 'totalRuns'], state.totalRuns),
        attemptRun: readAutoRunStateValue(source, ['autoRunAttemptRun', 'attemptRun'], state.attemptRun),
        scheduledAt: readAutoRunStateValue(source, ['scheduledAutoRunAt', 'scheduledAt'], state.scheduledAt),
        countdownAt: readAutoRunStateValue(source, ['autoRunCountdownAt', 'countdownAt'], state.countdownAt),
        countdownTitle: readAutoRunStateValue(source, ['autoRunCountdownTitle', 'countdownTitle'], state.countdownTitle),
        countdownNote: readAutoRunStateValue(source, ['autoRunCountdownNote', 'countdownNote'], state.countdownNote),
      };
      return getAutoRunState();
    }

    function registerPendingAutoRunStartRunCount(totalRuns) {
      pendingAutoRunStartTotalRuns = normalizePendingAutoRunStartRunCount(totalRuns);
      pendingAutoRunStartExpiresAt = pendingAutoRunStartTotalRuns > 0
        ? now() + PENDING_START_RUN_COUNT_TTL_MS
        : 0;
    }

    function clearPendingAutoRunStartRunCount() {
      pendingAutoRunStartTotalRuns = 0;
      pendingAutoRunStartExpiresAt = 0;
    }

    function getPendingAutoRunStartRunCount() {
      if (
        pendingAutoRunStartTotalRuns > 0
        && pendingAutoRunStartExpiresAt > 0
        && now() > pendingAutoRunStartExpiresAt
      ) {
        clearPendingAutoRunStartRunCount();
      }
      return pendingAutoRunStartTotalRuns;
    }

    function getAutoRunSourceTotalRuns(source = {}) {
      return normalizePendingAutoRunStartRunCount(
        readAutoRunStateValue(source, ['autoRunTotalRuns', 'totalRuns'], 0)
      );
    }

    function shouldSyncRunCountFromAutoRunSource(source = {}) {
      const phase = readAutoRunStateValue(source, ['autoRunPhase', 'phase'], state.phase);
      const autoRunning = hasOwnStateValue(source, 'autoRunning')
        ? Boolean(source.autoRunning)
        : isAutoRunSourceSyncPhase(phase);
      const shouldSync = autoRunning || isAutoRunSourceSyncPhase(phase);
      if (!shouldSync) {
        return false;
      }

      const pendingTotalRuns = getPendingAutoRunStartRunCount();
      if (pendingTotalRuns > 0) {
        const sourceTotalRuns = getAutoRunSourceTotalRuns(source);
        if (sourceTotalRuns > 0 && sourceTotalRuns !== pendingTotalRuns) {
          return false;
        }
        if (sourceTotalRuns === pendingTotalRuns) {
          clearPendingAutoRunStartRunCount();
        }
      }
      return true;
    }

    function isAutoRunLockedPhase() {
      return LOCKED_PHASES.includes(state.phase);
    }

    function isAutoRunPausedPhase() {
      return state.phase === 'waiting_email';
    }

    function isAutoRunWaitingStepPhase() {
      return state.phase === 'waiting_step';
    }

    function isAutoRunScheduledPhase() {
      return state.phase === 'scheduled';
    }

    function getAutoRunLabel(payload = state) {
      if ((payload.phase ?? state.phase) === 'scheduled') {
        return (payload.totalRuns || 1) > 1 ? ` (${payload.totalRuns}轮)` : '';
      }
      const attemptLabel = payload.attemptRun ? ` · 尝试${payload.attemptRun}` : '';
      if ((payload.totalRuns || 1) > 1) {
        return ` (${payload.currentRun}/${payload.totalRuns}${attemptLabel})`;
      }
      return attemptLabel ? ` (${attemptLabel.slice(3)})` : '';
    }

    return {
      clearPendingAutoRunStartRunCount,
      getAutoRunLabel,
      getAutoRunSourceTotalRuns,
      getAutoRunState,
      getPendingAutoRunStartRunCount,
      isAutoRunLockedPhase,
      isAutoRunPausedPhase,
      isAutoRunScheduledPhase,
      isAutoRunSourceSyncPhase,
      isAutoRunWaitingStepPhase,
      readAutoRunStateValue,
      normalizePendingAutoRunStartRunCount,
      registerPendingAutoRunStartRunCount,
      shouldSyncRunCountFromAutoRunSource,
      syncAutoRunState,
    };
  }

  const api = {
    createAutoRunStateModel,
    createDefaultAutoRunState,
    normalizePendingAutoRunStartRunCount,
    readAutoRunStateValue,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAutoRunState = api;
})(typeof window !== 'undefined' ? window : globalThis);
