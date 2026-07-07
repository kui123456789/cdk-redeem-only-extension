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

    const CHATGPT_SESSION_SOURCE = 'chatgpt-session-reader';
    const LEGACY_WALLET_SOURCE = 'legacyWallet-flow';
    const LEGACY_PAY_SOURCE = 'legacyPay-flow';
    const CHATGPT_SESSION_INJECT_FILES = ['content/utils.js', 'content/operation-delay.js', 'content/chatgpt-session-reader.js'];
    const LEGACY_WALLET_GENERIC_ERROR_CHECK_URL = 'https://chatgpt.com/';
    const LEGACY_WALLET_GENERIC_ERROR_SESSION_SETTLE_WAIT_MS = 5000;

    function normalizeString(value = '') {
      return String(value || '').trim();
    }

    function getRouterRedeemRefreshServiceModule() {
      const rootScope = typeof self !== 'undefined' ? self : globalThis;
      return rootScope.MultiPageRouterRedeemRefreshService || {};
    }

    function getRouterNodeProtocolServiceModule() {
      const rootScope = typeof self !== 'undefined' ? self : globalThis;
      return rootScope.MultiPageRouterNodeProtocolService || {};
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

    function normalizePlusPaymentMethod(value = '') {
      const normalized = normalizeString(value).toLowerCase();
      if (normalized === 'legacyPay') {
        return 'legacyPay';
      }
      if (normalized === 'cardHelper-helper') {
        return 'cardHelper-helper';
      }
      if (normalized === 'upi' || normalized === 'pix') {
        return 'upi';
      }
      return 'legacyWallet';
    }

    function parseUrlSafely(rawUrl) {
      const normalized = normalizeString(rawUrl);
      if (!normalized) {
        return null;
      }
      try {
        return new URL(normalized);
      } catch {
        return null;
      }
    }

    function isChatgptSessionReaderPaymentUrl(url = '') {
      const parsed = parseUrlSafely(url);
      if (!parsed) {
        return false;
      }
      const hostname = normalizeString(parsed.hostname).toLowerCase();
      return hostname === 'pay.openai.com' || hostname === 'checkout.stripe.com';
    }

    function isLegacyWalletPaymentUrl(url = '') {
      const parsed = parseUrlSafely(url);
      if (!parsed) {
        return false;
      }
      const hostname = normalizeString(parsed.hostname).toLowerCase();
      return hostname === 'legacyWallet.com' || hostname.endsWith('.legacyWallet.com');
    }

    function isLegacyPayPaymentUrl(url = '') {
      const parsed = parseUrlSafely(url);
      if (!parsed) {
        return false;
      }
      const hostname = normalizeString(parsed.hostname).toLowerCase();
      return hostname === 'legacyPay.co.id'
        || hostname.endsWith('.legacyPay.co.id')
        || hostname === 'gojek.com'
        || hostname.endsWith('.gojek.com')
        || hostname === 'midtrans.com'
        || hostname.endsWith('.midtrans.com')
        || hostname === 'xendit.co'
        || hostname.endsWith('.xendit.co')
        || hostname === 'xendit.co.id'
        || hostname.endsWith('.xendit.co.id');
    }

    function isKnownPaymentFlowUrl(url = '') {
      const parsed = parseUrlSafely(url);
      if (!parsed) {
        return false;
      }
      const href = normalizeString(parsed.href);
      if (
        href.startsWith('https://pay.openai.com/c/pay/')
        || href.startsWith('https://checkout.stripe.com/c/pay/')
        || href.startsWith('https://www.legacyWallet.com/checkoutweb/signup')
        || href.startsWith('https://legacyWallet.com/checkoutweb/signup')
      ) {
        return true;
      }
      return false;
    }

    async function cleanupPaymentTabsAfterSuccessfulFlow() {
      const chromeApi = typeof chrome !== 'undefined' ? chrome : globalThis.chrome;
      const sources = [
        { source: CHATGPT_SESSION_SOURCE, shouldCloseUrl: isChatgptSessionReaderPaymentUrl },
        { source: LEGACY_WALLET_SOURCE, shouldCloseUrl: isLegacyWalletPaymentUrl },
        { source: LEGACY_PAY_SOURCE, shouldCloseUrl: isLegacyPayPaymentUrl },
      ];
      const closedIds = new Set();
      let closedCount = 0;

      if (chromeApi?.tabs?.get && chromeApi?.tabs?.remove && typeof getTabId === 'function') {
        for (const entry of sources) {
          try {
            const tabId = await getTabId(entry.source);
            if (!Number.isInteger(tabId) || tabId <= 0 || closedIds.has(tabId)) {
              continue;
            }
            const tab = await chromeApi.tabs.get(tabId).catch(() => null);
            const currentUrl = normalizeString(tab?.url);
            if (!entry.shouldCloseUrl(currentUrl)) {
              continue;
            }
            await chromeApi.tabs.remove(tabId).catch(() => {});
            closedIds.add(tabId);
            closedCount += 1;
          } catch (_) {
            // Best effort cleanup only.
          }
        }
      }

      if (chromeApi?.tabs?.query && chromeApi?.tabs?.remove) {
        try {
          const allTabs = await chromeApi.tabs.query({});
          const matchedIds = (Array.isArray(allTabs) ? allTabs : [])
            .filter((tab) => Number.isInteger(tab?.id))
            .filter((tab) => !closedIds.has(tab.id))
            .filter((tab) => isKnownPaymentFlowUrl(tab?.url || ''))
            .map((tab) => tab.id);
          if (matchedIds.length) {
            await chromeApi.tabs.remove(matchedIds).catch(() => {});
            for (const id of matchedIds) {
              closedIds.add(id);
            }
            closedCount += matchedIds.length;
          }
        } catch (_) {
          // Best effort cleanup only.
        }
      }

      const latestState = await getState();
      const nextTabRegistry = {
        ...(latestState?.tabRegistry || {}),
        [CHATGPT_SESSION_SOURCE]: null,
        [LEGACY_WALLET_SOURCE]: null,
        [LEGACY_PAY_SOURCE]: null,
      };
      const nextSourceLastUrls = {
        ...(latestState?.sourceLastUrls || {}),
      };
      delete nextSourceLastUrls[CHATGPT_SESSION_SOURCE];
      delete nextSourceLastUrls[LEGACY_WALLET_SOURCE];
      delete nextSourceLastUrls[LEGACY_PAY_SOURCE];

      await setState({
        chatgptSessionReaderTabId: null,
        chatgptSessionReaderUrl: null,
        tabRegistry: nextTabRegistry,
        sourceLastUrls: nextSourceLastUrls,
      });

      if (closedCount > 0) {
        await addLog(`流程完成：已关闭 ${closedCount} 个支付相关标签页。`, 'info');
      }
    }

    function firstNonEmpty(...values) {
      for (const value of values) {
        const normalized = normalizeString(value);
        if (normalized) {
          return normalized;
        }
      }
      return '';
    }

    function collectSessionFieldValues(root, targetKeys = []) {
      const normalizedTargets = new Set((Array.isArray(targetKeys) ? targetKeys : []).map((key) => normalizeString(key).toLowerCase()));
      if (!normalizedTargets.size || !root || typeof root !== 'object') {
        return [];
      }

      const results = [];
      const queue = [{ value: root, path: '$' }];
      const visited = new Set();
      while (queue.length && results.length < 32) {
        const current = queue.shift();
        const value = current?.value;
        if (!value || typeof value !== 'object') {
          continue;
        }
        if (visited.has(value)) {
          continue;
        }
        visited.add(value);

        const entries = Array.isArray(value)
          ? value.map((entry, index) => [String(index), entry])
          : Object.entries(value);
        for (const [key, entryValue] of entries) {
          const normalizedKey = normalizeString(key).toLowerCase();
          const path = `${current.path}.${key}`;
          if (normalizedTargets.has(normalizedKey)) {
            results.push({ key: normalizedKey, path, value: entryValue });
          }
          if (entryValue && typeof entryValue === 'object') {
            queue.push({ value: entryValue, path });
          }
        }
      }
      return results;
    }

    function normalizePlanType(value = '') {
      return normalizeString(value)
        .toLowerCase()
        .replace(/\s+/g, '_');
    }

    function isPaidPlanType(value = '') {
      const normalized = normalizePlanType(value);
      if (!normalized) {
        return false;
      }
      return !/(^|[_-])(free|guest|basic|default|none|null|unknown)([_-]|$)/i.test(normalized);
    }

    function inspectPlusActivationFromSession(session = null) {
      const planSignals = collectSessionFieldValues(session, [
        'planType',
        'plan_type',
        'chatgpt_plan_type',
      ]);
      const booleanSignals = collectSessionFieldValues(session, [
        'isPaid',
        'is_paid',
        'hasActiveSubscription',
        'has_active_subscription',
        'subscriptionActive',
        'subscription_active',
        'isSubscribed',
        'is_subscribed',
      ]);
      const planType = firstNonEmpty(
        ...planSignals.map((entry) => typeof entry?.value === 'string' ? entry.value : ''),
        session?.account?.planType,
        session?.account?.plan_type,
        session?.planType,
        session?.plan_type
      );
      const paidSignal = booleanSignals.some((entry) => entry?.value === true);
      return {
        active: paidSignal || isPaidPlanType(planType),
        paidSignal,
        planType,
        planSignalPath: normalizeString(planSignals[0]?.path || ''),
      };
    }

    async function openChatGptTabForLegacyWalletGenericErrorCheck() {
      const chromeApi = typeof chrome !== 'undefined' ? chrome : globalThis.chrome;
      if (!chromeApi?.tabs?.create) {
        throw new Error('当前环境不支持打开 ChatGPT 标签页。');
      }
      const tab = await chromeApi.tabs.create({ url: LEGACY_WALLET_GENERIC_ERROR_CHECK_URL, active: true });
      const tabId = Number(tab?.id) || 0;
      if (!tabId) {
        throw new Error('打开 ChatGPT 页面失败，无法检查 PLUS 状态。');
      }
      if (typeof registerTab === 'function') {
        await registerTab(CHATGPT_SESSION_SOURCE, tabId);
      }
      return tabId;
    }

    async function readChatGptSessionForLegacyWalletGenericErrorCheck(tabId) {
      if (typeof ensureContentScriptReadyOnTabUntilStopped !== 'function' || typeof sendTabMessageUntilStopped !== 'function') {
        throw new Error('缺少 ChatGPT 会话检测依赖，无法检查 PLUS 状态。');
      }
      await waitForTabCompleteUntilStopped(tabId, {
        timeoutMs: 60000,
        retryDelayMs: 300,
      });
      await sleepWithStop(1000);
      await ensureContentScriptReadyOnTabUntilStopped(CHATGPT_SESSION_SOURCE, tabId, {
        inject: CHATGPT_SESSION_INJECT_FILES,
        injectSource: CHATGPT_SESSION_SOURCE,
        timeoutMs: 45000,
        retryDelayMs: 700,
        logMessage: '步骤 6：正在等待 ChatGPT 页面完成加载，以检查 PLUS 状态...',
      });
      const sessionResult = await sendTabMessageUntilStopped(tabId, CHATGPT_SESSION_SOURCE, {
        type: 'READ_CHATGPT_SESSION',
        source: 'background',
        payload: {
          includeSession: true,
          includeAccessToken: true,
        },
      }, {
        timeoutMs: 30000,
        responseTimeoutMs: 15000,
        retryDelayMs: 300,
      });
      if (sessionResult?.error) {
        throw new Error(sessionResult.error);
      }
      return sessionResult || {};
    }

    async function refreshChatGptSessionAndInspectPlusActivation() {
      const chromeApi = typeof chrome !== 'undefined' ? chrome : globalThis.chrome;
      const tabId = await openChatGptTabForLegacyWalletGenericErrorCheck();
      if (typeof setState === 'function') {
        await setState({ chatgptSessionReaderTabId: tabId });
      }
      await waitForTabCompleteUntilStopped(tabId, {
        timeoutMs: 60000,
        retryDelayMs: 300,
      });
      await addLog('步骤 6：已打开 ChatGPT，等待 5 秒后刷新会话并检查 PLUS 状态。', 'info');
      await sleepWithStop(LEGACY_WALLET_GENERIC_ERROR_SESSION_SETTLE_WAIT_MS);
      if (chromeApi?.tabs?.reload) {
        await chromeApi.tabs.reload(tabId).catch(() => {});
      }
      const sessionResult = await readChatGptSessionForLegacyWalletGenericErrorCheck(tabId);
      const session = sessionResult?.session && typeof sessionResult.session === 'object' ? sessionResult.session : null;
      return {
        tabId,
        session,
        accessToken: normalizeString(sessionResult?.accessToken || session?.accessToken),
        ...inspectPlusActivationFromSession(session),
      };
    }

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

    async function handleAutoRunRoute(_payload, message, sender) {
      clearStopRequest();
      if (message.source === 'sidepanel') {
        await lockAutomationWindowFromMessage(message, sender);
      }
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
      const state = await getState();
      const autoRunStartValidation = validateAutoRunStart(state, { state });
      if (autoRunStartValidation?.ok === false) {
        throw new Error(autoRunStartValidation.errors?.[0]?.message || '当前设置不支持启动自动流程。');
      }
      if (getPendingAutoRunTimerPlan(state)) {
        throw new Error('已有自动运行倒计时计划，请先取消或立即开始。');
      }
      const totalRuns = normalizeRunCount(message.payload?.totalRuns || 1);
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
      const state = await getState();
      const autoRunStartValidation = validateAutoRunStart(state, { state });
      if (autoRunStartValidation?.ok === false) {
        throw new Error(autoRunStartValidation.errors?.[0]?.message || '当前设置不支持启动自动流程。');
      }
      const totalRuns = normalizeRunCount(message.payload?.totalRuns || 1);
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

    const rootScope = typeof self !== 'undefined' ? self : globalThis;
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

    async function handleMessage(rawMessage, sender) {
      const message = await normalizeNodeProtocolMessage(rawMessage);
      const type = String(message?.type || '').trim();
      const payload = message?.payload || {};
      if (routeHandlers[type]) {
        return routeHandlers[type](payload, message, sender);
      }

      switch (type) {
        case 'CONTENT_SCRIPT_READY': {
          const tabId = sender.tab?.id;
          if (tabId && message.source) {
            await registerTab(message.source, tabId);
            flushCommand(message.source, tabId);
            await addLog(`内容脚本已就绪：${getSourceLabel(message.source)}（标签页 ${tabId}）`);
          }
          return { ok: true };
        }

        case 'LOG': {
          const { message: msg, level, step: payloadStep, stepKey } = message.payload;
          const logStep = Math.floor(Number(message.step || payloadStep) || 0);
          await addLog(
            `[${getSourceLabel(message.source)}] ${msg}`,
            level,
            {
              step: logStep > 0 ? logStep : null,
              stepKey,
            }
          );
          return { ok: true };
        }

        case 'NODE_COMPLETE': {
          const currentStateForNode = await getState();
          const nodeId = String(message.nodeId || message.payload?.nodeId || '').trim();
          const resolvedStep = findStepByNodeId(nodeId, currentStateForNode);
          if (!nodeId || !resolvedStep) {
            throw new Error('NODE_COMPLETE 缺少 nodeId。');
          }
          const currentState = await getState();
          if (isStaleAutoRunNodeMessage(nodeId, currentState)) {
            await addLog(
              `自动运行：忽略过期的节点 ${nodeId} 完成消息，当前流程已在节点 ${currentState.currentNodeId || '未知'}。`,
              'warn',
              { nodeId }
            );
            return { ok: true, ignored: true };
          }
          if (getStopRequested()) {
            await setNodeStatus(nodeId, 'stopped');
            await appendManualAccountRunRecordIfNeeded(`node:${nodeId}:stopped`, null, '流程已被用户停止。');
            notifyNodeError(nodeId, '流程已被用户停止。');
            return { ok: true };
          }
          try {
            if (nodeId === 'fill-password' && typeof finalizeStep3Completion === 'function') {
              await finalizeStep3Completion(message.payload || {});
            }
          } catch (error) {
            if (typeof isCloudflareSecurityBlockedError === 'function' && isCloudflareSecurityBlockedError(error)) {
              const userMessage = typeof handleCloudflareSecurityBlocked === 'function'
                ? await handleCloudflareSecurityBlocked(error)
                : (error?.message || String(error || ''));
              notifyNodeError(nodeId, '流程已被用户停止。');
              return { ok: true, error: userMessage };
            }
            const errorMessage = error?.message || String(error || '步骤 3 提交后确认失败');
            await setNodeStatus(nodeId, 'failed');
            await addLog(`失败：${errorMessage}`, 'error', {
              nodeId,
            });
            await appendManualAccountRunRecordIfNeeded(`node:${nodeId}:failed`, null, errorMessage);
            notifyNodeError(nodeId, errorMessage);
            return { ok: true, error: errorMessage };
          }

          const completionStateCandidate = await getState();
          const nodeIds = typeof getNodeIdsForState === 'function' ? getNodeIdsForState(completionStateCandidate) : [];
          const lastNodeId = nodeIds[nodeIds.length - 1] || '';
          const isFinalNode = nodeId === lastNodeId;
          const completionState = isFinalNode ? completionStateCandidate : null;
          await setNodeStatus(nodeId, 'completed');
          await addLog('已完成', 'ok', { nodeId });
          await handleStepData(resolvedStep, message.payload);
          if (isFinalNode && typeof appendAccountRunRecord === 'function') {
            const successState = nodeId === 'upi-redeem'
              ? {
                ...(completionState || {}),
                upiRedeemSuccess: true,
                upiRedeemCdkey: message.payload?.cdkey || completionState?.upiRedeemCdkey || '',
              }
              : completionState;
            await appendAccountRunRecord('success', successState);
          }
          notifyNodeComplete(nodeId, message.payload);
          return { ok: true };
        }

        case 'NODE_ERROR': {
          const stateForNode = await getState();
          const nodeId = String(message.nodeId || message.payload?.nodeId || '').trim();
          const resolvedStep = findStepByNodeId(nodeId, stateForNode);
          if (!nodeId || !resolvedStep) {
            throw new Error('NODE_ERROR 缺少 nodeId。');
          }
          const staleCheckState = await getState();
          if (isStaleAutoRunNodeMessage(nodeId, staleCheckState)) {
            await addLog(
              `自动运行：忽略过期的节点 ${nodeId} 失败消息，当前流程已在节点 ${staleCheckState.currentNodeId || '未知'}。原始错误：${message.error || '未知错误'}`,
              'warn',
              { nodeId }
            );
            return { ok: true, ignored: true };
          }
          if (typeof isCloudflareSecurityBlockedError === 'function' && isCloudflareSecurityBlockedError(message.error)) {
            const userMessage = typeof handleCloudflareSecurityBlocked === 'function'
              ? await handleCloudflareSecurityBlocked(message.error)
              : (typeof message.error === 'string' ? message.error : String(message.error || ''));
            notifyNodeError(nodeId, '流程已被用户停止。');
            return { ok: true, error: userMessage };
          }
          if (isStopError(message.error)) {
            await setNodeStatus(nodeId, 'stopped');
            await addLog('已被用户停止', 'warn', { nodeId });
            await appendManualAccountRunRecordIfNeeded(`node:${nodeId}:stopped`, null, message.error);
            notifyNodeError(nodeId, message.error);
          } else {
            await setNodeStatus(nodeId, 'failed');
            await addLog(`失败：${message.error}`, 'error', {
              nodeId,
            });
            await appendManualAccountRunRecordIfNeeded(`node:${nodeId}:failed`, null, message.error);
            notifyNodeError(nodeId, message.error);
          }
          return { ok: true };
        }

        case 'RESOLVE_PLUS_MANUAL_CONFIRMATION': {
          const currentState = await getState();
          const step = Number(message.payload?.step) || Number(currentState?.plusManualConfirmationStep) || 0;
          const confirmationNodeId = getStepKeyForState(step, currentState) || String(currentState?.currentNodeId || '').trim();
          const confirmed = Boolean(message.payload?.confirmed);
          const requestId = String(message.payload?.requestId || '').trim();
          const currentRequestId = String(currentState?.plusManualConfirmationRequestId || '').trim();
          const method = String(currentState?.plusManualConfirmationMethod || '').trim().toLowerCase();
          const action = String(message.payload?.action || '').trim().toLowerCase();
          const isCardHelperOtp = method === 'legacyPay-otp';
          const isLegacyWalletHostedGenericError = method === 'legacyWallet-hosted-generic-error';
          if (!currentState?.plusManualConfirmationPending) {
            return { ok: true, ignored: true };
          }
          if (requestId && currentRequestId && requestId !== currentRequestId) {
            return { ok: true, ignored: true };
          }

          const clearManualConfirmationState = {
            plusManualConfirmationPending: false,
            plusManualConfirmationRequestId: '',
            plusManualConfirmationStep: 0,
            plusManualConfirmationMethod: '',
            plusManualConfirmationTitle: '',
            plusManualConfirmationMessage: '',
          };

          if (isLegacyWalletHostedGenericError) {
            if (action === 'check' && confirmed) {
              let inspection = null;
              try {
                clearStopRequest?.();
                inspection = await refreshChatGptSessionAndInspectPlusActivation();
              } catch (error) {
                const reason = normalizeString(error?.message || error) || '未知错误';
                await addLog(`步骤 6：已按你的选择刷新 ChatGPT 会话，但检查 PLUS 状态失败：${reason}`, 'warn');
                return { ok: true, plusActive: false, checkError: reason };
              }

              if (!inspection?.active) {
                const planSuffix = inspection?.planType ? `（planType=${inspection.planType}）` : '';
                await addLog(`步骤 6：已按你的选择刷新 ChatGPT 会话，但暂未检测到 PLUS 已生效${planSuffix}。`, 'warn');
                return { ok: true, plusActive: false, planType: inspection?.planType || '' };
              }

              await setState(clearManualConfirmationState);
              if (typeof broadcastDataUpdate === 'function') {
                broadcastDataUpdate(clearManualConfirmationState);
              }

              const completedNodeId = confirmationNodeId || 'chatgpt-session-reader-create';
              const completedStep = findStepByNodeId(completedNodeId, currentState) || step || 6;
              if (typeof invalidateDownstreamAfterStepRestart === 'function') {
                await invalidateDownstreamAfterStepRestart(completedStep, {
                  logLabel: 'LegacyWallet genericError 后检测到 PLUS 已生效',
                });
              }
              await addLog(`步骤 6：已检测到 PLUS 生效（planType=${inspection.planType || 'unknown'}），准备继续下一步。`, 'ok');
              if (typeof refreshOAuthTimeoutWindowAfterCheckoutSuccess === 'function') {
                await refreshOAuthTimeoutWindowAfterCheckoutSuccess({
                  source: 'legacyWallet-hosted-generic-error-check',
                });
              }
              await completeNodeFromBackground(completedNodeId, {
                plusDetectedPlanType: inspection.planType || '',
                chatgptSessionReaderTabId: inspection.tabId,
              });
              const latestExecutionState = await getState();
              if (shouldAutoContinueManualNode(completedNodeId, latestExecutionState)) {
                const nextNodeId = getNextNodeIdForState(completedNodeId, latestExecutionState);
                if (nextNodeId) {
                  await addLog(`步骤 ${completedStep} 已完成，正在继续执行下一节点 ${nextNodeId}。`, 'info', {
                    step: completedStep,
                    nodeId: completedNodeId,
                  });
                  await executeNodeForManualChain(nextNodeId);
                }
              }
              return { ok: true, plusActive: true, planType: inspection.planType || '' };
            }

            if (action === 'retry' && confirmed) {
              await setState({
                ...clearManualConfirmationState,
                legacyWalletGenericErrorRecoveryCount: 0,
                legacyWalletApprovalBranchRecoveryCount: 0,
              });
              if (typeof broadcastDataUpdate === 'function') {
                broadcastDataUpdate({
                  ...clearManualConfirmationState,
                  legacyWalletGenericErrorRecoveryCount: 0,
                  legacyWalletApprovalBranchRecoveryCount: 0,
                });
              }
              clearStopRequest?.();
              const retryNodeId = 'chatgpt-session-reader-create';
              const retryStep = findStepByNodeId(retryNodeId, currentState) || 6;
              await addLog('步骤 6：已按你的选择重新开始创建 ChatGPT 会话读取。', 'info');
              if (typeof invalidateDownstreamAfterStepRestart === 'function') {
                await invalidateDownstreamAfterStepRestart(retryStep, { logLabel: 'LegacyWallet genericError 后重试 ChatGPT 会话读取' });
              }
              await executeNodeForManualChain(retryNodeId);
              const latestExecutionState = await getState();
              if (shouldAutoContinueManualNode(retryNodeId, latestExecutionState)) {
                const nextNodeId = getNextNodeIdForState(retryNodeId, latestExecutionState);
                if (nextNodeId) {
                  await addLog(`步骤 ${retryStep} 已完成，正在继续执行下一节点 ${nextNodeId}。`, 'info', {
                    step: retryStep,
                    nodeId: retryNodeId,
                  });
                  await executeNodeForManualChain(nextNodeId);
                }
              }
              return { ok: true };
            }

            await setState(clearManualConfirmationState);
            if (typeof broadcastDataUpdate === 'function') {
              broadcastDataUpdate(clearManualConfirmationState);
            }

            const cancelMessage = '已取消 LegacyWallet Checkout 异常处理';
            await addLog(`步骤 ${step || 6}：${cancelMessage}。`, 'warn');
            return { ok: true };
          }

          if (isCardHelperOtp && confirmed) {
            const otp = String(message.payload?.otp || message.payload?.code || '').trim().replace(/[^\d]/g, '');
            if (!otp) {
              throw new Error('请输入 CARD_HELPER OTP 验证码。');
            }
            const otpUpdates = {
              ...clearManualConfirmationState,
              legacyPayHelperResolvedOtp: otp,
            };
            await setState(otpUpdates);
            if (typeof broadcastDataUpdate === 'function') {
              broadcastDataUpdate(otpUpdates);
            }
            await addLog(`步骤 ${step}：已收到 CARD_HELPER OTP，准备提交验证。`, 'ok');
            return { ok: true };
          }

          await setState(clearManualConfirmationState);
          if (typeof broadcastDataUpdate === 'function') {
            broadcastDataUpdate(clearManualConfirmationState);
          }

          if (confirmed) {
            const methodLabel = method === 'legacyPay' ? 'LegacyPay' : '手动';
            await addLog(`步骤 ${step}：已确认${methodLabel}订阅完成，准备继续下一步。`, 'ok');
            await completeNodeFromBackground(confirmationNodeId, {
              plusManualConfirmationMethod: currentState?.plusManualConfirmationMethod || '',
              plusManualConfirmedAt: Date.now(),
            });
            return { ok: true };
          }

          const cancelMessage = method === 'legacyPay'
            ? '已取消 LegacyPay 订阅确认'
            : (isCardHelperOtp ? '已取消 CARD_HELPER OTP 输入' : '已取消当前手动确认');
          await setNodeStatus(confirmationNodeId, 'failed');
          await addLog(`步骤 ${step}：${cancelMessage}。`, 'warn');
          await appendManualAccountRunRecordIfNeeded(
            confirmationNodeId ? `node:${confirmationNodeId}:failed` : 'failed',
            null,
            cancelMessage
          );
          notifyNodeError(confirmationNodeId, cancelMessage);
          return { ok: true };
        }

        case 'GET_STATE': {
          return await getState();
        }

        case 'EXPORT_CURRENT_SESSION_JSON': {
          if (typeof exportCurrentSessionJson !== 'function') {
            throw new Error('当前 SESSION JSON 导出能力未接入。');
          }
          return await exportCurrentSessionJson(message.payload || {});
        }

        case 'SET_CONTRIBUTION_MODE': {
          const enabled = Boolean(message.payload?.enabled);
          const state = await ensureManualInteractionAllowed(enabled ? '进入贡献模式' : '退出贡献模式');
          if (Object.values(state.nodeStatuses || {}).some((status) => status === 'running')) {
            throw new Error(enabled ? '当前有步骤正在执行，无法进入贡献模式。' : '当前有步骤正在执行，无法退出贡献模式。');
          }
          if (typeof setContributionMode !== 'function') {
            throw new Error('贡献模式切换能力未接入。');
          }
          return {
            ok: true,
            state: await setContributionMode(enabled),
          };
        }

        case 'START_CONTRIBUTION_FLOW': {
          const state = await ensureManualInteractionAllowed('开始贡献');
          if (Object.values(state.nodeStatuses || {}).some((status) => status === 'running')) {
            throw new Error('当前有步骤正在执行，无法开始贡献流程。');
          }
          if (typeof startContributionFlow !== 'function') {
            throw new Error('贡献 OAuth 流程尚未接入。');
          }
          return {
            ok: true,
            state: await startContributionFlow({
              nickname: message.payload?.nickname,
              qq: message.payload?.qq,
            }),
          };
        }

        case 'SET_CONTRIBUTION_PROFILE': {
          const state = await getState();
          if (!state?.contributionMode) {
            throw new Error('请先进入贡献模式。');
          }
          const nickname = String(message.payload?.nickname || '').trim();
          const qq = String(message.payload?.qq || '').trim();
          if (qq && !/^\d{1,20}$/.test(qq)) {
            throw new Error('QQ 只能填写数字，且长度不能超过 20 位。');
          }
          await setState({
            contributionNickname: nickname,
            contributionQq: qq,
          });
          return {
            ok: true,
            state: await getState(),
          };
        }

        case 'POLL_CONTRIBUTION_STATUS': {
          if (typeof pollContributionStatus !== 'function') {
            throw new Error('贡献状态轮询能力尚未接入。');
          }
          return {
            ok: true,
            state: await pollContributionStatus({
              reason: message.payload?.reason || 'sidepanel_poll',
            }),
          };
        }

        case 'TAKEOVER_AUTO_RUN': {
          await requestStop({ logMessage: '已确认手动接管，正在停止自动流程并切换为手动控制...' });
          await addLog('自动流程已切换为手动控制。', 'warn');
          return { ok: true };
        }

        case 'SKIP_NODE': {
          const nodeId = String(message.nodeId || message.payload?.nodeId || '').trim();
          if (!nodeId) {
            throw new Error('SKIP_NODE 缺少 nodeId。');
          }
          return await skipNode(nodeId);
        }

        case 'EXPORT_UPI_ACCOUNT_CREDENTIAL_BACKUPS': {
          if (typeof exportUpiAccountCredentialBackupTextFile !== 'function') {
            throw new Error('UPI 密码 2FA 备份导出能力尚未接入。');
          }
          return { ok: true, ...(await exportUpiAccountCredentialBackupTextFile()) };
        }

        case 'REDEEM_UPI_CREDENTIAL_MEMBERSHIP_FREE': {
          clearStopRequest();
          if (typeof redeemUpiCredentialMembershipFree !== 'function') {
            throw new Error('UPI Free 账号兑换能力尚未接入。');
          }
          if ((message.payload || {}).manualTrigger !== true) {
            throw new Error('Free 账号 CDK 兑换只能通过一键兑换按钮手动触发。');
          }
          const result = await redeemUpiCredentialMembershipFree(message.payload || {});
          return { ok: true, results: result };
        }

        case 'IDENTIFY_UPI_CREDENTIAL_MEMBERSHIP_FREE_PLUS': {
          clearStopRequest();
          const state = await getState();
          const payload = message.payload || {};
          if (isAutoRunLockedState(state) && payload.allowDuringAutoRun !== true) {
            throw new Error('自动流程运行中，当前不能识别 UPI Free 分组 Plus。');
          }
          if (typeof identifyUpiCredentialMembershipFreePlus !== 'function') {
            throw new Error('UPI Free 分组 Plus 识别能力尚未接入。');
          }
          const result = await identifyUpiCredentialMembershipFreePlus(payload);
          return { ok: true, ...result };
        }

        case 'VERIFY_UPI_CREDENTIAL_MEMBERSHIP_PLUS': {
          clearStopRequest();
          const state = await getState();
          if (isAutoRunLockedState(state)) {
            throw new Error('自动流程运行中，当前不能验证 UPI Plus 分组。');
          }
          if (typeof verifyUpiCredentialMembershipPlus !== 'function') {
            throw new Error('UPI Plus 分组验证能力尚未接入。');
          }
          const result = await verifyUpiCredentialMembershipPlus(message.payload || {});
          return { ok: true, ...result };
        }

        case 'LOGIN_UPI_CREDENTIAL_MEMBERSHIP_ACCOUNT': {
          clearStopRequest();
          const state = await getState();
          if (isAutoRunLockedState(state)) {
            throw new Error('自动流程运行中，当前不能登录 UPI 分组账号。');
          }
          if (typeof loginUpiCredentialMembershipAccount !== 'function') {
            throw new Error('UPI 分组账号登录能力尚未接入。');
          }
          const result = await loginUpiCredentialMembershipAccount({
            ...(message.payload || {}),
            source: 'row-login',
            readAccessToken: false,
            refreshAccessToken: false,
          });
          return { ok: true, ...result };
        }

        case 'MOVE_UPI_CREDENTIAL_MEMBERSHIP_ACCOUNT_GROUP': {
          const state = await getState();
          if (isAutoRunLockedState(state)) {
            throw new Error('自动流程运行中，当前不能移动 UPI 分组账号。');
          }
          if (typeof moveUpiCredentialMembershipAccountGroup !== 'function') {
            throw new Error('UPI 分组账号移动能力尚未接入。');
          }
          const result = await moveUpiCredentialMembershipAccountGroup(message.payload || {});
          return { ok: true, ...result };
        }

        case 'PRUNE_INELIGIBLE_UPI_CREDENTIAL_MEMBERSHIP_FREE': {
          clearStopRequest();
          const state = await getState();
          if (isAutoRunLockedState(state)) {
            throw new Error('自动流程运行中，当前不能检测 UPI Free 分组试用资格。');
          }
          if (typeof pruneIneligibleFreeUpiCredentialMembership !== 'function') {
            throw new Error('UPI Free 分组试用资格检测能力尚未接入。');
          }
          const result = await pruneIneligibleFreeUpiCredentialMembership(message.payload || {});
          return { ok: true, ...result };
        }

        case 'IMPORT_UPI_CREDENTIAL_MEMBERSHIP_FREE_RESULTS': {
          clearStopRequest();
          if (typeof importUpiCredentialMembershipFreeResults !== 'function') {
            throw new Error('UPI 无会员备份账号导入能力尚未接入。');
          }
          const result = await importUpiCredentialMembershipFreeResults(message.payload || {});
          return {
            ok: true,
            results: result,
            importedCount: Math.max(0, Math.floor(Number(result?.importedCount) || 0)),
            restoredCount: Math.max(0, Math.floor(Number(result?.restoredCount) || 0)),
            restoredEmails: Array.isArray(result?.restoredEmails) ? result.restoredEmails : [],
            skippedCount: Math.max(0, Math.floor(Number(result?.skippedCount) || 0)),
            skippedEmails: Array.isArray(result?.skippedEmails) ? result.skippedEmails : [],
          };
        }

        case 'GET_UPI_CREDENTIAL_MEMBERSHIP_CREDENTIAL_POOL': {
          if (typeof getUpiCredentialMembershipCredentialPool !== 'function') {
            throw new Error('UPI 备份账号核验池读取能力尚未接入。');
          }
          return { ok: true, pool: await getUpiCredentialMembershipCredentialPool(message.payload || {}) };
        }

        case 'GET_UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS': {
          if (typeof getUpiCredentialMembershipCheckResults !== 'function') {
            throw new Error('UPI 备份账号会员核验结果读取能力尚未接入。');
          }
          return { ok: true, results: await getUpiCredentialMembershipCheckResults() };
        }

        case 'DELETE_UPI_CREDENTIAL_MEMBERSHIP_CREDENTIALS': {
          if (typeof deleteUpiCredentialMembershipCredentials !== 'function') {
            throw new Error('UPI 备份账号核验池删除能力尚未接入。');
          }
          return { ok: true, ...(await deleteUpiCredentialMembershipCredentials(message.payload || {})) };
        }

        case 'DELETE_UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS': {
          if (typeof deleteUpiCredentialMembershipCheckResults !== 'function') {
            throw new Error('UPI 备份账号核验结果删除能力尚未接入。');
          }
          return { ok: true, ...(await deleteUpiCredentialMembershipCheckResults(message.payload || {})) };
        }

        case 'EXPORT_UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS': {
          if (typeof exportUpiCredentialMembershipCheckResults !== 'function') {
            throw new Error('UPI 备份账号会员核验导出能力尚未接入。');
          }
          return { ok: true, ...(await exportUpiCredentialMembershipCheckResults(message.payload || {})) };
        }

        case 'STOP_UPI_CREDENTIAL_MEMBERSHIP_CHECK': {
          if (typeof stopUpiCredentialMembershipCheck !== 'function') {
            throw new Error('UPI 备份账号会员核验停止能力尚未接入。');
          }
          return { ok: true, results: await stopUpiCredentialMembershipCheck() };
        }

        case 'STOP_UPI_CREDENTIAL_MEMBERSHIP_REDEEM': {
          if (typeof stopUpiCredentialMembershipRedeem !== 'function') {
            throw new Error('UPI Free 账号兑换停止能力尚未接入。');
          }
          return { ok: true, results: await stopUpiCredentialMembershipRedeem() };
        }

        case 'REFRESH_CARD_HELPER_CARD_BALANCE': {
          if (typeof refreshCardHelperCardBalance !== 'function') {
            throw new Error('CARD_HELPER API Key 余额查询能力尚未接入。');
          }
          const state = await getState();
          const result = await refreshCardHelperCardBalance({
            ...(state || {}),
            ...(message.payload || {}),
          }, {
            reason: message.payload?.reason,
          });
          return { ok: true, ...result };
        }

        case 'UPSERT_HOTMAIL_ACCOUNT': {
          const account = await upsertHotmailAccount(message.payload || {});
          return { ok: true, account };
        }

        case 'UPSERT_LEGACY_WALLET_ACCOUNT': {
          const account = await upsertLegacyWalletAccount(message.payload || {});
          return { ok: true, account };
        }

        case 'SELECT_LEGACY_WALLET_ACCOUNT': {
          const account = await setCurrentLegacyWalletAccount(String(message.payload?.accountId || ''));
          return { ok: true, account };
        }

        case 'DELETE_HOTMAIL_ACCOUNT': {
          await deleteHotmailAccount(String(message.payload?.accountId || ''));
          return { ok: true };
        }

        case 'DELETE_HOTMAIL_ACCOUNTS': {
          const result = await deleteHotmailAccounts(String(message.payload?.mode || 'all'));
          return { ok: true, ...result };
        }

        case 'SELECT_HOTMAIL_ACCOUNT': {
          const account = await setCurrentHotmailAccount(String(message.payload?.accountId || ''), {
            markUsed: false,
            syncEmail: true,
          });
          return { ok: true, account };
        }

        case 'PATCH_HOTMAIL_ACCOUNT': {
          const account = await patchHotmailAccount(
            String(message.payload?.accountId || ''),
            message.payload?.updates || {}
          );
          return { ok: true, account };
        }

        case 'VERIFY_HOTMAIL_ACCOUNT':
        case 'AUTHORIZE_HOTMAIL_ACCOUNT': {
          const accountId = String(message.payload?.accountId || '');
          try {
            const result = await verifyHotmailAccount(accountId);
            await setCurrentHotmailAccount(result.account.id, { markUsed: false, syncEmail: true });
            await addLog(`Hotmail 账号 ${result.account.email} 校验通过，可直接用于收信。`, 'ok');
            return { ok: true, account: result.account, messageCount: result.messageCount };
          } catch (err) {
            const state = await getState();
            const accounts = normalizeHotmailAccounts(state.hotmailAccounts);
            const target = findHotmailAccount(accounts, accountId);
            if (target) {
              target.status = 'error';
              target.lastError = err.message;
              await syncHotmailAccounts(accounts.map((item) => (item.id === target.id ? target : item)));
            }
            throw err;
          }
        }

        case 'TEST_HOTMAIL_ACCOUNT': {
          const result = await testHotmailAccountMailAccess(String(message.payload?.accountId || ''));
          return { ok: true, ...result };
        }

        case 'UPSERT_MAIL2925_ACCOUNT': {
          const account = await upsertMail2925Account(message.payload || {});
          return { ok: true, account };
        }

        case 'DELETE_MAIL2925_ACCOUNT': {
          await deleteMail2925Account(String(message.payload?.accountId || ''));
          return { ok: true };
        }

        case 'DELETE_MAIL2925_ACCOUNTS': {
          const result = await deleteMail2925Accounts(String(message.payload?.mode || 'all'));
          return { ok: true, ...result };
        }

        case 'SELECT_MAIL2925_ACCOUNT': {
          const account = await setCurrentMail2925Account(String(message.payload?.accountId || ''), {
            updateLastUsedAt: false,
          });
          return { ok: true, account };
        }

        case 'PATCH_MAIL2925_ACCOUNT': {
          const account = await patchMail2925Account(
            String(message.payload?.accountId || ''),
            message.payload?.updates || {}
          );
          return { ok: true, account };
        }

        case 'LOGIN_MAIL2925_ACCOUNT': {
          const accountId = String(message.payload?.accountId || '');
          const account = await setCurrentMail2925Account(accountId, {
            updateLastUsedAt: false,
          });
          if (typeof deps.ensureMail2925MailboxSession !== 'function') {
            throw new Error('2925 登录能力尚未接入。');
          }
          await deps.ensureMail2925MailboxSession({
            accountId: account.id,
            forceRelogin: Boolean(message.payload?.forceRelogin),
            actionLabel: '侧边栏手动登录 2925 账号',
          });
          return { ok: true, account };
        }

        case 'LIST_LUCKMAIL_PURCHASES': {
          const purchases = await listLuckmailPurchasesForManagement();
          return { ok: true, purchases };
        }

        case 'SELECT_LUCKMAIL_PURCHASE': {
          const purchase = await selectLuckmailPurchase(message.payload?.purchaseId);
          return { ok: true, purchase };
        }

        case 'SET_LUCKMAIL_PURCHASE_USED_STATE': {
          const result = await setLuckmailPurchaseUsedState(message.payload?.purchaseId, Boolean(message.payload?.used));
          return { ok: true, ...result };
        }

        case 'SET_LUCKMAIL_PURCHASE_PRESERVED_STATE': {
          const purchase = await setLuckmailPurchasePreservedState(message.payload?.purchaseId, Boolean(message.payload?.preserved));
          return { ok: true, purchase };
        }

        case 'SET_LUCKMAIL_PURCHASE_DISABLED_STATE': {
          const purchase = await setLuckmailPurchaseDisabledState(message.payload?.purchaseId, Boolean(message.payload?.disabled));
          return { ok: true, purchase };
        }

        case 'BATCH_UPDATE_LUCKMAIL_PURCHASES': {
          const result = await batchUpdateLuckmailPurchases(message.payload || {});
          return { ok: true, ...result };
        }

        case 'DISABLE_USED_LUCKMAIL_PURCHASES': {
          const result = await disableUsedLuckmailPurchases();
          return { ok: true, ...result };
        }

        case 'FETCH_HOSTED_CHECKOUT_VERIFICATION_CODE': {
          if (typeof fetchHostedCheckoutVerificationCodeManually !== 'function') {
            throw new Error('Hosted checkout 手动获取验证码能力尚未接入。');
          }
          const result = await fetchHostedCheckoutVerificationCodeManually(message.payload || {});
          return {
            ok: true,
            code: String(result?.code || '').trim(),
            verificationUrl: String(result?.verificationUrl || '').trim(),
          };
        }

        case 'TEST_CHATGPT_SESSION_READER_CONVERSION_PROXY': {
          const state = await getState();
          if (isAutoRunLockedState(state)) {
            throw new Error('自动流程运行中，当前不能测试支付转换代理。');
          }
          if (typeof testCheckoutConversionProxy !== 'function') {
            throw new Error('支付转换代理测试能力尚未接入。');
          }
          const result = await testCheckoutConversionProxy(message.payload || {});
          return {
            ok: true,
            proxyDisplayName: String(result?.proxyDisplayName || '').trim(),
            exitIp: String(result?.exitIp || '').trim(),
            exitRegion: String(result?.exitRegion || '').trim(),
            exitSource: String(result?.exitSource || '').trim(),
            exitEndpoint: String(result?.exitEndpoint || '').trim(),
            targetEndpoint: String(result?.targetEndpoint || '').trim(),
            diagnostics: String(result?.diagnostics || '').trim(),
          };
        }

        case 'CHECK_UPI_REDEEM_SUBSCRIPTION_STATUSES': {
          const state = await getState();
          if (isAutoRunLockedState(state)) {
            throw new Error('自动流程运行中，当前不能查询 UPI 会员状态。');
          }
          if (typeof checkUpiRedeemSubscriptionStatuses !== 'function') {
            throw new Error('UPI 会员状态查询能力尚未接入。');
          }
          const result = await checkUpiRedeemSubscriptionStatuses({
            ...state,
            ...(message.payload || {}),
          });
          return { ok: true, ...result };
        }

        case 'REMOVED_PAYMENT_WORKER_PAUSE_JOB': {
          if (typeof pauseRemovedPaymentWorkerJob !== 'function') {
            throw new Error('RemovedPaymentWorker 暂停能力尚未接入。');
          }
          const result = await pauseRemovedPaymentWorkerJob();
          return { ok: true, state: result };
        }

        case 'REMOVED_PAYMENT_WORKER_RESUME_JOB': {
          if (typeof resumeRemovedPaymentWorkerJob !== 'function') {
            throw new Error('RemovedPaymentWorker 继续能力尚未接入。');
          }
          const result = await resumeRemovedPaymentWorkerJob();
          return { ok: true, state: result };
        }

        case 'STOP_FLOW': {
          await requestStop();
          return { ok: true };
        }

        default:
          console.warn('Unknown message type:', message.type);
          return { error: `Unknown message type: ${message.type}` };
      }
    }

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
