(function attachSidepanelAutoRunNormalizers(globalScope) {
  function normalizeBoundedInteger(value, fallback, min, max, options = {}) {
    const rawValue = String(value ?? '').trim();
    const fallbackNumber = Number(fallback);
    const hasDefaultFallback = Object.prototype.hasOwnProperty.call(options, 'defaultFallback');
    const fallbackSource = hasDefaultFallback && (
      !Number.isFinite(fallbackNumber) || fallbackNumber < min || fallbackNumber > max
    )
      ? options.defaultFallback
      : fallback;
    const fallbackValue = Math.min(max, Math.max(min, Math.floor(Number(fallbackSource) || 0)));
    if (!rawValue && options.emptyAsFallback !== false) {
      return fallbackValue;
    }

    const numeric = Number(rawValue);
    if (!Number.isFinite(numeric)) {
      return fallbackValue;
    }

    return Math.min(max, Math.max(min, Math.floor(numeric)));
  }

  function createAutoRunNormalizers(config = {}) {
    const {
      autoDelayDefaultMinutes = 30,
      autoDelayMaxMinutes = 1440,
      autoDelayMinMinutes = 1,
      autoRunThreadIntervalDefaultMinutes = 0,
      autoRunThreadIntervalMaxMinutes = 1440,
      autoRunThreadIntervalMinMinutes = 0,
      autoStepDelayDefaultSeconds = 2,
      autoStepDelayMaxSeconds = 600,
      autoStepDelayMinSeconds = 0,
    } = config;

    function normalizeAutoDelayMinutes(value) {
      return normalizeBoundedInteger(value, autoDelayDefaultMinutes, autoDelayMinMinutes, autoDelayMaxMinutes);
    }

    function normalizeAutoRunThreadIntervalMinutes(value) {
      return normalizeBoundedInteger(
        value,
        autoRunThreadIntervalDefaultMinutes,
        autoRunThreadIntervalMinMinutes,
        autoRunThreadIntervalMaxMinutes
      );
    }

    function normalizeAutoStepDelaySeconds(value) {
      return normalizeBoundedInteger(value, autoStepDelayDefaultSeconds, autoStepDelayMinSeconds, autoStepDelayMaxSeconds);
    }

    function normalizePlusRemovedContactOauthDelaySeconds(value) {
      return normalizeBoundedInteger(value, 10, 0, 3600);
    }

    function normalizeRemovedContactResendWaitSeconds(value, fallback = 20) {
      return normalizeBoundedInteger(value, fallback, 0, 300);
    }

    function normalizeRemovedContactVerificationResendMaxAttempts(value, fallback = 1) {
      return normalizeBoundedInteger(value, fallback, 0, 10);
    }

    function normalizeRemovedContactVerificationPollAttempts(value, fallback = 6) {
      return normalizeBoundedInteger(value, fallback, 1, 60, { defaultFallback: 6 });
    }

    function normalizeRemovedContactVerificationPollIntervalSeconds(value, fallback = 5) {
      return normalizeBoundedInteger(value, fallback, 1, 60, { defaultFallback: 5 });
    }

    return {
      normalizeAutoDelayMinutes,
      normalizeAutoRunThreadIntervalMinutes,
      normalizeAutoStepDelaySeconds,
      normalizePlusRemovedContactOauthDelaySeconds,
      normalizeRemovedContactResendWaitSeconds,
      normalizeRemovedContactVerificationPollAttempts,
      normalizeRemovedContactVerificationPollIntervalSeconds,
      normalizeRemovedContactVerificationResendMaxAttempts,
    };
  }

  const api = {
    createAutoRunNormalizers,
    normalizeBoundedInteger,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAutoRunNormalizers = api;
})(typeof window !== 'undefined' ? window : globalThis);
