(function attachBackgroundMessageRouter(root, factory) {
  root.MultiPageBackgroundMessageRouter = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createBackgroundMessageRouterModule() {
  function createMessageRouter(deps = {}) {
    const {
      addLog,
      appendAccountRunRecord,
      batchUpdateLuckmailPurchases,
      buildLocalhostCleanupPrefix,
      buildLuckmailSessionSettingsPayload,
      buildPersistentSettingsPayload,
      broadcastDataUpdate,
      cancelScheduledAutoRun,
      checkIcloudSession,
      clearAccountRunHistory,
      deleteAccountRunHistoryRecords,
      clearAutoRunTimerAlarm,
      clearLuckmailRuntimeState,
      clearStopRequest,
      closeLocalhostCallbackTabs,
      closeTabsByUrlPrefix,
      completeNodeFromBackground,
      deleteHotmailAccount,
      deleteHotmailAccounts,
      deleteIcloudAlias,
      deleteUsedIcloudAliases,
      disableUsedLuckmailPurchases,
      doesNodeUseCompletionSignal,
      ensureMail2925MailboxSession,
      ensureManualInteractionAllowed,
      executeNode,
      executeNodeViaCompletionSignal,
      exportCurrentSessionJson,
      exportUpiAccountCredentialBackupTextFile = null,
      checkUpiCredentialMembershipBatch = null,
      checkUpiCredentialMembershipOne = null,
      checkUpiCredentialMembershipTrialEligibility = null,
      deleteUpiCredentialMembershipCredentials = null,
      deleteUpiCredentialMembershipCheckResults = null,
      exportUpiCredentialMembershipCheckResults = null,
      fillUpiCredentialMembershipFreeAccessTokens = null,
      getUpiCredentialMembershipCredentialPool = null,
      getUpiCredentialMembershipCheckResults = null,
      identifyUpiCredentialMembershipFreePlus = null,
      importUpiCredentialMembershipFreeResults = null,
      loginUpiCredentialMembershipAccount = null,
      moveUpiCredentialMembershipAccountGroup = null,
      pruneIneligibleFreeUpiCredentialMembership = null,
      redeemUpiCredentialMembershipFree = null,
      retryFailedUpiRedeemCdkey = null,
      stopUpiCredentialMembershipCheck = null,
      stopUpiCredentialMembershipRedeem = null,
      verifyUpiCredentialMembershipPlus = null,
      exportSettingsBundle,
      ensureContentScriptReadyOnTabUntilStopped = null,
      fetchHostedCheckoutVerificationCodeManually = null,
      testCheckoutConversionProxy = null,
      fetchGeneratedEmail,
      refreshCardHelperCardBalance,
      cancelUpiRedeemCdkeyJobs = null,
      refreshUpiRedeemCdkeyStatuses = null,
      retryUpiRedeemCdkeyJobs = null,
      checkUpiRedeemSubscriptionStatuses = null,
      refreshOAuthTimeoutWindowAfterCheckoutSuccess = null,
      finalizeStep3Completion,
      finalizeIcloudAliasAfterSuccessfulFlow,
      findHotmailAccount,
      findLegacyWalletAccount,
      flushCommand,
      getCurrentLuckmailPurchase,
      getCurrentLegacyWalletAccount,
      getCurrentMail2925Account,
      getPendingAutoRunTimerPlan,
      getSourceLabel,
      getState,
      getNodeDefinitionForState,
      getNodeIdsForState,
      getStepIdByNodeIdForState,
      getStepDefinitionForState,
      getStepIdsForState,
      getLastStepIdForState,
      resolveSignupMethod = (state = {}) => {
        const rootScope = typeof self !== 'undefined' ? self : globalThis;
        const capabilityRegistry = rootScope.MultiPageFlowCapabilities?.createFlowCapabilityRegistry?.({
          defaultFlowId: 'openai',
        }) || null;
        if (capabilityRegistry?.resolveSignupMethod) {
          return capabilityRegistry.resolveSignupMethod(state, 'email');
        }
        return 'email';
      },
      validateAutoRunStart = (state = {}, options = {}) => {
        const validationState = options?.state || state;
        const rootScope = typeof self !== 'undefined' ? self : globalThis;
        const capabilityRegistry = rootScope.MultiPageFlowCapabilities?.createFlowCapabilityRegistry?.({
          defaultFlowId: 'openai',
        }) || null;
        if (!capabilityRegistry?.validateAutoRunStart) {
          return { ok: true, errors: [] };
        }
        return capabilityRegistry.validateAutoRunStart({
          activeFlowId: options?.activeFlowId ?? validationState?.activeFlowId,
          panelMode: options?.panelMode ?? validationState?.panelMode,
          signupMethod: options?.signupMethod ?? validationState?.signupMethod,
          state: validationState,
        });
      },
      validateModeSwitch = (state = {}, options = {}) => {
        const validationState = options?.state || state;
        const rootScope = typeof self !== 'undefined' ? self : globalThis;
        const capabilityRegistry = rootScope.MultiPageFlowCapabilities?.createFlowCapabilityRegistry?.({
          defaultFlowId: 'openai',
        }) || null;
        if (!capabilityRegistry?.validateModeSwitch) {
          return {
            ok: true,
            changedKeys: Array.isArray(options?.changedKeys) ? options.changedKeys : [],
            errors: [],
            normalizedUpdates: {},
          };
        }
        return capabilityRegistry.validateModeSwitch({
          activeFlowId: options?.activeFlowId ?? validationState?.activeFlowId,
          changedKeys: options?.changedKeys,
          panelMode: options?.panelMode ?? validationState?.panelMode,
          signupMethod: options?.signupMethod ?? validationState?.signupMethod,
          state: validationState,
        });
      },
      getTabId,
      getStopRequested,
      handleAutoRunLoopUnhandledError,
      importSettingsBundle,
      invalidateDownstreamAfterStepRestart,
      isCloudflareSecurityBlockedError,
      isAutoRunLockedState,
      isHotmailProvider,
      isLocalhostOAuthCallbackUrl,
      isLuckmailProvider,
      isStopError,
      isTabAlive,
      launchAutoRunTimerPlan,
      listIcloudAliases,
      listLuckmailPurchasesForManagement,
      markCurrentCustomEmailPoolEntryUsed,
      markCurrentRegistrationAccountUsed,
      normalizeHotmailAccounts,
      normalizeMail2925Accounts,
      normalizeLegacyWalletAccounts,
      normalizeRunCount,
      AUTO_RUN_TIMER_KIND_SCHEDULED_START,
      notifyNodeComplete,
      notifyNodeError,
      patchMail2925Account,
      patchHotmailAccount,
      pollContributionStatus,
      pauseRemovedPaymentWorkerJob = null,
      registerTab,
      requestStop,
      handleCloudflareSecurityBlocked,
      resetState,
      resumeRemovedPaymentWorkerJob = null,
      resumeAutoRun,
      scheduleAutoRun,
      sendTabMessageUntilStopped = null,
      selectLuckmailPurchase,
      sleepWithStop = async () => {},
      setCurrentLegacyWalletAccount,
      setCurrentMail2925Account,
      setCurrentHotmailAccount,
      setContributionMode,
      setEmailState,
      setEmailStateSilently,
      persistRegistrationEmailState,
      setIcloudAliasPreservedState,
      setIcloudAliasUsedState,
      setLuckmailPurchaseDisabledState,
      setLuckmailPurchasePreservedState,
      setLuckmailPurchaseUsedState,
      setPersistentSettings,
      setState,
      setNodeStatus,
      skipAutoRunCountdown,
      skipNode,
      startContributionFlow,
      startAutoRunLoop,
      waitForTabCompleteUntilStopped = async () => {},
      deleteMail2925Account,
      deleteMail2925Accounts,
      syncHotmailAccounts,
      syncLegacyWalletAccounts,
      testHotmailAccountMailAccess,
      upsertLegacyWalletAccount,
      upsertMail2925Account,
      upsertHotmailAccount,
      verifyHotmailAccount,
    } = deps;

    function getRouterRedeemRefreshServiceModule() {
      const rootScope = typeof self !== 'undefined' ? self : globalThis;
      return rootScope.MultiPageRouterRedeemRefreshService || {};
    }

    function getRouterNodeProtocolServiceModule() {
      const rootScope = typeof self !== 'undefined' ? self : globalThis;
      return rootScope.MultiPageRouterNodeProtocolService || {};
    }

    function getRouterPaymentSessionServiceModule() {
      const rootScope = typeof self !== 'undefined' ? self : globalThis;
      return rootScope.MultiPageRouterPaymentSessionService || {};
    }

    function getRouterCoreRoutesModule() {
      const rootScope = typeof self !== 'undefined' ? self : globalThis;
      return rootScope.MultiPageRouterCoreRoutes || {};
    }

    function getRouterMessageDispatcherModule() {
      const rootScope = typeof self !== 'undefined' ? self : globalThis;
      return rootScope.MultiPageRouterMessageDispatcher || {};
    }

    const createRouterRedeemRefreshService = getRouterRedeemRefreshServiceModule().createRouterRedeemRefreshService;
    if (typeof createRouterRedeemRefreshService !== 'function') {
      throw new Error('Router redeem refresh service module is not loaded.');
    }
    const {
      refreshPendingUpiCredentialMembershipRedeemStatuses,
      refreshUpiRedeemCdkeyStatusesAndSync,
      syncUpiCredentialMembershipResultsAfterCdkeyRefresh,
    } = createRouterRedeemRefreshService({
      addLog,
      broadcastDataUpdate,
      checkUpiRedeemSubscriptionStatuses,
      getState,
      isAutoRunLockedState,
      refreshUpiRedeemCdkeyStatuses,
      retryFailedUpiRedeemCdkey,
      retryUpiRedeemCdkeyJobs,
      setState,
    });

    const createRouterPaymentSessionService = getRouterPaymentSessionServiceModule().createRouterPaymentSessionService;
    if (typeof createRouterPaymentSessionService !== 'function') {
      throw new Error('Router payment session service module is not loaded.');
    }
    const {
      cleanupPaymentTabsAfterSuccessfulFlow,
      normalizePlusPaymentMethod,
      refreshChatGptSessionAndInspectPlusActivation,
    } = createRouterPaymentSessionService({
      addLog,
      ensureContentScriptReadyOnTabUntilStopped,
      getState,
      getTabId,
      registerTab,
      sendTabMessageUntilStopped,
      setState,
      sleepWithStop,
      waitForTabCompleteUntilStopped,
    });

    const createRouterNodeProtocolService = getRouterNodeProtocolServiceModule().createRouterNodeProtocolService;
    if (typeof createRouterNodeProtocolService !== 'function') {
      throw new Error('Router node protocol service module is not loaded.');
    }
    const {
      appendManualAccountRunRecordIfNeeded,
      ensureManualStepPrerequisites,
      executeNodeForManualChain,
      findStepByNodeId,
      getLastNodeIdForState,
      getNextNodeIdForState,
      getStepKeyForState,
      handleStepData,
      isStaleAutoRunNodeMessage,
      lockAutomationWindowFromMessage,
      normalizeNodeProtocolMessage,
      shouldAutoContinueManualNode,
    } = createRouterNodeProtocolService({
      addLog,
      appendAccountRunRecord,
      broadcastDataUpdate,
      buildLocalhostCleanupPrefix,
      cleanupPaymentTabsAfterSuccessfulFlow,
      clearLuckmailRuntimeState,
      closeLocalhostCallbackTabs,
      closeTabsByUrlPrefix,
      doesNodeUseCompletionSignal,
      executeNode,
      executeNodeViaCompletionSignal,
      finalizeIcloudAliasAfterSuccessfulFlow,
      getCurrentLuckmailPurchase,
      getNodeIdsForState,
      getState,
      getStepDefinitionForState,
      getStepIdByNodeIdForState,
      getStepIdsForState,
      getTabId,
      isAutoRunLockedState,
      isHotmailProvider,
      isLocalhostOAuthCallbackUrl,
      isLuckmailProvider,
      isTabAlive,
      markCurrentRegistrationAccountUsed,
      normalizePlusPaymentMethod,
      patchHotmailAccount,
      patchMail2925Account,
      setEmailState,
      setLuckmailPurchaseUsedState,
      setNodeStatus,
      setState,
    });

    const createRouterCoreRoutes = getRouterCoreRoutesModule().createRouterCoreRoutes;
    if (typeof createRouterCoreRoutes !== 'function') {
      throw new Error('Router core routes module is not loaded.');
    }
    const {
      normalizeString,
      routeHandlers,
    } = createRouterCoreRoutes({
      AUTO_RUN_TIMER_KIND_SCHEDULED_START,
      addLog,
      broadcastDataUpdate,
      buildLuckmailSessionSettingsPayload,
      buildPersistentSettingsPayload,
      cancelScheduledAutoRun,
      cancelUpiRedeemCdkeyJobs,
      checkIcloudSession,
      checkUpiCredentialMembershipBatch,
      checkUpiCredentialMembershipOne,
      checkUpiCredentialMembershipTrialEligibility,
      clearAccountRunHistory,
      clearAutoRunTimerAlarm,
      clearStopRequest,
      deleteAccountRunHistoryRecords,
      deleteIcloudAlias,
      deleteUsedIcloudAliases,
      ensureManualInteractionAllowed,
      ensureManualStepPrerequisites,
      executeNodeForManualChain,
      exportSettingsBundle,
      fetchGeneratedEmail,
      fillUpiCredentialMembershipFreeAccessTokens,
      findStepByNodeId,
      getNextNodeIdForState,
      getNodeIdsForState,
      getPendingAutoRunTimerPlan,
      getState,
      getStepIdsForState,
      getStepKeyForState,
      handleAutoRunLoopUnhandledError,
      importSettingsBundle,
      invalidateDownstreamAfterStepRestart,
      isAutoRunLockedState,
      launchAutoRunTimerPlan,
      listIcloudAliases,
      lockAutomationWindowFromMessage,
      normalizeHotmailAccounts,
      normalizeRunCount,
      refreshUpiRedeemCdkeyStatusesAndSync,
      resetState,
      resolveSignupMethod,
      resumeAutoRun,
      retryUpiRedeemCdkeyJobs,
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
    });

    const createRouterMessageDispatcher = getRouterMessageDispatcherModule().createRouterMessageDispatcher;
    if (typeof createRouterMessageDispatcher !== 'function') {
      throw new Error('Router message dispatcher module is not loaded.');
    }
    const { handleMessage } = createRouterMessageDispatcher({
      addLog,
      appendAccountRunRecord,
      appendManualAccountRunRecordIfNeeded,
      batchUpdateLuckmailPurchases,
      broadcastDataUpdate,
      checkUpiRedeemSubscriptionStatuses,
      clearStopRequest,
      completeNodeFromBackground,
      deleteHotmailAccount,
      deleteHotmailAccounts,
      deleteMail2925Account,
      deleteMail2925Accounts,
      deleteUpiCredentialMembershipCheckResults,
      deleteUpiCredentialMembershipCredentials,
      deps,
      disableUsedLuckmailPurchases,
      executeNodeForManualChain,
      exportCurrentSessionJson,
      exportUpiAccountCredentialBackupTextFile,
      exportUpiCredentialMembershipCheckResults,
      fetchHostedCheckoutVerificationCodeManually,
      fillUpiCredentialMembershipFreeAccessTokens,
      finalizeStep3Completion,
      findHotmailAccount,
      findStepByNodeId,
      flushCommand,
      getNextNodeIdForState,
      getNodeIdsForState,
      getSourceLabel,
      getState,
      getStepKeyForState,
      getStopRequested,
      getUpiCredentialMembershipCheckResults,
      getUpiCredentialMembershipCredentialPool,
      handleCloudflareSecurityBlocked,
      handleStepData,
      identifyUpiCredentialMembershipFreePlus,
      importUpiCredentialMembershipFreeResults,
      invalidateDownstreamAfterStepRestart,
      isAutoRunLockedState,
      isCloudflareSecurityBlockedError,
      isStaleAutoRunNodeMessage,
      isStopError,
      listLuckmailPurchasesForManagement,
      loginUpiCredentialMembershipAccount,
      moveUpiCredentialMembershipAccountGroup,
      normalizeHotmailAccounts,
      normalizeNodeProtocolMessage,
      normalizeString,
      notifyNodeComplete,
      notifyNodeError,
      patchHotmailAccount,
      patchMail2925Account,
      pauseRemovedPaymentWorkerJob,
      pollContributionStatus,
      pruneIneligibleFreeUpiCredentialMembership,
      redeemUpiCredentialMembershipFree,
      refreshCardHelperCardBalance,
      refreshChatGptSessionAndInspectPlusActivation,
      refreshOAuthTimeoutWindowAfterCheckoutSuccess,
      registerTab,
      requestStop,
      resumeRemovedPaymentWorkerJob,
      routeHandlers,
      selectLuckmailPurchase,
      setContributionMode,
      setCurrentHotmailAccount,
      setCurrentLegacyWalletAccount,
      setCurrentMail2925Account,
      setLuckmailPurchaseDisabledState,
      setLuckmailPurchasePreservedState,
      setLuckmailPurchaseUsedState,
      setNodeStatus,
      setState,
      shouldAutoContinueManualNode,
      skipNode,
      startContributionFlow,
      stopUpiCredentialMembershipCheck,
      stopUpiCredentialMembershipRedeem,
      syncHotmailAccounts,
      testCheckoutConversionProxy,
      testHotmailAccountMailAccess,
      upsertHotmailAccount,
      upsertLegacyWalletAccount,
      upsertMail2925Account,
      verifyHotmailAccount,
      verifyUpiCredentialMembershipPlus,
    });

    return {
      handleMessage,
      handleStepData,
      refreshPendingUpiCredentialMembershipRedeemStatuses,
    };
  }

  return {
    createMessageRouter,
  };
});
