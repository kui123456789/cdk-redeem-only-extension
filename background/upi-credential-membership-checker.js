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

  function buildResultExportRows(results = {}, status = 'paid', channel = '', emails = []) {
    return getMembershipResultStateHelper('buildResultExportRows')(results, status, channel, emails);
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

    async function redeemUpiCredentialMembershipFreeLegacy(input = {}) {
      if (batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (redeemRunning) {
        throw new Error('UPI 无会员账号补兑正在运行，请等待完成或先停止。');
      }
      if (typeof redeemUpiCredentialWithAccessToken !== 'function') {
        throw new Error('UPI 无会员账号补兑能力尚未接入。');
      }

      redeemRunning = true;
      redeemStopRequested = false;
      try {
      const startedAt = new Date().toISOString();
      let redeemCompleted = 0;
      let currentResults = await getStoredResults();
      const requestedCredentials = resolveInputCredentials(input)
        .filter((credential) => credential.email);
      let items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
      const source = normalizeString(input.source || currentResults.source || 'free-selected');
      const deleteBackups = input.deleteBackups !== false;
      const deletionStatePatch = buildRedeemDeletionStatePatch(currentResults);
      const redeemAutoDeletedEmailsForBackupCleanup = [];
      const runtimeSettings = sanitizeUpiRedeemRuntimeSettings(input.settings);
      const configuredRoundCount = normalizeFailedAccountRetryLimit(
        getUpiRedeemStateValue(runtimeSettings, 'upiRedeemFailedAccountRetryLimit'),
        DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT
      );
      const redeemFailureLimit = getRedeemTotalRoundLimit(configuredRoundCount);
      const credentials = filterRedeemableCredentialsForCurrentResults(requestedCredentials, {
        ...currentResults,
        items,
      });
      const skippedCompletedCount = Math.max(0, requestedCredentials.length - credentials.length);

      try {
        if (skippedCompletedCount) {
          await addLog(`UPI 无会员补兑：已跳过 ${skippedCompletedCount} 个重载前已处理账号，只继续未完成账号。`, 'info');
        }
        if (credentials.length) {
          if (typeof setState === 'function' && Object.keys(runtimeSettings).length) {
            await setState(runtimeSettings).catch(() => {});
          }
          await assertUpiRedeemSettingsReadyForMembershipRedeem(credentials, runtimeSettings);
        }

        currentResults = await saveResults({
          ...currentResults,
          items,
          redeeming: true,
          redeemStartedAt: startedAt,
          redeemUpdatedAt: startedAt,
          redeemFinishedAt: '',
          redeemStoppedAt: '',
          flowStage: 'import',
          flowStageEmail: '',
          redeemTotal: credentials.length,
          redeemCompleted: 0,
          source,
          ...deletionStatePatch,
        });

        if (!credentials.length) {
          const finishedAt = new Date().toISOString();
          return await saveResults({
            ...currentResults,
            redeeming: false,
            redeemUpdatedAt: finishedAt,
            redeemFinishedAt: finishedAt,
            redeemTotal: 0,
            redeemCompleted: 0,
            flowStage: '',
            flowStageEmail: '',
            ...deletionStatePatch,
          });
        }

        await addLog(`UPI 无会员补兑：开始处理 ${credentials.length} 个账号。`, 'info');
        for (let index = 0; index < credentials.length; index += 1) {
          throwIfStopped();
          if (redeemStopRequested) break;

          const credential = credentials[index];
          const throwIfStopRequested = () => throwIfMembershipStopRequested('redeem');
          const checkedAt = new Date().toISOString();
          const existingItem = items.find((item) => normalizeEmail(item?.email) === normalizeEmail(credential.email)) || {};
          const resetPreSubmitBlockedFailure = isPreSubmitUpiRedeemBlockedResultItem(existingItem);
          const baseItem = {
            ...existingItem,
            ...credential,
            status: 'free',
            planType: 'free',
            checkedAt,
            ...(resetPreSubmitBlockedFailure ? {
              reason: 'Free 分组账号，可提交 CDK 兑换',
              redeemStatus: '',
              redeemReason: '',
              redeemFailureCount: 0,
              redeemLastFailedAt: '',
              upiRedeemCdkey: '',
            } : {}),
          };
          const updateRedeemStage = async (stage, reason = '') => {
            throwIfStopRequested();
            if (reason) {
              items = upsertResultItem(items, {
                ...baseItem,
                redeemStatus: 'running',
                redeemReason: reason,
              });
            }
            currentResults = await saveResults({
              ...currentResults,
              items,
              redeeming: true,
              redeemUpdatedAt: new Date().toISOString(),
              redeemTotal: credentials.length,
              redeemCompleted,
              source,
              flowStage: stage,
              flowStageEmail: credential.email,
            });
            throwIfStopRequested();
          };

          items = upsertResultItem(items, {
            ...baseItem,
            redeemStatus: 'running',
            redeemReason: '正在登录并准备兑换',
          });
          currentResults = await saveResults({
            ...currentResults,
            items,
            redeeming: true,
            redeemUpdatedAt: checkedAt,
            redeemTotal: credentials.length,
            redeemCompleted,
            source,
            flowStage: 'open-chatgpt',
            flowStageEmail: credential.email,
          });

          let attemptedUpiRedeemCdkey = '';
          try {
            throwIfStopRequested();
            if (!credential.password) {
              throw new Error('缺少 GPT 密码');
            }
            if (!credential.totpMfaSecret) {
              throw new Error('缺少 2FA 密钥');
            }
            const session = await loginAndReadAccessToken(credential, currentResults, {
              onStage: async (stage) => updateRedeemStage(stage, {
                'open-chatgpt': '正在打开 ChatGPT 官网',
                login: '正在登录邮箱密码',
                totp: '正在提交 2FA 验证',
                token: '正在读取 ChatGPT session',
              }[stage] || '正在登录并准备兑换'),
              throwIfStopRequested,
            });
            throwIfStopRequested();
            if (!hasChatGptSessionPayload(session.session || session)) {
              throw new Error('未读取到 ChatGPT session');
            }

            if (session.accessToken) {
              await updateRedeemStage('subscription-check', '正在查询会员资格');
              const currentSubscription = await checkCredentialPaidSubscription({
                state: currentResults,
                credential,
                accessToken: session.accessToken,
                throwIfStopRequested,
              });
              throwIfStopRequested();
              if (currentSubscription.status === 'paid') {
                await updateRedeemStage('confirm-plus', '正在确认 Plus/Pro/Team 会员');
                const redeemSuccessAt = new Date().toISOString();
                redeemCompleted += 1;
                items = upsertResultItem(items, {
                  ...baseItem,
                  status: 'paid',
                  planType: currentSubscription.planType,
                  reason: currentSubscription.reason || `已开通 ${currentSubscription.planType}`,
                  checkedAt: redeemSuccessAt,
                  accessToken: session.accessToken,
                  accessTokenMasked: maskAccessToken(session.accessToken),
                  redeemStatus: 'skipped',
                  redeemReason: '重新核验已是会员，未消耗 CDK',
                  redeemFailureCount: 0,
                  redeemLastFailedAt: '',
                  upiRedeemCdkey: '',
                  redeemSuccessAt,
                  upiRedeemSubscriptionCheckedAt: redeemSuccessAt,
                  membershipOverrideStatus: '',
                  membershipOverrideCheckedAt: '',
                });
                currentResults = await saveResults({
                  ...currentResults,
                  items,
                  redeeming: true,
                  redeemUpdatedAt: new Date().toISOString(),
                  redeemTotal: credentials.length,
                  redeemCompleted,
                  source,
                });
                await addLog(`UPI 无会员补兑：${credential.email} 重新核验已是会员，跳过 CDK 兑换。`, 'ok');
                continue;
              }
            } else {
              await addLog(`UPI 无会员补兑：${credential.email} 已读取完整 ChatGPT session，但没有 token 摘要，跳过本地会员预核验，直接提交远端兑换。`, 'warn');
            }

            const runtimeStateForCdkey = await getFreshUpiRedeemRuntimeState({
              ...input,
              settings: runtimeSettings,
            });
            attemptedUpiRedeemCdkey = pickRandomUpiRedeemCdkey(getAvailableUpiRedeemCdkeys(runtimeStateForCdkey));
            if (!attemptedUpiRedeemCdkey) {
              throw new Error('CDK 不足');
            }
            await updateRedeemStage('upi-redeem-plus', `正在使用 CDK 兑换 Plus：${attemptedUpiRedeemCdkey}`);
            throwIfStopRequested();
            const redeemResult = await redeemUpiCredentialWithAccessToken({
              state: {
                ...currentResults,
                ...runtimeSettings,
                visibleStep: 7,
              },
              credential,
              session: session.session || session,
              accessToken: session.accessToken,
              forceCdkey: attemptedUpiRedeemCdkey,
              skipEligibilityCheck: true,
              deferSubscriptionConfirmation: true,
            });
            attemptedUpiRedeemCdkey = normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey || attemptedUpiRedeemCdkey);
            throwIfStopRequested();
            if (redeemResult?.duplicateCdkeyRejected === true) {
              redeemCompleted += 1;
              const duplicateReason = redeemResult.reason || 'CDK 已重复提交，当前账号未提交成功；本账号本轮结束，切换下一个账号。';
              const duplicateFailedAt = new Date().toISOString();
              const duplicateFailureCount = normalizeRetryCount(baseItem.redeemFailureCount) + 1;
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: duplicateReason,
                accessToken: session.accessToken,
                accessTokenMasked: maskAccessToken(session.accessToken),
                redeemStatus: 'failed',
                redeemReason: duplicateReason,
                redeemFailureCount: duplicateFailureCount,
                redeemFailureLimit,
                redeemLastFailedAt: duplicateFailedAt,
                lastFailedUpiRedeemCdkey: attemptedUpiRedeemCdkey,
                upiRedeemCdkey: '',
                upiRedeemSubscriptionCheckedAt: '',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: true,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
              });
              await addLog(`UPI 无会员补兑：${credential.email} -> 重复 CDK 未提交当前账号，本账号本轮结束，切换下一个账号。`, 'warn');
              continue;
            }
            await updateRedeemStage('confirm-plus', '正在确认 Plus/Pro/Team 会员');
            const redeemedSubscription = classifyRedeemResult(redeemResult);
            if (redeemResult.pendingRemoteConfirmation === true) {
              redeemCompleted += 1;
              const pendingReason = redeemResult.reason || 'CDK 已提交，等待远端系统返回最终结果';
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: pendingReason,
                accessToken: session.accessToken,
                accessTokenMasked: maskAccessToken(session.accessToken),
                redeemStatus: 'submitted',
                redeemReason: pendingReason,
                redeemFailureCount: normalizeRetryCount(baseItem.redeemFailureCount),
                redeemLastFailedAt: baseItem.redeemLastFailedAt,
                upiRedeemCdkey: normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey),
                upiRedeemSubscriptionCheckedAt: '',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: true,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
              });
              await addLog(`UPI 无会员补兑：${credential.email} 已提交 CDK，等待远端系统返回最终结果，不计入账号失败轮次。`, 'info');
              continue;
            }
            if (!redeemedSubscription.active || !isPaidPlanType(redeemedSubscription.planType)) {
              throw new Error(redeemedSubscription.reason || 'CDK 已提交，但未确认 Plus/Pro/Team 会员。');
            }
            const redeemSuccessAt = getRedeemResultSubscriptionCheckedAt(redeemResult) || new Date().toISOString();
            redeemCompleted += 1;
            items = upsertResultItem(items, {
              ...baseItem,
              status: 'paid',
              planType: redeemedSubscription.planType,
              reason: redeemedSubscription.reason || `已开通 ${redeemedSubscription.planType}`,
              checkedAt: redeemSuccessAt,
              accessToken: session.accessToken,
              accessTokenMasked: maskAccessToken(session.accessToken),
              redeemStatus: 'success',
              redeemReason: 'CDK 兑换成功并已确认会员',
              redeemFailureCount: 0,
              redeemLastFailedAt: '',
              upiRedeemCdkey: normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey),
              redeemSuccessAt,
              upiRedeemSubscriptionCheckedAt: redeemSuccessAt,
              membershipOverrideStatus: '',
              membershipOverrideCheckedAt: '',
            });
            currentResults = await saveResults({
              ...currentResults,
              items,
              redeeming: true,
              redeemUpdatedAt: new Date().toISOString(),
              redeemTotal: credentials.length,
              redeemCompleted,
              source,
            });
            await addLog(`UPI 无会员补兑：${credential.email} 已兑换并确认 ${redeemedSubscription.planType}。`, 'ok');
          } catch (error) {
            if (isMembershipStopError(error)) {
              redeemStopRequested = true;
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: '已停止，未消耗 CDK',
                redeemStatus: 'stopped',
                redeemReason: '已停止，未消耗 CDK',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: false,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage,
                flowStageEmail: currentResults.flowStageEmail || credential.email,
              });
              await addLog(`UPI 无会员补兑：已停止，${credential.email} 未继续兑换。`, 'warn');
              break;
            }
            if (isSessionAccountMismatchError(error)) {
              redeemStopRequested = true;
              const reason = getErrorMessage(error) || '账号登录态不一致，补兑已停止';
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: '账号登录态不一致，补兑已停止',
                redeemStatus: 'stopped',
                redeemReason: `${reason}，未消耗 CDK，后续账号不会继续处理。`,
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: false,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage || 'token',
                flowStageEmail: credential.email,
              });
              await addLog(`UPI 无会员补兑：账号登录态不一致，已停止在 ${credential.email}，后续账号不会继续处理：${reason}`, 'warn');
              break;
            }
            if (isUpiRedeemApiAuthError(error)) {
              redeemStopRequested = true;
              const reason = getErrorMessage(error) || 'UPI 远端接口认证失败，请检查 UPI 外部 API Key。';
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: 'UPI 远端接口拒绝请求，补兑已停止',
                redeemStatus: 'stopped',
                redeemReason: `${reason}；未判定账号失败，未释放或消耗 CDK。`,
                upiRedeemCdkey: attemptedUpiRedeemCdkey,
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: false,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage || 'upi-redeem-plus',
                flowStageEmail: credential.email,
              });
              await addLog(`UPI 无会员补兑：远端接口拒绝请求，已停止在 ${credential.email}，请根据后端返回原因检查 API Key、CDK 或 ChatGPT session：${reason}`, 'error');
              break;
            }
            if (isApproveBlockedError(error)) {
              redeemCompleted += 1;
              const reason = getErrorMessage(error) || 'approve-blocked';
              const failedAt = new Date().toISOString();
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: `${reason}（兑换失败，账号保留在 Free 等待重新匹配 CDK）`,
                redeemStatus: 'failed',
                redeemReason: reason,
                redeemFailureCount: normalizeRetryCount(baseItem.redeemFailureCount) + 1,
                redeemFailureLimit,
                redeemLastFailedAt: failedAt,
                redeemAttemptedAt,
                lastFailedUpiRedeemCdkey: attemptedUpiRedeemCdkey,
                upiRedeemCdkey: '',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: true,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage,
                flowStageEmail: credential.email,
                ...deletionStatePatch,
              });
              await addLog(
                attemptedUpiRedeemCdkey
                  ? `UPI 无会员补兑：${credential.email} -> 后端返回 approve-blocked，旧 CDK ${attemptedUpiRedeemCdkey} 已释放，账号保留在 Free 等待重新匹配：${reason}`
                  : `UPI 无会员补兑：${credential.email} -> 后端返回 approve-blocked，账号保留在 Free 等待重新匹配：${reason}`,
                'warn'
              );
              continue;
            }
            const shortage = isCdkeyExhaustedError(error);
            const reason = shortage ? 'CDK 不足' : getErrorMessage(error);
            if (shortage) {
              redeemStopRequested = true;
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: 'CDK 不足，补兑已停止',
                redeemStatus: 'stopped',
                redeemReason: 'CDK 不足，补兑已停止，未消耗 CDK',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: false,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage || 'upi-redeem-plus',
                flowStageEmail: credential.email,
              });
              await addLog(`UPI 无会员补兑：CDK 不足，已停止在 ${credential.email}，后续账号不会继续处理。`, 'warn');
              break;
            }
            if (!attemptedUpiRedeemCdkey) {
              redeemCompleted += 1;
              const blockedReason = reason || '登录或读取 ChatGPT session 未完成';
              const previousRedeemFailureCount = isPreSubmitUpiRedeemBlockedResultItem(baseItem)
                ? 0
                : normalizeRetryCount(baseItem.redeemFailureCount);
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: `${blockedReason}；未提交 CDK，不计入兑换失败轮次。`,
                redeemStatus: 'blocked',
                redeemReason: `${blockedReason}；未提交 CDK，不计入兑换失败轮次。`,
                redeemFailureCount: previousRedeemFailureCount,
                redeemLastFailedAt: baseItem.redeemLastFailedAt,
                upiRedeemCdkey: '',
              });
              currentResults = await saveResults({
                ...currentResults,
                items,
                redeeming: true,
                redeemUpdatedAt: new Date().toISOString(),
                redeemTotal: credentials.length,
                redeemCompleted,
                source,
                flowStage: currentResults.flowStage,
                flowStageEmail: credential.email,
                ...deletionStatePatch,
              });
              await addLog(
                `UPI 无会员补兑：${credential.email} -> 登录/AT 阻塞，尚未提交 CDK，不计入兑换失败轮次：${blockedReason}`,
                'warn'
              );
              continue;
            }
            redeemCompleted += 1;
            const redeemFailedAt = new Date().toISOString();
            const existingRedeemFailureCount = normalizeRetryCount(baseItem.redeemFailureCount)
              || (normalizeString(baseItem.redeemStatus).toLowerCase() === 'failed' ? 1 : 0);
            const redeemFailureCount = existingRedeemFailureCount + 1;
            const failureLabel = getRedeemRoundLabel(redeemFailureCount, redeemFailureLimit || getRedeemTotalRoundLimit(0));
            items = upsertResultItem(items, {
              ...baseItem,
              status: 'free',
              planType: 'free',
              reason: `${reason || '兑换失败'}（${failureLabel}）`,
              redeemStatus: 'failed',
              redeemReason: reason || '兑换失败',
              redeemFailureCount,
              redeemFailureLimit,
              redeemLastFailedAt: redeemFailedAt,
              lastFailedUpiRedeemCdkey: attemptedUpiRedeemCdkey,
              upiRedeemCdkey: '',
            });
            currentResults = await saveResults({
              ...currentResults,
              items,
              redeeming: true,
              redeemUpdatedAt: new Date().toISOString(),
              redeemTotal: credentials.length,
              redeemCompleted,
              source,
              flowStage: currentResults.flowStage,
              flowStageEmail: credential.email,
              ...deletionStatePatch,
            });
            await addLog(
              `UPI 无会员补兑：${credential.email} -> ${failureLabel}，账号保留在 Free：${reason}`,
              'warn'
            );
          }
        }

        const finishedAt = new Date().toISOString();
        if (deleteBackups && redeemAutoDeletedEmailsForBackupCleanup.length) {
          const stored = await chromeApi.storage.local.get([BACKUP_STORAGE_KEY]).catch(() => ({}));
          const backups = normalizeCredentialBackupMap(stored?.[BACKUP_STORAGE_KEY] || {});
          redeemAutoDeletedEmailsForBackupCleanup.forEach((email) => {
            delete backups[email];
          });
          await chromeApi.storage.local.set({ [BACKUP_STORAGE_KEY]: backups });
        }
        const finalResults = await saveResults({
          ...currentResults,
          items,
          redeeming: false,
          redeemUpdatedAt: finishedAt,
          redeemFinishedAt: redeemStopRequested ? '' : finishedAt,
          redeemStoppedAt: redeemStopRequested ? finishedAt : '',
          redeemTotal: credentials.length,
          redeemCompleted,
          flowStage: redeemStopRequested ? currentResults.flowStage : '',
          flowStageEmail: redeemStopRequested ? currentResults.flowStageEmail : '',
          source,
          ...deletionStatePatch,
        });
        if (redeemStopRequested) {
          await addLog(`UPI 无会员补兑：已停止，已处理 ${finalResults.redeemCompleted}/${finalResults.redeemTotal}。`, 'warn');
        } else {
          await addLog(`UPI 无会员补兑：完成 ${finalResults.redeemCompleted}/${finalResults.redeemTotal}，有会员 ${finalResults.paidCount}，无会员 ${finalResults.freeCount}，失败 ${finalResults.failedCount}。`, 'ok');
        }
        return finalResults;
      } finally {
        redeemRunning = false;
      }
      } finally {
        redeemRunning = false;
      }
    }

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

    async function redeemUpiCredentialMembershipFree(input = {}) {
      if (batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (redeemRunning) {
        throw new Error('UPI Free 账号兑换正在运行，请等待完成或先停止。');
      }
      if (typeof redeemUpiCredentialWithAccessToken !== 'function') {
        throw new Error('UPI Free 账号兑换能力尚未接入。');
      }

      redeemRunning = true;
      redeemStopRequested = false;
      try {
      const startedAt = new Date().toISOString();
      const redeemChannel = normalizeRedeemChannel(input.channel || input.redeemChannel);
      const redeemChannelLabel = getRedeemChannelLabel(redeemChannel);
      let redeemCompleted = 0;
      let currentResults = await getStoredResults();
      const requestedCredentials = resolveInputCredentials(input).filter((credential) => credential.email);
      let items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
      const source = normalizeString(input.source || currentResults.source || 'free-selected');
      const runtimeSettings = sanitizeUpiRedeemRuntimeSettings(input.settings);
      const configuredRoundCount = REDEEM_CHANNEL_FAILURE_LIMIT;
      const totalRoundLimit = getRedeemTotalRoundLimit(configuredRoundCount);
      const lookup = {};
      items.forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (email) lookup[email] = item;
      });
      const rawCandidates = requestedCredentials.length
        ? requestedCredentials.map((credential) => ({ ...(lookup[normalizeEmail(credential.email)] || {}), ...credential }))
        : items.filter((item) => normalizeString(item?.status).toLowerCase() === 'free');
      const freeCandidates = rawCandidates
        .map((credential) => normalizeResultItem({ ...credential, status: credential.status || 'free' }))
        .filter((credential) => credential.email && credential.status === 'free');
      const credentials = filterRedeemableCredentialsForCurrentResults(freeCandidates, {
        ...currentResults,
        items,
      })
        .map((credential) => normalizeResultItem({ ...credential, status: credential.status || 'free' }))
        .filter((credential) => shouldRedeemItemUseChannel(credential, redeemChannel));
      const stats = {
        attempted: 0,
        submitted: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      };
      const attemptedEmailsThisRun = new Set();
      const requestedEmailSet = new Set(requestedCredentials.map((credential) => normalizeEmail(credential?.email)).filter(Boolean));
      const allowGroupContinuation = input.disableGroupContinuation !== true
        && !['free-click', 'free-single'].includes(source);
      const includeFreshContinuation = allowGroupContinuation
        && !['free-upi-to-ideal'].includes(source);
      const continuationTargetEmail = allowGroupContinuation
        ? ''
        : normalizeEmail(requestedCredentials[0]?.email || input.email || input.accountEmail || input.credential?.email || '');
      let redeemTotalTarget = credentials.length;

      const getLatestItem = (email = '') => (
        items.find((item) => normalizeEmail(item?.email) === normalizeEmail(email)) || {}
      );

      const rememberRedeemTotalTarget = (queue = []) => {
        redeemTotalTarget = Math.max(
          redeemTotalTarget,
          redeemCompleted + Math.max(0, Array.isArray(queue) ? queue.length : 0)
        );
      };

      const saveRedeemProgress = async (patch = {}) => {
        const requestedRedeemTotal = Math.max(
          0,
          Math.floor(Number(patch.redeemTotal ?? currentResults.redeemTotal ?? redeemTotalTarget ?? credentials.length) || 0)
        );
        currentResults = await saveResults({
          ...currentResults,
          items,
          redeeming: patch.redeeming !== false,
          redeemUpdatedAt: new Date().toISOString(),
          redeemTotal: Math.max(requestedRedeemTotal, redeemTotalTarget),
          redeemCompleted,
          source,
          flowStage: normalizeFlowStage(patch.flowStage ?? currentResults.flowStage),
          flowStageEmail: normalizeEmail(patch.email ?? currentResults.flowStageEmail),
        });
      };

      const reloadRedeemProgressState = async () => {
        currentResults = await getStoredResults();
        items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
        return currentResults;
      };

      const buildContinuationQueue = () => {
        if (!allowGroupContinuation && !continuationTargetEmail) {
          return [];
        }
        const queue = buildAutoContinuationRedeemCandidates(
          items,
          totalRoundLimit,
          continuationTargetEmail,
          redeemChannel,
          { includeFresh: includeFreshContinuation }
        ).candidates
          .filter((credential) => {
            const email = normalizeEmail(credential?.email);
            if (!email || attemptedEmailsThisRun.has(email)) {
              return false;
            }
            if (!includeFreshContinuation && requestedEmailSet.size && !requestedEmailSet.has(email)) {
              return false;
            }
            return true;
          });
        return filterRedeemableCredentialsForCurrentResults(queue, {
          ...currentResults,
          items,
        })
          .map((credential) => normalizeResultItem({ ...credential, status: credential.status || 'free' }))
          .filter((credential) => shouldRedeemItemUseChannel(credential, redeemChannel));
      };

      const hasActiveRedeemWorkForChannel = (runtimeState = {}, resultItems = items) => {
        const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(runtimeState, redeemChannel));
        const hasActiveUsage = Object.values(usage).some((entry) => (
          entry?.retrying === true
          || isActiveUpiRedeemRemoteStatus(entry?.remoteStatus)
          || isActiveUpiRedeemRemoteStatus(entry?.remoteMessage)
        ));
        if (hasActiveUsage) {
          return true;
        }
        return (Array.isArray(resultItems) ? resultItems : []).some((item) => {
          const itemChannel = normalizeString(item?.redeemChannel || item?.channel || item?.paymentChannel)
            ? normalizeRedeemChannel(item.redeemChannel || item.channel || item.paymentChannel)
            : redeemChannel;
          return itemChannel === redeemChannel
            && normalizeString(item?.status).toLowerCase() === 'free'
            && (
              isActiveUpiRedeemRemoteStatus(item?.redeemStatus)
              || isActiveUpiRedeemRemoteStatus(item?.remoteStatus)
              || isActiveUpiRedeemRemoteStatus(item?.remoteMessage)
            );
        });
      };

      const refreshPendingRedeemStatusesForContinuation = async () => {
        if (typeof refreshPendingUpiCredentialMembershipRedeemStatuses !== 'function') {
          return;
        }
        try {
          await refreshPendingUpiCredentialMembershipRedeemStatuses({
            channel: redeemChannel,
            autoRefresh: true,
            skipAutoRetry: true,
            source: 'free-redeem-continuation',
          });
        } catch (error) {
          await addLog(
            `${redeemChannelLabel} Free 分组 CDK 兑换：刷新远端兑换状态失败，稍后继续等待：${getErrorMessage(error) || error.message || error}`,
            'warn'
          );
        }
      };

      const waitForContinuationCdkey = async (pendingCount = 0) => {
        const startedWaitingAt = Date.now();
        let waitLogged = false;
        while (true) {
          throwIfMembershipStopRequested('redeem');
          await refreshPendingRedeemStatusesForContinuation();
          await reloadRedeemProgressState();
          const latestRuntimeState = await getFreshUpiRedeemRuntimeState({
            ...input,
            settings: runtimeSettings,
          });
          const availableCdkeys = getAvailableUpiRedeemCdkeys(latestRuntimeState, redeemChannel);
          if (availableCdkeys.length) {
            return { ok: true, availableCount: availableCdkeys.length };
          }
          const nextQueue = buildContinuationQueue();
          if (!nextQueue.length) {
            return { ok: false, reason: 'no-candidates' };
          }
          if (!hasActiveRedeemWorkForChannel(latestRuntimeState, items)) {
            return { ok: false, reason: 'no-active-work', pendingCount: nextQueue.length };
          }
          const waitedMs = Date.now() - startedWaitingAt;
          if (waitedMs >= REDEEM_GROUP_CONTINUATION_IDLE_TIMEOUT_MS) {
            return { ok: false, reason: 'timeout', pendingCount: nextQueue.length };
          }
          if (!waitLogged) {
            const waitSeconds = Math.max(1, Math.round(REDEEM_GROUP_CONTINUATION_IDLE_WAIT_MS / 1000));
            await addLog(
              `${redeemChannelLabel} Free 分组 CDK 兑换：当前没有可用 CDK，仍有 ${pendingCount || nextQueue.length} 个后续账号；将每 ${waitSeconds} 秒刷新远端状态，等待 CDK 回池后继续。`,
              'warn'
            );
            waitLogged = true;
          }
          rememberRedeemTotalTarget(nextQueue);
          await saveRedeemProgress({ flowStage: 'upi-redeem-plus', email: '', redeemTotal: redeemTotalTarget });
          await sleepWithStop(REDEEM_GROUP_CONTINUATION_IDLE_WAIT_MS);
        }
      };

      try {
        if (credentials.length) {
          if (typeof setState === 'function' && Object.keys(runtimeSettings).length) {
            await setState(runtimeSettings).catch(() => {});
          }
          const latestRuntimeState = await getFreshUpiRedeemRuntimeState({
            ...input,
            settings: runtimeSettings,
          });
          if (!normalizeString(getUpiRedeemStateValue(latestRuntimeState, 'upiRedeemExternalApiKey'))) {
            throw new Error('第 7 步 CDK 兑换 Plus 未配置：缺少 UPI 外部 API Key。');
          }
          const availableCdkeys = getAvailableUpiRedeemCdkeys(latestRuntimeState, redeemChannel);
          if (availableCdkeys.length > 0 && credentials.length > availableCdkeys.length) {
            await addLog(
              `${redeemChannelLabel} Free 分组 CDK 兑换：当前可用 CDK ${availableCdkeys.length} 个，待兑换账号 ${credentials.length} 个；本轮按 ${availableCdkeys.length} 个 CDK 槽位处理，失败释放槽位并补后续账号。`,
              'warn'
            );
          }
          if (!availableCdkeys.length) {
            await addLog(`${redeemChannelLabel} Free 分组 CDK 兑换：没有可用 CDK，本批未开始；账号保持待兑换。`, 'warn');
          }
        }

        currentResults = await saveResults({
          ...currentResults,
          items,
          redeeming: true,
          redeemStartedAt: startedAt,
          redeemUpdatedAt: startedAt,
          redeemFinishedAt: '',
          redeemStoppedAt: '',
          flowStage: 'import',
          flowStageEmail: '',
          redeemTotal: credentials.length,
          redeemCompleted: 0,
          source,
        });

        if (!credentials.length) {
          const finishedAt = new Date().toISOString();
          return await saveResults({
            ...currentResults,
            redeeming: false,
            redeemUpdatedAt: finishedAt,
            redeemFinishedAt: finishedAt,
            redeemTotal: 0,
            redeemCompleted: 0,
            flowStage: '',
            flowStageEmail: '',
          });
        }

        let roundQueue = credentials;
        let continuationBatchNumber = 1;
        rememberRedeemTotalTarget(roundQueue);
        await addLog(
          `${redeemChannelLabel} Free 分组 CDK 兑换：开始处理 ${credentials.length} 个账号；配置总轮数 ${configuredRoundCount}，实际总轮数 ${totalRoundLimit}。`,
          'info'
        );

        while (roundQueue.length) {
          let stoppedForCdkey = false;
          for (let roundNumber = 1; roundNumber <= totalRoundLimit && roundQueue.length; roundNumber += 1) {
            throwIfMembershipStopRequested('redeem');
            const roundState = await getFreshUpiRedeemRuntimeState({
              ...input,
              settings: runtimeSettings,
            });
            const roundCdkeys = getAvailableUpiRedeemCdkeys(roundState, redeemChannel);
            if (!roundCdkeys.length) {
              stoppedForCdkey = true;
              await addLog(
                `${redeemChannelLabel} Free 分组 CDK 兑换：第 ${roundNumber}/${totalRoundLimit} 轮没有可用 CDK，剩余账号保持待兑换，准备刷新远端状态后续兑。`,
                'warn'
              );
              break;
            }

          const failedEmailsThisRound = [];
          const roundTotal = roundQueue.length;
          let roundAttempted = 0;
          await addLog(
            `${redeemChannelLabel} Free 分组 CDK 兑换：开始第 ${roundNumber}/${totalRoundLimit} 轮，账号 ${roundTotal} 个，CDK 槽位 ${roundCdkeys.length} 个。`,
            'info'
          );
          await saveRedeemProgress({ flowStage: 'upi-redeem-plus', email: '', redeemTotal: roundTotal });

          for (const credential of roundQueue) {
            throwIfMembershipStopRequested('redeem');
            const email = normalizeEmail(credential.email);
            const existingItem = getLatestItem(email);
            const baseItem = normalizeResultItem({
              ...existingItem,
              ...credential,
              email,
              status: 'free',
              planType: 'free',
            });
            const accessToken = normalizeString(baseItem.accessToken);
            if (!accessToken) {
              const reason = '缺少 AT，请先点击“一键补充 AT”。';
              stats.skipped += 1;
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason,
                redeemStatus: 'blocked',
                redeemReason: reason,
                redeemFailureLimit: totalRoundLimit,
                upiRedeemCdkey: '',
              });
              await saveRedeemProgress({ flowStage: 'upi-redeem-plus', email, redeemTotal: roundTotal });
              await addLog(`UPI Free 分组 CDK 兑换：${email} -> 跳过：${reason}`, 'warn');
              continue;
            }

            const runtimeStateForCdkey = await getFreshUpiRedeemRuntimeState({
              ...input,
              settings: runtimeSettings,
            });
            const availableCdkeys = getAvailableUpiRedeemCdkeys(runtimeStateForCdkey, redeemChannel);
            const attemptedUpiRedeemCdkey = pickRandomUpiRedeemCdkey(availableCdkeys);
            if (!attemptedUpiRedeemCdkey) {
              stoppedForCdkey = true;
              await addLog(
                `${redeemChannelLabel} Free 分组 CDK 兑换：第 ${roundNumber}/${totalRoundLimit} 轮暂时没有可用 CDK，剩余账号保持待兑换，准备刷新远端状态后续兑。`,
                'warn'
              );
              break;
            }

            const redeemAttemptedAt = new Date().toISOString();
            const roundLabel = getRedeemRoundLabel(roundNumber, totalRoundLimit);
            items = upsertResultItem(items, {
              ...baseItem,
              status: 'free',
              planType: 'free',
              reason: `${roundLabel}：已绑定 CDK，正在提交`,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              redeemStatus: 'running',
              redeemReason: `${roundLabel}：${attemptedUpiRedeemCdkey}`,
              redeemAttemptedAt,
              redeemFailureLimit: totalRoundLimit,
              upiRedeemCdkey: attemptedUpiRedeemCdkey,
              redeemChannel,
            });
            await saveRedeemProgress({ flowStage: 'upi-redeem-plus', email, redeemTotal: roundTotal });
            await addLog(`${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${roundLabel} 随机选择 CDK ${attemptedUpiRedeemCdkey}。`, 'info');

            let attemptCounted = false;
            try {
              const redeemResult = await redeemUpiCredentialWithAccessToken({
                state: {
                  ...currentResults,
                  ...runtimeSettings,
                  visibleStep: 7,
                },
                credential: baseItem,
                session: { accessToken },
                accessToken,
                forceCdkey: attemptedUpiRedeemCdkey,
                channel: redeemChannel,
                skipEligibilityCheck: true,
                deferSubscriptionConfirmation: true,
              });
              const submittedCdkey = normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey || attemptedUpiRedeemCdkey);
              if (redeemResult?.duplicateCdkeyRejected === true) {
                throw new Error(redeemResult.reason || 'CDK 重复提交，当前账号本轮未提交成功。');
              }
              roundAttempted += 1;
              redeemCompleted += 1;
              stats.attempted += 1;
              attemptCounted = true;
              attemptedEmailsThisRun.add(email);
              if (redeemResult.pendingRemoteConfirmation === true) {
                const pendingReason = normalizeString(redeemResult.reason)
                  || 'CDK 已提交，等待远端系统返回最终结果';
                stats.submitted += 1;
                items = upsertResultItem(items, {
                  ...baseItem,
                  status: 'free',
                  planType: 'free',
                  reason: pendingReason,
                  accessToken,
                  accessTokenMasked: maskAccessToken(accessToken),
                  redeemStatus: 'submitted',
                  redeemReason: pendingReason,
                  redeemFailureLimit: totalRoundLimit,
                  redeemAttemptedAt,
                  upiRedeemCdkey: submittedCdkey,
                  redeemChannel,
                });
                await saveRedeemProgress({ flowStage: 'upi-redeem-plus', email, redeemTotal: roundTotal });
                await addLog(`${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${submittedCdkey} 已提交到远端，等待最终会员结果。`, 'ok');
                continue;
              }

              await saveRedeemProgress({ flowStage: 'confirm-plus', email, redeemTotal: roundTotal });
              const redeemedSubscription = classifyRedeemResult(redeemResult);
              if (!redeemedSubscription.active || !isPaidPlanType(redeemedSubscription.planType)) {
                throw new Error(redeemedSubscription.reason || 'CDK 已提交，但未确认 Plus/Pro/Team 会员。');
              }
              const redeemSuccessAt = getRedeemResultSubscriptionCheckedAt(redeemResult) || new Date().toISOString();
              stats.succeeded += 1;
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'paid',
                planType: redeemedSubscription.planType,
                reason: redeemedSubscription.reason || `已开通 ${redeemedSubscription.planType}`,
                checkedAt: redeemSuccessAt,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: 'success',
                redeemReason: 'CDK 兑换成功并已确认会员',
                redeemFailureCount: 0,
                upiRedeemFailureCount: 0,
                idealRedeemFailureCount: 0,
                ...buildRedeemAccountUnlockedPatch(),
                redeemFailureLimit: totalRoundLimit,
                redeemLastFailedAt: '',
                redeemAttemptedAt,
                redeemSuccessAt,
                upiRedeemCdkey: submittedCdkey,
                redeemChannel,
                upiRedeemSubscriptionCheckedAt: redeemSuccessAt,
                membershipOverrideStatus: '',
                membershipOverrideCheckedAt: '',
              });
              await saveRedeemProgress({ flowStage: 'confirm-plus', email, redeemTotal: roundTotal });
              await addLog(`${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${submittedCdkey} 已兑换并确认 ${redeemedSubscription.planType}。`, 'ok');
            } catch (error) {
              if (isMembershipStopError(error)) {
                redeemStopRequested = true;
                items = upsertResultItem(items, {
                  ...baseItem,
                  status: 'free',
                  planType: 'free',
                  reason: '已停止，未继续兑换',
                  redeemStatus: 'stopped',
                  redeemReason: '已停止，未继续兑换',
                  redeemAttemptedAt,
                  upiRedeemCdkey: attemptedUpiRedeemCdkey,
                  redeemChannel,
                });
                break;
              }
              const authError = isUpiRedeemApiAuthError(error);
              const reason = getErrorMessage(error) || '兑换失败';
              const redeemFailedAt = new Date().toISOString();
              const failurePatch = authError
                ? {
                  redeemFailureCount: getRedeemChannelFailureCount(baseItem, redeemChannel),
                  redeemFailureLimit: totalRoundLimit,
                }
                : buildRedeemChannelFailurePatch(baseItem, redeemChannel, {
                  reason,
                  failedAt: redeemFailedAt,
                });
              const channelFailureCount = getRedeemChannelFailureCount(failurePatch, redeemChannel);
              const reachedUpiDailyLimit = !authError
                && redeemChannel === 'upi'
                && isRedeemChannelDailyLimitReason(reason);
              const reachedIdealLock = !authError
                && redeemChannel === 'ideal'
                && channelFailureCount >= REDEEM_CHANNEL_FAILURE_LIMIT;
              if (!attemptCounted) {
                roundAttempted += 1;
                redeemCompleted += 1;
                stats.attempted += 1;
                attemptedEmailsThisRun.add(email);
              }
              if (authError) {
                redeemStopRequested = true;
              } else {
                stats.failed += 1;
                failedEmailsThisRound.push(email);
              }
              items = upsertResultItem(items, {
                ...baseItem,
                status: 'free',
                planType: 'free',
                reason: authError
                  ? 'UPI 远端接口拒绝请求，已停止整批兑换'
                  : reachedIdealLock
                    ? getRedeemLockReason(failurePatch)
                    : reachedUpiDailyLimit
                      ? `${reason}（UPI 今日提交次数已达上限，已转入 IDEAL 候选）`
                    : `${reason}（${roundLabel}）`,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: authError ? 'stopped' : 'failed',
                redeemReason: reason,
                ...failurePatch,
                redeemLastFailedAt: authError ? baseItem.redeemLastFailedAt : redeemFailedAt,
                redeemAttemptedAt,
                lastFailedUpiRedeemCdkey: authError ? baseItem.lastFailedUpiRedeemCdkey : attemptedUpiRedeemCdkey,
                upiRedeemCdkey: authError ? attemptedUpiRedeemCdkey : '',
                redeemChannel,
              });
              await saveRedeemProgress({
                flowStage: 'upi-redeem-plus',
                email,
                redeemTotal: roundTotal,
                redeeming: !redeemStopRequested,
              });
              await addLog(
                authError
                  ? `${redeemChannelLabel} Free 分组 CDK 兑换：远端接口拒绝请求，已停止在 ${email}；请检查 External API Key 或后端外部兑换接口 CSRF/API Key 配置：${reason}`
                  : reachedIdealLock
                    ? `${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${attemptedUpiRedeemCdkey} 失败，IDEAL 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次，账号已封存，不再使用：${reason}`
                    : reachedUpiDailyLimit
                      ? `${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${attemptedUpiRedeemCdkey} 明确返回今日提交次数上限，已转入 IDEAL 候选：${reason}`
                    : `${redeemChannelLabel} Free 分组 CDK 兑换：${email} -> ${attemptedUpiRedeemCdkey} 失败，释放 CDK 并切换下一个账号：${reason}`,
                authError ? 'error' : 'warn'
              );
              if (redeemStopRequested) {
                break;
              }
            }
          }

          await addLog(
            `${redeemChannelLabel} Free 分组 CDK 兑换：第 ${roundNumber}/${totalRoundLimit} 轮结束，尝试 ${roundAttempted}/${roundTotal} 个账号。`,
            'info'
          );
          if (redeemStopRequested || stoppedForCdkey || roundNumber >= totalRoundLimit) {
            break;
          }
          roundQueue = failedEmailsThisRound
            .map((email) => normalizeResultItem(getLatestItem(email)))
            .filter((item) => isRetryableUpiRedeemRoundResultItem(item, totalRoundLimit, redeemChannel));
          if (!roundQueue.length) {
            break;
          }
          await addLog(
            `${redeemChannelLabel} Free 分组 CDK 兑换：准备第 ${roundNumber + 1}/${totalRoundLimit} 轮，仅处理上一轮失败账号 ${roundQueue.length} 个。`,
            'info'
          );
        }

          if (redeemStopRequested || !allowGroupContinuation) {
            break;
          }

          await reloadRedeemProgressState();
          let continuationQueue = buildContinuationQueue();
          if (!continuationQueue.length) {
            break;
          }

          let latestRuntimeState = await getFreshUpiRedeemRuntimeState({
            ...input,
            settings: runtimeSettings,
          });
          if (!getAvailableUpiRedeemCdkeys(latestRuntimeState, redeemChannel).length) {
            const waitResult = await waitForContinuationCdkey(continuationQueue.length);
            await reloadRedeemProgressState();
            continuationQueue = buildContinuationQueue();
            latestRuntimeState = await getFreshUpiRedeemRuntimeState({
              ...input,
              settings: runtimeSettings,
            });
            if (!waitResult.ok || !continuationQueue.length || !getAvailableUpiRedeemCdkeys(latestRuntimeState, redeemChannel).length) {
              const reasonText = waitResult.reason === 'timeout'
                ? `等待 CDK 回池超时，剩余 ${waitResult.pendingCount || continuationQueue.length} 个后续账号保持待兑换`
                : waitResult.reason === 'no-active-work'
                  ? `当前没有可用 CDK，且没有等待远端结果的 ${redeemChannelLabel} 任务，剩余账号保持待兑换`
                  : '没有可继续兑换的后续账号';
              await addLog(`${redeemChannelLabel} Free 分组 CDK 兑换：${reasonText}。`, 'warn');
              break;
            }
          }

          continuationBatchNumber += 1;
          roundQueue = continuationQueue;
          rememberRedeemTotalTarget(roundQueue);
          await addLog(
            `${redeemChannelLabel} Free 分组 CDK 兑换：继续第 ${continuationBatchNumber} 批后续账号 ${roundQueue.length} 个。`,
            'info'
          );
        }

        const finishedAt = new Date().toISOString();
        const finalResults = await saveResults({
          ...currentResults,
          items,
          redeeming: false,
          redeemUpdatedAt: finishedAt,
          redeemFinishedAt: redeemStopRequested ? '' : finishedAt,
          redeemStoppedAt: redeemStopRequested ? finishedAt : '',
          redeemTotal: Math.max(redeemCompleted, redeemTotalTarget, credentials.length),
          redeemCompleted,
          flowStage: redeemStopRequested ? currentResults.flowStage : '',
          flowStageEmail: redeemStopRequested ? currentResults.flowStageEmail : '',
          source,
        });
        await addLog(
          redeemStopRequested
            ? `${redeemChannelLabel} Free 分组 CDK 兑换：已停止，已尝试 ${stats.attempted} 次，等待 ${stats.submitted}，成功 ${stats.succeeded}，失败 ${stats.failed}。`
            : `${redeemChannelLabel} Free 分组 CDK 兑换：完成，已尝试 ${stats.attempted} 次，等待 ${stats.submitted}，成功 ${stats.succeeded}，失败 ${stats.failed}，跳过 ${stats.skipped}。`,
          redeemStopRequested ? 'warn' : 'ok'
        );
        return finalResults;
      } finally {
        redeemRunning = false;
      }
      } finally {
        redeemRunning = false;
      }
    }

    async function identifyUpiCredentialMembershipFreePlus(input = {}) {
      if (batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (redeemRunning || cdkeyRetryRunning) {
        throw new Error('UPI Free 账号兑换/CDK 重试正在运行，请等待完成或先停止。');
      }
      if (typeof checkUpiRedeemSubscriptionStatuses !== 'function') {
        throw new Error('UPI 会员状态查询能力尚未接入。');
      }

      batchRunning = true;
      batchStopRequested = false;
      const startedAt = new Date().toISOString();
      let currentResults = await getStoredResults();
      const requestedCredentials = resolveInputCredentials(input).filter((credential) => credential.email);
      let items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
      const lookup = {};
      items.forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (email) lookup[email] = item;
      });
      const rawCandidates = requestedCredentials.length
        ? requestedCredentials.map((credential) => ({ ...(lookup[normalizeEmail(credential.email)] || {}), ...credential }))
        : items;
      const credentials = rawCandidates
        .map((credential) => normalizeResultItem({ ...credential, status: credential.status || 'free' }))
        .filter((credential) => credential.email && credential.status === 'free' && credential.accessToken);
      const paid = [];
      const free = [];
      const failed = [];
      const skipped = [];
      const source = normalizeString(input.source || currentResults.source || 'free-identify-plus');

      const saveProgress = async (stage = 'subscription-check', email = '') => {
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: true,
          updatedAt: new Date().toISOString(),
          flowStage: stage,
          flowStageEmail: normalizeEmail(email),
          source,
          total: credentials.length,
          completed: paid.length + free.length + failed.length + skipped.length,
        });
      };

      try {
        if (!credentials.length) {
          const finishedAt = new Date().toISOString();
          return {
            results: await saveResults({
              ...currentResults,
              items,
              running: false,
              updatedAt: finishedAt,
              finishedAt,
              flowStage: '',
              flowStageEmail: '',
              source,
            }),
            paid,
            free,
            failed,
            skipped,
          };
        }

        const runtimeState = normalizeSubscriptionRuntimeState({
          ...(typeof getState === 'function' ? await getState().catch(() => ({})) : {}),
          ...(input.settings || {}),
        });
        await addLog(`UPI Free 分组识别 Plus：开始用已保存 AT 查询 ${credentials.length} 个账号。`, 'info');

        for (const credential of credentials) {
          throwIfMembershipStopRequested('check');
          const email = normalizeEmail(credential.email);
          const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
          const activeCredential = normalizeResultItem({
            ...existingItem,
            ...credential,
            email,
            status: 'free',
            planType: 'free',
          });
          const accessToken = normalizeString(activeCredential.accessToken);
          const checkedAt = new Date().toISOString();
          if (!accessToken) {
            const reason = '缺少 AT，请先点击“一键补充 AT”。';
            skipped.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              planType: 'free',
              reason,
              upiRedeemSubscriptionCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Free 分组识别 Plus：${email} -> 跳过：${reason}`, 'warn');
            continue;
          }

          try {
            await saveProgress('subscription-check', email);
            const subscription = await checkCredentialPaidSubscription({
              state: {
                ...runtimeState,
                ...currentResults,
              },
              credential: activeCredential,
              accessToken,
              throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
            });
            const reason = subscription.reason || '订阅 API 已返回会员状态';
            if (subscription.status === 'paid' && isPaidPlanType(subscription.planType)) {
              const shouldMarkRedeemSuccess = Boolean(
                normalizeString(activeCredential.upiRedeemCdkey)
                || normalizeString(activeCredential.redeemAttemptedAt)
                || normalizeString(activeCredential.redeemStatus).toLowerCase() === 'submitted'
              );
              paid.push({ email, planType: subscription.planType, reason });
              items = upsertResultItem(items, {
                ...activeCredential,
                status: 'paid',
                planType: subscription.planType,
                reason,
                checkedAt,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                accessTokenUpdatedAt: activeCredential.accessTokenUpdatedAt || checkedAt,
                upiRedeemSubscriptionCheckedAt: checkedAt,
                redeemStatus: shouldMarkRedeemSuccess ? 'success' : '',
                redeemReason: shouldMarkRedeemSuccess ? '订阅 API 已确认会员' : '',
                redeemFailureCount: 0,
                redeemLastFailedAt: '',
                redeemSuccessAt: shouldMarkRedeemSuccess ? checkedAt : activeCredential.redeemSuccessAt,
                membershipOverrideStatus: '',
                membershipOverrideCheckedAt: '',
              });
              await saveProgress('subscription-check', email);
              await addLog(`UPI Free 分组识别 Plus：${email} -> 已确认 ${subscription.planType}，移入 Plus 组。`, 'ok');
              continue;
            }

            free.push({ email, planType: subscription.planType || 'free', reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              ...buildFreeMembershipOverrideFields(checkedAt),
              reason,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              accessTokenUpdatedAt: activeCredential.accessTokenUpdatedAt || checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Free 分组识别 Plus：${email} -> 仍为 Free：${reason}`, 'info');
          } catch (error) {
            if (isMembershipStopError(error)) {
              batchStopRequested = true;
              break;
            }
            const reason = getErrorMessage(error) || 'Plus 识别失败';
            failed.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              planType: 'free',
              reason: `Plus 识别失败：${reason}`,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              upiRedeemSubscriptionCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Free 分组识别 Plus：${email} -> 失败：${reason}`, 'warn');
          }
        }

        const finishedAt = new Date().toISOString();
        const finalResults = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt: batchStopRequested ? currentResults.finishedAt : finishedAt,
          stoppedAt: batchStopRequested ? finishedAt : currentResults.stoppedAt,
          flowStage: batchStopRequested ? currentResults.flowStage : '',
          flowStageEmail: batchStopRequested ? currentResults.flowStageEmail : '',
          source,
          total: items.length,
          completed: items.length,
        });
        await addLog(
          batchStopRequested
            ? `UPI Free 分组识别 Plus：已停止，已处理 ${paid.length + free.length + failed.length + skipped.length}/${credentials.length}。`
            : `UPI Free 分组识别 Plus：完成，Plus ${paid.length}，仍 Free ${free.length}，跳过 ${skipped.length}，失败 ${failed.length}。`,
          batchStopRequested ? 'warn' : 'ok'
        );
        return {
          results: finalResults,
          paid,
          free,
          failed,
          skipped,
        };
      } catch (error) {
        const stoppedAt = new Date().toISOString();
        await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: stoppedAt,
          stoppedAt,
          flowStage: currentResults.flowStage,
          flowStageEmail: currentResults.flowStageEmail,
          source,
        }).catch(() => null);
        throw error;
      } finally {
        batchRunning = false;
      }
    }

    async function verifyUpiCredentialMembershipPlus(input = {}) {
      if (batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (redeemRunning || cdkeyRetryRunning) {
        throw new Error('UPI Free 账号兑换/CDK 重试正在运行，请等待完成或先停止。');
      }
      if (typeof checkUpiRedeemSubscriptionStatuses !== 'function') {
        throw new Error('UPI 会员状态查询能力尚未接入。');
      }

      batchRunning = true;
      batchStopRequested = false;
      const startedAt = new Date().toISOString();
      let currentResults = await getStoredResults();
      const requestedCredentials = resolveInputCredentials(input).filter((credential) => credential.email);
      let items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
      const lookup = {};
      items.forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (email) lookup[email] = item;
      });
      const rawCandidates = requestedCredentials.length
        ? requestedCredentials.map((credential) => ({ ...(lookup[normalizeEmail(credential.email)] || {}), ...credential }))
        : items;
      const credentials = rawCandidates
        .map((credential) => normalizeResultItem({ ...credential, status: credential.status || 'paid' }))
        .filter((credential) => credential.email && credential.status === 'paid' && credential.accessToken);
      const paid = [];
      const free = [];
      const failed = [];
      const skipped = [];
      const source = normalizeString(input.source || currentResults.source || 'plus-verify');

      const saveProgress = async (stage = 'subscription-check', email = '') => {
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: true,
          updatedAt: new Date().toISOString(),
          flowStage: stage,
          flowStageEmail: normalizeEmail(email),
          source,
          total: credentials.length,
          completed: paid.length + free.length + failed.length + skipped.length,
        });
      };

      try {
        if (!credentials.length) {
          const finishedAt = new Date().toISOString();
          return {
            results: await saveResults({
              ...currentResults,
              items,
              running: false,
              updatedAt: finishedAt,
              finishedAt,
              flowStage: '',
              flowStageEmail: '',
              source,
            }),
            paid,
            free,
            failed,
            skipped,
          };
        }

        const runtimeState = normalizeSubscriptionRuntimeState({
          ...(typeof getState === 'function' ? await getState().catch(() => ({})) : {}),
          ...(input.settings || {}),
        });
        await addLog(`UPI Plus 分组验证：开始用已保存 AT 查询 ${credentials.length} 个账号。`, 'info');

        for (const credential of credentials) {
          throwIfMembershipStopRequested('check');
          const email = normalizeEmail(credential.email);
          const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
          const activeCredential = normalizeResultItem({
            ...existingItem,
            ...credential,
            email,
            status: 'paid',
            planType: credential.planType || existingItem.planType || 'plus',
          });
          const accessToken = normalizeString(activeCredential.accessToken);
          const checkedAt = new Date().toISOString();
          if (!accessToken) {
            const reason = '缺少 AT，无法验证 Plus。';
            skipped.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'paid',
              reason,
              upiRedeemSubscriptionCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Plus 分组验证：${email} -> 跳过：${reason}`, 'warn');
            continue;
          }

          try {
            await saveProgress('subscription-check', email);
            const subscription = await checkCredentialPaidSubscription({
              state: {
                ...runtimeState,
                ...currentResults,
              },
              credential: activeCredential,
              accessToken,
              throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
            });
            const reason = subscription.reason || '订阅 API 已返回会员状态';
            if (subscription.status === 'paid' && isPaidPlanType(subscription.planType)) {
              paid.push({ email, planType: subscription.planType, reason });
              items = upsertResultItem(items, {
                ...activeCredential,
                status: 'paid',
                planType: subscription.planType,
                reason,
                checkedAt,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                accessTokenUpdatedAt: activeCredential.accessTokenUpdatedAt || checkedAt,
                upiRedeemSubscriptionCheckedAt: checkedAt,
                redeemStatus: activeCredential.redeemStatus,
                redeemReason: activeCredential.redeemReason,
                membershipOverrideStatus: '',
                membershipOverrideCheckedAt: '',
              });
              await saveProgress('subscription-check', email);
              await addLog(`UPI Plus 分组验证：${email} -> 已确认 ${subscription.planType}。`, 'ok');
              continue;
            }

            free.push({ email, planType: subscription.planType || 'free', reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              ...buildFreeMembershipOverrideFields(checkedAt),
              reason,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              accessTokenUpdatedAt: activeCredential.accessTokenUpdatedAt || checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Plus 分组验证：${email} -> 当前不是 Plus，已移回 Free：${reason}`, 'warn');
          } catch (error) {
            if (isMembershipStopError(error)) {
              batchStopRequested = true;
              break;
            }
            const reason = getErrorMessage(error) || 'Plus 验证失败';
            failed.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'paid',
              reason: `Plus 验证失败：${reason}`,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              upiRedeemSubscriptionCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Plus 分组验证：${email} -> 失败：${reason}`, 'warn');
          }
        }

        const finishedAt = new Date().toISOString();
        const finalResults = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt: batchStopRequested ? currentResults.finishedAt : finishedAt,
          stoppedAt: batchStopRequested ? finishedAt : currentResults.stoppedAt,
          flowStage: batchStopRequested ? currentResults.flowStage : '',
          flowStageEmail: batchStopRequested ? currentResults.flowStageEmail : '',
          source,
          total: items.length,
          completed: items.length,
        });
        await addLog(
          batchStopRequested
            ? `UPI Plus 分组验证：已停止，已处理 ${paid.length + free.length + failed.length + skipped.length}/${credentials.length}。`
            : `UPI Plus 分组验证：完成，仍 Plus ${paid.length}，转 Free ${free.length}，跳过 ${skipped.length}，失败 ${failed.length}。`,
          batchStopRequested ? 'warn' : 'ok'
        );
        return {
          results: finalResults,
          paid,
          free,
          failed,
          skipped,
        };
      } catch (error) {
        const stoppedAt = new Date().toISOString();
        await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: stoppedAt,
          stoppedAt,
          flowStage: currentResults.flowStage,
          flowStageEmail: currentResults.flowStageEmail,
          source,
        }).catch(() => null);
        throw error;
      } finally {
        batchRunning = false;
      }
    }

    async function retryFailedUpiRedeemCdkey(input = {}) {
      const redeemChannel = normalizeRedeemChannel(input.channel || input.redeemChannel);
      const redeemChannelLabel = getRedeemChannelLabel(redeemChannel);
      const summary = {
        ok: true,
        skipped: false,
        limit: 0,
        attempted: 0,
        submitted: 0,
        succeeded: 0,
        failed: 0,
        skippedCount: 0,
        items: [],
        updates: {},
      };

      if (batchRunning || redeemRunning || cdkeyRetryRunning) {
        const reason = `${redeemChannelLabel} 备份账号核验/兑换正在运行，暂不继续失败账号兑换轮次。`;
        await addLog(`${redeemChannelLabel} 自动续兑：跳过：${reason}`, 'warn');
        return {
          ...summary,
          ok: false,
          skipped: true,
          reason,
        };
      }
      if (typeof redeemUpiCredentialWithAccessToken !== 'function') {
        throw new Error(`${redeemChannelLabel} 自动续兑能力尚未接入。`);
      }

      const initialState = await getFreshUpiRedeemRuntimeState(input);
      const configuredRoundCount = REDEEM_CHANNEL_FAILURE_LIMIT;
      const totalRoundLimit = getRedeemTotalRoundLimit(configuredRoundCount);
      summary.limit = totalRoundLimit;
      if (configuredRoundCount <= 0) {
        return {
          ...summary,
          skipped: true,
          reason: '兑换轮数为 0，刷新后不继续失败账号。',
        };
      }

      const startedAt = new Date().toISOString();
      let currentResults = normalizeResultsPayload(input.results || initialState?.[RESULTS_STORAGE_KEY] || await getStoredResults());
      let items = Array.isArray(currentResults.items) ? [...currentResults.items] : [];

      const targetEmail = normalizeEmail(input.email || input.accountEmail || input.credential?.email || '');
      const candidateQueue = buildAutoContinuationRedeemCandidates(items, totalRoundLimit, targetEmail, redeemChannel);
      const candidates = candidateQueue.candidates;

      if (!candidates.length) {
        return {
          ...summary,
          skipped: true,
          reason: '没有可继续兑换的待兑换/失败账号。',
        };
      }

      redeemRunning = true;
      redeemStopRequested = false;
      cdkeyRetryRunning = true;

      const saveRetryProgress = async (patch = {}) => {
        currentResults = await saveResults({
          ...currentResults,
          items,
          redeeming: true,
          redeemStartedAt: currentResults.redeemStartedAt || startedAt,
          redeemUpdatedAt: new Date().toISOString(),
          redeemTotal: Math.max(candidates.length, Math.floor(Number(currentResults.redeemTotal) || 0)),
          redeemCompleted: summary.attempted,
          flowStage: patch.flowStage || currentResults.flowStage,
          flowStageEmail: normalizeEmail(patch.email || currentResults.flowStageEmail),
          source: normalizeString(input.source || currentResults.source || 'upi-failed-account-auto-retry'),
        });
      };

      try {
        const firstRuntimeState = await getFreshUpiRedeemRuntimeState(input);
        const roundCdkeys = getAvailableUpiRedeemCdkeys(firstRuntimeState, redeemChannel);
        if (!roundCdkeys.length) {
          const reason = '没有剩余可用 CDK，失败账号兑换轮次已停止。';
          const resumeReason = `${reason}请手动点击一键兑换继续处理剩余账号。`;
          const stoppedAt = new Date().toISOString();
          for (const candidate of candidates) {
            const email = normalizeEmail(candidate.email);
            const accessToken = normalizeString(candidate.accessToken);
            const previousFailureCount = normalizeRetryCount(candidate.redeemFailureCount);
            items = upsertResultItem(items, {
              ...candidate,
              status: 'free',
              planType: 'free',
              reason: resumeReason,
              checkedAt: candidate.checkedAt || stoppedAt,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              redeemStatus: '',
              redeemReason: resumeReason,
              redeemFailureCount: previousFailureCount,
              redeemFailureLimit: totalRoundLimit,
              redeemLastFailedAt: candidate.redeemLastFailedAt,
              lastFailedUpiRedeemCdkey: candidate.lastFailedUpiRedeemCdkey || candidate.upiRedeemCdkey,
              upiRedeemCdkey: '',
              redeemChannel,
            });
            summary.skippedCount += 1;
            summary.items.push({ email, skipped: true, reason });
          }
          await saveRetryProgress({ flowStage: '', email: '' });
          await addLog(
            `${redeemChannelLabel} 自动续兑：${reason}已暂停 ${candidates.length} 个账号；请手动点击一键兑换继续处理剩余账号。`,
            'warn'
          );
        } else {
          await addLog(
            `${redeemChannelLabel} 自动续兑：跳过新导入待兑换 ${candidateQueue.freshCount} 个，只处理回到待兑换 ${candidateQueue.releasedCount} 个、失败可重试 ${candidateQueue.failedCount} 个，当前 CDK 槽位 ${roundCdkeys.length} 个，总轮数 ${totalRoundLimit}；本次每个账号最多提交一次。`,
            'info'
          );
          for (const candidate of candidates) {
          throwIfMembershipStopRequested('redeem');
          const email = normalizeEmail(candidate.email);
          const accessToken = normalizeString(candidate.accessToken);
          const isFailedRetryCandidate = normalizeUpiRedeemRemoteStatus(candidate.redeemStatus) === 'failed';
          const previousFailureCount = isFailedRetryCandidate
            ? Math.max(1, getRedeemChannelFailureCount(candidate, redeemChannel))
            : getRedeemChannelFailureCount(candidate, redeemChannel);
          const attemptNumber = previousFailureCount + 1;
          const roundLabel = getRedeemRoundLabel(attemptNumber, totalRoundLimit);

          const runtimeState = await getFreshUpiRedeemRuntimeState(input);
          const availableCdkeys = getAvailableUpiRedeemCdkeys(runtimeState, redeemChannel);
          if (!availableCdkeys.length) {
            const reason = '没有剩余可用 CDK，失败账号兑换轮次已停止。';
            summary.skippedCount += 1;
            items = upsertResultItem(items, {
              ...candidate,
              status: 'free',
              planType: 'free',
              reason: `${reason}请手动点击一键兑换继续处理剩余账号。`,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              redeemStatus: '',
              redeemReason: `${reason}请手动点击一键兑换继续处理剩余账号。`,
              redeemFailureCount: previousFailureCount,
              redeemFailureLimit: totalRoundLimit,
              redeemLastFailedAt: candidate.redeemLastFailedAt,
              lastFailedUpiRedeemCdkey: candidate.lastFailedUpiRedeemCdkey || candidate.upiRedeemCdkey,
              upiRedeemCdkey: '',
              redeemChannel,
            });
            await saveRetryProgress({ flowStage: '', email: '' });
            summary.items.push({ email, skipped: true, reason });
            await addLog(`${redeemChannelLabel} 自动续兑：${email} -> 跳过：${reason}`, 'warn');
            break;
          }

          const selectedCdkey = pickRandomUpiRedeemCdkey(availableCdkeys);
          if (!selectedCdkey) {
            const reason = '兑换轮次未找到可提交 CDK。';
            summary.skippedCount += 1;
            items = upsertResultItem(items, {
              ...candidate,
              status: 'free',
              planType: 'free',
              reason,
              redeemStatus: 'failed',
              redeemReason: reason,
              redeemFailureCount: previousFailureCount,
              redeemFailureLimit: totalRoundLimit,
              upiRedeemCdkey: candidate.upiRedeemCdkey,
              redeemChannel,
            });
            await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
            summary.items.push({ email, skipped: true, reason });
            continue;
          }

          const redeemAttemptedAt = new Date().toISOString();
          items = upsertResultItem(items, {
            ...candidate,
            status: 'free',
            planType: 'free',
            checkedAt: redeemAttemptedAt,
            reason: `${roundLabel}：已绑定 CDK，正在提交`,
            accessToken,
            accessTokenMasked: maskAccessToken(accessToken),
            redeemStatus: 'running',
            redeemReason: `${roundLabel}：${selectedCdkey}`,
            redeemAttemptedAt,
            redeemFailureLimit: totalRoundLimit,
            upiRedeemCdkey: selectedCdkey,
            redeemChannel,
          });
          await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
          await addLog(`${redeemChannelLabel} 自动续兑：${email} -> ${roundLabel} 随机选择 CDK ${selectedCdkey}。`, 'info');

          try {
            const redeemResult = await redeemUpiCredentialWithAccessToken({
              state: {
                ...runtimeState,
                ...currentResults,
                visibleStep: 7,
              },
              credential: candidate,
              session: { accessToken },
              accessToken,
              forceCdkey: selectedCdkey,
              channel: redeemChannel,
              skipEligibilityCheck: true,
              deferSubscriptionConfirmation: true,
            });

            if (redeemResult?.duplicateCdkeyRejected === true) {
              const reason = redeemResult.reason || 'CDK 重复提交，当前账号本轮结束，切换下一个账号。';
              const failurePatch = buildRedeemChannelFailurePatch(candidate, redeemChannel, {
                reason,
                failedAt: new Date().toISOString(),
              });
              const failureCount = getRedeemChannelFailureCount(failurePatch, redeemChannel);
              const reachedUpiDailyLimit = redeemChannel === 'upi' && isRedeemChannelDailyLimitReason(reason);
              summary.attempted += 1;
              summary.failed += 1;
              items = upsertResultItem(items, {
                ...candidate,
                status: 'free',
                planType: 'free',
                reason: redeemChannel === 'ideal' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                  ? getRedeemLockReason(failurePatch)
                  : reachedUpiDailyLimit
                    ? `${reason}（UPI 今日提交次数已达上限，已转入 IDEAL 候选）`
                  : redeemChannel === 'upi' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                    ? `${reason}（UPI 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次；当前策略仍允许继续 UPI）`
                    : `${reason}（${getRedeemRoundLabel(failureCount, totalRoundLimit)}）`,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: 'failed',
                redeemReason: reason,
                ...failurePatch,
                redeemAttemptedAt,
                lastFailedUpiRedeemCdkey: selectedCdkey,
                upiRedeemCdkey: '',
                redeemChannel,
              });
              await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
              await addLog(
                redeemChannel === 'ideal' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                  ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 重复提交，IDEAL 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次，账号已封存，不再使用。`
                  : reachedUpiDailyLimit
                    ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 明确返回今日提交次数上限，已转入 IDEAL 候选。`
                  : redeemChannel === 'upi' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                    ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 重复提交，UPI 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次；当前策略仍允许继续 UPI。`
                    : `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 重复提交，本账号本轮结束，切换下一个账号。`,
                'warn'
              );
              summary.items.push({ email, cdkey: selectedCdkey, failed: true, reason });
              continue;
            }

            if (redeemResult?.pendingRemoteConfirmation === true) {
              summary.attempted += 1;
              summary.submitted += 1;
              items = upsertResultItem(items, {
                ...candidate,
                status: 'free',
                planType: 'free',
                reason: redeemResult.reason || 'CDK 已提交，等待远端系统返回最终结果',
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: 'submitted',
                redeemReason: redeemResult.reason || `${roundLabel} 已提交，等待远端结果`,
                redeemAttemptedAt,
                redeemFailureCount: previousFailureCount,
                redeemFailureLimit: totalRoundLimit,
                redeemLastFailedAt: candidate.redeemLastFailedAt,
                upiRedeemCdkey: normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey || selectedCdkey),
                redeemChannel,
              });
              await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
              await addLog(`${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 已提交，等待远端结果。`, 'ok');
              summary.items.push({ email, cdkey: selectedCdkey, submitted: true });
              continue;
            }

            const redeemedSubscription = classifyRedeemResult(redeemResult);
            if (redeemedSubscription.active && isPaidPlanType(redeemedSubscription.planType)) {
              const redeemSuccessAt = getRedeemResultSubscriptionCheckedAt(redeemResult) || new Date().toISOString();
              summary.attempted += 1;
              summary.succeeded += 1;
              items = upsertResultItem(items, {
                ...candidate,
                status: 'paid',
                planType: redeemedSubscription.planType,
                checkedAt: redeemSuccessAt,
                reason: redeemedSubscription.reason || `已开通 ${redeemedSubscription.planType}`,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: 'success',
                redeemReason: `${redeemChannelLabel} 自动续兑成功并已确认会员`,
                redeemFailureCount: 0,
                upiRedeemFailureCount: 0,
                idealRedeemFailureCount: 0,
                ...buildRedeemAccountUnlockedPatch(),
                redeemFailureLimit: totalRoundLimit,
                redeemLastFailedAt: '',
                redeemAttemptedAt,
                redeemSuccessAt,
                upiRedeemCdkey: normalizeString(redeemResult.cdkey || redeemResult.upiRedeemCdkey || selectedCdkey),
                redeemChannel,
                upiRedeemSubscriptionCheckedAt: redeemSuccessAt,
                membershipOverrideStatus: '',
                membershipOverrideCheckedAt: '',
              });
              await saveRetryProgress({ flowStage: 'confirm-plus', email });
              await addLog(`${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 已确认 ${redeemedSubscription.planType}。`, 'ok');
              summary.items.push({ email, cdkey: selectedCdkey, succeeded: true });
              continue;
            }

            throw new Error(redeemedSubscription.reason || 'CDK 已提交，但未确认 Plus/Pro/Team 会员。');
          } catch (error) {
            if (isMembershipStopError(error)) {
              throw error;
            }
            const reason = getErrorMessage(error) || '失败账号兑换轮次提交失败。';
            const failurePatch = buildRedeemChannelFailurePatch(candidate, redeemChannel, {
              reason,
              failedAt: new Date().toISOString(),
            });
            const failureCount = getRedeemChannelFailureCount(failurePatch, redeemChannel);
            const reachedUpiDailyLimit = redeemChannel === 'upi' && isRedeemChannelDailyLimitReason(reason);
            summary.attempted += 1;
            summary.failed += 1;
            if (isUpiRedeemApiAuthError(error)) {
              redeemStopRequested = true;
              items = upsertResultItem(items, {
                ...candidate,
                status: 'free',
                planType: 'free',
                reason: `${redeemChannelLabel} 远端接口拒绝请求，失败账号兑换轮次已停止`,
                accessToken,
                accessTokenMasked: maskAccessToken(accessToken),
                redeemStatus: 'stopped',
                redeemReason: reason,
                redeemFailureCount: previousFailureCount,
                redeemFailureLimit: totalRoundLimit,
                redeemLastFailedAt: candidate.redeemLastFailedAt,
                redeemAttemptedAt,
                upiRedeemCdkey: selectedCdkey,
                redeemChannel,
              });
              await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
              await addLog(`${redeemChannelLabel} 自动续兑：远端接口拒绝请求，已停止在 ${email}，请检查 External API Key 或后端权限：${reason}`, 'error');
              summary.items.push({ email, cdkey: selectedCdkey, failed: true, stopped: true, reason });
              break;
            }
            items = upsertResultItem(items, {
              ...candidate,
              status: 'free',
              planType: 'free',
              reason: redeemChannel === 'ideal' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                ? getRedeemLockReason(failurePatch)
                : reachedUpiDailyLimit
                  ? `${reason}（UPI 今日提交次数已达上限，已转入 IDEAL 候选）`
                : redeemChannel === 'upi' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                  ? `${reason}（UPI 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次；当前策略仍允许继续 UPI）`
                  : `${reason}（${getRedeemRoundLabel(failureCount, totalRoundLimit)}）`,
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              redeemStatus: 'failed',
              redeemReason: reason,
              ...failurePatch,
              redeemAttemptedAt,
              lastFailedUpiRedeemCdkey: selectedCdkey,
              upiRedeemCdkey: '',
              redeemChannel,
            });
            await saveRetryProgress({ flowStage: 'upi-redeem-plus', email });
            await addLog(
              redeemChannel === 'ideal' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 失败，IDEAL 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次，账号已封存，不再使用：${reason}`
                : reachedUpiDailyLimit
                  ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 明确返回今日提交次数上限，已转入 IDEAL 候选：${reason}`
                : redeemChannel === 'upi' && failureCount >= REDEEM_CHANNEL_FAILURE_LIMIT
                  ? `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 失败，UPI 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次；当前策略仍允许继续 UPI：${reason}`
                  : `${redeemChannelLabel} 自动续兑：${email} -> ${selectedCdkey} 失败，本账号本轮结束，切换下一个账号：${reason}`,
              'warn'
            );
            summary.items.push({ email, cdkey: selectedCdkey, failed: true, reason });
          }
        }
        }
      } finally {
        const finishedAt = new Date().toISOString();
        currentResults = await saveResults({
          ...currentResults,
          items,
          redeeming: false,
          redeemUpdatedAt: finishedAt,
          redeemFinishedAt: finishedAt,
          flowStage: '',
          flowStageEmail: '',
          source: normalizeString(input.source || currentResults.source || 'upi-failed-account-auto-retry'),
        });
        redeemRunning = false;
        cdkeyRetryRunning = false;
      }

      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      return {
        ...summary,
        ok: summary.failed === 0,
        retried: summary.attempted > 0,
        results: currentResults,
        updates: buildRetryUpdatesPayload(
          currentResults,
          normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(latestState, redeemChannel)),
          redeemChannel
        ),
      };
    }

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
      identifyUpiCredentialMembershipFreePlus,
      importUpiCredentialMembershipFreeResults,
      loginUpiCredentialMembershipAccount,
      moveUpiCredentialMembershipAccountGroup,
      pruneIneligibleFreeUpiCredentialMembership,
      redeemUpiCredentialMembershipFree,
      retryFailedUpiRedeemCdkey,
      stopUpiCredentialMembershipCheck,
      stopUpiCredentialMembershipRedeem,
      upsertTrialEligibleFreeCredential,
      verifyUpiCredentialMembershipPlus,
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
