(function attachMultiPageUpiRedeemStatusPolling(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MultiPageUpiRedeemStatusPolling = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMultiPageUpiRedeemStatusPollingModule() {
  function createUpiRedeemStatusPolling(context = {}) {
    const constants = context.constants || {};
    const { UPI_AUTO_REDEEM_REMOTE_REFRESH_INTERVAL_MS, UPI_AUTO_REDEEM_REMOTE_REFRESH_TIMEOUT_MS, UPI_AUTO_REDEEM_REMOTE_REFRESH_ERROR_LOG_INTERVAL_MS } = constants;
    const now = context.now;
    const setState = context.setState;
    const refreshPendingUpiCredentialMembershipRedeemStatuses = context.refreshPendingUpiCredentialMembershipRedeemStatuses;
    const sleepWithStop = context.sleepWithStop;
    const throwIfStopped = context.throwIfStopped;

    const normalizeString = (...args) => context.normalizeString(...args);
    const normalizeRedeemChannel = (...args) => context.normalizeRedeemChannel(...args);
    const getRedeemChannelLabel = (...args) => context.getRedeemChannelLabel(...args);
    const getRedeemChannelPoolText = (...args) => context.getRedeemChannelPoolText(...args);
    const getRedeemChannelUsage = (...args) => context.getRedeemChannelUsage(...args);
    const buildRedeemChannelUsageUpdates = (...args) => context.buildRedeemChannelUsageUpdates(...args);
    const getUpiRedeemStateValue = (...args) => context.getUpiRedeemStateValue(...args);
    const getErrorMessage = (...args) => context.getErrorMessage(...args);
    const addStepLog = (...args) => context.addStepLog(...args);
    const getMergedState = (...args) => context.getMergedState(...args);
    const buildUpiRedeemStatusApiUrl = (...args) => context.buildUpiRedeemStatusApiUrl(...args);
    const buildUpiRedeemCdkeyJobsApiUrl = (...args) => context.buildUpiRedeemCdkeyJobsApiUrl(...args);
    const getUpiSubscriptionApiBaseUrl = (...args) => context.getUpiSubscriptionApiBaseUrl(...args);
    const buildUpiSubscriptionApiUrl = (...args) => context.buildUpiSubscriptionApiUrl(...args);
    const resolveUpiRedeemClientId = (...args) => context.resolveUpiRedeemClientId(...args);
    const parseCdkeyPoolText = (...args) => context.parseCdkeyPoolText(...args);
    const parsePoolEntryEmail = (...args) => context.parsePoolEntryEmail(...args);
    const normalizeUpiRedeemCdkeyUsage = (...args) => context.normalizeUpiRedeemCdkeyUsage(...args);
    const isActiveRemoteStatus = (...args) => context.isActiveRemoteStatus(...args);
    const isCdkeyRedeemInFlight = (...args) => context.isCdkeyRedeemInFlight(...args);
    const updateCdkeyUsage = (...args) => context.updateCdkeyUsage(...args);
    const postUPIJson = (...args) => context.postUPIJson(...args);
    const postSubscriptionJson = (...args) => context.postSubscriptionJson(...args);
    const findMembershipResultItem = (...args) => context.findMembershipResultItem(...args);
    const isAutoRedeemResultInFlight = (...args) => context.isAutoRedeemResultInFlight(...args);
    const isFlowStoppedError = (...args) => context.isFlowStoppedError(...args);

        function normalizeBoolean(value) {
          if (value === true) {
            return true;
          }
          if (value === false || value === null || value === undefined) {
            return false;
          }
          const normalized = normalizeString(value).toLowerCase();
          return ['1', 'true', 'yes', 'y', 'ok', 'active', 'success'].includes(normalized);
        }


        function getUpiRedeemRemoteJobCapabilities(item = {}) {
          return {
            canCancel: normalizeBoolean(item?.can_cancel ?? item?.canCancel),
            canRetry: normalizeBoolean(item?.can_retry ?? item?.canRetry),
            canReuseToken: normalizeBoolean(item?.can_reuse_token ?? item?.canReuseToken),
            hasAccessToken: normalizeBoolean(item?.has_access_token ?? item?.hasAccessToken),
          };
        }


        function getUpiRedeemJobResultCdkey(item = {}) {
          return normalizeString(item?.cdkey || item?.cdk || item?.cd_key || item?.cdkey_code || item?.cdkeyCode);
        }


        function getUpiRedeemJobResultReason(item = {}, fallback = '') {
          return normalizeString(
            item?.reason
            || item?.message
            || item?.error
            || item?.error_message
            || item?.errorMessage
            || fallback
          );
        }


        function normalizeSubscriptionPlanType(value = '') {
          const normalized = normalizeString(value).toLowerCase().replace(/[\s-]+/g, '_');
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


        function hasOwnValue(source = {}, key = '') {
          return source && Object.prototype.hasOwnProperty.call(source, key);
        }


        function isSubscriptionPayloadOk(payload = {}) {
          if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            return false;
          }
          if (payload.ok === false || payload.success === false) {
            return false;
          }
          const okText = normalizeString(payload.ok || payload.reason || payload.status).toLowerCase();
          if (okText && !['ok', 'true', 'success', 'active'].includes(okText)) {
            return false;
          }
          return true;
        }


        function getSubscriptionPayloadPlanType(payload = {}) {
          return normalizeSubscriptionPlanType(
            payload?.plan_type
            || payload?.planType
            || payload?.subscription_plan
            || payload?.subscriptionPlan
            || ''
          );
        }


        function isActivePlusSubscriptionPayload(payload = {}) {
          if (!isSubscriptionPayloadOk(payload)) {
            return false;
          }
          const planType = getSubscriptionPayloadPlanType(payload);
          if (!isPaidSubscriptionPlan(planType)) {
            return false;
          }
          const hasActiveSignal = hasOwnValue(payload, 'has_active_subscription')
            || hasOwnValue(payload, 'hasActiveSubscription')
            || hasOwnValue(payload, 'subscription_active')
            || hasOwnValue(payload, 'subscriptionActive');
          if (!hasActiveSignal) {
            return true;
          }
          return normalizeBoolean(
            payload.has_active_subscription
            ?? payload.hasActiveSubscription
            ?? payload.subscription_active
            ?? payload.subscriptionActive
          );
        }


        function getPayloadItems(payload) {
          if (Array.isArray(payload?.data?.items)) {
            return payload.data.items;
          }
          if (Array.isArray(payload?.items)) {
            return payload.items;
          }
          if (Array.isArray(payload?.data)) {
            return payload.data;
          }
          return [];
        }


        function isFailureStatus(status) {
          return ['failed', 'failure', 'timeout', 'rejected', 'cancelled', 'canceled', 'error'].includes(
            normalizeString(status).toLowerCase()
          );
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


        function normalizeApproveBlockedToken(value = '') {
          return normalizeString(value).toLowerCase().replace(/[\s_]+/g, '-');
        }


        function isApproveBlockedRemoteResult(item = {}, status = '', message = '') {
          const values = [
            status,
            message,
            item?.status,
            item?.state,
            item?.result,
            item?.code,
            item?.error_code,
            item?.errorCode,
            item?.message,
            item?.error,
            item?.reason,
          ];
          return values.some((value) => /(^|[^a-z0-9])approve-blocked([^a-z0-9]|$)/i.test(normalizeApproveBlockedToken(value)));
        }


        function isApproveBlockedError(error) {
          return isApproveBlockedRemoteResult({}, '', getErrorMessage(error) || normalizeString(error?.message || error));
        }


        function getRemoteResultEmail(item = {}, fallback = '') {
          return parsePoolEntryEmail(
            item?.email
            || item?.account_email
            || item?.accountEmail
            || item?.credential_email
            || item?.credentialEmail
            || item?.target_email
            || item?.targetEmail
            || fallback
          );
        }


        function isSuccessfulRemoteStatus(status = '') {
          return normalizeUpiRedeemRemoteStatus(status) === 'success';
        }


        function isUnusedRemoteStatus(status = '') {
          return [
            'unused',
            'available',
            'new',
            'ready',
            'failed',
            'timeout',
            'rejected',
            'approve_blocked',
            'not_found',
            'invalid',
          ].includes(normalizeUpiRedeemRemoteStatus(status));
        }


        function isRetryableRemoteStatus(status = '') {
          return ['failed', 'timeout', 'rejected', 'approve_blocked'].includes(normalizeUpiRedeemRemoteStatus(status));
        }


        function isRecoverableCdkeyUsageEntry(entry = {}) {
          if (!entry || entry.enabled === false) {
            return false;
          }
          const remoteStatus = normalizeUpiRedeemRemoteStatus(entry.remoteStatus);
          const remoteMessageStatus = normalizeUpiRedeemRemoteStatus(entry.remoteMessage);
          if (entry.subscriptionActive === true || isSuccessfulRemoteStatus(entry.remoteStatus)) {
            return false;
          }
          if (isCdkeyRedeemInFlight(entry)) {
            return false;
          }
          return isRetryableRemoteStatus(entry.remoteStatus)
            || remoteStatus === 'canceled'
            || remoteMessageStatus === 'canceled'
            || entry.subscriptionActive === false
            || Boolean(normalizeString(entry.lastError || entry.subscriptionReason));
        }


        function mergeCdkeysWithRecoverableUsage(cdkeys = [], usage = {}) {
          const seen = new Set();
          const merged = [];
          for (const cdkey of cdkeys) {
            const normalizedCdkey = normalizeString(cdkey);
            if (!normalizedCdkey || seen.has(normalizedCdkey)) {
              continue;
            }
            seen.add(normalizedCdkey);
            merged.push(normalizedCdkey);
          }
          return merged;
        }


        function getRemoteStatusMessage(item = {}, status = '') {
          return normalizeString(
            item?.message
            || item?.error
            || item?.error_message
            || item?.errorMessage
            || item?.reason
            || status
          );
        }


        function getRemoteStatusTimestamp(item = {}, fallback = 0) {
          const rawTimestamp = item?.usedAt
            ?? item?.used_at
            ?? item?.redeemedAt
            ?? item?.redeemed_at
            ?? item?.completedAt
            ?? item?.completed_at
            ?? item?.updatedAt
            ?? item?.updated_at
            ?? 0;
          if (typeof rawTimestamp === 'string') {
            const parsed = Date.parse(rawTimestamp);
            if (Number.isFinite(parsed)) {
              return parsed;
            }
          }
          const numeric = Number(rawTimestamp) || 0;
          return Math.max(0, Math.floor(numeric || fallback || 0));
        }


        function chunkArray(items = [], size = 100) {
          const chunkSize = Math.max(1, Math.floor(Number(size) || 100));
          const chunks = [];
          for (let index = 0; index < items.length; index += chunkSize) {
            chunks.push(items.slice(index, index + chunkSize));
          }
          return chunks;
        }


        async function refreshUpiRedeemCdkeyStatuses(inputState = {}) {
          const runtimeState = await getMergedState(inputState);
          const channel = normalizeRedeemChannel(inputState.channel || inputState.redeemChannel || runtimeState.channel || runtimeState.redeemChannel);
          const statusUrl = buildUpiRedeemStatusApiUrl(runtimeState);
          const externalApiKey = normalizeString(getUpiRedeemStateValue(runtimeState, 'upiRedeemExternalApiKey'));
          if (!externalApiKey) {
            throw new Error('UPI External API Key 未配置，请先在侧边栏填写 UPI 外部 API Key。');
          }
          const clientId = await resolveUpiRedeemClientId(runtimeState);
          const rawCdkeys = Array.isArray(inputState?.cdkeys)
            ? inputState.cdkeys
            : parseCdkeyPoolText(getRedeemChannelPoolText(runtimeState, channel));
          const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(runtimeState, channel));
          const cdkeys = mergeCdkeysWithRecoverableUsage(parseCdkeyPoolText(rawCdkeys.join('\n')), usage);
          if (!cdkeys.length) {
            throw new Error('没有可查询的 CDK，请先导入 CDK。');
          }
          const cdkeyEmailMap = inputState?.cdkeyEmailMap && typeof inputState.cdkeyEmailMap === 'object' && !Array.isArray(inputState.cdkeyEmailMap)
            ? inputState.cdkeyEmailMap
            : {};
          const getMappedCdkeyEmail = (cdkey = '') => {
            const normalizedCdkey = normalizeString(cdkey);
            if (!normalizedCdkey) return '';
            return normalizeString(cdkeyEmailMap[normalizedCdkey] || cdkeyEmailMap[normalizedCdkey.toLowerCase()]).toLowerCase();
          };

          const checkedAt = Math.max(1, Math.floor(Number(now()) || Date.now()));
          const items = [];
          for (const chunk of chunkArray(cdkeys, 100)) {
            const payload = await postUPIJson({
              apiUrl: statusUrl,
              externalApiKey,
              clientId,
              body: { cdkeys: chunk, channel },
            });
            items.push(...getPayloadItems(payload));
          }

          const nextUsage = { ...usage };
          items.forEach((item) => {
            const cdkey = normalizeString(item?.cdkey || item?.cdk);
            if (!cdkey) {
              return;
            }
            const currentEntry = nextUsage[cdkey] || { usedAt: 0, lastAttemptAt: 0, lastError: '', enabled: true };
            const remoteStatus = normalizeBoolean(item?.cancelled ?? item?.canceled)
              ? 'canceled'
              : normalizeUpiRedeemRemoteStatus(item?.status || item?.state || item?.result);
            const remoteMessage = getRemoteStatusMessage(item, remoteStatus);
            const previousBoundEmail = normalizeString(
              currentEntry.email
              || currentEntry.accountEmail
              || currentEntry.credentialEmail
              || currentEntry.targetEmail
              || getMappedCdkeyEmail(cdkey)
            ).toLowerCase();
            const remoteJobCapabilities = getUpiRedeemRemoteJobCapabilities(item);
            const approveBlocked = isApproveBlockedRemoteResult(item, remoteStatus, remoteMessage);
            if (approveBlocked) {
              const releasedEmail = getRemoteResultEmail(item, currentEntry.email);
              const releaseReason = remoteMessage || 'approve-blocked';
              nextUsage[cdkey] = {
                usedAt: 0,
                lastAttemptAt: Math.max(0, Math.floor(Number(currentEntry.lastAttemptAt) || 0)),
                lastError: '',
                enabled: currentEntry.enabled !== false,
                email: '',
                releasedEmail,
                releaseReason,
                releasedAt: checkedAt,
                remoteStatus: 'unused',
                remoteMessage: `${releaseReason}；邮箱不可用，已释放 CDK`,
                remoteCheckedAt: checkedAt,
                ...remoteJobCapabilities,
                retryCount: 0,
                lastRetryAt: 0,
                retrying: false,
                retryError: '',
              };
              return;
            }
            if (remoteStatus === 'not_found') {
              const releaseMessage = remoteMessage || '后端无兑换记录';
              nextUsage[cdkey] = {
                usedAt: 0,
                lastAttemptAt: Math.max(0, Math.floor(Number(currentEntry.lastAttemptAt) || 0)),
                lastError: '',
                enabled: currentEntry.enabled !== false,
                email: '',
                releasedEmail: '',
                releaseReason: '',
                releasedAt: 0,
                remoteStatus: 'not_found',
                remoteMessage: `${releaseMessage}；后端无兑换记录，CDK 可重新提交`,
                remoteCheckedAt: checkedAt,
                ...remoteJobCapabilities,
                retryCount: Math.max(0, Math.floor(Number(currentEntry.retryCount) || 0)),
                lastRetryAt: Math.max(0, Math.floor(Number(currentEntry.lastRetryAt) || 0)),
                retrying: false,
                retryError: '',
              };
              return;
            }
            const success = isSuccessfulRemoteStatus(remoteStatus);
            const unused = isUnusedRemoteStatus(remoteStatus);
            const failed = isFailureStatus(remoteStatus);
            if (remoteStatus === 'canceled') {
              nextUsage[cdkey] = {
                ...currentEntry,
                usedAt: 0,
                lastError: remoteMessage || '后端已手动取消兑换',
                enabled: currentEntry.enabled !== false,
                email: '',
                accessToken: '',
                accessTokenMasked: '',
                accessTokenUpdatedAt: 0,
                releasedEmail: previousBoundEmail,
                releaseReason: remoteMessage || '后端已手动取消兑换',
                releasedAt: checkedAt,
                lastFailedEmail: '',
                lastFailedAt: 0,
                lastFailedReason: '',
                remoteStatus: 'canceled',
                remoteMessage: `${remoteMessage || '后端已手动取消兑换'}；后端已取消，CDK 可重新提交`,
                remoteCheckedAt: checkedAt,
                ...remoteJobCapabilities,
                retrying: false,
                retryError: '',
              };
              delete nextUsage[cdkey].subscriptionActive;
              delete nextUsage[cdkey].subscriptionPlanType;
              delete nextUsage[cdkey].subscriptionCheckedAt;
              delete nextUsage[cdkey].subscriptionReason;
              return;
            }
            if (failed) {
              const failedEmail = normalizeString(currentEntry.email || getRemoteResultEmail(item, '')).toLowerCase();
              nextUsage[cdkey] = {
                ...currentEntry,
                usedAt: 0,
                lastError: remoteMessage,
                enabled: currentEntry.enabled !== false,
                email: '',
                accessToken: '',
                accessTokenMasked: '',
                accessTokenUpdatedAt: 0,
                releasedEmail: '',
                releaseReason: '',
                releasedAt: 0,
                lastFailedEmail: failedEmail,
                lastFailedAt: checkedAt,
                lastFailedReason: remoteMessage || '远端确认兑换失败',
                remoteStatus,
                remoteMessage: `${remoteMessage || '远端确认兑换失败'}；CDK 已回到可用池，等待其他账号匹配`,
                remoteCheckedAt: checkedAt,
                ...remoteJobCapabilities,
                retrying: false,
                retryError: '',
              };
              delete nextUsage[cdkey].subscriptionActive;
              delete nextUsage[cdkey].subscriptionPlanType;
              delete nextUsage[cdkey].subscriptionCheckedAt;
              delete nextUsage[cdkey].subscriptionReason;
              return;
            }
            const preserveReleaseInfo = !currentEntry.email && ['unused', 'available', 'new', 'ready'].includes(remoteStatus);
            nextUsage[cdkey] = {
              ...currentEntry,
              usedAt: success
                ? getRemoteStatusTimestamp(item, currentEntry.usedAt || checkedAt)
                : (unused ? 0 : Math.max(0, Math.floor(Number(currentEntry.usedAt) || 0))),
              lastError: success || ['unused', 'available', 'new', 'ready'].includes(remoteStatus)
                ? ''
                : isFailureStatus(remoteStatus) || remoteStatus === 'not_found' || remoteStatus === 'invalid' ? remoteMessage : '',
              enabled: currentEntry.enabled !== false,
              releasedEmail: preserveReleaseInfo ? normalizeString(currentEntry.releasedEmail) : '',
              releaseReason: preserveReleaseInfo ? normalizeString(currentEntry.releaseReason) : '',
              releasedAt: preserveReleaseInfo ? Math.max(0, Math.floor(Number(currentEntry.releasedAt) || 0)) : 0,
              remoteStatus,
              remoteMessage,
              remoteCheckedAt: checkedAt,
              ...remoteJobCapabilities,
              retrying: false,
              retryError: success ? '' : normalizeString(currentEntry.retryError),
            };
            if (!success && !isActiveRemoteStatus(remoteStatus)) {
              delete nextUsage[cdkey].subscriptionActive;
              delete nextUsage[cdkey].subscriptionPlanType;
              delete nextUsage[cdkey].subscriptionCheckedAt;
              delete nextUsage[cdkey].subscriptionReason;
            }
          });

          const updates = buildRedeemChannelUsageUpdates(channel, nextUsage);
          await setState(updates);
          return {
            channel,
            statusUrl,
            checkedAt,
            checkedCount: cdkeys.length,
            items,
            updates,
          };
        }


        async function operateUpiRedeemCdkeyJobs(inputState = {}, action = '') {
          const normalizedAction = normalizeString(action).toLowerCase();
          const runtimeState = await getMergedState(inputState);
          const channel = normalizeRedeemChannel(inputState.channel || inputState.redeemChannel || runtimeState.channel || runtimeState.redeemChannel);
          const jobUrl = buildUpiRedeemCdkeyJobsApiUrl(runtimeState, normalizedAction);
          const externalApiKey = normalizeString(getUpiRedeemStateValue(runtimeState, 'upiRedeemExternalApiKey'));
          if (!externalApiKey) {
            throw new Error('UPI External API Key 未配置，请先在侧边栏填写 UPI 外部 API Key。');
          }
          const clientId = await resolveUpiRedeemClientId(runtimeState);
          const rawCdkeys = Array.isArray(inputState?.cdkeys)
            ? inputState.cdkeys
            : parseCdkeyPoolText(getRedeemChannelPoolText(runtimeState, channel));
          const cdkeys = parseCdkeyPoolText(rawCdkeys.join('\n'));
          if (!cdkeys.length) {
            throw new Error('没有可操作的 CDK，请先选择或导入 CDK。');
          }

          const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(runtimeState, channel));
          const cdkeyEmailMap = inputState?.cdkeyEmailMap && typeof inputState.cdkeyEmailMap === 'object' && !Array.isArray(inputState.cdkeyEmailMap)
            ? inputState.cdkeyEmailMap
            : {};
          const getMappedCdkeyEmail = (cdkey = '') => {
            const normalizedCdkey = normalizeString(cdkey);
            if (!normalizedCdkey) return '';
            return normalizeString(cdkeyEmailMap[normalizedCdkey] || cdkeyEmailMap[normalizedCdkey.toLowerCase()]).toLowerCase();
          };
          const checkedAt = Math.max(1, Math.floor(Number(now()) || Date.now()));
          const items = [];
          for (const chunk of chunkArray(cdkeys, 100)) {
            const payload = await postUPIJson({
              apiUrl: jobUrl,
              externalApiKey,
              clientId,
              body: { cdkeys: chunk, channel },
            });
            items.push(...getPayloadItems(payload));
          }

          const nextUsage = { ...usage };
          const resultItems = items.map((item = {}) => {
            const cdkey = getUpiRedeemJobResultCdkey(item);
            const found = item?.found === undefined ? true : normalizeBoolean(item.found);
            const succeeded = normalizedAction === 'cancel'
              ? normalizeBoolean(item?.cancelled ?? item?.canceled ?? item?.ok ?? item?.success)
              : normalizeBoolean(item?.retried ?? item?.retry ?? item?.ok ?? item?.success);
            const reason = getUpiRedeemJobResultReason(
              item,
              found ? '' : '后端未找到该 CDK 任务'
            );
            const capabilities = getUpiRedeemRemoteJobCapabilities(item);
            if (cdkey) {
              const currentEntry = nextUsage[cdkey] || { usedAt: 0, lastAttemptAt: 0, lastError: '', enabled: true };
              const previousBoundEmail = normalizeString(
                currentEntry.email
                || currentEntry.accountEmail
                || currentEntry.credentialEmail
                || currentEntry.targetEmail
                || getMappedCdkeyEmail(cdkey)
              ).toLowerCase();
              if (!found) {
                nextUsage[cdkey] = {
                  ...currentEntry,
                  lastError: reason || '后端未找到该 CDK 任务',
                  remoteStatus: 'not_found',
                  remoteMessage: reason || '后端未找到该 CDK 任务',
                  remoteCheckedAt: checkedAt,
                  canCancel: false,
                  canRetry: false,
                  canReuseToken: false,
                  hasAccessToken: false,
                  retrying: false,
                  retryError: '',
                };
              } else if (succeeded && normalizedAction === 'cancel') {
                nextUsage[cdkey] = {
                  ...currentEntry,
                  usedAt: 0,
                  lastError: reason || '后端已取消任务',
                  enabled: currentEntry.enabled !== false,
                  email: '',
                  accessToken: '',
                  accessTokenMasked: '',
                  accessTokenUpdatedAt: 0,
                  releasedEmail: previousBoundEmail,
                  releaseReason: reason || '后端已取消任务',
                  releasedAt: checkedAt,
                  lastFailedEmail: '',
                  lastFailedAt: 0,
                  lastFailedReason: '',
                  remoteStatus: 'canceled',
                  remoteMessage: reason || '后端已取消任务，CDK 可重新提交',
                  remoteCheckedAt: checkedAt,
                  canCancel: false,
                  canRetry: false,
                  canReuseToken: false,
                  hasAccessToken: false,
                  retrying: false,
                  retryError: '',
                };
                delete nextUsage[cdkey].subscriptionActive;
                delete nextUsage[cdkey].subscriptionPlanType;
                delete nextUsage[cdkey].subscriptionCheckedAt;
                delete nextUsage[cdkey].subscriptionReason;
              } else if (succeeded && normalizedAction === 'retry') {
                nextUsage[cdkey] = {
                  ...currentEntry,
                  lastError: '',
                  remoteStatus: 'pending_dispatch',
                  remoteMessage: reason || '后端已复用已绑定 access_token 重新入列，等待远端结果',
                  remoteCheckedAt: checkedAt,
                  canCancel: false,
                  canRetry: false,
                  canReuseToken: false,
                  hasAccessToken: true,
                  retryCount: Math.max(0, Math.floor(Number(currentEntry.retryCount) || 0)) + 1,
                  lastRetryAt: checkedAt,
                  retrying: false,
                  retryError: '',
                };
              } else {
                nextUsage[cdkey] = {
                  ...currentEntry,
                  ...capabilities,
                  lastError: normalizedAction === 'cancel' ? (reason || currentEntry.lastError || '') : normalizeString(currentEntry.lastError),
                  remoteCheckedAt: checkedAt,
                  retrying: false,
                  retryError: normalizedAction === 'retry' ? (reason || '后端未接受重试任务') : normalizeString(currentEntry.retryError),
                };
              }
            }
            return {
              cdkey,
              found,
              ...(normalizedAction === 'cancel' ? { cancelled: succeeded } : { retried: succeeded }),
              reason,
              ...capabilities,
              raw: item,
            };
          });

          const updates = buildRedeemChannelUsageUpdates(channel, nextUsage);
          await setState(updates);
          return {
            channel,
            jobUrl,
            action: normalizedAction,
            checkedAt,
            checkedCount: cdkeys.length,
            items: resultItems,
            updates,
          };
        }


        function cancelUpiRedeemCdkeyJobs(inputState = {}) {
          return operateUpiRedeemCdkeyJobs(inputState, 'cancel');
        }


        function retryUpiRedeemCdkeyJobs(inputState = {}) {
          return operateUpiRedeemCdkeyJobs(inputState, 'retry');
        }


        async function checkUpiRedeemSubscriptionStatuses(inputState = {}) {
          const runtimeState = await getMergedState(inputState);
          const subscriptionUrl = buildUpiSubscriptionApiUrl(getUpiSubscriptionApiBaseUrl(runtimeState));
          const rawItems = Array.isArray(inputState?.items) ? inputState.items : [];
          const items = rawItems
            .map((item, index) => ({
              id: normalizeString(item?.id || item?.recordId || item?.email || `item-${index}`),
              email: normalizeString(item?.email),
              cdkey: normalizeString(item?.cdkey),
              token: normalizeString(item?.token || item?.accessToken || item?.access_token),
            }))
            .filter((item) => item.id && item.token);
          if (!items.length) {
            return {
              subscriptionUrl,
              checkedCount: 0,
              items: [],
            };
          }

          const results = [];
          for (const item of items) {
            const payload = await postSubscriptionJson({
              apiUrl: subscriptionUrl,
              token: item.token,
            });
            const planType = getSubscriptionPayloadPlanType(payload);
            results.push({
              id: item.id,
              email: item.email,
              cdkey: item.cdkey,
              active: isActivePlusSubscriptionPayload(payload),
              planType,
              hasActiveSubscription: normalizeBoolean(
                payload?.has_active_subscription
                ?? payload?.hasActiveSubscription
                ?? payload?.subscription_active
                ?? payload?.subscriptionActive
              ),
              reason: normalizeString(payload?.reason || payload?.ok || payload?.message || ''),
              payload,
            });
          }
          return {
            subscriptionUrl,
            checkedCount: results.length,
            items: results,
          };
        }


        async function confirmCurrentRedeemPaidSubscription({ state = {}, email = '', cdkey = '', accessToken = '' } = {}) {
          const normalizedEmail = normalizeString(email).toLowerCase();
          const normalizedCdkey = normalizeString(cdkey);
          const token = normalizeString(accessToken);
          const checkedAt = Math.max(1, Math.floor(Number(now()) || Date.now()));
          if (!token) {
            return {
              active: false,
              planType: '',
              checkedAt,
              reason: '缺少 accessToken，无法确认会员状态。',
            };
          }

          try {
            const response = await checkUpiRedeemSubscriptionStatuses({
              ...state,
              items: [{
                id: normalizedEmail || normalizedCdkey || 'current-upi-redeem',
                email: normalizedEmail,
                cdkey: normalizedCdkey,
                token,
              }],
            });
            const item = Array.isArray(response?.items) ? response.items[0] : null;
            const planType = normalizeSubscriptionPlanType(item?.planType || item?.plan_type || '');
            const active = Boolean(item?.active) && isPaidSubscriptionPlan(planType);
            return {
              active,
              planType,
              checkedAt,
              reason: normalizeString(item?.reason || item?.message || ''),
              item,
            };
          } catch (error) {
            return {
              active: false,
              planType: '',
              checkedAt,
              reason: getErrorMessage(error) || '会员状态查询失败。',
              error,
            };
          }
        }


        function getSubscriptionConfirmationReason(subscriptionResult = {}, planType = '') {
          const rawReason = normalizeString(subscriptionResult.reason);
          const normalizedReason = rawReason.toLowerCase();
          const reason = rawReason && !['true', 'ok', 'success'].includes(normalizedReason)
            ? rawReason
            : '';
          return reason
            || (planType ? `当前套餐：${planType}` : '会员状态未激活或未返回 paid plan。');
        }


        async function recordCdkeySubscriptionConfirmation({
          cdkey = '',
          email = '',
          attemptAt = 0,
          subscriptionResult = {},
          subscriptionPlanType = '',
          channel = 'upi',
        } = {}) {
          const normalizedCdkey = normalizeString(cdkey);
          if (!normalizedCdkey) {
            return '';
          }
          const checkedAt = Math.max(0, Math.floor(Number(subscriptionResult.checkedAt) || 0));
          const active = Boolean(subscriptionResult.active);
          const reason = getSubscriptionConfirmationReason(subscriptionResult, subscriptionPlanType);
          const attemptTimestamp = Math.max(0, Math.floor(Number(attemptAt) || 0));
          await updateCdkeyUsage(normalizedCdkey, (entry) => {
            const previousUsedAt = Math.max(0, Math.floor(Number(entry.usedAt) || 0));
            const previousRemoteStatus = normalizeUpiRedeemRemoteStatus(entry.remoteStatus);
            const inactiveRemoteStatus = isSuccessfulRemoteStatus(previousRemoteStatus)
              ? 'success'
              : (isActiveRemoteStatus(previousRemoteStatus) ? previousRemoteStatus : 'submitted');
            return {
              ...entry,
              email: normalizeString(email || entry.email || entry.accountEmail || entry.credentialEmail).toLowerCase(),
              usedAt: active ? Math.max(previousUsedAt, attemptTimestamp) : 0,
              lastAttemptAt: Math.max(
                Math.max(0, Math.floor(Number(entry.lastAttemptAt) || 0)),
                attemptTimestamp
              ),
              lastError: '',
              remoteStatus: active ? 'success' : inactiveRemoteStatus,
              remoteMessage: reason,
              remoteCheckedAt: checkedAt || attemptTimestamp,
              subscriptionActive: active,
              subscriptionPlanType,
              subscriptionCheckedAt: checkedAt,
              subscriptionReason: reason,
              retrying: false,
              retryError: '',
            };
          }, channel);
          return reason;
        }


        function findPendingAutoRedeemResultItem(state = {}, {
          email = '',
          channel = 'upi',
          cdkey = '',
        } = {}) {
          const normalizedEmail = parsePoolEntryEmail(email);
          if (!normalizedEmail) {
            return null;
          }
          const item = findMembershipResultItem(state?.upiCredentialMembershipCheckResults, normalizedEmail);
          if (!item || !isAutoRedeemResultInFlight(item)) {
            return null;
          }
          const targetChannel = normalizeRedeemChannel(channel);
          const itemChannel = normalizeRedeemChannel(item?.redeemChannel || item?.channel);
          if (itemChannel !== targetChannel) {
            return null;
          }
          const targetCdkey = normalizeString(cdkey);
          const itemCdkey = normalizeString(item?.upiRedeemCdkey || item?.cdkey);
          if (targetCdkey && itemCdkey && itemCdkey !== targetCdkey) {
            return null;
          }
          return item;
        }


        async function waitForSubmittedAutoRedeemRemoteRefresh({
          visibleStep = 7,
          email = '',
          channel = 'upi',
          cdkey = '',
        } = {}) {
          const normalizedEmail = parsePoolEntryEmail(email);
          const redeemChannel = normalizeRedeemChannel(channel);
          const redeemChannelLabel = getRedeemChannelLabel(redeemChannel);
          const submittedCdkey = normalizeString(cdkey);
          if (!normalizedEmail || !submittedCdkey) {
            return { status: 'skipped', reason: '缺少邮箱或 CDK，无法自动刷新远端状态。' };
          }
          if (typeof refreshPendingUpiCredentialMembershipRedeemStatuses !== 'function') {
            await addStepLog(
              visibleStep,
              `${redeemChannelLabel} 主流程自动兑换：远端状态刷新能力未接入，已跳过后台刷新。`,
              'warn'
            );
            return { status: 'skipped', reason: '远端状态刷新能力未接入' };
          }

          const startedAt = Math.max(1, Math.floor(Number(now()) || Date.now()));
          let attempt = 0;
          let lastErrorLogAt = 0;
          let lastWaitingLogAt = 0;
          await addStepLog(
            visibleStep,
            `${redeemChannelLabel} 主流程自动兑换：后台正在刷新远端兑换状态：${normalizedEmail} -> ${submittedCdkey}；只同步状态和失败次数，不在刷新线程里续兑。`,
            'info'
          );

          while (true) {
            throwIfStopped();
            const latestBefore = await getMergedState({});
            const pendingBefore = findPendingAutoRedeemResultItem(latestBefore, {
              email: normalizedEmail,
              channel: redeemChannel,
              cdkey: submittedCdkey,
            });
            if (!pendingBefore) {
              return { status: 'synced', reason: '当前账号已离开等待远端结果状态' };
            }

            attempt += 1;
            try {
              const refreshResult = await refreshPendingUpiCredentialMembershipRedeemStatuses({
                email: normalizedEmail,
                channel: redeemChannel,
                cdkey: submittedCdkey,
                autoRefresh: true,
                skipAutoRetry: true,
              });
              if (refreshResult?.ok === false) {
                const reason = (Array.isArray(refreshResult.errors) ? refreshResult.errors : [])
                  .map((item) => normalizeString(item?.error || item))
                  .filter(Boolean)
                  .join('；') || '远端状态刷新失败';
                throw new Error(reason);
              }

              const latestAfter = await getMergedState({});
              const pendingAfter = findPendingAutoRedeemResultItem(latestAfter, {
                email: normalizedEmail,
                channel: redeemChannel,
                cdkey: submittedCdkey,
              });
              if (!pendingAfter) {
                const finalItem = findMembershipResultItem(latestAfter?.upiCredentialMembershipCheckResults, normalizedEmail) || {};
                const finalStatus = normalizeString(finalItem?.redeemStatus || finalItem?.status || finalItem?.planType);
                const finalReason = normalizeString(finalItem?.redeemReason || finalItem?.reason || finalItem?.remoteMessage);
                await addStepLog(
                  visibleStep,
                  `${redeemChannelLabel} 主流程自动兑换：远端兑换状态已同步：${normalizedEmail} -> ${submittedCdkey}${finalStatus ? `，状态 ${finalStatus}` : ''}${finalReason ? `，${finalReason}` : ''}；已跳过自动续兑。`,
                  finalItem?.status === 'paid' ? 'success' : 'warn'
                );
                return {
                  status: 'synced',
                  reason: finalReason || '远端状态已同步',
                  item: finalItem,
                  attempts: attempt,
                };
              }

              const nowMs = Math.max(1, Math.floor(Number(now()) || Date.now()));
              if (!lastWaitingLogAt || nowMs - lastWaitingLogAt >= UPI_AUTO_REDEEM_REMOTE_REFRESH_ERROR_LOG_INTERVAL_MS) {
                lastWaitingLogAt = nowMs;
                await addStepLog(
                  visibleStep,
                  `${redeemChannelLabel} 主流程自动兑换：远端仍在处理 ${normalizedEmail} -> ${submittedCdkey}，继续每 5 秒刷新；不自动续兑。`,
                  'info'
                );
              }
            } catch (error) {
              if (isFlowStoppedError(error)) {
                throw error;
              }
              const nowMs = Math.max(1, Math.floor(Number(now()) || Date.now()));
              if (!lastErrorLogAt || nowMs - lastErrorLogAt >= UPI_AUTO_REDEEM_REMOTE_REFRESH_ERROR_LOG_INTERVAL_MS) {
                lastErrorLogAt = nowMs;
                await addStepLog(
                  visibleStep,
                  `${redeemChannelLabel} 主流程自动兑换：刷新远端兑换状态临时失败，将继续等待：${getErrorMessage(error) || error}`,
                  'warn'
                );
              }
            }

            const elapsedMs = Math.max(0, Math.max(1, Math.floor(Number(now()) || Date.now())) - startedAt);
            if (elapsedMs >= UPI_AUTO_REDEEM_REMOTE_REFRESH_TIMEOUT_MS) {
              await addStepLog(
                visibleStep,
                `${redeemChannelLabel} 主流程自动兑换：后台刷新远端兑换状态超时，账号仍等待远端结果：${normalizedEmail} -> ${submittedCdkey}；已跳过自动续兑。`,
                'warn'
              );
              return {
                status: 'timeout',
                reason: '远端状态刷新超时，仍等待结果',
                attempts: attempt,
              };
            }
            await sleepWithStop(UPI_AUTO_REDEEM_REMOTE_REFRESH_INTERVAL_MS);
          }
        }


    return {
      normalizeBoolean,
      getUpiRedeemRemoteJobCapabilities,
      getUpiRedeemJobResultCdkey,
      getUpiRedeemJobResultReason,
      normalizeSubscriptionPlanType,
      isPaidSubscriptionPlan,
      getPaidSubscriptionPlanLabel,
      hasOwnValue,
      isSubscriptionPayloadOk,
      getSubscriptionPayloadPlanType,
      isActivePlusSubscriptionPayload,
      getPayloadItems,
      isFailureStatus,
      normalizeUpiRedeemRemoteStatus,
      normalizeApproveBlockedToken,
      isApproveBlockedRemoteResult,
      isApproveBlockedError,
      getRemoteResultEmail,
      isSuccessfulRemoteStatus,
      isUnusedRemoteStatus,
      isRetryableRemoteStatus,
      isRecoverableCdkeyUsageEntry,
      mergeCdkeysWithRecoverableUsage,
      getRemoteStatusMessage,
      getRemoteStatusTimestamp,
      chunkArray,
      refreshUpiRedeemCdkeyStatuses,
      operateUpiRedeemCdkeyJobs,
      cancelUpiRedeemCdkeyJobs,
      retryUpiRedeemCdkeyJobs,
      checkUpiRedeemSubscriptionStatuses,
      confirmCurrentRedeemPaidSubscription,
      getSubscriptionConfirmationReason,
      recordCdkeySubscriptionConfirmation,
      findPendingAutoRedeemResultItem,
      waitForSubmittedAutoRedeemRemoteRefresh,
    };
  }

  return {
    createUpiRedeemStatusPolling,
  };
});
