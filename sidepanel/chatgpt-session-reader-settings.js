(function attachChatgptSessionReaderSettings(globalScope, factory) {
  const api = factory();
  globalScope.SidepanelChatgptSessionReaderSettings = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createChatgptSessionReaderSettingsModule() {
  const DEFAULT_REMOVED_PAYMENT_WORKER_MAX_ATTEMPTS = 10;
  const REMOVED_PAYMENT_WORKER_MAX_ATTEMPTS_LIMIT = 20;
  const REMOVED_PAYMENT_WORKER_ALLOWED_PAYMENT_LOCALES = new Set(['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'de', 'fr', 'es', 'id', 'pt-BR']);
  const DEFAULT_PROFILE_SETTING_KEYS = Object.freeze([
    'removedContactVerificationUrl',
    'removedContactCardDeclinedRetryEnabled',
    'removedContactFirstDirectResendEnabled',
    'removedContactFirstResendWaitSeconds',
    'removedContactSubsequentResendWaitSeconds',
    'removedContactVerificationResendMaxAttempts',
    'removedContactVerificationPollAttempts',
    'removedContactVerificationPollIntervalSeconds',
  ]);

  function normalizeBoundedInteger(value, fallback, min, max) {
    const numeric = Number.parseInt(String(value ?? '').trim(), 10);
    const fallbackNumber = Number(fallback);
    if (!Number.isFinite(numeric)) {
      return Math.max(min, Math.min(max, Number.isFinite(fallbackNumber) ? fallbackNumber : min));
    }
    return Math.max(min, Math.min(max, numeric));
  }

  function identityTrim(value = '') {
    return String(value || '').trim();
  }

  function createChatgptSessionReaderSettings(context = {}) {
    const modeUs = context.chatgptSessionReaderModeUs || 'us_pp';
    const modeJp = context.chatgptSessionReaderModeJp || 'jp_pp';
    const defaultMode = context.defaultChatgptSessionReaderMode || modeUs;
    const profileSettingKeys = Array.isArray(context.profileSettingKeys) && context.profileSettingKeys.length
      ? Object.freeze([...context.profileSettingKeys])
      : DEFAULT_PROFILE_SETTING_KEYS;
    const removedPaymentWorkerDefaultMaxAttempts = Number(context.removedPaymentWorkerDefaultMaxAttempts)
      || DEFAULT_REMOVED_PAYMENT_WORKER_MAX_ATTEMPTS;
    const removedPaymentWorkerMaxAttemptsLimit = Number(context.removedPaymentWorkerMaxAttemptsLimit)
      || REMOVED_PAYMENT_WORKER_MAX_ATTEMPTS_LIMIT;
    const allowedPaymentLocales = context.removedPaymentWorkerAllowedPaymentLocales instanceof Set
      ? context.removedPaymentWorkerAllowedPaymentLocales
      : REMOVED_PAYMENT_WORKER_ALLOWED_PAYMENT_LOCALES;

    const normalizePlusOauthDelay = typeof context.normalizePlusRemovedContactOauthDelaySeconds === 'function'
      ? context.normalizePlusRemovedContactOauthDelaySeconds
      : ((value) => normalizeBoundedInteger(value, 10, 0, 3600));
    const normalizeResendWait = typeof context.normalizeRemovedContactResendWaitSeconds === 'function'
      ? context.normalizeRemovedContactResendWaitSeconds
      : ((value, fallback = 20) => normalizeBoundedInteger(value, fallback, 0, 3600));
    const normalizeVerificationResendMax = typeof context.normalizeRemovedContactVerificationResendMaxAttempts === 'function'
      ? context.normalizeRemovedContactVerificationResendMaxAttempts
      : ((value, fallback = 1) => normalizeBoundedInteger(value, fallback, 0, 20));
    const normalizeVerificationPollAttempts = typeof context.normalizeRemovedContactVerificationPollAttempts === 'function'
      ? context.normalizeRemovedContactVerificationPollAttempts
      : ((value, fallback = 6) => normalizeBoundedInteger(value, fallback, 1, 60));
    const normalizeVerificationPollInterval = typeof context.normalizeRemovedContactVerificationPollIntervalSeconds === 'function'
      ? context.normalizeRemovedContactVerificationPollIntervalSeconds
      : ((value, fallback = 5) => normalizeBoundedInteger(value, fallback, 1, 120));
    const normalizeConversionProxyUrl = typeof context.normalizeChatgptSessionReaderConversionProxyUrlValue === 'function'
      ? context.normalizeChatgptSessionReaderConversionProxyUrlValue
      : identityTrim;
    const normalizeCloudConversionApiUrl = typeof context.normalizeChatgptSessionReaderCloudConversionApiUrlValue === 'function'
      ? context.normalizeChatgptSessionReaderCloudConversionApiUrlValue
      : identityTrim;
    const normalizeCloudConversionApiKey = typeof context.normalizeChatgptSessionReaderCloudConversionApiKeyValue === 'function'
      ? context.normalizeChatgptSessionReaderCloudConversionApiKeyValue
      : identityTrim;
    const normalizeRemovedContactVerificationUrl = typeof context.normalizeRemovedContactVerificationUrlValue === 'function'
      ? context.normalizeRemovedContactVerificationUrlValue
      : identityTrim;

    function normalizeChatgptSessionReaderModeValue(value = '') {
      const normalized = String(value || '').trim().toLowerCase();
      return normalized === modeJp ? modeJp : defaultMode;
    }

    function buildDefaultChatgptSessionReaderProfile() {
      return {
        removedContactVerificationUrl: '',
        removedContactCardDeclinedRetryEnabled: true,
        removedContactFirstDirectResendEnabled: false,
        removedContactFirstResendWaitSeconds: 20,
        removedContactSubsequentResendWaitSeconds: 25,
        removedContactVerificationResendMaxAttempts: 1,
        removedContactVerificationPollAttempts: 6,
        removedContactVerificationPollIntervalSeconds: 5,
      };
    }

    function buildDefaultRemovedPaymentWorkerSettings() {
      return {
        removedPaymentWorkerEnabled: true,
        removedPaymentWorkerBrowserBackend: 'local',
        removedPaymentWorkerAdsPowerApiBase: 'http://127.0.0.1:50325',
        removedPaymentWorkerAdsPowerApiKey: '',
        removedPaymentWorkerAdsPowerProfileId: '',
        removedPaymentWorkerRoxyBrowserApiBase: 'http://127.0.0.1:50000',
        removedPaymentWorkerRoxyBrowserApiKey: '',
        removedPaymentWorkerRoxyBrowserProfileId: '',
        removedPaymentWorkerStripePublishableKey: '',
        removedPaymentWorkerDeviceId: '',
        removedPaymentWorkerUserAgent: '',
        removedPaymentWorkerMaxAttempts: removedPaymentWorkerDefaultMaxAttempts,
        removedPaymentWorkerPaymentLocale: 'en',
        removedPaymentWorkerCheckoutRebuildMaxAttempts: 3,
        removedPaymentWorkerDefaultProxy: '',
        removedPaymentWorkerProviderProxy: '',
      };
    }

    function normalizeRemovedPaymentWorkerMaxAttemptsValue(value, fallback = removedPaymentWorkerDefaultMaxAttempts) {
      return normalizeBoundedInteger(value, Number(fallback) || removedPaymentWorkerDefaultMaxAttempts, 1, removedPaymentWorkerMaxAttemptsLimit);
    }

    function normalizeRemovedPaymentWorkerPaymentLocaleValue(value = '') {
      const normalized = String(value || '').trim();
      return allowedPaymentLocales.has(normalized) ? normalized : 'en';
    }

    function normalizeRemovedPaymentWorkerBrowserBackendValue(value = '') {
      const normalized = String(value || '').trim().toLowerCase();
      if (normalized === 'adspower') return 'adspower';
      if (normalized === 'roxybrowser') return 'roxybrowser';
      return 'local';
    }

    function normalizeRemovedPaymentWorkerAdsPowerApiBaseValue(value = '') {
      const raw = String(value || '').trim();
      if (!raw) {
        return '';
      }
      return /:\/\//.test(raw) ? raw.replace(/\/+$/, '') : `http://${raw.replace(/\/+$/, '')}`;
    }

    function normalizeRemovedPaymentWorkerRoxyBrowserApiBaseValue(value = '') {
      const raw = String(value || '').trim();
      if (!raw) {
        return '';
      }
      return /:\/\//.test(raw) ? raw.replace(/\/+$/, '') : `http://${raw.replace(/\/+$/, '')}`;
    }

    function normalizeRemovedPaymentWorkerCheckoutRebuildMaxAttemptsValue(value, fallback = 3) {
      return normalizeBoundedInteger(value, Number(fallback) || 3, 1, 10);
    }

    function normalizeRemovedPaymentWorkerSettingsValue(state = {}) {
      const defaults = buildDefaultRemovedPaymentWorkerSettings();
      const rawState = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
      const legacyProxy = String(rawState.removedPaymentWorkerProxy || '').trim();
      const hasRoxyBrowserProfileId = Object.prototype.hasOwnProperty.call(rawState, 'removedPaymentWorkerRoxyBrowserProfileId');
      const legacyProfileId = String(rawState.removedPaymentWorkerAdsPowerProfileId || '').trim();
      const roxyBrowserProfileId = hasRoxyBrowserProfileId
        ? String(rawState.removedPaymentWorkerRoxyBrowserProfileId || '').trim()
        : (normalizeRemovedPaymentWorkerBrowserBackendValue(rawState.removedPaymentWorkerBrowserBackend) === 'roxybrowser' ? legacyProfileId : '');
      const hasAdsPowerApiBase = Object.prototype.hasOwnProperty.call(rawState, 'removedPaymentWorkerAdsPowerApiBase');
      const hasRoxyBrowserApiBase = Object.prototype.hasOwnProperty.call(rawState, 'removedPaymentWorkerRoxyBrowserApiBase');
      return {
        removedPaymentWorkerEnabled: Boolean(rawState.removedPaymentWorkerEnabled),
        removedPaymentWorkerBrowserBackend: normalizeRemovedPaymentWorkerBrowserBackendValue(rawState.removedPaymentWorkerBrowserBackend || defaults.removedPaymentWorkerBrowserBackend),
        removedPaymentWorkerAdsPowerApiBase: normalizeRemovedPaymentWorkerAdsPowerApiBaseValue(hasAdsPowerApiBase ? rawState.removedPaymentWorkerAdsPowerApiBase : defaults.removedPaymentWorkerAdsPowerApiBase),
        removedPaymentWorkerAdsPowerApiKey: String(rawState.removedPaymentWorkerAdsPowerApiKey || defaults.removedPaymentWorkerAdsPowerApiKey || '').trim(),
        removedPaymentWorkerAdsPowerProfileId: legacyProfileId,
        removedPaymentWorkerRoxyBrowserApiBase: normalizeRemovedPaymentWorkerRoxyBrowserApiBaseValue(hasRoxyBrowserApiBase ? rawState.removedPaymentWorkerRoxyBrowserApiBase : defaults.removedPaymentWorkerRoxyBrowserApiBase),
        removedPaymentWorkerRoxyBrowserApiKey: String(rawState.removedPaymentWorkerRoxyBrowserApiKey || defaults.removedPaymentWorkerRoxyBrowserApiKey || '').trim(),
        removedPaymentWorkerRoxyBrowserProfileId: roxyBrowserProfileId,
        removedPaymentWorkerStripePublishableKey: String(rawState.removedPaymentWorkerStripePublishableKey || '').trim(),
        removedPaymentWorkerDeviceId: String(rawState.removedPaymentWorkerDeviceId || '').trim(),
        removedPaymentWorkerUserAgent: String(rawState.removedPaymentWorkerUserAgent || '').trim(),
        removedPaymentWorkerMaxAttempts: normalizeRemovedPaymentWorkerMaxAttemptsValue(rawState.removedPaymentWorkerMaxAttempts, defaults.removedPaymentWorkerMaxAttempts),
        removedPaymentWorkerPaymentLocale: normalizeRemovedPaymentWorkerPaymentLocaleValue(rawState.removedPaymentWorkerPaymentLocale || defaults.removedPaymentWorkerPaymentLocale),
        removedPaymentWorkerCheckoutRebuildMaxAttempts: normalizeRemovedPaymentWorkerCheckoutRebuildMaxAttemptsValue(
          rawState.removedPaymentWorkerCheckoutRebuildMaxAttempts,
          defaults.removedPaymentWorkerCheckoutRebuildMaxAttempts
        ),
        removedPaymentWorkerDefaultProxy: String(rawState.removedPaymentWorkerDefaultProxy || legacyProxy).trim(),
        removedPaymentWorkerProviderProxy: String(rawState.removedPaymentWorkerProviderProxy || '').trim(),
      };
    }

    function normalizeChatgptSessionReaderProfileValue(profile = {}, fallback = null) {
      const rawProfile = profile && typeof profile === 'object' && !Array.isArray(profile)
        ? profile
        : {};
      const baseProfile = fallback && typeof fallback === 'object' && !Array.isArray(fallback)
        ? fallback
        : buildDefaultChatgptSessionReaderProfile();
      return {
        plusRemovedContactOauthDelaySeconds: normalizePlusOauthDelay(
          rawProfile.plusRemovedContactOauthDelaySeconds ?? baseProfile.plusRemovedContactOauthDelaySeconds
        ),
        chatgptSessionReaderCloudConversionEnabled: Boolean(
          rawProfile.chatgptSessionReaderCloudConversionEnabled ?? baseProfile.chatgptSessionReaderCloudConversionEnabled
        ),
        chatgptSessionReaderCloudConversionApiUrl: normalizeCloudConversionApiUrl(
          rawProfile.chatgptSessionReaderCloudConversionApiUrl ?? baseProfile.chatgptSessionReaderCloudConversionApiUrl
        ),
        chatgptSessionReaderCloudConversionApiKey: normalizeCloudConversionApiKey(
          rawProfile.chatgptSessionReaderCloudConversionApiKey ?? baseProfile.chatgptSessionReaderCloudConversionApiKey
        ),
        chatgptSessionReaderConversionProxyUrl: normalizeConversionProxyUrl(
          rawProfile.chatgptSessionReaderConversionProxyUrl ?? baseProfile.chatgptSessionReaderConversionProxyUrl
        ),
        removedContactVerificationUrl: normalizeRemovedContactVerificationUrl(
          rawProfile.removedContactVerificationUrl ?? baseProfile.removedContactVerificationUrl
        ),
        removedContactCardDeclinedRetryEnabled: Boolean(
          rawProfile.removedContactCardDeclinedRetryEnabled ?? baseProfile.removedContactCardDeclinedRetryEnabled
        ),
        removedContactFirstDirectResendEnabled: Boolean(
          rawProfile.removedContactFirstDirectResendEnabled ?? baseProfile.removedContactFirstDirectResendEnabled
        ),
        removedContactFirstResendWaitSeconds: normalizeResendWait(
          rawProfile.removedContactFirstResendWaitSeconds ?? baseProfile.removedContactFirstResendWaitSeconds,
          20
        ),
        removedContactSubsequentResendWaitSeconds: normalizeResendWait(
          rawProfile.removedContactSubsequentResendWaitSeconds ?? baseProfile.removedContactSubsequentResendWaitSeconds,
          25
        ),
        removedContactVerificationResendMaxAttempts: normalizeVerificationResendMax(
          rawProfile.removedContactVerificationResendMaxAttempts ?? baseProfile.removedContactVerificationResendMaxAttempts,
          1
        ),
        removedContactVerificationPollAttempts: normalizeVerificationPollAttempts(
          rawProfile.removedContactVerificationPollAttempts ?? baseProfile.removedContactVerificationPollAttempts,
          6
        ),
        removedContactVerificationPollIntervalSeconds: normalizeVerificationPollInterval(
          rawProfile.removedContactVerificationPollIntervalSeconds ?? baseProfile.removedContactVerificationPollIntervalSeconds,
          5
        ),
      };
    }

    function buildLegacyChatgptSessionReaderProfileFromState(state = {}) {
      return normalizeChatgptSessionReaderProfileValue({
        plusRemovedContactOauthDelaySeconds: state?.plusRemovedContactOauthDelaySeconds,
        chatgptSessionReaderCloudConversionEnabled: state?.chatgptSessionReaderCloudConversionEnabled,
        chatgptSessionReaderCloudConversionApiUrl: state?.chatgptSessionReaderCloudConversionApiUrl,
        chatgptSessionReaderCloudConversionApiKey: state?.chatgptSessionReaderCloudConversionApiKey,
        chatgptSessionReaderConversionProxyUrl: state?.chatgptSessionReaderConversionProxyUrl,
        removedContactVerificationUrl: state?.removedContactVerificationUrl,
        removedContactCardDeclinedRetryEnabled: state?.removedContactCardDeclinedRetryEnabled,
        removedContactFirstDirectResendEnabled: state?.removedContactFirstDirectResendEnabled,
        removedContactFirstResendWaitSeconds: state?.removedContactFirstResendWaitSeconds,
        removedContactSubsequentResendWaitSeconds: state?.removedContactSubsequentResendWaitSeconds,
        removedContactVerificationResendMaxAttempts: state?.removedContactVerificationResendMaxAttempts,
        removedContactVerificationPollAttempts: state?.removedContactVerificationPollAttempts,
        removedContactVerificationPollIntervalSeconds: state?.removedContactVerificationPollIntervalSeconds,
      });
    }

    function normalizeChatgptSessionReaderProfilesValue(value = {}, fallbackState = {}) {
      const rawProfiles = value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
      const legacyProfile = buildLegacyChatgptSessionReaderProfileFromState(fallbackState);
      const hasUsProfile = Object.prototype.hasOwnProperty.call(rawProfiles, modeUs);
      const hasJpProfile = Object.prototype.hasOwnProperty.call(rawProfiles, modeJp);
      const usProfile = hasUsProfile
        ? normalizeChatgptSessionReaderProfileValue(rawProfiles[modeUs])
        : normalizeChatgptSessionReaderProfileValue(legacyProfile);
      const jpProfile = hasJpProfile
        ? normalizeChatgptSessionReaderProfileValue(rawProfiles[modeJp])
        : normalizeChatgptSessionReaderProfileValue(hasUsProfile ? usProfile : legacyProfile);
      return {
        [modeUs]: usProfile,
        [modeJp]: jpProfile,
      };
    }

    function buildChatgptSessionReaderLegacyPatchFromProfile(profile = {}) {
      const normalizedProfile = normalizeChatgptSessionReaderProfileValue(profile);
      return Object.fromEntries(
        profileSettingKeys.map((key) => [key, normalizedProfile[key]])
      );
    }

    function normalizeChatgptSessionReaderStateForUi(state = {}, options = {}) {
      const rawState = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
      const mode = normalizeChatgptSessionReaderModeValue(rawState.chatgptSessionReaderMode);
      const profiles = normalizeChatgptSessionReaderProfilesValue(rawState.chatgptSessionReaderProfiles || {}, rawState);
      const legacyOverrideSource = options?.legacyOverrideSource && typeof options.legacyOverrideSource === 'object'
        ? options.legacyOverrideSource
        : null;
      const hasExplicitLegacyOverrides = Boolean(legacyOverrideSource) && profileSettingKeys.some((key) => (
        Object.prototype.hasOwnProperty.call(legacyOverrideSource, key)
      ));
      const activeProfile = hasExplicitLegacyOverrides
        ? normalizeChatgptSessionReaderProfileValue({
          ...(profiles[mode] || {}),
          ...buildLegacyChatgptSessionReaderProfileFromState({
            ...rawState,
            ...legacyOverrideSource,
          }),
        }, profiles[mode])
        : (profiles[mode] || buildLegacyChatgptSessionReaderProfileFromState(rawState));
      return {
        ...rawState,
        chatgptSessionReaderMode: mode,
        chatgptSessionReaderProfiles: {
          ...profiles,
          [mode]: activeProfile,
        },
        ...buildChatgptSessionReaderLegacyPatchFromProfile(activeProfile),
      };
    }

    return {
      REMOVED_PAYMENT_WORKER_DEFAULT_MAX_ATTEMPTS: removedPaymentWorkerDefaultMaxAttempts,
      REMOVED_PAYMENT_WORKER_MAX_ATTEMPTS_LIMIT: removedPaymentWorkerMaxAttemptsLimit,
      CHATGPT_SESSION_READER_PROFILE_SETTING_KEYS: profileSettingKeys,
      normalizeChatgptSessionReaderModeValue,
      buildDefaultChatgptSessionReaderProfile,
      buildDefaultRemovedPaymentWorkerSettings,
      normalizeRemovedPaymentWorkerMaxAttemptsValue,
      normalizeRemovedPaymentWorkerPaymentLocaleValue,
      normalizeRemovedPaymentWorkerBrowserBackendValue,
      normalizeRemovedPaymentWorkerAdsPowerApiBaseValue,
      normalizeRemovedPaymentWorkerRoxyBrowserApiBaseValue,
      normalizeRemovedPaymentWorkerCheckoutRebuildMaxAttemptsValue,
      normalizeRemovedPaymentWorkerSettingsValue,
      normalizeChatgptSessionReaderProfileValue,
      buildLegacyChatgptSessionReaderProfileFromState,
      normalizeChatgptSessionReaderProfilesValue,
      buildChatgptSessionReaderLegacyPatchFromProfile,
      normalizeChatgptSessionReaderStateForUi,
    };
  }

  return {
    createChatgptSessionReaderSettings,
  };
});
