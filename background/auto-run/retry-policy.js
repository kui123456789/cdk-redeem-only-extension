(function attachBackgroundAutoRunRetryPolicy(root, factory) {
  const api = factory();
  if (root) {
    root.MultiPageBackgroundAutoRunRetryPolicy = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createBackgroundAutoRunRetryPolicyModule() {
  function createAutoRunRetryPolicy(deps = {}) {
    const getErrorMessage = typeof deps.getErrorMessage === 'function'
      ? deps.getErrorMessage
      : (error) => String(error?.message || error || '');
    const isHostedCheckoutCardFallbackFailure = typeof deps.isHostedCheckoutCardFallbackFailure === 'function'
      ? deps.isHostedCheckoutCardFallbackFailure
      : (typeof globalThis.isHostedCheckoutCardFallbackFailure === 'function'
          ? globalThis.isHostedCheckoutCardFallbackFailure.bind(globalThis)
          : null);

    function normalizeRecordNode(value = '') {
      return String(value || '').trim();
    }

    function extractNodeFromRecordStatus(status = '') {
      const match = String(status || '').trim().match(/^node:([^:]+):(failed|stopped)$/i);
      return match ? normalizeRecordNode(match[1]) : '';
    }

    function getKnownNodeIdsFromState(state = {}) {
      const ids = new Set();
      for (const key of Object.keys(state?.nodeStatuses || {})) {
        const nodeId = normalizeRecordNode(key);
        if (nodeId) {
          ids.add(nodeId);
        }
      }

      const currentNodeId = normalizeRecordNode(state?.currentNodeId);
      if (currentNodeId) {
        ids.add(currentNodeId);
      }

      return Array.from(ids);
    }

    function inferRecordNodeFromState(state = {}, preferredStatuses = []) {
      const statuses = state?.nodeStatuses || {};
      const preferredStatusSet = new Set(preferredStatuses.map((item) => String(item || '').trim()).filter(Boolean));
      const nodeIds = getKnownNodeIdsFromState(state);
      const currentNodeId = normalizeRecordNode(state?.currentNodeId);

      if (currentNodeId && preferredStatusSet.has(String(statuses[currentNodeId] || '').trim())) {
        return currentNodeId;
      }

      const matchingNodes = nodeIds.filter((nodeId) => preferredStatusSet.has(String(statuses[nodeId] || '').trim()));
      if (matchingNodes.length) {
        return matchingNodes[matchingNodes.length - 1];
      }

      if (currentNodeId) {
        const currentStatus = String(statuses[currentNodeId] || '').trim();
        if (!['', 'pending', 'completed', 'manual_completed', 'skipped'].includes(currentStatus)) {
          return currentNodeId;
        }
      }

      return '';
    }

    function inferRecordNodeFromError(errorLike = null) {
      if (!errorLike || typeof errorLike !== 'object') {
        return '';
      }

      return normalizeRecordNode(errorLike.failedNodeId)
        || normalizeRecordNode(errorLike.nodeId)
        || normalizeRecordNode(errorLike.currentNodeId);
    }

    function resolveAutoRunAccountRecordStatus(status, state = {}, errorLike = null) {
      const normalizedStatus = String(status || '').trim().toLowerCase();
      const explicitNode = extractNodeFromRecordStatus(status);
      if (explicitNode) {
        return `node:${explicitNode}:${normalizedStatus.endsWith(':stopped') ? 'stopped' : 'failed'}`;
      }
      if (normalizedStatus === 'failed') {
        const failedNode = inferRecordNodeFromError(errorLike)
          || inferRecordNodeFromState(state, ['failed', 'running']);
        return failedNode ? `node:${failedNode}:failed` : status;
      }

      if (normalizedStatus === 'stopped') {
        const stoppedNode = inferRecordNodeFromError(errorLike)
          || inferRecordNodeFromState(state, ['stopped', 'running']);
        return stoppedNode ? `node:${stoppedNode}:stopped` : status;
      }

      return status;
    }

    function isUpiAccountIneligibleFailure(error) {
      const rawMessage = String(typeof error === 'string' ? error : error?.message || '');
      const message = String(getErrorMessage(error) || rawMessage);
      const combinedMessage = `${rawMessage}\n${message}`;
      return /UPI_ACCOUNT_INELIGIBLE::|UPI\s*资格检查失败[：:][\s\S]*账号无资格|UPI[\s\S]*(?:account|账号)[\s\S]*(?:ineligible|无资格)/i.test(combinedMessage);
    }

    function getMaxAttemptsForRound(options = {}) {
      const attemptRun = Math.max(1, Math.floor(Number(options.attemptRun) || 1));
      const maxRetriesPerRound = Math.max(0, Math.floor(Number(deps.AUTO_RUN_MAX_RETRIES_PER_ROUND) || 0));
      return options.autoRunSkipFailures || options.autoRunRetryNonFreeTrial || options.autoRunRetryLegacyWalletCallback
        ? maxRetriesPerRound + 1
        : Math.max(maxRetriesPerRound + 1, attemptRun);
    }

    function evaluateAttemptFailure(options = {}) {
      const error = options.error;
      const attemptRun = Math.max(1, Math.floor(Number(options.attemptRun) || 1));
      const maxAttemptsForRound = Math.max(
        attemptRun,
        Math.floor(Number(options.maxAttemptsForRound) || getMaxAttemptsForRound(options))
      );
      const maxRetryAttempts = Math.max(1, Math.floor(Number(deps.AUTO_RUN_MAX_RETRIES_PER_ROUND) || 0) + 1);
      const reason = String(getErrorMessage(error) || '').trim()
        || String(error?.message || error || '未知错误');

      const blockedByUpiAccountIneligible = isUpiAccountIneligibleFailure(error);
      const blockedByPlusNonFreeTrial = !blockedByUpiAccountIneligible
        && typeof deps.isChatgptSessionReaderNonFreeTrialFailure === 'function'
        && deps.isChatgptSessionReaderNonFreeTrialFailure(error);
      const blockedByUpiRedeemBackendFailure = typeof deps.isUpiRedeemBackendFailure === 'function'
        && deps.isUpiRedeemBackendFailure(error);
      const blockedByUpiRedeemNetworkFailure = typeof deps.isUpiRedeemNetworkFailure === 'function'
        && deps.isUpiRedeemNetworkFailure(error);
      const blockedByCardHelperTaskEnded = typeof deps.isCardHelperTaskEndedFailure === 'function'
        ? deps.isCardHelperTaskEndedFailure(error)
        : /CARD_HELPER_TASK_ENDED::/i.test(error?.message || String(error || ''));
      const blockedByHostedCheckoutGenericError = typeof deps.isHostedCheckoutGenericErrorFailure === 'function'
        ? deps.isHostedCheckoutGenericErrorFailure(error)
        : /HOSTED_CHECKOUT_GENERIC_ERROR::/i.test(error?.message || String(error || ''));
      const blockedByHostedCheckoutCardFallback = typeof isHostedCheckoutCardFallbackFailure === 'function'
        ? isHostedCheckoutCardFallbackFailure(error)
        : /HOSTED_CHECKOUT_CARD_FALLBACK::/i.test(error?.message || String(error || ''));
      const blockedByHostedCheckoutVerificationResendLimit = typeof deps.isHostedCheckoutVerificationResendLimitFailure === 'function'
        ? deps.isHostedCheckoutVerificationResendLimitFailure(error)
        : /HOSTED_CHECKOUT_VERIFICATION_RESEND_LIMIT::/i.test(error?.message || String(error || ''));
      const blockedByCloudCheckoutAlreadyPaid = typeof deps.isCloudCheckoutAlreadyPaidFailure === 'function'
        ? deps.isCloudCheckoutAlreadyPaidFailure(error)
        : /\buser\s+is\s+already\s+paid\b|already\s+(?:paid|subscribed)/i.test(error?.message || String(error || ''));
      const blockedBySignupUserAlreadyExists = typeof deps.isSignupUserAlreadyExistsFailure === 'function'
        && deps.isSignupUserAlreadyExistsFailure(error);
      const blockedByStep4Route405 = typeof deps.isStep4Route405RecoveryLimitFailure === 'function'
        && deps.isStep4Route405RecoveryLimitFailure(error);

      const retryablePlusNonFreeTrial = blockedByPlusNonFreeTrial
        && options.autoRunRetryNonFreeTrial
        && attemptRun < maxRetryAttempts;
      const retryableUpiRedeemBackendFailure = blockedByUpiRedeemBackendFailure
        && attemptRun < maxRetryAttempts;
      const retryableUpiRedeemNetworkFailure = blockedByUpiRedeemNetworkFailure
        && attemptRun < maxRetryAttempts;
      const retryableHostedCheckoutGenericError = blockedByHostedCheckoutGenericError
        && options.autoRunRetryLegacyWalletCallback
        && attemptRun < maxRetryAttempts;
      const retryableHostedCheckoutCardFallback = blockedByHostedCheckoutCardFallback
        && attemptRun < maxRetryAttempts;
      const canRetry = !blockedByUpiAccountIneligible
        && !blockedByPlusNonFreeTrial
        && !blockedByUpiRedeemBackendFailure
        && !blockedByUpiRedeemNetworkFailure
        && !blockedByCardHelperTaskEnded
        && !blockedByHostedCheckoutGenericError
        && !blockedByHostedCheckoutCardFallback
        && !blockedByHostedCheckoutVerificationResendLimit
        && !blockedByCloudCheckoutAlreadyPaid
        && !blockedBySignupUserAlreadyExists
        && options.autoRunSkipFailures
        && attemptRun < maxAttemptsForRound;

      return {
        reason,
        attemptRun,
        autoRunSkipFailures: Boolean(options.autoRunSkipFailures),
        autoRunRetryNonFreeTrial: Boolean(options.autoRunRetryNonFreeTrial),
        autoRunRetryLegacyWalletCallback: Boolean(options.autoRunRetryLegacyWalletCallback),
        maxAttemptsForRound,
        maxRetryAttempts,
        blockedByCardHelperTaskEnded,
        blockedByCloudCheckoutAlreadyPaid,
        blockedByHostedCheckoutCardFallback,
        blockedByHostedCheckoutGenericError,
        blockedByHostedCheckoutVerificationResendLimit,
        blockedByPlusNonFreeTrial,
        blockedBySignupUserAlreadyExists,
        blockedByStep4Route405,
        blockedByUpiAccountIneligible,
        blockedByUpiRedeemBackendFailure,
        blockedByUpiRedeemNetworkFailure,
        canRetry,
        restartCurrentAttempt: typeof deps.isRestartCurrentAttemptError === 'function'
          && deps.isRestartCurrentAttemptError(error),
        retryableHostedCheckoutCardFallback,
        retryableHostedCheckoutGenericError,
        retryablePlusNonFreeTrial,
        retryableUpiRedeemBackendFailure,
        retryableUpiRedeemNetworkFailure,
      };
    }

    function selectFailureAction(result = {}) {
      if (result.retryablePlusNonFreeTrial) {
        return {
          code: 'retry_plus_non_free_trial',
          forceFreshTabsNextRun: true,
          shouldRetry: true,
        };
      }
      if (result.retryableUpiRedeemBackendFailure) {
        return {
          code: 'retry_upi_redeem_backend_failure',
          forceFreshTabsNextRun: true,
          shouldRetry: true,
        };
      }
      if (result.retryableUpiRedeemNetworkFailure) {
        return {
          code: 'retry_upi_redeem_network_failure',
          forceFreshTabsNextRun: true,
          shouldRetry: true,
        };
      }
      if (result.retryableHostedCheckoutGenericError) {
        return {
          code: 'retry_hosted_checkout_generic_error',
          forceFreshTabsNextRun: true,
          shouldRetry: true,
        };
      }
      if (result.retryableHostedCheckoutCardFallback) {
        return {
          code: 'retry_hosted_checkout_card_fallback',
          forceFreshTabsNextRun: true,
          shouldRetry: true,
        };
      }
      if (result.blockedByUpiAccountIneligible) {
        return {
          code: 'fail_upi_account_ineligible',
          forceFreshTabsNextRun: true,
          shouldFailRound: true,
        };
      }
      if (result.blockedByPlusNonFreeTrial) {
        return {
          code: 'fail_plus_non_free_trial',
          forceFreshTabsNextRun: result.autoRunSkipFailures,
          shouldFailRound: true,
          shouldStop: !result.autoRunSkipFailures,
        };
      }
      if (result.blockedByUpiRedeemBackendFailure) {
        return {
          code: 'fail_upi_redeem_backend_failure',
          forceFreshTabsNextRun: result.autoRunSkipFailures,
          shouldFailRound: true,
          shouldStop: !result.autoRunSkipFailures,
        };
      }
      if (result.blockedByUpiRedeemNetworkFailure) {
        return {
          code: 'fail_upi_redeem_network_failure',
          forceFreshTabsNextRun: true,
          shouldFailRound: true,
        };
      }
      if (result.blockedByCardHelperTaskEnded) {
        return {
          code: 'fail_card_helper_task_ended',
          forceFreshTabsNextRun: result.autoRunSkipFailures,
          shouldFailRound: true,
          shouldStop: !result.autoRunSkipFailures,
        };
      }
      if (result.blockedByHostedCheckoutGenericError) {
        return {
          code: 'fail_hosted_checkout_generic_error',
          forceFreshTabsNextRun: result.autoRunSkipFailures,
          shouldFailRound: true,
          shouldStop: !result.autoRunSkipFailures,
        };
      }
      if (result.blockedByHostedCheckoutCardFallback) {
        return {
          code: 'fail_hosted_checkout_card_fallback',
          forceFreshTabsNextRun: result.autoRunSkipFailures,
          shouldFailRound: true,
          shouldStop: !result.autoRunSkipFailures,
        };
      }
      if (result.blockedByHostedCheckoutVerificationResendLimit) {
        return {
          code: 'fail_hosted_checkout_verification_resend_limit',
          forceFreshTabsNextRun: result.autoRunSkipFailures,
          shouldFailRound: true,
          shouldStop: !result.autoRunSkipFailures,
        };
      }
      if (result.blockedByCloudCheckoutAlreadyPaid) {
        return {
          code: 'fail_cloud_checkout_already_paid',
          forceFreshTabsNextRun: result.autoRunSkipFailures,
          shouldFailRound: true,
          shouldStop: !result.autoRunSkipFailures,
        };
      }
      if (result.blockedBySignupUserAlreadyExists) {
        return {
          code: 'fail_signup_user_already_exists',
          forceFreshTabsNextRun: result.autoRunSkipFailures,
          shouldFailRound: true,
          shouldStop: !result.autoRunSkipFailures,
        };
      }
      if (result.blockedByStep4Route405) {
        return {
          code: 'fail_step4_route405',
          forceFreshTabsNextRun: result.autoRunSkipFailures,
          shouldFailRound: true,
          shouldStop: !result.autoRunSkipFailures,
        };
      }
      if (result.canRetry) {
        return {
          code: 'retry_generic',
          forceFreshTabsNextRun: true,
          shouldRetry: true,
        };
      }
      return {
        code: 'fail_generic',
        forceFreshTabsNextRun: result.autoRunSkipFailures,
        shouldFailRound: true,
        shouldStop: !result.autoRunSkipFailures,
      };
    }

    return {
      evaluateAttemptFailure,
      getMaxAttemptsForRound,
      resolveAutoRunAccountRecordStatus,
      selectFailureAction,
    };
  }

  return {
    createAutoRunRetryPolicy,
  };
});
