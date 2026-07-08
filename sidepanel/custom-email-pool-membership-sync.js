(function attachSidepanelCustomEmailPoolMembershipSync(globalScope, factory) {
  const api = factory();
  globalScope.SidepanelCustomEmailPoolMembershipSync = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelCustomEmailPoolMembershipSyncModule() {
  function defaultNormalizeEntries(entries = []) {
    return Array.isArray(entries) ? entries : [];
  }

  function defaultNormalizeTrialStatus(value = '') {
    const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (['ineligible', 'not_eligible', 'no_trial', 'trial_ineligible', 'rejected'].includes(normalized)) return 'ineligible';
    if (['eligible', 'trial_eligible', 'ok', 'passed'].includes(normalized)) return 'eligible';
    if (['failed', 'error', 'unknown'].includes(normalized)) return 'failed';
    return '';
  }

  function createCustomEmailPoolMembershipSync(context = {}) {
    const normalizeEntries = typeof context.normalizeEntries === 'function'
      ? context.normalizeEntries
      : defaultNormalizeEntries;
    const normalizeTrialStatus = typeof context.normalizeTrialEligibilityStatus === 'function'
      ? context.normalizeTrialEligibilityStatus
      : defaultNormalizeTrialStatus;
    const now = typeof context.now === 'function' ? context.now : () => Date.now();

    function normalizeEmail(value = '') {
      return String(value || '').trim().toLowerCase();
    }

    function maskAccessToken(token = '') {
      const raw = String(token || '').trim();
      if (!raw) return '';
      if (raw.length <= 16) return `${raw.slice(0, 4)}****${raw.slice(-4)}`;
      return `${raw.slice(0, 8)}****${raw.slice(-6)}`;
    }

    function getCredentialAccessToken(credential = {}) {
      return String(
        credential.accessToken
        || credential.token
        || credential.access_token
        || credential.upiRedeemAccessToken
        || ''
      ).trim();
    }

    function getCredentialTrialStatus(credential = {}) {
      const explicitStatus = normalizeTrialStatus(
        credential.trialEligibilityStatus
        || credential.trialEligibility
        || credential.eligibilityStatus
        || credential.eligibleStatus
        || ''
      );
      if (explicitStatus) return explicitStatus;

      const status = String(credential.status || credential.planType || '').trim().toLowerCase();
      if (status === 'free' && (
        credential.trialEligibilityCheckedAt
        || credential.trialEligibilityReason
        || getCredentialAccessToken(credential)
      )) {
        return 'eligible';
      }
      return '';
    }

    function mergeEntriesWithMembershipResults(entries = [], results = {}) {
      const normalizedEntries = normalizeEntries(entries);
      const resultItems = Array.isArray(results?.items) ? results.items : [];
      if (!normalizedEntries.length || !resultItems.length) {
        return { entries: normalizedEntries, changed: false };
      }

      const credentialsByEmail = new Map();
      for (const item of resultItems) {
        const email = normalizeEmail(item?.email);
        if (!email || credentialsByEmail.has(email)) continue;
        credentialsByEmail.set(email, item);
      }

      let changed = false;
      const nextEntries = normalizedEntries.map((entry) => {
        const credential = credentialsByEmail.get(entry.email);
        if (!credential || getCredentialTrialStatus(credential) !== 'eligible') {
          return entry;
        }

        const accessToken = entry.accessToken || getCredentialAccessToken(credential);
        const trialEligibilityCheckedAt = entry.trialEligibilityCheckedAt
          || String(credential.trialEligibilityCheckedAt || credential.checkedAt || credential.accessTokenUpdatedAt || '').trim();
        const nextEntry = {
          ...entry,
          used: true,
          lastUsedAt: entry.lastUsedAt || Number(credential.lastUsedAt || credential.recordedAt || credential.updatedAt || 0) || now(),
          accessToken,
          accessTokenMasked: entry.accessTokenMasked || credential.accessTokenMasked || maskAccessToken(accessToken),
          accessTokenUpdatedAt: entry.accessTokenUpdatedAt
            || String(credential.accessTokenUpdatedAt || credential.checkedAt || trialEligibilityCheckedAt || '').trim(),
          trialEligibilityStatus: 'eligible',
          trialEligibilityReason: entry.trialEligibilityReason
            || String(credential.trialEligibilityReason || credential.reason || '账号有试用资格。').trim(),
          trialEligibilityReasonCode: entry.trialEligibilityReasonCode
            || String(credential.trialEligibilityReasonCode || '').trim(),
          trialEligibilityCheckedAt,
          trialEligibilityRetryable: false,
          trialEligibilityTransientFailure: false,
          trialEligibilityLastError: '',
        };
        changed = changed || JSON.stringify(entry) !== JSON.stringify(nextEntry);
        return nextEntry;
      });

      return { entries: nextEntries, changed };
    }

    return { mergeEntriesWithMembershipResults };
  }

  return { createCustomEmailPoolMembershipSync };
});
