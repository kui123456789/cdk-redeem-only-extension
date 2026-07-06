(function attachMembershipRedeemStatusSync(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPageMembershipRedeemStatusSync = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipRedeemStatusSyncModule() {
  const DEFAULT_RESULTS_KEY = 'upiCredentialMembershipCheckResults';
  const PENDING_REDEEM_STATUSES = new Set([
    'running',
    'submitted',
    'pending',
    'pending_token',
    'pending_dispatch',
    'dispatched',
    'dispatching',
    'processing',
    'redeeming',
    'in_progress',
    'queued',
    'accepted',
  ]);

  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function normalizeRouterEmail(value = '') {
    return normalizeString(value).toLowerCase();
  }

  function defaultNormalizeRedeemChannel(value = '') {
    return normalizeString(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
  }

  function normalizeUpiRedeemRemoteStatusForRetry(status = '') {
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
    if (normalized === 'approve_blocked') {
      return 'approve_blocked';
    }
    if (/兑换成功|成功|已兑换|已使用|已用/.test(normalized)) {
      return 'success';
    }
    if (/提交失败|兑换失败|充值失败|失败|超时|拒绝|已拒绝|取消|已取消/.test(normalized)) {
      if (/超时/.test(normalized)) return 'timeout';
      if (/拒绝/.test(normalized)) return 'rejected';
      if (/取消/.test(normalized)) return 'canceled';
      return 'failed';
    }
    if (/未找到|不存在/.test(normalized)) {
      return 'not_found';
    }
    if (/无效|不可用/.test(normalized)) {
      return 'invalid';
    }
    if (/未使用|未兑换|可用/.test(normalized)) {
      return 'unused';
    }
    if (/waiting|queue|br_recharge|进入兑换队列|兑换队列|等待系统处理|等待.*接单|任务.*等待/.test(normalized)) {
      return 'queued';
    }
    if (/等待处理|待处理|待兑换|待派发/.test(normalized)) {
      return 'pending_dispatch';
    }
    if (/派发中|正在派发/.test(normalized)) {
      return 'dispatching';
    }
    if (/已派发/.test(normalized)) {
      return 'dispatched';
    }
    if (/兑换中|处理中|进行中|正在兑换/.test(normalized)) {
      return 'processing';
    }
    if (/已提交|已接收|排队/.test(normalized)) {
      return 'submitted';
    }
    if (normalized === 'succeeded' || normalized === 'redeemed' || normalized === 'used') {
      return 'success';
    }
    if (normalized === 'failure' || normalized === 'error') {
      return 'failed';
    }
    if (normalized === 'cancelled') {
      return 'canceled';
    }
    if (normalized === 'notused' || normalized === 'not_used' || normalized === 'unredeemed') {
      return 'unused';
    }
    return normalized;
  }

  function isRetryableUpiRedeemRemoteStatusForRetry(status = '') {
    return ['failed', 'timeout', 'rejected', 'approve_blocked'].includes(normalizeUpiRedeemRemoteStatusForRetry(status));
  }

  function isActiveUpiRedeemRemoteStatusForRetry(status = '') {
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
    ].includes(normalizeUpiRedeemRemoteStatusForRetry(status));
  }

  function isPendingUpiCredentialMembershipRedeemStatus(status = '') {
    return PENDING_REDEEM_STATUSES.has(normalizeUpiRedeemRemoteStatusForRetry(status));
  }

  function buildPendingUpiCredentialMembershipRedeemRefreshTargets(state = {}, input = {}, options = {}) {
    const resultsKey = normalizeString(options.resultsKey) || DEFAULT_RESULTS_KEY;
    const normalizeRedeemChannel = typeof options.normalizeRedeemChannel === 'function'
      ? options.normalizeRedeemChannel
      : defaultNormalizeRedeemChannel;
    const results = state?.[resultsKey] || {};
    const items = Array.isArray(results?.items) ? results.items : [];
    const targetEmail = normalizeRouterEmail(input.email || input.targetEmail || input.accountEmail || '');
    const targetChannel = normalizeString(input.channel || input.redeemChannel).toLowerCase();
    const targetCdkeys = new Set((Array.isArray(input.cdkeys) ? input.cdkeys : [input.cdkey])
      .map((cdkey) => normalizeString(cdkey).toLowerCase())
      .filter(Boolean));
    const targets = {
      upi: new Set(),
      ideal: new Set(),
    };
    const emailMap = {
      upi: {},
      ideal: {},
    };
    const emails = new Set();
    items.forEach((item) => {
      const email = normalizeRouterEmail(item?.email);
      if (!email || (targetEmail && email !== targetEmail)) {
        return;
      }
      const channel = normalizeRedeemChannel(item?.redeemChannel || item?.channel);
      if (targetChannel && ['upi', 'ideal'].includes(targetChannel) && channel !== targetChannel) {
        return;
      }
      const cdkey = normalizeString(item?.upiRedeemCdkey || item?.cdkey);
      if (!cdkey || (targetCdkeys.size && !targetCdkeys.has(cdkey.toLowerCase()))) {
        return;
      }
      const pending = isPendingUpiCredentialMembershipRedeemStatus(item?.redeemStatus)
        || isActiveUpiRedeemRemoteStatusForRetry(item?.remoteStatus)
        || isActiveUpiRedeemRemoteStatusForRetry(item?.redeemReason);
      if (!pending) {
        return;
      }
      targets[channel].add(cdkey);
      if (!emailMap[channel][cdkey]) {
        emailMap[channel][cdkey] = email;
      }
      emails.add(email);
    });
    return {
      upi: Array.from(targets.upi),
      ideal: Array.from(targets.ideal),
      emailMap,
      emailCount: emails.size,
      cdkCount: targets.upi.size + targets.ideal.size,
    };
  }

  function normalizeUpiCredentialMembershipRedeemRefreshResponse(response = {}, channel = '', fallbackCheckedCount = 0) {
    return {
      channel,
      checkedCount: Math.max(0, Math.floor(Number(response?.checkedCount) || fallbackCheckedCount)),
      updated: response?.membershipSync?.updated === true,
    };
  }

  function createRedeemStatusSyncHelpers(options = {}) {
    return {
      buildPendingUpiCredentialMembershipRedeemRefreshTargets: (state = {}, input = {}) => (
        buildPendingUpiCredentialMembershipRedeemRefreshTargets(state, input, options)
      ),
      isActiveUpiRedeemRemoteStatusForRetry,
      isPendingUpiCredentialMembershipRedeemStatus,
      isRetryableUpiRedeemRemoteStatusForRetry,
      normalizeUpiCredentialMembershipRedeemRefreshResponse,
      normalizeUpiRedeemRemoteStatusForRetry,
    };
  }

  return {
    buildPendingUpiCredentialMembershipRedeemRefreshTargets,
    createRedeemStatusSyncHelpers,
    isActiveUpiRedeemRemoteStatusForRetry,
    isPendingUpiCredentialMembershipRedeemStatus,
    isRetryableUpiRedeemRemoteStatusForRetry,
    normalizeUpiCredentialMembershipRedeemRefreshResponse,
    normalizeUpiRedeemRemoteStatusForRetry,
  };
});
