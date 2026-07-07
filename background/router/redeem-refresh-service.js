(function attachRouterRedeemRefreshService(root, factory) {
  const api = factory(root);
  root.MultiPageRouterRedeemRefreshService = api;
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createRouterRedeemRefreshServiceModule(rootScope) {
  const UPI_CREDENTIAL_MEMBERSHIP_RESULTS_KEY = 'upiCredentialMembershipCheckResults';
  const DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT = 3;
  const REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS = 24 * 60 * 60 * 1000;
  const UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX = 20;
  const UPI_REDEEM_JOB_RETRY_COOLDOWN_MS = 60000;
  const UPI_REDEEM_REMOTE_SUCCESS_PENDING_VERIFY_LOG_COOLDOWN_MS = 120000;

  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function getRedeemChannelStateHelpers() {
    return rootScope.MultiPageRedeemChannelState || {};
  }

  function getRedeemCdkeyUsageHelpers() {
    return rootScope.MultiPageRedeemCdkeyUsage || {};
  }

  function getMembershipRedeemStatusSyncHelpers() {
    return rootScope.MultiPageMembershipRedeemStatusSync || {};
  }

  function createRouterRedeemRefreshService(deps = {}) {
    const {
      addLog = null,
      broadcastDataUpdate = () => {},
      checkUpiRedeemSubscriptionStatuses = null,
      getState = async () => ({}),
      isAutoRunLockedState = () => false,
      refreshUpiRedeemCdkeyStatuses = null,
      retryFailedUpiRedeemCdkey = null,
      retryUpiRedeemCdkeyJobs = null,
      resultsKey = UPI_CREDENTIAL_MEMBERSHIP_RESULTS_KEY,
      setState = null,
    } = deps;

    let membershipRedeemStatusSyncHelpers = null;

    function normalizeRedeemChannel(value = '') {
      const helper = getRedeemChannelStateHelpers().normalizeRedeemChannel;
      if (typeof helper === 'function') {
        return helper(value);
      }
      return normalizeString(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
    }

    function getRedeemChannelUsage(state = {}, channel = 'upi') {
      const helper = getRedeemCdkeyUsageHelpers().getRedeemChannelUsage;
      if (typeof helper === 'function') {
        return helper(state, channel);
      }
      const source = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
      if (normalizeRedeemChannel(channel) === 'ideal') {
        return Object.prototype.hasOwnProperty.call(source, 'idealRedeemCdkeyUsage')
          ? source.idealRedeemCdkeyUsage
          : undefined;
      }
      if (Object.prototype.hasOwnProperty.call(source, 'cdkUsage')) return source.cdkUsage;
      if (Object.prototype.hasOwnProperty.call(source, 'upiRedeemCdkUsage')) return source.upiRedeemCdkUsage;
      if (Object.prototype.hasOwnProperty.call(source, 'upiRedeemCdkeyUsage')) return source.upiRedeemCdkeyUsage;
      return undefined;
    }

    function getRedeemChannelUsageUpdates(channel = 'upi', usage = {}) {
      const helper = getRedeemCdkeyUsageHelpers().buildRedeemChannelUsageUpdates;
      if (typeof helper === 'function') {
        return helper(channel, usage);
      }
      const source = usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
      if (normalizeRedeemChannel(channel) === 'ideal') {
        return {
          idealRedeemCdkeyUsage: source,
        };
      }
      return {
        cdkUsage: source,
        upiRedeemCdkUsage: source,
        upiRedeemCdkeyUsage: source,
      };
    }

    function getMembershipRedeemStatusSyncHelperSet() {
      if (!membershipRedeemStatusSyncHelpers) {
        const factory = getMembershipRedeemStatusSyncHelpers().createRedeemStatusSyncHelpers;
        if (typeof factory !== 'function') {
          throw new Error('Membership redeem status sync helper module is not loaded.');
        }
        membershipRedeemStatusSyncHelpers = factory({
          normalizeRedeemChannel,
          resultsKey,
        });
      }
      return membershipRedeemStatusSyncHelpers;
    }

    function getMembershipRedeemStatusSyncHelper(name = '') {
      const helper = getMembershipRedeemStatusSyncHelperSet()[name];
      if (typeof helper !== 'function') {
        throw new Error(`Membership redeem status sync helper is not loaded: ${name}.`);
      }
      return helper;
    }

    function getUpiRedeemTotalRoundLimit(configuredRoundCount = 0) {
      const roundCount = Math.max(0, Math.min(
        UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX,
        Math.floor(Number(configuredRoundCount) || 0)
      ));
      return roundCount > 0 ? roundCount : 1;
    }

    function getUpiRedeemRoundLabel(roundNumber = 1, totalRoundLimit = 1) {
      return `兑换轮 ${Math.max(1, Math.floor(Number(roundNumber) || 1))}/${Math.max(1, Math.floor(Number(totalRoundLimit) || 1))}`;
    }

    function normalizeRouterRetryCount(value = 0) {
      return Math.max(0, Math.floor(Number(value) || 0));
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
        return normalizeRouterRetryCount(item?.[field]);
      }
      const legacyChannel = normalizeString(item?.redeemChannel || item?.channel || item?.paymentChannel)
        ? normalizeRedeemChannel(item.redeemChannel || item.channel || item.paymentChannel)
        : '';
      return legacyChannel === normalizedChannel ? normalizeRouterRetryCount(item?.redeemFailureCount) : 0;
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

    function buildRedeemAccountUnlockedPatch() {
      return {
        redeemLocked: false,
        redeemLockedReason: '',
        redeemLockedAt: '',
      };
    }

    function getRedeemLockReason(item = {}) {
      return normalizeString(item?.redeemLockedReason)
        || 'IDEAL 已失败 3 次，账号已封存，不再使用';
    }

    function buildRedeemChannelFailurePatch(item = {}, channel = 'upi', options = {}) {
      const normalizedChannel = normalizeRedeemChannel(channel);
      const failedAt = normalizeString(options.failedAt) || new Date().toISOString();
      const reason = normalizeString(options.reason) || '兑换失败';
      const failureLimit = getUpiRedeemTotalRoundLimit(DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT);
      const count = Math.min(
        failureLimit,
        getRedeemChannelFailureCount(item, normalizedChannel) + 1
      );
      const patch = {
        [getRedeemChannelFailureField(normalizedChannel)]: count,
        redeemFailureCount: count,
        redeemFailureLimit: failureLimit,
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
      if (normalizedChannel === 'ideal' && count >= failureLimit) {
        const lockReason = `IDEAL 已失败 ${failureLimit} 次，账号已封存，不再使用：${reason}`;
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

    function normalizeUpiRedeemRemoteStatusForRetry(status = '') {
      return getMembershipRedeemStatusSyncHelper('normalizeUpiRedeemRemoteStatusForRetry')(status);
    }

    function isRetryableUpiRedeemRemoteStatusForRetry(status = '') {
      return getMembershipRedeemStatusSyncHelper('isRetryableUpiRedeemRemoteStatusForRetry')(status);
    }

    function isActiveUpiRedeemRemoteStatusForRetry(status = '') {
      return getMembershipRedeemStatusSyncHelper('isActiveUpiRedeemRemoteStatusForRetry')(status);
    }

    function isPendingUpiCredentialMembershipRedeemStatus(status = '') {
      return getMembershipRedeemStatusSyncHelper('isPendingUpiCredentialMembershipRedeemStatus')(status);
    }

    function buildPendingUpiCredentialMembershipRedeemRefreshTargets(state = {}, input = {}) {
      return getMembershipRedeemStatusSyncHelper('buildPendingUpiCredentialMembershipRedeemRefreshTargets')(state, input);
    }

    function getUpiRedeemStateValueForRetry(state = {}, key = '') {
      const helper = getRedeemCdkeyUsageHelpers().getUpiRedeemStateValue;
      if (typeof helper === 'function') {
        return helper(state, key);
      }
      const normalizedKey = normalizeString(key);
      if (!normalizedKey) return undefined;
      if (state?.[normalizedKey] !== undefined) return state[normalizedKey];
      const cdkAliases = {
        cdkPoolText: ['cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText'],
        upiRedeemCdkPoolText: ['upiRedeemCdkPoolText', 'cdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText'],
        upiRedeemCdkeyPoolText: ['upiRedeemCdkeyPoolText', 'cdkPoolText', 'upiRedeemCdkPoolText', 'pixRedeemCdkeyPoolText'],
        pixRedeemCdkeyPoolText: ['pixRedeemCdkeyPoolText', 'cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText'],
        cdkUsage: ['cdkUsage', 'upiRedeemCdkUsage', 'upiRedeemCdkeyUsage', 'pixRedeemCdkeyUsage'],
        upiRedeemCdkUsage: ['upiRedeemCdkUsage', 'cdkUsage', 'upiRedeemCdkeyUsage', 'pixRedeemCdkeyUsage'],
        upiRedeemCdkeyUsage: ['upiRedeemCdkeyUsage', 'cdkUsage', 'upiRedeemCdkUsage', 'pixRedeemCdkeyUsage'],
        pixRedeemCdkeyUsage: ['pixRedeemCdkeyUsage', 'cdkUsage', 'upiRedeemCdkUsage', 'upiRedeemCdkeyUsage'],
      };
      for (const alias of cdkAliases[normalizedKey] || []) {
        if (state?.[alias] !== undefined) return state[alias];
      }
      const legacyKey = normalizedKey.replace(/^upiRedeem/, 'pixRedeem');
      return legacyKey === normalizedKey ? undefined : state?.[legacyKey];
    }

    function parseUpiRedeemCdkeyPoolTextForRetry(value = '') {
      const helper = getRedeemCdkeyUsageHelpers().parseCdkeyPoolText;
      if (typeof helper === 'function') {
        return helper(value);
      }
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

    function normalizeRouterEmail(value = '') {
      return normalizeString(value).toLowerCase();
    }

    function isSelectableUpiRedeemCdkeyUsageEntryForRetry(entry = {}) {
      if (!entry || entry.enabled === false) return false;
      const remoteStatus = normalizeUpiRedeemRemoteStatusForRetry(entry.remoteStatus);
      const remoteMessageStatus = normalizeUpiRedeemRemoteStatusForRetry(entry.remoteMessage);
      if (entry.subscriptionActive === true) return false;
      if (remoteStatus === 'success' || remoteMessageStatus === 'success') return false;
      if (remoteStatus === 'invalid' || remoteMessageStatus === 'invalid') return false;
      if (
        (remoteStatus === 'pending_dispatch' || remoteMessageStatus === 'pending_dispatch')
        && (
          normalizeRouterEmail(entry.email || entry.accountEmail || entry.credentialEmail || entry.targetEmail)
          || normalizeString(entry.accessToken || entry.access_token || entry.upiRedeemAccessToken)
        )
      ) {
        return false;
      }
      if (
        isActiveUpiRedeemRemoteStatusForRetry(remoteStatus)
        || isActiveUpiRedeemRemoteStatusForRetry(remoteMessageStatus)
        || entry.retrying === true
      ) {
        return false;
      }
      return true;
    }

    function countAvailableUpiRedeemCdkeysForRetry(state = {}) {
      const usage = getUpiRedeemStateValueForRetry(state, 'upiRedeemCdkeyUsage') || {};
      const normalizedUsage = usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
      return parseUpiRedeemCdkeyPoolTextForRetry(getUpiRedeemStateValueForRetry(state, 'upiRedeemCdkeyPoolText'))
        .filter((cdkey) => isSelectableUpiRedeemCdkeyUsageEntryForRetry(normalizedUsage?.[cdkey] || {}))
        .length;
    }

    function isApproveBlockedRemoteText(value = '') {
      return /(^|[^a-z0-9])approve-blocked([^a-z0-9]|$)/i.test(
        normalizeString(value).toLowerCase().replace(/[\s_]+/g, '-')
      );
    }

    function isApproveBlockedRemoteEntry(entry = {}) {
      if (!entry || typeof entry !== 'object') {
        return false;
      }
      return entry.approveBlocked === true
        || isApproveBlockedRemoteText(entry.remoteStatus)
        || isApproveBlockedRemoteText(entry.remoteMessage)
        || isApproveBlockedRemoteText(entry.releaseReason)
        || Boolean(
          entry.releasedEmail
          && entry.releasedAt
          && normalizeUpiRedeemRemoteStatusForRetry(entry.remoteStatus) === 'unused'
        );
    }

    function normalizeRouterPlanType(value = '') {
      const normalized = normalizeString(value).toLowerCase().replace(/[\s-]+/g, '_');
      if (normalized.includes('team')) return 'team';
      if (normalized.includes('pro')) return 'pro';
      if (normalized.includes('plus')) return 'plus';
      if (normalized.includes('free')) return 'free';
      return normalized;
    }

    function isPaidRouterPlanType(value = '') {
      return ['plus', 'pro', 'team'].includes(normalizeRouterPlanType(value));
    }

    function getRouterSubscriptionItemPlanType(item = {}) {
      return normalizeRouterPlanType(
        item?.planType
        || item?.plan_type
        || item?.subscriptionPlan
        || item?.subscription_plan
        || item?.payload?.planType
        || item?.payload?.plan_type
        || item?.payload?.subscriptionPlan
        || item?.payload?.subscription_plan
        || ''
      );
    }

    function isVerifiedPaidUpiRedeemRemoteEntry(entry = {}) {
      if (entry?.subscriptionActive !== true) {
        return false;
      }
      const planType = normalizeRouterPlanType(entry.subscriptionPlanType || entry.subscription_plan_type || '');
      return !planType || isPaidRouterPlanType(planType);
    }

    function normalizeRouterBoolean(value) {
      if (value === true || value === false) return value;
      const normalized = normalizeString(value).toLowerCase();
      if (['true', '1', 'yes', 'y', 'active', 'paid'].includes(normalized)) return true;
      if (['false', '0', 'no', 'n', 'inactive', 'free'].includes(normalized)) return false;
      return false;
    }

    function classifyRouterSubscriptionItem(item = {}) {
      const planType = getRouterSubscriptionItemPlanType(item);
      const active = item?.active === true
        || item?.hasActiveSubscription === true
        || item?.has_active_subscription === true
        || item?.subscriptionActive === true
        || item?.subscription_active === true
        || item?.payload?.hasActiveSubscription === true
        || item?.payload?.has_active_subscription === true
        || item?.payload?.subscriptionActive === true
        || item?.payload?.subscription_active === true;
      const hasExplicitActiveFlag = ['active', 'hasActiveSubscription', 'has_active_subscription', 'subscriptionActive', 'subscription_active']
        .some((key) => Object.prototype.hasOwnProperty.call(item || {}, key))
        || ['hasActiveSubscription', 'has_active_subscription', 'subscriptionActive', 'subscription_active']
          .some((key) => Object.prototype.hasOwnProperty.call(item?.payload || {}, key));
      const explicitActive = hasExplicitActiveFlag
        ? active
        : normalizeRouterBoolean(item?.reason || item?.status || item?.ok);
      const paid = (active || explicitActive) && isPaidRouterPlanType(planType);
      return {
        active: paid,
        planType: paid ? planType : '',
        reason: normalizeString(item?.reason || item?.message || item?.payload?.reason || item?.payload?.message || ''),
      };
    }

    function getUpiRedeemRemoteEntryRank(entry = {}) {
      const remoteStatus = normalizeUpiRedeemRemoteStatusForRetry(entry.remoteStatus);
      if (entry.subscriptionActive === true || remoteStatus === 'success') {
        return 4;
      }
      if (isActiveUpiRedeemRemoteStatusForRetry(remoteStatus)) {
        return 3;
      }
      if (isRetryableUpiRedeemRemoteStatusForRetry(remoteStatus)) {
        return 2;
      }
      if (['not_found', 'unused', 'available', 'new', 'ready'].includes(remoteStatus)) {
        return 1;
      }
      return 0;
    }

    function getUpiRedeemRemoteEntryTimestamp(entry = {}) {
      return Math.max(
        0,
        Math.floor(Number(entry.subscriptionCheckedAt) || 0),
        Math.floor(Number(entry.remoteCheckedAt) || 0),
        Math.floor(Number(entry.lastAttemptAt) || 0)
      );
    }

    function pickPreferredUpiRedeemRemoteEntry(current = null, candidate = null) {
      if (!candidate) {
        return current || null;
      }
      if (!current) {
        return candidate;
      }
      const currentRank = getUpiRedeemRemoteEntryRank(current);
      const candidateRank = getUpiRedeemRemoteEntryRank(candidate);
      if (candidateRank !== currentRank) {
        return candidateRank > currentRank ? candidate : current;
      }
      return getUpiRedeemRemoteEntryTimestamp(candidate) >= getUpiRedeemRemoteEntryTimestamp(current)
        ? candidate
        : current;
    }

    function buildUpiRedeemRemoteEntryLookup(usage = {}) {
      const byCdkey = {};
      const byEmail = {};
      const byAccessToken = {};
      const source = usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
      Object.entries(source).forEach(([rawCdkey, rawEntry]) => {
        const cdkey = normalizeString(rawCdkey);
        const entry = rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry) ? rawEntry : {};
        if (!cdkey) {
          return;
        }
        const email = normalizeRouterEmail(entry.email || entry.accountEmail || entry.credentialEmail || entry.targetEmail);
        const failedEmail = normalizeRouterEmail(entry.lastFailedEmail);
        const releasedEmail = normalizeRouterEmail(entry.releasedEmail || entry.approveBlockedEmail);
        const accessToken = normalizeString(entry.accessToken || entry.access_token || entry.upiRedeemAccessToken);
        const remoteEntry = {
          cdkey,
          email: email || failedEmail || releasedEmail,
          accessToken,
          accessTokenMasked: normalizeString(entry.accessTokenMasked),
          releasedEmail,
          remoteStatus: normalizeUpiRedeemRemoteStatusForRetry(entry.remoteStatus || entry.remoteMessage),
          remoteMessage: normalizeString(entry.remoteMessage || entry.lastError || entry.retryError),
          remoteCheckedAt: Math.max(0, Math.floor(Number(entry.remoteCheckedAt) || 0)),
          lastAttemptAt: Math.max(0, Math.floor(Number(entry.lastAttemptAt) || 0)),
          releaseReason: normalizeString(entry.releaseReason),
          releasedAt: Math.max(0, Math.floor(Number(entry.releasedAt) || 0)),
          approveBlocked: entry.approveBlocked === true,
          subscriptionActive: entry.subscriptionActive === true,
          subscriptionPlanType: normalizeRouterPlanType(entry.subscriptionPlanType || entry.subscription_plan_type),
          subscriptionCheckedAt: Math.max(0, Math.floor(Number(entry.subscriptionCheckedAt) || 0)),
          subscriptionReason: normalizeString(entry.subscriptionReason),
        };
        byCdkey[cdkey.toLowerCase()] = remoteEntry;
        if (email || failedEmail || releasedEmail) {
          const emailKey = email || failedEmail || releasedEmail;
          byEmail[emailKey] = pickPreferredUpiRedeemRemoteEntry(byEmail[emailKey], remoteEntry);
        }
        if (accessToken) {
          byAccessToken[accessToken] = pickPreferredUpiRedeemRemoteEntry(byAccessToken[accessToken], remoteEntry);
        }
      });
      return { byCdkey, byEmail, byAccessToken };
    }

    function isUpiRedeemRemoteEntryCompatibleWithMembershipRow(entry = null, row = {}, options = {}) {
      if (!entry) {
        return false;
      }
      const rowEmail = normalizeRouterEmail(row.email);
      const rowCdkey = normalizeString(row.upiRedeemCdkey || row.cdkey);
      const rowAccessToken = normalizeString(row.accessToken || row.access_token || row.upiRedeemAccessToken);
      if (entry.email && rowEmail && entry.email !== rowEmail) {
        return false;
      }
      if (entry.accessToken && rowAccessToken && entry.accessToken !== rowAccessToken) {
        return false;
      }
      if (options.requireCdkey === true && rowCdkey && entry.cdkey && entry.cdkey.toLowerCase() !== rowCdkey.toLowerCase()) {
        return false;
      }
      return true;
    }

    function getUpiRedeemRemoteEntryForMembershipRow(row = {}, lookup = {}) {
      const rowEmail = normalizeRouterEmail(row.email);
      const rowCdkey = normalizeString(row.upiRedeemCdkey || row.cdkey);
      const rowAccessToken = normalizeString(row.accessToken || row.access_token || row.upiRedeemAccessToken);
      if (rowCdkey) {
        const cdkeyEntry = lookup.byCdkey?.[rowCdkey.toLowerCase()] || null;
        return isUpiRedeemRemoteEntryCompatibleWithMembershipRow(cdkeyEntry, row, { requireCdkey: true })
          ? cdkeyEntry
          : null;
      }
      const tokenEntry = rowAccessToken ? lookup.byAccessToken?.[rowAccessToken] : null;
      const emailEntry = rowEmail ? lookup.byEmail?.[rowEmail] : null;
      return pickPreferredUpiRedeemRemoteEntry(
        isUpiRedeemRemoteEntryCompatibleWithMembershipRow(tokenEntry, row) ? tokenEntry : null,
        isUpiRedeemRemoteEntryCompatibleWithMembershipRow(emailEntry, row) ? emailEntry : null
      );
    }

    async function verifyRemoteSuccessMembershipForRow(entry = {}, row = {}, state = {}) {
      if (typeof checkUpiRedeemSubscriptionStatuses !== 'function') {
        return null;
      }
      const token = normalizeString(
        entry.accessToken
        || row.accessToken
        || row.access_token
        || row.upiRedeemAccessToken
      );
      if (!token) {
        return null;
      }
      const email = normalizeRouterEmail(row.email || entry.email);
      const cdkey = normalizeString(entry.cdkey || row.upiRedeemCdkey || row.cdkey);
      try {
        const response = await checkUpiRedeemSubscriptionStatuses({
          ...state,
          items: [{
            id: email || cdkey || 'upi-membership-verify',
            email,
            cdkey,
            token,
          }],
        });
        const item = Array.isArray(response?.items) ? response.items[0] : null;
        const classified = classifyRouterSubscriptionItem(item || {});
        return {
          checked: true,
          active: classified.active,
          planType: classified.planType,
          reason: classified.reason || (classified.active ? `已开通 ${classified.planType}` : '会员验证未确认 Plus/Pro/Team'),
          checkedAtMs: Date.now(),
        };
      } catch (error) {
        return {
          checked: true,
          active: false,
          planType: '',
          reason: error?.message || String(error || '会员验证失败'),
          checkedAtMs: Date.now(),
        };
      }
    }

    function toIsoFromTimestampOrNow(value = 0) {
      const timestamp = Math.max(0, Math.floor(Number(value) || 0)) || Date.now();
      const date = new Date(timestamp);
      return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }

    function normalizeRouterTimestampMs(value = '') {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.floor(value);
      }
      const parsed = Date.parse(String(value || ''));
      return Number.isFinite(parsed) ? parsed : 0;
    }

    function getRemoteSuccessPendingVerifyLogState(item = {}, verifyReason = '', nowMs = Date.now()) {
      const lastLoggedAtMs = normalizeRouterTimestampMs(
        item.upiRedeemPendingVerifyLoggedAt
        || item.redeemPendingVerifyLoggedAt
        || ''
      );
      const lastReason = normalizeString(
        item.upiRedeemPendingVerifyReason
        || item.redeemReason
        || item.reason
      );
      const normalizedRedeemStatus = normalizeUpiRedeemRemoteStatusForRetry(item.redeemStatus);
      const pendingStatusSame = isPendingUpiCredentialMembershipRedeemStatus(normalizedRedeemStatus);
      const reasonSame = Boolean(verifyReason && lastReason && verifyReason === lastReason);
      const cooldownActive = Boolean(
        lastLoggedAtMs
        && nowMs - lastLoggedAtMs < UPI_REDEEM_REMOTE_SUCCESS_PENDING_VERIFY_LOG_COOLDOWN_MS
      );
      return {
        cooldownActive,
        lastLoggedAtMs,
        lastReason,
        pendingStatusSame,
        reasonSame,
      };
    }

    function shouldPreserveFreeMembershipOverrideForRemoteSuccess(item = {}, successCheckedAt = '') {
      if (normalizeString(item?.status).toLowerCase() !== 'free') {
        return false;
      }
      if (normalizeString(item?.membershipOverrideStatus).toLowerCase() !== 'free') {
        return false;
      }
      const overrideCheckedAt = normalizeRouterTimestampMs(item.membershipOverrideCheckedAt || item.checkedAt);
      const successCheckedAtMs = normalizeRouterTimestampMs(successCheckedAt);
      return !successCheckedAtMs || !overrideCheckedAt || overrideCheckedAt >= successCheckedAtMs;
    }

    function buildUpiCredentialMembershipResultCounts(results = {}, items = []) {
      const normalizedItems = Array.isArray(items) ? items : [];
      return {
        ...results,
        items: normalizedItems,
        paidCount: normalizedItems.filter((item) => normalizeString(item?.status) === 'paid').length,
        freeCount: normalizedItems.filter((item) => normalizeString(item?.status) === 'free').length,
        failedCount: normalizedItems.filter((item) => normalizeString(item?.status) === 'failed').length,
      };
    }

    async function syncUpiCredentialMembershipResultsAfterCdkeyRefresh(refreshResult = {}, state = {}) {
      const channel = normalizeRedeemChannel(refreshResult?.channel || state?.channel || state?.redeemChannel);
      const usage = getRedeemChannelUsage(refreshResult?.updates || {}, channel)
        || getRedeemChannelUsage(state, channel)
        || {};
      const results = state?.[resultsKey];
      const items = Array.isArray(results?.items) ? results.items : [];
      if (!items.length) {
        return { updated: false, updates: {}, deletedEmails: [], results };
      }
      const configuredRoundCount = DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT;
      const totalRoundLimit = getUpiRedeemTotalRoundLimit(configuredRoundCount);

      const lookup = buildUpiRedeemRemoteEntryLookup(usage);
      const nextUsage = usage && typeof usage === 'object' && !Array.isArray(usage) ? { ...usage } : {};
      const deletedEmails = new Set(Array.isArray(results.redeemAutoDeletedEmails)
        ? results.redeemAutoDeletedEmails.map(normalizeRouterEmail).filter(Boolean)
        : []);
      const nextItems = [];
      let changed = false;
      let usageChanged = false;

      for (const item of items) {
        const rowEmail = normalizeRouterEmail(item?.email);
        const rowCdkey = normalizeString(item?.upiRedeemCdkey || item?.cdkey);
        const cdkeyEntry = rowCdkey ? lookup.byCdkey?.[rowCdkey.toLowerCase()] || null : null;
        if (
          rowEmail
          && rowCdkey
          && cdkeyEntry
          && isPendingUpiCredentialMembershipRedeemStatus(item?.redeemStatus)
          && !isUpiRedeemRemoteEntryCompatibleWithMembershipRow(cdkeyEntry, item, { requireCdkey: true })
        ) {
          const releasedAt = new Date().toISOString();
          const reason = `当前 CDK ${rowCdkey} 已绑定其他账号，已回到 Free 等待重新匹配`;
          changed = true;
          nextItems.push({
            ...item,
            status: 'free',
            planType: 'free',
            reason,
            redeemStatus: 'failed',
            redeemReason: reason,
            redeemFailureCount: normalizeRouterRetryCount(item?.redeemFailureCount),
            redeemFailureLimit: totalRoundLimit,
            redeemLastFailedAt: item?.redeemLastFailedAt || releasedAt,
            lastFailedUpiRedeemCdkey: rowCdkey,
            upiRedeemCdkey: '',
            redeemChannel: channel,
            membershipOverrideStatus: 'free',
            membershipOverrideCheckedAt: item?.membershipOverrideCheckedAt || releasedAt,
          });
          if (typeof addLog === 'function') {
            await addLog(`UPI Free 兑换：${rowEmail} -> ${reason}`, 'warn');
          }
          continue;
        }
        let entry = getUpiRedeemRemoteEntryForMembershipRow(item, lookup);
        if (!rowEmail || !entry) {
          nextItems.push(item);
          continue;
        }

        const remoteStatus = normalizeUpiRedeemRemoteStatusForRetry(entry.remoteStatus);
        const remoteMessage = entry.subscriptionReason || entry.remoteMessage || 'CDK 远端已返回结果';
        if (isApproveBlockedRemoteEntry(entry)) {
          const failedAt = toIsoFromTimestampOrNow(entry.remoteCheckedAt);
          const failedAtMs = Math.max(0, Date.parse(failedAt) || Number(entry.remoteCheckedAt) || Date.now());
          const failedCdkey = normalizeString(entry.cdkey || item.upiRedeemCdkey);
          const failurePatch = buildRedeemChannelFailurePatch(item, channel, {
            reason: remoteMessage || '后端返回 approve-blocked',
            failedAt,
          });
          const failureCount = getRedeemChannelFailureCount(failurePatch, channel);
          const failureLabel = getUpiRedeemRoundLabel(failureCount, totalRoundLimit);
          const reachedUpiDailyLimit = channel === 'upi' && isRedeemChannelDailyLimitReason(remoteMessage);
          if (failedCdkey) {
            const currentUsageEntry = nextUsage[failedCdkey] && typeof nextUsage[failedCdkey] === 'object' && !Array.isArray(nextUsage[failedCdkey])
              ? nextUsage[failedCdkey]
              : {};
            const releasedEntry = {
              ...currentUsageEntry,
              usedAt: 0,
              lastAttemptAt: Math.max(0, Math.floor(Number(currentUsageEntry.lastAttemptAt) || 0)),
              lastError: remoteMessage || '后端返回 approve-blocked',
              enabled: currentUsageEntry.enabled !== false,
              email: '',
              accessToken: '',
              accessTokenMasked: '',
              accessTokenUpdatedAt: 0,
              releasedEmail: '',
              releaseReason: '',
              releasedAt: 0,
              lastFailedEmail: rowEmail,
              lastFailedAt: failedAtMs,
              lastFailedReason: remoteMessage || '后端返回 approve-blocked',
              remoteStatus: 'approve_blocked',
              remoteMessage: `${remoteMessage || '后端返回 approve-blocked'}；CDK 已回到可用池，等待其他账号匹配`,
              remoteCheckedAt: Math.max(0, Math.floor(Number(entry.remoteCheckedAt) || failedAtMs)),
              retrying: false,
              retryError: '',
            };
            delete releasedEntry.subscriptionActive;
            delete releasedEntry.subscriptionPlanType;
            delete releasedEntry.subscriptionCheckedAt;
            delete releasedEntry.subscriptionReason;
            nextUsage[failedCdkey] = releasedEntry;
            usageChanged = true;
          }
          changed = true;
          nextItems.push({
            ...item,
            status: 'free',
            planType: 'free',
            reason: channel === 'ideal' && failureCount >= totalRoundLimit
              ? getRedeemLockReason(failurePatch)
              : reachedUpiDailyLimit
                ? `${remoteMessage || '后端返回 approve-blocked'}（UPI 今日提交次数已达上限，已转入 IDEAL 候选）`
                : `${remoteMessage || '后端返回 approve-blocked'}（${failureLabel}，已回到待兑换）`,
            redeemStatus: 'failed',
            redeemReason: remoteMessage || '后端返回 approve-blocked',
            ...failurePatch,
            lastFailedUpiRedeemCdkey: failedCdkey,
            upiRedeemCdkey: '',
            redeemChannel: channel,
            membershipOverrideStatus: 'free',
            membershipOverrideCheckedAt: item.membershipOverrideCheckedAt || failedAt,
          });
          if (typeof addLog === 'function') {
            await addLog(
              channel === 'ideal' && failureCount >= totalRoundLimit
                ? `UPI Free 兑换：${rowEmail} -> 后端返回 approve-blocked，IDEAL 已失败 ${totalRoundLimit} 次，账号已封存，不再使用。`
                : reachedUpiDailyLimit
                  ? `UPI Free 兑换：${rowEmail} -> 后端返回 approve-blocked，明确返回今日提交次数上限，已转入 IDEAL 候选，旧 CDK ${failedCdkey || ''} 已回到 CDK 池。`
                  : `UPI Free 兑换：${rowEmail} -> 后端返回 approve-blocked，${failureLabel}，旧 CDK ${failedCdkey || ''} 已回到 CDK 池，账号保留在 Free。`,
              'warn'
            );
          }
          continue;
        }
        let subscriptionVerification = null;
        if (!isVerifiedPaidUpiRedeemRemoteEntry(entry) && remoteStatus === 'success') {
          subscriptionVerification = await verifyRemoteSuccessMembershipForRow(entry, item, state);
          if (subscriptionVerification?.checked) {
            const verifiedCdkey = normalizeString(entry.cdkey || item.upiRedeemCdkey || item.cdkey);
            entry = {
              ...entry,
              subscriptionActive: subscriptionVerification.active,
              subscriptionPlanType: subscriptionVerification.planType,
              subscriptionCheckedAt: subscriptionVerification.checkedAtMs,
              subscriptionReason: subscriptionVerification.reason,
            };
            if (verifiedCdkey) {
              const currentUsageEntry = nextUsage[verifiedCdkey] && typeof nextUsage[verifiedCdkey] === 'object' && !Array.isArray(nextUsage[verifiedCdkey])
                ? nextUsage[verifiedCdkey]
                : {};
              nextUsage[verifiedCdkey] = {
                ...currentUsageEntry,
                subscriptionActive: subscriptionVerification.active,
                subscriptionPlanType: subscriptionVerification.planType,
                subscriptionCheckedAt: subscriptionVerification.checkedAtMs,
                subscriptionReason: subscriptionVerification.reason,
              };
              usageChanged = true;
            }
          }
        }
        const remoteSuccess = isVerifiedPaidUpiRedeemRemoteEntry(entry);
        if (remoteSuccess) {
          const entryCdkey = normalizeString(entry.cdkey || item.upiRedeemCdkey || item.cdkey);
          const rowAlreadyConfirmed = normalizeString(item.status) === 'paid'
            && normalizeString(item.redeemStatus) === 'success'
            && (
              !entryCdkey
              || normalizeString(item.upiRedeemCdkey || item.cdkey).toLowerCase() === entryCdkey.toLowerCase()
            );
          if (rowAlreadyConfirmed) {
            nextItems.push(item);
            continue;
          }
          const planType = isPaidRouterPlanType(entry.subscriptionPlanType) ? entry.subscriptionPlanType : 'plus';
          const redeemSuccessAt = toIsoFromTimestampOrNow(entry.subscriptionCheckedAt || entry.remoteCheckedAt);
          if (shouldPreserveFreeMembershipOverrideForRemoteSuccess(item, redeemSuccessAt)) {
            nextItems.push(item);
            continue;
          }
          changed = true;
          nextItems.push({
            ...item,
            status: 'paid',
            planType,
            reason: remoteMessage || `远端确认已开通 ${planType}`,
            checkedAt: redeemSuccessAt,
            accessToken: normalizeString(item.accessToken || entry.accessToken),
            accessTokenMasked: normalizeString(item.accessTokenMasked || entry.accessTokenMasked),
            redeemStatus: 'success',
            redeemReason: remoteMessage || 'CDK 远端确认兑换成功',
            redeemFailureCount: 0,
            upiRedeemFailureCount: 0,
            idealRedeemFailureCount: 0,
            ...buildRedeemAccountUnlockedPatch(),
            redeemLastFailedAt: '',
            redeemSuccessAt,
            upiRedeemCdkey: entryCdkey,
            redeemChannel: channel,
            upiRedeemSubscriptionCheckedAt: redeemSuccessAt,
            membershipOverrideStatus: '',
            membershipOverrideCheckedAt: '',
          });
          if (typeof addLog === 'function') {
            await addLog(`UPI Free 兑换：${rowEmail} -> 当前绑定 CDK 远端确认成功，进入 Plus：${entryCdkey}`, 'ok');
          }
          continue;
        }

        if (remoteStatus === 'success' && normalizeString(item.status) === 'free') {
          const verifyReason = subscriptionVerification?.reason || '远端兑换成功，但会员验证尚未确认 Plus/Pro/Team';
          const nextRedeemStatus = isPendingUpiCredentialMembershipRedeemStatus(item.redeemStatus) ? item.redeemStatus : 'submitted';
          const pendingVerifyNowMs = Date.now();
          const pendingVerifyLogState = getRemoteSuccessPendingVerifyLogState(item, verifyReason, pendingVerifyNowMs);
          if (
            pendingVerifyLogState.pendingStatusSame
            && normalizeUpiRedeemRemoteStatusForRetry(item.redeemStatus) === normalizeUpiRedeemRemoteStatusForRetry(nextRedeemStatus)
            && (
              (
                normalizeString(item.reason) === verifyReason
                && normalizeString(item.redeemReason) === verifyReason
              )
              || pendingVerifyLogState.cooldownActive
            )
          ) {
            nextItems.push(item);
            continue;
          }
          changed = true;
          nextItems.push({
            ...item,
            status: 'free',
            planType: 'free',
            reason: verifyReason,
            redeemStatus: nextRedeemStatus,
            redeemReason: verifyReason,
            upiRedeemCdkey: entry.cdkey || item.upiRedeemCdkey,
            redeemChannel: channel,
            upiRedeemSubscriptionCheckedAt: '',
            upiRedeemPendingVerifySince: item.upiRedeemPendingVerifySince || item.redeemAttemptedAt || toIsoFromTimestampOrNow(entry.remoteCheckedAt || pendingVerifyNowMs),
            upiRedeemPendingVerifyLastCheckedAt: new Date(pendingVerifyNowMs).toISOString(),
            upiRedeemPendingVerifyLoggedAt: new Date(pendingVerifyNowMs).toISOString(),
            upiRedeemPendingVerifyReason: verifyReason,
          });
          if (typeof addLog === 'function') {
            await addLog(`UPI Free 兑换：${rowEmail} -> CDK 远端返回 success，但会员验证未确认 Plus，账号保留在 Free：${verifyReason}`, 'warn');
          }
          continue;
        }

        const remoteActive = isActiveUpiRedeemRemoteStatusForRetry(remoteStatus);
        if (remoteActive && normalizeString(item.status) === 'free') {
          const pendingReason = remoteMessage || 'CDK 已提交，等待远端系统返回最终结果';
          changed = true;
          nextItems.push({
            ...item,
            status: 'free',
            planType: 'free',
            reason: pendingReason,
            redeemStatus: remoteStatus || 'submitted',
            redeemReason: pendingReason,
            upiRedeemCdkey: entry.cdkey || item.upiRedeemCdkey,
            redeemChannel: channel,
            membershipOverrideStatus: '',
            membershipOverrideCheckedAt: '',
          });
          continue;
        }

        if (remoteStatus === 'canceled' && normalizeString(item.status) === 'free') {
          const canceledAt = toIsoFromTimestampOrNow(entry.remoteCheckedAt);
          const canceledAtMs = Math.max(0, Date.parse(canceledAt) || Number(entry.remoteCheckedAt) || Date.now());
          const canceledCdkey = normalizeString(entry.cdkey || item.upiRedeemCdkey);
          const cancelReason = remoteMessage || '后端已手动取消兑换';
          if (canceledCdkey) {
            const currentUsageEntry = nextUsage[canceledCdkey] && typeof nextUsage[canceledCdkey] === 'object' && !Array.isArray(nextUsage[canceledCdkey])
              ? nextUsage[canceledCdkey]
              : {};
            const canceledEntry = {
              ...currentUsageEntry,
              usedAt: 0,
              lastAttemptAt: Math.max(0, Math.floor(Number(currentUsageEntry.lastAttemptAt) || 0)),
              lastError: cancelReason,
              enabled: currentUsageEntry.enabled !== false,
              email: '',
              accessToken: '',
              accessTokenMasked: '',
              accessTokenUpdatedAt: 0,
              releasedEmail: '',
              releaseReason: '',
              releasedAt: 0,
              lastFailedEmail: '',
              lastFailedAt: 0,
              lastFailedReason: '',
              remoteStatus: 'canceled',
              remoteMessage: `${cancelReason}；后端已取消，CDK 可重新提交`,
              remoteCheckedAt: Math.max(0, Math.floor(Number(entry.remoteCheckedAt) || canceledAtMs)),
              canCancel: false,
              canRetry: false,
              canReuseToken: false,
              hasAccessToken: false,
              retrying: false,
              retryError: '',
            };
            delete canceledEntry.subscriptionActive;
            delete canceledEntry.subscriptionPlanType;
            delete canceledEntry.subscriptionCheckedAt;
            delete canceledEntry.subscriptionReason;
            nextUsage[canceledCdkey] = canceledEntry;
            usageChanged = true;
          }
          changed = true;
          nextItems.push({
            ...item,
            status: 'free',
            planType: 'free',
            reason: `${cancelReason}（已取消，需手动重新兑换）`,
            redeemStatus: 'canceled',
            redeemReason: `${cancelReason}；已取消，需手动重新兑换`,
            redeemFailureCount: normalizeRouterRetryCount(item.redeemFailureCount),
            redeemFailureLimit: totalRoundLimit,
            redeemLastFailedAt: item.redeemLastFailedAt || '',
            lastCanceledUpiRedeemCdkey: canceledCdkey,
            upiRedeemCdkey: '',
            redeemChannel: channel,
            membershipOverrideStatus: 'free',
            membershipOverrideCheckedAt: item.membershipOverrideCheckedAt || canceledAt,
          });
          if (typeof addLog === 'function') {
            await addLog(`UPI Free 兑换：${rowEmail} -> 后端已取消 CDK ${canceledCdkey || ''}，账号已暂停自动续兑；如需继续请手动点击一键兑换。${cancelReason ? ` ${cancelReason}` : ''}`, 'warn');
          }
          continue;
        }

        const remoteNoRedeemRecord = ['not_found', 'unused', 'available', 'new', 'ready'].includes(remoteStatus);
        if (remoteNoRedeemRecord && isPendingUpiCredentialMembershipRedeemStatus(item.redeemStatus)) {
          const releasedAt = toIsoFromTimestampOrNow(entry.remoteCheckedAt);
          const releaseReason = remoteMessage || '后端无兑换记录，CDK 已释放，可重新兑换';
          changed = true;
          nextItems.push({
            ...item,
            status: 'free',
            planType: 'free',
            reason: releaseReason,
            redeemStatus: '',
            redeemReason: releaseReason,
            redeemFailureCount: normalizeRouterRetryCount(item.redeemFailureCount),
            redeemLastFailedAt: item.redeemLastFailedAt || '',
            upiRedeemCdkey: '',
            redeemChannel: channel,
            upiRedeemSubscriptionCheckedAt: '',
            membershipOverrideStatus: '',
            membershipOverrideCheckedAt: '',
            checkedAt: item.checkedAt || releasedAt,
          });
          if (typeof addLog === 'function') {
            await addLog(`UPI 无会员补兑：${rowEmail} -> 后端无兑换记录，已释放 CDK ${entry.cdkey || item.upiRedeemCdkey || ''}，账号回到 Free 可重新兑换。`, 'warn');
          }
          continue;
        }

        const remoteFailed = isRetryableUpiRedeemRemoteStatusForRetry(remoteStatus);
        if (remoteFailed && isPendingUpiCredentialMembershipRedeemStatus(item.redeemStatus)) {
          const failedAt = toIsoFromTimestampOrNow(entry.remoteCheckedAt);
          const failedAtMs = Math.max(0, Date.parse(failedAt) || Number(entry.remoteCheckedAt) || Date.now());
          const failedCdkey = normalizeString(entry.cdkey || item.upiRedeemCdkey);
          const failurePatch = buildRedeemChannelFailurePatch(item, channel, {
            reason: remoteMessage || '远端确认兑换失败',
            failedAt,
          });
          const failureCount = getRedeemChannelFailureCount(failurePatch, channel);
          const failureLabel = getUpiRedeemRoundLabel(failureCount, totalRoundLimit);
          const reachedUpiDailyLimit = channel === 'upi' && isRedeemChannelDailyLimitReason(remoteMessage);
          if (failedCdkey) {
            const currentUsageEntry = nextUsage[failedCdkey] && typeof nextUsage[failedCdkey] === 'object' && !Array.isArray(nextUsage[failedCdkey])
              ? nextUsage[failedCdkey]
              : {};
            const releasedEntry = {
              ...currentUsageEntry,
              usedAt: 0,
              lastAttemptAt: Math.max(0, Math.floor(Number(currentUsageEntry.lastAttemptAt) || 0)),
              lastError: remoteMessage || '远端确认兑换失败',
              enabled: currentUsageEntry.enabled !== false,
              email: '',
              accessToken: '',
              accessTokenMasked: '',
              accessTokenUpdatedAt: 0,
              releasedEmail: '',
              releaseReason: '',
              releasedAt: 0,
              lastFailedEmail: rowEmail,
              lastFailedAt: failedAtMs,
              lastFailedReason: remoteMessage || '远端确认兑换失败',
              remoteStatus,
              remoteMessage: `${remoteMessage || '远端确认兑换失败'}；CDK 已回到可用池，等待其他账号匹配`,
              remoteCheckedAt: Math.max(0, Math.floor(Number(entry.remoteCheckedAt) || failedAtMs)),
              retrying: false,
              retryError: '',
            };
            delete releasedEntry.subscriptionActive;
            delete releasedEntry.subscriptionPlanType;
            delete releasedEntry.subscriptionCheckedAt;
            delete releasedEntry.subscriptionReason;
            nextUsage[failedCdkey] = releasedEntry;
            usageChanged = true;
          }
          changed = true;
          nextItems.push({
            ...item,
            status: 'free',
            planType: 'free',
            reason: channel === 'ideal' && failureCount >= totalRoundLimit
              ? getRedeemLockReason(failurePatch)
              : reachedUpiDailyLimit
                ? `${remoteMessage || '远端确认兑换失败'}（UPI 今日提交次数已达上限，已转入 IDEAL 候选）`
                : `${remoteMessage || '远端确认兑换失败'}（${failureLabel}）`,
            redeemStatus: 'failed',
            redeemReason: remoteMessage || '远端确认兑换失败',
            ...failurePatch,
            lastFailedUpiRedeemCdkey: failedCdkey,
            upiRedeemCdkey: '',
            redeemChannel: channel,
          });
          if (typeof addLog === 'function') {
            await addLog(
              channel === 'ideal' && failureCount >= totalRoundLimit
                ? `UPI Free 兑换：${rowEmail} -> 远端确认失败，IDEAL 已失败 ${totalRoundLimit} 次，账号已封存，不再使用：${remoteMessage}`
                : reachedUpiDailyLimit
                  ? `UPI Free 兑换：${rowEmail} -> 远端明确返回今日提交次数上限，已转入 IDEAL 候选，旧 CDK ${failedCdkey || ''} 已回到 CDK 池：${remoteMessage}`
                  : `UPI Free 兑换：${rowEmail} -> 远端确认失败，${failureLabel}，旧 CDK ${failedCdkey || ''} 已回到 CDK 池，账号保留在 Free：${remoteMessage}`,
              'warn'
            );
          }
          continue;
        }

        nextItems.push(item);
      }

      if (!changed) {
        return { updated: false, updates: {}, deletedEmails: [], results };
      }

      const nextDeletedEmails = Array.from(deletedEmails);
      const updatedAt = new Date().toISOString();
      const nextResults = buildUpiCredentialMembershipResultCounts({
        ...results,
        redeemUpdatedAt: updatedAt,
        updatedAt: results.updatedAt || updatedAt,
        redeemAutoDeletedEmails: nextDeletedEmails,
        redeemAutoDeletedCount: nextDeletedEmails.length,
      }, nextItems);
      const updates = {
        [resultsKey]: nextResults,
        ...(usageChanged ? getRedeemChannelUsageUpdates(channel, nextUsage) : {}),
      };
      if (typeof setState === 'function') {
        await setState(updates);
      }
      return {
        updated: true,
        updates,
        deletedEmails: nextDeletedEmails,
        results: nextResults,
      };
    }

    function getUpiRedeemRefreshUsage(refreshResult = {}, state = {}) {
      const channel = normalizeRedeemChannel(refreshResult?.channel || state?.channel || state?.redeemChannel);
      return getRedeemChannelUsage(refreshResult?.updates || {}, channel)
        || getRedeemChannelUsage(state, channel)
        || {};
    }

    function getReusableUpiRedeemJobRetryCdkeys(refreshResult = {}, state = {}) {
      const usage = getUpiRedeemRefreshUsage(refreshResult, state);
      const source = usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
      const nowMs = Date.now();
      return Object.entries(source)
        .filter(([rawCdkey, rawEntry]) => {
          const cdkey = normalizeString(rawCdkey);
          const entry = rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry) ? rawEntry : {};
          const remoteStatus = normalizeUpiRedeemRemoteStatusForRetry(entry.remoteStatus || entry.remoteMessage);
          const lastRetryAt = Math.max(0, Math.floor(Number(entry.lastRetryAt) || 0));
          return Boolean(cdkey)
            && isRetryableUpiRedeemRemoteStatusForRetry(remoteStatus)
            && remoteStatus !== 'canceled'
            && remoteStatus !== 'not_found'
            && entry.canRetry === true
            && entry.canReuseToken === true
            && entry.hasAccessToken === true
            && entry.retrying !== true
            && (!lastRetryAt || nowMs - lastRetryAt >= UPI_REDEEM_JOB_RETRY_COOLDOWN_MS);
        })
        .map(([cdkey]) => normalizeString(cdkey));
    }

    async function retryReusableUpiRedeemCdkeyJobsAfterRefresh(refreshResult = {}, state = {}, payload = {}) {
      const summary = {
        attempted: 0,
        skipped: 0,
        submitted: 0,
        succeeded: 0,
        failed: 0,
        items: [],
        updates: {},
      };
      if (typeof retryUpiRedeemCdkeyJobs !== 'function') {
        return {
          ...summary,
          skipped: 1,
          reason: 'UPI 后端 Jobs 重试能力尚未接入。',
        };
      }
      const cdkeys = getReusableUpiRedeemJobRetryCdkeys(refreshResult, {
        ...(state || {}),
        ...(payload || {}),
      });
      if (!cdkeys.length) {
        return {
          ...summary,
          skipped: 1,
          reason: '没有可复用后端 access_token 重试的 CDK 任务。',
        };
      }
      const result = await retryUpiRedeemCdkeyJobs({
        ...(state || {}),
        ...(payload || {}),
        cdkeys,
      });
      const items = Array.isArray(result?.items) ? result.items : [];
      const submitted = items.filter((item) => item?.retried === true).length;
      const failed = Math.max(0, items.length - submitted);
      if (typeof addLog === 'function') {
        await addLog(
          `UPI 后端任务重试：已请求 ${items.length || cdkeys.length} 个 CDK，成功重新入列 ${submitted} 个${failed ? `，失败 ${failed} 个` : ''}。`,
          failed ? 'warn' : 'info'
        );
      }
      return {
        ...summary,
        attempted: items.length || cdkeys.length,
        submitted,
        succeeded: submitted,
        failed,
        items,
        updates: result?.updates || {},
        result,
      };
    }

    function combineUpiRedeemAutoRetrySummaries(...summaries) {
      const validSummaries = summaries.filter(Boolean);
      return validSummaries.reduce((combined, summary) => ({
        attempted: combined.attempted + Math.max(0, Math.floor(Number(summary?.attempted) || 0)),
        skipped: combined.skipped + Math.max(0, Math.floor(Number(summary?.skipped) || 0)),
        submitted: combined.submitted + Math.max(0, Math.floor(Number(summary?.submitted) || 0)),
        succeeded: combined.succeeded + Math.max(0, Math.floor(Number(summary?.succeeded) || 0)),
        failed: combined.failed + Math.max(0, Math.floor(Number(summary?.failed) || 0)),
        items: [
          ...combined.items,
          ...(Array.isArray(summary?.items) ? summary.items : []),
        ],
        updates: {
          ...combined.updates,
          ...(summary?.updates || {}),
        },
        backendJobRetry: summary?.backendJobRetry || combined.backendJobRetry,
        localRetry: summary?.localRetry || combined.localRetry,
        reason: normalizeString(summary?.reason || combined.reason),
      }), {
        attempted: 0,
        skipped: 0,
        submitted: 0,
        succeeded: 0,
        failed: 0,
        items: [],
        updates: {},
        reason: '',
      });
    }

    async function retryFailedUpiRedeemCdkeysAfterRefresh(refreshResult = {}, state = {}, payload = {}, membershipSync = {}) {
      const summary = {
        attempted: 0,
        skipped: 0,
        succeeded: 0,
        failed: 0,
        items: [],
        updates: {},
      };
      if (typeof retryFailedUpiRedeemCdkey !== 'function') {
        return {
          ...summary,
          skipped: 1,
          reason: 'UPI 失败账号兑换轮次能力尚未接入。',
        };
      }
      const configuredRoundCount = Math.max(0, Math.min(20, Math.floor(Number(
        payload.upiRedeemFailedAccountRetryLimit
        ?? state.upiRedeemFailedAccountRetryLimit
        ?? 3
      ) || 0)));
      if (configuredRoundCount <= 0) {
        return {
          ...summary,
          skipped: 1,
          reason: '兑换轮数为 0，刷新后不继续失败账号。',
        };
      }
      const syncedResults = membershipSync?.results
        || membershipSync?.updates?.[resultsKey]
        || state?.[resultsKey]
        || null;
      const runtimeSettings = {
        ...(state || {}),
        ...(refreshResult?.updates || {}),
        ...(membershipSync?.updates || {}),
        ...(payload || {}),
        upiRedeemFailedAccountRetryLimit: configuredRoundCount,
      };
      if (countAvailableUpiRedeemCdkeysForRetry(runtimeSettings) <= 0) {
        return {
          ...summary,
          skipped: 1,
          reason: '刷新后没有可用 CDK，跳过自动续兑。',
        };
      }
      delete runtimeSettings.cdkUsage;
      delete runtimeSettings.upiRedeemCdkUsage;
      delete runtimeSettings.upiRedeemCdkeyUsage;
      delete runtimeSettings.pixRedeemCdkeyUsage;
      const retryResult = await retryFailedUpiRedeemCdkey({
        source: 'upi-failed-account-auto-retry',
        results: syncedResults,
        settings: runtimeSettings,
        upiRedeemFailedAccountRetryLimit: configuredRoundCount,
      });
      return {
        ...summary,
        attempted: Math.max(0, Math.floor(Number(retryResult?.attempted) || 0)),
        skipped: Math.max(0, Math.floor(Number(retryResult?.skippedCount) || 0)) + (retryResult?.skipped ? 1 : 0),
        succeeded: Math.max(0, Math.floor(Number(retryResult?.succeeded) || 0)),
        failed: Math.max(0, Math.floor(Number(retryResult?.failed) || 0)),
        submitted: Math.max(0, Math.floor(Number(retryResult?.submitted) || 0)),
        items: Array.isArray(retryResult?.items) ? retryResult.items : [],
        reason: normalizeString(retryResult?.reason || ''),
        updates: retryResult?.updates || {},
      };
    }

    async function refreshUpiRedeemCdkeyStatusesAndSync(payload = {}, options = {}) {
      const state = options?.state || await getState();
      const autoRefresh = payload.autoRefresh === true;
      const skipAutoRetry = payload.skipAutoRetry === true || autoRefresh;
      const autoRunLocked = isAutoRunLockedState(state);
      if (autoRunLocked && !autoRefresh) {
        throw new Error('自动流程运行中，当前不能刷新 CDK 状态。');
      }
      if (typeof refreshUpiRedeemCdkeyStatuses !== 'function') {
        throw new Error('CDK 状态查询能力尚未接入。');
      }
      const result = await refreshUpiRedeemCdkeyStatuses({
        ...state,
        ...payload,
      });
      if (result?.updates) {
        broadcastDataUpdate(result.updates);
      }
      const backendJobRetry = (autoRunLocked && autoRefresh) || skipAutoRetry
        ? {
          attempted: 0,
          skipped: 1,
          succeeded: 0,
          failed: 0,
          submitted: 0,
          items: [],
          reason: skipAutoRetry ? '本次只刷新远端状态，跳过后端任务重试。' : '自动注册中只刷新远端状态，跳过后端任务重试。',
          updates: {},
        }
        : await retryReusableUpiRedeemCdkeyJobsAfterRefresh(result, state, payload);
      if (Object.keys(backendJobRetry?.updates || {}).length) {
        broadcastDataUpdate(backendJobRetry.updates);
      }
      const resultForSync = {
        ...result,
        updates: {
          ...(result?.updates || {}),
          ...(backendJobRetry?.updates || {}),
        },
      };
      const membershipSync = await syncUpiCredentialMembershipResultsAfterCdkeyRefresh(resultForSync, {
        ...state,
        ...payload,
      });
      const localAutoRetry = (autoRunLocked && autoRefresh) || skipAutoRetry
        ? {
          attempted: 0,
          skipped: 1,
          succeeded: 0,
          failed: 0,
          submitted: 0,
          items: [],
          reason: skipAutoRetry ? '本次只刷新远端状态，跳过失败账号续兑。' : '自动注册中只刷新远端状态，跳过失败账号续兑。',
          updates: {},
        }
        : await retryFailedUpiRedeemCdkeysAfterRefresh(resultForSync, state, payload, membershipSync);
      const autoRetry = combineUpiRedeemAutoRetrySummaries(
        { ...backendJobRetry, backendJobRetry },
        { ...localAutoRetry, localRetry: localAutoRetry }
      );
      const updates = {
        ...(resultForSync?.updates || {}),
        ...(membershipSync?.updates || {}),
        ...(autoRetry?.updates || {}),
      };
      if (Object.keys(membershipSync?.updates || {}).length) {
        broadcastDataUpdate(membershipSync.updates);
      }
      if (Object.keys(autoRetry?.updates || {}).length) {
        broadcastDataUpdate(autoRetry.updates);
      }
      return { ok: true, ...result, updates, membershipSync, autoRetry };
    }

    async function refreshPendingUpiCredentialMembershipRedeemStatuses(input = {}) {
      const state = await getState();
      const targets = buildPendingUpiCredentialMembershipRedeemRefreshTargets(state, input);
      if (!targets.cdkCount) {
        return {
          ok: true,
          skipped: true,
          reason: '当前没有等待远端结果的 CDK 兑换任务。',
          targets,
          responses: [],
          errors: [],
          updates: {},
        };
      }
      const responses = [];
      const errors = [];
      const updates = {};
      for (const channel of ['upi', 'ideal']) {
        const cdkeys = targets[channel];
        if (!cdkeys.length) {
          continue;
        }
        try {
          const latestState = await getState();
          const response = await refreshUpiRedeemCdkeyStatusesAndSync({
            ...input,
            cdkeys,
            cdkeyEmailMap: targets.emailMap[channel],
            channel,
            autoRefresh: true,
            skipAutoRetry: true,
          }, {
            state: latestState,
          });
          Object.assign(updates, response?.updates || {});
          responses.push(getMembershipRedeemStatusSyncHelper('normalizeUpiCredentialMembershipRedeemRefreshResponse')(
            response,
            channel,
            cdkeys.length
          ));
        } catch (error) {
          errors.push({
            channel,
            error: normalizeString(error?.message || error),
          });
        }
      }
      return {
        ok: errors.length === 0,
        skipped: false,
        targets,
        responses,
        errors,
        updates,
      };
    }

    return {
      refreshPendingUpiCredentialMembershipRedeemStatuses,
      refreshUpiRedeemCdkeyStatusesAndSync,
      syncUpiCredentialMembershipResultsAfterCdkeyRefresh,
    };
  }

  return {
    createRouterRedeemRefreshService,
  };
});
