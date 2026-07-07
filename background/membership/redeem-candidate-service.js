(function attachMembershipRedeemCandidateService(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPageRedeemCandidateService = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipRedeemCandidateServiceModule(root) {
  const DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT = 3;
  const REDEEM_CHANNEL_FAILURE_LIMIT = 3;
  const REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS = 24 * 60 * 60 * 1000;
  const UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX = 20;

  function defaultNormalizeString(value = '') {
    return String(value || '').trim();
  }

  function defaultNormalizeEmail(value = '') {
    return defaultNormalizeString(value).toLowerCase();
  }

  function defaultNormalizeBoolean(value) {
    if (value === true) return true;
    if (value === false || value === null || value === undefined) return false;
    return ['1', 'true', 'yes', 'y', 'ok', 'active', 'success'].includes(
      defaultNormalizeString(value).toLowerCase()
    );
  }

  function defaultNormalizeRetryCount(value = 0) {
    const count = Math.floor(Number(value) || 0);
    return count > 0 ? count : 0;
  }

  function defaultGetUpiRedeemStateValue(state = {}, key = '') {
    const normalizedKey = defaultNormalizeString(key);
    return normalizedKey ? state?.[normalizedKey] : undefined;
  }

  function createRedeemCandidateService(deps = {}) {
    const {
      getRedeemCdkeyUsageHelpers = () => root.MultiPageRedeemCdkeyUsage || {},
      getRedeemChannelStateHelpers = () => root.MultiPageRedeemChannelState || {},
      getUpiRedeemStateValue = defaultGetUpiRedeemStateValue,
      isNonRetryableUpiRedeemRetryError = () => false,
      isPreSubmitUpiRedeemBlockedResultItem = () => false,
      isTrialEligibilityChannelAllowed = () => true,
      normalizeBoolean = defaultNormalizeBoolean,
      normalizeEmail = defaultNormalizeEmail,
      normalizeResultItem = (item = {}) => item,
      normalizeRetryCount = defaultNormalizeRetryCount,
      normalizeString = defaultNormalizeString,
      now = Date.now,
    } = deps;

    function normalizeRedeemChannel(value = '') {
      const helper = getRedeemChannelStateHelpers().normalizeRedeemChannel;
      if (typeof helper === 'function') {
        return helper(value);
      }
      return normalizeString(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
    }

    function getRedeemChannelLabel(channel = 'upi') {
      return normalizeRedeemChannel(channel) === 'ideal' ? 'IDEAL' : 'UPI';
    }

    function getRedeemChannelFailureField(channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().getRedeemChannelFailureField;
      if (typeof helper === 'function') {
        return helper(channel);
      }
      return normalizeRedeemChannel(channel) === 'ideal'
        ? 'idealRedeemFailureCount'
        : 'upiRedeemFailureCount';
    }

    function getRedeemChannelFailureCount(item = {}, channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().getRedeemChannelFailureCount;
      if (typeof helper === 'function') {
        return helper(item, channel);
      }
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

    function getRedeemChannelDailyLimitBlockedAtField(channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitBlockedAtField;
      if (typeof helper === 'function') {
        return helper(channel);
      }
      return normalizeRedeemChannel(channel) === 'ideal'
        ? 'idealRedeemDailyLimitBlockedAt'
        : 'upiRedeemDailyLimitBlockedAt';
    }

    function getRedeemChannelDailyLimitBlockedUntilField(channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitBlockedUntilField;
      if (typeof helper === 'function') {
        return helper(channel);
      }
      return normalizeRedeemChannel(channel) === 'ideal'
        ? 'idealRedeemDailyLimitBlockedUntil'
        : 'upiRedeemDailyLimitBlockedUntil';
    }

    function getRedeemChannelDailyLimitReasonField(channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitReasonField;
      if (typeof helper === 'function') {
        return helper(channel);
      }
      return normalizeRedeemChannel(channel) === 'ideal'
        ? 'idealRedeemDailyLimitReason'
        : 'upiRedeemDailyLimitReason';
    }

    function isRedeemChannelDailyLimitReason(message = '') {
      const helper = getRedeemChannelStateHelpers().isRedeemChannelDailyLimitReason;
      if (typeof helper === 'function') {
        return helper(message);
      }
      const text = normalizeString(message);
      return /该邮箱/.test(text)
        && /在该渠道今日提交次数已达上限/.test(text)
        && /3\s*次/.test(text)
        && /请\s*24\s*小时后再试/.test(text);
    }

    function isRedeemCrossRegionPaymentUnavailableReason(message = '') {
      const helper = getRedeemChannelStateHelpers().isRedeemCrossRegionPaymentUnavailableReason;
      if (typeof helper === 'function') {
        return helper(message);
      }
      return /\bpm-unavailable\b/i.test(normalizeString(message));
    }

    function buildRedeemChannelDailyLimitPatch(channel = 'upi', reason = '', failedAt = '') {
      if (!isRedeemChannelDailyLimitReason(reason)) {
        return {};
      }
      const normalizedChannel = normalizeRedeemChannel(channel);
      const blockedAt = normalizeString(failedAt) || new Date().toISOString();
      const blockedAtMs = Math.max(0, Date.parse(blockedAt) || Date.now());
      const blockedUntil = new Date(blockedAtMs + REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS).toISOString();
      return {
        [getRedeemChannelDailyLimitBlockedAtField(normalizedChannel)]: blockedAt,
        [getRedeemChannelDailyLimitBlockedUntilField(normalizedChannel)]: blockedUntil,
        [getRedeemChannelDailyLimitReasonField(normalizedChannel)]: normalizeString(reason),
      };
    }

    function isRedeemChannelDailyLimitBlocked(item = {}, channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().isRedeemChannelDailyLimitBlocked;
      if (typeof helper === 'function') {
        return helper(item, channel);
      }
      const normalizedChannel = normalizeRedeemChannel(channel);
      const nowMs = Date.now();
      const blockedUntil = Date.parse(normalizeString(item?.[getRedeemChannelDailyLimitBlockedUntilField(normalizedChannel)]));
      if (Number.isFinite(blockedUntil) && blockedUntil > nowMs) {
        return true;
      }
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
      if (itemChannel !== normalizedChannel) {
        return false;
      }
      const legacyReason = item?.redeemReason || item?.reason || item?.remoteMessage;
      if (!isRedeemChannelDailyLimitReason(legacyReason)) {
        return false;
      }
      const legacyBlockedAt = Date.parse(normalizeString(item?.redeemLastFailedAt || item?.redeemAttemptedAt || item?.checkedAt || item?.updatedAt));
      return !Number.isFinite(legacyBlockedAt) || legacyBlockedAt + REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS > nowMs;
    }

    function isRedeemAccountLocked(item = {}) {
      const helper = getRedeemChannelStateHelpers().isRedeemAccountLocked;
      if (typeof helper === 'function') {
        return helper(item);
      }
      return item?.redeemLocked === true
        || getRedeemChannelFailureCount(item, 'ideal') >= REDEEM_CHANNEL_FAILURE_LIMIT;
    }

    function getRedeemLockReason(item = {}) {
      return normalizeString(item?.redeemLockedReason)
        || 'IDEAL 已失败 3 次，账号已封存，不再使用';
    }

    function buildRedeemAccountUnlockedPatch() {
      return {
        redeemLocked: false,
        redeemLockedReason: '',
        redeemLockedAt: '',
      };
    }

    function buildRedeemChannelFailurePatch(item = {}, channel = 'upi', options = {}) {
      const normalizedChannel = normalizeRedeemChannel(channel);
      const failedAt = normalizeString(options.failedAt) || new Date().toISOString();
      const reason = normalizeString(options.reason) || '兑换失败';
      const count = Math.min(
        REDEEM_CHANNEL_FAILURE_LIMIT,
        getRedeemChannelFailureCount(item, normalizedChannel) + 1
      );
      const patch = {
        [getRedeemChannelFailureField(normalizedChannel)]: count,
        redeemFailureCount: count,
        redeemFailureLimit: REDEEM_CHANNEL_FAILURE_LIMIT,
        redeemLastFailedAt: failedAt,
        redeemChannel: normalizedChannel,
        ...buildRedeemChannelDailyLimitPatch(normalizedChannel, reason, failedAt),
      };
      if (isRedeemCrossRegionPaymentUnavailableReason(reason)) {
        return {
          ...patch,
          redeemLocked: true,
          redeemLockedReason: `跨地区支付不可用，账号已封存，不再兑换：${reason}`,
          redeemLockedAt: failedAt,
        };
      }
      if (normalizedChannel === 'ideal' && count >= REDEEM_CHANNEL_FAILURE_LIMIT) {
        const lockReason = `IDEAL 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次，账号已封存，不再使用：${reason}`;
        return {
          ...patch,
          redeemLocked: true,
          redeemLockedReason: lockReason,
          redeemLockedAt: failedAt,
        };
      }
      return {
        ...patch,
        ...buildRedeemAccountUnlockedPatch(),
      };
    }

    function shouldRedeemItemUseChannel(item = {}, channel = 'upi') {
      const helper = getRedeemChannelStateHelpers().shouldRedeemItemUseChannel;
      if (typeof helper === 'function') {
        return helper(item, channel, {
          nowMs: now(),
          isTrialEligibilityChannelAllowed,
        });
      }
      if (isRedeemAccountLocked(item)) return false;
      if (isRedeemChannelDailyLimitBlocked(item, channel)) return false;
      if (normalizeString(item?.trialEligibilityStatus).toLowerCase() !== 'eligible') return false;
      if (!isTrialEligibilityChannelAllowed(item, channel)) return false;
      if (normalizeRedeemChannel(channel) === 'upi') return true;
      return getRedeemChannelFailureCount(item, channel) < REDEEM_CHANNEL_FAILURE_LIMIT;
    }

    function getRedeemChannelPoolText(state = {}, channel = 'upi') {
      const helper = getRedeemCdkeyUsageHelpers().getRedeemChannelPoolText;
      if (typeof helper === 'function') {
        return helper(state, channel);
      }
      if (normalizeRedeemChannel(channel) === 'ideal') {
        return normalizeString(state?.idealRedeemCdkeyPoolText);
      }
      return getUpiRedeemStateValue(state, 'upiRedeemCdkeyPoolText');
    }

    function getRedeemChannelUsage(state = {}, channel = 'upi') {
      const helper = getRedeemCdkeyUsageHelpers().getRedeemChannelUsage;
      if (typeof helper === 'function') {
        return helper(state, channel, { defaultValue: {} }) || {};
      }
      if (normalizeRedeemChannel(channel) === 'ideal') {
        return state?.idealRedeemCdkeyUsage || {};
      }
      return getUpiRedeemStateValue(state, 'upiRedeemCdkeyUsage') || {};
    }

    function buildRedeemChannelUsageUpdates(channel = 'upi', usage = {}) {
      const helper = getRedeemCdkeyUsageHelpers().buildRedeemChannelUsageUpdates;
      if (typeof helper === 'function') {
        return helper(channel, usage, { normalizeUsage: normalizeUpiRedeemCdkeyUsage });
      }
      const normalizedUsage = normalizeUpiRedeemCdkeyUsage(usage || {});
      if (normalizeRedeemChannel(channel) === 'ideal') {
        return {
          idealRedeemCdkeyUsage: normalizedUsage,
        };
      }
      return {
        cdkUsage: normalizedUsage,
        upiRedeemCdkUsage: normalizedUsage,
        upiRedeemCdkeyUsage: normalizedUsage,
      };
    }

    function parseUpiRedeemCdkeyPoolText(value = '') {
      const seen = new Set();
      return String(value || '')
        .replace(/\r/g, '')
        .split('\n')
        .map((line) => normalizeString(line))
        .filter((line) => {
          if (!line || seen.has(line)) return false;
          seen.add(line);
          return true;
        });
    }

    function normalizeUpiRedeemCdkeyUsage(rawUsage = {}) {
      const usage = rawUsage && typeof rawUsage === 'object' && !Array.isArray(rawUsage)
        ? rawUsage
        : {};
      return Object.fromEntries(Object.entries(usage).map(([rawCdkey, rawEntry]) => {
        const cdkey = normalizeString(rawCdkey);
        const entry = rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry)
          ? rawEntry
          : {};
        return [cdkey, {
          ...entry,
          email: normalizeEmail(entry.email || entry.accountEmail || entry.account_email || entry.credentialEmail || entry.credential_email || entry.targetEmail || entry.target_email),
          accessToken: normalizeString(entry.accessToken || entry.access_token || entry.upiRedeemAccessToken),
          accessTokenMasked: normalizeString(entry.accessTokenMasked),
          accessTokenUpdatedAt: Math.max(0, Math.floor(Number(entry.accessTokenUpdatedAt) || Number(entry.tokenUpdatedAt) || 0)),
          lastFailedEmail: normalizeEmail(entry.lastFailedEmail),
          lastFailedAt: Math.max(0, Math.floor(Number(entry.lastFailedAt) || 0)),
          lastFailedReason: normalizeString(entry.lastFailedReason),
          canCancel: normalizeBoolean(entry.canCancel ?? entry.can_cancel),
          canRetry: normalizeBoolean(entry.canRetry ?? entry.can_retry),
          canReuseToken: normalizeBoolean(entry.canReuseToken ?? entry.can_reuse_token),
          hasAccessToken: normalizeBoolean(entry.hasAccessToken ?? entry.has_access_token),
        }];
      }).filter(([cdkey]) => Boolean(cdkey)));
    }

    function getUpiRedeemCdkeyUsageEntryEmail(entry = {}) {
      return normalizeEmail(
        entry.email
        || entry.accountEmail
        || entry.account_email
        || entry.credentialEmail
        || entry.credential_email
        || entry.targetEmail
        || entry.target_email
      );
    }

    function isSuccessfulUpiRedeemCdkeyUsageEntry(entry = {}) {
      return entry?.subscriptionActive === true
        || isSuccessfulUpiRedeemRemoteStatus(entry?.remoteStatus)
        || isSuccessfulUpiRedeemRemoteStatus(entry?.remoteMessage);
    }

    function shouldClearUpiRedeemCdkeyUsageAccountBinding(entry = {}, options = {}) {
      if (isSuccessfulUpiRedeemCdkeyUsageEntry(entry)) {
        return true;
      }
      if (options.clearNonActive !== true) {
        return false;
      }
      return !isActiveUpiRedeemRemoteStatus(entry.remoteStatus)
        && !isActiveUpiRedeemRemoteStatus(entry.remoteMessage)
        && entry.retrying !== true
        && normalizeBoolean(entry.canCancel ?? entry.can_cancel) !== true;
    }

    function clearUpiRedeemCdkeyUsageAccountBindings(usage = {}, emailSet = new Set(), options = {}) {
      const source = usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
      const targets = emailSet instanceof Set ? emailSet : new Set();
      let changed = false;
      const nextUsage = {};
      Object.entries(source).forEach(([cdkey, rawEntry]) => {
        const entry = rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry)
          ? { ...rawEntry }
          : {};
        const email = getUpiRedeemCdkeyUsageEntryEmail(entry);
        if (email && targets.has(email) && shouldClearUpiRedeemCdkeyUsageAccountBinding(entry, options)) {
          delete entry.email;
          delete entry.accountEmail;
          delete entry.account_email;
          delete entry.credentialEmail;
          delete entry.credential_email;
          delete entry.targetEmail;
          delete entry.target_email;
          delete entry.accessToken;
          delete entry.access_token;
          delete entry.upiRedeemAccessToken;
          delete entry.upi_redeem_access_token;
          delete entry.accessTokenMasked;
          delete entry.access_token_masked;
          delete entry.accessTokenUpdatedAt;
          delete entry.access_token_updated_at;
          changed = true;
        }
        nextUsage[cdkey] = entry;
      });
      return { usage: nextUsage, changed };
    }

    function normalizeUpiRedeemRemoteStatus(status = '') {
      const normalized = normalizeString(status).toLowerCase().replace(/[\s-]+/g, '_');
      switch (normalized) {
        case 'pending_dispatch':
        case 'dispatched':
        case 'running':
        case 'success':
        case 'failed':
        case 'timeout':
        case 'not_found':
          return normalized;
        case 'cancelled':
        case 'canceled':
          return 'canceled';
        default:
          break;
      }
      if (normalized === 'approve_blocked') return 'approve_blocked';
      if (/兑换成功|成功|已兑换|已使用|已用/.test(normalized)) return 'success';
      if (/提交失败|兑换失败|充值失败|失败|超时|拒绝|已拒绝|取消|已取消/.test(normalized)) {
        if (/超时/.test(normalized)) return 'timeout';
        if (/拒绝/.test(normalized)) return 'rejected';
        if (/取消/.test(normalized)) return 'canceled';
        return 'failed';
      }
      if (/未找到|不存在/.test(normalized)) return 'not_found';
      if (/无效|不可用/.test(normalized)) return 'invalid';
      if (/未使用|未兑换|可用/.test(normalized)) return 'unused';
      if (/waiting|queue|br_recharge|进入兑换队列|兑换队列|等待系统处理|等待.*接单|任务.*等待/.test(normalized)) return 'queued';
      if (/等待处理|待处理|待兑换|待派发/.test(normalized)) return 'pending_dispatch';
      if (/派发中|正在派发/.test(normalized)) return 'dispatching';
      if (/已派发/.test(normalized)) return 'dispatched';
      if (/兑换中|处理中|进行中|正在兑换/.test(normalized)) return 'processing';
      if (/已提交|已接收|排队/.test(normalized)) return 'submitted';
      if (normalized === 'succeeded' || normalized === 'redeemed' || normalized === 'used') return 'success';
      if (normalized === 'failure' || normalized === 'error') return 'failed';
      if (normalized === 'cancelled') return 'canceled';
      if (normalized === 'notused' || normalized === 'not_used' || normalized === 'unredeemed') return 'unused';
      return normalized;
    }

    function isActiveUpiRedeemRemoteStatus(status = '') {
      return [
        'pending',
        'pending_token',
        'pending_dispatch',
        'dispatched',
        'dispatching',
        'running',
        'redeeming',
        'processing',
        'in_progress',
        'queued',
        'accepted',
        'submitted',
      ].includes(normalizeUpiRedeemRemoteStatus(status));
    }

    function isSuccessfulUpiRedeemRemoteStatus(status = '') {
      return normalizeUpiRedeemRemoteStatus(status) === 'success';
    }

    function isRetryableUpiRedeemRemoteStatus(status = '') {
      return ['failed', 'timeout', 'rejected', 'approve_blocked'].includes(normalizeUpiRedeemRemoteStatus(status));
    }

    function isSelectableUpiRedeemCdkeyUsageEntry(entry = {}) {
      if (!entry || entry.enabled === false) return false;
      const remoteStatus = normalizeUpiRedeemRemoteStatus(entry.remoteStatus);
      const remoteMessageStatus = normalizeUpiRedeemRemoteStatus(entry.remoteMessage);
      if (entry.subscriptionActive === true) return false;
      if (isSuccessfulUpiRedeemRemoteStatus(entry.remoteStatus)) return false;
      if (remoteStatus === 'invalid' || remoteMessageStatus === 'invalid') return false;
      if (
        (
          remoteStatus === 'pending_dispatch'
          || remoteMessageStatus === 'pending_dispatch'
        )
        && (normalizeEmail(entry.email) || normalizeString(entry.accessToken))
      ) return false;
      if (isActiveUpiRedeemRemoteStatus(entry.remoteStatus) || isActiveUpiRedeemRemoteStatus(entry.remoteMessage) || entry.retrying === true) return false;
      return true;
    }

    function isRecoverableUpiRedeemCdkeyUsageEntry(entry = {}) {
      if (!entry || entry.enabled === false) return false;
      const remoteStatus = normalizeUpiRedeemRemoteStatus(entry.remoteStatus);
      const remoteMessageStatus = normalizeUpiRedeemRemoteStatus(entry.remoteMessage);
      if (entry.subscriptionActive === true || isSuccessfulUpiRedeemRemoteStatus(entry.remoteStatus)) return false;
      if (
        (
          remoteStatus === 'pending_dispatch'
          || remoteMessageStatus === 'pending_dispatch'
        )
        && (normalizeEmail(entry.email) || normalizeString(entry.accessToken))
      ) return false;
      if (isActiveUpiRedeemRemoteStatus(entry.remoteStatus) || isActiveUpiRedeemRemoteStatus(entry.remoteMessage) || entry.retrying === true) return false;
      return isRetryableUpiRedeemRemoteStatus(entry.remoteStatus)
        || remoteStatus === 'canceled'
        || remoteMessageStatus === 'canceled'
        || entry.subscriptionActive === false
        || Boolean(normalizeString(entry.lastError || entry.subscriptionReason));
    }

    function mergeUpiRedeemCdkeysWithRecoverableUsage(cdkeys = [], usage = {}) {
      const seen = new Set();
      const merged = [];
      for (const cdkey of cdkeys) {
        const normalizedCdkey = normalizeString(cdkey);
        if (!normalizedCdkey || seen.has(normalizedCdkey)) continue;
        seen.add(normalizedCdkey);
        merged.push(normalizedCdkey);
      }
      return merged;
    }

    function countAvailableUpiRedeemCdkeys(state = {}, channel = 'upi') {
      const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(state, channel));
      const cdkeys = mergeUpiRedeemCdkeysWithRecoverableUsage(
        parseUpiRedeemCdkeyPoolText(getRedeemChannelPoolText(state, channel)),
        usage
      );
      return cdkeys.filter((cdkey) => {
        const entry = usage?.[cdkey] || {};
        return isSelectableUpiRedeemCdkeyUsageEntry(entry);
      }).length;
    }

    function normalizeFailedAccountRetryLimit(value, fallback = DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT) {
      const fallbackNumber = Math.floor(Number(fallback));
      const fallbackValue = Number.isFinite(fallbackNumber)
        ? Math.max(0, Math.min(UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX, fallbackNumber))
        : DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT;
      const rawValue = String(value ?? '').trim();
      if (!rawValue) {
        return fallbackValue;
      }
      const numeric = Math.floor(Number(rawValue));
      if (!Number.isFinite(numeric)) {
        return fallbackValue;
      }
      return Math.max(0, Math.min(UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX, numeric));
    }

    function normalizeRedeemConfiguredRoundCount(value, fallback = DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT) {
      return normalizeFailedAccountRetryLimit(value, fallback);
    }

    function getRedeemTotalRoundLimit(configuredRoundCount = 0) {
      const roundCount = Math.max(0, Math.min(
        UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX,
        Math.floor(Number(configuredRoundCount) || 0)
      ));
      return roundCount > 0 ? roundCount : 1;
    }

    function getRedeemRoundLabel(roundNumber = 1, totalRoundLimit = 1) {
      return `兑换轮 ${Math.max(1, Math.floor(Number(roundNumber) || 1))}/${Math.max(1, Math.floor(Number(totalRoundLimit) || 1))}`;
    }

    function getAvailableUpiRedeemCdkeys(state = {}, channel = 'upi') {
      const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(state, channel));
      return mergeUpiRedeemCdkeysWithRecoverableUsage(
        parseUpiRedeemCdkeyPoolText(getRedeemChannelPoolText(state, channel)),
        usage
      ).filter((cdkey) => isSelectableUpiRedeemCdkeyUsageEntry(usage?.[cdkey] || {}));
    }

    function pickRandomUpiRedeemCdkey(cdkeys = []) {
      const candidates = (Array.isArray(cdkeys) ? cdkeys : [])
        .map((cdkey) => normalizeString(cdkey))
        .filter(Boolean);
      if (!candidates.length) {
        return '';
      }
      const index = Math.floor(Math.random() * candidates.length);
      return candidates[Math.max(0, Math.min(candidates.length - 1, index))] || '';
    }

    function isRetryableUpiRedeemRoundResultItem(item = {}, totalRoundLimit = 1, channel = 'upi') {
      const status = normalizeString(item?.status).toLowerCase();
      const redeemStatus = normalizeString(item?.redeemStatus).toLowerCase();
      if (status !== 'free' || redeemStatus !== 'failed') return false;
      if (!normalizeString(item?.accessToken)) return false;
      if (!shouldRedeemItemUseChannel(item, channel)) return false;
      if (isPreSubmitUpiRedeemBlockedResultItem(item)) return false;
      if (isNonRetryableUpiRedeemRetryError(item?.redeemReason || item?.reason)) return false;
      if (normalizeRedeemChannel(channel) === 'upi') return true;
      return getRedeemChannelFailureCount(item, channel) < Math.max(1, Math.floor(Number(totalRoundLimit) || 1));
    }

    function isRedeemTerminalResultItem(item = {}) {
      const redeemStatus = normalizeUpiRedeemRemoteStatus(item.redeemStatus);
      const status = normalizeString(item.status).toLowerCase();
      const trialEligibilityStatus = normalizeString(item.trialEligibilityStatus).toLowerCase();
      return trialEligibilityStatus === 'ineligible'
        || isRedeemAccountLocked(item)
        || status === 'paid'
        || (status !== 'free' && ['success', 'skipped'].includes(redeemStatus))
        || ['running', 'submitted', 'pending', 'processing', 'accepted'].includes(redeemStatus);
    }

    function filterRedeemableCredentialsForCurrentResults(credentials = [], results = {}) {
      const lookup = {};
      (Array.isArray(results.items) ? results.items : []).forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (email) {
          lookup[email] = item;
        }
      });
      return (Array.isArray(credentials) ? credentials : []).filter((credential) => {
        const email = normalizeEmail(credential?.email);
        if (!email) {
          return false;
        }
        const existingItem = lookup[email] || {};
        if (normalizeString(existingItem.trialEligibilityStatus).toLowerCase() === 'ineligible') {
          return false;
        }
        return !isRedeemTerminalResultItem(existingItem);
      });
    }

    function isAutoContinuationPendingRedeemItem(item = {}) {
      const status = normalizeString(item?.status).toLowerCase();
      const redeemStatus = normalizeUpiRedeemRemoteStatus(item?.redeemStatus);
      const reason = normalizeString(item?.redeemReason || item?.reason);
      if (status !== 'free') return false;
      if (!normalizeString(item?.accessToken)) return false;
      if (normalizeString(item?.trialEligibilityStatus).toLowerCase() === 'ineligible') return false;
      if (isRedeemTerminalResultItem(item)) return false;
      if (isActiveUpiRedeemRemoteStatus(redeemStatus)) return false;
      if (['blocked', 'stopped', 'success', 'canceled'].includes(redeemStatus)) return false;
      if (normalizeString(item?.upiRedeemCdkey || item?.cdkey)) return false;
      if (isPreSubmitUpiRedeemBlockedResultItem(item)) return false;
      if (isNonRetryableUpiRedeemRetryError(reason)) return false;
      return !redeemStatus || ['unused', 'not_found', 'available', 'ready', 'new'].includes(redeemStatus);
    }

    function hasPriorUpiRedeemAttempt(item = {}) {
      return Boolean(
        normalizeString(item?.redeemAttemptedAt)
        || normalizeString(item?.redeemLastFailedAt)
        || normalizeString(item?.lastFailedUpiRedeemCdkey)
        || normalizeString(item?.lastCanceledUpiRedeemCdkey)
        || normalizeString(item?.upiRedeemSubscriptionCheckedAt)
        || normalizeRetryCount(item?.redeemFailureCount) > 0
      );
    }

    function buildAutoContinuationRedeemCandidates(items = [], totalRoundLimit = 1, targetEmail = '', channel = 'upi', options = {}) {
      const fresh = [];
      const released = [];
      const failed = [];
      const seen = new Set();
      const normalizedTargetEmail = normalizeEmail(targetEmail);
      const includeFresh = options.includeFresh === true;

      const pushCandidate = (bucket, item) => {
        const normalized = normalizeResultItem(item);
        const email = normalizeEmail(normalized.email);
        if (!email || seen.has(email)) return;
        if (normalizedTargetEmail && email !== normalizedTargetEmail) return;
        if (!shouldRedeemItemUseChannel(normalized, channel)) return;
        seen.add(email);
        bucket.push(normalized);
      };

      (Array.isArray(items) ? items : []).forEach((item) => {
        if (isAutoContinuationPendingRedeemItem(item)) {
          if (hasPriorUpiRedeemAttempt(item)) {
            pushCandidate(released, item);
          } else {
            pushCandidate(fresh, item);
          }
          return;
        }
        if (isRetryableUpiRedeemRoundResultItem(item, totalRoundLimit, channel)) {
          pushCandidate(failed, item);
        }
      });

      return {
        candidates: includeFresh ? [...released, ...fresh, ...failed] : [...released, ...failed],
        freshCount: fresh.length,
        releasedCount: released.length,
        failedCount: failed.length,
      };
    }

    return {
      buildAutoContinuationRedeemCandidates,
      buildRedeemAccountUnlockedPatch,
      buildRedeemChannelDailyLimitPatch,
      buildRedeemChannelFailurePatch,
      buildRedeemChannelUsageUpdates,
      clearUpiRedeemCdkeyUsageAccountBindings,
      countAvailableUpiRedeemCdkeys,
      filterRedeemableCredentialsForCurrentResults,
      getAvailableUpiRedeemCdkeys,
      getRedeemChannelDailyLimitBlockedAtField,
      getRedeemChannelDailyLimitBlockedUntilField,
      getRedeemChannelDailyLimitReasonField,
      getRedeemChannelFailureCount,
      getRedeemChannelFailureField,
      getRedeemChannelLabel,
      getRedeemChannelPoolText,
      getRedeemChannelUsage,
      getRedeemLockReason,
      getRedeemRoundLabel,
      getRedeemTotalRoundLimit,
      getUpiRedeemCdkeyUsageEntryEmail,
      hasPriorUpiRedeemAttempt,
      isActiveUpiRedeemRemoteStatus,
      isAutoContinuationPendingRedeemItem,
      isRecoverableUpiRedeemCdkeyUsageEntry,
      isRedeemAccountLocked,
      isRedeemChannelDailyLimitBlocked,
      isRedeemChannelDailyLimitReason,
      isRedeemCrossRegionPaymentUnavailableReason,
      isRedeemTerminalResultItem,
      isRetryableUpiRedeemRemoteStatus,
      isRetryableUpiRedeemRoundResultItem,
      isSelectableUpiRedeemCdkeyUsageEntry,
      isSuccessfulUpiRedeemCdkeyUsageEntry,
      isSuccessfulUpiRedeemRemoteStatus,
      mergeUpiRedeemCdkeysWithRecoverableUsage,
      normalizeFailedAccountRetryLimit,
      normalizeRedeemChannel,
      normalizeRedeemConfiguredRoundCount,
      normalizeUpiRedeemCdkeyUsage,
      normalizeUpiRedeemRemoteStatus,
      parseUpiRedeemCdkeyPoolText,
      pickRandomUpiRedeemCdkey,
      shouldClearUpiRedeemCdkeyUsageAccountBinding,
      shouldRedeemItemUseChannel,
    };
  }

  return {
    createRedeemCandidateService,
  };
});
