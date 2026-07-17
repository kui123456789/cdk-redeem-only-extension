// sidepanel/account-records-redeem-policy.js - Redeem channel policy wrappers.
(function attachSidepanelAccountRecordsRedeemPolicy(globalScope) {
  function createAccountRecordsRedeemPolicy(context = {}) {
    const {
      failureLimit = 3,
      getRedeemChannelStateHelpers = () => ({}),
      membershipRowPolicy = {},
      normalizeRedeemChannel = (value = '') => {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
      },
    } = context;

    function getFallbackRedeemChannelField(channel = 'upi', suffix = '') {
      if (normalizeRedeemChannel(channel) === 'ideal') return `idealRedeem${suffix}`;
      if (normalizeRedeemChannel(channel) === 'pix') return `pixRedeem${suffix}`;
      return `upiRedeem${suffix}`;
    }

    function getRedeemChannelFailureField(channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().getRedeemChannelFailureField;
      if (typeof helper === 'function') {
        return helper(channel);
      }
      return membershipRowPolicy.getRedeemChannelFailureField?.(channel)
        || getFallbackRedeemChannelField(channel, 'FailureCount');
    }

    function getRedeemChannelFailureCount(row = {}, channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().getRedeemChannelFailureCount;
      if (typeof helper === 'function') {
        return helper(row, channel);
      }
      if (typeof membershipRowPolicy.getRedeemChannelFailureCount === 'function') {
        return membershipRowPolicy.getRedeemChannelFailureCount(row, channel);
      }
      return 0;
    }

    function getRedeemChannelDailyLimitBlockedAtField(channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitBlockedAtField;
      if (typeof helper === 'function') {
        return helper(channel);
      }
      return membershipRowPolicy.getRedeemChannelDailyLimitBlockedAtField?.(channel)
        || getFallbackRedeemChannelField(channel, 'DailyLimitBlockedAt');
    }

    function getRedeemChannelDailyLimitBlockedUntilField(channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitBlockedUntilField;
      if (typeof helper === 'function') {
        return helper(channel);
      }
      return membershipRowPolicy.getRedeemChannelDailyLimitBlockedUntilField?.(channel)
        || getFallbackRedeemChannelField(channel, 'DailyLimitBlockedUntil');
    }

    function getRedeemChannelDailyLimitReasonField(channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitReasonField;
      if (typeof helper === 'function') {
        return helper(channel);
      }
      return membershipRowPolicy.getRedeemChannelDailyLimitReasonField?.(channel)
        || getFallbackRedeemChannelField(channel, 'DailyLimitReason');
    }

    function isRedeemChannelDailyLimitReason(message = '') {
      const helper = getRedeemChannelStateHelpers().isRedeemChannelDailyLimitReason;
      if (typeof helper === 'function') {
        return helper(message);
      }
      return membershipRowPolicy.isRedeemChannelDailyLimitReason?.(message) === true;
    }

    function isRedeemChannelDailyLimitBlocked(row = {}, channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().isRedeemChannelDailyLimitBlocked;
      if (typeof helper === 'function') {
        return helper(row, channel);
      }
      return membershipRowPolicy.isRedeemChannelDailyLimitBlocked?.(row, channel) === true;
    }

    function isUpiCredentialMembershipRedeemLocked(row = {}) {
      const helper = getRedeemChannelStateHelpers().isRedeemAccountLocked;
      if (typeof helper === 'function') {
        return helper(row);
      }
      return membershipRowPolicy.isRedeemLocked?.(row) === true;
    }

    function getUpiCredentialMembershipRedeemLockReason(row = {}) {
      return membershipRowPolicy.getRedeemLockReason?.(row)
        || 'IDEAL 已失败 3 次，账号已封存，不再使用';
    }

    function getUpiCredentialMembershipFailureLimit(row = {}) {
      return membershipRowPolicy.getFailureLimit?.(row) || failureLimit;
    }

    function shouldApplyRedeemFailureLimitForChannel(channel = 'upi') {
      return membershipRowPolicy.shouldApplyRedeemFailureLimitForChannel?.(channel) === true;
    }

    function isPreSubmitUpiCredentialMembershipBlockedReason(message = '') {
      return membershipRowPolicy.isPreSubmitBlockedReason?.(message) === true;
    }

    function isPreSubmitUpiCredentialMembershipBlockedRow(row = {}) {
      return membershipRowPolicy.isPreSubmitBlockedRow?.(row) === true;
    }

    function hasUpiCredentialMembershipLoginMaterial(row = {}) {
      return membershipRowPolicy.hasLoginMaterial?.(row) === true;
    }

    function isManualLoginRetryableUpiCredentialMembershipRow(row = {}) {
      return membershipRowPolicy.isManualLoginRetryableRow?.(row) === true;
    }

    function isDuplicateCdkeyPendingMembershipRow(row = {}) {
      return membershipRowPolicy.isDuplicateCdkeyPendingRow?.(row) === true;
    }

    return {
      getRedeemChannelFailureField,
      getRedeemChannelFailureCount,
      getRedeemChannelDailyLimitBlockedAtField,
      getRedeemChannelDailyLimitBlockedUntilField,
      getRedeemChannelDailyLimitReasonField,
      isRedeemChannelDailyLimitReason,
      isRedeemChannelDailyLimitBlocked,
      isUpiCredentialMembershipRedeemLocked,
      getUpiCredentialMembershipRedeemLockReason,
      getUpiCredentialMembershipFailureLimit,
      shouldApplyRedeemFailureLimitForChannel,
      isPreSubmitUpiCredentialMembershipBlockedReason,
      isPreSubmitUpiCredentialMembershipBlockedRow,
      hasUpiCredentialMembershipLoginMaterial,
      isManualLoginRetryableUpiCredentialMembershipRow,
      isDuplicateCdkeyPendingMembershipRow,
    };
  }

  const api = {
    createAccountRecordsRedeemPolicy,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsRedeemPolicy = api;
})(typeof window !== 'undefined' ? window : globalThis);
