(function attachSidepanelCdkPoolState(globalScope, factory) {
  const api = factory();
  globalScope.SidepanelCdkPoolState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelCdkPoolStateModule() {
  const UPI_REDEEM_REMOTE_STATUS_LABELS = Object.freeze({
    pending: '等待处理',
    pending_dispatch: '等待兑换',
    dispatched: '已派发',
    dispatching: '派发中',
    running: '兑换中',
    redeeming: '兑换中',
    processing: '处理中',
    in_progress: '处理中',
    queued: '排队中',
    accepted: '已接收',
    submitted: '已提交',
    success: '兑换成功',
    failed: '兑换失败',
    timeout: '兑换超时',
    not_found: '未找到',
    rejected: '提交失败',
    approve_blocked: '审核阻塞',
    canceled: '已取消',
    cancelled: '已取消',
    unused: '可用',
    available: '可用',
    new: '可用',
    ready: '可用',
  });

  function createCdkPoolStateHelpers() {
    function normalizeUpiRedeemCdkeyPoolTextValue(value = '') {
      const seen = new Set();
      return String(value || '')
        .replace(/\r/g, '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => {
          if (!line || seen.has(line)) {
            return false;
          }
          seen.add(line);
          return true;
        })
        .join('\n');
    }

    function parseUpiRedeemCdkeyPoolTextValue(value = '') {
      return normalizeUpiRedeemCdkeyPoolTextValue(value)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    }

    function normalizeUpiRedeemSubscriptionActiveValue(value) {
      if (value === true) {
        return true;
      }
      if (value === false) {
        return false;
      }
      return null;
    }

    function normalizeUpiRedeemSubscriptionPlanType(value = '') {
      const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (normalized.includes('team')) {
        return 'team';
      }
      if (normalized.includes('pro')) {
        return 'pro';
      }
      if (normalized.includes('plus')) {
        return 'plus';
      }
      if (normalized.includes('free')) {
        return 'free';
      }
      return normalized;
    }

    function normalizeUpiRedeemJobCapabilityValue(value) {
      if (value === true) {
        return true;
      }
      if (value === false || value === null || value === undefined) {
        return false;
      }
      return ['1', 'true', 'yes', 'y', 'ok', 'active', 'success'].includes(
        String(value || '').trim().toLowerCase()
      );
    }

    function normalizeUpiRedeemCdkeyUsageValue(value = {}) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
      }
      return Object.fromEntries(Object.entries(value).map(([key, usage]) => {
        const cdkey = String(key || '').trim();
        const item = usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
        return [cdkey, {
          usedAt: Math.max(0, Number(item.usedAt) || 0),
          lastAttemptAt: Math.max(0, Number(item.lastAttemptAt) || 0),
          lastError: String(item.lastError || '').trim(),
          enabled: item.enabled !== false,
          email: String(item.email || item.accountEmail || item.credentialEmail || '').trim().toLowerCase(),
          accessToken: String(item.accessToken || item.access_token || item.upiRedeemAccessToken || '').trim(),
          accessTokenMasked: String(item.accessTokenMasked || '').trim(),
          accessTokenUpdatedAt: Math.max(0, Number(item.accessTokenUpdatedAt) || Number(item.tokenUpdatedAt) || 0),
          lastFailedEmail: String(item.lastFailedEmail || '').trim().toLowerCase(),
          lastFailedAt: Math.max(0, Number(item.lastFailedAt) || 0),
          lastFailedReason: String(item.lastFailedReason || '').trim(),
          releasedEmail: String(item.releasedEmail || item.approveBlockedEmail || '').trim().toLowerCase(),
          releaseReason: String(item.releaseReason || '').trim(),
          releasedAt: Math.max(0, Number(item.releasedAt) || 0),
          remoteStatus: String(item.remoteStatus || '').trim(),
          remoteMessage: String(item.remoteMessage || '').trim(),
          remoteCheckedAt: Math.max(0, Number(item.remoteCheckedAt) || 0),
          canCancel: normalizeUpiRedeemJobCapabilityValue(item.canCancel ?? item.can_cancel),
          canRetry: normalizeUpiRedeemJobCapabilityValue(item.canRetry ?? item.can_retry),
          canReuseToken: normalizeUpiRedeemJobCapabilityValue(item.canReuseToken ?? item.can_reuse_token),
          hasAccessToken: normalizeUpiRedeemJobCapabilityValue(item.hasAccessToken ?? item.has_access_token),
          retryCount: Math.max(0, Math.floor(Number(item.retryCount) || 0)),
          lastRetryAt: Math.max(0, Number(item.lastRetryAt) || 0),
          retrying: item.retrying === true,
          retryError: String(item.retryError || '').trim(),
          subscriptionActive: normalizeUpiRedeemSubscriptionActiveValue(item.subscriptionActive),
          subscriptionPlanType: normalizeUpiRedeemSubscriptionPlanType(item.subscriptionPlanType || item.subscription_plan_type),
          subscriptionCheckedAt: Math.max(0, Number(item.subscriptionCheckedAt) || 0),
          subscriptionReason: String(item.subscriptionReason || '').trim(),
        }];
      }).filter(([key]) => Boolean(key)));
    }

    function normalizeRedeemChannel(value = '') {
      return String(value || '').trim().toLowerCase() === 'ideal' ? 'ideal' : 'upi';
    }

    function getRedeemChannelLabel(channel = 'upi') {
      return normalizeRedeemChannel(channel) === 'ideal' ? 'IDEAL' : 'UPI';
    }

    function getStoredCdkPoolText(state = {}, channel = 'upi') {
      const normalizedChannel = normalizeRedeemChannel(channel);
      return normalizeUpiRedeemCdkeyPoolTextValue(
        normalizedChannel === 'ideal'
          ? (state?.idealRedeemCdkeyPoolText ?? '')
          : (state?.cdkPoolText
            ?? state?.upiRedeemCdkPoolText
            ?? state?.upiRedeemCdkeyPoolText
            ?? state?.pixRedeemCdkeyPoolText
            ?? '')
      );
    }

    function getStoredCdkUsage(state = {}, channel = 'upi') {
      const normalizedChannel = normalizeRedeemChannel(channel);
      return normalizeUpiRedeemCdkeyUsageValue(
        normalizedChannel === 'ideal'
          ? (state?.idealRedeemCdkeyUsage || {})
          : (state?.cdkUsage
            || state?.upiRedeemCdkUsage
            || state?.upiRedeemCdkeyUsage
            || state?.pixRedeemCdkeyUsage
            || {})
      );
    }

    function buildCdkPoolStatePatch(poolText = '', usage = {}, channel = 'upi') {
      const normalizedChannel = normalizeRedeemChannel(channel);
      const normalizedPoolText = normalizeUpiRedeemCdkeyPoolTextValue(poolText);
      const normalizedUsage = normalizeUpiRedeemCdkeyUsageValue(usage);
      if (normalizedChannel === 'ideal') {
        return {
          idealRedeemCdkeyPoolText: normalizedPoolText,
          idealRedeemCdkeyUsage: normalizedUsage,
        };
      }
      return {
        cdkPoolText: normalizedPoolText,
        upiRedeemCdkPoolText: normalizedPoolText,
        upiRedeemCdkeyPoolText: normalizedPoolText,
        pixRedeemCdkeyPoolText: normalizedPoolText,
        cdkUsage: normalizedUsage,
        upiRedeemCdkUsage: normalizedUsage,
        upiRedeemCdkeyUsage: normalizedUsage,
        pixRedeemCdkeyUsage: normalizedUsage,
      };
    }

    function isUpiRedeemDuplicateCdkeyMessage(message = '') {
      const text = String(message || '').trim();
      return /(?:CDK|CDKEY|卡密)[\s\S]*(?:不可重复提交|重复提交|已提交|already\s+submitted|duplicate\s+submit|duplicate\s+submission|already\s+redeemed|already\s+used)|(?:不可重复提交|重复提交|已提交|already\s+submitted|duplicate\s+submit|duplicate\s+submission|already\s+redeemed|already\s+used)[\s\S]*(?:CDK|CDKEY|卡密)/i.test(text);
    }

    function normalizeUpiRedeemRemoteStatusValue(status = '') {
      const normalized = String(status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
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

    function getUpiRedeemRemoteStatusLabel(status = '') {
      const normalized = normalizeUpiRedeemRemoteStatusValue(status);
      return UPI_REDEEM_REMOTE_STATUS_LABELS[normalized] || normalized || '';
    }

    function isRetryableUpiRedeemRemoteStatus(status = '') {
      return ['failed', 'timeout', 'rejected', 'approve_blocked'].includes(normalizeUpiRedeemRemoteStatusValue(status));
    }

    function isUpiRedeemRemoteActiveStatus(status = '') {
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
      ].includes(normalizeUpiRedeemRemoteStatusValue(status));
    }

    function isUpiRedeemCdkeySelectableForRedeem(entry = {}) {
      if (!entry || entry.enabled === false) {
        return false;
      }
      const remoteStatus = normalizeUpiRedeemRemoteStatusValue(entry.remoteStatus);
      const remoteMessageStatus = normalizeUpiRedeemRemoteStatusValue(entry.remoteMessage);
      if (entry.subscriptionActive === true) {
        return false;
      }
      if (
        remoteStatus === 'success'
        || (
          (remoteStatus === 'pending_dispatch' || remoteMessageStatus === 'pending_dispatch')
          && Boolean(String(entry.email || entry.accessToken || entry.access_token || entry.upiRedeemAccessToken || '').trim())
        )
        || remoteStatus === 'invalid'
        || remoteMessageStatus === 'invalid'
        || isUpiRedeemRemoteActiveStatus(remoteStatus)
        || isUpiRedeemRemoteActiveStatus(entry.remoteMessage)
        || entry.retrying === true
      ) {
        return false;
      }
      if (
        isUpiRedeemDuplicateCdkeyMessage(entry.remoteStatus)
        || isUpiRedeemDuplicateCdkeyMessage(entry.remoteMessage)
        || isUpiRedeemDuplicateCdkeyMessage(entry.lastError)
      ) {
        return false;
      }
      return true;
    }

    function getUpiRedeemRemoteStatusClass(status = '', used = false, enabled = true) {
      const normalized = normalizeUpiRedeemRemoteStatusValue(status);
      if (used || normalized === 'success') {
        return 'used';
      }
      if (isRetryableUpiRedeemRemoteStatus(normalized) || normalized === 'invalid') {
        return 'failed';
      }
      if (normalized === 'canceled') {
        return 'failed';
      }
      if (['pending', 'pending_token', 'pending_dispatch', 'dispatched', 'dispatching', 'queued', 'accepted', 'submitted'].includes(normalized)) {
        return 'pending';
      }
      if (['running', 'redeeming', 'processing', 'in_progress'].includes(normalized)) {
        return 'running';
      }
      return enabled ? 'active' : '';
    }

    function canCancelUpiRedeemCdkeyJob(entry = {}, used = false) {
      if (used || entry?.enabled === false || entry?.subscriptionActive === true) {
        return false;
      }
      return entry?.canCancel === true
        || isUpiRedeemRemoteActiveStatus(entry?.remoteStatus)
        || isUpiRedeemRemoteActiveStatus(entry?.remoteMessage);
    }

    function canRetryUpiRedeemCdkeyJob(entry = {}, used = false) {
      if (used || entry?.enabled === false || entry?.subscriptionActive === true) {
        return false;
      }
      const remoteStatus = normalizeUpiRedeemRemoteStatusValue(entry?.remoteStatus);
      const remoteMessageStatus = normalizeUpiRedeemRemoteStatusValue(entry?.remoteMessage);
      if (remoteStatus === 'canceled' || remoteStatus === 'not_found' || remoteMessageStatus === 'canceled' || remoteMessageStatus === 'not_found') {
        return false;
      }
      return entry?.canRetry === true
        && entry?.canReuseToken === true
        && entry?.hasAccessToken === true;
    }

    function getUpiRedeemSubscriptionPlanLabel(value = '') {
      const planType = normalizeUpiRedeemSubscriptionPlanType(value);
      if (planType === 'pro') {
        return 'Pro';
      }
      if (planType === 'team') {
        return 'Team';
      }
      return 'Plus';
    }

    return {
      UPI_REDEEM_REMOTE_STATUS_LABELS,
      normalizeUpiRedeemCdkeyPoolTextValue,
      parseUpiRedeemCdkeyPoolTextValue,
      normalizeUpiRedeemSubscriptionActiveValue,
      normalizeUpiRedeemSubscriptionPlanType,
      normalizeUpiRedeemJobCapabilityValue,
      normalizeUpiRedeemCdkeyUsageValue,
      normalizeRedeemChannel,
      getRedeemChannelLabel,
      getStoredCdkPoolText,
      getStoredCdkUsage,
      buildCdkPoolStatePatch,
      getUpiRedeemRemoteStatusLabel,
      isUpiRedeemDuplicateCdkeyMessage,
      normalizeUpiRedeemRemoteStatusValue,
      isRetryableUpiRedeemRemoteStatus,
      isUpiRedeemRemoteActiveStatus,
      isUpiRedeemCdkeySelectableForRedeem,
      getUpiRedeemRemoteStatusClass,
      canCancelUpiRedeemCdkeyJob,
      canRetryUpiRedeemCdkeyJob,
      getUpiRedeemSubscriptionPlanLabel,
    };
  }

  return {
    UPI_REDEEM_REMOTE_STATUS_LABELS,
    createCdkPoolStateHelpers,
  };
});
