(function attachMembershipResultSync(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPageMembershipResultSync = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipResultSyncModule() {
  const RESULTS_STORAGE_KEY_DEFAULT = 'upiCredentialMembershipCheckResults';

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

  function defaultNormalizeResultsPayload(value = {}) {
    return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
  }

  function createMembershipResultSync(deps = {}) {
    const {
      broadcastDataUpdate = () => {},
      buildRedeemChannelUsageUpdates = () => ({}),
      chromeApi = globalThis.chrome,
      getState = async () => ({}),
      getUpiRedeemStateValue = (state = {}, key = '') => state?.[key],
      isBatchRunning = () => false,
      isCdkeyRetryRunning = () => false,
      isRedeemRunning = () => false,
      membershipResultsStore = null,
      normalizeBoolean = defaultNormalizeBoolean,
      normalizeEmail = defaultNormalizeEmail,
      normalizeResultsPayload = defaultNormalizeResultsPayload,
      normalizeRetryCount = defaultNormalizeRetryCount,
      normalizeString = defaultNormalizeString,
      normalizeUpiRedeemCdkeyUsage = (usage = {}) => usage || {},
      setState = null,
      storageKey = RESULTS_STORAGE_KEY_DEFAULT,
    } = deps;

    if (!membershipResultsStore || typeof membershipResultsStore.getStoredResults !== 'function' || typeof membershipResultsStore.saveResults !== 'function') {
      throw new Error('Membership results store instance is not loaded.');
    }

    async function getStoredResults() {
      const payload = await membershipResultsStore.getStoredResults();
      if (payload.running === true && !isBatchRunning()) {
        const fixedAt = new Date().toISOString();
        const fixed = normalizeResultsPayload({
          ...payload,
          running: false,
          updatedAt: fixedAt,
          stoppedAt: payload.stoppedAt || fixedAt,
          flowStage: '',
          flowStageEmail: '',
        });
        await chromeApi.storage.local.set({ [storageKey]: fixed }).catch(() => {});
        if (typeof setState === 'function') {
          await setState({ [storageKey]: fixed }).catch(() => {});
        }
        broadcastDataUpdate({ [storageKey]: fixed });
        return fixed;
      }
      if (payload.redeeming === true && !isRedeemRunning() && !isCdkeyRetryRunning()) {
        const fixedAt = new Date().toISOString();
        const fixed = normalizeResultsPayload({
          ...payload,
          redeeming: false,
          redeemUpdatedAt: fixedAt,
          redeemStoppedAt: payload.redeemStoppedAt || fixedAt,
          flowStage: '',
          flowStageEmail: '',
        });
        await chromeApi.storage.local.set({ [storageKey]: fixed }).catch(() => {});
        if (typeof setState === 'function') {
          await setState({ [storageKey]: fixed }).catch(() => {});
        }
        broadcastDataUpdate({ [storageKey]: fixed });
        return fixed;
      }
      return payload;
    }

    async function saveResults(results = {}) {
      return membershipResultsStore.saveResults(results);
    }

    async function updateUpiRedeemCdkeyRetryUsage(cdkey = '', updater = () => ({})) {
      const normalizedCdkey = normalizeString(cdkey);
      if (!normalizedCdkey) {
        return { usage: {}, entry: {} };
      }
      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      const usage = normalizeUpiRedeemCdkeyUsage(getUpiRedeemStateValue(latestState, 'upiRedeemCdkeyUsage') || {});
      const currentEntry = usage?.[normalizedCdkey] && typeof usage[normalizedCdkey] === 'object' && !Array.isArray(usage[normalizedCdkey])
        ? usage[normalizedCdkey]
        : {};
      const nextEntry = {
        ...currentEntry,
        ...(typeof updater === 'function' ? (updater(currentEntry) || {}) : {}),
      };
      const storedEntry = {
        ...nextEntry,
        usedAt: Math.max(0, Math.floor(Number(nextEntry.usedAt) || 0)),
        lastAttemptAt: Math.max(0, Math.floor(Number(nextEntry.lastAttemptAt) || 0)),
        lastError: normalizeString(nextEntry.lastError),
        enabled: nextEntry.enabled !== false,
        email: normalizeEmail(nextEntry.email || nextEntry.accountEmail || nextEntry.credentialEmail),
        remoteStatus: normalizeString(nextEntry.remoteStatus),
        remoteMessage: normalizeString(nextEntry.remoteMessage),
        remoteCheckedAt: Math.max(0, Math.floor(Number(nextEntry.remoteCheckedAt) || 0)),
        canCancel: normalizeBoolean(nextEntry.canCancel ?? nextEntry.can_cancel),
        canRetry: normalizeBoolean(nextEntry.canRetry ?? nextEntry.can_retry),
        canReuseToken: normalizeBoolean(nextEntry.canReuseToken ?? nextEntry.can_reuse_token),
        hasAccessToken: normalizeBoolean(nextEntry.hasAccessToken ?? nextEntry.has_access_token),
        retryCount: normalizeRetryCount(nextEntry.retryCount),
        lastRetryAt: Math.max(0, Math.floor(Number(nextEntry.lastRetryAt) || 0)),
        retrying: nextEntry.retrying === true,
        retryError: normalizeString(nextEntry.retryError),
      };
      const nextUsage = {
        ...usage,
        [normalizedCdkey]: storedEntry,
      };
      if (typeof setState === 'function') {
        await setState({
          cdkUsage: nextUsage,
          upiRedeemCdkUsage: nextUsage,
          upiRedeemCdkeyUsage: nextUsage,
        }).catch(() => {});
      }
      broadcastDataUpdate({
        cdkUsage: nextUsage,
        upiRedeemCdkUsage: nextUsage,
        upiRedeemCdkeyUsage: nextUsage,
      });
      return { usage: nextUsage, entry: storedEntry };
    }

    function buildRetryUpdatesPayload(results = null, usage = null, channel = 'upi') {
      const updates = {};
      if (usage && typeof usage === 'object' && !Array.isArray(usage)) {
        Object.assign(updates, buildRedeemChannelUsageUpdates(channel, usage));
      }
      if (results && typeof results === 'object' && !Array.isArray(results)) {
        updates[storageKey] = results;
      }
      return updates;
    }

    function sanitizeUpiRedeemRuntimeSettings(settings = {}) {
      const source = settings && typeof settings === 'object' && !Array.isArray(settings)
        ? settings
        : {};
      const sanitized = { ...source };
      delete sanitized.cdkUsage;
      delete sanitized.upiRedeemCdkUsage;
      delete sanitized.upiRedeemCdkeyUsage;
      delete sanitized.pixRedeemCdkeyUsage;
      delete sanitized.idealRedeemCdkeyUsage;
      return sanitized;
    }

    function hasUpiRedeemCdkeyUsageState(state = {}) {
      return Boolean(state && typeof state === 'object' && !Array.isArray(state) && (
        Object.prototype.hasOwnProperty.call(state, 'upiRedeemCdkeyUsage')
        || Object.prototype.hasOwnProperty.call(state, 'cdkUsage')
        || Object.prototype.hasOwnProperty.call(state, 'upiRedeemCdkUsage')
        || Object.prototype.hasOwnProperty.call(state, 'pixRedeemCdkeyUsage')
        || Object.prototype.hasOwnProperty.call(state, 'idealRedeemCdkeyUsage')
      ));
    }

    function preferLatestUpiRedeemCdkeyPoolState(state = {}, latestState = {}) {
      ['cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText', 'idealRedeemCdkeyPoolText'].forEach((key) => {
        if (latestState && typeof latestState === 'object' && !Array.isArray(latestState)
          && Object.prototype.hasOwnProperty.call(latestState, key)) {
          state[key] = latestState[key];
        }
      });
      return state;
    }

    async function getFreshUpiRedeemRuntimeState(input = {}) {
      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      const settings = input.settings && typeof input.settings === 'object' && !Array.isArray(input.settings)
        ? input.settings
        : {};
      const sanitizedInput = sanitizeUpiRedeemRuntimeSettings(input);
      delete sanitizedInput.settings;
      const state = {
        ...(latestState || {}),
        ...sanitizeUpiRedeemRuntimeSettings(settings),
        ...sanitizedInput,
      };
      preferLatestUpiRedeemCdkeyPoolState(state, latestState);
      if (hasUpiRedeemCdkeyUsageState(latestState)) {
        state.upiRedeemCdkeyUsage = getUpiRedeemStateValue(latestState, 'upiRedeemCdkeyUsage') || {};
        state.cdkUsage = state.upiRedeemCdkeyUsage;
        state.upiRedeemCdkUsage = state.upiRedeemCdkeyUsage;
        state.idealRedeemCdkeyUsage = latestState?.idealRedeemCdkeyUsage || {};
      } else if (hasUpiRedeemCdkeyUsageState(settings)) {
        state.upiRedeemCdkeyUsage = getUpiRedeemStateValue(settings, 'upiRedeemCdkeyUsage') || {};
        state.cdkUsage = state.upiRedeemCdkeyUsage;
        state.upiRedeemCdkUsage = state.upiRedeemCdkeyUsage;
        state.idealRedeemCdkeyUsage = settings?.idealRedeemCdkeyUsage || {};
      } else if (hasUpiRedeemCdkeyUsageState(input)) {
        state.upiRedeemCdkeyUsage = getUpiRedeemStateValue(input, 'upiRedeemCdkeyUsage') || {};
        state.cdkUsage = state.upiRedeemCdkeyUsage;
        state.upiRedeemCdkUsage = state.upiRedeemCdkeyUsage;
        state.idealRedeemCdkeyUsage = input?.idealRedeemCdkeyUsage || {};
      }
      return state;
    }

    return {
      buildRetryUpdatesPayload,
      getFreshUpiRedeemRuntimeState,
      getStoredResults,
      hasUpiRedeemCdkeyUsageState,
      preferLatestUpiRedeemCdkeyPoolState,
      sanitizeUpiRedeemRuntimeSettings,
      saveResults,
      updateUpiRedeemCdkeyRetryUsage,
    };
  }

  return {
    createMembershipResultSync,
  };
});
