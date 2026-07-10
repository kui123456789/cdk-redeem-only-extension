(function attachSidepanelSettingsNormalization(globalScope, factory) {
  const api = factory();
  globalScope.SidepanelSettingsNormalization = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelSettingsNormalizationModule() {
  function normalizeCloudflareDomainValue(value = '') {
    let normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return '';
    normalized = normalized.replace(/^@+/, '');
    normalized = normalized.replace(/^https?:\/\//, '');
    normalized = normalized.replace(/\/.*$/, '');
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(normalized)) {
      return '';
    }
    return normalized;
  }

  function normalizeDomainList(values = [], normalizeDomain = normalizeCloudflareDomainValue) {
    const seen = new Set();
    const domains = [];
    for (const value of Array.isArray(values) ? values : []) {
      const normalized = normalizeDomain(value);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      domains.push(normalized);
    }
    return domains;
  }

  function normalizeBaseUrl(value = '') {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) ? raw : `https://${raw}`;
    try {
      const parsed = new URL(candidate);
      parsed.hash = '';
      parsed.search = '';
      const pathname = parsed.pathname === '/' ? '' : parsed.pathname.replace(/\/+$/, '');
      return `${parsed.origin}${pathname}`;
    } catch {
      return '';
    }
  }

  function normalizeReceiveMailbox(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return '';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : '';
  }

  function normalizeLooseDomainValue(value = '') {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/^@+/, '')
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
  }

  function createSettingsNormalization(context = {}) {
    const {
      parseCustomEmailPoolEntryValue = (value = '') => ({ email: String(value || '').trim(), credential: String(value || '').trim(), verificationUrl: '' }),
      normalizeCustomEmailVerificationUrl = (value = '') => String(value || '').trim(),
      cryptoApi = typeof crypto !== 'undefined' ? crypto : null,
      now = () => Date.now(),
      random = () => Math.random(),
      verificationResendCountMin = 0,
      verificationResendCountMax = 20,
    } = context;

    function normalizeVerificationResendCount(value, fallback) {
      const rawValue = String(value ?? '').trim();
      if (!rawValue) {
        return fallback;
      }

      const numeric = Number(rawValue);
      if (!Number.isFinite(numeric)) {
        return fallback;
      }

      return Math.min(
        verificationResendCountMax,
        Math.max(verificationResendCountMin, Math.floor(numeric))
      );
    }

    function splitCustomEmailPoolEntrySource(value = '') {
      return Array.isArray(value)
        ? value
        : String(value || '').split(/[\r\n,，;；]+/);
    }

    function normalizeCustomEmailPoolEntries(value = '') {
      const source = splitCustomEmailPoolEntrySource(value);

      return source
        .map((item) => parseCustomEmailPoolEntryValue(item).email)
        .filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
    }

    function normalizeCustomEmailPoolEntryEmail(value = '') {
      return String(value || '').trim().toLowerCase();
    }

    function createCustomEmailPoolEntryId() {
      if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
        return cryptoApi.randomUUID();
      }
      return `custom-pool-${now()}-${random().toString(36).slice(2, 10)}`;
    }

    function normalizeCustomEmailPoolTrialEligibilityStatus(value = '') {
      const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
      if (['ineligible', 'not_eligible', 'no_trial', 'trial_ineligible', 'rejected'].includes(normalized)) {
        return 'ineligible';
      }
      if (['eligible', 'trial_eligible', 'ok', 'passed'].includes(normalized)) {
        return 'eligible';
      }
      if (['failed', 'error', 'unknown'].includes(normalized)) {
        return 'failed';
      }
      return '';
    }

    function isCustomEmailPoolEntryTrialIneligible(entry = {}) {
      return normalizeCustomEmailPoolTrialEligibilityStatus(entry?.trialEligibilityStatus) === 'ineligible';
    }

    function isCustomEmailPoolEntryRegistrationBlocked(entry = {}) {
      return entry?.registrationBlocked === true;
    }

    function isCustomEmailPoolEntryAvailable(entry = {}) {
      return Boolean(entry?.enabled)
        && !entry?.used
        && !isCustomEmailPoolEntryTrialIneligible(entry)
        && !isCustomEmailPoolEntryRegistrationBlocked(entry);
    }

    function normalizeCustomEmailPoolEntryObjects(value = []) {
      const source = splitCustomEmailPoolEntrySource(value);
      const seenEmails = new Set();
      const entries = [];

      for (const rawEntry of source) {
        const asObject = rawEntry && typeof rawEntry === 'object'
          ? rawEntry
          : { email: rawEntry };
        const parsedEntry = parseCustomEmailPoolEntryValue(asObject.credential || asObject.email || '');
        const email = normalizeCustomEmailPoolEntryEmail(parsedEntry.email || '');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          continue;
        }
        if (seenEmails.has(email)) {
          continue;
        }
        seenEmails.add(email);
        const accessToken = String(asObject.accessToken || asObject.access_token || asObject.upiRedeemAccessToken || '').trim();
        const accessTokenMasked = String(asObject.accessTokenMasked || '').trim()
          || (accessToken
            ? `${accessToken.slice(0, 8)}****${accessToken.slice(-6)}`
            : '');
        const note = String(asObject.note || '').trim();
        const manualSkipped = asObject.manualSkipped === true || note === '手动跳过';
        entries.push({
          id: String(asObject.id || createCustomEmailPoolEntryId()),
          email,
          credential: parsedEntry.verificationUrl ? '' : (parsedEntry.credential || String(asObject.credential || '').trim()),
          verificationUrl: normalizeCustomEmailVerificationUrl(asObject.verificationUrl || asObject.url || parsedEntry.verificationUrl || ''),
          enabled: asObject.enabled !== undefined ? Boolean(asObject.enabled) : true,
          used: Boolean(asObject.used) && (Boolean(accessToken) || manualSkipped),
          manualSkipped,
          note,
          lastUsedAt: Number.isFinite(Number(asObject.lastUsedAt)) ? Number(asObject.lastUsedAt) : 0,
          registrationBlocked: asObject.registrationBlocked === true,
          registrationBlockedReason: String(asObject.registrationBlockedReason || '').trim(),
          registrationBlockedReasonCode: String(asObject.registrationBlockedReasonCode || '').trim(),
          registrationBlockedAt: String(asObject.registrationBlockedAt || '').trim(),
          accessToken,
          accessTokenMasked,
          accessTokenUpdatedAt: String(asObject.accessTokenUpdatedAt || asObject.tokenUpdatedAt || asObject.checkedAt || '').trim(),
          trialEligibilityStatus: normalizeCustomEmailPoolTrialEligibilityStatus(asObject.trialEligibilityStatus),
          trialEligibilityReason: String(asObject.trialEligibilityReason || '').trim(),
          trialEligibilityReasonCode: String(asObject.trialEligibilityReasonCode || '').trim(),
          trialEligibilityCheckedAt: String(asObject.trialEligibilityCheckedAt || '').trim(),
          trialEligibilityRetryable: asObject.trialEligibilityRetryable === true,
          trialEligibilityTransientFailure: asObject.trialEligibilityTransientFailure === true,
          trialEligibilityLastError: String(asObject.trialEligibilityLastError || '').trim(),
        });
      }

      return entries;
    }

    function formatCustomEmailPoolEntryValue(entry = {}) {
      const asObject = entry && typeof entry === 'object'
        ? entry
        : { email: entry };
      const parsedEntry = parseCustomEmailPoolEntryValue(asObject.credential || asObject.email || '');
      const email = normalizeCustomEmailPoolEntryEmail(parsedEntry.email || asObject.email || '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return '';
      }
      const verificationUrl = normalizeCustomEmailVerificationUrl(
        asObject.verificationUrl || asObject.url || parsedEntry.verificationUrl || ''
      );
      if (verificationUrl) {
        return `${email}----${verificationUrl}`;
      }
      const credential = parsedEntry.credential || String(asObject.credential || '').trim();
      return credential || email;
    }

    function normalizeCustomEmailPoolEntryValues(value = []) {
      return normalizeCustomEmailPoolEntryObjects(value)
        .map((entry) => formatCustomEmailPoolEntryValue(entry))
        .filter(Boolean);
    }

    return {
      normalizeVerificationResendCount,
      splitCustomEmailPoolEntrySource,
      normalizeCustomEmailPoolEntries,
      normalizeCustomEmailPoolEntryEmail,
      createCustomEmailPoolEntryId,
      normalizeCustomEmailPoolTrialEligibilityStatus,
      isCustomEmailPoolEntryTrialIneligible,
      isCustomEmailPoolEntryRegistrationBlocked,
      isCustomEmailPoolEntryAvailable,
      normalizeCustomEmailPoolEntryObjects,
      formatCustomEmailPoolEntryValue,
      normalizeCustomEmailPoolEntryValues,
      normalizeCloudflareDomainValue,
      normalizeCloudflareDomains: (values = []) => normalizeDomainList(values, normalizeCloudflareDomainValue),
      normalizeCloudflareTempEmailBaseUrlValue: normalizeBaseUrl,
      normalizeCloudflareTempEmailReceiveMailboxValue: normalizeReceiveMailbox,
      normalizeCloudflareTempEmailDomainValue: normalizeCloudflareDomainValue,
      normalizeCloudflareTempEmailDomains: (values = []) => normalizeDomainList(values, normalizeCloudflareDomainValue),
      normalizeCloudMailBaseUrlValue: normalizeBaseUrl,
      normalizeCloudMailReceiveMailboxValue: normalizeReceiveMailbox,
      normalizeCloudMailDomainValue: normalizeCloudflareDomainValue,
      normalizeMoemailBaseUrlValue: normalizeBaseUrl,
      normalizeMoemailDomainValue: normalizeLooseDomainValue,
      normalizeYydsMailBaseUrlValue: normalizeBaseUrl,
      normalizeYydsMailDomainValue: normalizeLooseDomainValue,
      normalizeFreemailBaseUrlValue: normalizeBaseUrl,
      normalizeFreemailDomainValue: normalizeCloudflareDomainValue,
    };
  }

  return {
    normalizeCloudflareDomainValue,
    normalizeBaseUrl,
    normalizeReceiveMailbox,
    normalizeLooseDomainValue,
    createSettingsNormalization,
  };
});
