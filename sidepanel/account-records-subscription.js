// sidepanel/account-records-subscription.js - Subscription status helpers for account records.
(function attachSidepanelAccountRecordsSubscription(globalScope) {
  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function createAccountRecordsSubscriptionHelpers(context = {}) {
    const buildRecordId = typeof context.buildRecordId === 'function'
      ? context.buildRecordId
      : () => '';
    const getRecordEmail = typeof context.getRecordEmail === 'function'
      ? context.getRecordEmail
      : () => '';
    const getRecordUpiRedeemCdkey = typeof context.getRecordUpiRedeemCdkey === 'function'
      ? context.getRecordUpiRedeemCdkey
      : () => '';

    function normalizeSubscriptionPlanType(value = '') {
      const normalized = normalizeText(value).toLowerCase().replace(/[\s-]+/g, '_');
      if (!normalized) {
        return '';
      }
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

    function isPaidSubscriptionPlan(value = '') {
      return ['plus', 'pro', 'team'].includes(normalizeSubscriptionPlanType(value));
    }

    function getRecordSubscriptionPlanType(record = {}) {
      return normalizeSubscriptionPlanType(
        record.upiRedeemSubscriptionPlanType
        || record.subscriptionPlanType
        || record.subscriptionPlan
        || record.planType
        || record.plan_type
        || record.plan
        || record.accountPlan
        || record.membershipPlan
        || record.memberPlan
        || record.chatGptPlan
        || ''
      );
    }

    function getRecordActiveSubscriptionFlag(record = {}) {
      const keys = [
        'upiRedeemSubscriptionActive',
        'upiRedeemHasActiveSubscription',
        'hasActiveSubscription',
        'has_active_subscription',
        'subscriptionActive',
        'subscription_active',
        'isPlus',
        'isPro',
        'isTeam',
      ];
      for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(record, key)) {
          return Boolean(record[key]);
        }
      }
      return null;
    }

    function buildSubscriptionCheckId(record = {}) {
      const recordId = buildRecordId(record);
      if (recordId) {
        return recordId;
      }
      const email = normalizeText(getRecordEmail(record)).toLowerCase();
      const cdkey = normalizeText(getRecordUpiRedeemCdkey(record)).toLowerCase();
      return email || cdkey ? `${email}::${cdkey}` : '';
    }

    function normalizeSubscriptionResultItem(item = {}) {
      const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
      return {
        ...source,
        active: source.active === true || normalizeText(source.active).toLowerCase() === 'true',
        planType: normalizeSubscriptionPlanType(source.planType || source.plan_type || source.plan || ''),
      };
    }

    function buildSubscriptionResultLookup(items = []) {
      const lookup = {};
      (Array.isArray(items) ? items : []).forEach((rawItem) => {
        const item = normalizeSubscriptionResultItem(rawItem);
        [
          item.id,
          item.email,
          item.cdkey,
        ].forEach((key) => {
          const normalizedKey = normalizeText(key).toLowerCase();
          if (normalizedKey) {
            lookup[normalizedKey] = item;
          }
        });
      });
      return lookup;
    }

    function getSubscriptionResultForRecord(record = {}, lookup = {}) {
      const keys = [
        buildSubscriptionCheckId(record),
        getRecordEmail(record),
        getRecordUpiRedeemCdkey(record),
      ];
      for (const key of keys) {
        const normalizedKey = normalizeText(key).toLowerCase();
        if (normalizedKey && lookup?.[normalizedKey]) {
          return lookup[normalizedKey];
        }
      }
      return null;
    }

    function isRecordPaidSubscription(record = {}, lookup = null) {
      const result = lookup ? getSubscriptionResultForRecord(record, lookup) : null;
      if (lookup) {
        return Boolean(result) && result.active === true && isPaidSubscriptionPlan(result.planType);
      }

      const planType = getRecordSubscriptionPlanType(record);
      if (!isPaidSubscriptionPlan(planType)) {
        return false;
      }
      const activeFlag = getRecordActiveSubscriptionFlag(record);
      return activeFlag !== false;
    }

    function getPaidSubscriptionPlanLabel(value = '') {
      const planType = normalizeSubscriptionPlanType(value);
      if (planType === 'pro') {
        return 'Pro';
      }
      if (planType === 'team') {
        return 'Team';
      }
      return 'Plus';
    }

    function getConfirmedUpiSubscriptionLabel(record = {}) {
      if (!record.upiRedeemSuccess || record.upiRedeemSubscriptionActive !== true) {
        return '';
      }
      const planType = getRecordSubscriptionPlanType(record);
      if (!isPaidSubscriptionPlan(planType)) {
        return '';
      }
      return `已开通 ${getPaidSubscriptionPlanLabel(planType)} 会员`;
    }

    return {
      normalizeSubscriptionPlanType,
      isPaidSubscriptionPlan,
      getRecordSubscriptionPlanType,
      getRecordActiveSubscriptionFlag,
      buildSubscriptionCheckId,
      normalizeSubscriptionResultItem,
      buildSubscriptionResultLookup,
      getSubscriptionResultForRecord,
      isRecordPaidSubscription,
      getPaidSubscriptionPlanLabel,
      getConfirmedUpiSubscriptionLabel,
    };
  }

  const api = {
    createAccountRecordsSubscriptionHelpers,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsSubscription = api;
})(typeof window !== 'undefined' ? window : globalThis);
