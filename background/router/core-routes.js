(function attachRouterCoreRoutes(root, factory) {
  const api = factory();
  root.MultiPageRouterCoreRoutes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createRouterCoreRoutesModule() {
  function getRootScope() {
    return typeof self !== 'undefined' ? self : globalThis;
  }

  function createRouterCoreRoutes(deps = {}) {
    const {
      addLog,
      broadcastDataUpdate,
      buildLuckmailSessionSettingsPayload,
      buildPersistentSettingsPayload,
      cancelScheduledAutoRun,
      checkIcloudSession,
      clearAccountRunHistory,
      deleteAccountRunHistoryRecords,
      clearAutoRunTimerAlarm,
      clearStopRequest,
      deleteIcloudAlias,
      deleteUsedIcloudAliases,
      checkUpiCredentialMembershipBatch = null,
      checkUpiCredentialMembershipOne = null,
      checkUpiCredentialMembershipTrialEligibility = null,
      fillUpiCredentialMembershipFreeAccessTokens = null,
      exportSettingsBundle,
      fetchGeneratedEmail,
      cancelUpiRedeemCdkeyJobs = null,
      refreshUpiRedeemCdkeyStatusesAndSync,
      retryUpiRedeemCdkeyJobs = null,
      getPendingAutoRunTimerPlan,
      getState,
      getNodeIdsForState,
      getStepIdsForState,
      getStepKeyForState,
      handleAutoRunLoopUnhandledError,
      importSettingsBundle,
      invalidateDownstreamAfterStepRestart,
      isAutoRunLockedState,
      launchAutoRunTimerPlan,
      listIcloudAliases,
      lockAutomationWindowFromMessage,
      ensureManualInteractionAllowed,
      ensureManualStepPrerequisites,
      executeNodeForManualChain,
      findStepByNodeId,
      getNextNodeIdForState,
      normalizeHotmailAccounts,
      normalizeRunCount,
      AUTO_RUN_TIMER_KIND_SCHEDULED_START,
      resolveSignupMethod,
      resetState,
      resumeAutoRun,
      scheduleAutoRun,
      setContributionMode,
      setEmailState,
      setEmailStateSilently,
      setIcloudAliasPreservedState,
      setIcloudAliasUsedState,
      setPersistentSettings,
      setState,
      shouldAutoContinueManualNode,
      skipAutoRunCountdown,
      startAutoRunLoop,
      syncUpiCredentialMembershipResultsAfterCdkeyRefresh,
      validateAutoRunStart,
      validateModeSwitch,
    } = deps;

    function normalizeString(value = '') {
      return String(value || '').trim();
    }

    async function handleResetRoute() {
      clearStopRequest();
      await clearAutoRunTimerAlarm();
      await resetState();
      await addLog('流程已重置', 'info');
      return { ok: true };
    }

    async function handleExecuteNodeRoute(_payload, message, sender) {
      clearStopRequest();
      const requestState = await getState();
      const nodeId = String(message.nodeId || message.payload?.nodeId || '').trim();
      const resolvedStep = findStepByNodeId(nodeId, requestState);
      if (!nodeId || !resolvedStep) {
        throw new Error('EXECUTE_NODE 缺少 nodeId。');
      }
      if (message.source === 'sidepanel') {
        await lockAutomationWindowFromMessage(message, sender);
        await ensureManualInteractionAllowed('手动执行节点');
      }
      if (message.source === 'sidepanel') {
        await ensureManualStepPrerequisites(resolvedStep, nodeId, requestState);
      }
      if (message.source === 'sidepanel') {
        await invalidateDownstreamAfterStepRestart(resolvedStep, { logLabel: `节点 ${nodeId} 重新执行` });
      }
      if (nodeId === 'chatgpt-session-reader-create') {
        await setState({
          legacyWalletGenericErrorRecoveryCount: 0,
          legacyWalletApprovalBranchRecoveryCount: 0,
        });
      }
      if (message.payload.email) {
        await setEmailState(message.payload.email);
      }
      if (message.payload.emailPrefix !== undefined) {
        await setPersistentSettings({ emailPrefix: message.payload.emailPrefix });
        await setState({ emailPrefix: message.payload.emailPrefix });
      }
      const manualEnableTotpUseCurrentSession = message.source === 'sidepanel' && nodeId === 'enable-totp-mfa';
      const manualEnablePasskeyUseCurrentSession = message.source === 'sidepanel' && nodeId === 'enable-passkey';
      if (manualEnableTotpUseCurrentSession || manualEnablePasskeyUseCurrentSession) {
        await setState({
          manualEnableTotpUseCurrentSession: manualEnableTotpUseCurrentSession ? true : null,
          manualEnablePasskeyUseCurrentSession: manualEnablePasskeyUseCurrentSession ? true : null,
        });
      }
      try {
        await executeNodeForManualChain(nodeId);

        const latestExecutionState = await getState();
        if (message.source === 'sidepanel' && shouldAutoContinueManualNode(nodeId, latestExecutionState)) {
          const nextNodeId = getNextNodeIdForState(nodeId, latestExecutionState);
          if (nextNodeId) {
            await addLog(
              `步骤 ${resolvedStep} 已完成，正在继续执行下一节点 ${nextNodeId}。`,
              'info',
              { step: resolvedStep, nodeId }
            );
            await executeNodeForManualChain(nextNodeId);
          }
        }
      } finally {
        if (manualEnableTotpUseCurrentSession || manualEnablePasskeyUseCurrentSession) {
          await setState({
            manualEnableTotpUseCurrentSession: null,
            manualEnablePasskeyUseCurrentSession: null,
          });
        }
      }
      return { ok: true };
    }

    async function applyContributionMode(message) {
      if (Boolean(message.payload?.contributionMode) && typeof setContributionMode === 'function') {
        await setContributionMode(true);
        if (typeof setState === 'function') {
          const contributionNickname = String(message.payload?.contributionNickname || '').trim();
          const contributionQq = String(message.payload?.contributionQq || '').trim();
          await setState({
            contributionNickname,
            contributionQq,
          });
        }
      }
    }

    async function handleAutoRunRoute(_payload, message, sender) {
      clearStopRequest();
      if (message.source === 'sidepanel') {
        await lockAutomationWindowFromMessage(message, sender);
      }
      await applyContributionMode(message);
      const state = await getState();
      const totalRuns = normalizeRunCount(message.payload?.totalRuns || 1);
      const autoRunStartValidation = validateAutoRunStart(state, { state, totalRuns });
      if (autoRunStartValidation?.ok === false) {
        throw new Error(autoRunStartValidation.errors?.[0]?.message || '当前设置不支持启动自动流程。');
      }
      if (getPendingAutoRunTimerPlan(state)) {
        throw new Error('已有自动运行倒计时计划，请先取消或立即开始。');
      }
      const autoRunSkipFailures = true;
      const autoRunRetryNonFreeTrial = Boolean(message.payload?.autoRunRetryNonFreeTrial);
      const autoRunRetryLegacyWalletCallback = Boolean(message.payload?.autoRunRetryLegacyWalletCallback);
      const mode = message.payload?.mode === 'continue' ? 'continue' : 'restart';
      await setState({ autoRunSkipFailures, autoRunRetryNonFreeTrial, autoRunRetryLegacyWalletCallback });
      startAutoRunLoop(totalRuns, { autoRunSkipFailures, autoRunRetryNonFreeTrial, autoRunRetryLegacyWalletCallback, mode });
      return { ok: true };
    }

    async function handleScheduleAutoRunRoute(_payload, message, sender) {
      clearStopRequest();
      if (message.source === 'sidepanel') {
        await lockAutomationWindowFromMessage(message, sender);
      }
      await applyContributionMode(message);
      const state = await getState();
      const totalRuns = normalizeRunCount(message.payload?.totalRuns || 1);
      const autoRunStartValidation = validateAutoRunStart(state, { state, totalRuns });
      if (autoRunStartValidation?.ok === false) {
        throw new Error(autoRunStartValidation.errors?.[0]?.message || '当前设置不支持启动自动流程。');
      }
      return await scheduleAutoRun(totalRuns, {
        delayMinutes: message.payload?.delayMinutes,
        autoRunSkipFailures: true,
        autoRunRetryNonFreeTrial: Boolean(message.payload?.autoRunRetryNonFreeTrial),
        autoRunRetryLegacyWalletCallback: Boolean(message.payload?.autoRunRetryLegacyWalletCallback),
        mode: message.payload?.mode,
      });
    }

    async function handleStartScheduledAutoRunNowRoute(_payload, message, sender) {
      clearStopRequest();
      if (message.source === 'sidepanel') {
        await lockAutomationWindowFromMessage(message, sender);
      }
      const started = await launchAutoRunTimerPlan('manual', {
        expectedKinds: [AUTO_RUN_TIMER_KIND_SCHEDULED_START],
      });
      if (!started) {
        throw new Error('当前没有可立即开始的倒计时计划。');
      }
      return { ok: true };
    }

    async function handleCancelScheduledAutoRunRoute() {
      const cancelled = await cancelScheduledAutoRun();
      if (!cancelled) {
        throw new Error('当前没有可取消的倒计时计划。');
      }
      return { ok: true };
    }

    async function handleSkipAutoRunCountdownRoute(_payload, message, sender) {
      clearStopRequest();
      if (message.source === 'sidepanel') {
        await lockAutomationWindowFromMessage(message, sender);
      }
      const skipped = await skipAutoRunCountdown();
      if (!skipped) {
        throw new Error('当前没有可立即开始的倒计时。');
      }
      return { ok: true };
    }

    async function handleResumeAutoRunRoute(_payload, message, sender) {
      clearStopRequest();
      if (message.source === 'sidepanel') {
        await lockAutomationWindowFromMessage(message, sender);
      }
      if (message.payload.email) {
        await setEmailState(message.payload.email);
      }
      resumeAutoRun().catch((error) => {
        handleAutoRunLoopUnhandledError(error).catch(() => {});
      });
      return { ok: true };
    }

    async function handleCheckMembershipBatchRoute(_payload, message) {
      clearStopRequest();
      const state = await getState();
      if (isAutoRunLockedState(state)) {
        throw new Error('自动流程运行中，当前不能核验 UPI 备份账号会员。');
      }
      if (typeof checkUpiCredentialMembershipBatch !== 'function') {
        throw new Error('UPI 备份账号会员核验能力尚未接入。');
      }
      const result = await checkUpiCredentialMembershipBatch(message.payload || {});
      return { ok: true, results: result };
    }

    async function handleCheckMembershipOneRoute(_payload, message) {
      clearStopRequest();
      const state = await getState();
      if (isAutoRunLockedState(state)) {
        throw new Error('自动流程运行中，当前不能检测 UPI 备份账号会员。');
      }
      if (typeof checkUpiCredentialMembershipOne !== 'function') {
        throw new Error('UPI 单账号会员检测能力尚未接入。');
      }
      const result = await checkUpiCredentialMembershipOne(message.payload || {});
      return { ok: true, ...result };
    }

    async function handleCheckMembershipTrialEligibilityRoute(_payload, message) {
      clearStopRequest();
      const payload = message.payload || {};
      const allowAutoRunEmailPoolCheck = payload.source === 'custom-email-pool-trial-eligibility-check'
        && Array.isArray(payload.credentials)
        && payload.credentials.length > 0
        && payload.credentials.every((credential) => String(
          credential?.accessToken
          || credential?.token
          || credential?.access_token
          || credential?.upiRedeemAccessToken
          || ''
        ).trim());
      const state = await getState();
      if (isAutoRunLockedState(state) && !allowAutoRunEmailPoolCheck) {
        throw new Error('自动流程运行中，当前不能手动检查 UPI Free 分组试用资格。');
      }
      if (typeof checkUpiCredentialMembershipTrialEligibility !== 'function') {
        throw new Error('UPI Free 分组试用资格手动检查能力尚未接入。');
      }
      const result = await checkUpiCredentialMembershipTrialEligibility({
        ...payload,
        source: payload.source
          || (message.type === 'CHECK_UPI_CREDENTIAL_MEMBERSHIP_TRIAL_ELIGIBILITY_BATCH'
            ? 'manual-trial-eligibility-batch'
            : 'manual-trial-eligibility-check'),
      });
      return { ok: true, ...result };
    }

    async function handleFillMembershipFreeAccessTokensRoute(_payload, message) {
      clearStopRequest();
      const state = await getState();
      if (isAutoRunLockedState(state)) {
        throw new Error('自动流程运行中，当前不能补充 UPI Free 分组 AT。');
      }
      if (typeof fillUpiCredentialMembershipFreeAccessTokens !== 'function') {
        throw new Error('UPI Free 分组 AT 补充能力尚未接入。');
      }
      const result = await fillUpiCredentialMembershipFreeAccessTokens(message.payload || {});
      return { ok: true, ...result };
    }

    async function handleRefreshCdkeyStatusesRoute(_payload, message) {
      const state = await getState();
      const payload = message.payload || {};
      return await refreshUpiRedeemCdkeyStatusesAndSync(payload, { state });
    }

    async function handleUpdateCdkeyJobsRoute(_payload, message) {
      const state = await getState();
      const isCancel = message.type === 'CANCEL_UPI_REDEEM_CDKEY_JOBS';
      if (isAutoRunLockedState(state) && !isCancel) {
        throw new Error('自动流程运行中，当前不能手动重试 CDK 任务。');
      }
      const operator = isCancel ? cancelUpiRedeemCdkeyJobs : retryUpiRedeemCdkeyJobs;
      if (typeof operator !== 'function') {
        throw new Error(isCancel ? 'CDK 任务取消能力尚未接入。' : 'CDK 任务重试能力尚未接入。');
      }
      const payload = message.payload || {};
      const result = await operator({
        ...state,
        ...payload,
      });
      if (result?.updates) {
        broadcastDataUpdate(result.updates);
      }
      const membershipSync = await syncUpiCredentialMembershipResultsAfterCdkeyRefresh(result, {
        ...state,
        ...payload,
      });
      const updates = {
        ...(result?.updates || {}),
        ...(membershipSync?.updates || {}),
      };
      if (Object.keys(membershipSync?.updates || {}).length) {
        broadcastDataUpdate(membershipSync.updates);
      }
      return { ok: true, ...result, updates, membershipSync };
    }

    const rootScope = getRootScope();
    const routeHandlers = {
      ...(rootScope.MultiPageMembershipRoutes?.createMembershipRoutes?.({
        checkBatch: handleCheckMembershipBatchRoute,
        checkOne: handleCheckMembershipOneRoute,
        checkTrialEligibility: handleCheckMembershipTrialEligibilityRoute,
        fillFreeAccessTokens: handleFillMembershipFreeAccessTokensRoute,
      }) || {}),
      ...(rootScope.MultiPageCdkeyRoutes?.createCdkeyRoutes?.({
        refreshStatuses: handleRefreshCdkeyStatusesRoute,
        updateJobs: handleUpdateCdkeyJobsRoute,
      }) || {}),
      ...(rootScope.MultiPageWorkflowRoutes?.createWorkflowRoutes?.({
        autoRun: handleAutoRunRoute,
        cancelScheduledAutoRun: handleCancelScheduledAutoRunRoute,
        executeNode: handleExecuteNodeRoute,
        reset: handleResetRoute,
        resumeAutoRun: handleResumeAutoRunRoute,
        scheduleAutoRun: handleScheduleAutoRunRoute,
        skipAutoRunCountdown: handleSkipAutoRunCountdownRoute,
        startScheduledAutoRunNow: handleStartScheduledAutoRunNowRoute,
      }) || {}),
      ...(rootScope.MultiPageSettingsRoutes?.createSettingsRoutes?.({
        addLog,
        broadcastDataUpdate,
        buildLuckmailSessionSettingsPayload,
        buildPersistentSettingsPayload,
        exportSettingsBundle,
        getNodeIdsForState,
        getState,
        getStepIdsForState,
        getStepKeyForState,
        importSettingsBundle,
        normalizeHotmailAccounts,
        resolveSignupMethod,
        setContributionMode,
        setPersistentSettings,
        setState,
        validateModeSwitch,
      }) || {}),
      ...(rootScope.MultiPageAccountRecordRoutes?.createAccountRecordRoutes?.({
        clearAccountRunHistory,
        deleteAccountRunHistoryRecords,
        getState,
        isAutoRunLockedState,
      }) || {}),
      ...(rootScope.MultiPageEmailPoolRoutes?.createEmailPoolRoutes?.({
        checkIcloudSession,
        clearStopRequest,
        deleteIcloudAlias,
        deleteUsedIcloudAliases,
        fetchGeneratedEmail,
        getState,
        isAutoRunLockedState,
        listIcloudAliases,
        resumeAutoRun,
        setEmailState,
        setEmailStateSilently,
        setIcloudAliasPreservedState,
        setIcloudAliasUsedState,
      }) || {}),
    };

    return {
      normalizeString,
      routeHandlers,
    };
  }

  return {
    createRouterCoreRoutes,
  };
});
