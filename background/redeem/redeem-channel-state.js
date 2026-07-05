(function attachRedeemChannelState(root, factory) {
  root.MultiPageRedeemChannelState = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createRedeemChannelState() {
  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function normalizeRedeemChannel(value = '') {
    return normalizeString(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
  }

  function getRedeemChannelFailureField(channel = 'upi') {
    return normalizeRedeemChannel(channel) === 'ideal'
      ? 'idealRedeemFailureCount'
      : 'upiRedeemFailureCount';
  }

  function getRedeemChannelDailyLimitBlockedAtField(channel = 'upi') {
    return normalizeRedeemChannel(channel) === 'ideal'
      ? 'idealRedeemDailyLimitBlockedAt'
      : 'upiRedeemDailyLimitBlockedAt';
  }

  function getRedeemChannelDailyLimitBlockedUntilField(channel = 'upi') {
    return normalizeRedeemChannel(channel) === 'ideal'
      ? 'idealRedeemDailyLimitBlockedUntil'
      : 'upiRedeemDailyLimitBlockedUntil';
  }

  function getRedeemChannelDailyLimitReasonField(channel = 'upi') {
    return normalizeRedeemChannel(channel) === 'ideal'
      ? 'idealRedeemDailyLimitReason'
      : 'upiRedeemDailyLimitReason';
  }

  function isRedeemChannelDailyLimitReason(message = '') {
    const text = normalizeString(message);
    return /该邮箱/.test(text)
      && /在该渠道今日提交次数已达上限/.test(text)
      && /3\s*次/.test(text)
      && /请\s*24\s*小时后再试/.test(text);
  }

  function isRedeemCrossRegionPaymentUnavailableReason(message = '') {
    return /\bpm-unavailable\b/i.test(normalizeString(message));
  }

  return {
    normalizeRedeemChannel,
    getRedeemChannelFailureField,
    getRedeemChannelDailyLimitBlockedAtField,
    getRedeemChannelDailyLimitBlockedUntilField,
    getRedeemChannelDailyLimitReasonField,
    isRedeemChannelDailyLimitReason,
    isRedeemCrossRegionPaymentUnavailableReason,
  };
});
