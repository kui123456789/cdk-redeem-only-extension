// sidepanel/account-records-cdk-pool-text.js - CDK pool text and usage readers.
(function attachSidepanelAccountRecordsCdkPoolText(globalScope) {
  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function createAccountRecordsCdkPoolTextHelpers(context = {}) {
    const normalizeRedeemChannel = typeof context.normalizeRedeemChannel === 'function'
      ? context.normalizeRedeemChannel
      : (value = '') => {
        const normalized = normalizeText(value).toLowerCase();
        return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
      };

    function getUpiRedeemCdkeyUsage(currentState = {}, channel = 'upi') {
      const normalizedChannel = normalizeRedeemChannel(channel);
      const rawUsage = normalizedChannel === 'ideal'
        ? (currentState?.idealRedeemCdkeyUsage || {})
        : (normalizedChannel === 'pix'
          ? (currentState?.pixChannelRedeemCdkeyUsage || {})
          : (currentState?.cdkUsage
            || currentState?.upiRedeemCdkUsage
            || currentState?.upiRedeemCdkeyUsage
            || currentState?.pixRedeemCdkeyUsage
            || {}));
      return rawUsage && typeof rawUsage === 'object' && !Array.isArray(rawUsage) ? rawUsage : {};
    }

    function getStoredCdkPoolText(currentState = {}, channel = 'upi') {
      const normalizedChannel = normalizeRedeemChannel(channel);
      return String(
        normalizedChannel === 'ideal'
          ? (currentState?.idealRedeemCdkeyPoolText ?? '')
          : (normalizedChannel === 'pix'
            ? (currentState?.pixChannelRedeemCdkeyPoolText ?? '')
            : (currentState?.cdkPoolText
              ?? currentState?.upiRedeemCdkPoolText
              ?? currentState?.upiRedeemCdkeyPoolText
              ?? currentState?.pixRedeemCdkeyPoolText
              ?? ''))
      ).replace(/\r/g, '').trim();
    }

    function parseUpiRedeemCdkeyPoolText(value = '') {
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
        });
    }

    return {
      getUpiRedeemCdkeyUsage,
      getStoredCdkPoolText,
      parseUpiRedeemCdkeyPoolText,
    };
  }

  const api = {
    createAccountRecordsCdkPoolTextHelpers,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsCdkPoolText = api;
})(typeof window !== 'undefined' ? window : globalThis);
