(function attachUpiCredentialMembershipChecker(root, factory) {
  root.MultiPageBackgroundUpiCredentialMembershipChecker = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createUpiCredentialMembershipCheckerModule() {
  const BACKUP_STORAGE_KEY = 'upiAccountCredentialBackups';
  const RESULTS_STORAGE_KEY = 'upiCredentialMembershipCheckResults';
  const DEFAULT_TOTP_API_BASE_URL = 'https://cha.nerver.cc';
  const TOTP_LOOKUP_TIMEOUT_MS = 20000;
  const DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT = 3;
  const REDEEM_CHANNEL_FAILURE_LIMIT = 3;
  const REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS = 24 * 60 * 60 * 1000;
  const REDEEM_GROUP_CONTINUATION_IDLE_WAIT_MS = 5000;
  const REDEEM_GROUP_CONTINUATION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
  const UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX = 20;
  const CHATGPT_ENTRY_URL = 'https://chatgpt.com/';
  const CHATGPT_LOGIN_URL = 'https://chatgpt.com/auth/login';
  const AUTH_SOURCE = 'openai-auth';
  const MEMBERSHIP_STOP_ERROR_CODE = 'UPI_CREDENTIAL_MEMBERSHIP_STOPPED';
  const SESSION_ACCOUNT_MISMATCH_ERROR_CODE = 'UPI_CREDENTIAL_SESSION_ACCOUNT_MISMATCH';
  const PAID_PLANS = new Set(['plus', 'pro', 'team']);
  const FLOW_STAGE_KEYS = new Set([
    'import',
    'open-chatgpt',
    'login',
    'passkey-login',
    'totp',
    'token',
    'subscription-check',
    'upi-redeem-plus',
    'confirm-plus',
  ]);
  const COOKIE_CLEAR_DOMAINS = [
    'chatgpt.com',
    'chat.openai.com',
    'openai.com',
    'auth.openai.com',
    'auth0.openai.com',
    'accounts.openai.com',
  ];
  const COOKIE_CLEAR_ORIGINS = [
    'https://chatgpt.com',
    'https://chat.openai.com',
    'https://openai.com',
    'https://auth.openai.com',
    'https://auth0.openai.com',
    'https://accounts.openai.com',
  ];

  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  const now = Date.now;
  function getPasskeyApiLoginHelper() {
    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    return rootScope.MultiPagePasskeyApiLoginExecutor || {};
  }
  const { buildPasskeyExportMarker, buildPasskeyNumericMetadataPatch, getPasskeyCredentialIdFromExportMarker, hasPasskeyCredential, isPasskeyExportMarker, isResultItemPasskeyExportableForStatus, parsePasskeyExportMarker } = getPasskeyApiLoginHelper();
  function getMembershipLoginSessionExecutorModule() {
    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    if (rootScope.MultiPageMembershipLoginSessionExecutor) {
      return rootScope.MultiPageMembershipLoginSessionExecutor;
    }
    if (typeof require === 'function') {
      return require('./membership/login-session-executor.js');
    }
    return {};
  }

  const {
    getChatGptSessionAccessToken,
    hasChatGptSessionPayload,
  } = getMembershipLoginSessionExecutorModule();
  function normalizeBoolean(value) {
    if (value === true) return true;
    if (value === false || value === null || value === undefined) return false;
    return ['1', 'true', 'yes', 'y', 'ok', 'active', 'success'].includes(
      normalizeString(value).toLowerCase()
    );
  }

  function normalizeFlowStage(value = '') {
    const stage = normalizeString(value).toLowerCase();
    return FLOW_STAGE_KEYS.has(stage) ? stage : '';
  }
  function normalizeEmail(value = '') {
    return normalizeString(value).toLowerCase();
  }

  function normalizeEmailList(values = []) {
    return Array.from(new Set((Array.isArray(values) ? values : [])
      .map(normalizeEmail)
      .filter(Boolean)));
  }

  function getMembershipResultStateHelpers() {
    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    if (rootScope.MultiPageMembershipResultState) {
      return rootScope.MultiPageMembershipResultState;
    }
    if (typeof require === 'function') {
      return require('./membership/result-state.js');
    }
    return {};
  }

  function getMembershipResultStateHelper(name = '') {
    const helper = getMembershipResultStateHelpers()[name];
    if (typeof helper !== 'function') {
      throw new Error(`Membership result-state helper module is not loaded: ${name}.`);
    }
    return helper;
  }

  function normalizeRedeemPlusDeletedEmailsByChannel(value = {}) {
    return getMembershipResultStateHelper('normalizeRedeemPlusDeletedEmailsByChannel')(value);
  }

  function addRedeemPlusDeletedEmailsByChannel(value = {}, emails = new Set(), channels = []) {
    return getMembershipResultStateHelper('addRedeemPlusDeletedEmailsByChannel')(value, emails, channels);
  }

  function buildRedeemDeletionStatePatch(source = {}) {
    return getMembershipResultStateHelper('buildRedeemDeletionStatePatch')(source);
  }

  function mergeRedeemDeletionStateForSave(previous = {}, next = {}) {
    return getMembershipResultStateHelper('mergeRedeemDeletionStateForSave')(previous, next);
  }

  function normalizeResultsTimestamp(value = '') {
    const timestamp = Date.parse(normalizeString(value));
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function normalizeNo2faFreeVerificationUrlForExport(value = '') {
    const raw = normalizeString(value);
    if (!/^https?:\/\//i.test(raw)) {
      return raw;
    }
    try {
      const url = new URL(raw);
      if (
        url.hostname.toLowerCase() === 'assurivo.com'
        && ['/console/feed.php', '/console/open.php'].includes(url.pathname)
      ) {
        url.pathname = '/console/open.php';
        return url.toString();
      }
      return url.toString();
    } catch {
      return raw;
    }
  }

  function normalizeNo2faFreeExportTimestamp(value = '', fallback = 0) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return Math.floor(numeric > 1000000000000 ? numeric / 1000 : numeric);
    }
    const parsed = Date.parse(normalizeString(value));
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed / 1000);
    }
    const fallbackNumber = Number(fallback);
    if (Number.isFinite(fallbackNumber) && fallbackNumber > 0) {
      return Math.floor(fallbackNumber > 1000000000000 ? fallbackNumber / 1000 : fallbackNumber);
    }
    return Math.floor(Date.now() / 1000);
  }

  function decodeJwtPayload(token = '') {
    const rawPayload = normalizeString(token).split('.')[1] || '';
    if (!rawPayload) {
      return null;
    }
    try {
      const padded = rawPayload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(rawPayload.length / 4) * 4, '=');
      const json = typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  function getAccessTokenIssuedAtSeconds(token = '') {
    const payload = decodeJwtPayload(token);
    const issuedAt = Number(payload?.iat);
    return Number.isFinite(issuedAt) && issuedAt > 0 ? normalizeNo2faFreeExportTimestamp(issuedAt, 0) : 0;
  }

  function getNo2faFreeExportTimestamp(item = {}) {
    const accessTokenIssuedAt = getAccessTokenIssuedAtSeconds(item.accessToken);
    if (accessTokenIssuedAt > 0) {
      return accessTokenIssuedAt;
    }
    return normalizeNo2faFreeExportTimestamp(
      item.recordedAt,
      Date.parse(item.trialEligibilityCheckedAt || item.checkedAt || item.accessTokenUpdatedAt || '')
    );
  }

  function formatNo2faFreeExportTime(timestampSeconds = 0) {
    const seconds = normalizeNo2faFreeExportTimestamp(timestampSeconds);
    const date = new Date((seconds * 1000) + (8 * 60 * 60 * 1000));
    const pad = (value) => String(value).padStart(2, '0');
    return [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate()),
    ].join('-') + ' ' + [
      pad(date.getUTCHours()),
      pad(date.getUTCMinutes()),
      pad(date.getUTCSeconds()),
    ].join(':');
  }

  function mergeCredentialAuthMaterial(primary = {}, fallback = {}) {
    const target = primary && typeof primary === 'object' && !Array.isArray(primary) ? { ...primary } : {};
    const source = fallback && typeof fallback === 'object' && !Array.isArray(fallback) ? fallback : {};
    const sourcePassword = normalizeString(source.password || source.gptPassword);
    if (!normalizeString(target.password || target.gptPassword) && sourcePassword) {
      target.password = sourcePassword;
      target.gptPassword = normalizeString(source.gptPassword || source.password) || sourcePassword;
    } else if (!normalizeString(target.gptPassword) && normalizeString(target.password)) {
      target.gptPassword = normalizeString(target.password);
    }

    const sourceTotp = normalizeTotpSecret(source.totpMfaSecret || source.totpSecret);
    if (!normalizeTotpSecret(target.totpMfaSecret || target.totpSecret) && sourceTotp) {
      target.totpMfaSecret = sourceTotp;
      target.twoFactorEnabled = true;
      target.no2faFreeRoute = false;
    }

    const sourcePasskeyCredentialId = normalizeString(source.passkeyCredentialId || source.credentialId || source.credential_id);
    const sourceHasPasskey = source.passkeyEnabled === true || Boolean(sourcePasskeyCredentialId);
    if (sourceHasPasskey) {
      const targetPasskeyCredentialId = normalizeString(target.passkeyCredentialId || target.credentialId || target.credential_id);
      target.passkeyEnabled = true; target.passkeyCredentialId = targetPasskeyCredentialId || sourcePasskeyCredentialId;
      target.passkeyEnabledAt = normalizeString(target.passkeyEnabledAt || source.passkeyEnabledAt);
      target.passkeyFactorId = normalizeString(target.passkeyFactorId || source.passkeyFactorId || source.factorId || source.factor_id);
      target.passkeyRpId = normalizeString(target.passkeyRpId || source.passkeyRpId || source.rpId || source.rp_id);
      target.passkeyUserHandle = normalizeString(target.passkeyUserHandle || source.passkeyUserHandle || source.userHandle || source.user_handle);
      if (!target.passkeyPrivateJwk && source.passkeyPrivateJwk && typeof source.passkeyPrivateJwk === 'object' && !Array.isArray(source.passkeyPrivateJwk)) {
        target.passkeyPrivateJwk = source.passkeyPrivateJwk;
      }
      target.passkeyPublicKeyCose = normalizeString(target.passkeyPublicKeyCose || source.passkeyPublicKeyCose || source.publicKeyCose || source.public_key_cose);
      Object.assign(target, buildPasskeyNumericMetadataPatch(target, source));
      target.passkeyApiPersisted = target.passkeyApiPersisted === true || source.passkeyApiPersisted === true || source.persisted === true;
      target.twoFactorEnabled = true;
      target.no2faFreeRoute = false;
    }

    if (!normalizeString(target.accessToken || target.token || target.access_token) && normalizeString(source.accessToken || source.token || source.access_token || source.upiRedeemAccessToken)) {
      target.accessToken = normalizeString(source.accessToken || source.token || source.access_token || source.upiRedeemAccessToken);
      target.accessTokenUpdatedAt = normalizeString(source.accessTokenUpdatedAt || source.checkedAt || target.accessTokenUpdatedAt);
      target.checkedAt = normalizeString(target.checkedAt || source.checkedAt || source.accessTokenUpdatedAt);
    }
    if (!normalizeString(target.verificationUrl || target.emailVerificationUrl || target.url) && normalizeString(source.verificationUrl || source.emailVerificationUrl || source.url)) {
      target.verificationUrl = normalizeString(source.verificationUrl || source.emailVerificationUrl || source.url);
    }
    if (!Math.floor(Number(target.recordedAt || target.no2faFreeRecordedAt) || 0) && Math.floor(Number(source.recordedAt || source.no2faFreeRecordedAt) || 0)) {
      target.recordedAt = Math.floor(Number(source.recordedAt || source.no2faFreeRecordedAt) || 0);
    }
    return target;
  }

  function getResultItemUpdatedAt(item = {}) {
    return Math.max(
      0,
      normalizeResultsTimestamp(item?.updatedAt),
      normalizeResultsTimestamp(item?.checkedAt),
      normalizeResultsTimestamp(item?.trialEligibilityCheckedAt),
      normalizeResultsTimestamp(item?.accessTokenUpdatedAt),
      normalizeResultsTimestamp(item?.redeemAttemptedAt),
      normalizeResultsTimestamp(item?.redeemLastFailedAt),
      normalizeResultsTimestamp(item?.redeemSuccessAt)
    );
  }

  function mergeFreshMissingResultItems(previousPayload = {}, nextPayload = {}) {
    const previousItems = Array.isArray(previousPayload?.items) ? previousPayload.items : [];
    const nextItems = Array.isArray(nextPayload?.items) ? nextPayload.items : [];
    if (!previousItems.length) {
      return nextPayload;
    }
    const deletedEmailSet = new Set(normalizeEmailList(nextPayload?.redeemAutoDeletedEmails));
    const nextEmailSet = new Set(nextItems.map((item) => normalizeEmail(item?.email)).filter(Boolean));
    const nextUpdatedAt = normalizeResultsTimestamp(nextPayload?.updatedAt);
    const previousUpdatedAt = normalizeResultsTimestamp(previousPayload?.updatedAt);
    const recoveredItems = [];
    previousItems.forEach((item) => {
      const email = normalizeEmail(item?.email);
      if (!email || nextEmailSet.has(email) || deletedEmailSet.has(email)) {
        return;
      }
      const itemUpdatedAt = getResultItemUpdatedAt(item);
      if (previousUpdatedAt > nextUpdatedAt || itemUpdatedAt >= nextUpdatedAt) {
        recoveredItems.push(item);
        nextEmailSet.add(email);
      }
    });
    if (!recoveredItems.length) {
      return nextPayload;
    }
    const items = [...nextItems, ...recoveredItems].map((item) => normalizeResultItem(item));
    return normalizeResultsPayload({
      ...nextPayload,
      items,
      total: Math.max(
        Math.floor(Number(nextPayload.total) || 0),
        Math.floor(Number(previousPayload.total) || 0),
        items.length
      ),
      completed: Math.max(
        Math.floor(Number(nextPayload.completed) || 0),
        Math.floor(Number(previousPayload.completed) || 0),
        items.length
      ),
    });
  }

  function normalizeRetryCount(value = 0) {
    return Math.max(0, Math.floor(Number(value) || 0));
  }

  function normalizeTotpSecret(value = '') {
    return normalizeString(value).replace(/\s+/g, '').toUpperCase();
  }

  function normalizePlanType(value = '') {
    const normalized = normalizeString(value).toLowerCase().replace(/[\s-]+/g, '_');
    if (normalized.includes('team')) return 'team';
    if (normalized.includes('pro')) return 'pro';
    if (normalized.includes('plus')) return 'plus';
    if (normalized.includes('free')) return 'free';
    return normalized;
  }

    function normalizeVerificationKind(value = '') {
      const normalized = normalizeString(value).toLowerCase().replace(/[\s-]+/g, '_');
      if (['totp', 'mfa', '2fa', 'two_factor', 'authenticator'].includes(normalized)) return 'totp';
      if (normalized.includes('email') || normalized.includes('mail')) return 'email';
      return normalized || 'unknown';
    }

  function isPaidPlanType(value = '') {
    return PAID_PLANS.has(normalizePlanType(value));
  }

  function normalizeTotpApiBaseUrl(value = '') {
    return normalizeString(value || DEFAULT_TOTP_API_BASE_URL)
      .replace(/#.*$/g, '')
      .replace(/\/+$/g, '')
      .replace(/\/api\/v1\/totp\/(?:enable|lookup|code)$/i, '')
      .replace(/\/api$/i, '')
      .replace(/\/+$/g, '')
      || DEFAULT_TOTP_API_BASE_URL;
  }

  const CDK_STATE_KEY_ALIASES = Object.freeze({
    cdkPoolText: ['cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText'],
    upiRedeemCdkPoolText: ['upiRedeemCdkPoolText', 'cdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText'],
    upiRedeemCdkeyPoolText: ['upiRedeemCdkeyPoolText', 'cdkPoolText', 'upiRedeemCdkPoolText', 'pixRedeemCdkeyPoolText'],
    pixRedeemCdkeyPoolText: ['pixRedeemCdkeyPoolText', 'cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText'],
    cdkUsage: ['cdkUsage', 'upiRedeemCdkUsage', 'upiRedeemCdkeyUsage', 'pixRedeemCdkeyUsage'],
    upiRedeemCdkUsage: ['upiRedeemCdkUsage', 'cdkUsage', 'upiRedeemCdkeyUsage', 'pixRedeemCdkeyUsage'],
    upiRedeemCdkeyUsage: ['upiRedeemCdkeyUsage', 'cdkUsage', 'upiRedeemCdkUsage', 'pixRedeemCdkeyUsage'],
    pixRedeemCdkeyUsage: ['pixRedeemCdkeyUsage', 'cdkUsage', 'upiRedeemCdkUsage', 'upiRedeemCdkeyUsage'],
  });

  function getRedeemCdkeyUsageHelpers() {
    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    return rootScope.MultiPageRedeemCdkeyUsage || {};
  }

  function getUpiRedeemStateValue(state = {}, key = '') {
    const helper = getRedeemCdkeyUsageHelpers().getUpiRedeemStateValue;
    if (typeof helper === 'function') {
      return helper(state, key);
    }
    const normalizedKey = normalizeString(key);
    if (!normalizedKey) return undefined;
    if (state?.[normalizedKey] !== undefined) return state[normalizedKey];
    const aliases = CDK_STATE_KEY_ALIASES[normalizedKey] || [];
    for (const alias of aliases) {
      if (state?.[alias] !== undefined) return state[alias];
    }
    const legacyKey = normalizedKey.replace(/^upiRedeem/, 'pixRedeem');
    return legacyKey === normalizedKey ? undefined : state?.[legacyKey];
  }

  function getRedeemChannelStateHelpers() {
    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    return rootScope.MultiPageRedeemChannelState || {};
  }

  function normalizeRedeemChannel(value = '') {
    const helper = getRedeemChannelStateHelpers().normalizeRedeemChannel;
    if (typeof helper === 'function') {
      return helper(value);
    }
    return normalizeString(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
  }

  function getRedeemChannelLabel(channel = 'upi') {
    return normalizeRedeemChannel(channel) === 'ideal' ? 'IDEAL' : 'UPI';
  }

  function getMembershipServiceModule(globalName = '', requirePath = '') {
    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    if (globalName && rootScope[globalName]) {
      return rootScope[globalName];
    }
    if (requirePath && typeof require === 'function') {
      return require(requirePath);
    }
    return {};
  }

  function getMembershipTrialEligibilityServiceModule() {
    return getMembershipServiceModule('MultiPageTrialEligibilityService', './membership/trial-eligibility-service.js');
  }

  function getMembershipResultSyncModule() {
    return getMembershipServiceModule('MultiPageMembershipResultSync', './membership/membership-result-sync.js');
  }

  function getMembershipAccessTokenSupplementServiceModule() {
    return getMembershipServiceModule('MultiPageAccessTokenSupplementService', './membership/access-token-supplement-service.js');
  }

  function getMembershipFreePoolServiceModule() {
    return getMembershipServiceModule('MultiPageFreePoolService', './membership/free-pool-service.js');
  }

  function getMembershipRedeemCandidateServiceModule() {
    return getMembershipServiceModule('MultiPageRedeemCandidateService', './membership/redeem-candidate-service.js');
  }

  function getMembershipCredentialPoolServiceModule() {
    return getMembershipServiceModule('MultiPageMembershipCredentialPoolService', './membership/credential-pool-service.js');
  }

  function getMembershipImportExportServiceModule() {
    return getMembershipServiceModule('MultiPageMembershipImportExportService', './membership/import-export-service.js');
  }

  function getMembershipPlusVerificationServiceModule() {
    return getMembershipServiceModule('MultiPageMembershipPlusVerificationService', './membership/plus-verification-service.js');
  }

  function getMembershipFailedRedeemRetryServiceModule() {
    return getMembershipServiceModule('MultiPageMembershipFailedRedeemRetryService', './membership/failed-redeem-retry-service.js');
  }

  function getMembershipRedeemServiceModule() {
    return getMembershipServiceModule('MultiPageMembershipRedeemService', './membership/redeem-service.js');
  }

  function getMembershipResultsStoreHelpers() {
    return (typeof self !== 'undefined' ? self : globalThis).MultiPageMembershipResultsStore || {};
  }

  function getMembershipAccessTokenRefreshHelpers() {
    return (typeof self !== 'undefined' ? self : globalThis).MultiPageMembershipAccessTokenRefresh || {};
  }

  function getMembershipAccessTokenRefreshHelper(name = '') {
    const helper = getMembershipAccessTokenRefreshHelpers()[name];
    if (typeof helper !== 'function') {
      throw new Error(`Membership access-token refresh helper module is not loaded: ${name}.`);
    }
    return helper;
  }

  function isNonRetryableUpiRedeemRetryError(message = '') {
    return getMembershipAccessTokenRefreshHelper('isNonRetryableUpiRedeemRetryError')(message);
  }

  function isAccessTokenInvalidMembershipError(error) {
    return getMembershipAccessTokenRefreshHelper('isAccessTokenInvalidMembershipError')(error);
  }

  function buildMissingAccessTokenRefreshMaterialReason(credential = {}) {
    return getMembershipAccessTokenRefreshHelper('buildMissingAccessTokenRefreshMaterialReason')(credential);
  }

  function isPreSubmitUpiRedeemBlockedReason(message = '') {
    return getMembershipAccessTokenRefreshHelper('isPreSubmitUpiRedeemBlockedReason')(message);
  }

  function isPreSubmitUpiRedeemBlockedResultItem(item = {}) {
    return getMembershipAccessTokenRefreshHelper('isPreSubmitUpiRedeemBlockedResultItem')(item);
  }

  const trialEligibilityHelperServiceFactory = getMembershipTrialEligibilityServiceModule().createTrialEligibilityService;
  const trialEligibilityHelperService = typeof trialEligibilityHelperServiceFactory === 'function'
    ? trialEligibilityHelperServiceFactory({ normalizeRedeemChannel, normalizeString, getErrorMessage: (error) => error?.message || String(error || '未知错误') })
    : null;

  function requireTrialEligibilityHelperService() {
    if (!trialEligibilityHelperService) {
      throw new Error('Membership trial eligibility service module is not loaded.');
    }
    return trialEligibilityHelperService;
  }

  function isTrialEligibilityChannelAllowed(item = {}, channel = 'upi') {
    return requireTrialEligibilityHelperService().isTrialEligibilityChannelAllowed(item, channel);
  }

  function normalizeTrialEligibilityApiItem(item = {}) {
    return requireTrialEligibilityHelperService().normalizeTrialEligibilityApiItem(item);
  }

  function isTrialEligibilityAccountIneligibleDecision(decision = {}) {
    return requireTrialEligibilityHelperService().isTrialEligibilityAccountIneligibleDecision(decision);
  }

  function buildTrialEligibilityResultPatch(decision = {}) {
    return requireTrialEligibilityHelperService().buildTrialEligibilityResultPatch(decision);
  }

  function isUpiTrialIneligibleError(error) {
    return requireTrialEligibilityHelperService().isUpiTrialIneligibleError(error);
  }

  const redeemCandidateServiceFactory = getMembershipRedeemCandidateServiceModule().createRedeemCandidateService;
  const redeemCandidateService = typeof redeemCandidateServiceFactory === 'function'
    ? redeemCandidateServiceFactory({
      getRedeemCdkeyUsageHelpers,
      getRedeemChannelStateHelpers,
      getUpiRedeemStateValue,
      isNonRetryableUpiRedeemRetryError,
      isPreSubmitUpiRedeemBlockedResultItem,
      isTrialEligibilityChannelAllowed,
      normalizeBoolean,
      normalizeEmail,
      normalizeResultItem,
      normalizeRetryCount,
      normalizeString,
      now,
    })
    : null;

  function requireRedeemCandidateService() {
    if (!redeemCandidateService) {
      throw new Error('Membership redeem candidate service module is not loaded.');
    }
    return redeemCandidateService;
  }

  function getRedeemCandidateHelper(name = '') {
    const helper = requireRedeemCandidateService()[name];
    if (typeof helper !== 'function') {
      throw new Error(`Membership redeem candidate helper is not loaded: ${name}.`);
    }
    return helper;
  }

  function getRedeemChannelFailureField(channel = 'upi') {
    return getRedeemCandidateHelper('getRedeemChannelFailureField')(channel);
  }

  function getRedeemChannelFailureCount(item = {}, channel = 'upi') {
    return getRedeemCandidateHelper('getRedeemChannelFailureCount')(item, channel);
  }

  function getRedeemChannelDailyLimitBlockedAtField(channel = 'upi') {
    return getRedeemCandidateHelper('getRedeemChannelDailyLimitBlockedAtField')(channel);
  }

  function getRedeemChannelDailyLimitBlockedUntilField(channel = 'upi') {
    return getRedeemCandidateHelper('getRedeemChannelDailyLimitBlockedUntilField')(channel);
  }

  function getRedeemChannelDailyLimitReasonField(channel = 'upi') {
    return getRedeemCandidateHelper('getRedeemChannelDailyLimitReasonField')(channel);
  }

  function isRedeemChannelDailyLimitReason(message = '') {
    return getRedeemCandidateHelper('isRedeemChannelDailyLimitReason')(message);
  }

  function isRedeemCrossRegionPaymentUnavailableReason(message = '') {
    return getRedeemCandidateHelper('isRedeemCrossRegionPaymentUnavailableReason')(message);
  }

  function buildRedeemChannelDailyLimitPatch(channel = 'upi', reason = '', failedAt = '') {
    return getRedeemCandidateHelper('buildRedeemChannelDailyLimitPatch')(channel, reason, failedAt);
  }

  function isRedeemChannelDailyLimitBlocked(item = {}, channel = 'upi') {
    return getRedeemCandidateHelper('isRedeemChannelDailyLimitBlocked')(item, channel);
  }

  function isRedeemAccountLocked(item = {}) {
    return getRedeemCandidateHelper('isRedeemAccountLocked')(item);
  }

  function getRedeemLockReason(item = {}) {
    return getRedeemCandidateHelper('getRedeemLockReason')(item);
  }

  function buildRedeemAccountUnlockedPatch() {
    return getRedeemCandidateHelper('buildRedeemAccountUnlockedPatch')();
  }

  function buildRedeemChannelFailurePatch(item = {}, channel = 'upi', options = {}) {
    return getRedeemCandidateHelper('buildRedeemChannelFailurePatch')(item, channel, options);
  }

  function shouldRedeemItemUseChannel(item = {}, channel = 'upi') {
    return getRedeemCandidateHelper('shouldRedeemItemUseChannel')(item, channel);
  }

  function getRedeemChannelPoolText(state = {}, channel = 'upi') {
    return getRedeemCandidateHelper('getRedeemChannelPoolText')(state, channel);
  }

  function getRedeemChannelUsage(state = {}, channel = 'upi') {
    return getRedeemCandidateHelper('getRedeemChannelUsage')(state, channel);
  }

  function buildRedeemChannelUsageUpdates(channel = 'upi', usage = {}) {
    return getRedeemCandidateHelper('buildRedeemChannelUsageUpdates')(channel, usage);
  }

  function parseUpiRedeemCdkeyPoolText(value = '') {
    return getRedeemCandidateHelper('parseUpiRedeemCdkeyPoolText')(value);
  }

  function normalizeUpiRedeemCdkeyUsage(rawUsage = {}) {
    return getRedeemCandidateHelper('normalizeUpiRedeemCdkeyUsage')(rawUsage);
  }

  function getUpiRedeemCdkeyUsageEntryEmail(entry = {}) {
    return getRedeemCandidateHelper('getUpiRedeemCdkeyUsageEntryEmail')(entry);
  }

  function isSuccessfulUpiRedeemCdkeyUsageEntry(entry = {}) {
    return getRedeemCandidateHelper('isSuccessfulUpiRedeemCdkeyUsageEntry')(entry);
  }

  function shouldClearUpiRedeemCdkeyUsageAccountBinding(entry = {}, options = {}) {
    return getRedeemCandidateHelper('shouldClearUpiRedeemCdkeyUsageAccountBinding')(entry, options);
  }

  function clearUpiRedeemCdkeyUsageAccountBindings(usage = {}, emailSet = new Set(), options = {}) {
    return getRedeemCandidateHelper('clearUpiRedeemCdkeyUsageAccountBindings')(usage, emailSet, options);
  }

  function isActiveUpiRedeemRemoteStatus(status = '') {
    return getRedeemCandidateHelper('isActiveUpiRedeemRemoteStatus')(status);
  }

  function normalizeUpiRedeemRemoteStatus(status = '') {
    return getRedeemCandidateHelper('normalizeUpiRedeemRemoteStatus')(status);
  }

  function isSuccessfulUpiRedeemRemoteStatus(status = '') {
    return getRedeemCandidateHelper('isSuccessfulUpiRedeemRemoteStatus')(status);
  }

  function isRetryableUpiRedeemRemoteStatus(status = '') {
    return getRedeemCandidateHelper('isRetryableUpiRedeemRemoteStatus')(status);
  }

  function isSelectableUpiRedeemCdkeyUsageEntry(entry = {}) {
    return getRedeemCandidateHelper('isSelectableUpiRedeemCdkeyUsageEntry')(entry);
  }

  function isRecoverableUpiRedeemCdkeyUsageEntry(entry = {}) {
    return getRedeemCandidateHelper('isRecoverableUpiRedeemCdkeyUsageEntry')(entry);
  }

  function mergeUpiRedeemCdkeysWithRecoverableUsage(cdkeys = [], usage = {}) {
    return getRedeemCandidateHelper('mergeUpiRedeemCdkeysWithRecoverableUsage')(cdkeys, usage);
  }

  function countAvailableUpiRedeemCdkeys(state = {}, channel = 'upi') {
    return getRedeemCandidateHelper('countAvailableUpiRedeemCdkeys')(state, channel);
  }

  function normalizeFailedAccountRetryLimit(value, fallback = DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT) {
    return getRedeemCandidateHelper('normalizeFailedAccountRetryLimit')(value, fallback);
  }

  function normalizeRedeemConfiguredRoundCount(value, fallback = DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT) {
    return getRedeemCandidateHelper('normalizeRedeemConfiguredRoundCount')(value, fallback);
  }

  function getRedeemTotalRoundLimit(configuredRoundCount = 0) {
    return getRedeemCandidateHelper('getRedeemTotalRoundLimit')(configuredRoundCount);
  }

  function getRedeemRoundLabel(roundNumber = 1, totalRoundLimit = 1) {
    return getRedeemCandidateHelper('getRedeemRoundLabel')(roundNumber, totalRoundLimit);
  }

  function getAvailableUpiRedeemCdkeys(state = {}, channel = 'upi') {
    return getRedeemCandidateHelper('getAvailableUpiRedeemCdkeys')(state, channel);
  }

  function pickRandomUpiRedeemCdkey(cdkeys = []) {
    return getRedeemCandidateHelper('pickRandomUpiRedeemCdkey')(cdkeys);
  }

  function isRetryableUpiRedeemRoundResultItem(item = {}, totalRoundLimit = 1, channel = 'upi') {
    return getRedeemCandidateHelper('isRetryableUpiRedeemRoundResultItem')(item, totalRoundLimit, channel);
  }

  function isRedeemTerminalResultItem(item = {}) {
    return getRedeemCandidateHelper('isRedeemTerminalResultItem')(item);
  }

  function filterRedeemableCredentialsForCurrentResults(credentials = [], results = {}) {
    return getRedeemCandidateHelper('filterRedeemableCredentialsForCurrentResults')(credentials, results);
  }

  function isAutoContinuationPendingRedeemItem(item = {}) {
    return getRedeemCandidateHelper('isAutoContinuationPendingRedeemItem')(item);
  }

  function hasPriorUpiRedeemAttempt(item = {}) {
    return getRedeemCandidateHelper('hasPriorUpiRedeemAttempt')(item);
  }

  function buildAutoContinuationRedeemCandidates(items = [], totalRoundLimit = 1, targetEmail = '', channel = 'upi', options = {}) {
    return getRedeemCandidateHelper('buildAutoContinuationRedeemCandidates')(items, totalRoundLimit, targetEmail, channel, options);
  }

  function decodeBase32Secret(secret = '') {
    const normalized = normalizeTotpSecret(secret).replace(/=+$/g, '');
    if (!normalized) {
      throw new Error('TOTP secret 为空。');
    }
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    const bytes = [];
    for (const char of normalized) {
      const index = alphabet.indexOf(char);
      if (index < 0) {
        throw new Error('TOTP secret 不是有效的 Base32 字符串。');
      }
      value = (value << 5) | index;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return new Uint8Array(bytes);
  }

  function buildCounterBytes(counter) {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    const safeCounter = Math.max(0, Math.floor(Number(counter) || 0));
    const high = Math.floor(safeCounter / 0x100000000);
    const low = safeCounter >>> 0;
    view.setUint32(0, high, false);
    view.setUint32(4, low, false);
    return new Uint8Array(buffer);
  }

  async function hmacSha1(keyBytes, messageBytes) {
    const subtle = globalThis.crypto?.subtle;
    if (subtle?.importKey && subtle?.sign) {
      const cryptoKey = await subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );
      return new Uint8Array(await subtle.sign('HMAC', cryptoKey, messageBytes));
    }

    if (typeof require === 'function') {
      const nodeCrypto = require('node:crypto');
      return new Uint8Array(nodeCrypto.createHmac('sha1', Buffer.from(keyBytes)).update(Buffer.from(messageBytes)).digest());
    }
    throw new Error('当前环境不支持生成 TOTP 验证码。');
  }

  async function generateTotpCode(secret = '', options = {}) {
    const period = Math.max(1, Math.floor(Number(options.period) || 30));
    const digits = Math.max(1, Math.floor(Number(options.digits) || 6));
    const keyBytes = decodeBase32Secret(secret);
    const timestampSeconds = Math.floor(Number(options.forTime ?? (Date.now() / 1000)) || 0);
    const counterBytes = buildCounterBytes(Math.floor(timestampSeconds / period));
    const digest = await hmacSha1(keyBytes, counterBytes);
    const offset = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[offset] & 0x7f) << 24)
      | ((digest[offset + 1] & 0xff) << 16)
      | ((digest[offset + 2] & 0xff) << 8)
      | (digest[offset + 3] & 0xff);
    const modulo = 10 ** digits;
    return String(binary % modulo).padStart(digits, '0');
  }

  function getTotpSecondsRemaining(options = {}) {
    const period = Math.max(1, Math.floor(Number(options.period) || 30));
    const timestampSeconds = Math.floor(Number(options.forTime ?? (Date.now() / 1000)) || 0);
    const remainder = timestampSeconds % period;
    return remainder === 0 ? period : period - remainder;
  }

  function buildTimestampedFileName(prefix = 'upi-credential-membership') {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, '0');
    return `${prefix}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`;
  }

  function maskAccessToken(token = '') {
    const text = normalizeString(token);
    if (!text) return '';
    if (text.length <= 12) return `${text.slice(0, 3)}***`;
    return `${text.slice(0, 6)}...${text.slice(-4)}`;
  }

  function isLikelyCredentialTimestamp(value = '') {
    const text = normalizeString(value);
    if (!text || !/[\d:T年月日/-]/.test(text)) {
      return false;
    }
    return Number.isFinite(Date.parse(text));
  }

  function isLikelyVerificationUrl(value = '') {
    const text = normalizeString(value);
    return /^https?:\/\//i.test(text);
  }

  function getMembershipCredentialFormat() { return (typeof self !== 'undefined' ? self : globalThis).MultiPageMembershipCredentialFormat || {}; }
  function getMembershipCredentialBackupFormatModule() {
    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    if (rootScope.MultiPageMembershipCredentialBackupFormat) {
      return rootScope.MultiPageMembershipCredentialBackupFormat;
    }
    if (typeof require === 'function') {
      return require('./membership/credential-backup-format.js');
    }
    return {};
  }

  const credentialBackupFormatFactory = getMembershipCredentialBackupFormatModule().createCredentialBackupFormat;
  if (typeof credentialBackupFormatFactory !== 'function') {
    throw new Error('Membership credential backup format module is not loaded.');
  }
  const credentialBackupFormat = credentialBackupFormatFactory({
    buildPasskeyNumericMetadataPatch,
    getMembershipCredentialFormat,
    getPasskeyCredentialIdFromExportMarker,
    isLikelyCredentialTimestamp,
    isLikelyVerificationUrl,
    isPasskeyExportMarker,
    normalizeEmail,
    normalizeNo2faFreeExportTimestamp,
    normalizeNo2faFreeVerificationUrlForExport,
    normalizeString,
    normalizeTotpSecret,
    parsePasskeyExportMarker,
  });
  const {
    buildCredentialRowsFromBackupMap,
    normalizeCredentialBackupMap,
    parseCredentialBackupParts,
    parseCredentialBackupPartsFallback,
    parseCredentialBackupText,
  } = credentialBackupFormat;
  function normalizeResultItem(item = {}) {
    return getMembershipResultStateHelper('normalizeResultItem')(item);
  }

  function dedupeResultItemsByEmail(items = []) {
    return getMembershipResultStateHelper('dedupeResultItemsByEmail')(items);
  }

  function normalizeResultsPayload(value = {}) {
    return getMembershipResultStateHelper('normalizeResultsPayload')(value);
  }

  function buildFreeMembershipOverrideFields(checkedAt = new Date().toISOString()) {
    const timestamp = normalizeString(checkedAt) || new Date().toISOString();
    return {
      status: 'free',
      planType: 'free',
      membershipOverrideStatus: 'free',
      membershipOverrideCheckedAt: timestamp,
      redeemStatus: '',
      redeemReason: '',
      redeemSuccessAt: '',
      upiRedeemCdkey: '',
      cdkey: '',
      redeemChannel: '',
      redeemFailureCount: 0,
      redeemFailureLimit: REDEEM_CHANNEL_FAILURE_LIMIT,
      redeemLastFailedAt: '',
      upiRedeemFailureCount: 0,
      idealRedeemFailureCount: 0,
      pixRedeemFailureCount: 0,
      upiRedeemDailyLimitBlockedAt: '',
      upiRedeemDailyLimitBlockedUntil: '',
      upiRedeemDailyLimitReason: '',
      idealRedeemDailyLimitBlockedAt: '',
      idealRedeemDailyLimitBlockedUntil: '',
      idealRedeemDailyLimitReason: '',
      pixRedeemDailyLimitBlockedAt: '',
      pixRedeemDailyLimitBlockedUntil: '',
      pixRedeemDailyLimitReason: '',
      redeemLocked: false,
      redeemLockedReason: '',
      redeemLockedAt: '',
      upiRedeemSuccess: false,
      upiRedeemSubscriptionActive: false,
      upiRedeemHasActiveSubscription: false,
      upiRedeemSubscriptionPlanType: '',
      upiRedeemSubscriptionCheckedAt: timestamp,
      hasActiveSubscription: false,
      has_active_subscription: false,
      subscriptionActive: false,
      subscription_active: false,
      subscriptionPlanType: '',
      isPlus: false,
      isPro: false,
      isTeam: false,
    };
  }

  function getResultItemRedeemChannel(item = {}) {
    return normalizeRedeemChannel(item?.redeemChannel || item?.channel || item?.paymentChannel);
  }

  function isResultItemHiddenByPlusDeletion(results = {}, item = {}, channel = '') {
    const email = normalizeEmail(item?.email);
    if (!email) return false;
    const deletedByChannel = normalizeRedeemPlusDeletedEmailsByChannel(results?.redeemPlusDeletedEmailsByChannel);
    const rawChannel = normalizeString(channel || item?.redeemChannel || item?.channel || item?.paymentChannel);
    if (!rawChannel) {
      return (deletedByChannel.upi || []).includes(email) || (deletedByChannel.ideal || []).includes(email);
    }
    const targetChannel = normalizeRedeemChannel(rawChannel);
    return (deletedByChannel[targetChannel] || []).includes(email);
  }

  function buildResultExportRows(results = {}, status = 'paid', channel = '', emails = [], options = {}) {
    return getMembershipResultStateHelper('buildResultExportRows')(results, status, channel, emails, options);
  }

  function classifySubscriptionResult(subscriptionItem = {}) {
    const planType = normalizePlanType(
      subscriptionItem.planType
      || subscriptionItem.plan_type
      || subscriptionItem.plan
      || subscriptionItem.subscription_plan
      || subscriptionItem.subscriptionPlan
      || subscriptionItem.payload?.planType
      || subscriptionItem.payload?.plan_type
      || subscriptionItem.payload?.plan
      || subscriptionItem.payload?.subscription_plan
      || subscriptionItem.payload?.subscriptionPlan
      || ''
    );
    const active = subscriptionItem.active === true
      || subscriptionItem.hasActiveSubscription === true
      || subscriptionItem.has_active_subscription === true
      || subscriptionItem.subscription_active === true
      || subscriptionItem.subscriptionActive === true
      || subscriptionItem.payload?.has_active_subscription === true
      || subscriptionItem.payload?.hasActiveSubscription === true
      || subscriptionItem.payload?.subscription_active === true
      || subscriptionItem.payload?.subscriptionActive === true;
    if (active && isPaidPlanType(planType)) {
      return { status: 'paid', planType, reason: `已开通 ${planType}` };
    }
    return {
      status: 'free',
      planType: planType || 'free',
      reason: normalizeString(subscriptionItem.reason) || '未查询到 Plus/Pro/Team 会员',
    };
  }

  function getErrorMessage(error) {
    return error?.message || String(error || '未知错误');
  }

  function isApproveBlockedError(error) {
    return /(^|[^a-z0-9])approve-blocked([^a-z0-9]|$)/i.test(
      normalizeString(getErrorMessage(error)).toLowerCase().replace(/[\s_]+/g, '-')
    );
  }

  function isUpiRedeemApiAuthError(error) {
    const message = normalizeString(getErrorMessage(error));
    return /^UPI_REDEEM_AUTH_ERROR::/i.test(normalizeString(error?.message || error))
      || /UPI[\s\S]*(?:HTTP\s*40[13]|API\s*Key|ApiKey|External API Key|认证失败|权限不足|无权限|forbidden|unauthorized)/i.test(message)
      || /(?:HTTP\s*40[13]|API\s*Key|ApiKey|External API Key|认证失败|权限不足|无权限|forbidden|unauthorized)[\s\S]*UPI/i.test(message);
  }

  function createMembershipStopError(kind = 'check') {
    const error = new Error(kind === 'redeem' ? 'UPI Free 账号兑换已停止' : 'UPI 备份账号会员核验已停止');
    error.code = MEMBERSHIP_STOP_ERROR_CODE;
    error.isUpiCredentialMembershipStopped = true;
    return error;
  }

  function isMembershipStopError(error) {
    return Boolean(error?.isUpiCredentialMembershipStopped || error?.code === MEMBERSHIP_STOP_ERROR_CODE);
  }

  function createSessionAccountMismatchError(message, details = {}) {
    const error = new Error(message);
    error.code = SESSION_ACCOUNT_MISMATCH_ERROR_CODE;
    error.isUpiCredentialSessionAccountMismatch = true;
    error.sessionEmail = details.sessionEmail || '';
    error.targetEmail = details.targetEmail || '';
    return error;
  }

  function isSessionAccountMismatchError(error) {
    return Boolean(
      error?.isUpiCredentialSessionAccountMismatch
      || error?.code === SESSION_ACCOUNT_MISMATCH_ERROR_CODE
    );
  }

  function createUpiCredentialMembershipChecker(deps = {}) {
    const {
      addLog = async () => {},
      broadcastDataUpdate = () => {},
      checkUpiRedeemSubscriptionStatuses = null,
      checkUpiRedeemAccessTokenEligibility = null,
      chrome: chromeApi = globalThis.chrome,
      ensureContentScriptReadyOnTabUntilStopped = null,
      fetchVerificationCodeOnly = null,
      fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null,
      getState = async () => ({}),
      isTabAlive = async () => true,
      markCustomEmailPoolEntryTrialEligibility = null,
      markRegistrationEmailTrialIneligible = null,
      registerTab = async () => {},
      redeemUpiCredentialWithAccessToken = null,
      refreshPendingUpiCredentialMembershipRedeemStatuses = null,
      reuseOrCreateTab = null,
      sendTabMessageUntilStopped = null,
      setState = null,
      SIGNUP_PAGE_INJECT_FILES = [],
      sleepWithStop = async (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      throwIfStopped = () => {},
    } = deps;

    let batchStopRequested = false;
    let batchRunning = false;
    let redeemStopRequested = false;
    let redeemRunning = false;
    let cdkeyRetryRunning = false;
    const membershipResultsStoreFactory = getMembershipResultsStoreHelpers().createMembershipResultsStore;
    if (typeof membershipResultsStoreFactory !== 'function') throw new Error('Membership results store module is not loaded.');
    const membershipResultsStore = membershipResultsStoreFactory({
      broadcastDataUpdate, chromeApi, mergeRedeemDeletionStateForSave, normalizeResultsPayload, setState,
      storageKey: RESULTS_STORAGE_KEY,
    });

    function throwIfMembershipStopRequested(kind = 'check') {
      throwIfStopped();
      if (kind === 'redeem' ? redeemStopRequested : batchStopRequested) {
        throw createMembershipStopError(kind);
      }
    }

    function resolveStopChecker(options = {}, kind = 'check') {
      return typeof options.throwIfStopRequested === 'function'
        ? options.throwIfStopRequested
        : () => throwIfMembershipStopRequested(kind);
    }

    const loginSessionExecutorFactory = getMembershipLoginSessionExecutorModule().createMembershipLoginSessionExecutor;
    if (typeof loginSessionExecutorFactory !== 'function') {
      throw new Error('Membership login session executor module is not loaded.');
    }

    let passkeyApiLoginExecutor = null;
    const loginSessionExecutor = loginSessionExecutorFactory({
      addLog,
      AUTH_SOURCE,
      CHATGPT_ENTRY_URL,
      CHATGPT_LOGIN_URL,
      chrome: chromeApi,
      clearOpenAiCookies,
      createSessionAccountMismatchError,
      ensureContentScriptReadyOnTabUntilStopped,
      fetchVerificationCodeOnly,
      getErrorMessage,
      getTotpCodeForCredential,
      hasPasskeyCredential,
      hasWrittenPasskeySessionCookie: (...args) => hasWrittenPasskeySessionCookie(...args),
      isMembershipStopError,
      isTabAlive,
      maskAccessToken,
      normalizeFlowStage,
      registerTab,
      resolveStopChecker,
      reuseOrCreateTab,
      sendTabMessageUntilStopped,
      SIGNUP_PAGE_INJECT_FILES,
      sleepWithStop,
      tryPasskeyApiLoginAndReadAccessToken: (...args) => tryPasskeyApiLoginAndReadAccessToken(...args),
    });

    const passkeyApiLoginExecutorFactory = getPasskeyApiLoginHelper().createPasskeyApiLoginExecutor;
    passkeyApiLoginExecutor = typeof passkeyApiLoginExecutorFactory === 'function'
      ? passkeyApiLoginExecutorFactory({
        addLog, chromeApi, clearOpenAiCookies, createSessionAccountMismatchError, fetchImpl, hasPasskeyCredential,
        maskAccessToken, normalizeEmail, normalizeString, openFreshLoginTab: loginSessionExecutor.openFreshLoginTab, resolveStopChecker,
      })
      : null;

    function requirePasskeyApiLoginExecutor() {
      if (!passkeyApiLoginExecutor) {
        throw new Error('Passkey API 登录能力尚未加载。');
      }
      return passkeyApiLoginExecutor;
    }

    async function tryPasskeyApiLoginAndReadAccessToken(credential = {}, state = {}, options = {}) {
      return requirePasskeyApiLoginExecutor().tryPasskeyApiLoginAndReadAccessToken(credential, state, options);
    }

    function hasWrittenPasskeySessionCookie(loginResult = {}, cookieApplyResult = {}) {
      return requirePasskeyApiLoginExecutor().hasWrittenPasskeySessionCookie(loginResult, cookieApplyResult);
    }

    async function assertUpiRedeemSettingsReadyForMembershipRedeem(credentials = [], settings = {}) {
      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      const runtimeState = {
        ...(latestState || {}),
        ...(settings || {}),
      };
      const missing = [];
      if (!normalizeString(getUpiRedeemStateValue(runtimeState, 'upiRedeemExternalApiKey'))) {
        missing.push('UPI 外部 API Key');
      }
      const availableCdkeyCount = countAvailableUpiRedeemCdkeys(runtimeState);
      if (availableCdkeyCount <= 0) {
        missing.push('可用 CDK');
      }
      if (missing.length) {
        throw new Error(`第 7 步 CDK 兑换 Plus 未配置：缺少 ${missing.join('、')}。`);
      }
      const credentialCount = Array.isArray(credentials) ? credentials.length : 0;
      if (credentialCount > availableCdkeyCount) {
        await addLog(
          `UPI Free 兑换：第 7 步可用 CDK ${availableCdkeyCount} 个，待兑换账号 ${credentialCount} 个；CDK 用完后会自动停止，等待补 CDK 后继续。`,
          'warn'
        );
      }
    }

    const membershipResultSyncFactory = getMembershipResultSyncModule().createMembershipResultSync;
    if (typeof membershipResultSyncFactory !== 'function') {
      throw new Error('Membership result sync service module is not loaded.');
    }
    const membershipResultSync = membershipResultSyncFactory({
      broadcastDataUpdate,
      buildRedeemChannelUsageUpdates,
      chromeApi,
      getState,
      getUpiRedeemStateValue,
      isBatchRunning: () => batchRunning,
      isCdkeyRetryRunning: () => cdkeyRetryRunning,
      isRedeemRunning: () => redeemRunning,
      membershipResultsStore,
      normalizeBoolean,
      normalizeEmail,
      normalizeResultsPayload,
      normalizeRetryCount,
      normalizeString,
      normalizeUpiRedeemCdkeyUsage,
      setState,
      storageKey: RESULTS_STORAGE_KEY,
    });
    const {
      buildRetryUpdatesPayload,
      getFreshUpiRedeemRuntimeState,
      getStoredResults,
      sanitizeUpiRedeemRuntimeSettings,
      saveResults,
      updateUpiRedeemCdkeyRetryUsage,
    } = membershipResultSync;

    const credentialPoolServiceFactory = getMembershipCredentialPoolServiceModule().createCredentialPoolService;
    if (typeof credentialPoolServiceFactory !== 'function') {
      throw new Error('Membership credential pool service module is not loaded.');
    }
    const credentialPoolService = credentialPoolServiceFactory({
      BACKUP_STORAGE_KEY,
      addRedeemPlusDeletedEmailsByChannel,
      broadcastDataUpdate,
      buildCredentialRowsFromBackupMap,
      buildPasskeyNumericMetadataPatch,
      buildRedeemChannelUsageUpdates,
      buildRedeemDeletionStatePatch,
      chromeApi,
      clearUpiRedeemCdkeyUsageAccountBindings,
      getRedeemChannelUsage,
      getResultItemRedeemChannel,
      getState,
      getStoredResults,
      getUpiRedeemCdkeyUsageEntryEmail,
      isActiveUpiRedeemRemoteStatus,
      normalizeBoolean,
      normalizeCredentialBackupMap,
      normalizeEmail,
      normalizeEmailList,
      normalizeRedeemChannel,
      normalizeString,
      normalizeTotpSecret,
      normalizeUpiRedeemCdkeyUsage,
      saveResults,
      setState,
    });
    const {
      deleteUpiCredentialMembershipCheckResults,
      deleteUpiCredentialMembershipCredentials,
      findBackupCredentialByEmail,
      getActiveRedeemCdkeyUsageEmailSetFromState,
      getActiveUpiCredentialMembershipRedeemEmailSet,
      getBackupCredentialsFromLocalStorage,
      getUpiCredentialMembershipCredentialPool,
      isActiveUpiCredentialMembershipRedeemResultItem,
    } = credentialPoolService;
    function resolveInputCredentials(input = {}) {
      const textCredentials = parseCredentialBackupText(input.text || input.fileContent || '');
      const directCredentials = Array.isArray(input.credentials)
        ? input.credentials.map((item) => {
            const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
            const no2faFreeRoute = source.no2faFreeRoute === true;
            const recordedAt = Math.max(0, Math.floor(Number(source.recordedAt || source.no2faFreeRecordedAt) || 0));
            const passkeyNumericMetadataPatch = buildPasskeyNumericMetadataPatch(source);
            return {
              email: normalizeEmail(source.email),
              password: no2faFreeRoute ? '' : normalizeString(source.password),
              gptPassword: no2faFreeRoute ? '' : normalizeString(source.gptPassword || source.password),
              totpMfaSecret: no2faFreeRoute ? '' : normalizeTotpSecret(source.totpMfaSecret || source.totpSecret),
              passkeyEnabled: no2faFreeRoute ? false : (source.passkeyEnabled === true || Boolean(normalizeString(source.passkeyCredentialId || source.credentialId || source.credential_id))),
              passkeyEnabledAt: normalizeString(source.passkeyEnabledAt), passkeyCredentialId: normalizeString(source.passkeyCredentialId || source.credentialId || source.credential_id),
              passkeyFactorId: normalizeString(source.passkeyFactorId || source.factorId || source.factor_id), passkeyRpId: normalizeString(source.passkeyRpId || source.rpId || source.rp_id),
              passkeyUserHandle: normalizeString(source.passkeyUserHandle || source.userHandle || source.user_handle),
              passkeyPrivateJwk: source.passkeyPrivateJwk && typeof source.passkeyPrivateJwk === 'object' && !Array.isArray(source.passkeyPrivateJwk) ? source.passkeyPrivateJwk : null,
              passkeyPublicKeyCose: normalizeString(source.passkeyPublicKeyCose || source.publicKeyCose || source.public_key_cose), ...passkeyNumericMetadataPatch,
              passkeyApiPersisted: source.passkeyApiPersisted === true || source.persisted === true,
              verificationUrl: normalizeString(source.verificationUrl || source.emailVerificationUrl || source.url),
              recordedAt,
              no2faFreeRoute,
              twoFactorEnabled: no2faFreeRoute
                ? false
                : (source.twoFactorEnabled === true
                  || Boolean(normalizeTotpSecret(source.totpMfaSecret || source.totpSecret))
                  || source.passkeyEnabled === true
                  || Boolean(normalizeString(source.passkeyCredentialId || source.credentialId || source.credential_id))),
              accessToken: normalizeString(source.accessToken || source.token || source.access_token || source.upiRedeemAccessToken),
              accessTokenUpdatedAt: normalizeString(source.accessTokenUpdatedAt || source.checkedAt || source.trialEligibilityCheckedAt),
              checkedAt: normalizeString(source.checkedAt || source.trialEligibilityCheckedAt || source.accessTokenUpdatedAt),
              status: normalizeString(source.status),
              planType: normalizePlanType(source.planType),
            };
          }).filter((item) => item.email)
        : [];
      const all = [...directCredentials, ...textCredentials];
      const seen = new Set();
      return all.filter((item) => {
        if (!item.email || seen.has(item.email)) return false;
        seen.add(item.email);
        return true;
      });
    }

    function upsertResultItem(items = [], nextItem = {}) {
      const normalized = normalizeResultItem(nextItem);
      if (!normalized.email) return items;
      let replaced = false;
      const nextItems = (Array.isArray(items) ? items : []).map((item) => {
        if (normalizeEmail(item?.email) !== normalized.email) return item;
        replaced = true;
        return normalized;
      });
      if (!replaced) {
        nextItems.push(normalized);
      }
      return nextItems;
    }

    const freePoolServiceFactory = getMembershipFreePoolServiceModule().createFreePoolService;
    if (typeof freePoolServiceFactory !== 'function') {
      throw new Error('Membership free pool service module is not loaded.');
    }
    const freePoolService = freePoolServiceFactory({
      addLog,
      buildPasskeyNumericMetadataPatch,
      checkUpiRedeemAccessTokenEligibility,
      getErrorMessage,
      getState,
      getStoredResults,
      getUpiCredentialMembershipCredentialPool,
      hasChatGptSessionPayload,
      isActiveUpiCredentialMembershipRedeemResultItem,
      isBatchRunning: () => batchRunning,
      isCdkeyRetryRunning: () => cdkeyRetryRunning,
      isRedeemRunning: () => redeemRunning,
      isUpiTrialIneligibleError,
      loginAndReadAccessToken,
      markRegistrationEmailTrialIneligible,
      maskAccessToken,
      mergeCredentialsIntoResultItems,
      normalizeEmail,
      normalizePlanType,
      normalizeRedeemChannel,
      normalizeRedeemPlusDeletedEmailsByChannel,
      normalizeResultItem,
      normalizeRetryCount,
      normalizeString,
      normalizeTotpSecret,
      resolveInputCredentials,
      saveResults,
      setBatchRunning: (value) => { batchRunning = value === true; },
      setBatchStopRequested: (value) => { batchStopRequested = value === true; },
      throwIfMembershipStopRequested,
      upsertResultItem,
    });
    const {
      pruneIneligibleFreeUpiCredentialMembership,
      upsertTrialEligibleFreeCredential,
    } = freePoolService;

    function mergeCredentialsIntoResultItems(items = [], credentials = []) {
      let nextItems = Array.isArray(items) ? [...items] : [];
      credentials.forEach((credential) => {
        const email = normalizeEmail(credential.email);
        if (!email) {
          return;
        }
        const existingIndex = nextItems.findIndex((item) => normalizeEmail(item?.email) === email);
        if (existingIndex >= 0) {
          nextItems[existingIndex] = normalizeResultItem(mergeCredentialAuthMaterial(nextItems[existingIndex], credential));
          return;
        }
        nextItems.push(normalizeResultItem({
          ...credential,
          status: 'free',
          planType: 'free',
          reason: '待兑换',
        }));
      });
      return nextItems;
    }

    function isCdkeyExhaustedError(error) {
      const message = getErrorMessage(error);
      return /(?:没有可用的\s*UPI\s*卡密|UPI\s*卡密不足|导入未使用卡密)/i.test(message);
    }

    function getRedeemResultSubscriptionCheckedAt(result = {}) {
      const raw = result.upiRedeemSubscriptionCheckedAt
        || result.subscriptionCheckedAt
        || result.subscription?.checkedAt
        || '';
      if (typeof raw === 'number') {
        const date = new Date(raw);
        return Number.isNaN(date.getTime()) ? '' : date.toISOString();
      }
      return normalizeString(raw);
    }

    function classifyRedeemResult(result = {}) {
      const planType = normalizePlanType(
        result.planType
        || result.upiRedeemSubscriptionPlanType
        || result.subscription?.planType
        || result.subscription?.plan_type
        || ''
      );
      const active = result.active === true
        || result.upiRedeemSubscriptionActive === true
        || result.subscription?.active === true
        || result.subscription?.hasActiveSubscription === true;
      return {
        active,
        planType,
        reason: normalizeString(result.reason || result.subscription?.reason || ''),
      };
    }

    function normalizeSubscriptionRuntimeState(state = {}) {
      const subscriptionApiBaseUrl = normalizeString(
        state?.upiSubscriptionApiBaseUrl
        || state?.upiCredentialMembershipCheckTotpApiBaseUrl
        || state?.totpMfaApiBaseUrl
        || state?.totpMfaLookupApiBaseUrl
        || ''
      );
      return subscriptionApiBaseUrl
        ? {
            ...state,
            upiSubscriptionApiBaseUrl: subscriptionApiBaseUrl,
          }
        : state;
    }

    async function checkCredentialPaidSubscription({ state = {}, credential = {}, accessToken = '', throwIfStopRequested = null } = {}) {
      if (typeof throwIfStopRequested === 'function') throwIfStopRequested();
      if (typeof checkUpiRedeemSubscriptionStatuses !== 'function') {
        throw new Error('UPI 会员状态查询能力尚未接入。');
      }
      const subscription = await checkUpiRedeemSubscriptionStatuses({
        ...normalizeSubscriptionRuntimeState(state),
        items: [{
          id: credential.email,
          email: credential.email,
          token: accessToken,
          }],
      });
      if (typeof throwIfStopRequested === 'function') throwIfStopRequested();
      return classifySubscriptionResult(subscription?.items?.[0] || {});
    }

    async function removeOpenAiCookie(cookie) {
      const host = normalizeString(cookie?.domain).replace(/^\.+/, '');
      if (!host) return false;
      const path = normalizeString(cookie?.path || '/').startsWith('/')
        ? normalizeString(cookie?.path || '/')
        : `/${normalizeString(cookie?.path || '/')}`;
      const details = {
        url: `https://${host}${path}`,
        name: cookie.name,
      };
      if (cookie.storeId) details.storeId = cookie.storeId;
      if (cookie.partitionKey) details.partitionKey = cookie.partitionKey;
      try {
        return Boolean(await chromeApi.cookies.remove(details));
      } catch {
        return false;
      }
    }

    function shouldClearCookie(cookie) {
      const domain = normalizeString(cookie?.domain).replace(/^\.+/, '').toLowerCase();
      return Boolean(domain) && COOKIE_CLEAR_DOMAINS.some((target) => domain === target || domain.endsWith(`.${target}`));
    }

    async function clearOpenAiCookies() {
      if (!chromeApi?.cookies?.getAll || !chromeApi.cookies?.remove) return { removedCount: 0, candidateCount: 0 };
      const stores = chromeApi.cookies.getAllCookieStores
        ? await chromeApi.cookies.getAllCookieStores()
        : [{ id: undefined }];
      const cookies = [];
      const seen = new Set();
      for (const store of stores || []) {
        const batch = await chromeApi.cookies.getAll(store?.id ? { storeId: store.id } : {});
        for (const cookie of batch || []) {
          if (!shouldClearCookie(cookie)) continue;
          const key = [cookie.storeId || store?.id || '', cookie.domain || '', cookie.path || '', cookie.name || ''].join('|');
          if (seen.has(key)) continue;
          seen.add(key);
          cookies.push(cookie);
        }
      }
      let removedCount = 0;
      for (const cookie of cookies) {
        if (await removeOpenAiCookie(cookie)) removedCount += 1;
      }
      if (chromeApi.browsingData?.removeCookies) {
        await chromeApi.browsingData.removeCookies({ since: 0, origins: COOKIE_CLEAR_ORIGINS }).catch(() => null);
      }
      return { removedCount, candidateCount: cookies.length };
    }

    async function fetchJson(url, options = {}) {
      if (typeof fetchImpl !== 'function') {
        throw new Error('当前环境不支持 fetch，无法调用远端接口。');
      }
      const timeoutMs = Math.max(1000, Math.floor(Number(options.timeoutMs) || TOTP_LOOKUP_TIMEOUT_MS));
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller
        ? setTimeout(() => controller.abort(), timeoutMs)
        : null;
      const requestOptions = { ...options };
      delete requestOptions.timeoutMs;
      if (controller) {
        requestOptions.signal = controller.signal;
      }
      let response;
      try {
        response = await fetchImpl(url, requestOptions);
      } catch (error) {
        if (error?.name === 'AbortError') {
          throw new Error(`POST ${url} 请求超时（>${Math.round(timeoutMs / 1000)} 秒）`);
        }
        throw error;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
      const text = await response.text().catch(() => '');
      let payload = {};
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        payload = { raw: text };
      }
      if (!response.ok) {
        const reason = normalizeString(payload?.reason || payload?.detail || payload?.message || text);
        throw new Error(`POST ${url} 返回 HTTP ${response.status}${reason ? `：${reason}` : ''}`);
      }
      return payload;
    }

    async function requestTotpCodeBySecret({ secret }) {
      const code = await generateTotpCode(secret);
      return {
        code,
        secondsRemaining: getTotpSecondsRemaining(),
        source: 'local',
      };
    }

    async function requestTotpCodeByLookup({ baseUrl, email, key }) {
      const requestBody = { email };
      if (normalizeString(key)) requestBody.key = normalizeString(key);
        const payload = await fetchJson(`${normalizeTotpApiBaseUrl(baseUrl)}/api/v1/totp/lookup`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(requestBody),
          timeoutMs: TOTP_LOOKUP_TIMEOUT_MS,
        });
      const ok = payload?.ok !== false;
      const reason = normalizeString(payload?.reason || payload?.message);
      if (!ok || (reason && reason !== 'ok')) {
        throw new Error(`TOTP lookup 返回失败：${reason || 'unknown'}`);
      }
      const code = normalizeString(payload?.code).replace(/[^\d]/g, '');
      if (!code) {
        throw new Error(`TOTP lookup 未返回 6 位动态码：${reason || JSON.stringify(payload).slice(0, 180)}`);
      }
      return {
        code,
        secondsRemaining: Math.floor(Number(payload?.secondsRemaining ?? payload?.seconds_remaining) || 0),
        payload,
        source: 'lookup',
      };
    }

    async function getTotpCodeForCredential({ state, credential, throwIfStopRequested = null }) {
      const baseUrl = normalizeTotpApiBaseUrl(state?.upiCredentialMembershipCheckTotpApiBaseUrl);
      const lookupKey = normalizeString(state?.upiCredentialMembershipCheckTotpLookupKey);
      const attempts = [];
      async function withFreshWindow(getter, label) {
        if (typeof throwIfStopRequested === 'function') throwIfStopRequested();
        let result = await getter();
        if (typeof throwIfStopRequested === 'function') throwIfStopRequested();
        if (result.secondsRemaining > 0 && result.secondsRemaining < 8) {
          await addLog(`UPI 备份核验：${credential.email} 的 ${label} 动态码剩余 ${result.secondsRemaining} 秒，等待下一周期后重新获取。`, 'info');
          await sleepWithStop(Math.min(35, result.secondsRemaining + 1) * 1000);
          if (typeof throwIfStopRequested === 'function') throwIfStopRequested();
          result = await getter();
          if (typeof throwIfStopRequested === 'function') throwIfStopRequested();
        }
        return result;
      }

      if (credential.totpMfaSecret) {
        try {
          return await withFreshWindow(
            () => requestTotpCodeBySecret({ secret: credential.totpMfaSecret }),
            '本地 TOTP'
          );
        } catch (error) {
          if (isMembershipStopError(error)) throw error;
          attempts.push(`本地 TOTP: ${getErrorMessage(error)}`);
        }
      }

      try {
        return await withFreshWindow(
          () => requestTotpCodeByLookup({ baseUrl, email: credential.email, key: lookupKey }),
          '/totp/lookup'
        );
      } catch (error) {
        if (isMembershipStopError(error)) throw error;
        attempts.push(`/totp/lookup: ${getErrorMessage(error)}`);
      }
      throw new Error(`TOTP 取码失败：${attempts.join('；')}`);
    }

    async function loginAndReadAccessToken(credential, state, options = {}) {
      return loginSessionExecutor.loginAndReadAccessToken(credential, state, options);
    }
    async function loginUpiCredentialMembershipAccount(input = {}) {
      if (batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (redeemRunning || cdkeyRetryRunning) {
        throw new Error('UPI Free 账号兑换/CDK 重试正在运行，请等待完成或先停止。');
      }

      batchRunning = true;
      batchStopRequested = false;
      const startedAt = new Date().toISOString();
      let currentResults = await getStoredResults();
      let items = Array.isArray(currentResults.items) ? [...currentResults.items] : [];
      const rawCredential = input.credential && typeof input.credential === 'object' && !Array.isArray(input.credential)
        ? input.credential
        : input;
      const directCredential = resolveInputCredentials({ credentials: [rawCredential] })[0] || {};
      const email = normalizeEmail(input.email || rawCredential.email || directCredential.email);
      if (!email) {
        batchRunning = false;
        throw new Error('缺少要登录的账号邮箱。');
      }

      const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
      const backupCredential = await findBackupCredentialByEmail(email);
      const rawStatus = normalizeString(existingItem.status || directCredential.status || rawCredential.status).toLowerCase();
      const status = ['paid', 'free', 'failed'].includes(rawStatus) ? rawStatus : 'free';
      const planType = status === 'paid'
        ? (normalizePlanType(existingItem.planType || directCredential.planType || rawCredential.planType || 'plus') || 'plus')
        : (normalizePlanType(existingItem.planType || directCredential.planType || rawCredential.planType || 'free') || 'free');
      const baseItem = normalizeResultItem({
        ...backupCredential,
        ...existingItem,
        ...rawCredential,
        ...directCredential,
        email,
        status,
        planType,
        password: normalizeString(directCredential.password || rawCredential.password || backupCredential.password || existingItem.password),
        totpMfaSecret: normalizeTotpSecret(directCredential.totpMfaSecret || rawCredential.totpMfaSecret || rawCredential.totpSecret || backupCredential.totpMfaSecret || existingItem.totpMfaSecret),
      });
      if (!baseItem.password) {
        batchRunning = false;
        throw new Error(`${email} 缺少 GPT 密码，无法登录。`);
      }

      const source = normalizeString(input.source || 'row-login') || 'row-login';
      const readAccessToken = input.readAccessToken !== false && input.refreshAccessToken !== false;
      const flowMode = readAccessToken ? '' : 'login-only';
      const saveLoginProgress = async (stage = 'login', reason = '') => {
        items = upsertResultItem(items, {
          ...baseItem,
          reason: reason || baseItem.reason || '正在登录',
        });
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: true,
          updatedAt: new Date().toISOString(),
          startedAt: currentResults.startedAt || startedAt,
          finishedAt: '',
          stoppedAt: '',
          flowStage: stage,
          flowStageEmail: email,
          flowMode,
          source,
          total: Math.max(currentResults.total || 0, items.length),
          completed: Math.max(currentResults.completed || 0, items.length),
        });
      };

      try {
        const latestState = typeof getState === 'function'
          ? await getState().catch(() => ({}))
          : {};
        const runtimeState = {
          ...(latestState || {}),
          ...(input.settings || {}),
          visibleStep: 7,
        };
        const session = await loginAndReadAccessToken(baseItem, runtimeState, {
          onStage: async (stage) => {
            const reasonMap = {
              'open-chatgpt': '正在打开 ChatGPT 官网',
              'passkey-login': '正在使用 Passkey API 登录',
              login: '正在登录邮箱密码',
              totp: '正在提交 2FA 验证',
              token: readAccessToken ? '正在读取 accessToken' : '正在确认登录',
            };
            await saveLoginProgress(stage, reasonMap[stage] || '正在登录');
          },
          throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
          readAccessToken,
        });
        if (!readAccessToken) {
          const finishedAt = new Date().toISOString();
          items = upsertResultItem(items, {
            ...baseItem,
            reason: '网页登录完成',
          });
          const results = await saveResults({
            ...currentResults,
            items,
            running: false,
            updatedAt: finishedAt,
            finishedAt,
            stoppedAt: '',
            flowStage: '',
            flowStageEmail: '',
            flowMode,
            source,
            total: Math.max(currentResults.total || 0, items.length),
            completed: Math.max(currentResults.completed || 0, items.length),
          });
          await addLog(`UPI 账号登录：${email} 已登录。`, 'ok');
          return {
            item: results.items.find((item) => normalizeEmail(item?.email) === email) || null,
            results,
          };
        }
        const accessToken = normalizeString(session.accessToken || getChatGptSessionAccessToken(session.session || session));
        const finishedAt = new Date().toISOString();
        items = upsertResultItem(items, {
          ...baseItem,
          accessToken,
          accessTokenMasked: maskAccessToken(accessToken),
          accessTokenUpdatedAt: finishedAt,
          reason: '网页登录完成，已刷新 AT',
        });
        const results = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt,
          stoppedAt: '',
          flowStage: '',
          flowStageEmail: '',
          flowMode: '',
          source,
          total: Math.max(currentResults.total || 0, items.length),
          completed: Math.max(currentResults.completed || 0, items.length),
        });
        await addLog(`UPI 账号登录：${email} 已登录并刷新 AT。`, 'ok');
        return {
          item: results.items.find((item) => normalizeEmail(item?.email) === email) || null,
          results,
        };
      } catch (error) {
        const failedAt = new Date().toISOString();
        const reason = getErrorMessage(error) || '登录失败';
        items = upsertResultItem(items, {
          ...baseItem,
          reason: `登录失败：${reason}`,
        });
        await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: failedAt,
          stoppedAt: isMembershipStopError(error) ? failedAt : currentResults.stoppedAt,
          flowStage: '',
          flowStageEmail: '',
          flowMode,
          source,
          total: Math.max(currentResults.total || 0, items.length),
          completed: Math.max(currentResults.completed || 0, items.length),
        }).catch(() => null);
        throw error;
      } finally {
        batchRunning = false;
      }
    }

    async function moveUpiCredentialMembershipAccountGroup(input = {}) {
      if (batchRunning || redeemRunning || cdkeyRetryRunning) {
        throw new Error('UPI 备份账号核验/兑换正在运行，请先停止后再移动分组。');
      }
      const rawCredential = input.credential && typeof input.credential === 'object' && !Array.isArray(input.credential)
        ? input.credential
        : input;
      const directCredential = resolveInputCredentials({ credentials: [rawCredential] })[0] || {};
      const email = normalizeEmail(input.email || rawCredential.email || directCredential.email);
      if (!email) {
        throw new Error('缺少要移动分组的账号邮箱。');
      }
      const targetStatus = normalizeString(input.targetStatus || input.status || input.group).toLowerCase() === 'paid'
        ? 'paid'
        : 'free';
      const now = new Date().toISOString();
      const currentResults = await getStoredResults();
      const backupCredential = await findBackupCredentialByEmail(email);
      const existingItem = currentResults.items.find((item) => normalizeEmail(item?.email) === email) || {};
      const baseItem = normalizeResultItem({
        ...backupCredential,
        ...existingItem,
        ...rawCredential,
        ...directCredential,
        email,
        status: existingItem.status || directCredential.status || (targetStatus === 'paid' ? 'free' : 'paid'),
        planType: existingItem.planType || directCredential.planType || (targetStatus === 'paid' ? 'plus' : 'free'),
        password: normalizeString(directCredential.password || rawCredential.password || backupCredential.password || existingItem.password),
        totpMfaSecret: normalizeTotpSecret(directCredential.totpMfaSecret || rawCredential.totpMfaSecret || rawCredential.totpSecret || backupCredential.totpMfaSecret || existingItem.totpMfaSecret),
      });
      const targetPlanType = targetStatus === 'paid'
        ? (normalizePlanType(input.planType || rawCredential.planType || baseItem.planType || 'plus') || 'plus')
        : 'free';
      const movedItem = normalizeResultItem({
        ...baseItem,
        status: targetStatus,
        planType: targetPlanType,
        checkedAt: now,
        reason: targetStatus === 'paid' ? '手动移入 Plus 组' : '手动移入 Free 组',
        ...(targetStatus === 'free' ? buildFreeMembershipOverrideFields(now) : {
          membershipOverrideStatus: '',
          membershipOverrideCheckedAt: '',
        }),
        redeemStatus: targetStatus === 'paid' && baseItem.redeemStatus === 'success' ? 'success' : '',
        redeemReason: targetStatus === 'paid' && baseItem.redeemStatus === 'success' ? baseItem.redeemReason : '',
        redeemAttemptedAt: targetStatus === 'paid' ? baseItem.redeemAttemptedAt : '',
        redeemSuccessAt: targetStatus === 'paid' ? (baseItem.redeemSuccessAt || now) : '',
        redeemChannel: targetStatus === 'paid' ? (baseItem.redeemChannel || normalizeRedeemChannel(input.channel || input.redeemChannel)) : '',
        upiRedeemCdkey: targetStatus === 'paid' ? baseItem.upiRedeemCdkey : '',
        upiRedeemSubscriptionActive: targetStatus === 'paid',
        upiRedeemSubscriptionPlanType: targetStatus === 'paid' ? targetPlanType : '',
        upiRedeemSubscriptionCheckedAt: targetStatus === 'paid' ? (baseItem.upiRedeemSubscriptionCheckedAt || baseItem.redeemSuccessAt || now) : '',
      });
      const items = upsertResultItem(currentResults.items, movedItem);
      const results = await saveResults({
        ...currentResults,
        items,
        updatedAt: now,
        total: Math.max(currentResults.total || 0, items.length),
        completed: Math.max(currentResults.completed || 0, items.length),
      });
      await addLog(`UPI 分组移动：${email} 已手动移入 ${targetStatus === 'paid' ? 'Plus' : 'Free'} 组。`, 'ok');
      return {
        item: results.items.find((item) => normalizeEmail(item?.email) === email) || movedItem,
        results,
      };
    }

    async function checkOneCredential(credential, state, options = {}) {
      const throwIfStopRequested = resolveStopChecker(options, 'check');
      const reportStage = async (stage) => {
        throwIfStopRequested();
        if (typeof options.onStage === 'function') {
          await options.onStage(stage);
        }
        throwIfStopRequested();
      };
      const checkedAt = new Date().toISOString();
      if (!credential.email) {
        return normalizeResultItem({ ...credential, status: 'failed', checkedAt, reason: '缺少邮箱' });
      }
      const checkWithAccessToken = async (accessToken, accessTokenUpdatedAt = '') => {
        const token = normalizeString(accessToken);
        if (!token) {
          throw new Error('缺少 accessToken');
        }
        await reportStage('subscription-check');
        const classification = await checkCredentialPaidSubscription({
          state,
          credential,
          accessToken: token,
          throwIfStopRequested,
        });
        return normalizeResultItem({
          ...credential,
          ...(classification.status === 'free' ? buildFreeMembershipOverrideFields(checkedAt) : {
            membershipOverrideStatus: '',
            membershipOverrideCheckedAt: '',
          }),
          status: classification.status,
          planType: classification.planType,
          checkedAt,
          reason: classification.reason,
          accessToken: token,
          accessTokenMasked: maskAccessToken(token),
          accessTokenUpdatedAt: normalizeString(accessTokenUpdatedAt) || checkedAt,
        });
      };
      try {
        const savedAccessToken = normalizeString(credential.accessToken || credential.token || credential.access_token || credential.upiRedeemAccessToken);
        if (savedAccessToken) {
          try {
            await reportStage('token');
            await addLog(`UPI 备份账号会员核验：${credential.email} -> 使用已保存 AT 直接查询会员，跳过网页登录。`, 'info');
            return await checkWithAccessToken(savedAccessToken, credential.accessTokenUpdatedAt || credential.checkedAt);
          } catch (error) {
            if (isMembershipStopError(error)) throw error;
            if (!isAccessTokenInvalidMembershipError(error)) {
              throw error;
            }
            const missingRefreshMaterial = buildMissingAccessTokenRefreshMaterialReason(credential);
            if (missingRefreshMaterial) {
              return normalizeResultItem({
                ...credential,
                status: 'failed',
                checkedAt,
                reason: `已保存 AT 无效或过期，且${missingRefreshMaterial}，无法网页登录刷新 AT：${getErrorMessage(error)}`,
              });
            }
            await addLog(`UPI 备份账号会员核验：${credential.email} -> 已保存 AT 无效或过期，开始网页登录刷新 AT。`, 'warn');
          }
        }
        const missingRefreshMaterial = buildMissingAccessTokenRefreshMaterialReason(credential);
        if (missingRefreshMaterial) {
          return normalizeResultItem({
            ...credential,
            status: 'failed',
            checkedAt,
            reason: `缺少 AT，且${missingRefreshMaterial}，无法网页登录刷新 AT`,
          });
        }
        const session = await loginAndReadAccessToken(credential, state, {
          onStage: reportStage,
          throwIfStopRequested,
        });
        throwIfStopRequested();
        if (!session.accessToken) {
          throw new Error('未读取到 accessToken');
        }
        return await checkWithAccessToken(session.accessToken, checkedAt);
      } catch (error) {
        if (isMembershipStopError(error)) throw error;
        return normalizeResultItem({
          ...credential,
          status: 'failed',
          checkedAt,
          reason: getErrorMessage(error),
        });
      }
    }

    async function checkUpiCredentialMembershipOne(input = {}) {
      if (batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (redeemRunning) {
        throw new Error('UPI 无会员账号补兑正在运行，请等待完成或先停止。');
      }
      const inputCredential = input.credential && typeof input.credential === 'object' && !Array.isArray(input.credential)
        ? input.credential
        : {};
      const targetEmail = normalizeEmail(input.email || inputCredential.email);
      if (!targetEmail) {
        throw new Error('缺少要检测的账号邮箱。');
      }

      batchRunning = true;
      batchStopRequested = false;
      const startedAt = new Date().toISOString();
      let runtimeState = {};
      let currentResults = null;
      let items = [];
      let existingItem = {};
      let backupCredential = {};
      let credential = null;

      const updateSingleStage = async (stage, reason = '') => {
        throwIfMembershipStopRequested('check');
        if (reason) {
          const existingStatus = ['paid', 'free', 'failed'].includes(normalizeString(existingItem.status))
            ? normalizeString(existingItem.status)
            : 'free';
          items = upsertResultItem(items, {
            ...(existingItem || {}),
            ...credential,
            status: existingStatus,
            reason,
            checkedAt: startedAt,
          });
        }
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: true,
          updatedAt: new Date().toISOString(),
          flowStage: stage,
          flowStageEmail: targetEmail,
          source: normalizeString(input.source || currentResults.source || runtimeState.source || credential.source || 'single'),
          total: Math.max(currentResults.total || 0, items.length || 1),
          completed: Math.max(currentResults.completed || 0, 0),
        });
        throwIfMembershipStopRequested('check');
      };

      try {
        runtimeState = {
          ...(await getState()),
          ...(input.settings || {}),
        };
        currentResults = await getStoredResults();
        items = Array.isArray(currentResults.items) ? [...currentResults.items] : [];
        existingItem = items.find((item) => normalizeEmail(item?.email) === targetEmail) || {};
        try {
          const pool = await getUpiCredentialMembershipCredentialPool();
          backupCredential = (pool.items || []).find((item) => normalizeEmail(item?.email) === targetEmail) || {};
        } catch {
          backupCredential = {};
        }
        credential = normalizeResultItem({
          ...existingItem,
          ...backupCredential,
          ...inputCredential,
          email: targetEmail,
        });
        await addLog(`UPI 单账号会员检测：开始检测 ${targetEmail} 是否已开通 Plus/Pro/Team。`, 'info');
        await updateSingleStage('token', '正在获取/确认 AT');
        const resultItem = await checkOneCredential(credential, {
          ...runtimeState,
          ...currentResults,
        }, {
          onStage: async (stage) => updateSingleStage(stage, getUpiCredentialMembershipFlowStageReason(stage)),
          throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
        });
        const resultStatus = normalizeString(resultItem.status).toLowerCase();
        const existingRedeemStatus = normalizeString(existingItem.redeemStatus).toLowerCase();
        const shouldClearRedeemSuccess = resultStatus === 'free' && ['success', 'skipped'].includes(existingRedeemStatus);
        items = upsertResultItem(items, {
          ...existingItem,
          ...credential,
          ...resultItem,
          ...(resultStatus === 'free' ? buildFreeMembershipOverrideFields(resultItem.checkedAt || startedAt) : {
            redeemStatus: shouldClearRedeemSuccess ? '' : (existingItem.redeemStatus || resultItem.redeemStatus),
            redeemReason: shouldClearRedeemSuccess ? '' : (existingItem.redeemReason || resultItem.redeemReason),
            upiRedeemCdkey: existingItem.upiRedeemCdkey || resultItem.upiRedeemCdkey,
            upiRedeemSubscriptionCheckedAt: resultItem.checkedAt || existingItem.upiRedeemSubscriptionCheckedAt,
            membershipOverrideStatus: resultStatus === 'paid' ? '' : existingItem.membershipOverrideStatus,
            membershipOverrideCheckedAt: resultStatus === 'paid' ? '' : existingItem.membershipOverrideCheckedAt,
          }),
        });
        const finishedAt = new Date().toISOString();
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          flowStage: '',
          flowStageEmail: '',
          total: Math.max(currentResults.total || 0, items.length),
          completed: Math.max(currentResults.completed || 0, items.length),
        });
        await addLog(
          `UPI 单账号会员检测：${targetEmail} -> ${resultItem.status === 'paid' ? `有会员 ${resultItem.planType || ''}` : resultItem.status === 'free' ? '无会员' : `失败：${resultItem.reason || ''}`}`,
          resultItem.status === 'paid' ? 'ok' : resultItem.status === 'free' ? 'warn' : 'error'
        );
        return {
          item: resultItem,
          results: currentResults,
        };
      } catch (error) {
        if (currentResults) {
          const finishedAt = new Date().toISOString();
          const stopped = isMembershipStopError(error) || batchStopRequested;
          await saveResults({
            ...currentResults,
            items,
            running: false,
            updatedAt: finishedAt,
            finishedAt: stopped ? (currentResults.finishedAt || '') : finishedAt,
            stoppedAt: stopped ? finishedAt : (currentResults.stoppedAt || ''),
            flowStage: stopped ? currentResults.flowStage : '',
            flowStageEmail: stopped ? currentResults.flowStageEmail : '',
          }).catch(() => null);
        }
        throw error;
      } finally {
        batchRunning = false;
      }
    }

    function getUpiCredentialMembershipFlowStageReason(stage = '') {
      switch (normalizeFlowStage(stage)) {
        case 'import': return '正在准备账号';
        case 'open-chatgpt':
        case 'passkey-login':
        case 'login':
        case 'totp':
        case 'token': return '正在获取/确认 AT';
        case 'subscription-check': return '正在查询会员资格';
        default: return '正在单独检测会员状态';
      }
    }

    async function checkUpiCredentialMembershipBatch(input = {}) {
      if (batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (redeemRunning) {
        throw new Error('UPI 无会员账号补兑正在运行，请等待完成或先停止。');
      }
      batchRunning = true;
      batchStopRequested = false;
      const startedAt = new Date().toISOString();
      let currentResults = null;
      let items = [];
      let source = '';
      let credentials = [];
      try {
        const runtimeState = {
          ...(await getState()),
          ...(input.settings || {}),
        };
        source = normalizeString(input.source || (input.text || input.fileContent ? 'txt' : 'local'));
        credentials = source === 'local'
          ? await getBackupCredentialsFromLocalStorage()
          : resolveInputCredentials(input);
        currentResults = await saveResults({
          items: [],
          running: true,
          startedAt,
          updatedAt: startedAt,
          flowStage: 'import',
          flowStageEmail: '',
          source,
          total: credentials.length,
          completed: 0,
        });
        if (!credentials.length) {
          return await saveResults({
            ...currentResults,
            running: false,
            finishedAt: new Date().toISOString(),
            flowStage: '',
            flowStageEmail: '',
          });
        }

        await addLog(`UPI 备份账号会员核验：开始核验 ${credentials.length} 个账号。`, 'info');
        items = [];
        for (const credential of credentials) {
          throwIfStopped();
          if (batchStopRequested) break;
          const throwIfStopRequested = () => throwIfMembershipStopRequested('check');
          const reportStage = async (stage) => {
            throwIfStopRequested();
            currentResults = await saveResults({
              ...currentResults,
              items,
              running: true,
              updatedAt: new Date().toISOString(),
              source,
              total: credentials.length,
              completed: items.length,
              flowStage: stage,
              flowStageEmail: credential.email,
            });
            throwIfStopRequested();
          };
          let result;
          try {
            result = await checkOneCredential(credential, runtimeState, {
              onStage: reportStage,
              throwIfStopRequested,
            });
          } catch (error) {
            if (isMembershipStopError(error)) {
              batchStopRequested = true;
              await addLog('UPI 备份账号会员核验：已停止，当前账号不会继续查会员。', 'warn');
              break;
            }
            throw error;
          }
          items.push(result);
          currentResults = await saveResults({
            ...currentResults,
            items,
            running: true,
            startedAt,
            updatedAt: new Date().toISOString(),
            source,
            total: credentials.length,
            completed: items.length,
          });
          const label = result.status === 'paid' ? `有会员 ${result.planType || ''}` : result.status === 'free' ? '无会员' : `失败：${result.reason}`;
          await addLog(`UPI 备份账号会员核验：${credential.email} -> ${label}`, result.status === 'failed' ? 'warn' : 'ok');
        }
        const finishedAt = new Date().toISOString();
        const finalResults = await saveResults({
          items,
          running: false,
          startedAt,
          updatedAt: finishedAt,
          finishedAt: batchStopRequested ? '' : finishedAt,
          stoppedAt: batchStopRequested ? finishedAt : '',
          flowStage: batchStopRequested ? currentResults.flowStage : '',
          flowStageEmail: batchStopRequested ? currentResults.flowStageEmail : '',
          source,
          total: credentials.length,
          completed: items.length,
        });
        if (batchStopRequested) {
          await addLog(`UPI 备份账号会员核验：已停止，已完成 ${finalResults.completed}/${finalResults.total}。`, 'warn');
        } else {
          await addLog(`UPI 备份账号会员核验：完成 ${finalResults.completed}/${finalResults.total}，有会员 ${finalResults.paidCount}，无会员 ${finalResults.freeCount}，失败 ${finalResults.failedCount}。`, 'ok');
        }
        return finalResults;
      } catch (error) {
        if (currentResults) {
          const finishedAt = new Date().toISOString();
          const stopped = isMembershipStopError(error) || batchStopRequested;
          await saveResults({
            ...currentResults,
            items,
            running: false,
            updatedAt: finishedAt,
            finishedAt: stopped ? '' : finishedAt,
            stoppedAt: stopped ? finishedAt : '',
            flowStage: stopped ? currentResults.flowStage : '',
            flowStageEmail: stopped ? currentResults.flowStageEmail : '',
            source,
            total: credentials.length,
            completed: items.length,
          }).catch(() => null);
        }
        throw error;
      } finally {
        batchRunning = false;
      }
    }

    const plusVerificationServiceFactory = getMembershipPlusVerificationServiceModule().createPlusVerificationService;
    if (typeof plusVerificationServiceFactory !== 'function') {
      throw new Error('Membership Plus verification service module is not loaded.');
    }
    const plusVerificationService = plusVerificationServiceFactory({
      addLog,
      buildFreeMembershipOverrideFields,
      checkCredentialPaidSubscription,
      checkUpiRedeemSubscriptionStatuses,
      getErrorMessage,
      getState,
      getStoredResults,
      isMembershipStopError,
      isPaidPlanType,
      maskAccessToken,
      mergeCredentialsIntoResultItems,
      normalizeEmail,
      normalizeResultItem,
      normalizeString,
      normalizeSubscriptionRuntimeState,
      resolveInputCredentials,
      runtimeFlags: {
        get batchRunning() { return batchRunning; },
        set batchRunning(value) { batchRunning = value === true; },
        get batchStopRequested() { return batchStopRequested; },
        set batchStopRequested(value) { batchStopRequested = value === true; },
        get redeemRunning() { return redeemRunning; },
        get cdkeyRetryRunning() { return cdkeyRetryRunning; },
      },
      saveResults,
      throwIfMembershipStopRequested,
      upsertResultItem,
    });
    const plusVerificationIdentifyFreePlus = plusVerificationService?.identifyUpiCredentialMembershipFreePlus;
    const plusVerificationVerifyPlus = plusVerificationService?.verifyUpiCredentialMembershipPlus;
    if (typeof plusVerificationIdentifyFreePlus !== 'function') {
      throw new Error('Membership Plus verification service is missing identifyUpiCredentialMembershipFreePlus.');
    }
    if (typeof plusVerificationVerifyPlus !== 'function') {
      throw new Error('Membership Plus verification service is missing verifyUpiCredentialMembershipPlus.');
    }

    const membershipRedeemServiceFactory = getMembershipRedeemServiceModule().createMembershipRedeemService;
    if (typeof membershipRedeemServiceFactory !== 'function') {
      throw new Error('Membership redeem service module is not loaded.');
    }
    const membershipRedeemService = membershipRedeemServiceFactory({
      BACKUP_STORAGE_KEY,
      DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT,
      REDEEM_CHANNEL_FAILURE_LIMIT,
      REDEEM_GROUP_CONTINUATION_IDLE_TIMEOUT_MS,
      REDEEM_GROUP_CONTINUATION_IDLE_WAIT_MS,
      addLog,
      assertUpiRedeemSettingsReadyForMembershipRedeem,
      buildAutoContinuationRedeemCandidates,
      buildFreeMembershipOverrideFields,
      buildRedeemChannelFailurePatch,
      buildRedeemDeletionStatePatch,
      checkCredentialPaidSubscription,
      checkUpiRedeemSubscriptionStatuses,
      chromeApi,
      classifyRedeemResult,
      filterRedeemableCredentialsForCurrentResults,
      findBackupCredentialByEmail,
      getAvailableUpiRedeemCdkeys,
      getChatGptSessionAccessToken,
      getErrorMessage,
      getFreshUpiRedeemRuntimeState,
      getMembershipAccessTokenSupplementServiceModule,
      getMembershipPlusVerificationServiceModule,
      getRedeemChannelFailureCount,
      getRedeemChannelLabel,
      getRedeemChannelUsage,
      getRedeemLockReason,
      getRedeemResultSubscriptionCheckedAt,
      getRedeemRoundLabel,
      getRedeemTotalRoundLimit,
      getState,
      getStoredResults,
      getUpiRedeemStateValue,
      hasChatGptSessionPayload,
      hasPasskeyCredential,
      identifyUpiCredentialMembershipFreePlus: plusVerificationIdentifyFreePlus,
      isActiveUpiRedeemRemoteStatus,
      isApproveBlockedError,
      isCdkeyExhaustedError,
      isMembershipStopError,
      isPaidPlanType,
      isPreSubmitUpiRedeemBlockedResultItem,
      isRedeemChannelDailyLimitReason,
      isRetryableUpiRedeemRoundResultItem,
      isSessionAccountMismatchError,
      isUpiRedeemApiAuthError,
      loginAndReadAccessToken,
      maskAccessToken,
      mergeCredentialAuthMaterial,
      mergeCredentialsIntoResultItems,
      normalizeCredentialBackupMap,
      normalizeEmail,
      normalizeFailedAccountRetryLimit,
      normalizeFlowStage,
      normalizeRedeemChannel,
      normalizeResultItem,
      normalizeRetryCount,
      normalizeString,
      normalizeSubscriptionRuntimeState,
      normalizeTotpSecret,
      normalizeUpiRedeemCdkeyUsage,
      pickRandomUpiRedeemCdkey,
      redeemUpiCredentialWithAccessToken,
      refreshPendingUpiCredentialMembershipRedeemStatuses,
      resolveInputCredentials,
      runtimeFlags: {
        get batchRunning() { return batchRunning; },
        get batchStopRequested() { return batchStopRequested; },
        get redeemRunning() { return redeemRunning; },
        set redeemRunning(value) { redeemRunning = value === true; },
        get redeemStopRequested() { return redeemStopRequested; },
        set redeemStopRequested(value) { redeemStopRequested = value === true; },
        get cdkeyRetryRunning() { return cdkeyRetryRunning; },
      },
      sanitizeUpiRedeemRuntimeSettings,
      saveResults,
      setState,
      shouldRedeemItemUseChannel,
      sleepWithStop,
      throwIfMembershipStopRequested,
      throwIfStopped,
      upsertResultItem,
      verifyUpiCredentialMembershipPlus: plusVerificationVerifyPlus,
    });
    const {
      redeemUpiCredentialMembershipFree,
      redeemUpiCredentialMembershipFreeLegacy,
    } = membershipRedeemService;
    const failedRedeemRetryServiceFactory = getMembershipFailedRedeemRetryServiceModule().createFailedRedeemRetryService;
    if (typeof failedRedeemRetryServiceFactory !== 'function') {
      throw new Error('Membership failed redeem retry service module is not loaded.');
    }
    const failedRedeemRetryService = failedRedeemRetryServiceFactory({
      REDEEM_CHANNEL_FAILURE_LIMIT,
      RESULTS_STORAGE_KEY,
      addLog,
      buildAutoContinuationRedeemCandidates,
      buildRedeemChannelFailurePatch,
      buildRetryUpdatesPayload,
      getAvailableUpiRedeemCdkeys,
      getFreshUpiRedeemRuntimeState,
      getRedeemChannelUsage,
      getRedeemChannelFailureCount,
      getRedeemChannelLabel,
      getRedeemLockReason,
      getRedeemRoundLabel,
      getRedeemTotalRoundLimit,
      getStoredResults,
      isRedeemChannelDailyLimitReason,
      maskAccessToken,
      normalizeEmail,
      normalizeRedeemChannel,
      normalizeResultsPayload,
      normalizeRetryCount,
      normalizeString,
      normalizeUpiRedeemCdkeyUsage,
      normalizeUpiRedeemRemoteStatus,
      pickRandomUpiRedeemCdkey,
      redeemUpiCredentialWithAccessToken,
      runtimeFlags: {
        get batchRunning() { return batchRunning; },
        get batchStopRequested() { return batchStopRequested; },
        set batchStopRequested(value) { batchStopRequested = value === true; },
        get redeemRunning() { return redeemRunning; },
        set redeemRunning(value) { redeemRunning = value === true; },
        get redeemStopRequested() { return redeemStopRequested; },
        set redeemStopRequested(value) { redeemStopRequested = value === true; },
        get cdkeyRetryRunning() { return cdkeyRetryRunning; },
        set cdkeyRetryRunning(value) { cdkeyRetryRunning = value === true; },
      },
      saveResults,
      throwIfMembershipStopRequested,
      upsertResultItem,
    });
    const { retryFailedUpiRedeemCdkey } = failedRedeemRetryService;

    const trialEligibilityServiceFactory = getMembershipTrialEligibilityServiceModule().createTrialEligibilityService;
    if (typeof trialEligibilityServiceFactory !== 'function') {
      throw new Error('Membership trial eligibility service module is not loaded.');
    }
    const trialEligibilityService = trialEligibilityServiceFactory({
      addLog,
      checkUpiRedeemAccessTokenEligibility,
      findBackupCredentialByEmail,
      getChatGptSessionAccessToken,
      getErrorMessage,
      getState,
      getStoredResults,
      hasPasskeyCredential,
      isBatchRunning: () => batchRunning,
      isCdkeyRetryRunning: () => cdkeyRetryRunning,
      isRedeemRunning: () => redeemRunning,
      loginAndReadAccessToken,
      markCustomEmailPoolEntryTrialEligibility,
      markRegistrationEmailTrialIneligible,
      maskAccessToken,
      mergeCredentialAuthMaterial,
      mergeCredentialsIntoResultItems,
      normalizeEmail,
      normalizeRedeemChannel,
      normalizeResultItem,
      normalizeRetryCount,
      normalizeString,
      resolveInputCredentials,
      saveResults,
      setBatchRunning: (value) => { batchRunning = value === true; },
      setBatchStopRequested: (value) => { batchStopRequested = value === true; },
      throwIfMembershipStopRequested,
      upsertResultItem,
      upsertTrialEligibleFreeCredential,
    });
    const { checkUpiCredentialMembershipTrialEligibility } = trialEligibilityService;

    const importExportServiceFactory = getMembershipImportExportServiceModule().createImportExportService;
    if (typeof importExportServiceFactory !== 'function') {
      throw new Error('Membership import/export service module is not loaded.');
    }
    const importExportService = importExportServiceFactory({
      buildRedeemAccountUnlockedPatch,
      buildResultExportRows,
      buildTimestampedFileName,
      deleteUpiCredentialMembershipCheckResults,
      getActiveRedeemCdkeyUsageEmailSetFromState,
      getResultItemRedeemChannel,
      getState,
      getStoredResults,
      isActiveUpiCredentialMembershipRedeemResultItem,
      isBatchRunning: () => batchRunning,
      isCdkeyRetryRunning: () => cdkeyRetryRunning,
      isLikelyVerificationUrl,
      isPasskeyExportMarker,
      isRedeemRunning: () => redeemRunning,
      isResultItemHiddenByPlusDeletion,
      isResultItemPasskeyExportableForStatus,
      normalizeEmail,
      normalizeEmailList,
      normalizeRedeemChannel,
      normalizeResultItem,
      normalizeResultsPayload,
      normalizeString,
      resolveInputCredentials,
      saveResults,
    });
    const {
      exportUpiCredentialMembershipCheckResults,
      importUpiCredentialMembershipFreeResults,
    } = importExportService;

    const accessTokenSupplementServiceFactory = getMembershipAccessTokenSupplementServiceModule().createAccessTokenSupplementService;
    if (typeof accessTokenSupplementServiceFactory !== 'function') {
      throw new Error('Membership access-token supplement service module is not loaded.');
    }
    const accessTokenSupplementService = accessTokenSupplementServiceFactory({
      addLog,
      findBackupCredentialByEmail,
      getChatGptSessionAccessToken,
      getErrorMessage,
      getState,
      getStoredResults,
      hasPasskeyCredential,
      isBatchRunning: () => batchRunning,
      isCdkeyRetryRunning: () => cdkeyRetryRunning,
      isRedeemRunning: () => redeemRunning,
      loginAndReadAccessToken,
      maskAccessToken,
      mergeCredentialAuthMaterial,
      mergeCredentialsIntoResultItems,
      normalizeEmail,
      normalizeResultItem,
      normalizeString,
      normalizeTotpSecret,
      resolveInputCredentials,
      saveResults,
      setBatchRunning: (value) => { batchRunning = value === true; },
      setBatchStopRequested: (value) => { batchStopRequested = value === true; },
      throwIfMembershipStopRequested,
      upsertResultItem,
    });
    const { fillUpiCredentialMembershipFreeAccessTokens } = accessTokenSupplementService;

    async function stopUpiCredentialMembershipRedeem() {
      redeemStopRequested = true;
      const current = await getStoredResults();
      return saveResults({
        ...current,
        redeeming: false,
        redeemStoppedAt: new Date().toISOString(),
        flowStage: current.flowStage,
        flowStageEmail: current.flowStageEmail,
      });
    }

    async function stopUpiCredentialMembershipCheck() {
      batchStopRequested = true;
      const current = await getStoredResults();
      const next = await saveResults({
        ...current,
        running: false,
        stoppedAt: new Date().toISOString(),
        flowStage: current.flowStage,
        flowStageEmail: current.flowStageEmail,
      });
      return next;
    }

    return {
      checkUpiCredentialMembershipBatch,
      checkUpiCredentialMembershipOne,
      deleteUpiCredentialMembershipCredentials,
      deleteUpiCredentialMembershipCheckResults,
      exportUpiCredentialMembershipCheckResults,
      fillUpiCredentialMembershipFreeAccessTokens,
      getUpiCredentialMembershipCredentialPool,
      getUpiCredentialMembershipCheckResults: getStoredResults,
      checkUpiCredentialMembershipTrialEligibility,
      identifyUpiCredentialMembershipFreePlus: plusVerificationIdentifyFreePlus,
      importUpiCredentialMembershipFreeResults,
      loginUpiCredentialMembershipAccount,
      moveUpiCredentialMembershipAccountGroup,
      pruneIneligibleFreeUpiCredentialMembership,
      redeemUpiCredentialMembershipFree,
      retryFailedUpiRedeemCdkey,
      stopUpiCredentialMembershipCheck,
      stopUpiCredentialMembershipRedeem,
      upsertTrialEligibleFreeCredential,
      verifyUpiCredentialMembershipPlus: plusVerificationVerifyPlus,
    };
  }

  return {
    BACKUP_STORAGE_KEY,
    DEFAULT_TOTP_API_BASE_URL,
    RESULTS_STORAGE_KEY,
    buildCredentialRowsFromBackupMap,
    buildResultExportRows,
    classifySubscriptionResult,
    createUpiCredentialMembershipChecker,
    generateTotpCode,
    normalizeResultsPayload,
    normalizeTotpApiBaseUrl,
    parseCredentialBackupText,
  };
});
