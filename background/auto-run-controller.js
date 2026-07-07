(function attachBackgroundAutoRunController(root, factory) {
  const api = factory();
  if (root) {
    root.MultiPageBackgroundAutoRunController = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createBackgroundAutoRunControllerModule() {
  function requireFactory(rootScope, globalName, factoryName) {
    const moduleApi = rootScope?.[globalName];
    const factory = moduleApi?.[factoryName];
    if (typeof factory !== 'function') {
      throw new Error(`${globalName}.${factoryName} 未加载。`);
    }
    return factory;
  }

  function createAutoRunController(deps = {}) {
    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    const createSummaryBuilder = requireFactory(
      rootScope,
      'MultiPageBackgroundAutoRunSummaryBuilder',
      'createAutoRunSummaryBuilder'
    );
    const createLogSnapshot = requireFactory(
      rootScope,
      'MultiPageBackgroundAutoRunLogSnapshot',
      'createAutoRunLogSnapshot'
    );
    const createRetryPolicy = requireFactory(
      rootScope,
      'MultiPageBackgroundAutoRunRetryPolicy',
      'createAutoRunRetryPolicy'
    );
    const createSessionRunner = requireFactory(
      rootScope,
      'MultiPageBackgroundAutoRunSessionRunner',
      'createAutoRunSessionRunner'
    );

    const summaryBuilder = createSummaryBuilder({
      addLog: deps.addLog,
    });
    const logSnapshot = createLogSnapshot({
      addLog: deps.addLog,
      chrome: deps.chrome,
      getErrorMessage: deps.getErrorMessage,
      getState: deps.getState,
    });
    const retryPolicy = createRetryPolicy({
      AUTO_RUN_MAX_RETRIES_PER_ROUND: deps.AUTO_RUN_MAX_RETRIES_PER_ROUND,
      getErrorMessage: deps.getErrorMessage,
      isCardHelperTaskEndedFailure: deps.isCardHelperTaskEndedFailure,
      isChatgptSessionReaderNonFreeTrialFailure: deps.isChatgptSessionReaderNonFreeTrialFailure,
      isCloudCheckoutAlreadyPaidFailure: deps.isCloudCheckoutAlreadyPaidFailure,
      isHostedCheckoutCardFallbackFailure: deps.isHostedCheckoutCardFallbackFailure,
      isHostedCheckoutGenericErrorFailure: deps.isHostedCheckoutGenericErrorFailure,
      isHostedCheckoutVerificationResendLimitFailure: deps.isHostedCheckoutVerificationResendLimitFailure,
      isRestartCurrentAttemptError: deps.isRestartCurrentAttemptError,
      isSignupUserAlreadyExistsFailure: deps.isSignupUserAlreadyExistsFailure,
      isStep4Route405RecoveryLimitFailure: deps.isStep4Route405RecoveryLimitFailure,
      isUpiRedeemBackendFailure: deps.isUpiRedeemBackendFailure,
      isUpiRedeemNetworkFailure: deps.isUpiRedeemNetworkFailure,
    });
    const sessionRunner = createSessionRunner({
      ...deps,
      ...summaryBuilder,
      ...logSnapshot,
      ...retryPolicy,
    });

    async function skipAutoRunCountdown() {
      const state = await deps.getState();
      const plan = deps.getPendingAutoRunTimerPlan(state);
      if (!plan || state.autoRunPhase !== 'waiting_interval') {
        return false;
      }

      return deps.launchAutoRunTimerPlan('manual', {
        expectedKinds: [
          deps.AUTO_RUN_TIMER_KIND_BETWEEN_ROUNDS,
          deps.AUTO_RUN_TIMER_KIND_BEFORE_RETRY,
        ],
      });
    }

    async function handleAutoRunLoopUnhandledError(error) {
      const currentRuntime = deps.runtime.get();
      console.error('Auto run loop crashed:', error);
      if (!deps.isStopError(error)) {
        await deps.addLog(`自动运行异常终止：${deps.getErrorMessage(error) || '未知错误'}`, 'error');
      }

      deps.runtime.set({ autoRunActive: false, autoRunSessionId: 0 });
      await deps.broadcastAutoRunStatus('stopped', {
        currentRun: currentRuntime.autoRunCurrentRun,
        totalRuns: currentRuntime.autoRunTotalRuns,
        attemptRun: currentRuntime.autoRunAttemptRun,
        sessionId: 0,
      }, {
        autoRunSessionId: 0,
        autoRunTimerPlan: null,
        scheduledAutoRunPlan: null,
      });
      if (!deps.isStopError(error)) {
        deps.clearStopRequest();
      }
    }

    function startAutoRunLoop(totalRuns, options = {}) {
      sessionRunner.autoRunLoop(totalRuns, options).catch((error) => {
        handleAutoRunLoopUnhandledError(error).catch(() => {});
      });
    }

    return {
      autoRunLoop: sessionRunner.autoRunLoop,
      buildAutoRunRoundSummaries: summaryBuilder.buildAutoRunRoundSummaries,
      createAutoRunRoundSummary: summaryBuilder.createAutoRunRoundSummary,
      formatAutoRunFailureReasons: summaryBuilder.formatAutoRunFailureReasons,
      getAutoRunRoundRetryCount: summaryBuilder.getAutoRunRoundRetryCount,
      handleAutoRunLoopUnhandledError,
      logAutoRunFinalSummary: summaryBuilder.logAutoRunFinalSummary,
      normalizeAutoRunRoundSummary: summaryBuilder.normalizeAutoRunRoundSummary,
      resolveAutoRunAccountRecordStatus: retryPolicy.resolveAutoRunAccountRecordStatus,
      serializeAutoRunRoundSummaries: summaryBuilder.serializeAutoRunRoundSummaries,
      skipAutoRunCountdown,
      startAutoRunLoop,
      waitBeforeAutoRunRetry: sessionRunner.waitBeforeAutoRunRetry,
      waitBetweenAutoRunRounds: sessionRunner.waitBetweenAutoRunRounds,
    };
  }

  return {
    createAutoRunController,
  };
});
