// sidepanel/account-records-settings-payload.js - Build membership check settings payloads from DOM and state.
(function attachSidepanelAccountRecordsSettingsPayload(globalScope) {
  function createAccountRecordsSettingsPayload(context = {}) {
    const state = context.state || {};
    const dom = context.dom || {};
    const getStoredCdkPoolText = typeof context.getStoredCdkPoolText === 'function'
      ? context.getStoredCdkPoolText
      : () => '';

    function getLatestState() {
      return typeof state.getLatestState === 'function' ? state.getLatestState() : {};
    }

    function readTrimmedDomValue(node, fallback = '') {
      return String(node?.value || fallback || '').trim();
    }

    function getMembershipCheckSettingsPayload() {
      const latest = getLatestState();
      return {
        upiCredentialMembershipCheckTotpApiBaseUrl: readTrimmedDomValue(
          dom.inputUpiCredentialMembershipTotpApiBaseUrl,
          latest?.upiCredentialMembershipCheckTotpApiBaseUrl || 'https://cha.nerver.cc'
        ),
        upiCredentialMembershipCheckTotpLookupKey: readTrimmedDomValue(
          dom.inputUpiCredentialMembershipTotpLookupKey,
          latest?.upiCredentialMembershipCheckTotpLookupKey || ''
        ),
        upiSubscriptionApiBaseUrl: readTrimmedDomValue(
          dom.inputUpiSubscriptionApiBaseUrl,
          latest?.upiSubscriptionApiBaseUrl
            || latest?.upiCredentialMembershipCheckTotpApiBaseUrl
            || 'https://cha.nerver.cc'
        ),
        upiRedeemExternalApiKey: readTrimmedDomValue(
          dom.inputUpiRedeemExternalApiKey,
          latest?.upiRedeemExternalApiKey || latest?.pixRedeemExternalApiKey || ''
        ),
        upiRedeemClientId: readTrimmedDomValue(
          dom.inputUpiRedeemClientId,
          latest?.upiRedeemClientId || latest?.pixRedeemClientId || ''
        ),
        upiRedeemFailedAccountRetryLimit: Math.max(0, Math.min(20, Math.floor(Number(
          dom.inputUpiRedeemFailedAccountRetryLimit?.value
          ?? latest?.upiRedeemFailedAccountRetryLimit
          ?? 3
        ) || 0))),
        cdkPoolText: getStoredCdkPoolText(latest, 'upi'),
        upiRedeemCdkPoolText: getStoredCdkPoolText(latest, 'upi'),
        upiRedeemCdkeyPoolText: getStoredCdkPoolText(latest, 'upi'),
        idealRedeemCdkeyPoolText: getStoredCdkPoolText(latest, 'ideal'),
      };
    }

    return {
      getMembershipCheckSettingsPayload,
    };
  }

  const api = {
    createAccountRecordsSettingsPayload,
  };

  globalScope.SidepanelAccountRecordsSettingsPayload = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
