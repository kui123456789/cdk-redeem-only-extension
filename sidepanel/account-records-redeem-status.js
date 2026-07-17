// sidepanel/account-records-redeem-status.js - Redeem status normalization helpers.
(function attachSidepanelAccountRecordsRedeemStatus(globalScope) {
  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function createAccountRecordsRedeemStatusHelpers(context = {}) {
    const normalizeRedeemChannel = typeof context.normalizeRedeemChannel === 'function'
      ? context.normalizeRedeemChannel
      : (value = '') => {
        const normalized = normalizeText(value).toLowerCase();
        return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
      };

    function normalizeUpiRedeemRemoteStatus(status = '') {
      const normalized = normalizeText(status).toLowerCase().replace(/[\s-]+/g, '_');
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

    function normalizeUpiCredentialMembershipCapabilityFlag(value) {
      if (value === true) {
        return true;
      }
      const normalized = normalizeText(value).toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }

    function getRedeemChannelLabel(channel = 'upi') {
      return normalizeRedeemChannel(channel).toUpperCase();
    }

    return {
      normalizeUpiRedeemRemoteStatus,
      isActiveUpiRedeemRemoteStatus,
      normalizeUpiCredentialMembershipCapabilityFlag,
      getRedeemChannelLabel,
    };
  }

  const api = {
    createAccountRecordsRedeemStatusHelpers,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsRedeemStatus = api;
})(typeof window !== 'undefined' ? window : globalThis);
