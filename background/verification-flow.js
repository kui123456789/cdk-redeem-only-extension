(function attachBackgroundVerificationFlow(root, factory) {
  root.MultiPageBackgroundVerificationFlow = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createBackgroundVerificationFlowModule() {
  const ICLOUD_MAIL_POLL_MIN_ATTEMPTS = 5;
  const ICLOUD_MAIL_POLL_TIMEOUT_MARGIN_MS = 25000;
  const ASSURIVO_VERIFICATION_OPEN_URL = 'https://assurivo.com/console/open.php';
  const ASSURIVO_VERIFICATION_FEED_URL = 'https://assurivo.com/console/feed.php';
  const DEFAULT_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS = 10;
  const MAX_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS = 300;
  const ASSURIVO_VERIFICATION_FILTER_SKEW_MS = 90000;
  const ASSURIVO_RESEND_SAME_CODE_GRACE_MS = 3000;
  const STEP4_ASSURIVO_RESEND_CONFIRM_TIMEOUT_MS = 90000;
  const STEP4_ASSURIVO_EMPTY_FEED_WAIT_MS = 180000;
  const POST_SUBMIT_CONFIRM_TIMEOUT_MS = 60000;
  const POST_SUBMIT_CONFIRM_POLL_INTERVAL_MS = 1000;
  const STEP4_STUCK_VERIFICATION_RESUBMIT_LIMIT = 2;
  const HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE = [
    '(?:सत्यापन|वेरिफिकेशन)\\s*कोड',
    '(?:अस्थायी|अस्थाई)\\s+(?:सत्यापन|वेरिफिकेशन)\\s*कोड',
    '(?:chatgpt|openai)\\s*(?:का\\s*)?(?:सत्यापन|वेरिफिकेशन)\\s*कोड',
    'कोड\\s*(?:दर्ज|प्रविष्ट|डालें|भरें)\\s*(?:करें)?',
    '(?:दर्ज|प्रविष्ट|डालें|भरें)\\s*(?:करें)?\\s*कोड',
    'जारी\\s+रखने\\s+के\\s+लिए',
    '(?:एक\\s*बार|एकबार)\\s*(?:का\\s*)?(?:कोड|पासकोड)',
    'ओटीपी',
    'otp',
  ].join('|');
  const ASSURIVO_TIMESTAMP_LOG_TIME_ZONE = 'Asia/Shanghai';

  function createVerificationFlowHelpers(deps = {}) {
    const {
      addLog: rawAddLog = async () => {},
      buildVerificationPollPayload: externalBuildVerificationPollPayload = null,
      chrome,
      closeConflictingTabsForSource,
      CLOUDFLARE_TEMP_EMAIL_PROVIDER,
      CLOUD_MAIL_PROVIDER = 'cloudmail',
      FREEMAIL_PROVIDER = 'freemail',
      ICLOUD_API_PROVIDER = 'icloud-api',
      MOEMAIL_PROVIDER = 'moemail',
      YYDSMAIL_PROVIDER = 'yydsmail',
      OUTLOOK_EMAIL_PLUS_PROVIDER = 'outlook-email-plus',
      completeNodeFromBackground,
      confirmCustomVerificationStepBypassRequest,
      getNodeIdByStepForState,
      getHotmailVerificationPollConfig,
      getHotmailVerificationRequestTimestamp,
      handleMail2925LimitReachedError,
      getState,
      getTabId,
      HOTMAIL_PROVIDER,
      isMail2925LimitReachedError,
      isStopError,
      LUCKMAIL_PROVIDER,
      MAIL_2925_VERIFICATION_INTERVAL_MS,
      MAIL_2925_VERIFICATION_MAX_ATTEMPTS,
      pollCloudflareTempEmailVerificationCode,
      pollCloudMailVerificationCode,
      pollFreemailVerificationCode,
      pollIcloudApiVerificationCode,
      pollMoemailVerificationCode,
      pollYydsMailVerificationCode,
      pollOutlookEmailPlusVerificationCode,
      pollHotmailVerificationCode,
      pollLuckmailVerificationCode,
      sendToContentScript,
      sendToContentScriptResilient,
      sendToMailContentScriptResilient,
      setNodeStatus,
      setState,
      sleepWithStop,
      throwIfStopped,
      VERIFICATION_POLL_MAX_ROUNDS,
      fetch: fetchImpl = null,
    } = deps;
    let activeVerificationLogStep = null;

    function normalizeLogStep(value) {
      const step = Math.floor(Number(value) || 0);
      return step > 0 ? step : null;
    }

    function normalizeVerificationLogMessage(message) {
      return String(message || '')
        .replace(/^步骤\s*\d+\s*[:：]\s*/, '')
        .replace(/^Step\s+\d+\s*[:：]\s*/i, '')
        .trim();
    }

    function addLog(message, level = 'info', options = {}) {
      const normalizedOptions = options && typeof options === 'object' ? { ...options } : {};
      const step = normalizeLogStep(normalizedOptions.step || normalizedOptions.visibleStep)
        || normalizeLogStep(activeVerificationLogStep);
      if (step) {
        normalizedOptions.step = step;
        if (!normalizedOptions.stepKey) {
          normalizedOptions.stepKey = step === 4 ? 'fetch-signup-code' : 'fetch-login-code';
        }
      }
      delete normalizedOptions.visibleStep;
      return rawAddLog(normalizeVerificationLogMessage(message), level, normalizedOptions);
    }

    async function getNodeIdForStep(step) {
      const state = typeof getState === 'function' ? await getState() : {};
      return typeof getNodeIdByStepForState === 'function'
        ? String(getNodeIdByStepForState(step, state) || '').trim()
        : '';
    }

    const isRetryableVerificationTransportError = typeof deps.isRetryableContentScriptTransportError === 'function'
      ? deps.isRetryableContentScriptTransportError
      : ((error) => /back\/forward cache|message channel is closed|Receiving end does not exist|port closed before a response was received|A listener indicated an asynchronous response|内容脚本\s+\d+(?:\.\d+)?\s*秒内未响应|did not respond in \d+s/i.test(
        String(typeof error === 'string' ? error : error?.message || '')
      ));

    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    const verificationModuleContext = {
      constants: {
        ICLOUD_MAIL_POLL_MIN_ATTEMPTS,
        ICLOUD_MAIL_POLL_TIMEOUT_MARGIN_MS,
        ASSURIVO_VERIFICATION_OPEN_URL,
        ASSURIVO_VERIFICATION_FEED_URL,
        DEFAULT_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS,
        MAX_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS,
        ASSURIVO_VERIFICATION_FILTER_SKEW_MS,
        ASSURIVO_RESEND_SAME_CODE_GRACE_MS,
        STEP4_ASSURIVO_RESEND_CONFIRM_TIMEOUT_MS,
        STEP4_ASSURIVO_EMPTY_FEED_WAIT_MS,
        POST_SUBMIT_CONFIRM_TIMEOUT_MS,
        POST_SUBMIT_CONFIRM_POLL_INTERVAL_MS,
        STEP4_STUCK_VERIFICATION_RESUBMIT_LIMIT,
        HINDI_VERIFICATION_KEYWORD_PATTERN_SOURCE,
        ASSURIVO_TIMESTAMP_LOG_TIME_ZONE,
      },
      chrome,
      closeConflictingTabsForSource,
      CLOUDFLARE_TEMP_EMAIL_PROVIDER,
      CLOUD_MAIL_PROVIDER,
      FREEMAIL_PROVIDER,
      ICLOUD_API_PROVIDER,
      MOEMAIL_PROVIDER,
      YYDSMAIL_PROVIDER,
      OUTLOOK_EMAIL_PLUS_PROVIDER,
      completeNodeFromBackground,
      confirmCustomVerificationStepBypassRequest,
      getNodeIdByStepForState,
      getHotmailVerificationPollConfig,
      getHotmailVerificationRequestTimestamp,
      handleMail2925LimitReachedError,
      getState,
      getTabId,
      HOTMAIL_PROVIDER,
      isMail2925LimitReachedError,
      isStopError,
      LUCKMAIL_PROVIDER,
      MAIL_2925_VERIFICATION_INTERVAL_MS,
      MAIL_2925_VERIFICATION_MAX_ATTEMPTS,
      pollCloudflareTempEmailVerificationCode,
      pollCloudMailVerificationCode,
      pollFreemailVerificationCode,
      pollIcloudApiVerificationCode,
      pollMoemailVerificationCode,
      pollYydsMailVerificationCode,
      pollOutlookEmailPlusVerificationCode,
      pollHotmailVerificationCode,
      pollLuckmailVerificationCode,
      sendToContentScript,
      sendToContentScriptResilient,
      sendToMailContentScriptResilient,
      setNodeStatus,
      setState,
      sleepWithStop,
      throwIfStopped,
      VERIFICATION_POLL_MAX_ROUNDS,
      fetchImpl,
      normalizeLogStep,
      normalizeVerificationLogMessage,
      addLog,
      getNodeIdForStep,
      isRetryableVerificationTransportError,
    };

    const assurivoTimeFactory = rootScope.MultiPageVerificationAssurivoTime?.createVerificationAssurivoTime;
    const verificationKeywordsFactory = rootScope.MultiPageVerificationKeywords?.createVerificationKeywords;
    const codeExtractorFactory = rootScope.MultiPageVerificationCodeExtractor?.createVerificationCodeExtractor;
    const assurivoFeedClientFactory = rootScope.MultiPageAssurivoFeedClient?.createAssurivoFeedClient;
    const resendControllerFactory = rootScope.MultiPageVerificationResendController?.createVerificationResendController;
    if (typeof assurivoTimeFactory !== 'function'
      || typeof verificationKeywordsFactory !== 'function'
      || typeof codeExtractorFactory !== 'function'
      || typeof assurivoFeedClientFactory !== 'function'
      || typeof resendControllerFactory !== 'function') {
      throw new Error('Verification flow submodules are not loaded.');
    }
    Object.assign(verificationModuleContext, assurivoTimeFactory(verificationModuleContext));
    Object.assign(verificationModuleContext, verificationKeywordsFactory(verificationModuleContext));
    Object.assign(verificationModuleContext, codeExtractorFactory(verificationModuleContext));
    Object.assign(verificationModuleContext, assurivoFeedClientFactory(verificationModuleContext));
    Object.assign(verificationModuleContext, resendControllerFactory(verificationModuleContext));
    const {
      extractAssurivoOpenPageMailTimestamp,
      getOrderedAssurivoOpenPageMailBlocks,
      hasOnlyOlderTimestampedAssurivoOpenPageEntries,
      formatVerificationTimestampForLog,
      formatAssurivoTimestampForLog,
      normalizeVerificationTimestampMs,
      parseVerificationTimestampString,
      parseVerificationTimestampValue,
      isVerificationTimestampKey,
      extractVerificationEntryTimestamp,
      parseAssurivoChinaTimestampString,
      extractAssurivoFeedEntryTimestamp,
      normalizeFilterAfterTimestamp,
      getOrderedAssurivoVerificationEntries,
      hasOnlyOlderTimestampedAssurivoEntries,
      getLatestAssurivoEntryTimestamp,
      describeAssurivoFilterTiming,
      parseAssurivoTimestamp,
      isAssurivoVerificationPayload,
      collectAssurivoFieldStrings,
      getAssurivoEntryBodyText,
      getAssurivoEntryMetadataText,
      isAssurivoFeedVerificationEntry,
      isVerificationMailText,
      normalizeDigits,
      collectCodesFromText,
      decodeHtmlEntitiesForVerificationText,
      htmlToVerificationSearchText,
      shouldAllowBareCodeForVerificationCandidate,
      sanitizeVerificationBodyForBareCodeSearch,
      collectUniqueBareBodyVerificationCodes,
      extractCodeFromText,
      collectCustomEmailVerificationTextCandidates,
      collectCustomEmailVerificationCodes,
      collectAssurivoOpenPageBodyCodes,
      extractSingleBareAssurivoBodyCodeDetails,
      getStrictVerificationBodyCodeDetails,
      collectStrictVerificationBodyCodes,
      extractFirstEmailCodeFromOrderedEntries,
      extractStrictVerificationCodeFromBody,
      isRetryableCustomEmailVerificationFetchError,
      isAssurivoEmptyFeedVerificationFetchError,
      normalizeEmailForComparison,
      normalizeCustomEmailVerificationUrl,
      parseCustomEmailPoolEntryValue,
      buildLinlinflowMailApiUrl,
      buildLinlinflowLatestApiUrl,
      getCustomEmailVerificationRequestUrl,
      getCustomEmailVerificationRequestLabel,
      normalizeCustomEmailPoolEntryForVerification,
      getCustomEmailVerificationEntry,
      extractAssurivoOpenPageMailBlocks,
      extractAssurivoOpenPageVerificationCode,
      extractAssurivoFeedVerificationCodeDetails,
      isLinlinflowMailApiPayload,
      extractLinlinflowMailApiCode,
      extractCustomEmailVerificationCode,
      extractCustomEmailVerificationCodeDetails,
      parseCustomEmailVerificationPayloadText,
      describeCustomEmailVerificationPayload,
      normalizeAssurivoCredentialParts,
      buildAssurivoVerificationUrl,
      isAssurivoOpenVerificationUrl,
      isAssurivoFeedVerificationUrl,
      buildAssurivoFeedVerificationUrlFromUrl,
      shouldUseAssurivoCredentialUrl,
      isIcloudMail,
      normalizeIcloudMailPollPayload,
      getMailPollingResponseTimeoutMs,
      resolveMailPollingTimeouts,
      fetchCustomEmailVerificationCode,
      fetchAssurivoFeed,
      getVerificationCodeStateKey,
      getVerificationCodeLabel,
      normalizeSignupVerificationCodeWaitSeconds,
      waitBeforeFetchingSignupVerificationCode,
      isLikelyLoggedInChatgptHomeUrl,
      isSignupProfilePageUrl,
      isPasskeyEnrollmentPageUrl,
      isStep4PendingVerificationSubmitResult,
      detectStep4PostSubmitFallback,
      getStep4FallbackLabel,
      buildStep4FallbackSubmitSuccess,
      detectStep8PostSubmitFallback,
      getVerificationResendStateKey,
      normalizeVerificationResendCount,
      getVerificationRequestedAtStateKey,
      normalizeVerificationRequestedAtCandidate,
      resolveInitialVerificationRequestedAt,
      getLegacyVerificationResendCountDefault,
      getConfiguredVerificationResendCount,
      resolveMaxResendRequests,
      getCompletionStep,
      confirmCustomVerificationStepBypass,
      getVerificationPollPayload,
      getRemainingTimeBudgetMs,
      getResponseTimeoutMsForStep,
      applyMailPollingTimeBudget,
      requestVerificationCodeResend,
      shouldPreclear2925Mailbox,
      clear2925MailboxBeforePolling,
      closeIcloudMailboxTabAfterSuccess,
      triggerPostSuccessMailboxCleanup,
      pollFreshVerificationCodeWithResendInterval,
      shouldRequestLuckmailResendBeforeRetry,
      pollLuckmailVerificationCodeWithResend,
      pollFreshVerificationCode,
      submitVerificationCode,
      resolveCustomEmailVerificationStep,
      fetchVerificationCodeOnly,
      resolveVerificationStep,
    } = verificationModuleContext;
    return {
      confirmCustomVerificationStepBypass,
      getVerificationCodeLabel,
      getVerificationCodeStateKey,
      getVerificationPollPayload,
      pollFreshVerificationCode,
      pollFreshVerificationCodeWithResendInterval,
      fetchVerificationCodeOnly,
      requestVerificationCodeResend,
      resolveCustomEmailVerificationStep,
      resolveVerificationStep,
      submitVerificationCode,
      __test: {
        extractCustomEmailVerificationCode,
        fetchCustomEmailVerificationCode,
        fetchVerificationCodeOnly,
        buildAssurivoVerificationUrl,
        getCustomEmailVerificationEntry,
        normalizeCustomEmailVerificationUrl,
        parseCustomEmailPoolEntryValue,
      },
    };
  }

  return {
    createVerificationFlowHelpers,
  };
});
