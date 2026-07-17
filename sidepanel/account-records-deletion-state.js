// sidepanel/account-records-deletion-state.js - Deleted membership row normalization helpers.
(function attachSidepanelAccountRecordsDeletionState(globalScope) {
  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function createAccountRecordsDeletionStateHelpers(context = {}) {
    const normalizeEmail = typeof context.normalizeEmail === 'function'
      ? context.normalizeEmail
      : (value = '') => normalizeText(value).toLowerCase();

    function normalizeUpiCredentialMembershipEmailList(values = []) {
      return Array.from(new Set((Array.isArray(values) ? values : [])
        .map(normalizeEmail)
        .filter(Boolean)));
    }

    function normalizeRedeemPlusDeletedEmailsByChannel(value = {}) {
      const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      return {
        upi: normalizeUpiCredentialMembershipEmailList(source.upi),
        ideal: normalizeUpiCredentialMembershipEmailList(source.ideal),
        pix: normalizeUpiCredentialMembershipEmailList(source.pix),
      };
    }

    function mergeRedeemPlusDeletedEmailsByChannel(...values) {
      const merged = { upi: [], ideal: [], pix: [] };
      values.forEach((value) => {
        const normalized = normalizeRedeemPlusDeletedEmailsByChannel(value);
        merged.upi.push(...normalized.upi);
        merged.ideal.push(...normalized.ideal);
        merged.pix.push(...normalized.pix);
      });
      return {
        upi: normalizeUpiCredentialMembershipEmailList(merged.upi),
        ideal: normalizeUpiCredentialMembershipEmailList(merged.ideal),
        pix: normalizeUpiCredentialMembershipEmailList(merged.pix),
      };
    }

    function buildRedeemPlusDeletedEmailSets(...values) {
      const normalized = mergeRedeemPlusDeletedEmailsByChannel(...values);
      return {
        upi: new Set(normalized.upi),
        ideal: new Set(normalized.ideal),
        pix: new Set(normalized.pix),
      };
    }

    return {
      normalizeUpiCredentialMembershipEmailList,
      normalizeRedeemPlusDeletedEmailsByChannel,
      mergeRedeemPlusDeletedEmailsByChannel,
      buildRedeemPlusDeletedEmailSets,
    };
  }

  const api = {
    createAccountRecordsDeletionStateHelpers,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsDeletionState = api;
})(typeof window !== 'undefined' ? window : globalThis);
