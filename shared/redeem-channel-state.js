(function attachRedeemChannelState(root, factory) {
  const api = factory();
  root.MultiPageRedeemChannelState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createRedeemChannelState() {
  const REDEEM_CHANNEL_FAILURE_LIMIT = 3;
  const REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS = 24 * 60 * 60 * 1000;
  const REDEEM_CHANNELS = Object.freeze(['upi', 'ideal', 'pix']);
  const REDEEM_CHANNEL_METADATA = Object.freeze({
    upi: Object.freeze({ label: 'UPI', failureField: 'upiRedeemFailureCount', dailyLimitPrefix: 'upiRedeem' }),
    ideal: Object.freeze({ label: 'IDEAL', failureField: 'idealRedeemFailureCount', dailyLimitPrefix: 'idealRedeem' }),
    pix: Object.freeze({ label: 'PIX', failureField: 'pixRedeemFailureCount', dailyLimitPrefix: 'pixRedeem' }),
  });

  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function normalizeRedeemChannel(value = '') {
    const normalized = normalizeString(value).toLowerCase();
    return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
  }

  function getRedeemChannelMetadata(channel = 'upi') {
    return REDEEM_CHANNEL_METADATA[normalizeRedeemChannel(channel)] || REDEEM_CHANNEL_METADATA.upi;
  }

  function getRedeemChannelLabel(channel = 'upi') {
    return getRedeemChannelMetadata(channel).label;
  }

  function getRedeemChannelFailureField(channel = 'upi') {
    return getRedeemChannelMetadata(channel).failureField;
  }

  function getRedeemChannelDailyLimitBlockedAtField(channel = 'upi') {
    return `${getRedeemChannelMetadata(channel).dailyLimitPrefix}DailyLimitBlockedAt`;
  }

  function getRedeemChannelDailyLimitBlockedUntilField(channel = 'upi') {
    return `${getRedeemChannelMetadata(channel).dailyLimitPrefix}DailyLimitBlockedUntil`;
  }

  function getRedeemChannelDailyLimitReasonField(channel = 'upi') {
    return `${getRedeemChannelMetadata(channel).dailyLimitPrefix}DailyLimitReason`;
  }

  function normalizeRetryCount(value = 0) {
    const count = Math.floor(Number(value) || 0);
    return count > 0 ? count : 0;
  }

  function getRedeemChannelFailureCount(item = {}, channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    const field = getRedeemChannelFailureField(normalizedChannel);
    if (Object.prototype.hasOwnProperty.call(item || {}, field)) {
      return normalizeRetryCount(item?.[field]);
    }
    const legacyChannel = normalizeString(item?.redeemChannel || item?.channel || item?.paymentChannel)
      ? normalizeRedeemChannel(item.redeemChannel || item.channel || item.paymentChannel)
      : '';
    return legacyChannel === normalizedChannel ? normalizeRetryCount(item?.redeemFailureCount) : 0;
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

  function isRedeemChannelDailyLimitBlocked(item = {}, channel = 'upi', options = {}) {
    const normalizedChannel = normalizeRedeemChannel(channel);
    const nowMs = Math.max(1, Math.floor(Number(options.nowMs) || Date.now()));
    const blockedUntil = Date.parse(normalizeString(item?.[getRedeemChannelDailyLimitBlockedUntilField(normalizedChannel)]));
    if (Number.isFinite(blockedUntil) && blockedUntil > nowMs) return true;
    const blockedAt = Date.parse(normalizeString(item?.[getRedeemChannelDailyLimitBlockedAtField(normalizedChannel)]));
    const storedReason = item?.[getRedeemChannelDailyLimitReasonField(normalizedChannel)];
    if (
      Number.isFinite(blockedAt)
      && blockedAt + REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS > nowMs
      && isRedeemChannelDailyLimitReason(storedReason || item?.redeemReason || item?.reason)
    ) {
      return true;
    }
    const itemChannel = normalizeRedeemChannel(item?.redeemChannel || item?.channel || item?.paymentChannel);
    if (itemChannel !== normalizedChannel) return false;
    const legacyReason = item?.redeemReason || item?.reason || item?.remoteMessage;
    if (!isRedeemChannelDailyLimitReason(legacyReason)) return false;
    const legacyBlockedAt = Date.parse(normalizeString(item?.redeemLastFailedAt || item?.redeemAttemptedAt || item?.checkedAt || item?.updatedAt));
    return !Number.isFinite(legacyBlockedAt) || legacyBlockedAt + REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS > nowMs;
  }

  function isRedeemAccountLocked(item = {}) {
    return item?.redeemLocked === true
      || getRedeemChannelFailureCount(item, 'ideal') >= REDEEM_CHANNEL_FAILURE_LIMIT;
  }

  function shouldRedeemItemUseChannel(item = {}, channel = 'upi', options = {}) {
    const normalizedChannel = normalizeRedeemChannel(channel);
    if (isRedeemAccountLocked(item)) return false;
    if (isRedeemChannelDailyLimitBlocked(item, normalizedChannel, options)) return false;
    if (options.requireTrialEligibility !== false && normalizeString(item?.trialEligibilityStatus).toLowerCase() !== 'eligible') return false;
    if (
      typeof options.isTrialEligibilityChannelAllowed === 'function'
      && !options.isTrialEligibilityChannelAllowed(item, normalizedChannel)
    ) {
      return false;
    }
    if (normalizedChannel === 'upi') return true;
    return getRedeemChannelFailureCount(item, normalizedChannel) < REDEEM_CHANNEL_FAILURE_LIMIT;
  }

  return {
    REDEEM_CHANNEL_FAILURE_LIMIT,
    REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS,
    REDEEM_CHANNELS,
    normalizeRedeemChannel,
    getRedeemChannelLabel,
    normalizeRetryCount,
    getRedeemChannelFailureField,
    getRedeemChannelFailureCount,
    getRedeemChannelDailyLimitBlockedAtField,
    getRedeemChannelDailyLimitBlockedUntilField,
    getRedeemChannelDailyLimitReasonField,
    isRedeemChannelDailyLimitReason,
    isRedeemChannelDailyLimitBlocked,
    isRedeemAccountLocked,
    shouldRedeemItemUseChannel,
    isRedeemCrossRegionPaymentUnavailableReason,
  };
});
