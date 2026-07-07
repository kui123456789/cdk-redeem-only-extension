(function attachUpiInfoHelperState(globalScope, factory) {
  const api = factory();
  globalScope.SidepanelUpiInfoHelperState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createUpiInfoHelperStateModule() {
  function createUpiInfoHelperState(context = {}) {
    const rootScope = context.rootScope || (typeof window !== 'undefined' ? window : globalThis);

    function getLegacyPayUtils() {
      if (typeof context.legacyPayUtils === 'function') {
        return context.legacyPayUtils() || {};
      }
      return context.legacyPayUtils || rootScope.LegacyPayUtils || {};
    }

    function normalizeUpiInfoAutoModePermissionValue(value) {
      if (typeof value === 'boolean') {
        return value;
      }
      if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
      }
      const normalized = String(value ?? '').trim().toLowerCase();
      if (!normalized) {
        return null;
      }
      if (['true', '1', 'yes', 'y', 'on', 'enabled', 'enable'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'n', 'off', 'disabled', 'disable'].includes(normalized)) {
        return false;
      }
      return null;
    }

    function getUpiInfoAutoModePermissionFromPayload(payload = {}) {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return null;
      }
      for (const key of ['auto_mode_enabled', 'autoModeEnabled', 'auto_enabled', 'autoEnabled']) {
        if (payload[key] !== undefined) {
          return normalizeUpiInfoAutoModePermissionValue(payload[key]);
        }
      }
      if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        return getUpiInfoAutoModePermissionFromPayload(payload.data);
      }
      return null;
    }

    function hasUpiInfoAutoModePermissionField(payload = {}) {
      return getUpiInfoAutoModePermissionFromPayload(payload) !== null;
    }

    function isUpiInfoAutoModePermissionDenied(state = {}) {
      const payloadPermission = getUpiInfoAutoModePermissionFromPayload(state?.legacyPayHelperBalancePayload);
      return payloadPermission === false;
    }

    function normalizeUpiInfoRemainingUsesValue(value) {
      const legacyPayUtils = getLegacyPayUtils();
      if (legacyPayUtils?.normalizeUpiInfoRemainingUses) {
        return legacyPayUtils.normalizeUpiInfoRemainingUses(value);
      }
      if (value === undefined || value === null || String(value).trim() === '') {
        return null;
      }
      const numeric = Number(value);
      return Number.isFinite(numeric) ? Math.max(0, Math.floor(numeric)) : null;
    }

    function getUpiInfoBalanceRemainingUsesFromResponse(response = {}) {
      const legacyPayUtils = getLegacyPayUtils();
      if (legacyPayUtils?.getUpiInfoBalanceRemainingUses) {
        const remaining = legacyPayUtils.getUpiInfoBalanceRemainingUses(response?.data || response?.payload || response);
        if (remaining !== null && remaining !== undefined) {
          return remaining;
        }
      }
      return normalizeUpiInfoRemainingUsesValue(
        response?.remainingUses
        ?? response?.data?.remaining_uses
        ?? response?.data?.remainingUses
        ?? response?.payload?.data?.remaining_uses
        ?? response?.payload?.remaining_uses
        ?? response?.payload?.remainingUses
      );
    }

    function getUpiInfoAutoModeEnabledFromResponse(response = {}) {
      if (typeof response?.autoModeEnabled === 'boolean') {
        return response.autoModeEnabled;
      }
      const legacyPayUtils = getLegacyPayUtils();
      if (legacyPayUtils?.isUpiInfoAutoModeEnabled) {
        return legacyPayUtils.isUpiInfoAutoModeEnabled(response?.data || response?.payload || response);
      }
      return Boolean(
        response?.data?.auto_mode_enabled
        ?? response?.data?.autoModeEnabled
        ?? response?.payload?.data?.auto_mode_enabled
        ?? response?.payload?.auto_mode_enabled
        ?? response?.payload?.autoModeEnabled
      );
    }

    function normalizeUpiInfoOtpChannelValue(value = '') {
      const legacyPayUtils = getLegacyPayUtils();
      if (legacyPayUtils?.normalizeUpiInfoOtpChannel) {
        return legacyPayUtils.normalizeUpiInfoOtpChannel(value);
      }
      return 'whatsapp';
    }

    return {
      normalizeUpiInfoAutoModePermissionValue,
      getUpiInfoAutoModePermissionFromPayload,
      hasUpiInfoAutoModePermissionField,
      isUpiInfoAutoModePermissionDenied,
      normalizeUpiInfoRemainingUsesValue,
      getUpiInfoBalanceRemainingUsesFromResponse,
      getUpiInfoAutoModeEnabledFromResponse,
      normalizeUpiInfoOtpChannelValue,
    };
  }

  return {
    createUpiInfoHelperState,
  };
});
