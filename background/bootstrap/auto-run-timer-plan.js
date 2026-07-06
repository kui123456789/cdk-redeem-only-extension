(function attachBackgroundAutoRunTimerPlan(globalScope) {
  function createAutoRunTimerPlanManager(deps = {}) {
    const {
      autoRunMaxRetriesPerRound = 3,
      kindBeforeRetry = 'before_retry',
      kindBetweenRounds = 'between_rounds',
      kindScheduledStart = 'scheduled_start',
      formatAutoRunScheduleTime = (timestamp) => String(timestamp || ''),
      normalizeAutoRunSessionId = (value) => Math.max(0, Math.floor(Number(value) || 0)),
      serializeAutoRunRoundSummaries = (_totalRuns, roundSummaries = []) => (
        Array.isArray(roundSummaries) ? roundSummaries : []
      ),
    } = deps;

    function normalizeRunCount(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return 1;
      }
      return Math.max(1, Math.floor(numeric));
    }

    function normalizeAutoRunTimerKind(value = '') {
      const normalized = String(value || '').trim().toLowerCase();
      if (normalized === kindScheduledStart) {
        return kindScheduledStart;
      }
      if (normalized === kindBetweenRounds) {
        return kindBetweenRounds;
      }
      if (normalized === kindBeforeRetry) {
        return kindBeforeRetry;
      }
      return '';
    }

    function normalizeAutoRunTimerPlan(plan) {
      if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
        return null;
      }

      const kind = normalizeAutoRunTimerKind(plan.kind);
      if (!kind) {
        return null;
      }

      const fireAt = Number(plan.fireAt);
      if (!Number.isFinite(fireAt)) {
        return null;
      }

      const totalRuns = normalizeRunCount(plan.totalRuns);
      const autoRunSkipFailures = true;
      const autoRunRetryNonFreeTrial = Boolean(plan.autoRunRetryNonFreeTrial);
      const autoRunRetryLegacyWalletCallback = Boolean(plan.autoRunRetryLegacyWalletCallback);
      const autoRunRetryShortLinkError = plan.autoRunRetryShortLinkError !== undefined
        ? Boolean(plan.autoRunRetryShortLinkError)
        : true;
      const mode = plan.mode === 'continue' ? 'continue' : 'restart';
      const currentRun = Math.max(0, Math.min(totalRuns, Math.floor(Number(plan.currentRun) || 0)));
      const attemptRun = Math.max(
        0,
        Math.min(autoRunMaxRetriesPerRound + 1, Math.floor(Number(plan.attemptRun) || 0))
      );
      const autoRunSessionId = normalizeAutoRunSessionId(plan.autoRunSessionId ?? plan.sessionId);
      const roundSummaries = serializeAutoRunRoundSummaries(totalRuns, plan.roundSummaries);
      const countdownTitle = String(plan.countdownTitle || '').trim();
      const countdownNote = String(plan.countdownNote || '').trim();

      if (kind === kindScheduledStart) {
        return {
          kind,
          fireAt,
          totalRuns,
          autoRunSkipFailures,
          autoRunRetryNonFreeTrial,
          autoRunRetryLegacyWalletCallback,
          autoRunRetryShortLinkError,
          mode,
          currentRun: 0,
          attemptRun: 0,
          autoRunSessionId,
          roundSummaries: [],
          countdownTitle: countdownTitle || '已计划自动运行',
          countdownNote: countdownNote || `计划于 ${formatAutoRunScheduleTime(fireAt)} 开始`,
        };
      }

      if (kind === kindBetweenRounds) {
        const normalizedCurrentRun = Math.max(1, Math.min(totalRuns, currentRun));
        const normalizedAttemptRun = Math.max(1, attemptRun);
        return {
          kind,
          fireAt,
          totalRuns,
          autoRunSkipFailures,
          autoRunRetryNonFreeTrial,
          autoRunRetryLegacyWalletCallback,
          autoRunRetryShortLinkError,
          mode: 'restart',
          currentRun: normalizedCurrentRun,
          attemptRun: normalizedAttemptRun,
          autoRunSessionId,
          roundSummaries,
          countdownTitle: countdownTitle || '线程间隔中',
          countdownNote: countdownNote || `第 ${Math.min(normalizedCurrentRun + 1, totalRuns)}/${totalRuns} 轮即将开始`,
        };
      }

      const normalizedCurrentRun = Math.max(1, Math.min(totalRuns, currentRun));
      const normalizedAttemptRun = Math.max(1, attemptRun);
      return {
        kind,
        fireAt,
        totalRuns,
        autoRunSkipFailures,
        autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback,
        autoRunRetryShortLinkError,
        mode: 'restart',
        currentRun: normalizedCurrentRun,
        attemptRun: normalizedAttemptRun,
        autoRunSessionId,
        roundSummaries,
        countdownTitle: countdownTitle || '线程间隔中',
        countdownNote: countdownNote || `第 ${normalizedCurrentRun}/${totalRuns} 轮第 ${normalizedAttemptRun} 次尝试即将开始`,
      };
    }

    function normalizeAutoRunTimerPlanFromState(state = {}) {
      const directPlan = normalizeAutoRunTimerPlan(state.autoRunTimerPlan);
      if (directPlan) {
        return directPlan;
      }

      if (state.autoRunPhase !== 'scheduled') {
        return null;
      }

      const legacyScheduledAt = Number(state.scheduledAutoRunAt);
      if (!Number.isFinite(legacyScheduledAt)) {
        return null;
      }

      return normalizeAutoRunTimerPlan({
        kind: kindScheduledStart,
        fireAt: legacyScheduledAt,
        totalRuns: state.scheduledAutoRunPlan?.totalRuns ?? state.autoRunTotalRuns,
        autoRunSkipFailures: true,
        autoRunRetryNonFreeTrial: state.scheduledAutoRunPlan?.autoRunRetryNonFreeTrial ?? state.autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback: state.scheduledAutoRunPlan?.autoRunRetryLegacyWalletCallback
          ?? state.autoRunRetryLegacyWalletCallback,
        autoRunRetryShortLinkError: state.scheduledAutoRunPlan?.autoRunRetryShortLinkError
          ?? state.autoRunRetryShortLinkError,
        autoRunSessionId: state.autoRunSessionId,
        mode: state.scheduledAutoRunPlan?.mode,
      });
    }

    function getAutoRunTimerPlanPhase(kind = '') {
      return kind === kindScheduledStart ? 'scheduled' : 'waiting_interval';
    }

    function getAutoRunTimerStatusPayload(plan) {
      const normalizedPlan = normalizeAutoRunTimerPlan(plan);
      if (!normalizedPlan) {
        return null;
      }

      const phase = getAutoRunTimerPlanPhase(normalizedPlan.kind);
      return {
        phase,
        currentRun: normalizedPlan.currentRun,
        totalRuns: normalizedPlan.totalRuns,
        attemptRun: normalizedPlan.attemptRun,
        sessionId: normalizedPlan.autoRunSessionId,
        scheduledAt: phase === 'scheduled' ? normalizedPlan.fireAt : null,
        countdownAt: normalizedPlan.fireAt,
        countdownTitle: normalizedPlan.countdownTitle,
        countdownNote: normalizedPlan.countdownNote,
      };
    }

    return {
      getAutoRunTimerPlanPhase,
      getAutoRunTimerStatusPayload,
      normalizeAutoRunTimerKind,
      normalizeAutoRunTimerPlan,
      normalizeAutoRunTimerPlanFromState,
      normalizeRunCount,
    };
  }

  globalScope.MultiPageBackgroundAutoRunTimerPlan = {
    createAutoRunTimerPlanManager,
  };
})(self);
