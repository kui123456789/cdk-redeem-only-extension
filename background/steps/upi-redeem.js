(function attachBackgroundUpiRedeem(root, factory) {
  root.MultiPageBackgroundUpiRedeem = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createBackgroundUpiRedeemModule() {
  const CHATGPT_SOURCE = 'chatgpt-session-reader';
  const CHATGPT_INJECT_FILES = ['content/utils.js', 'content/operation-delay.js', 'content/chatgpt-session-reader.js'];
  const SESSION_TAB_COMPLETE_TIMEOUT_MS = 60000;
  const SESSION_CONTENT_READY_TIMEOUT_MS = 45000;
  const SESSION_READ_MESSAGE_TIMEOUT_MS = 30000;
  const SESSION_READ_RESPONSE_TIMEOUT_MS = 15000;
    const UPI_REDEEM_TIMEOUT_MS = 45000;
    const UPI_ACCOUNT_INELIGIBLE_ERROR_PREFIX = 'UPI_ACCOUNT_INELIGIBLE::';
    const UPI_REDEEM_BACKEND_FAILED_ERROR_PREFIX = 'UPI_REDEEM_BACKEND_FAILED::';
    const UPI_REDEEM_AUTH_ERROR_PREFIX = 'UPI_REDEEM_AUTH_ERROR::';
    const UPI_REDEEM_DUPLICATE_CDK_ERROR_PREFIX = 'UPI_REDEEM_DUPLICATE_CDK::';
    const UPI_REDEEM_NOT_ACCEPTED_ERROR_PREFIX = 'UPI_REDEEM_NOT_ACCEPTED::';
    const UPI_REDEEM_NETWORK_ERROR_PREFIX = 'UPI_REDEEM_NETWORK::';
    const UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX = 'UPI_ACCESS_TOKEN_EXPIRED::';
    const CHATGPT_SESSION_API_URL = 'https://chatgpt.com/api/auth/session';
    const DEFAULT_UPI_REDEEM_API_BASE_URL = 'https://chong.nerver.cc';
    const DEFAULT_UPI_SUBSCRIPTION_API_BASE_URL = 'https://cha.nerver.cc';
    const UPI_ELIGIBILITY_CHECK_MAX_ATTEMPTS = 3;
    const UPI_ELIGIBILITY_CHECK_RETRY_DELAYS_MS = [3000, 7000];
    const UPI_AUTO_REDEEM_REMOTE_REFRESH_INTERVAL_MS = 5000;
    const UPI_AUTO_REDEEM_REMOTE_REFRESH_TIMEOUT_MS = 120000;
    const UPI_AUTO_REDEEM_REMOTE_REFRESH_ERROR_LOG_INTERVAL_MS = 30000;
    const UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS_STORAGE_KEY = 'upiCredentialMembershipCheckResults';
    const REDEEM_CHANNEL_FAILURE_LIMIT = 3;
    const REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS = 24 * 60 * 60 * 1000;

  function createUpiRedeemExecutor(deps = {}) {
    const {
      addLog: rawAddLog = async () => {},
      appendAccountRunRecord = null,
      chrome,
      completeNodeFromBackground,
      deleteUpiCredentialMembershipCredentials = null,
      ensureContentScriptReadyOnTabUntilStopped = async () => {},
      fetchImpl = (typeof fetch === 'function' ? fetch.bind(globalThis) : null),
      getState = async () => ({}),
      getTabId,
      isTabAlive,
      markCurrentRegistrationAccountTrialIneligible = null,
      markCurrentRegistrationAccountUsed = null,
      now = () => Date.now(),
      registerTab,
      sendTabMessageUntilStopped,
      setPersistentSettings = async () => {},
      setState = async () => {},
      broadcastDataUpdate = null,
      refreshPendingUpiCredentialMembershipRedeemStatuses = null,
      redeemUpiCredentialMembershipFree = null,
      sleepWithStop = async () => {},
      throwIfStopped = () => {},
      upsertTrialEligibleFreeCredential = null,
      waitForTabCompleteUntilStopped = async () => {},
    } = deps;

    const self = typeof globalThis.self !== 'undefined' ? globalThis.self : globalThis;
    const upiRedeemApiClient = self.MultiPageUpiRedeemApiClient?.createUpiRedeemApiClient?.({ fetchImpl }) || null;

    function normalizeString(value = '') {
      return String(value || '').trim();
    }

    function getRedeemChannelStateHelpers() {
      const rootScope = typeof self !== 'undefined' ? self : globalThis;
      return rootScope.MultiPageRedeemChannelState || {};
    }

    function getRedeemCdkeyUsageHelpers() {
      const rootScope = typeof self !== 'undefined' ? self : globalThis;
      return rootScope.MultiPageRedeemCdkeyUsage || {};
    }

    function normalizeRedeemChannel(value = '') {
      const helper = getRedeemChannelStateHelpers().normalizeRedeemChannel;
      if (typeof helper === 'function') {
        return helper(value);
      }
      return normalizeString(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
    }

    function maskExternalApiKey(key = '') {
      const text = normalizeString(key);
      if (!text) {
        return 'empty';
      }
      if (text.length <= 14) {
        return `${text.slice(0, 4)}***${text.slice(-3)}`;
      }
      return `${text.slice(0, 10)}...${text.slice(-6)}`;
    }

    function toIsoTimestamp(value = now()) {
      const timestamp = Math.max(1, Math.floor(Number(value) || Date.now()));
      const date = new Date(timestamp);
      return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }

    function getUpiRedeemStateValue(state = {}, key = '') {
      const helper = getRedeemCdkeyUsageHelpers().getUpiRedeemStateValue;
      if (typeof helper === 'function') {
        return helper(state, key);
      }
      const normalizedKey = normalizeString(key);
      if (!normalizedKey) {
        return undefined;
      }
      if (state?.[normalizedKey] !== undefined) {
        return state[normalizedKey];
      }
      const cdkAliases = {
        cdkPoolText: ['cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText'],
        upiRedeemCdkPoolText: ['upiRedeemCdkPoolText', 'cdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText'],
        upiRedeemCdkeyPoolText: ['upiRedeemCdkeyPoolText', 'cdkPoolText', 'upiRedeemCdkPoolText', 'pixRedeemCdkeyPoolText'],
        pixRedeemCdkeyPoolText: ['pixRedeemCdkeyPoolText', 'cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText'],
        cdkUsage: ['cdkUsage', 'upiRedeemCdkUsage', 'upiRedeemCdkeyUsage', 'pixRedeemCdkeyUsage'],
        upiRedeemCdkUsage: ['upiRedeemCdkUsage', 'cdkUsage', 'upiRedeemCdkeyUsage', 'pixRedeemCdkeyUsage'],
        upiRedeemCdkeyUsage: ['upiRedeemCdkeyUsage', 'cdkUsage', 'upiRedeemCdkUsage', 'pixRedeemCdkeyUsage'],
        pixRedeemCdkeyUsage: ['pixRedeemCdkeyUsage', 'cdkUsage', 'upiRedeemCdkUsage', 'upiRedeemCdkeyUsage'],
      };
      for (const alias of cdkAliases[normalizedKey] || []) {
        if (state?.[alias] !== undefined) {
          return state[alias];
        }
      }
      const legacyKey = normalizedKey.replace(/^upiRedeem/, 'pixRedeem');
      return legacyKey === normalizedKey ? undefined : state?.[legacyKey];
    }

    function hasOwnStateKey(state = {}, key = '') {
      return Boolean(state && typeof state === 'object' && !Array.isArray(state)
        && Object.prototype.hasOwnProperty.call(state, key));
    }

    function preferLatestUpiRedeemDynamicState(merged = {}, latestState = {}) {
      const dynamicKeys = [
        'cdkPoolText',
        'upiRedeemCdkPoolText',
        'upiRedeemCdkeyPoolText',
        'pixRedeemCdkeyPoolText',
        'idealRedeemCdkeyPoolText',
        'cdkUsage',
        'upiRedeemCdkUsage',
        'upiRedeemCdkeyUsage',
        'pixRedeemCdkeyUsage',
        'idealRedeemCdkeyUsage',
      ];
      dynamicKeys.forEach((key) => {
        if (hasOwnStateKey(latestState, key)) {
          merged[key] = latestState[key];
        }
      });
      return merged;
    }

    function getErrorMessage(error) {
      return normalizeString(error?.message || error)
        .replace(new RegExp(`^(?:${UPI_ACCOUNT_INELIGIBLE_ERROR_PREFIX}|${UPI_REDEEM_BACKEND_FAILED_ERROR_PREFIX}|${UPI_REDEEM_AUTH_ERROR_PREFIX}|${UPI_REDEEM_DUPLICATE_CDK_ERROR_PREFIX}|${UPI_REDEEM_NOT_ACCEPTED_ERROR_PREFIX}|${UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX}|PIX_ACCOUNT_INELIGIBLE::)`, 'i'), '');
    }

    function addStepLog(step, message, level = 'info') {
      return rawAddLog(message, level, {
        step,
        stepKey: 'upi-redeem',
      });
    }

    function resolveVisibleStep(state = {}) {
      const visibleStep = Math.floor(Number(state?.visibleStep) || 0);
      return visibleStep > 0 ? visibleStep : 6;
    }

    function shouldMarkRegistrationAccountUsedAfterRedeem(state = {}) {
      return getUpiRedeemStateValue(state, 'upiRedeemContinueAfterRedeem') !== true;
    }

    async function getMergedState(state = {}) {
      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      return preferLatestUpiRedeemDynamicState({
        ...(latestState || {}),
        ...(state || {}),
      }, latestState);
    }

    const upiRedeemModuleContext = {
      constants: {
        CHATGPT_SOURCE,
        CHATGPT_INJECT_FILES,
        SESSION_TAB_COMPLETE_TIMEOUT_MS,
        SESSION_CONTENT_READY_TIMEOUT_MS,
        SESSION_READ_MESSAGE_TIMEOUT_MS,
        SESSION_READ_RESPONSE_TIMEOUT_MS,
        UPI_REDEEM_TIMEOUT_MS,
        UPI_ACCOUNT_INELIGIBLE_ERROR_PREFIX,
        UPI_REDEEM_BACKEND_FAILED_ERROR_PREFIX,
        UPI_REDEEM_AUTH_ERROR_PREFIX,
        UPI_REDEEM_DUPLICATE_CDK_ERROR_PREFIX,
        UPI_REDEEM_NOT_ACCEPTED_ERROR_PREFIX,
        UPI_REDEEM_NETWORK_ERROR_PREFIX,
        UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX,
        CHATGPT_SESSION_API_URL,
        DEFAULT_UPI_REDEEM_API_BASE_URL,
        DEFAULT_UPI_SUBSCRIPTION_API_BASE_URL,
        UPI_ELIGIBILITY_CHECK_MAX_ATTEMPTS,
        UPI_ELIGIBILITY_CHECK_RETRY_DELAYS_MS,
        UPI_AUTO_REDEEM_REMOTE_REFRESH_INTERVAL_MS,
        UPI_AUTO_REDEEM_REMOTE_REFRESH_TIMEOUT_MS,
        UPI_AUTO_REDEEM_REMOTE_REFRESH_ERROR_LOG_INTERVAL_MS,
        UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS_STORAGE_KEY,
        REDEEM_CHANNEL_FAILURE_LIMIT,
        REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS,
      },
      chrome,
      fetchImpl,
      upiRedeemApiClient,
      now,
      getState,
      setState,
      setPersistentSettings,
      broadcastDataUpdate,
      refreshPendingUpiCredentialMembershipRedeemStatuses,
      redeemUpiCredentialMembershipFree,
      sleepWithStop,
      throwIfStopped,
      upsertTrialEligibleFreeCredential,
      completeNodeFromBackground,
      markCurrentRegistrationAccountTrialIneligible,
      markCurrentRegistrationAccountUsed,
      appendAccountRunRecord,
      ensureContentScriptReadyOnTabUntilStopped,
      waitForTabCompleteUntilStopped,
      sendTabMessageUntilStopped,
      registerTab,
      getTabId,
      isTabAlive,
      normalizeString,
      getRedeemChannelStateHelpers,
      getRedeemCdkeyUsageHelpers,
      normalizeRedeemChannel,
      maskExternalApiKey,
      toIsoTimestamp,
      getUpiRedeemStateValue,
      hasOwnStateKey,
      preferLatestUpiRedeemDynamicState,
      getErrorMessage,
      addStepLog,
      resolveVisibleStep,
      shouldMarkRegistrationAccountUsedAfterRedeem,
      getMergedState,
      normalizeUpiRedeemApiBaseUrl,
      getUpiRedeemApiBaseUrl,
      buildUpiRedeemApiUrl,
      buildUPIAccessTokenCheckApiUrl,
      buildUpiRedeemStatusApiUrl,
      buildUpiRedeemCdkeyJobsApiUrl,
      buildUpiRedeemCdkeyJobsCancelApiUrl,
      buildUpiRedeemCdkeyJobsRetryApiUrl,
      normalizeUpiSubscriptionApiBaseUrl,
      getUpiSubscriptionApiBaseUrl,
      buildUpiSubscriptionApiUrl,
      createUpiRedeemClientId,
      resolveUpiRedeemClientId,
    };

    const sessionMaterialFactory = self.MultiPageUpiRedeemSessionMaterial?.createUpiRedeemSessionMaterial;
    const freeEntryFactory = self.MultiPageUpiRedeemFreeEntry?.createUpiRedeemFreeEntry;
    const channelSubmissionFactory = self.MultiPageUpiRedeemChannelSubmission?.createUpiRedeemChannelSubmission;
    const statusPollingFactory = self.MultiPageUpiRedeemStatusPolling?.createUpiRedeemStatusPolling;
    const finalizeFactory = self.MultiPageUpiRedeemFinalize?.createUpiRedeemFinalize;
    if (typeof sessionMaterialFactory !== 'function'
      || typeof freeEntryFactory !== 'function'
      || typeof channelSubmissionFactory !== 'function'
      || typeof statusPollingFactory !== 'function'
      || typeof finalizeFactory !== 'function') {
      throw new Error('UPI redeem executor submodules are not loaded.');
    }
    Object.assign(upiRedeemModuleContext, sessionMaterialFactory(upiRedeemModuleContext));
    Object.assign(upiRedeemModuleContext, statusPollingFactory(upiRedeemModuleContext));
    Object.assign(upiRedeemModuleContext, channelSubmissionFactory(upiRedeemModuleContext));
    Object.assign(upiRedeemModuleContext, freeEntryFactory(upiRedeemModuleContext));
    Object.assign(upiRedeemModuleContext, finalizeFactory(upiRedeemModuleContext));
    const {
      isFetchNetworkError,
      maskAccessToken,
      decodeBase64UrlJson,
      getAccessTokenExpiryMs,
      isAccessTokenExpiredOrNearExpiry,
      getAccessTokenExpiryDescription,
      splitPoolEntrySource,
      parsePoolEntryEmail,
      normalizeVerificationUrlForFreeRecord,
      getEmailFromVerificationUrl,
      getVerificationUrlFromPoolEntry,
      getEmailFromPoolEntry,
      resolveVerificationUrlFromEmailPool,
      resolveCurrentRedeemEmail,
      resolveSessionAccountEmail,
      resolveTargetRedeemEmail,
      assertSessionMatchesTargetEmail,
      normalizeChatGptSessionPayload,
      getChatGptSessionAccessToken,
      getChatGptSessionFieldCount,
      hasChatGptSessionPayload,
      buildUpiRedeemSessionItem,
      normalizeTotpSecret,
      buildCurrentUpiCredentialForMembership,
      isSupportedChatGptSessionUrl,
      getSessionTabHostPriority,
      getSessionTabActivityPriority,
      pickPreferredSessionTab,
      readSupportedSessionTab,
      findFallbackSessionTab,
      resolveSessionTabId,
      getResolvedSessionTab,
      readSessionWithContentMessage,
      readSessionWithScripting,
      extractSessionState,
      readCurrentChatGptSession,
      refreshCurrentChatGptSessionAndReadToken,
      normalizeEmailPoolValues,
      normalizeCustomEmailPoolEntryObjectsForCleanup,
      removeCdkeyFromPoolText,
      removeEmailFromPoolValues,
      buildSuccessfulRedeemCleanupUpdates,
      checkRegistrationUpiTrialEligibility,
      findMembershipResultItem,
      assertTrialEligibleFreeCredentialSaved,
      readPersistedUpiCredentialMembershipResults,
      buildTrialEligibleFreeCredentialPersistRepairPayload,
      writeUpiCredentialMembershipResults,
      ensureTrialEligibleFreeCredentialPersisted,
      applyPaidSubscriptionCleanup,
      writeTrialEligibleFreeRedeemState,
      getRedeemChannelLabel,
      getRedeemChannelFailureField,
      getRedeemChannelFailureCount,
      getRedeemChannelDailyLimitBlockedAtField,
      getRedeemChannelDailyLimitBlockedUntilField,
      getRedeemChannelDailyLimitReasonField,
      isRedeemChannelDailyLimitReason,
      isRedeemCrossRegionPaymentUnavailableReason,
      buildRedeemChannelDailyLimitPatch,
      isRedeemChannelDailyLimitBlocked,
      isRedeemAccountLocked,
      buildRedeemAccountUnlockedPatch,
      buildRedeemChannelFailurePatch,
      shouldRedeemItemUseChannel,
      getRedeemChannelSkipReason,
      getRedeemChannelPoolKey,
      getRedeemChannelUsageKey,
      getRedeemChannelPoolText,
      getRedeemChannelUsage,
      getAvailableCdkeysForChannel,
      buildRedeemChannelUsageUpdates,
      normalizeUpiRedeemCdkeyUsage,
      isActiveRemoteStatus,
      isCdkeyRedeemInFlight,
      isReusableInactiveSubscriptionRemoteStatus,
      isCdkeySelectableForRedeem,
      pickFirstUnusedCdkey,
      getAvailableRedeemCdkeys,
      countAvailableRedeemCdkeys,
      updateCdkeyUsage,
      reserveCdkeyForRedeemSubmission,
      releaseCdkeyForUnacceptedSubmission,
      readResponseBody,
      getPayloadError,
      getPayloadErrorDetails,
      isUpiAccessTokenExpiredPayload,
      isUpiAccessTokenExpiredError,
      recordAccessTokenExpiredCdkeyAttempt,
      getTrialEligibilityApiHelpers,
      normalizeTrialEligibilityApiItem,
      isTrialEligibilityAccountIneligibleDecision,
      isTrialEligibilityTokenInvalidDecision,
      buildTrialEligibilityEmailMismatchReason,
      buildTrialEligibilityResultPatch,
      isTrialEligibilityChannelAllowed,
      isEligibilityResultPayload,
      getEligibilityItem,
      getEligibilityFailureMessage,
      isEligibilityTokenInvalidItem,
      isEligibilityAccountIneligibleItem,
      isUpiRedeemBackendFailureMessage,
      isUpiRedeemDuplicateCdkeyMessage,
      isUpiRedeemDuplicateCdkeyError,
      isUpiRedeemNotAcceptedError,
      isUpiRedeemApiAuthError,
      isUpiAccountIneligibleError,
      isRecoverableUpiEligibilityError,
      getRedeemItemFailureMessage,
      getPayloadCdkeyItem,
      isRedeemAcceptedStatus,
      isRedeemPayloadItemAccepted,
      getPositiveRedeemAcceptedCount,
      confirmUpiRedeemSubmissionAccepted,
      getResponseContentType,
      isHtmlResponsePayload,
      postUPIJson,
      postSubscriptionJson,
      postEligibilityCheckJson,
      checkUPIAccessTokenEligibility,
      postUpiRedeem,
      releaseCdkeyForApproveBlocked,
      checkUpiRedeemAccessTokenEligibility,
      redeemUpiCredentialWithAccessToken,
      isFlowStoppedError,
      shouldCountAutoRedeemFailure,
      normalizeBoolean,
      getUpiRedeemRemoteJobCapabilities,
      getUpiRedeemJobResultCdkey,
      getUpiRedeemJobResultReason,
      normalizeSubscriptionPlanType,
      isPaidSubscriptionPlan,
      getPaidSubscriptionPlanLabel,
      hasOwnValue,
      isSubscriptionPayloadOk,
      getSubscriptionPayloadPlanType,
      isActivePlusSubscriptionPayload,
      getPayloadItems,
      isFailureStatus,
      normalizeUpiRedeemRemoteStatus,
      normalizeApproveBlockedToken,
      isApproveBlockedRemoteResult,
      isApproveBlockedError,
      getRemoteResultEmail,
      isSuccessfulRemoteStatus,
      isUnusedRemoteStatus,
      isRetryableRemoteStatus,
      isRecoverableCdkeyUsageEntry,
      mergeCdkeysWithRecoverableUsage,
      getRemoteStatusMessage,
      getRemoteStatusTimestamp,
      chunkArray,
      refreshUpiRedeemCdkeyStatuses,
      operateUpiRedeemCdkeyJobs,
      cancelUpiRedeemCdkeyJobs,
      retryUpiRedeemCdkeyJobs,
      checkUpiRedeemSubscriptionStatuses,
      confirmCurrentRedeemPaidSubscription,
      getSubscriptionConfirmationReason,
      recordCdkeySubscriptionConfirmation,
      findPendingAutoRedeemResultItem,
      waitForSubmittedAutoRedeemRemoteRefresh,
      isAutoRedeemResultInFlight,
      buildQueuedFreeAutoRedeemCandidates,
      autoRedeemQueuedFreeCredentialsForChannel,
      attemptAutoRedeemTrialEligibleFreeCredentialChannel,
      autoRedeemTrialEligibleFreeCredential,
      executeUpiRedeem,
    } = upiRedeemModuleContext;
    function normalizeUpiRedeemApiBaseUrl(value = '') {
      let normalized = normalizeString(value || DEFAULT_UPI_REDEEM_API_BASE_URL)
        .replace(/#.*$/g, '')
        .replace(/\/+$/g, '');
      normalized = normalized
        .replace(/\/api\/external\/cdkey-jobs\/(?:cancel|retry)$/i, '')
        .replace(/\/api\/external\/cdkey-jobs$/i, '')
        .replace(/\/api\/external\/cdkey-redeems\/status$/i, '')
        .replace(/\/api\/external\/cdkey-redeems$/i, '')
        .replace(/\/api\/v1\/subscription$/i, '')
        .replace(/\/api\/v1\/check$/i, '')
        .replace(/\/api\/v1\/totp\/(?:enable|lookup)$/i, '')
        .replace(/\/api\/?$/i, '')
        .replace(/\/+$/g, '');
      return normalized || DEFAULT_UPI_REDEEM_API_BASE_URL;
    }

    function getUpiRedeemApiBaseUrl(state = {}) {
      return normalizeUpiRedeemApiBaseUrl(DEFAULT_UPI_REDEEM_API_BASE_URL);
    }

    function buildUpiRedeemApiUrl(state = {}) {
      return `${getUpiRedeemApiBaseUrl(state)}/api/external/cdkey-redeems`;
    }

    function buildUPIAccessTokenCheckApiUrl(state = {}) {
      return `${getUpiSubscriptionApiBaseUrl(state)}/api/v1/check`;
    }

    function buildUpiRedeemStatusApiUrl(state = {}) {
      return `${getUpiRedeemApiBaseUrl(state)}/api/external/cdkey-redeems/status`;
    }

    function buildUpiRedeemCdkeyJobsApiUrl(state = {}, action = '') {
      const normalizedAction = normalizeString(action).toLowerCase();
      if (!['cancel', 'retry'].includes(normalizedAction)) {
        throw new Error(`不支持的 CDK Jobs 操作：${action}`);
      }
      return `${getUpiRedeemApiBaseUrl(state)}/api/external/cdkey-jobs/${normalizedAction}`;
    }

    function buildUpiRedeemCdkeyJobsCancelApiUrl(state = {}) {
      return buildUpiRedeemCdkeyJobsApiUrl(state, 'cancel');
    }

    function buildUpiRedeemCdkeyJobsRetryApiUrl(state = {}) {
      return buildUpiRedeemCdkeyJobsApiUrl(state, 'retry');
    }

    function normalizeUpiSubscriptionApiBaseUrl(value = '') {
      let normalized = normalizeString(value || DEFAULT_UPI_SUBSCRIPTION_API_BASE_URL).replace(/#.*$/g, '').replace(/\/+$/g, '');
      normalized = normalized.replace(/\/api\/v1\/subscription$/i, '');
      normalized = normalized.replace(/\/api\/v1\/check$/i, '');
      normalized = normalized.replace(/\/api\/v1\/totp\/(?:enable|lookup)$/i, '');
      normalized = normalized.replace(/\/api$/i, '');
      return normalized.replace(/\/+$/g, '') || DEFAULT_UPI_SUBSCRIPTION_API_BASE_URL;
    }

    function getUpiSubscriptionApiBaseUrl(state = {}) {
      return normalizeUpiSubscriptionApiBaseUrl(
        getUpiRedeemStateValue(state, 'upiSubscriptionApiBaseUrl')
        || state?.totpMfaApiBaseUrl
        || state?.totpMfaLookupApiBaseUrl
        || DEFAULT_UPI_SUBSCRIPTION_API_BASE_URL
      );
    }

    function buildUpiSubscriptionApiUrl(value = '') {
      const baseUrl = normalizeUpiSubscriptionApiBaseUrl(value);
      if (!baseUrl) {
        throw new Error('UPI 订阅查询 API 未配置，请先在侧边栏填写订阅 API 地址。');
      }
      return `${baseUrl}/api/v1/subscription`;
    }

    function createUpiRedeemClientId() {
      const stamp = Math.max(1, Math.floor(Number(now()) || Date.now())).toString(36);
      const randomPart = Math.random().toString(36).slice(2, 10) || 'local';
      return `cdk-redeem-${stamp}-${randomPart}`;
    }

    async function resolveUpiRedeemClientId(state = {}) {
      const existing = normalizeString(getUpiRedeemStateValue(state, 'upiRedeemClientId'));
      if (existing) {
        return existing;
      }
      const generated = createUpiRedeemClientId();
      await setState({ upiRedeemClientId: generated });
      return generated;
    }

    function parseCdkeyPoolText(value = '') {
      const seen = new Set();
      return String(value || '')
        .replace(/\r/g, '')
        .split('\n')
        .map((line) => normalizeString(line))
        .filter((line) => {
          if (!line || seen.has(line)) {
            return false;
          }
          seen.add(line);
          return true;
        });
    }

    return {
      buildUpiRedeemStatusApiUrl,
      buildUpiSubscriptionApiUrl,
      normalizeUpiSubscriptionApiBaseUrl,
      checkUpiRedeemSubscriptionStatuses,
      checkUpiRedeemAccessTokenEligibility,
      checkRegistrationUpiTrialEligibility,
      buildUpiRedeemApiUrl,
      buildUpiRedeemCdkeyJobsCancelApiUrl,
      buildUpiRedeemCdkeyJobsRetryApiUrl,
      executeUpiRedeem,
      isSupportedChatGptSessionUrl,
      normalizeUpiRedeemCdkeyUsage,
      parseCdkeyPoolText,
      cancelUpiRedeemCdkeyJobs,
      redeemUpiCredentialWithAccessToken,
      refreshUpiRedeemCdkeyStatuses,
      retryUpiRedeemCdkeyJobs,
    };
  }

  return {
    createUpiRedeemExecutor,
  };
});
