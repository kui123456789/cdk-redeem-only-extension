(function attachSidepanelUpiRedeemCdkState(root, factory) {
  const api = factory();
  root.SidepanelUpiRedeemCdkState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelUpiRedeemCdkStateModule() {
  function createUpiRedeemCdkState(deps = {}) {
    const {
      cdkPoolStateHelpers = {},
      getLatestState = () => ({}),
      getCurrentUpiRedeemExternalApiKey = () => '',
    } = deps;
    const {
      normalizeUpiRedeemSubscriptionActiveValue = (value) => value,
      normalizeUpiRedeemSubscriptionPlanType = (value) => value,
      getUpiRedeemSubscriptionPlanLabel = (value) => String(value || '').trim(),
    } = cdkPoolStateHelpers;

    function isUpiRedeemApiAuthErrorMessage(message = '') {
      const text = String(message || '').trim();
      return /UPI_REDEEM_AUTH_ERROR::/i.test(text)
        || /UPI[\s\S]*(?:HTTP\s*40[13]|API\s*Key|ApiKey|External API Key|认证失败|权限不足|无权限|forbidden|unauthorized)/i.test(text)
        || /(?:HTTP\s*40[13]|API\s*Key|ApiKey|External API Key|认证失败|权限不足|无权限|forbidden|unauthorized)[\s\S]*UPI/i.test(text);
    }

    function maskUpiRedeemExternalApiKeyForDisplay(key = '') {
      const text = String(key || '').trim();
      if (!text) {
        return 'empty';
      }
      if (text.length <= 14) {
        return `${text.slice(0, 4)}***${text.slice(-3)}`;
      }
      return `${text.slice(0, 10)}...${text.slice(-6)}`;
    }

    function getUpiRedeemApiAuthErrorDisplayMessage(message = '') {
      const text = String(message || '').trim()
        .replace(/^UPI_REDEEM_AUTH_ERROR::/i, '')
        .replace(/^UPI\s*远端接口(?:认证失败|拒绝请求)[:：]?\s*/i, '');
      return `CDK 状态刷新被远端拒绝：${text || '请检查 API Key 权限、CDK 归属或后端返回原因。'} 当前输入 Key：${maskUpiRedeemExternalApiKeyForDisplay(getCurrentUpiRedeemExternalApiKey())}。`;
    }

    function hasUpiRedeemSubscriptionConfirmation(entry = {}) {
      return entry.subscriptionActive === true
        || entry.subscriptionActive === false
        || Number(entry.subscriptionCheckedAt) > 0
        || Boolean(String(entry.subscriptionPlanType || '').trim())
        || Boolean(String(entry.subscriptionReason || '').trim());
    }

    function getUpiRedeemCdkeySubscriptionDisplay(entry = {}) {
      if (!hasUpiRedeemSubscriptionConfirmation(entry)) {
        return null;
      }
      const active = normalizeUpiRedeemSubscriptionActiveValue(entry.subscriptionActive);
      const planType = normalizeUpiRedeemSubscriptionPlanType(entry.subscriptionPlanType);
      const reason = String(entry.subscriptionReason || '').trim();
      if (active === true) {
        const planLabel = getUpiRedeemSubscriptionPlanLabel(planType);
        return {
          label: `已开通 ${planLabel} 会员`,
          className: 'used',
          title: reason || `订阅接口已确认 ${planLabel} 会员`,
        };
      }
      if (active === false) {
        const reasonText = reason.toLowerCase();
        const knownNotPaid = planType === 'free'
          || /free|inactive|no active|not active|无会员|未激活|未开通/.test(reasonText);
        return {
          label: knownNotPaid ? '已兑换未开通会员' : '会员待确认',
          className: knownNotPaid ? 'failed' : 'pending',
          title: reason || (planType ? `订阅接口返回套餐：${planType}` : 'CDK 已提交成功，但订阅接口未确认 Plus/Pro/Team'),
        };
      }
      return null;
    }

    function mergeCurrentUpiRedeemSubscriptionState(entry = {}, cdkey = '', stateValue = getLatestState()) {
      const currentCdkey = String(stateValue?.upiRedeemCdkey || '').trim();
      if (!currentCdkey || currentCdkey !== String(cdkey || '').trim()) {
        return mergeUpiRedeemSubscriptionHistoryState(entry, cdkey, stateValue);
      }
      const hasCurrentConfirmation = stateValue?.upiRedeemSubscriptionActive === true
        || stateValue?.upiRedeemSubscriptionActive === false
        || Boolean(String(stateValue?.upiRedeemSubscriptionPlanType || '').trim())
        || Boolean(String(stateValue?.upiRedeemSubscriptionCheckedAt || '').trim());
      if (!hasCurrentConfirmation) {
        return mergeUpiRedeemSubscriptionHistoryState(entry, cdkey, stateValue);
      }
      const parsedCheckedAt = Date.parse(String(stateValue?.upiRedeemSubscriptionCheckedAt || ''));
      return {
        ...entry,
        subscriptionActive: normalizeUpiRedeemSubscriptionActiveValue(stateValue?.upiRedeemSubscriptionActive),
        subscriptionPlanType: normalizeUpiRedeemSubscriptionPlanType(stateValue?.upiRedeemSubscriptionPlanType || entry.subscriptionPlanType),
        subscriptionCheckedAt: Number.isFinite(parsedCheckedAt)
          ? parsedCheckedAt
          : Math.max(0, Number(entry.subscriptionCheckedAt) || 0),
        subscriptionReason: String(stateValue?.upiRedeemSubscriptionReason || entry.subscriptionReason || '').trim(),
      };
    }

    function mergeUpiRedeemSubscriptionHistoryState(entry = {}, cdkey = '', stateValue = getLatestState()) {
      const normalizedCdkey = String(cdkey || '').trim();
      if (!normalizedCdkey || hasUpiRedeemSubscriptionConfirmation(entry)) {
        return entry;
      }
      const records = Array.isArray(stateValue?.accountRunHistory) ? stateValue.accountRunHistory : [];
      for (let index = records.length - 1; index >= 0; index -= 1) {
        const record = records[index] || {};
        if (String(record.upiRedeemCdkey || '').trim() !== normalizedCdkey) {
          continue;
        }
        const hasRecordConfirmation = record.upiRedeemSubscriptionActive === true
          || record.upiRedeemSubscriptionActive === false
          || Boolean(String(record.upiRedeemSubscriptionPlanType || '').trim())
          || Boolean(String(record.upiRedeemSubscriptionCheckedAt || '').trim());
        if (!hasRecordConfirmation) {
          continue;
        }
        const parsedCheckedAt = Date.parse(String(record.upiRedeemSubscriptionCheckedAt || ''));
        return {
          ...entry,
          subscriptionActive: normalizeUpiRedeemSubscriptionActiveValue(record.upiRedeemSubscriptionActive),
          subscriptionPlanType: normalizeUpiRedeemSubscriptionPlanType(record.upiRedeemSubscriptionPlanType || entry.subscriptionPlanType),
          subscriptionCheckedAt: Number.isFinite(parsedCheckedAt)
            ? parsedCheckedAt
            : Math.max(0, Number(entry.subscriptionCheckedAt) || 0),
          subscriptionReason: String(record.upiRedeemSubscriptionReason || entry.subscriptionReason || '').trim(),
        };
      }
      return entry;
    }

    function getDefaultUpiRedeemCdkeyUsageEntry() {
      return {
        usedAt: 0,
        lastAttemptAt: 0,
        lastError: '',
        enabled: true,
        remoteStatus: '',
        remoteMessage: '',
        remoteCheckedAt: 0,
        canCancel: false,
        canRetry: false,
        canReuseToken: false,
        hasAccessToken: false,
        retryCount: 0,
        lastRetryAt: 0,
        retrying: false,
        retryError: '',
        subscriptionActive: null,
        subscriptionPlanType: '',
        subscriptionCheckedAt: 0,
        subscriptionReason: '',
      };
    }

    function getUpiRedeemCdkeyUsageEntry(usage = {}, cdkey = '') {
      return {
        ...getDefaultUpiRedeemCdkeyUsageEntry(),
        ...(usage?.[cdkey] || {}),
        enabled: usage?.[cdkey]?.enabled !== false,
      };
    }

    return {
      isUpiRedeemApiAuthErrorMessage,
      getUpiRedeemApiAuthErrorDisplayMessage,
      getUpiRedeemCdkeySubscriptionDisplay,
      mergeCurrentUpiRedeemSubscriptionState,
      getDefaultUpiRedeemCdkeyUsageEntry,
      getUpiRedeemCdkeyUsageEntry,
    };
  }

  return { createUpiRedeemCdkState };
});
