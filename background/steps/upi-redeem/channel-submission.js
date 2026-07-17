(function attachMultiPageUpiRedeemChannelSubmission(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MultiPageUpiRedeemChannelSubmission = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMultiPageUpiRedeemChannelSubmissionModule() {
  function createUpiRedeemChannelSubmission(context = {}) {
    const constants = context.constants || {};
    const { UPI_REDEEM_TIMEOUT_MS, UPI_ACCOUNT_INELIGIBLE_ERROR_PREFIX, UPI_REDEEM_BACKEND_FAILED_ERROR_PREFIX, UPI_REDEEM_AUTH_ERROR_PREFIX, UPI_REDEEM_DUPLICATE_CDK_ERROR_PREFIX, UPI_REDEEM_NOT_ACCEPTED_ERROR_PREFIX, UPI_REDEEM_NETWORK_ERROR_PREFIX, UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX } = constants;
    const fetchImpl = context.fetchImpl;
    const upiRedeemApiClient = context.upiRedeemApiClient;
    const now = context.now;
    const setState = context.setState;
    const sleepWithStop = context.sleepWithStop;
    const throwIfStopped = context.throwIfStopped;

    const normalizeString = (...args) => context.normalizeString(...args);
    const getRedeemChannelStateHelpers = (...args) => context.getRedeemChannelStateHelpers(...args);
    const getRedeemCdkeyUsageHelpers = (...args) => context.getRedeemCdkeyUsageHelpers(...args);
    const normalizeRedeemChannel = (...args) => context.normalizeRedeemChannel(...args);
    const isFetchNetworkError = (...args) => context.isFetchNetworkError(...args);
    const maskAccessToken = (...args) => context.maskAccessToken(...args);
    const maskExternalApiKey = (...args) => context.maskExternalApiKey(...args);
    const toIsoTimestamp = (...args) => context.toIsoTimestamp(...args);
    const getUpiRedeemStateValue = (...args) => context.getUpiRedeemStateValue(...args);
    const getErrorMessage = (...args) => context.getErrorMessage(...args);
    const addStepLog = (...args) => context.addStepLog(...args);
    const resolveVisibleStep = (...args) => context.resolveVisibleStep(...args);
    const getMergedState = (...args) => context.getMergedState(...args);
    const buildUpiRedeemApiUrl = (...args) => context.buildUpiRedeemApiUrl(...args);
    const buildUPIAccessTokenCheckApiUrl = (...args) => context.buildUPIAccessTokenCheckApiUrl(...args);
    const buildUpiRedeemStatusApiUrl = (...args) => context.buildUpiRedeemStatusApiUrl(...args);
    const resolveUpiRedeemClientId = (...args) => context.resolveUpiRedeemClientId(...args);
    const parseCdkeyPoolText = (...args) => context.parseCdkeyPoolText(...args);
    const parsePoolEntryEmail = (...args) => context.parsePoolEntryEmail(...args);
    const resolveCurrentRedeemEmail = (...args) => context.resolveCurrentRedeemEmail(...args);
    const resolveSessionAccountEmail = (...args) => context.resolveSessionAccountEmail(...args);
    const normalizeChatGptSessionPayload = (...args) => context.normalizeChatGptSessionPayload(...args);
    const getChatGptSessionAccessToken = (...args) => context.getChatGptSessionAccessToken(...args);
    const getChatGptSessionFieldCount = (...args) => context.getChatGptSessionFieldCount(...args);
    const hasChatGptSessionPayload = (...args) => context.hasChatGptSessionPayload(...args);
    const buildUpiRedeemSessionItem = (...args) => context.buildUpiRedeemSessionItem(...args);
    const normalizeBoolean = (...args) => context.normalizeBoolean(...args);
    const normalizeSubscriptionPlanType = (...args) => context.normalizeSubscriptionPlanType(...args);
    const getPayloadItems = (...args) => context.getPayloadItems(...args);
    const isFailureStatus = (...args) => context.isFailureStatus(...args);
    const normalizeUpiRedeemRemoteStatus = (...args) => context.normalizeUpiRedeemRemoteStatus(...args);
    const isApproveBlockedRemoteResult = (...args) => context.isApproveBlockedRemoteResult(...args);
    const isApproveBlockedError = (...args) => context.isApproveBlockedError(...args);
    const isSuccessfulRemoteStatus = (...args) => context.isSuccessfulRemoteStatus(...args);
    const isRetryableRemoteStatus = (...args) => context.isRetryableRemoteStatus(...args);
    const getRemoteStatusMessage = (...args) => context.getRemoteStatusMessage(...args);
    const confirmCurrentRedeemPaidSubscription = (...args) => context.confirmCurrentRedeemPaidSubscription(...args);
    const recordCdkeySubscriptionConfirmation = (...args) => context.recordCdkeySubscriptionConfirmation(...args);
    const applyPaidSubscriptionCleanup = (...args) => context.applyPaidSubscriptionCleanup(...args);

        function getRedeemChannelLabel(channel = 'upi') {
          const normalizedChannel = normalizeRedeemChannel(channel);
          if (normalizedChannel === 'ideal') return 'IDEAL';
          if (normalizedChannel === 'pix') return 'PIX';
          return 'UPI';
        }

        const REDEEM_CHANNEL_FAILURE_LIMIT = 3;
        const REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS = 24 * 60 * 60 * 1000;
        const UPI_REDEEM_GLOBAL_AUTH_PATTERN = /(?:external\s*)?api[\s_-]*key|apikey|x[\s_-]*external[\s_-]*api[\s_-]*key|csrf|x[\s_-]*client[\s_-]*id|client[\s_-]*id|authorization|bearer|(?:外部|远端|接口|后端)[\s\S]*(?:密钥|API\s*Key|ApiKey|鉴权|认证|权限|CSRF)|(?:密钥|API\s*Key|ApiKey|鉴权|认证|权限|CSRF)[\s\S]*(?:外部|远端|接口|后端)/i;


        function getRedeemChannelFailureField(channel = 'upi') {
          const helper = getRedeemChannelStateHelpers().getRedeemChannelFailureField;
          if (typeof helper === 'function') {
            return helper(channel);
          }
          const normalizedChannel = normalizeRedeemChannel(channel);
          if (normalizedChannel === 'ideal') return 'idealRedeemFailureCount';
          if (normalizedChannel === 'pix') return 'pixRedeemFailureCount';
          return 'upiRedeemFailureCount';
        }


        function getRedeemChannelFailureCount(item = {}, channel = 'upi') {
          const helper = getRedeemChannelStateHelpers().getRedeemChannelFailureCount;
          if (typeof helper === 'function') {
            return helper(item, channel);
          }
          const normalizedChannel = normalizeRedeemChannel(channel);
          const field = getRedeemChannelFailureField(normalizedChannel);
          if (Object.prototype.hasOwnProperty.call(item || {}, field)) {
            return Math.max(0, Math.floor(Number(item?.[field]) || 0));
          }
          const legacyChannel = normalizeString(item?.redeemChannel || item?.channel || item?.paymentChannel)
            ? normalizeRedeemChannel(item.redeemChannel || item.channel || item.paymentChannel)
            : '';
          return legacyChannel === normalizedChannel
            ? Math.max(0, Math.floor(Number(item?.redeemFailureCount) || 0))
            : 0;
        }


        function getRedeemChannelDailyLimitBlockedAtField(channel = 'upi') {
          const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitBlockedAtField;
          if (typeof helper === 'function') {
            return helper(channel);
          }
          const normalizedChannel = normalizeRedeemChannel(channel);
          if (normalizedChannel === 'ideal') return 'idealRedeemDailyLimitBlockedAt';
          if (normalizedChannel === 'pix') return 'pixRedeemDailyLimitBlockedAt';
          return 'upiRedeemDailyLimitBlockedAt';
        }


        function getRedeemChannelDailyLimitBlockedUntilField(channel = 'upi') {
          const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitBlockedUntilField;
          if (typeof helper === 'function') {
            return helper(channel);
          }
          const normalizedChannel = normalizeRedeemChannel(channel);
          if (normalizedChannel === 'ideal') return 'idealRedeemDailyLimitBlockedUntil';
          if (normalizedChannel === 'pix') return 'pixRedeemDailyLimitBlockedUntil';
          return 'upiRedeemDailyLimitBlockedUntil';
        }


        function getRedeemChannelDailyLimitReasonField(channel = 'upi') {
          const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitReasonField;
          if (typeof helper === 'function') {
            return helper(channel);
          }
          const normalizedChannel = normalizeRedeemChannel(channel);
          if (normalizedChannel === 'ideal') return 'idealRedeemDailyLimitReason';
          if (normalizedChannel === 'pix') return 'pixRedeemDailyLimitReason';
          return 'upiRedeemDailyLimitReason';
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
          const blockedAt = normalizeString(failedAt) || toIsoTimestamp();
          const blockedAtMs = Math.max(0, Date.parse(blockedAt) || now());
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
            return helper(item, channel, {
              nowMs: now(),
            });
          }
          const normalizedChannel = normalizeRedeemChannel(channel);
          const nowMs = Math.max(1, Math.floor(Number(now()) || Date.now()));
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


        function buildRedeemAccountUnlockedPatch() {
          return {
            redeemLocked: false,
            redeemLockedReason: '',
            redeemLockedAt: '',
          };
        }


        function buildRedeemChannelFailurePatch(item = {}, channel = 'upi', options = {}) {
          const normalizedChannel = normalizeRedeemChannel(channel);
          const failedAt = normalizeString(options.failedAt) || toIsoTimestamp();
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
            return {
              ...patch,
              redeemLocked: true,
              redeemLockedReason: `IDEAL 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次，账号已封存，不再使用：${reason}`,
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


        function getRedeemChannelSkipReason(item = {}, channel = 'upi') {
          const redeemChannel = normalizeRedeemChannel(channel);
          if (isRedeemAccountLocked(item)) {
            return normalizeString(item?.redeemLockedReason) || '账号已封存';
          }
          if (isRedeemChannelDailyLimitBlocked(item, redeemChannel)) {
            return normalizeString(item?.[getRedeemChannelDailyLimitReasonField(redeemChannel)])
              || normalizeString(item?.redeemReason || item?.reason)
              || `${getRedeemChannelLabel(redeemChannel)} 今日提交次数已达上限`;
          }
          if (!isTrialEligibilityChannelAllowed(item, redeemChannel)) {
            const reasonField = redeemChannel === 'ideal'
              ? 'idealChannelEligibilityReason'
              : (redeemChannel === 'pix' ? 'pixChannelEligibilityReason' : 'upiChannelEligibilityReason');
            return normalizeString(item?.[reasonField])
              || `${getRedeemChannelLabel(redeemChannel)} 渠道当前不可用`;
          }
          if (redeemChannel !== 'upi' && getRedeemChannelFailureCount(item, redeemChannel) >= REDEEM_CHANNEL_FAILURE_LIMIT) {
            return `${getRedeemChannelLabel(redeemChannel)} 已达到失败上限`;
          }
          return '';
        }


        function getRedeemChannelPoolKey(channel = 'upi') {
          const helper = getRedeemCdkeyUsageHelpers().getRedeemChannelPoolKey;
          if (typeof helper === 'function') {
            return helper(channel);
          }
          const normalizedChannel = normalizeRedeemChannel(channel);
          if (normalizedChannel === 'ideal') return 'idealRedeemCdkeyPoolText';
          if (normalizedChannel === 'pix') return 'pixChannelRedeemCdkeyPoolText';
          return 'upiRedeemCdkeyPoolText';
        }


        function getRedeemChannelUsageKey(channel = 'upi') {
          const helper = getRedeemCdkeyUsageHelpers().getRedeemChannelUsageKey;
          if (typeof helper === 'function') {
            return helper(channel);
          }
          const normalizedChannel = normalizeRedeemChannel(channel);
          if (normalizedChannel === 'ideal') return 'idealRedeemCdkeyUsage';
          if (normalizedChannel === 'pix') return 'pixChannelRedeemCdkeyUsage';
          return 'upiRedeemCdkeyUsage';
        }


        function getRedeemChannelPoolText(state = {}, channel = 'upi') {
          const helper = getRedeemCdkeyUsageHelpers().getRedeemChannelPoolText;
          if (typeof helper === 'function') {
            return helper(state, channel);
          }
          const normalizedChannel = normalizeRedeemChannel(channel);
          if (normalizedChannel === 'ideal') {
            return normalizeString(state?.idealRedeemCdkeyPoolText);
          }
          if (normalizedChannel === 'pix') return normalizeString(state?.pixChannelRedeemCdkeyPoolText);
          return getUpiRedeemStateValue(state, 'upiRedeemCdkeyPoolText');
        }


        function getRedeemChannelUsage(state = {}, channel = 'upi') {
          const helper = getRedeemCdkeyUsageHelpers().getRedeemChannelUsage;
          if (typeof helper === 'function') {
            return helper(state, channel, { defaultValue: {} }) || {};
          }
          const normalizedChannel = normalizeRedeemChannel(channel);
          if (normalizedChannel === 'ideal') {
            return state?.idealRedeemCdkeyUsage || {};
          }
          if (normalizedChannel === 'pix') return state?.pixChannelRedeemCdkeyUsage || {};
          return getUpiRedeemStateValue(state, 'upiRedeemCdkeyUsage') || {};
        }


        function getAvailableCdkeysForChannel(state = {}, channel = 'upi') {
          const helper = getRedeemCdkeyUsageHelpers().getAvailableCdkeys;
          const poolText = getRedeemChannelPoolText(state, channel);
          const usage = getRedeemChannelUsage(state, channel);
          if (typeof helper === 'function') return helper(poolText, usage);
          return String(poolText || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
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


        function normalizeUpiRedeemCdkeyUsage(rawUsage = {}) {
          const usage = (rawUsage && typeof rawUsage === 'object' && !Array.isArray(rawUsage))
            ? rawUsage
            : {};
          const result = {};
          Object.entries(usage).forEach(([rawCdkey, rawEntry]) => {
            const cdkey = normalizeString(rawCdkey);
            if (!cdkey) {
              return;
            }
            const entry = (rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry))
              ? rawEntry
              : {};
            const normalizedEntry = {
              usedAt: Math.max(0, Math.floor(Number(entry.usedAt) || 0)),
              lastAttemptAt: Math.max(0, Math.floor(Number(entry.lastAttemptAt) || 0)),
              lastError: normalizeString(entry.lastError),
              enabled: entry.enabled !== false,
              email: normalizeString(entry.email || entry.accountEmail || entry.credentialEmail).toLowerCase(),
              accessToken: normalizeString(entry.accessToken || entry.access_token || entry.upiRedeemAccessToken),
              accessTokenMasked: normalizeString(entry.accessTokenMasked),
              accessTokenUpdatedAt: Math.max(0, Math.floor(Number(entry.accessTokenUpdatedAt) || Number(entry.tokenUpdatedAt) || 0)),
              lastFailedEmail: normalizeString(entry.lastFailedEmail).toLowerCase(),
              lastFailedAt: Math.max(0, Math.floor(Number(entry.lastFailedAt) || 0)),
              lastFailedReason: normalizeString(entry.lastFailedReason),
              releasedEmail: normalizeString(entry.releasedEmail || entry.approveBlockedEmail).toLowerCase(),
              releaseReason: normalizeString(entry.releaseReason),
              releasedAt: Math.max(0, Math.floor(Number(entry.releasedAt) || 0)),
              remoteStatus: normalizeString(entry.remoteStatus),
              remoteMessage: normalizeString(entry.remoteMessage),
              remoteCheckedAt: Math.max(0, Math.floor(Number(entry.remoteCheckedAt) || 0)),
              canCancel: normalizeBoolean(entry.canCancel ?? entry.can_cancel),
              canRetry: normalizeBoolean(entry.canRetry ?? entry.can_retry),
              canReuseToken: normalizeBoolean(entry.canReuseToken ?? entry.can_reuse_token),
              hasAccessToken: normalizeBoolean(entry.hasAccessToken ?? entry.has_access_token),
              retryCount: Math.max(0, Math.floor(Number(entry.retryCount) || 0)),
              lastRetryAt: Math.max(0, Math.floor(Number(entry.lastRetryAt) || 0)),
              retrying: entry.retrying === true,
              retryError: normalizeString(entry.retryError),
            };
            if (entry.subscriptionActive === true || entry.subscriptionActive === false) {
              normalizedEntry.subscriptionActive = Boolean(entry.subscriptionActive);
            }
            const subscriptionPlanType = normalizeSubscriptionPlanType(entry.subscriptionPlanType || entry.subscription_plan_type);
            if (subscriptionPlanType) {
              normalizedEntry.subscriptionPlanType = subscriptionPlanType;
            }
            const subscriptionCheckedAt = Math.max(0, Math.floor(Number(entry.subscriptionCheckedAt) || 0));
            if (subscriptionCheckedAt) {
              normalizedEntry.subscriptionCheckedAt = subscriptionCheckedAt;
            }
            const subscriptionReason = normalizeString(entry.subscriptionReason);
            if (subscriptionReason) {
              normalizedEntry.subscriptionReason = subscriptionReason;
            }
            result[cdkey] = normalizedEntry;
          });
          return result;
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
          ].includes(normalizeUpiRedeemRemoteStatus(status));
        }


        function isCdkeyRedeemInFlight(entry = {}) {
          const pendingDispatch = normalizeUpiRedeemRemoteStatus(entry?.remoteStatus) === 'pending_dispatch'
            || normalizeUpiRedeemRemoteStatus(entry?.remoteMessage) === 'pending_dispatch';
          return entry?.retrying === true
            || (pendingDispatch && Boolean(normalizeString(entry?.email || entry?.accessToken)))
            || isActiveRemoteStatus(entry?.remoteStatus)
            || isActiveRemoteStatus(entry?.remoteMessage);
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
          ].includes(normalizeUpiRedeemRemoteStatus(status));
        }


        function isCdkeySelectableForRedeem(entry = {}) {
          if (entry?.enabled === false) {
            return false;
          }
          const remoteStatus = normalizeUpiRedeemRemoteStatus(entry?.remoteStatus);
          const remoteMessageStatus = normalizeUpiRedeemRemoteStatus(entry?.remoteMessage);
          if (entry?.subscriptionActive === true) {
            return false;
          }
          if (
            entry?.subscriptionActive === false
            && !isReusableInactiveSubscriptionRemoteStatus(remoteStatus)
            && !isReusableInactiveSubscriptionRemoteStatus(remoteMessageStatus)
          ) {
            return false;
          }
          if (isSuccessfulRemoteStatus(entry?.remoteStatus)
            || isCdkeyRedeemInFlight(entry)) {
            return false;
          }
          if (remoteStatus === 'invalid' || remoteMessageStatus === 'invalid') {
            return false;
          }
          if (
            isUpiRedeemDuplicateCdkeyMessage(entry?.remoteStatus)
            || isUpiRedeemDuplicateCdkeyMessage(entry?.remoteMessage)
            || isUpiRedeemDuplicateCdkeyMessage(entry?.lastError)
          ) {
            return false;
          }
          return true;
        }


        function pickFirstUnusedCdkey(cdkeys = [], usage = {}) {
          return cdkeys.find((cdkey) => {
            const entry = usage?.[cdkey] || {};
            return isCdkeySelectableForRedeem(entry);
          }) || '';
        }


        function getAvailableRedeemCdkeys(state = {}, channel = 'upi') {
          const normalizedChannel = normalizeRedeemChannel(channel);
          return getAvailableCdkeysForChannel(state, normalizedChannel);
        }


        function countAvailableRedeemCdkeys(state = {}, channel = 'upi') {
          return getAvailableRedeemCdkeys(state, channel).length;
        }


        async function updateCdkeyUsage(cdkey, updater, channel = 'upi') {
          const normalizedChannel = normalizeRedeemChannel(channel);
          const state = await getMergedState({});
          const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(state, normalizedChannel));
          const currentEntry = usage[cdkey] || { usedAt: 0, lastAttemptAt: 0, lastError: '', enabled: true };
          const nextEntry = {
            ...currentEntry,
            ...(updater(currentEntry) || {}),
          };
          const storedEmail = normalizeString(nextEntry.email || nextEntry.accountEmail || nextEntry.credentialEmail).toLowerCase();
          const storedAccessToken = normalizeString(nextEntry.accessToken || nextEntry.access_token || nextEntry.upiRedeemAccessToken);
          const storedEntry = {
            usedAt: Math.max(0, Math.floor(Number(nextEntry.usedAt) || 0)),
            lastAttemptAt: Math.max(0, Math.floor(Number(nextEntry.lastAttemptAt) || 0)),
            lastError: normalizeString(nextEntry.lastError),
            enabled: nextEntry.enabled !== false,
            email: storedEmail,
            releasedEmail: storedEmail ? '' : normalizeString(nextEntry.releasedEmail || nextEntry.approveBlockedEmail).toLowerCase(),
            releaseReason: storedEmail ? '' : normalizeString(nextEntry.releaseReason),
            releasedAt: storedEmail ? 0 : Math.max(0, Math.floor(Number(nextEntry.releasedAt) || 0)),
            lastFailedEmail: normalizeString(nextEntry.lastFailedEmail).toLowerCase(),
            lastFailedAt: Math.max(0, Math.floor(Number(nextEntry.lastFailedAt) || 0)),
            lastFailedReason: normalizeString(nextEntry.lastFailedReason),
            remoteStatus: normalizeString(nextEntry.remoteStatus),
            remoteMessage: normalizeString(nextEntry.remoteMessage),
            remoteCheckedAt: Math.max(0, Math.floor(Number(nextEntry.remoteCheckedAt) || 0)),
            canCancel: normalizeBoolean(nextEntry.canCancel ?? nextEntry.can_cancel),
            canRetry: normalizeBoolean(nextEntry.canRetry ?? nextEntry.can_retry),
            canReuseToken: normalizeBoolean(nextEntry.canReuseToken ?? nextEntry.can_reuse_token),
            hasAccessToken: normalizeBoolean(nextEntry.hasAccessToken ?? nextEntry.has_access_token),
            retryCount: Math.max(0, Math.floor(Number(nextEntry.retryCount) || 0)),
            lastRetryAt: Math.max(0, Math.floor(Number(nextEntry.lastRetryAt) || 0)),
            retrying: nextEntry.retrying === true,
            retryError: normalizeString(nextEntry.retryError),
          };
          if (storedAccessToken) {
            storedEntry.accessToken = storedAccessToken;
            storedEntry.accessTokenMasked = normalizeString(nextEntry.accessTokenMasked) || maskAccessToken(storedAccessToken);
            storedEntry.accessTokenUpdatedAt = Math.max(
              0,
              Math.floor(
                Number(nextEntry.accessTokenUpdatedAt)
                || Number(nextEntry.tokenUpdatedAt)
                || Number(nextEntry.lastAttemptAt)
                || Number(now())
                || Date.now()
              )
            );
          }
          if (nextEntry.subscriptionActive === true || nextEntry.subscriptionActive === false) {
            storedEntry.subscriptionActive = Boolean(nextEntry.subscriptionActive);
          }
          const subscriptionPlanType = normalizeSubscriptionPlanType(nextEntry.subscriptionPlanType || nextEntry.subscription_plan_type);
          if (subscriptionPlanType) {
            storedEntry.subscriptionPlanType = subscriptionPlanType;
          }
          const subscriptionCheckedAt = Math.max(0, Math.floor(Number(nextEntry.subscriptionCheckedAt) || 0));
          if (subscriptionCheckedAt) {
            storedEntry.subscriptionCheckedAt = subscriptionCheckedAt;
          }
          const subscriptionReason = normalizeString(nextEntry.subscriptionReason);
          if (subscriptionReason) {
            storedEntry.subscriptionReason = subscriptionReason;
          }
          const nextUsage = {
            ...usage,
            [cdkey]: storedEntry,
          };
          await setState(buildRedeemChannelUsageUpdates(normalizedChannel, nextUsage));
        }


        async function reserveCdkeyForRedeemSubmission({
          cdkey = '',
          email = '',
          accessToken = '',
          attemptAt = 0,
          message = '',
          channel = 'upi',
        } = {}) {
          const normalizedCdkey = normalizeString(cdkey);
          if (!normalizedCdkey) {
            return;
          }
          const timestamp = Math.max(1, Math.floor(Number(attemptAt) || Number(now()) || Date.now()));
          await updateCdkeyUsage(normalizedCdkey, (entry) => ({
            ...entry,
            email: normalizeString(email || entry.email || entry.accountEmail || entry.credentialEmail).toLowerCase(),
            accessToken: normalizeString(accessToken || entry.accessToken || entry.access_token || entry.upiRedeemAccessToken),
            accessTokenMasked: normalizeString(accessToken) ? maskAccessToken(accessToken) : normalizeString(entry.accessTokenMasked),
            accessTokenUpdatedAt: timestamp,
            usedAt: 0,
            lastAttemptAt: timestamp,
            lastError: '',
            remoteStatus: 'dispatching',
            remoteMessage: normalizeString(message) || '正在提交到兑换后端，等待远端接收',
            remoteCheckedAt: timestamp,
            canCancel: false,
            canRetry: false,
            canReuseToken: false,
            hasAccessToken: Boolean(normalizeString(accessToken || entry.accessToken || entry.access_token || entry.upiRedeemAccessToken)),
            retrying: false,
            retryError: '',
          }), channel);
        }


        async function releaseCdkeyForUnacceptedSubmission({
          cdkey = '',
          reason = '',
          attemptAt = 0,
          channel = 'upi',
        } = {}) {
          const normalizedCdkey = normalizeString(cdkey);
          if (!normalizedCdkey) {
            return;
          }
          const timestamp = Math.max(1, Math.floor(Number(attemptAt) || Number(now()) || Date.now()));
          const releaseReason = normalizeString(reason) || '兑换接口未确认接收当前 CDK，后端没有兑换记录。';
          await updateCdkeyUsage(normalizedCdkey, (entry) => ({
            ...entry,
            usedAt: 0,
            lastAttemptAt: timestamp,
            lastError: '',
            enabled: entry.enabled !== false,
            email: '',
            accessToken: '',
            accessTokenMasked: '',
            accessTokenUpdatedAt: 0,
            releasedEmail: '',
            releaseReason: '',
            releasedAt: 0,
            remoteStatus: 'not_found',
            remoteMessage: `${releaseReason} CDK 已释放，可重新提交。`,
            remoteCheckedAt: timestamp,
            canCancel: false,
            canRetry: false,
            canReuseToken: false,
            hasAccessToken: false,
            retrying: false,
            retryError: '',
          }), channel);
        }


        async function readResponseBody(response) {
          if (!response) {
            return null;
          }
          if (typeof response.text === 'function') {
            const text = await response.text();
            if (!normalizeString(text)) {
              return null;
            }
            try {
              return JSON.parse(text);
            } catch {
              return text;
            }
          }
          if (typeof response.json === 'function') {
            return response.json().catch(() => null);
          }
          return null;
        }


        function getPayloadError(payload) {
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return '';
          }
          if (payload.ok === false || payload.success === false) {
            return normalizeString(payload.error || payload.message || 'UPI 兑换接口返回失败。');
          }
          if (payload.error) {
            return typeof payload.error === 'string'
              ? normalizeString(payload.error)
              : JSON.stringify(payload.error);
          }
          if (Array.isArray(payload.errors) && payload.errors.length) {
            return JSON.stringify(payload.errors);
          }
          const status = normalizeString(payload.status).toLowerCase();
          if (['error', 'failed', 'failure'].includes(status)) {
            return normalizeString(payload.message || payload.status);
          }
          return '';
        }


        function getPayloadErrorDetails(payload) {
          const payloadError = getPayloadError(payload);
          if (payloadError) {
            return payloadError;
          }
          if (typeof payload === 'string') {
            return normalizeString(payload).replace(/\s+/g, ' ').slice(0, 500);
          }
          if (payload && typeof payload === 'object') {
            try {
              return JSON.stringify(payload).slice(0, 500);
            } catch {
              return '';
            }
          }
          return '';
        }


        function isUpiAccessTokenExpiredPayload(payload = {}, statusCode = 0) {
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return false;
          }
          const code = normalizeString(payload.code || payload.error_code || payload.errorCode);
          const message = normalizeString(payload.message || payload.error || payload.reason);
          return (Number(statusCode) === 401 && code === '10002')
            || /未登录|会话已过期|重新登录|session\s*expired|not\s*logged\s*in|login\s*required|unauthenticated/i.test(message);
        }


        function isUpiAccessTokenExpiredError(error) {
          return normalizeString(error?.message || error).startsWith(UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX)
            || /access[_-]?token[\s\S]*(?:过期|失效|expired|invalid)|(?:未登录|会话已过期|重新登录|session\s*expired)[\s\S]*(?:access[_-]?token|会话|登录)/i.test(getErrorMessage(error));
        }


        async function recordAccessTokenExpiredCdkeyAttempt({
          cdkey = '',
          email = '',
          attemptAt = 0,
          message = '',
          channel = 'upi',
        } = {}) {
          const normalizedCdkey = normalizeString(cdkey);
          if (!normalizedCdkey) {
            return;
          }
          await updateCdkeyUsage(normalizedCdkey, (entry) => ({
            ...entry,
            email: normalizeString(email || entry.email || entry.accountEmail || entry.credentialEmail).toLowerCase(),
            accessToken: '',
            accessTokenMasked: '',
            accessTokenUpdatedAt: 0,
            lastAttemptAt: Math.max(0, Math.floor(Number(attemptAt) || 0)),
            lastError: normalizeString(message) || 'ChatGPT session 已过期或当前会话失效。',
            remoteStatus: 'unused',
            remoteMessage: 'ChatGPT session 已过期或当前会话失效，未进入兑换处理，CDK 已释放。',
            remoteCheckedAt: Math.max(0, Math.floor(Number(attemptAt) || 0)),
            retrying: false,
            retryError: '',
          }), channel);
        }


        function getTrialEligibilityApiHelpers() {
          const rootScope = typeof self !== 'undefined' ? self : globalThis;
          return rootScope.MultiPageTrialEligibilityApi || {};
        }


        function normalizeTrialEligibilityApiItem(item = {}) {
          const helper = getTrialEligibilityApiHelpers().normalizeTrialEligibilityApiItem;
          if (typeof helper === 'function') {
            return helper(item);
          }
          return {
            trialEligibilityStatus: 'failed',
            trialEligibilityReason: '资格检查适配器未加载。',
          };
        }


        function isTrialEligibilityAccountIneligibleDecision(decision = {}) {
          const helper = getTrialEligibilityApiHelpers().isTrialEligibilityAccountIneligibleDecision;
          return typeof helper === 'function'
            ? helper(decision)
            : normalizeString(decision.trialEligibilityStatus).toLowerCase() === 'ineligible';
        }


        function isTrialEligibilityTokenInvalidDecision(decision = {}) {
          const helper = getTrialEligibilityApiHelpers().isTrialEligibilityTokenInvalidDecision;
          return typeof helper === 'function' ? helper(decision) : decision.tokenInvalid === true;
        }


        function buildTrialEligibilityEmailMismatchReason(decision = {}, expectedEmail = '') {
          const helper = getTrialEligibilityApiHelpers().buildTrialEligibilityEmailMismatchReason;
          if (typeof helper === 'function') {
            return helper(decision, expectedEmail);
          }
          const expected = parsePoolEntryEmail(expectedEmail);
          const responseEmail = parsePoolEntryEmail(decision?.responseEmail || decision?.email);
          if (expected && responseEmail && expected !== responseEmail) {
            return `资格检查返回邮箱 ${responseEmail}，不是当前目标邮箱 ${expected}，疑似 AT 串号。`;
          }
          return '';
        }


        function buildTrialEligibilityResultPatch(decision = {}) {
          const helper = getTrialEligibilityApiHelpers().buildTrialEligibilityResultPatch;
          return typeof helper === 'function' ? helper(decision) : {};
        }


        function isTrialEligibilityChannelAllowed(item = {}, channel = 'upi') {
          const helper = getTrialEligibilityApiHelpers().isTrialEligibilityChannelAllowed;
          if (typeof helper === 'function') {
            return helper(item, channel);
          }
          const normalizedChannel = normalizeRedeemChannel(channel);
          const field = normalizedChannel === 'ideal'
            ? 'idealChannelEligibilityStatus'
            : (normalizedChannel === 'pix' ? 'pixChannelEligibilityStatus' : 'upiChannelEligibilityStatus');
          const status = normalizeString(item?.[field]).toLowerCase();
          return !status || status === 'unknown' || status === 'eligible';
        }


        function isEligibilityResultPayload(value = {}) {
          if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return false;
          }
          return value.token_ok !== undefined
            || value.tokenOk !== undefined
            || value.eligible !== undefined
            || value.upi_eligible !== undefined
            || value.upiEligible !== undefined
            || normalizeString(value.reason);
        }


        function getEligibilityItem(payload, cdkey) {
          const target = normalizeString(cdkey).toLowerCase();
          const matchedItem = getPayloadItems(payload).find((item) => {
            const itemCdkey = normalizeString(item?.cdkey || item?.cdk).toLowerCase();
            return itemCdkey && itemCdkey === target;
          });
          if (matchedItem) {
            return matchedItem;
          }
          if (isEligibilityResultPayload(payload)) {
            return payload;
          }
          if (isEligibilityResultPayload(payload?.data)) {
            return payload.data;
          }
          return null;
        }


        function getEligibilityFailureMessage(item) {
          const decision = normalizeTrialEligibilityApiItem(item);
          return decision.trialEligibilityStatus === 'eligible'
            ? ''
            : normalizeString(decision.trialEligibilityReason || 'UPI 资格检查失败。');
        }


        function isEligibilityTokenInvalidItem(item = {}) {
          return isTrialEligibilityTokenInvalidDecision(normalizeTrialEligibilityApiItem(item));
        }


        function isEligibilityAccountIneligibleItem(item = {}) {
          return isTrialEligibilityAccountIneligibleDecision(normalizeTrialEligibilityApiItem(item));
        }


        function isUpiRedeemBackendFailureMessage(error) {
          const message = getErrorMessage(error);
          return /(?:UPI\s*)?(?:卡密|兑换|redeem|cdkey|cdk)[\s\S]*(?:失败|failed|failure|timeout|超时)|(?:失败|failed|failure|timeout|超时)[\s\S]*(?:UPI\s*)?(?:卡密|兑换|redeem|cdkey|cdk)/i.test(message);
        }


        function isUpiRedeemDuplicateCdkeyMessage(message = '') {
          const text = normalizeString(message);
          return /(?:CDK|CDKEY|卡密)[\s\S]*(?:不可重复提交|重复提交|已提交|already\s+submitted|duplicate\s+submit|duplicate\s+submission|already\s+redeemed|already\s+used)|(?:不可重复提交|重复提交|已提交|already\s+submitted|duplicate\s+submit|duplicate\s+submission|already\s+redeemed|already\s+used)[\s\S]*(?:CDK|CDKEY|卡密)/i.test(text);
        }


        function isUpiRedeemDuplicateCdkeyError(error) {
          const rawMessage = normalizeString(error?.message || error);
          return rawMessage.startsWith(UPI_REDEEM_DUPLICATE_CDK_ERROR_PREFIX)
            || isUpiRedeemDuplicateCdkeyMessage(getErrorMessage(error));
        }


        function isUpiRedeemNotAcceptedError(error) {
          return normalizeString(error?.message || error).startsWith(UPI_REDEEM_NOT_ACCEPTED_ERROR_PREFIX);
        }


        const isUpiRedeemGlobalAuthFailureMessage = (message = '') => UPI_REDEEM_GLOBAL_AUTH_PATTERN.test(normalizeString(message));


        function isUpiRedeemApiAuthError(error) {
          const rawMessage = normalizeString(error?.message || error);
          const message = getErrorMessage(error);
          return rawMessage.startsWith(UPI_REDEEM_AUTH_ERROR_PREFIX)
            || (/UPI|兑换|redeem|远端|接口/i.test(message) && isUpiRedeemGlobalAuthFailureMessage(message));
        }


        function isUpiAccountIneligibleError(error) {
          return normalizeString(error?.message || error).startsWith(UPI_ACCOUNT_INELIGIBLE_ERROR_PREFIX);
        }


        function isRecoverableUpiEligibilityError(error) {
          const rawMessage = normalizeString(error?.message || error);
          const message = normalizeString(getErrorMessage(error) || rawMessage);
          return /failed\s+to\s+fetch|fetch\s+failed|load\s+failed|network\s*error|request\s+timeout|timed\s+out|\btimeout\b|abort|econnreset|etimedout|enotfound|eai_again|http\s*(?:429|5\d\d)/i.test(message);
        }


        function getRedeemItemFailureMessage(payload, cdkey) {
          const item = getEligibilityItem(payload, cdkey);
          if (!item) {
            return '';
          }
          const status = item.status || item.state || item.result || item.external_status || item.externalStatus;
          if (isApproveBlockedRemoteResult(item, status, getRemoteStatusMessage(item, status))) {
            return getRemoteStatusMessage(item, status) || status || 'approve-blocked';
          }
          if (!isFailureStatus(status) && !item.error && !item.error_code && !item.errorCode) {
            return '';
          }
          return normalizeString(
            item.message
            || item.error
            || item.error_message
            || item.errorMessage
            || item.error_code
            || item.errorCode
            || status
            || 'UPI 兑换接口返回失败。'
          );
        }


        function getPayloadCdkeyItem(payload, cdkey = '') {
          const target = normalizeString(cdkey).toLowerCase();
          if (!target) {
            return null;
          }
          const items = getPayloadItems(payload);
          const matchedItem = items.find((item) => {
            const itemCdkey = normalizeString(item?.cdkey || item?.cdk).toLowerCase();
            return itemCdkey && itemCdkey === target;
          });
          if (matchedItem) {
            return matchedItem;
          }
          const directCdkey = normalizeString(payload?.cdkey || payload?.cdk || payload?.data?.cdkey || payload?.data?.cdk).toLowerCase();
          if (directCdkey && directCdkey === target) {
            return payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
              ? payload.data
              : payload;
          }
          return null;
        }


        function isRedeemAcceptedStatus(status = '') {
          const normalized = normalizeUpiRedeemRemoteStatus(status);
          if (!normalized) {
            return true;
          }
          return !['not_found', 'unused', 'available', 'new', 'ready', 'invalid'].includes(normalized)
            && !isFailureStatus(normalized);
        }


        function isRedeemPayloadItemAccepted(item = {}) {
          if (!item || typeof item !== 'object' || Array.isArray(item)) {
            return false;
          }
          const status = item.status || item.state || item.result || item.external_status || item.externalStatus;
          if (isApproveBlockedRemoteResult(item, status, getRemoteStatusMessage(item, status))) {
            return false;
          }
          if (item.error || item.error_code || item.errorCode) {
            return false;
          }
          return isRedeemAcceptedStatus(status);
        }


        function getPositiveRedeemAcceptedCount(payload = {}) {
          const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
          const data = source.data && typeof source.data === 'object' && !Array.isArray(source.data) ? source.data : {};
          const candidates = [
            source.accepted,
            source.acceptedCount,
            source.accepted_count,
            source.submitted,
            source.submittedCount,
            source.submitted_count,
            source.created,
            source.createdCount,
            source.created_count,
            source.queued,
            source.queuedCount,
            source.queued_count,
            data.accepted,
            data.acceptedCount,
            data.accepted_count,
            data.submitted,
            data.submittedCount,
            data.submitted_count,
            data.created,
            data.createdCount,
            data.created_count,
            data.queued,
            data.queuedCount,
            data.queued_count,
          ];
          return candidates.reduce((maxCount, value) => Math.max(maxCount, Math.floor(Number(value) || 0)), 0);
        }


        async function confirmUpiRedeemSubmissionAccepted({ payload = null, externalApiKey = '', clientId = '', cdkey = '', state = {}, channel = 'upi' } = {}) {
          const responseItem = getPayloadCdkeyItem(payload, cdkey);
          if (responseItem && isRedeemPayloadItemAccepted(responseItem)) {
            return { confirmed: true, source: 'redeem-response', item: responseItem };
          }
          const positiveAcceptedCount = getPositiveRedeemAcceptedCount(payload);
          const statusUrl = buildUpiRedeemStatusApiUrl(state);
          let lastReason = responseItem
            ? '兑换接口响应包含当前 CDK，但状态不是已接收。'
            : '兑换接口响应没有返回当前 CDK。';
          for (const delayMs of [1000, 2000, 3000]) {
            await sleepWithStop(delayMs);
            let statusPayload = null;
            try {
              statusPayload = await postUPIJson({
                apiUrl: statusUrl,
                externalApiKey,
                clientId,
                body: { cdkeys: [cdkey], channel: normalizeRedeemChannel(channel) },
              });
            } catch (error) {
              lastReason = `状态确认请求失败：${getErrorMessage(error) || error}`;
              continue;
            }
            const statusItem = getPayloadCdkeyItem(statusPayload, cdkey);
            if (statusItem) {
              const remoteStatus = normalizeUpiRedeemRemoteStatus(statusItem.status || statusItem.state || statusItem.result);
              const remoteMessage = getRemoteStatusMessage(statusItem, remoteStatus);
              if (isRedeemAcceptedStatus(remoteStatus)) {
                return { confirmed: true, source: 'status', item: statusItem };
              }
              lastReason = remoteMessage || `状态查询返回 ${remoteStatus || 'unknown'}`;
            } else {
              lastReason = '状态查询未找到当前 CDK记录。';
            }
          }
          return {
            confirmed: false,
            reason: positiveAcceptedCount > 0
              ? `${lastReason} 兑换接口只返回汇总数量 ${positiveAcceptedCount}，但状态接口未确认落库。`
              : lastReason,
          };
        }


        function getResponseContentType(response) {
          try {
            return normalizeString(response?.headers?.get?.('content-type')).toLowerCase();
          } catch {
            return '';
          }
        }


        function isHtmlResponsePayload(response, payload) {
          const contentType = getResponseContentType(response);
          if (contentType.includes('text/html')) {
            return true;
          }
          if (typeof payload !== 'string') {
            return false;
          }
          return /^\s*(?:<!doctype\s+html\b|<html[\s>]|<head[\s>]|<body[\s>])/i.test(payload);
        }


        async function postUPIJson({ apiUrl, externalApiKey, clientId, body }) {
          if (typeof fetchImpl !== 'function' || !upiRedeemApiClient?.postJson) {
            throw new Error('当前运行环境不支持 fetch，无法请求 UPI 兑换接口。');
          }
          const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
          const timeoutId = controller
            ? setTimeout(() => controller.abort(), UPI_REDEEM_TIMEOUT_MS)
            : null;
          try {
            const { response, payload } = await upiRedeemApiClient.postJson({
              apiUrl,
              headers: {
                'X-External-Api-Key': externalApiKey,
                'X-Client-Id': clientId,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
              body,
              ...(controller ? { signal: controller.signal } : {}),
              returnResponse: true,
              throwOnError: false,
            });
            if (!response?.ok) {
              const payloadError = getPayloadErrorDetails(payload);
              const statusCode = Number(response?.status) || 0;
              if (isUpiAccessTokenExpiredPayload(payload, statusCode)) {
                throw new Error(`${UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX}ChatGPT session 已过期或当前会话失效：${payloadError || '请刷新当前 ChatGPT 页面后重新读取完整 session。'}`);
              }
              if (statusCode === 401 || statusCode === 403) {
                if (!payloadError || isUpiRedeemGlobalAuthFailureMessage(payloadError)) throw new Error(`${UPI_REDEEM_AUTH_ERROR_PREFIX}UPI 远端接口拒绝请求（HTTP ${statusCode}）：请求：${apiUrl}。当前发送 Key：${maskExternalApiKey(externalApiKey)}。${payloadError ? `后端：${payloadError}` : '没有返回明确原因。'}`);
                throw new Error(`UPI 兑换接口请求失败（HTTP ${statusCode}）：${payloadError}`);
              }
              throw new Error(`UPI 兑换接口请求失败（HTTP ${response?.status || 0}）${payloadError ? `：${payloadError}` : ''}`);
            }
            const payloadError = getPayloadError(payload);
            if (payloadError) {
              throw new Error(`UPI 兑换接口返回错误：${payloadError}`);
            }
            if (isHtmlResponsePayload(response, payload)) {
              throw new Error(`UPI 兑换接口返回了 HTML 页面，请检查远端兑换服务地址是否正确：${apiUrl}`);
            }
            return payload;
          } catch (error) {
            if (error?.name === 'AbortError') {
              throw new Error('UPI 兑换接口请求超时。');
            }
            if (isFetchNetworkError(error)) {
              const message = normalizeString(error?.message || error);
              throw new Error(`${UPI_REDEEM_NETWORK_ERROR_PREFIX}UPI 兑换接口网络请求失败：${apiUrl}。原始错误：${message || 'Failed to fetch'}`);
            }
            throw error;
          } finally {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          }
        }


        async function postSubscriptionJson({ apiUrl, token }) {
          if (typeof fetchImpl !== 'function') {
            throw new Error('当前运行环境不支持 fetch，无法查询 UPI 会员状态。');
          }
          const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
          const timeoutId = controller
            ? setTimeout(() => controller.abort(), UPI_REDEEM_TIMEOUT_MS)
            : null;
          try {
            const response = await fetchImpl(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token }),
              ...(controller ? { signal: controller.signal } : {}),
            });
            const payload = await readResponseBody(response);
            if (!response?.ok) {
              const payloadError = getPayloadError(payload);
              throw new Error(`UPI 会员状态接口请求失败（HTTP ${response?.status || 0}）：${apiUrl}${payloadError ? `。后端：${payloadError}` : ''}`);
            }
            if (isHtmlResponsePayload(response, payload)) {
              throw new Error(`UPI 会员状态接口返回了 HTML 页面，可能订阅 API 地址填错，或后端没有 /api/v1/subscription 路由：${apiUrl}`);
            }
            return payload && typeof payload === 'object' && !Array.isArray(payload)
              ? payload
              : { ok: false, reason: 'invalid-response' };
          } catch (error) {
            if (error?.name === 'AbortError') {
              throw new Error(`${UPI_REDEEM_NETWORK_ERROR_PREFIX}UPI 会员状态接口请求超时：${apiUrl}`);
            }
            const message = normalizeString(error?.message || error);
            if (isFetchNetworkError(error)) {
              throw new Error(`${UPI_REDEEM_NETWORK_ERROR_PREFIX}UPI 会员状态接口网络请求失败：${apiUrl}。请检查订阅 API 地址、网络/代理、证书或扩展是否已重新加载。原始错误：${message || 'Failed to fetch'}`);
            }
            throw error;
          } finally {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          }
        }


        async function postEligibilityCheckJson({ apiUrl, token, promoId = '' }) {
          if (typeof fetchImpl !== 'function' || !upiRedeemApiClient?.checkEligibility) {
            throw new Error('当前运行环境不支持 fetch，无法请求 UPI 优惠资格验证接口。');
          }
          const normalizedToken = normalizeString(token);
          if (!normalizedToken) {
            throw new Error(`${UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX}缺少 ChatGPT accessToken，无法调用优惠资格验证。`);
          }
          const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
          const timeoutId = controller
            ? setTimeout(() => controller.abort(), UPI_REDEEM_TIMEOUT_MS)
            : null;
          try {
            const { response, payload } = await upiRedeemApiClient.checkEligibility({
              apiUrl,
              token: normalizedToken,
              promoId,
              headers: {
                'Content-Type': 'application/json',
              },
              ...(controller ? { signal: controller.signal } : {}),
              returnResponse: true,
              throwOnError: false,
            });
            if (!response?.ok) {
              if (isEligibilityResultPayload(payload) || isEligibilityResultPayload(payload?.data)) {
                return payload && typeof payload === 'object' && !Array.isArray(payload)
                  ? payload
                  : { ok: false, reason: 'invalid-response' };
              }
              const payloadError = getPayloadErrorDetails(payload) || getPayloadError(payload);
              const statusCode = Number(response?.status) || 0;
              if (isUpiAccessTokenExpiredPayload(payload, statusCode)) {
                throw new Error(`${UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX}ChatGPT accessToken 优惠资格验证失败：${payloadError || `HTTP ${statusCode}`}`);
              }
              throw new Error(`UPI 优惠资格验证接口请求失败（HTTP ${statusCode}）${payloadError ? `：${payloadError}` : ''}`);
            }
            if (isHtmlResponsePayload(response, payload)) {
              throw new Error(`UPI 优惠资格验证接口返回了 HTML 页面：${apiUrl}，可能订阅 API 地址填错，或后端没有 /api/v1/check 路由。`);
            }
            return payload && typeof payload === 'object' && !Array.isArray(payload)
              ? payload
              : { ok: false, reason: 'invalid-response' };
          } catch (error) {
            if (error?.name === 'AbortError') {
              throw new Error(`${UPI_REDEEM_NETWORK_ERROR_PREFIX}UPI 优惠资格验证接口请求超时。`);
            }
            if (isFetchNetworkError(error)) {
              const message = normalizeString(error?.message || error);
              throw new Error(`${UPI_REDEEM_NETWORK_ERROR_PREFIX}UPI 优惠资格验证接口网络请求失败：${apiUrl}。原始错误：${message || 'Failed to fetch'}`);
            }
            throw error;
          } finally {
            if (timeoutId) {
              clearTimeout(timeoutId);
            }
          }
        }


        async function checkUPIAccessTokenEligibility({ checkUrl, externalApiKey, clientId, cdkey, session, accessToken, expectedEmail = '' }) {
          const payload = await postEligibilityCheckJson({
            apiUrl: checkUrl,
            token: accessToken || getChatGptSessionAccessToken(session),
          });
          const item = getEligibilityItem(payload, cdkey);
          const decision = normalizeTrialEligibilityApiItem(item);
          const targetEmail = parsePoolEntryEmail(expectedEmail) || resolveSessionAccountEmail(session || {});
          const emailMismatchReason = buildTrialEligibilityEmailMismatchReason(decision, targetEmail);
          if (emailMismatchReason) {
            const error = new Error(`UPI 资格检查失败：${emailMismatchReason}`);
            error.trialEligibilityDecision = {
              ...decision,
              trialEligibilityStatus: 'failed',
              trialEligibilityReason: emailMismatchReason,
              trialEligibilityRetryable: true,
              trialEligibilityTransientFailure: false,
            };
            throw error;
          }
          const failureMessage = getEligibilityFailureMessage(item);
          if (failureMessage) {
            const accountIneligible = isTrialEligibilityAccountIneligibleDecision(decision);
            const tokenInvalid = isTrialEligibilityTokenInvalidDecision(decision);
            const prefix = accountIneligible
              ? UPI_ACCOUNT_INELIGIBLE_ERROR_PREFIX
              : (tokenInvalid ? UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX : '');
            const error = new Error(`${prefix}UPI 资格检查失败：${failureMessage}`);
            error.trialEligibilityDecision = decision;
            throw error;
          }
          return {
            ...item,
            trialEligibilityDecision: decision,
          };
        }


        async function postUpiRedeem({ apiUrl, externalApiKey, clientId, cdkey, session, accessToken, state = {}, channel = 'upi' }) {
          const normalizedChannel = normalizeRedeemChannel(channel);
          let payload = null;
          try {
            payload = await postUPIJson({
              apiUrl,
              externalApiKey,
              clientId,
              body: {
                items: [buildUpiRedeemSessionItem({ cdkey, session, accessToken })],
                channel: normalizedChannel,
              },
            });
          } catch (error) {
            if (isUpiRedeemApiAuthError(error)) {
              throw error;
            }
            if (isUpiRedeemDuplicateCdkeyError(error)) {
              throw new Error(`${UPI_REDEEM_DUPLICATE_CDK_ERROR_PREFIX}${getErrorMessage(error) || 'CDK 已提交过，等待远端状态刷新。'}`);
            }
            if (isUpiRedeemBackendFailureMessage(error)) {
              throw new Error(`${UPI_REDEEM_BACKEND_FAILED_ERROR_PREFIX}${getErrorMessage(error) || 'CDK 兑换失败。'}`);
            }
            throw error;
          }
          const itemFailure = getRedeemItemFailureMessage(payload, cdkey);
          if (itemFailure) {
            if (isUpiRedeemDuplicateCdkeyMessage(itemFailure)) {
              throw new Error(`${UPI_REDEEM_DUPLICATE_CDK_ERROR_PREFIX}UPI 兑换接口返回重复提交：${itemFailure}`);
            }
            throw new Error(`${UPI_REDEEM_BACKEND_FAILED_ERROR_PREFIX}UPI 兑换接口返回错误：${itemFailure}`);
          }
          const acceptance = await confirmUpiRedeemSubmissionAccepted({
            payload,
            externalApiKey,
            clientId,
            cdkey,
            state,
            channel: normalizedChannel,
          });
          if (!acceptance.confirmed) {
            throw new Error(`${UPI_REDEEM_NOT_ACCEPTED_ERROR_PREFIX}UPI 兑换接口未确认接收当前 CDK，后端没有兑换记录：${acceptance.reason || '状态接口未找到记录'}`);
          }
          return payload;
        }


        async function releaseCdkeyForApproveBlocked({ cdkey = '', email = '', reason = '', attemptAt = 0, visibleStep = 0, state = {}, channel = 'upi' } = {}) {
          const normalizedCdkey = normalizeString(cdkey);
          const normalizedEmail = parsePoolEntryEmail(email) || resolveCurrentRedeemEmail(state, {});
          const releasedAt = Math.max(1, Math.floor(Number(attemptAt) || Number(now()) || Date.now()));
          const releaseReason = normalizeString(reason) || 'approve-blocked';
          if (!normalizedCdkey) {
            return;
          }
          await updateCdkeyUsage(normalizedCdkey, (entry) => ({
            ...entry,
            usedAt: 0,
            lastAttemptAt: releasedAt,
            lastError: '',
            email: '',
            accessToken: '',
            accessTokenMasked: '',
            accessTokenUpdatedAt: 0,
            releasedEmail: normalizedEmail || normalizeString(entry.email).toLowerCase(),
            releaseReason,
            releasedAt,
            remoteStatus: 'approve_blocked',
            remoteMessage: `${releaseReason}；提交被阻塞，已释放 CDK`,
            remoteCheckedAt: releasedAt,
            retryCount: 0,
            lastRetryAt: 0,
            retrying: false,
            retryError: '',
            subscriptionActive: undefined,
            subscriptionPlanType: '',
            subscriptionCheckedAt: 0,
            subscriptionReason: '',
          }), channel);
          if (!normalizedEmail) {
            await addStepLog(visibleStep, `后端返回 approve-blocked，已释放 CDK ${normalizedCdkey}，但未能解析邮箱。`, 'warn');
          }
          await addStepLog(
            visibleStep,
            `后端返回 approve-blocked：${normalizedEmail || 'unknown'} 提交被阻塞，已释放 CDK ${normalizedCdkey}，账号保留在 Free 等待重新匹配。`,
            'warn'
          );
        }


        async function checkUpiRedeemAccessTokenEligibility(input = {}) {
          throwIfStopped();
          const runtimeState = await getMergedState(input.state || input.settings || {});
          const chatGptSession = normalizeChatGptSessionPayload(input.session || input.chatGptSession || input.chatgptSession || {});
          const accessToken = getChatGptSessionAccessToken(chatGptSession)
            || normalizeString(input.accessToken || input.token || input.access_token);
          if (!hasChatGptSessionPayload(chatGptSession) && !accessToken) {
            throw new Error('缺少 ChatGPT accessToken，无法检查 UPI 试用资格。');
          }
          const checkUrl = buildUPIAccessTokenCheckApiUrl(runtimeState);
          const visibleStep = resolveVisibleStep(runtimeState);
          await addStepLog(visibleStep, `UPI 资格检查接口：POST ${checkUrl}`, 'info');
          const forcedCdkey = normalizeString(input.cdkey || input.forceCdkey);
          const item = await checkUPIAccessTokenEligibility({
            checkUrl,
            cdkey: forcedCdkey,
            session: chatGptSession,
            accessToken,
            expectedEmail: input.expectedEmail || input.email || input.targetEmail || input.credential?.email,
          });
          return {
            cdkey: forcedCdkey,
            eligible: true,
            item,
          };
        }


        async function redeemUpiCredentialWithAccessToken(input = {}) {
          throwIfStopped();
          const runtimeState = await getMergedState(input.state || {});
          const redeemChannel = normalizeRedeemChannel(input.channel || input.redeemChannel || runtimeState.channel || runtimeState.redeemChannel);
          const redeemChannelLabel = getRedeemChannelLabel(redeemChannel);
          const visibleStep = resolveVisibleStep(runtimeState);
          const chatGptSession = normalizeChatGptSessionPayload(input.session || input.chatGptSession || input.chatgptSession || {});
          const accessToken = getChatGptSessionAccessToken(chatGptSession)
            || normalizeString(input.accessToken || input.token || input.access_token);
          if (!hasChatGptSessionPayload(chatGptSession) && !accessToken) {
            throw new Error('缺少 ChatGPT accessToken，无法兑换 CDK。');
          }
          const credential = input.credential && typeof input.credential === 'object' && !Array.isArray(input.credential)
            ? input.credential
            : {};
          const email = parsePoolEntryEmail(credential.email || input.email || runtimeState.email);
          const apiUrl = buildUpiRedeemApiUrl(runtimeState);
          const checkUrl = buildUPIAccessTokenCheckApiUrl(runtimeState);
          const externalApiKey = normalizeString(getUpiRedeemStateValue(runtimeState, 'upiRedeemExternalApiKey'));
          if (!externalApiKey) {
            throw new Error('UPI External API Key 未配置，请先在侧边栏填写 UPI 外部 API Key。');
          }
          const clientId = await resolveUpiRedeemClientId(runtimeState);
          const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(runtimeState, redeemChannel));
          const poolCdkeys = parseCdkeyPoolText(getRedeemChannelPoolText(runtimeState, redeemChannel));
          const cdkeys = getAvailableCdkeysForChannel(runtimeState, redeemChannel);
          const forceCdkey = normalizeString(input.forceCdkey);
          let cdkey = forceCdkey || pickFirstUnusedCdkey(cdkeys, usage);
          if (!cdkey) {
            throw new Error(forceCdkey
              ? '指定的 CDK 为空，无法重试。'
              : '没有可用的 CDK，请在侧边栏导入可用 CDK。');
          }
          if (forceCdkey) {
            const forcedUsage = usage?.[forceCdkey] || {};
            if (!poolCdkeys.includes(forceCdkey)) {
              throw new Error(`指定 CDK 不在当前 CDK 池中，已停止重试：${forceCdkey}`);
            }
            if (forcedUsage.enabled === false) {
              throw new Error(`指定 CDK 已停用，已停止重试：${forceCdkey}`);
            }
            if (!isCdkeySelectableForRedeem(forcedUsage)) {
              throw new Error(`指定 CDK 已兑换、处理中或已确认不可再次提交，已停止：${forceCdkey}`);
            }
            cdkey = forceCdkey;
          }
          const selectedUsage = usage?.[cdkey] || {};

          const skipEligibilityCheck = input.skipEligibilityCheck === true;
          const attemptAt = Math.max(1, Math.floor(Number(now()) || Date.now()));
          await addStepLog(
            visibleStep,
            `${redeemChannelLabel} Free 分组 CDK 兑换：准备提交 ChatGPT AT + CDK：${email || 'unknown'} -> session字段 ${getChatGptSessionFieldCount(chatGptSession)} -> ${cdkey}`,
            'info'
          );
          if (isRetryableRemoteStatus(selectedUsage.remoteStatus)) {
            await addStepLog(
              visibleStep,
              `${redeemChannelLabel} Free 分组 CDK 兑换：CDK ${cdkey} 上次状态为 ${normalizeUpiRedeemRemoteStatus(selectedUsage.remoteStatus)}，但未标记已用，将继续重试。`,
              'warn'
            );
          }
          if (skipEligibilityCheck) {
            await addStepLog(
              visibleStep,
              `${redeemChannelLabel} Free 分组 CDK 兑换：已跳过本地资格预检，直接提交兑换后端：${email || 'unknown'} -> ${cdkey} -> ${apiUrl}`,
              'warn'
            );
          } else {
            await addStepLog(visibleStep, `${redeemChannelLabel} Free 分组 CDK 兑换：正在检查 ChatGPT session 资格：${email || 'unknown'} -> ${cdkey} -> ${checkUrl}`, 'info');
            try {
              await checkUPIAccessTokenEligibility({
                checkUrl,
                externalApiKey,
                clientId,
                cdkey,
                session: chatGptSession,
                accessToken,
                expectedEmail: email,
              });
            } catch (error) {
              const message = getErrorMessage(error) || 'UPI 资格检查失败。';
              if (isUpiAccessTokenExpiredError(error)) {
                await addStepLog(
                  visibleStep,
                  `UPI Free 分组 CDK 兑换：资格预检接口提示 ChatGPT session 失效，将按 lala 逻辑继续提交兑换后端 ${apiUrl}：${message}`,
                  'warn'
                );
                await updateCdkeyUsage(cdkey, (entry) => ({
                  ...entry,
                  email,
                  accessToken,
                  accessTokenMasked: maskAccessToken(accessToken),
                  accessTokenUpdatedAt: attemptAt,
                  lastAttemptAt: attemptAt,
                  lastError: message,
                }), redeemChannel);
              } else {
                if (isApproveBlockedError(error)) {
                  await releaseCdkeyForApproveBlocked({
                    cdkey,
                    email,
                    reason: message,
                    attemptAt,
                    visibleStep,
                    state: runtimeState,
                    channel: redeemChannel,
                  });
                  throw error;
                }
                await updateCdkeyUsage(cdkey, (entry) => ({
                  ...entry,
                  email,
                  accessToken,
                  accessTokenMasked: maskAccessToken(accessToken),
                  accessTokenUpdatedAt: attemptAt,
                  lastAttemptAt: attemptAt,
                  lastError: message,
                }), redeemChannel);
                if (isUpiAccountIneligibleError(error)) {
                  await addStepLog(
                    visibleStep,
                    `UPI Free 分组 CDK 兑换：资格检查确认账号无资格，未提交到兑换后端 ${apiUrl}：${message}`,
                    'error'
                  );
                  throw error;
                }
                await addStepLog(
                  visibleStep,
                  `UPI Free 分组 CDK 兑换：资格检查接口失败，将继续提交兑换后端 ${apiUrl} 留痕：${message}`,
                  'warn'
                );
              }
            }
          }

          await addStepLog(visibleStep, `${redeemChannelLabel} Free 分组 CDK 兑换：正在提交 ChatGPT AT+CDK 到兑换接口：${email || 'unknown'} -> session字段 ${getChatGptSessionFieldCount(chatGptSession)} -> ${cdkey} -> ${apiUrl}`, 'info');
          await reserveCdkeyForRedeemSubmission({
            cdkey,
            email,
            accessToken,
            attemptAt,
            message: `正在提交兑换：${email || 'unknown'}`,
            channel: redeemChannel,
          });
          try {
            await postUpiRedeem({
              apiUrl,
              externalApiKey,
              clientId,
              cdkey,
              session: chatGptSession,
              accessToken,
              state: runtimeState,
              channel: redeemChannel,
            });
            await addStepLog(visibleStep, `${redeemChannelLabel} Free 分组 CDK 兑换：兑换接口已接收 ChatGPT AT+CDK：${email || 'unknown'} -> ${cdkey}`, 'ok');
            await updateCdkeyUsage(cdkey, (entry) => ({
              ...entry,
              email,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              accessTokenUpdatedAt: attemptAt,
              usedAt: 0,
              lastAttemptAt: attemptAt,
              lastError: '',
              remoteStatus: 'submitted',
              remoteMessage: '已提交到兑换后端，等待确认会员',
              remoteCheckedAt: attemptAt,
              retrying: false,
              retryError: '',
            }), redeemChannel);
            await addStepLog(visibleStep, `CDK 已提交到兑换后端，暂不从本地 CDK 池移除，等待确认会员成功后再清理：${cdkey}`, 'info');
          } catch (error) {
            const message = getErrorMessage(error) || 'CDK 兑换失败。';
            if (isUpiAccessTokenExpiredError(error)) {
              await addStepLog(
                visibleStep,
                `UPI Free 分组 CDK 兑换：兑换后端提示 ChatGPT session 失效，已停止当前账号，CDK 不记失败：${email || 'unknown'} -> ${cdkey}：${message}`,
                'warn'
              );
              await recordAccessTokenExpiredCdkeyAttempt({
                cdkey,
                email,
                attemptAt,
                message,
                channel: redeemChannel,
              });
              throw error;
            }
            if (isApproveBlockedError(error)) {
              await addStepLog(
                visibleStep,
                `UPI Free 分组 CDK 兑换：后端返回 approve-blocked，立即释放 CDK 并保留账号：${email || 'unknown'} -> ${cdkey}：${message}`,
                'warn'
              );
              await releaseCdkeyForApproveBlocked({
                cdkey,
                email,
                reason: message,
                attemptAt,
                visibleStep,
                state: runtimeState,
                channel: redeemChannel,
              });
              throw error;
            }
            if (isUpiRedeemNotAcceptedError(error)) {
              await addStepLog(
                visibleStep,
                `UPI Free 分组 CDK 兑换：兑换接口未确认接收，后端没有兑换记录，已释放 CDK：${email || 'unknown'} -> ${cdkey}：${message}`,
                'warn'
              );
              await releaseCdkeyForUnacceptedSubmission({
                cdkey,
                reason: message,
                attemptAt,
                channel: redeemChannel,
              });
              throw error;
            }
            if (isUpiRedeemDuplicateCdkeyError(error)) {
              const pendingReason = `${message || '后端提示 CDK 已提交过'}；这张 CDK 已被占用，当前账号未提交成功，本账号本轮结束。`;
              await addStepLog(
                visibleStep,
                `UPI Free 分组 CDK 兑换：后端提示 CDK 重复提交，当前账号未提交成功，将回到 Free 可换卡：${email || 'unknown'} -> ${cdkey}：${message}`,
                'warn'
              );
              await updateCdkeyUsage(cdkey, (entry) => ({
                ...entry,
                email: '',
                accessToken: '',
                accessTokenMasked: '',
                accessTokenUpdatedAt: 0,
                usedAt: 0,
                lastAttemptAt: attemptAt,
                lastError: '',
                remoteStatus: 'submitted',
                remoteMessage: pendingReason,
                remoteCheckedAt: attemptAt,
                retrying: false,
                retryError: '',
              }), redeemChannel);
              return {
                cdkey,
                accessToken,
                redeemChannel,
                active: false,
                planType: '',
                pendingRemoteConfirmation: false,
                duplicateCdkeyRejected: true,
                subscriptionCheckedAt: '',
                reason: pendingReason,
                subscription: {
                  active: false,
                  pendingRemoteConfirmation: false,
                  duplicateCdkeyRejected: true,
                  reason: pendingReason,
                },
              };
            }
            await addStepLog(
              visibleStep,
              `UPI Free 分组 CDK 兑换：AT+CDK 提交失败：${email || 'unknown'} -> ${cdkey}：${message}`,
              'error'
            );
            await updateCdkeyUsage(cdkey, (entry) => ({
              ...entry,
              email: '',
              accessToken: '',
              accessTokenMasked: '',
              accessTokenUpdatedAt: 0,
              usedAt: 0,
              lastAttemptAt: attemptAt,
              lastError: message,
              lastFailedEmail: email,
              lastFailedAt: attemptAt,
              lastFailedReason: message,
              remoteStatus: 'failed',
              remoteMessage: `${message}；CDK 已回到可用池，等待其他账号匹配`,
              remoteCheckedAt: attemptAt,
              retrying: false,
              retryError: message,
            }), redeemChannel);
            throw error;
          }

          if (input.deferSubscriptionConfirmation === true) {
            await addStepLog(
              visibleStep,
              `UPI Free 分组 CDK 兑换：已提交 ChatGPT AT+CDK，等待远端系统返回最终结果后再判定账号成功或失败：${email || 'unknown'} -> ${cdkey}`,
              'info'
            );
            return {
              cdkey,
              accessToken,
              redeemChannel,
              active: false,
              planType: '',
              pendingRemoteConfirmation: true,
              subscriptionCheckedAt: '',
              reason: '已提交到兑换后端，等待远端系统返回最终结果',
              subscription: {
                active: false,
                pendingRemoteConfirmation: true,
                reason: '已提交到兑换后端，等待远端系统返回最终结果',
              },
            };
          }

          const latestForSubscription = await getMergedState({});
          const subscriptionResult = await confirmCurrentRedeemPaidSubscription({
            state: latestForSubscription,
            email,
            cdkey,
            accessToken,
          });
          const subscriptionPlanType = normalizeSubscriptionPlanType(subscriptionResult.planType);
          const subscriptionReason = await recordCdkeySubscriptionConfirmation({
            cdkey,
            email,
            attemptAt,
            subscriptionResult,
            subscriptionPlanType,
            channel: redeemChannel,
          });
          if (subscriptionResult.active) {
            const cleanupState = await getMergedState({
              email,
              upiRedeemSuccess: true,
              upiRedeemCdkey: cdkey,
              redeemChannel,
              upiRedeemAccessToken: accessToken,
              upiRedeemSubscriptionActive: true,
              upiRedeemSubscriptionPlanType: subscriptionPlanType,
              upiRedeemSubscriptionCheckedAt: toIsoTimestamp(subscriptionResult.checkedAt),
            });
            await applyPaidSubscriptionCleanup({
              state: cleanupState,
              cdkey,
              email,
              visibleStep,
            });
          }

          return {
            cdkey,
            accessToken,
            redeemChannel,
            active: Boolean(subscriptionResult.active),
            planType: subscriptionPlanType,
            subscriptionCheckedAt: toIsoTimestamp(subscriptionResult.checkedAt),
            reason: subscriptionReason,
            subscription: subscriptionResult,
          };
        }


        function isFlowStoppedError(error) {
          return normalizeString(error?.message || error) === '流程已被用户停止。'
            || /^流程已被用户停止。?$/.test(getErrorMessage(error));
        }


        function shouldCountAutoRedeemFailure(error) {
          const message = getErrorMessage(error) || normalizeString(error?.message || error);
          if (isFlowStoppedError(error)) return false;
          if (isUpiRedeemApiAuthError(error)) return false;
          if (isUpiAccessTokenExpiredError(error)) return false;
          if (isUpiAccountIneligibleError(error)) return false;
          return !/没有可用的\s*CDK|CDK\s*不足|External API Key|API\s*Key|缺少\s*ChatGPT\s*accessToken|缺少\s*accessToken|登录态不一致|账号无资格|not eligible|ineligible/i.test(message);
        }


    return {
      getRedeemChannelLabel,
      getRedeemChannelFailureField,
      getRedeemChannelFailureCount,
      getRedeemChannelDailyLimitBlockedAtField,
      getRedeemChannelDailyLimitBlockedUntilField,
      getRedeemChannelDailyLimitReasonField,
      isRedeemChannelDailyLimitReason,
      isRedeemCrossRegionPaymentUnavailableReason,
      buildRedeemChannelDailyLimitPatch,
      isRedeemChannelDailyLimitBlocked,
      isRedeemAccountLocked,
      buildRedeemAccountUnlockedPatch,
      buildRedeemChannelFailurePatch,
      shouldRedeemItemUseChannel,
      getRedeemChannelSkipReason,
      getRedeemChannelPoolKey,
      getRedeemChannelUsageKey,
      getRedeemChannelPoolText,
      getRedeemChannelUsage,
      getAvailableCdkeysForChannel,
      buildRedeemChannelUsageUpdates,
      normalizeUpiRedeemCdkeyUsage,
      isActiveRemoteStatus,
      isCdkeyRedeemInFlight,
      isReusableInactiveSubscriptionRemoteStatus,
      isCdkeySelectableForRedeem,
      pickFirstUnusedCdkey,
      getAvailableRedeemCdkeys,
      countAvailableRedeemCdkeys,
      updateCdkeyUsage,
      reserveCdkeyForRedeemSubmission,
      releaseCdkeyForUnacceptedSubmission,
      readResponseBody,
      getPayloadError,
      getPayloadErrorDetails,
      isUpiAccessTokenExpiredPayload,
      isUpiAccessTokenExpiredError,
      recordAccessTokenExpiredCdkeyAttempt,
      getTrialEligibilityApiHelpers,
      normalizeTrialEligibilityApiItem,
      isTrialEligibilityAccountIneligibleDecision,
      isTrialEligibilityTokenInvalidDecision,
      buildTrialEligibilityEmailMismatchReason,
      buildTrialEligibilityResultPatch,
      isTrialEligibilityChannelAllowed,
      isEligibilityResultPayload,
      getEligibilityItem,
      getEligibilityFailureMessage,
      isEligibilityTokenInvalidItem,
      isEligibilityAccountIneligibleItem,
      isUpiRedeemBackendFailureMessage,
      isUpiRedeemDuplicateCdkeyMessage,
      isUpiRedeemDuplicateCdkeyError,
      isUpiRedeemNotAcceptedError,
      isUpiRedeemApiAuthError,
      isUpiAccountIneligibleError,
      isRecoverableUpiEligibilityError,
      getRedeemItemFailureMessage,
      getPayloadCdkeyItem,
      isRedeemAcceptedStatus,
      isRedeemPayloadItemAccepted,
      getPositiveRedeemAcceptedCount,
      confirmUpiRedeemSubmissionAccepted,
      getResponseContentType,
      isHtmlResponsePayload,
      postUPIJson,
      postSubscriptionJson,
      postEligibilityCheckJson,
      checkUPIAccessTokenEligibility,
      postUpiRedeem,
      releaseCdkeyForApproveBlocked,
      checkUpiRedeemAccessTokenEligibility,
      redeemUpiCredentialWithAccessToken,
      isFlowStoppedError,
      shouldCountAutoRedeemFailure,
    };
  }

  return {
    createUpiRedeemChannelSubmission,
  };
});
