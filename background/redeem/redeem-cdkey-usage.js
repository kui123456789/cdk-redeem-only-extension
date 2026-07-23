(function attachRedeemCdkeyUsage(root, factory) {
  const api = factory(root);
  root.MultiPageRedeemCdkeyUsage = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createRedeemCdkeyUsage(rootScope) {
  const CDK_STATE_KEY_ALIASES = Object.freeze({
    cdkPoolText: ['cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText'],
    upiRedeemCdkPoolText: ['upiRedeemCdkPoolText', 'cdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText'],
    upiRedeemCdkeyPoolText: ['upiRedeemCdkeyPoolText', 'cdkPoolText', 'upiRedeemCdkPoolText', 'pixRedeemCdkeyPoolText'],
    pixRedeemCdkeyPoolText: ['pixRedeemCdkeyPoolText', 'cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText'],
    cdkUsage: ['cdkUsage', 'upiRedeemCdkUsage', 'upiRedeemCdkeyUsage', 'pixRedeemCdkeyUsage'],
    upiRedeemCdkUsage: ['upiRedeemCdkUsage', 'cdkUsage', 'upiRedeemCdkeyUsage', 'pixRedeemCdkeyUsage'],
    upiRedeemCdkeyUsage: ['upiRedeemCdkeyUsage', 'cdkUsage', 'upiRedeemCdkUsage', 'pixRedeemCdkeyUsage'],
    pixRedeemCdkeyUsage: ['pixRedeemCdkeyUsage', 'cdkUsage', 'upiRedeemCdkUsage', 'upiRedeemCdkeyUsage'],
  });

  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function getRedeemAttemptHistoryHelpers() {
    if (rootScope.MultiPageRedeemAttemptHistory) {
      return rootScope.MultiPageRedeemAttemptHistory;
    }
    if (typeof require === 'function') {
      return require('../membership/redeem-attempt-history.js');
    }
    return {};
  }

  function normalizeRedeemAttemptHistory(value = [], options = {}) {
    const helper = getRedeemAttemptHistoryHelpers().normalizeRedeemAttemptHistory;
    return typeof helper === 'function' ? helper(value, options) : [];
  }

  function appendRedeemAttempt(history = [], attempt = {}, options = {}) {
    const helper = getRedeemAttemptHistoryHelpers().appendRedeemAttempt;
    return typeof helper === 'function' ? helper(history, attempt, options) : [];
  }

  function markRedeemAttemptRecovered(history = [], recovery = {}, options = {}) {
    const helper = getRedeemAttemptHistoryHelpers().markRedeemAttemptRecovered;
    return typeof helper === 'function' ? helper(history, recovery, options) : [];
  }

  function normalizeRedeemChannel(channel = 'upi') {
    const helper = rootScope.MultiPageRedeemChannelState?.normalizeRedeemChannel;
    if (typeof helper === 'function') {
      return helper(channel);
    }
    const normalized = normalizeString(channel).toLowerCase();
    return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
  }

  function getUpiRedeemStateValue(state = {}, key = '') {
    const normalizedKey = normalizeString(key);
    if (!normalizedKey) return undefined;
    if (state?.[normalizedKey] !== undefined) return state[normalizedKey];
    const aliases = CDK_STATE_KEY_ALIASES[normalizedKey] || [];
    for (const alias of aliases) {
      if (state?.[alias] !== undefined) return state[alias];
    }
    const legacyKey = normalizedKey.replace(/^upiRedeem/, 'pixRedeem');
    return legacyKey === normalizedKey ? undefined : state?.[legacyKey];
  }

  function getRedeemChannelPoolKey(channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    if (normalizedChannel === 'ideal') return 'idealRedeemCdkeyPoolText';
    if (normalizedChannel === 'pix') return 'pixChannelRedeemCdkeyPoolText';
    return 'upiRedeemCdkeyPoolText';
  }

  function getRedeemChannelUsageKey(channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    if (normalizedChannel === 'ideal') return 'idealRedeemCdkeyUsage';
    if (normalizedChannel === 'pix') return 'pixChannelRedeemCdkeyUsage';
    return 'upiRedeemCdkeyUsage';
  }

  function getRedeemChannelPoolText(state = {}, channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    if (normalizedChannel === 'ideal') {
      return normalizeString(state?.idealRedeemCdkeyPoolText);
    }
    if (normalizedChannel === 'pix') {
      return normalizeString(state?.pixChannelRedeemCdkeyPoolText);
    }
    return getUpiRedeemStateValue(state, 'upiRedeemCdkeyPoolText');
  }

  function getRedeemChannelUsage(state = {}, channel = 'upi', options = {}) {
    const source = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
    const hasDefaultValue = Object.prototype.hasOwnProperty.call(options || {}, 'defaultValue');
    const normalizedChannel = normalizeRedeemChannel(channel);
    if (normalizedChannel === 'ideal') {
      return Object.prototype.hasOwnProperty.call(source, 'idealRedeemCdkeyUsage')
        ? source.idealRedeemCdkeyUsage
        : (hasDefaultValue ? options.defaultValue : undefined);
    }
    if (normalizedChannel === 'pix') {
      return Object.prototype.hasOwnProperty.call(source, 'pixChannelRedeemCdkeyUsage')
        ? source.pixChannelRedeemCdkeyUsage
        : (hasDefaultValue ? options.defaultValue : undefined);
    }
    const value = getUpiRedeemStateValue(source, 'upiRedeemCdkeyUsage');
    return value !== undefined ? value : (hasDefaultValue ? options.defaultValue : undefined);
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

  function normalizeCdkeyUsage(rawUsage = {}, options = {}) {
    const usage = rawUsage && typeof rawUsage === 'object' && !Array.isArray(rawUsage) ? rawUsage : {};
    const result = {};
    Object.entries(usage).forEach(([rawCdkey, rawEntry]) => {
      const cdkey = normalizeString(rawCdkey);
      if (!cdkey) return;
      const entry = rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry) ? rawEntry : {};
      const normalizedEntry = {
        usedAt: entry.usedAt,
        lastAttemptAt: Math.max(0, Math.floor(Number(entry.lastAttemptAt) || 0)),
        lastError: normalizeString(entry.lastError),
        enabled: entry.enabled !== false,
        email: normalizeString(entry.email || entry.accountEmail || entry.credentialEmail).toLowerCase(),
        accessToken: normalizeString(entry.accessToken || entry.access_token || entry.upiRedeemAccessToken),
        remoteStatus: normalizeString(entry.remoteStatus),
        remoteMessage: normalizeString(entry.remoteMessage),
        retrying: entry.retrying === true,
        redeemAttemptHistory: normalizeRedeemAttemptHistory(entry.redeemAttemptHistory, options),
      };
      if (entry.subscriptionActive === true || entry.subscriptionActive === false) {
        normalizedEntry.subscriptionActive = Boolean(entry.subscriptionActive);
      }
      const subscriptionReason = normalizeString(entry.subscriptionReason);
      if (subscriptionReason) {
        normalizedEntry.subscriptionReason = subscriptionReason;
      }
      result[cdkey] = normalizedEntry;
    });
    return result;
  }

  function normalizeRemoteStatus(status = '') {
    const normalized = normalizeString(status).toLowerCase().replace(/[\s-]+/g, '_');
    switch (normalized) {
      case 'pending_dispatch':
      case 'dispatched':
      case 'dispatching':
      case 'running':
      case 'redeeming':
      case 'processing':
      case 'in_progress':
      case 'queued':
      case 'accepted':
      case 'submitted':
      case 'success':
      case 'failed':
      case 'timeout':
      case 'rejected':
      case 'not_found':
      case 'invalid':
      case 'unused':
      case 'available':
      case 'new':
      case 'ready':
      case 'approve_blocked':
        return normalized;
      case 'pending_token':
        return 'pending_token';
      case 'pending':
        return 'pending';
      case 'cancelled':
      case 'canceled':
        return 'canceled';
      default:
        break;
    }
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
    if (normalized === 'notused' || normalized === 'not_used' || normalized === 'unredeemed') return 'unused';
    return normalized;
  }

  function isActiveRemoteStatus(status = '') {
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
    ].includes(normalizeRemoteStatus(status));
  }

  function isReusableInactiveSubscriptionRemoteStatus(status = '') {
    return [
      'failed',
      'timeout',
      'rejected',
      'approve_blocked',
      'canceled',
      'not_found',
      'unused',
      'available',
      'new',
      'ready',
    ].includes(normalizeRemoteStatus(status));
  }

  function isDuplicateCdkeyMessage(message = '') {
    const text = normalizeString(message);
    return /(?:CDK|CDKEY|卡密)[\s\S]*(?:不可重复提交|重复提交|已提交|already\s+submitted|duplicate\s+submit|duplicate\s+submission|already\s+redeemed|already\s+used)|(?:不可重复提交|重复提交|已提交|already\s+submitted|duplicate\s+submit|duplicate\s+submission|already\s+redeemed|already\s+used)[\s\S]*(?:CDK|CDKEY|卡密)/i.test(text);
  }

  function isSelectableUsageEntry(entry = {}) {
    if (!entry || typeof entry !== 'object') return true;
    if (entry.enabled === false) return false;
    const remoteStatus = normalizeRemoteStatus(entry.remoteStatus);
    const remoteMessageStatus = normalizeRemoteStatus(entry.remoteMessage);
    if (entry.subscriptionActive === true) return false;
    if (
      entry.subscriptionActive === false
      && !isReusableInactiveSubscriptionRemoteStatus(remoteStatus)
      && !isReusableInactiveSubscriptionRemoteStatus(remoteMessageStatus)
    ) {
      return false;
    }
    if (remoteStatus === 'success' || remoteStatus === 'invalid' || remoteMessageStatus === 'invalid') return false;
    if (
      entry.retrying === true
      || (remoteStatus === 'pending_dispatch' && Boolean(normalizeString(entry.email || entry.accessToken)))
      || (remoteMessageStatus === 'pending_dispatch' && Boolean(normalizeString(entry.email || entry.accessToken)))
      || isActiveRemoteStatus(entry.remoteStatus)
      || isActiveRemoteStatus(entry.remoteMessage)
    ) {
      return false;
    }
    if (
      isDuplicateCdkeyMessage(entry.remoteStatus)
      || isDuplicateCdkeyMessage(entry.remoteMessage)
      || isDuplicateCdkeyMessage(entry.lastError)
    ) {
      return false;
    }
    return true;
  }

  function getAvailableCdkeys(poolText = '', usage = {}) {
    const normalizedUsage = normalizeCdkeyUsage(usage);
    return parseCdkeyPoolText(poolText).filter((cdkey) => isSelectableUsageEntry(normalizedUsage[cdkey]));
  }

  function normalizeUsageWith(options = {}, usage = {}) {
    if (typeof options.normalizeUsage === 'function') {
      return options.normalizeUsage(usage || {});
    }
    return usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
  }

  function buildRedeemChannelUsageUpdates(channel = 'upi', usage = {}, options = {}) {
    const normalizedUsage = normalizeUsageWith(options, usage);
    const normalizedChannel = normalizeRedeemChannel(channel);
    if (normalizedChannel === 'ideal') {
      return {
        idealRedeemCdkeyUsage: normalizedUsage,
      };
    }
    if (normalizedChannel === 'pix') {
      return {
        pixChannelRedeemCdkeyUsage: normalizedUsage,
      };
    }
    return {
      cdkUsage: normalizedUsage,
      upiRedeemCdkUsage: normalizedUsage,
      upiRedeemCdkeyUsage: normalizedUsage,
    };
  }

  return {
    getUpiRedeemStateValue,
    getRedeemChannelPoolKey,
    getRedeemChannelUsageKey,
    getRedeemChannelPoolText,
    getRedeemChannelUsage,
    parseCdkeyPoolText,
    appendRedeemAttempt,
    markRedeemAttemptRecovered,
    normalizeRedeemAttemptHistory,
    normalizeCdkeyUsage,
    isActiveRemoteStatus,
    isSelectableUsageEntry,
    getAvailableCdkeys,
    buildRedeemChannelUsageUpdates,
  };
});
