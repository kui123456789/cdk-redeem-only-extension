(function attachUpiCredentialMembershipChecker(root, factory) {
  root.MultiPageBackgroundUpiCredentialMembershipChecker = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createUpiCredentialMembershipCheckerModule() {
  const BACKUP_STORAGE_KEY = 'upiAccountCredentialBackups';
  const RESULTS_STORAGE_KEY = 'upiCredentialMembershipCheckResults';
  const DEFAULT_TOTP_API_BASE_URL = 'https://cha.nerver.cc';
  const TOTP_LOOKUP_TIMEOUT_MS = 20000;
  const DEFAULT_PASSKEY_LOGIN_TIMEOUT_MS = 30000;
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

  function normalizeRedeemPlusDeletedEmailsByChannel(value = {}) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return {
      upi: normalizeEmailList(source.upi),
      ideal: normalizeEmailList(source.ideal),
    };
  }

  function addRedeemPlusDeletedEmailsByChannel(value = {}, emails = new Set(), channels = []) {
    const current = normalizeRedeemPlusDeletedEmailsByChannel(value);
    const targetEmails = Array.from(emails instanceof Set ? emails : (Array.isArray(emails) ? emails : []))
      .map(normalizeEmail)
      .filter(Boolean);
    const targetChannels = (Array.isArray(channels) ? channels : [])
      .map(normalizeRedeemChannel)
      .filter((channel, index, list) => channel && list.indexOf(channel) === index);
    targetChannels.forEach((channel) => {
      current[channel] = normalizeEmailList([...(current[channel] || []), ...targetEmails]);
    });
    return current;
  }

  function buildRedeemDeletionStatePatch(source = {}) {
    const redeemAutoDeletedEmails = normalizeEmailList(source.redeemAutoDeletedEmails);
    const redeemPlusDeletedEmailsByChannel = normalizeRedeemPlusDeletedEmailsByChannel(source.redeemPlusDeletedEmailsByChannel);
    return {
      redeemAutoDeletedEmails,
      redeemAutoDeletedCount: redeemAutoDeletedEmails.length,
      redeemPlusDeletedEmailsByChannel,
      redeemPlusDeletedCountByChannel: {
        upi: redeemPlusDeletedEmailsByChannel.upi.length,
        ideal: redeemPlusDeletedEmailsByChannel.ideal.length,
      },
    };
  }

  function mergeRedeemDeletionStateForSave(previous = {}, next = {}) {
    const hasOwn = (key) => Object.prototype.hasOwnProperty.call(next || {}, key);
    const previousDeletion = buildRedeemDeletionStatePatch(previous);
    const nextDeletion = buildRedeemDeletionStatePatch(next);
    return {
      redeemAutoDeletedEmails: hasOwn('redeemAutoDeletedEmails')
        ? nextDeletion.redeemAutoDeletedEmails
        : previousDeletion.redeemAutoDeletedEmails,
      redeemPlusDeletedEmailsByChannel: hasOwn('redeemPlusDeletedEmailsByChannel')
        ? nextDeletion.redeemPlusDeletedEmailsByChannel
        : previousDeletion.redeemPlusDeletedEmailsByChannel,
    };
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

  function isPasskeyExportMarker(value = '') {
    return /^PASSKEY(?::|$)/i.test(normalizeString(value));
  }

  function getPasskeyCredentialIdFromExportMarker(value = '') {
    const marker = normalizeString(value);
    return isPasskeyExportMarker(marker)
      ? marker.replace(/^PASSKEY:?/i, '').trim()
      : '';
  }

  function buildPasskeyExportMarker(item = {}) {
    const credentialId = normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id);
    return credentialId ? `PASSKEY:${credentialId}` : 'PASSKEY';
  }

  function hasPasskeyCredential(item = {}) {
    return item.passkeyEnabled === true
      || Boolean(normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id));
  }

  function getPasskeyLoginCore() {
    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    return rootScope.MultiPagePasskeyLoginCore || {};
  }

  function normalizeNerverPasskeyLoginBaseUrl(value = '', options = {}) {
    const raw = normalizeString(value);
    if (!raw) return DEFAULT_TOTP_API_BASE_URL;
    try {
      const url = new URL(raw);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Passkey API 基础地址必须使用 http 或 https 协议。');
      }
      url.hash = '';
      url.search = '';
      url.pathname = url.pathname
        .replace(/\/+$/g, '')
        .replace(/\/api\/v1\/passkey\/(?:enable|login)$/i, '')
        .replace(/\/api\/v1\/totp\/(?:enable|lookup|code)$/i, '')
        .replace(/\/+$/g, '');
      return url.toString().replace(/\/+$/g, '');
    } catch (error) {
      if (error instanceof Error && /Passkey API/.test(error.message)) {
        throw error;
      }
      throw new Error('Passkey API 基础地址无效，请填写有效的 http(s) URL。');
    }
  }

  function buildPasskeyLoginApiUrl(state = {}) {
    const baseUrl = normalizeNerverPasskeyLoginBaseUrl(
      state?.passkeyLoginApiBaseUrl
      || state?.passkeyApiBaseUrl
      || state?.upiCredentialMembershipCheckTotpApiBaseUrl
      || state?.totpMfaApiBaseUrl
      || DEFAULT_TOTP_API_BASE_URL
    ) || DEFAULT_TOTP_API_BASE_URL;
    return `${baseUrl}/api/v1/passkey/login`;
  }

  function resolvePasskeyLoginTimeoutMs(state = {}) {
    const configured = Number(state?.passkeyLoginTimeoutMs);
    if (Number.isFinite(configured) && configured > 0) {
      return Math.max(1, Math.floor(configured));
    }
    return DEFAULT_PASSKEY_LOGIN_TIMEOUT_MS;
  }

  function normalizeBackendErrorValue(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return normalizeString(value);
    }
    try {
      return normalizeString(JSON.stringify(value)).slice(0, 300);
    } catch {
      return normalizeString(value);
    }
  }

  function getBackendOwnErrorMessage(payload = {}) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return '';
    for (const key of ['reason', 'message', 'error']) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const message = normalizeBackendErrorValue(payload[key]);
        if (message) return message;
      }
    }
    return '';
  }

  async function fetchPasskeyLoginResponse(fetchImpl, apiUrl, requestOptions = {}, timeoutMs = DEFAULT_PASSKEY_LOGIN_TIMEOUT_MS) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const options = { ...requestOptions };
    let timeoutId = null;
    let timedOut = false;
    if (controller) {
      options.signal = controller.signal;
    }
    try {
      if (controller) {
        timeoutId = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs);
        return await fetchImpl(apiUrl, options);
      }
      return await new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          timedOut = true;
          reject(new Error('Passkey 登录接口请求超时'));
        }, timeoutMs);
        Promise.resolve()
          .then(() => fetchImpl(apiUrl, options))
          .then(resolve, reject);
      });
    } catch (error) {
      if (timedOut || error?.name === 'AbortError') {
        throw new Error('Passkey 登录接口请求超时');
      }
      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  function buildPasskeyLoginOptionsFromCredential(credential = {}, state = {}) {
    const options = {
      deviceId: normalizeString(
        credential.deviceId
        || credential.passkeyDeviceId
        || credential.device_id
        || state?.deviceId
        || state?.passkeyDeviceId
        || state?.passkeyLoginDeviceId
        || state?.totpMfaDeviceId
        || state?.upiCredentialMembershipCheckDeviceId
      ),
      credentialId: normalizeString(credential.passkeyCredentialId || credential.credentialId || credential.credential_id),
      privateJwk: credential.passkeyPrivateJwk || credential.privateJwk || credential.private_jwk,
      rpId: normalizeString(credential.passkeyRpId || credential.rpId || credential.rp_id),
      userHandle: normalizeString(credential.passkeyUserHandle || credential.userHandle || credential.user_handle),
      signCount: credential.passkeySignCount ?? credential.signCount ?? credential.sign_count,
      alg: credential.passkeyAlg ?? credential.alg,
    };
    Object.keys(options).forEach((key) => {
      if (options[key] === undefined || options[key] === null || options[key] === '') {
        delete options[key];
      }
    });
    return options;
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
      target.passkeyEnabled = true;
      target.passkeyCredentialId = targetPasskeyCredentialId || sourcePasskeyCredentialId;
      target.passkeyEnabledAt = normalizeString(target.passkeyEnabledAt || source.passkeyEnabledAt);
      target.passkeyFactorId = normalizeString(target.passkeyFactorId || source.passkeyFactorId || source.factorId || source.factor_id);
      target.passkeyRpId = normalizeString(target.passkeyRpId || source.passkeyRpId || source.rpId || source.rp_id);
      target.passkeyUserHandle = normalizeString(target.passkeyUserHandle || source.passkeyUserHandle || source.userHandle || source.user_handle);
      if (!target.passkeyPrivateJwk && source.passkeyPrivateJwk && typeof source.passkeyPrivateJwk === 'object' && !Array.isArray(source.passkeyPrivateJwk)) {
        target.passkeyPrivateJwk = source.passkeyPrivateJwk;
      }
      target.passkeyPublicKeyCose = normalizeString(target.passkeyPublicKeyCose || source.passkeyPublicKeyCose || source.publicKeyCose || source.public_key_cose);
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

  function isResultItemPasskeyExportableForStatus(item = {}, status = '') {
    const normalizedStatus = normalizeString(status);
    if (normalizedStatus !== 'free' && normalizedStatus !== 'paid') {
      return false;
    }
    if (!hasPasskeyCredential(item) || !item.email || !item.password) {
      return false;
    }
    return normalizedStatus === 'paid' || Boolean(item.accessToken);
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

  function getRedeemChannelFailureField(channel = 'upi') {
    const helper = getRedeemChannelStateHelpers().getRedeemChannelFailureField;
    if (typeof helper === 'function') {
      return helper(channel);
    }
    return normalizeRedeemChannel(channel) === 'ideal'
      ? 'idealRedeemFailureCount'
      : 'upiRedeemFailureCount';
  }

  function getRedeemChannelFailureCount(item = {}, channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    const field = getRedeemChannelFailureField(normalizedChannel);
    if (Object.prototype.hasOwnProperty.call(item || {}, field)) {
      return normalizeRetryCount(item?.[field]);
    }
    const legacyChannel = normalizeString(item?.redeemChannel || item?.channel || item?.paymentChannel)
      ? normalizeRedeemChannel(item.redeemChannel || item.channel || item.paymentChannel)
      : '';
    return legacyChannel === normalizedChannel ? normalizeRetryCount(item?.redeemFailureCount) : 0;
  }

  function getRedeemChannelDailyLimitBlockedAtField(channel = 'upi') {
    const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitBlockedAtField;
    if (typeof helper === 'function') {
      return helper(channel);
    }
    return normalizeRedeemChannel(channel) === 'ideal'
      ? 'idealRedeemDailyLimitBlockedAt'
      : 'upiRedeemDailyLimitBlockedAt';
  }

  function getRedeemChannelDailyLimitBlockedUntilField(channel = 'upi') {
    const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitBlockedUntilField;
    if (typeof helper === 'function') {
      return helper(channel);
    }
    return normalizeRedeemChannel(channel) === 'ideal'
      ? 'idealRedeemDailyLimitBlockedUntil'
      : 'upiRedeemDailyLimitBlockedUntil';
  }

  function getRedeemChannelDailyLimitReasonField(channel = 'upi') {
    const helper = getRedeemChannelStateHelpers().getRedeemChannelDailyLimitReasonField;
    if (typeof helper === 'function') {
      return helper(channel);
    }
    return normalizeRedeemChannel(channel) === 'ideal'
      ? 'idealRedeemDailyLimitReason'
      : 'upiRedeemDailyLimitReason';
  }

  function isRedeemChannelDailyLimitReason(message = '') {
    const helper = getRedeemChannelStateHelpers().isRedeemChannelDailyLimitReason;
    if (typeof helper === 'function') {
      return helper(message);
    }
    const text = normalizeString(message);
    return /该邮箱/.test(text)
      && /在该渠道今日提交次数已达上限/.test(text)
      && /3\s*次/.test(text)
      && /请\s*24\s*小时后再试/.test(text);
  }

  function isRedeemCrossRegionPaymentUnavailableReason(message = '') {
    const helper = getRedeemChannelStateHelpers().isRedeemCrossRegionPaymentUnavailableReason;
    if (typeof helper === 'function') {
      return helper(message);
    }
    return /\bpm-unavailable\b/i.test(normalizeString(message));
  }

  function buildRedeemChannelDailyLimitPatch(channel = 'upi', reason = '', failedAt = '') {
    if (!isRedeemChannelDailyLimitReason(reason)) {
      return {};
    }
    const normalizedChannel = normalizeRedeemChannel(channel);
    const blockedAt = normalizeString(failedAt) || new Date().toISOString();
    const blockedAtMs = Math.max(0, Date.parse(blockedAt) || Date.now());
    const blockedUntil = new Date(blockedAtMs + REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS).toISOString();
    return {
      [getRedeemChannelDailyLimitBlockedAtField(normalizedChannel)]: blockedAt,
      [getRedeemChannelDailyLimitBlockedUntilField(normalizedChannel)]: blockedUntil,
      [getRedeemChannelDailyLimitReasonField(normalizedChannel)]: normalizeString(reason),
    };
  }

  function isRedeemChannelDailyLimitBlocked(item = {}, channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    const nowMs = Date.now();
    const blockedUntil = Date.parse(normalizeString(item?.[getRedeemChannelDailyLimitBlockedUntilField(normalizedChannel)]));
    if (Number.isFinite(blockedUntil) && blockedUntil > nowMs) {
      return true;
    }
    const blockedAt = Date.parse(normalizeString(item?.[getRedeemChannelDailyLimitBlockedAtField(normalizedChannel)]));
    const storedReason = item?.[getRedeemChannelDailyLimitReasonField(normalizedChannel)];
    if (
      Number.isFinite(blockedAt)
      && blockedAt + REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS > nowMs
      && isRedeemChannelDailyLimitReason(storedReason || item?.redeemReason || item?.reason)
    ) {
      return true;
    }
    const itemChannel = normalizeRedeemChannel(item?.redeemChannel || item?.channel || item?.paymentChannel);
    if (itemChannel !== normalizedChannel) {
      return false;
    }
    const legacyReason = item?.redeemReason || item?.reason || item?.remoteMessage;
    if (!isRedeemChannelDailyLimitReason(legacyReason)) {
      return false;
    }
    const legacyBlockedAt = Date.parse(normalizeString(item?.redeemLastFailedAt || item?.redeemAttemptedAt || item?.checkedAt || item?.updatedAt));
    return !Number.isFinite(legacyBlockedAt) || legacyBlockedAt + REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS > nowMs;
  }

  function isRedeemAccountLocked(item = {}) {
    return item?.redeemLocked === true
      || getRedeemChannelFailureCount(item, 'ideal') >= REDEEM_CHANNEL_FAILURE_LIMIT;
  }

  function getRedeemLockReason(item = {}) {
    return normalizeString(item?.redeemLockedReason)
      || 'IDEAL 已失败 3 次，账号已封存，不再使用';
  }

  function buildRedeemAccountUnlockedPatch() {
    return {
      redeemLocked: false,
      redeemLockedReason: '',
      redeemLockedAt: '',
    };
  }

  function buildRedeemChannelFailurePatch(item = {}, channel = 'upi', options = {}) {
    const normalizedChannel = normalizeRedeemChannel(channel);
    const failedAt = normalizeString(options.failedAt) || new Date().toISOString();
    const reason = normalizeString(options.reason) || '兑换失败';
    const count = Math.min(
      REDEEM_CHANNEL_FAILURE_LIMIT,
      getRedeemChannelFailureCount(item, normalizedChannel) + 1
    );
    const patch = {
      [getRedeemChannelFailureField(normalizedChannel)]: count,
      redeemFailureCount: count,
      redeemFailureLimit: REDEEM_CHANNEL_FAILURE_LIMIT,
      redeemLastFailedAt: failedAt,
      redeemChannel: normalizedChannel,
      ...buildRedeemChannelDailyLimitPatch(normalizedChannel, reason, failedAt),
    };
    if (isRedeemCrossRegionPaymentUnavailableReason(reason)) {
      return {
        ...patch,
        redeemLocked: true,
        redeemLockedReason: `跨地区支付不可用，账号已封存，不再兑换：${reason}`,
        redeemLockedAt: failedAt,
      };
    }
    if (normalizedChannel === 'ideal' && count >= REDEEM_CHANNEL_FAILURE_LIMIT) {
      const lockReason = `IDEAL 已失败 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次，账号已封存，不再使用：${reason}`;
      return {
        ...patch,
        redeemLocked: true,
        redeemLockedReason: lockReason,
        redeemLockedAt: failedAt,
      };
    }
    return {
      ...patch,
      ...buildRedeemAccountUnlockedPatch(),
    };
  }

  function shouldRedeemItemUseChannel(item = {}, channel = 'upi') {
    if (isRedeemAccountLocked(item)) {
      return false;
    }
    if (isRedeemChannelDailyLimitBlocked(item, channel)) {
      return false;
    }
    if (normalizeRedeemChannel(channel) === 'upi') {
      return true;
    }
    return getRedeemChannelFailureCount(item, channel) < REDEEM_CHANNEL_FAILURE_LIMIT;
  }

  function getRedeemChannelPoolText(state = {}, channel = 'upi') {
    const helper = getRedeemCdkeyUsageHelpers().getRedeemChannelPoolText;
    if (typeof helper === 'function') {
      return helper(state, channel);
    }
    if (normalizeRedeemChannel(channel) === 'ideal') {
      return normalizeString(state?.idealRedeemCdkeyPoolText);
    }
    return getUpiRedeemStateValue(state, 'upiRedeemCdkeyPoolText');
  }

  function getRedeemChannelUsage(state = {}, channel = 'upi') {
    const helper = getRedeemCdkeyUsageHelpers().getRedeemChannelUsage;
    if (typeof helper === 'function') {
      return helper(state, channel, { defaultValue: {} }) || {};
    }
    if (normalizeRedeemChannel(channel) === 'ideal') {
      return state?.idealRedeemCdkeyUsage || {};
    }
    return getUpiRedeemStateValue(state, 'upiRedeemCdkeyUsage') || {};
  }

  function buildRedeemChannelUsageUpdates(channel = 'upi', usage = {}) {
    const helper = getRedeemCdkeyUsageHelpers().buildRedeemChannelUsageUpdates;
    if (typeof helper === 'function') {
      return helper(channel, usage, { normalizeUsage: normalizeUpiRedeemCdkeyUsage });
    }
    const normalizedUsage = normalizeUpiRedeemCdkeyUsage(usage || {});
    if (normalizeRedeemChannel(channel) === 'ideal') {
      return {
        idealRedeemCdkeyUsage: normalizedUsage,
      };
    }
    return {
      cdkUsage: normalizedUsage,
      upiRedeemCdkUsage: normalizedUsage,
      upiRedeemCdkeyUsage: normalizedUsage,
    };
  }

  function parseUpiRedeemCdkeyPoolText(value = '') {
    const seen = new Set();
    return String(value || '')
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => normalizeString(line))
      .filter((line) => {
        if (!line || seen.has(line)) return false;
        seen.add(line);
        return true;
      });
  }

  function normalizeUpiRedeemCdkeyUsage(rawUsage = {}) {
    const usage = rawUsage && typeof rawUsage === 'object' && !Array.isArray(rawUsage)
      ? rawUsage
      : {};
    return Object.fromEntries(Object.entries(usage).map(([rawCdkey, rawEntry]) => {
      const cdkey = normalizeString(rawCdkey);
      const entry = rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry)
        ? rawEntry
        : {};
      return [cdkey, {
        ...entry,
        email: normalizeEmail(entry.email || entry.accountEmail || entry.account_email || entry.credentialEmail || entry.credential_email || entry.targetEmail || entry.target_email),
        accessToken: normalizeString(entry.accessToken || entry.access_token || entry.upiRedeemAccessToken),
        accessTokenMasked: normalizeString(entry.accessTokenMasked),
        accessTokenUpdatedAt: Math.max(0, Math.floor(Number(entry.accessTokenUpdatedAt) || Number(entry.tokenUpdatedAt) || 0)),
        lastFailedEmail: normalizeEmail(entry.lastFailedEmail),
        lastFailedAt: Math.max(0, Math.floor(Number(entry.lastFailedAt) || 0)),
        lastFailedReason: normalizeString(entry.lastFailedReason),
        canCancel: normalizeBoolean(entry.canCancel ?? entry.can_cancel),
        canRetry: normalizeBoolean(entry.canRetry ?? entry.can_retry),
        canReuseToken: normalizeBoolean(entry.canReuseToken ?? entry.can_reuse_token),
        hasAccessToken: normalizeBoolean(entry.hasAccessToken ?? entry.has_access_token),
      }];
    }).filter(([cdkey]) => Boolean(cdkey)));
  }

  function getUpiRedeemCdkeyUsageEntryEmail(entry = {}) {
    return normalizeEmail(
      entry.email
      || entry.accountEmail
      || entry.account_email
      || entry.credentialEmail
      || entry.credential_email
      || entry.targetEmail
      || entry.target_email
    );
  }

  function isSuccessfulUpiRedeemCdkeyUsageEntry(entry = {}) {
    return entry?.subscriptionActive === true
      || isSuccessfulUpiRedeemRemoteStatus(entry?.remoteStatus)
      || isSuccessfulUpiRedeemRemoteStatus(entry?.remoteMessage);
  }

  function shouldClearUpiRedeemCdkeyUsageAccountBinding(entry = {}, options = {}) {
    if (isSuccessfulUpiRedeemCdkeyUsageEntry(entry)) {
      return true;
    }
    if (options.clearNonActive !== true) {
      return false;
    }
    return !isActiveUpiRedeemRemoteStatus(entry.remoteStatus)
      && !isActiveUpiRedeemRemoteStatus(entry.remoteMessage)
      && entry.retrying !== true
      && normalizeBoolean(entry.canCancel ?? entry.can_cancel) !== true;
  }

  function clearUpiRedeemCdkeyUsageAccountBindings(usage = {}, emailSet = new Set(), options = {}) {
    const source = usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
    const targets = emailSet instanceof Set ? emailSet : new Set();
    let changed = false;
    const nextUsage = {};
    Object.entries(source).forEach(([cdkey, rawEntry]) => {
      const entry = rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry)
        ? { ...rawEntry }
        : {};
      const email = getUpiRedeemCdkeyUsageEntryEmail(entry);
      if (email && targets.has(email) && shouldClearUpiRedeemCdkeyUsageAccountBinding(entry, options)) {
        delete entry.email;
        delete entry.accountEmail;
        delete entry.account_email;
        delete entry.credentialEmail;
        delete entry.credential_email;
        delete entry.targetEmail;
        delete entry.target_email;
        delete entry.accessToken;
        delete entry.access_token;
        delete entry.upiRedeemAccessToken;
        delete entry.upi_redeem_access_token;
        delete entry.accessTokenMasked;
        delete entry.access_token_masked;
        delete entry.accessTokenUpdatedAt;
        delete entry.access_token_updated_at;
        changed = true;
      }
      nextUsage[cdkey] = entry;
    });
    return { usage: nextUsage, changed };
  }

  function isActiveUpiRedeemRemoteStatus(status = '') {
    return [
      'pending',
      'pending_token',
      'pending_dispatch',
      'dispatched',
      'dispatching',
      'running',
      'redeeming',
      'processing',
      'in_progress',
      'queued',
      'accepted',
      'submitted',
    ].includes(normalizeUpiRedeemRemoteStatus(status));
  }

  function normalizeUpiRedeemRemoteStatus(status = '') {
    const normalized = normalizeString(status).toLowerCase().replace(/[\s-]+/g, '_');
    switch (normalized) {
      case 'pending_dispatch':
      case 'dispatched':
      case 'running':
      case 'success':
      case 'failed':
      case 'timeout':
      case 'not_found':
        return normalized;
      case 'cancelled':
      case 'canceled':
        return 'canceled';
      default:
        break;
    }
    if (normalized === 'approve_blocked') return 'approve_blocked';
    if (/兑换成功|成功|已兑换|已使用|已用/.test(normalized)) return 'success';
    if (/提交失败|兑换失败|充值失败|失败|超时|拒绝|已拒绝|取消|已取消/.test(normalized)) {
      if (/超时/.test(normalized)) return 'timeout';
      if (/拒绝/.test(normalized)) return 'rejected';
      if (/取消/.test(normalized)) return 'canceled';
      return 'failed';
    }
    if (/未找到|不存在/.test(normalized)) return 'not_found';
    if (/无效|不可用/.test(normalized)) return 'invalid';
    if (/未使用|未兑换|可用/.test(normalized)) return 'unused';
    if (/waiting|queue|br_recharge|进入兑换队列|兑换队列|等待系统处理|等待.*接单|任务.*等待/.test(normalized)) return 'queued';
    if (/等待处理|待处理|待兑换|待派发/.test(normalized)) return 'pending_dispatch';
    if (/派发中|正在派发/.test(normalized)) return 'dispatching';
    if (/已派发/.test(normalized)) return 'dispatched';
    if (/兑换中|处理中|进行中|正在兑换/.test(normalized)) return 'processing';
    if (/已提交|已接收|排队/.test(normalized)) return 'submitted';
    if (normalized === 'succeeded' || normalized === 'redeemed' || normalized === 'used') return 'success';
    if (normalized === 'failure' || normalized === 'error') return 'failed';
    if (normalized === 'cancelled') return 'canceled';
    if (normalized === 'notused' || normalized === 'not_used' || normalized === 'unredeemed') return 'unused';
    return normalized;
  }

  function isSuccessfulUpiRedeemRemoteStatus(status = '') {
    return normalizeUpiRedeemRemoteStatus(status) === 'success';
  }

  function isRetryableUpiRedeemRemoteStatus(status = '') {
    return ['failed', 'timeout', 'rejected', 'approve_blocked'].includes(normalizeUpiRedeemRemoteStatus(status));
  }

  function isSelectableUpiRedeemCdkeyUsageEntry(entry = {}) {
    if (!entry || entry.enabled === false) return false;
    const remoteStatus = normalizeUpiRedeemRemoteStatus(entry.remoteStatus);
    const remoteMessageStatus = normalizeUpiRedeemRemoteStatus(entry.remoteMessage);
    if (entry.subscriptionActive === true) return false;
    if (isSuccessfulUpiRedeemRemoteStatus(entry.remoteStatus)) return false;
    if (remoteStatus === 'invalid' || remoteMessageStatus === 'invalid') return false;
    if (
      (
        remoteStatus === 'pending_dispatch'
        || remoteMessageStatus === 'pending_dispatch'
      )
      && (normalizeEmail(entry.email) || normalizeString(entry.accessToken))
    ) return false;
    if (isActiveUpiRedeemRemoteStatus(entry.remoteStatus) || isActiveUpiRedeemRemoteStatus(entry.remoteMessage) || entry.retrying === true) return false;
    return true;
  }

  function isRecoverableUpiRedeemCdkeyUsageEntry(entry = {}) {
    if (!entry || entry.enabled === false) return false;
    const remoteStatus = normalizeUpiRedeemRemoteStatus(entry.remoteStatus);
    const remoteMessageStatus = normalizeUpiRedeemRemoteStatus(entry.remoteMessage);
    if (entry.subscriptionActive === true || isSuccessfulUpiRedeemRemoteStatus(entry.remoteStatus)) return false;
    if (
      (
        remoteStatus === 'pending_dispatch'
        || remoteMessageStatus === 'pending_dispatch'
      )
      && (normalizeEmail(entry.email) || normalizeString(entry.accessToken))
    ) return false;
    if (isActiveUpiRedeemRemoteStatus(entry.remoteStatus) || isActiveUpiRedeemRemoteStatus(entry.remoteMessage) || entry.retrying === true) return false;
    return isRetryableUpiRedeemRemoteStatus(entry.remoteStatus)
      || remoteStatus === 'canceled'
      || remoteMessageStatus === 'canceled'
      || entry.subscriptionActive === false
      || Boolean(normalizeString(entry.lastError || entry.subscriptionReason));
  }

  function mergeUpiRedeemCdkeysWithRecoverableUsage(cdkeys = [], usage = {}) {
    const seen = new Set();
    const merged = [];
    for (const cdkey of cdkeys) {
      const normalizedCdkey = normalizeString(cdkey);
      if (!normalizedCdkey || seen.has(normalizedCdkey)) continue;
      seen.add(normalizedCdkey);
      merged.push(normalizedCdkey);
    }
    return merged;
  }

  function countAvailableUpiRedeemCdkeys(state = {}, channel = 'upi') {
    const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(state, channel));
    const cdkeys = mergeUpiRedeemCdkeysWithRecoverableUsage(
      parseUpiRedeemCdkeyPoolText(getRedeemChannelPoolText(state, channel)),
      usage
    );
    return cdkeys.filter((cdkey) => {
      const entry = usage?.[cdkey] || {};
      return isSelectableUpiRedeemCdkeyUsageEntry(entry);
    }).length;
  }

  function normalizeFailedAccountRetryLimit(value, fallback = DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT) {
    const fallbackNumber = Math.floor(Number(fallback));
    const fallbackValue = Number.isFinite(fallbackNumber)
      ? Math.max(0, Math.min(UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX, fallbackNumber))
      : DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT;
    const rawValue = String(value ?? '').trim();
    if (!rawValue) {
      return fallbackValue;
    }
    const numeric = Math.floor(Number(rawValue));
    if (!Number.isFinite(numeric)) {
      return fallbackValue;
    }
    return Math.max(0, Math.min(UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX, numeric));
  }

  function normalizeRedeemConfiguredRoundCount(value, fallback = DEFAULT_UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT) {
    return normalizeFailedAccountRetryLimit(value, fallback);
  }

  function getRedeemTotalRoundLimit(configuredRoundCount = 0) {
    const roundCount = Math.max(0, Math.min(
      UPI_REDEEM_FAILED_ACCOUNT_RETRY_LIMIT_MAX,
      Math.floor(Number(configuredRoundCount) || 0)
    ));
    return roundCount > 0 ? roundCount : 1;
  }

  function getRedeemRoundLabel(roundNumber = 1, totalRoundLimit = 1) {
    return `兑换轮 ${Math.max(1, Math.floor(Number(roundNumber) || 1))}/${Math.max(1, Math.floor(Number(totalRoundLimit) || 1))}`;
  }

  function getAvailableUpiRedeemCdkeys(state = {}, channel = 'upi') {
    const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(state, channel));
    return mergeUpiRedeemCdkeysWithRecoverableUsage(
      parseUpiRedeemCdkeyPoolText(getRedeemChannelPoolText(state, channel)),
      usage
    ).filter((cdkey) => isSelectableUpiRedeemCdkeyUsageEntry(usage?.[cdkey] || {}));
  }

  function pickRandomUpiRedeemCdkey(cdkeys = []) {
    const candidates = (Array.isArray(cdkeys) ? cdkeys : [])
      .map((cdkey) => normalizeString(cdkey))
      .filter(Boolean);
    if (!candidates.length) {
      return '';
    }
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[Math.max(0, Math.min(candidates.length - 1, index))] || '';
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

  function parseCredentialBackupParts(parts = []) {
    if (parts.length === 4 && isLikelyVerificationUrl(parts[1])) {
      const recordedAt = normalizeNo2faFreeExportTimestamp(parts[3]);
      return {
        email: normalizeEmail(parts[0] || ''),
        password: '',
        totpMfaSecret: '',
        gptPassword: '',
        verificationUrl: normalizeString(parts[1] || ''),
        accessToken: normalizeString(parts[2] || ''),
        accessTokenUpdatedAt: normalizeString(parts[3] || ''),
        checkedAt: normalizeString(parts[3] || ''),
        recordedAt,
        no2faFreeRoute: true,
        twoFactorEnabled: false,
      };
    }
    if (parts.length >= 3 && isPasskeyExportMarker(parts[2])) {
      if (isLikelyVerificationUrl(parts[3])) {
        const timestamp = parts[5] || '';
        return {
          email: normalizeEmail(parts[0] || ''),
          password: normalizeString(parts[1] || ''),
          totpMfaSecret: '',
          gptPassword: normalizeString(parts[1] || ''),
          verificationUrl: normalizeNo2faFreeVerificationUrlForExport(parts[3] || ''),
          passkeyEnabled: true,
          passkeyCredentialId: getPasskeyCredentialIdFromExportMarker(parts[2]),
          accessToken: normalizeString(parts[4] || ''),
          accessTokenUpdatedAt: normalizeString(timestamp),
          checkedAt: normalizeString(timestamp),
          recordedAt: normalizeNo2faFreeExportTimestamp(timestamp),
          no2faFreeRoute: false,
          twoFactorEnabled: true,
        };
      }
      const accessTokenOrTimestamp = parts[3] || '';
      const explicitTimestamp = parts[4] || '';
      const fourthPartIsTimestamp = !explicitTimestamp && isLikelyCredentialTimestamp(accessTokenOrTimestamp);
      const timestamp = explicitTimestamp || (fourthPartIsTimestamp ? accessTokenOrTimestamp : '');
      return {
        email: normalizeEmail(parts[0] || ''),
        password: normalizeString(parts[1] || ''),
        totpMfaSecret: '',
        gptPassword: normalizeString(parts[1] || ''),
        passkeyEnabled: true,
        passkeyCredentialId: getPasskeyCredentialIdFromExportMarker(parts[2]),
        accessToken: fourthPartIsTimestamp ? '' : normalizeString(accessTokenOrTimestamp),
        accessTokenUpdatedAt: normalizeString(timestamp),
        checkedAt: normalizeString(timestamp),
        recordedAt: normalizeNo2faFreeExportTimestamp(timestamp),
        no2faFreeRoute: false,
        twoFactorEnabled: true,
      };
    }
    if (parts.length >= 5 && isLikelyVerificationUrl(parts[3])) {
      const timestamp = parts[5] || '';
      return {
        email: normalizeEmail(parts[0] || ''),
        password: normalizeString(parts[1] || ''),
        totpMfaSecret: normalizeTotpSecret(parts[2] || ''),
        verificationUrl: normalizeNo2faFreeVerificationUrlForExport(parts[3] || ''),
        accessToken: normalizeString(parts[4] || ''),
        accessTokenUpdatedAt: normalizeString(timestamp),
        checkedAt: normalizeString(timestamp),
        recordedAt: normalizeNo2faFreeExportTimestamp(timestamp),
        no2faFreeRoute: false,
        twoFactorEnabled: true,
      };
    }
    const accessTokenOrTimestamp = parts[3] || '';
    const explicitTimestamp = parts[4] || '';
    const fourthPartIsTimestamp = !explicitTimestamp && isLikelyCredentialTimestamp(accessTokenOrTimestamp);
    const timestamp = explicitTimestamp || (fourthPartIsTimestamp ? accessTokenOrTimestamp : '');
    return {
      email: normalizeEmail(parts[0] || ''),
      password: normalizeString(parts[1] || ''),
      totpMfaSecret: normalizeTotpSecret(parts[2] || ''),
      accessToken: fourthPartIsTimestamp ? '' : normalizeString(accessTokenOrTimestamp),
      accessTokenUpdatedAt: normalizeString(timestamp),
    };
  }

  function parseCredentialBackupText(text = '') {
    const seen = new Set();
    return String(text || '')
      .replace(/\r/g, '')
      .split('\n')
      .map((line, index) => {
        const rawLine = line.trim();
        if (!rawLine || rawLine.startsWith('#')) return null;
        const parts = rawLine.split(/---+/).map((part) => part.trim());
        const {
          email,
          password,
          totpMfaSecret,
          gptPassword,
          verificationUrl,
          accessToken,
          accessTokenUpdatedAt,
          checkedAt,
          recordedAt,
          no2faFreeRoute,
          twoFactorEnabled,
          passkeyEnabled,
          passkeyCredentialId,
        } = parseCredentialBackupParts(parts);
        if (!email) {
          return {
            email: '',
            password,
            totpMfaSecret,
            gptPassword,
            verificationUrl,
            recordedAt,
            no2faFreeRoute,
            twoFactorEnabled,
            passkeyEnabled,
            passkeyCredentialId,
            status: 'failed',
            reason: `第 ${index + 1} 行缺少邮箱`,
          };
        }
        if (seen.has(email)) return null;
        seen.add(email);
        return {
          email,
          password,
          totpMfaSecret,
          gptPassword,
          verificationUrl,
          accessToken,
          recordedAt,
          no2faFreeRoute,
          twoFactorEnabled,
          passkeyEnabled,
          passkeyCredentialId,
          accessTokenUpdatedAt,
          checkedAt: checkedAt || accessTokenUpdatedAt,
        };
      })
      .filter(Boolean);
  }

  function normalizeCredentialBackupMap(value = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const records = {};
    Object.entries(value).forEach(([key, rawRecord]) => {
      const record = rawRecord && typeof rawRecord === 'object' && !Array.isArray(rawRecord)
        ? rawRecord
        : {};
      const email = normalizeEmail(record.email || key);
      if (!email) return;
      records[email] = {
        ...record,
        email,
        password: normalizeString(record.password || record.gptPassword || ''),
        totpMfaSecret: normalizeTotpSecret(record.totpMfaSecret || record.totpSecret || ''),
        passkeyEnabled: record.passkeyEnabled === true || Boolean(normalizeString(record.passkeyCredentialId || record.credentialId || record.credential_id)),
        passkeyEnabledAt: normalizeString(record.passkeyEnabledAt || ''),
        passkeyCredentialId: normalizeString(record.passkeyCredentialId || record.credentialId || record.credential_id),
        passkeyFactorId: normalizeString(record.passkeyFactorId || record.factorId || record.factor_id),
        passkeyRpId: normalizeString(record.passkeyRpId || record.rpId || record.rp_id),
        passkeyUserHandle: normalizeString(record.passkeyUserHandle || record.userHandle || record.user_handle),
        passkeyPrivateJwk: record.passkeyPrivateJwk && typeof record.passkeyPrivateJwk === 'object' && !Array.isArray(record.passkeyPrivateJwk)
          ? record.passkeyPrivateJwk
          : null,
        passkeyPublicKeyCose: normalizeString(record.passkeyPublicKeyCose || record.publicKeyCose || record.public_key_cose),
        passkeyApiPersisted: record.passkeyApiPersisted === true || record.persisted === true,
        updatedAt: normalizeString(record.updatedAt || ''),
      };
    });
    return records;
  }

  function buildCredentialRowsFromBackupMap(backups = {}) {
    const seen = new Set();
    return Object.values(normalizeCredentialBackupMap(backups))
      .sort((left, right) => Date.parse(right.updatedAt || '') - Date.parse(left.updatedAt || ''))
      .map((record) => {
        const email = normalizeEmail(record.email);
        if (!email || seen.has(email)) return null;
        seen.add(email);
        return {
          email,
          password: normalizeString(record.password),
          totpMfaSecret: normalizeTotpSecret(record.totpMfaSecret),
          verificationUrl: normalizeString(record.verificationUrl || record.emailVerificationUrl || record.url),
          passkeyEnabled: record.passkeyEnabled === true,
          passkeyEnabledAt: normalizeString(record.passkeyEnabledAt),
          passkeyCredentialId: normalizeString(record.passkeyCredentialId),
          passkeyFactorId: normalizeString(record.passkeyFactorId),
          passkeyRpId: normalizeString(record.passkeyRpId),
          passkeyUserHandle: normalizeString(record.passkeyUserHandle),
          passkeyPrivateJwk: record.passkeyPrivateJwk && typeof record.passkeyPrivateJwk === 'object' && !Array.isArray(record.passkeyPrivateJwk)
            ? record.passkeyPrivateJwk
            : null,
          passkeyPublicKeyCose: normalizeString(record.passkeyPublicKeyCose),
          passkeyApiPersisted: record.passkeyApiPersisted === true,
          accessToken: normalizeString(record.accessToken || record.token || record.access_token),
          accessTokenUpdatedAt: normalizeString(record.accessTokenUpdatedAt || record.updatedAt),
        };
      })
      .filter(Boolean);
  }

  function normalizeResultItem(item = {}) {
    const email = normalizeEmail(item.email);
    const rawAccessToken = normalizeString(item.accessToken || item.token || item.access_token || item.upiRedeemAccessToken);
    const rawAccessTokenUpdatedAt = normalizeString(item.accessTokenUpdatedAt || item.tokenUpdatedAt);
    const accessTokenIsTimestamp = rawAccessToken
      && !rawAccessTokenUpdatedAt
      && isLikelyCredentialTimestamp(rawAccessToken);
    const accessToken = accessTokenIsTimestamp ? '' : rawAccessToken;
    const accessTokenUpdatedAt = rawAccessTokenUpdatedAt || (accessTokenIsTimestamp ? rawAccessToken : '');
    const status = ['paid', 'free', 'failed'].includes(normalizeString(item.status))
      ? normalizeString(item.status)
      : 'failed';
    const rawRedeemChannel = normalizeString(item.redeemChannel || item.channel || item.paymentChannel);
    const redeemChannel = rawRedeemChannel ? normalizeRedeemChannel(rawRedeemChannel) : '';
    const legacyFailureCount = Math.max(0, Math.floor(Number(item.redeemFailureCount) || 0));
    const upiRedeemFailureCount = Math.max(0, Math.floor(Number(
      item.upiRedeemFailureCount ?? (redeemChannel === 'upi' ? legacyFailureCount : 0)
    ) || 0));
    const idealRedeemFailureCount = Math.max(0, Math.floor(Number(
      item.idealRedeemFailureCount ?? (redeemChannel === 'ideal' ? legacyFailureCount : 0)
    ) || 0));
    const redeemLocked = normalizeBoolean(item.redeemLocked) || idealRedeemFailureCount >= REDEEM_CHANNEL_FAILURE_LIMIT;
    const normalized = {
      email,
      password: normalizeString(item.password),
      totpMfaSecret: normalizeTotpSecret(item.totpMfaSecret),
      gptPassword: normalizeString(item.gptPassword || item.password),
      verificationUrl: normalizeString(item.verificationUrl || item.emailVerificationUrl || item.url),
      recordedAt: Math.max(0, Math.floor(Number(item.recordedAt || item.no2faFreeRecordedAt) || 0)),
      no2faFreeRoute: item.no2faFreeRoute === true,
      passkeyEnabled: item.passkeyEnabled === true || Boolean(normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id)),
      passkeyEnabledAt: normalizeString(item.passkeyEnabledAt),
      passkeyCredentialId: normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id),
      passkeyFactorId: normalizeString(item.passkeyFactorId || item.factorId || item.factor_id),
      passkeyRpId: normalizeString(item.passkeyRpId || item.rpId || item.rp_id),
      passkeyUserHandle: normalizeString(item.passkeyUserHandle || item.userHandle || item.user_handle),
      passkeyPrivateJwk: item.passkeyPrivateJwk && typeof item.passkeyPrivateJwk === 'object' && !Array.isArray(item.passkeyPrivateJwk)
        ? item.passkeyPrivateJwk
        : null,
      passkeyPublicKeyCose: normalizeString(item.passkeyPublicKeyCose || item.publicKeyCose || item.public_key_cose),
      passkeyApiPersisted: item.passkeyApiPersisted === true || item.persisted === true,
      twoFactorEnabled: item.twoFactorEnabled === true
        || Boolean(normalizeTotpSecret(item.totpMfaSecret))
        || item.passkeyEnabled === true
        || Boolean(normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id)),
      status,
      planType: normalizePlanType(item.planType),
      checkedAt: normalizeString(item.checkedAt),
      reason: normalizeString(item.reason),
      trialEligibilityStatus: normalizeString(item.trialEligibilityStatus),
      trialEligibilityReason: normalizeString(item.trialEligibilityReason),
      trialEligibilityCheckedAt: normalizeString(item.trialEligibilityCheckedAt),
      accessToken,
      accessTokenMasked: accessToken ? (normalizeString(item.accessTokenMasked) || maskAccessToken(accessToken)) : '',
      accessTokenUpdatedAt,
      redeemStatus: normalizeString(item.redeemStatus),
      redeemReason: normalizeString(item.redeemReason),
      redeemFailureCount: Math.max(0, Math.floor(Number(item.redeemFailureCount) || 0)),
      redeemFailureLimit: Math.max(0, Math.floor(Number(item.redeemFailureLimit) || 0)),
      upiRedeemFailureCount,
      idealRedeemFailureCount,
      redeemLocked,
      redeemLockedReason: redeemLocked
        ? (normalizeString(item.redeemLockedReason) || 'IDEAL 已失败 3 次，账号已封存，不再使用')
        : '',
      redeemLockedAt: redeemLocked ? normalizeString(item.redeemLockedAt) : '',
      redeemLastFailedAt: normalizeString(item.redeemLastFailedAt),
      redeemAttemptedAt: normalizeString(item.redeemAttemptedAt),
      redeemSuccessAt: normalizeString(item.redeemSuccessAt),
      redeemChannel,
      upiRedeemCdkey: normalizeString(item.upiRedeemCdkey || item.cdkey),
      lastFailedUpiRedeemCdkey: normalizeString(item.lastFailedUpiRedeemCdkey || item.failedUpiRedeemCdkey),
      upiRedeemPendingVerifySince: normalizeString(item.upiRedeemPendingVerifySince),
      upiRedeemPendingVerifyLastCheckedAt: normalizeString(item.upiRedeemPendingVerifyLastCheckedAt),
      upiRedeemPendingVerifyLoggedAt: normalizeString(item.upiRedeemPendingVerifyLoggedAt),
      upiRedeemPendingVerifyReason: normalizeString(item.upiRedeemPendingVerifyReason),
      membershipOverrideStatus: normalizeString(item.membershipOverrideStatus),
      membershipOverrideCheckedAt: normalizeString(item.membershipOverrideCheckedAt),
    };
    if (Object.prototype.hasOwnProperty.call(item, 'upiRedeemSubscriptionActive')) {
      normalized.upiRedeemSubscriptionActive = item.upiRedeemSubscriptionActive === true;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'upiRedeemSubscriptionPlanType')) {
      normalized.upiRedeemSubscriptionPlanType = normalizePlanType(item.upiRedeemSubscriptionPlanType);
    }
    if (Object.prototype.hasOwnProperty.call(item, 'upiRedeemSubscriptionCheckedAt')) {
      normalized.upiRedeemSubscriptionCheckedAt = normalizeString(item.upiRedeemSubscriptionCheckedAt);
    }
    return normalized;
  }

  function dedupeResultItemsByEmail(items = []) {
    const byEmail = {};
    (Array.isArray(items) ? items : []).forEach((item) => {
      const normalized = normalizeResultItem(item);
      if (!normalized.email) return;
      byEmail[normalized.email] = normalized;
    });
    return Object.values(byEmail);
  }

  function normalizeTrialEligibilitySummaryItem(item = {}) {
    const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
    return {
      email: normalizeEmail(source.email),
      reason: normalizeString(source.reason),
    };
  }

  function normalizeTrialEligibilitySummary(value = {}) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const kept = Array.isArray(source.kept) ? source.kept.map(normalizeTrialEligibilitySummaryItem).filter((item) => item.email) : [];
    const skipped = Array.isArray(source.skipped) ? source.skipped.map(normalizeTrialEligibilitySummaryItem).filter((item) => item.email) : [];
    const failed = Array.isArray(source.failed) ? source.failed.map(normalizeTrialEligibilitySummaryItem).filter((item) => item.email) : [];
    const deletedEmails = Array.isArray(source.deletedEmails)
      ? source.deletedEmails.map(normalizeEmail).filter(Boolean)
      : [];
    return {
      checkedAt: normalizeString(source.checkedAt),
      kept,
      skipped,
      failed,
      deletedEmails,
      eligibleCount: Math.max(0, Math.floor(Number(source.eligibleCount) || kept.length || 0)),
      skippedCount: Math.max(0, Math.floor(Number(source.skippedCount) || skipped.length || 0)),
      failedCount: Math.max(0, Math.floor(Number(source.failedCount) || failed.length || 0)),
      deletedCount: Math.max(0, Math.floor(Number(source.deletedCount) || deletedEmails.length || 0)),
    };
  }

  function normalizeResultsPayload(value = {}) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const items = dedupeResultItemsByEmail(source.items);
    const trialEligibilitySummary = normalizeTrialEligibilitySummary(source.trialEligibilitySummary);
    const deletionStatePatch = buildRedeemDeletionStatePatch(source);
    return {
      items,
      running: source.running === true,
      redeeming: source.redeeming === true,
      startedAt: normalizeString(source.startedAt),
      updatedAt: normalizeString(source.updatedAt),
      finishedAt: normalizeString(source.finishedAt),
      stoppedAt: normalizeString(source.stoppedAt),
      redeemStartedAt: normalizeString(source.redeemStartedAt),
      redeemUpdatedAt: normalizeString(source.redeemUpdatedAt),
      redeemFinishedAt: normalizeString(source.redeemFinishedAt),
      redeemStoppedAt: normalizeString(source.redeemStoppedAt),
      flowStage: normalizeFlowStage(source.flowStage),
      flowStageEmail: normalizeEmail(source.flowStageEmail),
      flowMode: normalizeString(source.flowMode) === 'login-only' && normalizeString(source.source) === 'row-login'
        ? 'login-only'
        : '',
      source: normalizeString(source.source),
      total: Math.max(0, Math.floor(Number(source.total) || items.length || 0)),
      completed: Math.max(0, Math.floor(Number(source.completed) || items.length || 0)),
      redeemTotal: Math.max(0, Math.floor(Number(source.redeemTotal) || 0)),
      redeemCompleted: Math.max(0, Math.floor(Number(source.redeemCompleted) || 0)),
      paidCount: items.filter((item) => item.status === 'paid').length,
      freeCount: items.filter((item) => item.status === 'free').length,
      failedCount: items.filter((item) => item.status === 'failed').length,
      trialEligibilitySummary,
      ...deletionStatePatch,
    };
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
    const normalizedStatus = normalizeString(status);
    const normalizedChannel = normalizeString(channel) ? normalizeRedeemChannel(channel) : '';
    const normalizedResults = normalizeResultsPayload(results);
    const allowedEmailSet = new Set(normalizeEmailList(emails));
    const seenExportKeys = new Set();
    return normalizedResults.items
      .filter((item) => {
        const email = normalizeEmail(item.email);
        if (!email || (allowedEmailSet.size && !allowedEmailSet.has(email))) return false;
        const statusMatches = normalizedStatus === 'free'
          ? item.status === 'free' || item.status === 'failed'
          : item.status === normalizedStatus;
        if (!statusMatches) return false;
        if (normalizedStatus === 'paid' && normalizedChannel) {
          if (
            getResultItemRedeemChannel(item) !== normalizedChannel
            || isResultItemHiddenByPlusDeletion(normalizedResults, item, normalizedChannel)
          ) {
            return false;
          }
        } else if (normalizedStatus === 'paid' && isResultItemHiddenByPlusDeletion(normalizedResults, item)) {
          return false;
        }
        if (normalizedStatus !== 'failed') {
          const no2faExportable = normalizedStatus === 'free'
            && item.no2faFreeRoute === true
            && item.email
            && item.verificationUrl
            && item.accessToken;
          const passkeyExportable = isResultItemPasskeyExportableForStatus(item, normalizedStatus);
          const password2faExportable = Boolean(item.email && item.password && item.totpMfaSecret);
          if (!no2faExportable && !passkeyExportable && !password2faExportable) return false;
        }
        const key = normalizedStatus === 'paid'
          ? `${getResultItemRedeemChannel(item)}:${email}`
          : `${normalizedStatus}:${email}`;
        if (seenExportKeys.has(key)) return false;
        seenExportKeys.add(key);
        return true;
      })
      .map((item) => {
        if (normalizedStatus === 'failed') {
          return `${item.email}---${item.reason || '核验失败'}`;
        }
        if (normalizedStatus === 'free') {
          if (item.no2faFreeRoute === true && item.verificationUrl && item.accessToken) {
            const timestamp = formatNo2faFreeExportTime(getNo2faFreeExportTimestamp(item));
            const verificationUrl = normalizeNo2faFreeVerificationUrlForExport(item.verificationUrl);
            return `${item.email}---${verificationUrl}---${item.accessToken || ''}---${timestamp}`;
          }
          const timestamp = formatNo2faFreeExportTime(getNo2faFreeExportTimestamp(item));
          if (item.passkeyEnabled === true && item.password && item.accessToken && !item.totpMfaSecret) {
            if (item.verificationUrl) {
              const verificationUrl = normalizeNo2faFreeVerificationUrlForExport(item.verificationUrl);
              return `${item.email}---${item.password}---${buildPasskeyExportMarker(item)}---${verificationUrl}---${item.accessToken || ''}---${timestamp}`;
            }
            return `${item.email}---${item.password}---${buildPasskeyExportMarker(item)}---${item.accessToken || ''}---${timestamp}`;
          }
          if (item.verificationUrl) {
            const verificationUrl = normalizeNo2faFreeVerificationUrlForExport(item.verificationUrl);
            return `${item.email}---${item.password}---${item.totpMfaSecret}---${verificationUrl}---${item.accessToken || ''}---${timestamp}`;
          }
          return `${item.email}---${item.password}---${item.totpMfaSecret}---${item.accessToken || ''}---${timestamp}`;
        }
        const timestamp = item.redeemSuccessAt || item.upiRedeemSubscriptionCheckedAt || item.checkedAt || '';
        if (item.passkeyEnabled === true && item.password && !item.totpMfaSecret) {
          return `${item.email}----${item.password}---${buildPasskeyExportMarker(item)}---${timestamp}`;
        }
        return `${item.email}----${item.password}---${item.totpMfaSecret}---${timestamp}`;
      })
      .filter(Boolean);
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

    async function getStoredResults() {
      const stored = await chromeApi.storage.local.get([RESULTS_STORAGE_KEY]).catch(() => ({}));
      const payload = normalizeResultsPayload(stored?.[RESULTS_STORAGE_KEY]);
      if (payload.running === true && !batchRunning) {
        const fixedAt = new Date().toISOString();
        const fixed = normalizeResultsPayload({
          ...payload,
          running: false,
          updatedAt: fixedAt,
          stoppedAt: payload.stoppedAt || fixedAt,
          flowStage: '',
          flowStageEmail: '',
        });
        await chromeApi.storage.local.set({ [RESULTS_STORAGE_KEY]: fixed }).catch(() => {});
        if (typeof setState === 'function') {
          await setState({ [RESULTS_STORAGE_KEY]: fixed }).catch(() => {});
        }
        broadcastDataUpdate({ [RESULTS_STORAGE_KEY]: fixed });
        return fixed;
      }
      if (payload.redeeming === true && !redeemRunning && !cdkeyRetryRunning) {
        const fixedAt = new Date().toISOString();
        const fixed = normalizeResultsPayload({
          ...payload,
          redeeming: false,
          redeemUpdatedAt: fixedAt,
          redeemStoppedAt: payload.redeemStoppedAt || fixedAt,
          flowStage: '',
          flowStageEmail: '',
        });
        await chromeApi.storage.local.set({ [RESULTS_STORAGE_KEY]: fixed }).catch(() => {});
        if (typeof setState === 'function') {
          await setState({ [RESULTS_STORAGE_KEY]: fixed }).catch(() => {});
        }
        broadcastDataUpdate({ [RESULTS_STORAGE_KEY]: fixed });
        return fixed;
      }
      return payload;
    }

    async function saveResults(results = {}) {
      const stored = await chromeApi.storage.local.get([RESULTS_STORAGE_KEY]).catch(() => ({}));
      const previousPayload = normalizeResultsPayload(stored?.[RESULTS_STORAGE_KEY]);
      const payload = normalizeResultsPayload({
        ...results,
        ...mergeRedeemDeletionStateForSave(previousPayload, results),
      });
      await chromeApi.storage.local.set({ [RESULTS_STORAGE_KEY]: payload });
      if (typeof setState === 'function') {
        await setState({ [RESULTS_STORAGE_KEY]: payload }).catch(() => {});
      }
      broadcastDataUpdate({ [RESULTS_STORAGE_KEY]: payload });
      return payload;
    }

    async function updateUpiRedeemCdkeyRetryUsage(cdkey = '', updater = () => ({})) {
      const normalizedCdkey = normalizeString(cdkey);
      if (!normalizedCdkey) {
        return { usage: {}, entry: {} };
      }
      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      const usage = normalizeUpiRedeemCdkeyUsage(getUpiRedeemStateValue(latestState, 'upiRedeemCdkeyUsage') || {});
      const currentEntry = usage?.[normalizedCdkey] && typeof usage[normalizedCdkey] === 'object' && !Array.isArray(usage[normalizedCdkey])
        ? usage[normalizedCdkey]
        : {};
      const nextEntry = {
        ...currentEntry,
        ...(typeof updater === 'function' ? (updater(currentEntry) || {}) : {}),
      };
      const storedEntry = {
        ...nextEntry,
        usedAt: Math.max(0, Math.floor(Number(nextEntry.usedAt) || 0)),
        lastAttemptAt: Math.max(0, Math.floor(Number(nextEntry.lastAttemptAt) || 0)),
        lastError: normalizeString(nextEntry.lastError),
        enabled: nextEntry.enabled !== false,
        email: normalizeEmail(nextEntry.email || nextEntry.accountEmail || nextEntry.credentialEmail),
        remoteStatus: normalizeString(nextEntry.remoteStatus),
        remoteMessage: normalizeString(nextEntry.remoteMessage),
        remoteCheckedAt: Math.max(0, Math.floor(Number(nextEntry.remoteCheckedAt) || 0)),
        canCancel: normalizeBoolean(nextEntry.canCancel ?? nextEntry.can_cancel),
        canRetry: normalizeBoolean(nextEntry.canRetry ?? nextEntry.can_retry),
        canReuseToken: normalizeBoolean(nextEntry.canReuseToken ?? nextEntry.can_reuse_token),
        hasAccessToken: normalizeBoolean(nextEntry.hasAccessToken ?? nextEntry.has_access_token),
        retryCount: normalizeRetryCount(nextEntry.retryCount),
        lastRetryAt: Math.max(0, Math.floor(Number(nextEntry.lastRetryAt) || 0)),
        retrying: nextEntry.retrying === true,
        retryError: normalizeString(nextEntry.retryError),
      };
      const nextUsage = {
        ...usage,
        [normalizedCdkey]: storedEntry,
      };
      if (typeof setState === 'function') {
        await setState({
          cdkUsage: nextUsage,
          upiRedeemCdkUsage: nextUsage,
          upiRedeemCdkeyUsage: nextUsage,
        }).catch(() => {});
      }
      broadcastDataUpdate({
        cdkUsage: nextUsage,
        upiRedeemCdkUsage: nextUsage,
        upiRedeemCdkeyUsage: nextUsage,
      });
      return { usage: nextUsage, entry: storedEntry };
    }

    function buildRetryUpdatesPayload(results = null, usage = null, channel = 'upi') {
      const updates = {};
      if (usage && typeof usage === 'object' && !Array.isArray(usage)) {
        Object.assign(updates, buildRedeemChannelUsageUpdates(channel, usage));
      }
      if (results && typeof results === 'object' && !Array.isArray(results)) {
        updates[RESULTS_STORAGE_KEY] = results;
      }
      return updates;
    }

    function sanitizeUpiRedeemRuntimeSettings(settings = {}) {
      const source = settings && typeof settings === 'object' && !Array.isArray(settings)
        ? settings
        : {};
      const sanitized = { ...source };
      delete sanitized.cdkUsage;
      delete sanitized.upiRedeemCdkUsage;
      delete sanitized.upiRedeemCdkeyUsage;
      delete sanitized.pixRedeemCdkeyUsage;
      delete sanitized.idealRedeemCdkeyUsage;
      return sanitized;
    }

    function hasUpiRedeemCdkeyUsageState(state = {}) {
      return Boolean(state && typeof state === 'object' && !Array.isArray(state) && (
        Object.prototype.hasOwnProperty.call(state, 'upiRedeemCdkeyUsage')
        || Object.prototype.hasOwnProperty.call(state, 'cdkUsage')
        || Object.prototype.hasOwnProperty.call(state, 'upiRedeemCdkUsage')
        || Object.prototype.hasOwnProperty.call(state, 'pixRedeemCdkeyUsage')
        || Object.prototype.hasOwnProperty.call(state, 'idealRedeemCdkeyUsage')
      ));
    }

    function preferLatestUpiRedeemCdkeyPoolState(state = {}, latestState = {}) {
      ['cdkPoolText', 'upiRedeemCdkPoolText', 'upiRedeemCdkeyPoolText', 'pixRedeemCdkeyPoolText', 'idealRedeemCdkeyPoolText'].forEach((key) => {
        if (latestState && typeof latestState === 'object' && !Array.isArray(latestState)
          && Object.prototype.hasOwnProperty.call(latestState, key)) {
          state[key] = latestState[key];
        }
      });
      return state;
    }

    async function getFreshUpiRedeemRuntimeState(input = {}) {
      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      const settings = input.settings && typeof input.settings === 'object' && !Array.isArray(input.settings)
        ? input.settings
        : {};
      const sanitizedInput = sanitizeUpiRedeemRuntimeSettings(input);
      delete sanitizedInput.settings;
      const state = {
        ...(latestState || {}),
        ...sanitizeUpiRedeemRuntimeSettings(settings),
        ...sanitizedInput,
      };
      preferLatestUpiRedeemCdkeyPoolState(state, latestState);
      if (hasUpiRedeemCdkeyUsageState(latestState)) {
        state.upiRedeemCdkeyUsage = getUpiRedeemStateValue(latestState, 'upiRedeemCdkeyUsage') || {};
        state.cdkUsage = state.upiRedeemCdkeyUsage;
        state.upiRedeemCdkUsage = state.upiRedeemCdkeyUsage;
        state.idealRedeemCdkeyUsage = latestState?.idealRedeemCdkeyUsage || {};
      } else if (hasUpiRedeemCdkeyUsageState(settings)) {
        state.upiRedeemCdkeyUsage = getUpiRedeemStateValue(settings, 'upiRedeemCdkeyUsage') || {};
        state.cdkUsage = state.upiRedeemCdkeyUsage;
        state.upiRedeemCdkUsage = state.upiRedeemCdkeyUsage;
        state.idealRedeemCdkeyUsage = settings?.idealRedeemCdkeyUsage || {};
      } else if (hasUpiRedeemCdkeyUsageState(input)) {
        state.upiRedeemCdkeyUsage = getUpiRedeemStateValue(input, 'upiRedeemCdkeyUsage') || {};
        state.cdkUsage = state.upiRedeemCdkeyUsage;
        state.upiRedeemCdkUsage = state.upiRedeemCdkeyUsage;
        state.idealRedeemCdkeyUsage = input?.idealRedeemCdkeyUsage || {};
      }
      return state;
    }

    function isNonRetryableUpiRedeemRetryError(message = '') {
      const text = normalizeString(message);
      return /缺少\s*GPT\s*密码|缺少\s*2FA|登录需要邮箱一次性验证码|登录后需要邮箱|邮箱一次性验证码|验证码页面|登录密码未通过|密码未通过|2FA\s*动态码被页面拒绝|账号登录态不一致|accessToken\s*属于|未读取到\s*accessToken|未进入\s*ChatGPT\s*已登录态|账号无资格|access[_-]?token\s*无效|access[_-]?token[\s\S]*(?:过期|失效|expired|invalid)|无效或已过期|未登录|会话已过期|重新登录|session\s*expired/i.test(text);
    }

    function isAccessTokenInvalidMembershipError(error) {
      const text = normalizeString(getErrorMessage(error));
      if (!text) {
        return false;
      }
      return /(?:access[_\s-]?token|accessToken|token|\bAT\b|会话|session)[\s\S]*(?:无效|过期|失效|未登录|重新登录|invalid|expired|unauthorized|401)|(?:无效|过期|失效|未登录|重新登录|invalid|expired|unauthorized|401)[\s\S]*(?:access[_\s-]?token|accessToken|token|\bAT\b|会话|session)|session\s*expired|\bHTTP\s*401\b|401\s*Unauthorized/i.test(text);
    }

    function buildMissingAccessTokenRefreshMaterialReason(credential = {}) {
      const missing = [];
      if (!normalizeString(credential.password)) {
        missing.push('GPT 密码');
      }
      return missing.length ? `缺少 ${missing.join('、')}` : '';
    }

    function isPreSubmitUpiRedeemBlockedReason(message = '') {
      const text = normalizeString(message);
      return isNonRetryableUpiRedeemRetryError(text)
        || /提交密码后|未进入登录验证码页|登录未进入验证码页|登录或读取\s*accessToken\s*未完成|读取\s*accessToken\s*未完成|verify your identity|one-time password|one-time code/i.test(text);
    }

    function isPreSubmitUpiRedeemBlockedResultItem(item = {}) {
      const redeemStatus = normalizeString(item?.redeemStatus).toLowerCase();
      const cdkey = normalizeString(item?.upiRedeemCdkey || item?.cdkey);
      const reason = normalizeString(item?.redeemReason || item?.reason);
      return redeemStatus === 'failed' && !cdkey && isPreSubmitUpiRedeemBlockedReason(reason);
    }

    function isRetryableUpiRedeemRoundResultItem(item = {}, totalRoundLimit = 1, channel = 'upi') {
      const status = normalizeString(item?.status).toLowerCase();
      const redeemStatus = normalizeString(item?.redeemStatus).toLowerCase();
      if (status !== 'free' || redeemStatus !== 'failed') return false;
      if (!normalizeString(item?.accessToken)) return false;
      if (!shouldRedeemItemUseChannel(item, channel)) return false;
      if (isPreSubmitUpiRedeemBlockedResultItem(item)) return false;
      if (isNonRetryableUpiRedeemRetryError(item?.redeemReason || item?.reason)) return false;
      if (normalizeRedeemChannel(channel) === 'upi') return true;
      return getRedeemChannelFailureCount(item, channel) < Math.max(1, Math.floor(Number(totalRoundLimit) || 1));
    }

    function isUpiTrialIneligibleError(error) {
      const message = getErrorMessage(error);
      return /^UPI_ACCOUNT_INELIGIBLE::/i.test(normalizeString(error?.message || error))
        || /账号无资格|无试用资格|没有试用资格|无资格|not eligible|ineligible/i.test(message);
    }

    async function getBackupCredentialsFromLocalStorage() {
      const stored = await chromeApi.storage.local.get([BACKUP_STORAGE_KEY]).catch(() => ({}));
      return buildCredentialRowsFromBackupMap(stored?.[BACKUP_STORAGE_KEY] || {});
    }

    async function getUpiCredentialMembershipCredentialPool() {
      const stored = await chromeApi.storage.local.get([BACKUP_STORAGE_KEY]).catch(() => ({}));
      const backups = normalizeCredentialBackupMap(stored?.[BACKUP_STORAGE_KEY] || {});
      const items = Object.values(backups)
        .sort((left, right) => Date.parse(right.updatedAt || '') - Date.parse(left.updatedAt || ''))
        .map((record) => ({
          email: normalizeEmail(record.email),
          password: normalizeString(record.password),
          totpMfaSecret: normalizeTotpSecret(record.totpMfaSecret),
          verificationUrl: normalizeString(record.verificationUrl || record.emailVerificationUrl || record.url),
          passkeyEnabled: record.passkeyEnabled === true,
          passkeyEnabledAt: normalizeString(record.passkeyEnabledAt),
          passkeyCredentialId: normalizeString(record.passkeyCredentialId),
          passkeyFactorId: normalizeString(record.passkeyFactorId),
          passkeyRpId: normalizeString(record.passkeyRpId),
          passkeyUserHandle: normalizeString(record.passkeyUserHandle),
          passkeyPrivateJwk: record.passkeyPrivateJwk && typeof record.passkeyPrivateJwk === 'object' && !Array.isArray(record.passkeyPrivateJwk)
            ? record.passkeyPrivateJwk
            : null,
          passkeyPublicKeyCose: normalizeString(record.passkeyPublicKeyCose),
          passkeyApiPersisted: record.passkeyApiPersisted === true,
          updatedAt: normalizeString(record.updatedAt),
          source: 'local',
        }))
        .filter((item) => item.email);
      return {
        items,
        total: items.length,
        updatedAt: new Date().toISOString(),
      };
    }

    async function findBackupCredentialByEmail(email = '') {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        return {};
      }
      try {
        const pool = await getUpiCredentialMembershipCredentialPool();
        return (pool.items || []).find((item) => normalizeEmail(item?.email) === normalizedEmail) || {};
      } catch {
        return {};
      }
    }

    function isActiveUpiCredentialMembershipRedeemResultItem(item = {}, results = {}) {
      const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
      const email = normalizeEmail(source.email);
      const currentEmail = normalizeEmail(results?.flowStageEmail);
      if (results?.redeeming === true && email && currentEmail && email === currentEmail) {
        return true;
      }
      return [
        source.redeemStatus,
        source.remoteStatus,
        source.remote_status,
        source.remoteMessage,
        source.remote_message,
      ].some((status) => isActiveUpiRedeemRemoteStatus(status));
    }

    function getActiveUpiCredentialMembershipRedeemEmailSet(results = {}, emailSet = null) {
      const activeEmails = new Set();
      (Array.isArray(results.items) ? results.items : []).forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (!email || (emailSet && !emailSet.has(email))) {
          return;
        }
        if (isActiveUpiCredentialMembershipRedeemResultItem(item, results)) {
          activeEmails.add(email);
        }
      });
      return activeEmails;
    }

    function getActiveUpiRedeemCdkeyUsageEmailSet(usage = {}, emailSet = null) {
      const activeEmails = new Set();
      const source = usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
      Object.values(source).forEach((entry) => {
        const email = getUpiRedeemCdkeyUsageEntryEmail(entry);
        if (!email || (emailSet && !emailSet.has(email))) {
          return;
        }
        if (
          normalizeBoolean(entry?.canCancel ?? entry?.can_cancel)
          || isActiveUpiRedeemRemoteStatus(entry?.remoteStatus)
          || isActiveUpiRedeemRemoteStatus(entry?.remoteMessage)
          || entry?.retrying === true
        ) {
          activeEmails.add(email);
        }
      });
      return activeEmails;
    }

    function getActiveRedeemCdkeyUsageEmailSetFromState(state = {}, emailSet = null) {
      const activeEmails = new Set();
      ['upi', 'ideal'].forEach((channel) => {
        getActiveUpiRedeemCdkeyUsageEmailSet(
          normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(state, channel)),
          emailSet
        ).forEach((email) => activeEmails.add(email));
      });
      return activeEmails;
    }

    async function deleteUpiCredentialMembershipCredentials(input = {}) {
      const emails = (Array.isArray(input.emails) ? input.emails : [input.email])
        .map(normalizeEmail)
        .filter(Boolean);
      const emailSet = new Set(emails);
      if (!emailSet.size) {
        return {
          deletedCount: 0,
          pool: await getUpiCredentialMembershipCredentialPool(),
          results: await getStoredResults(),
        };
      }

      const currentResults = await getStoredResults();
      const skippedEmailSet = getActiveUpiCredentialMembershipRedeemEmailSet(currentResults, emailSet);
      const safeEmailSet = new Set(emails.filter((email) => !skippedEmailSet.has(email)));
      const skippedEmails = Array.from(skippedEmailSet);
      if (!safeEmailSet.size) {
        return {
          deletedCount: 0,
          deletedEmails: [],
          skippedCount: skippedEmails.length,
          skippedEmails,
          blockedEmails: skippedEmails,
          pool: await getUpiCredentialMembershipCredentialPool(),
          results: currentResults,
        };
      }

      let deletedCount = 0;
      const deletedEmailSet = new Set();
      if (input.deleteBackups !== false) {
        const stored = await chromeApi.storage.local.get([BACKUP_STORAGE_KEY]).catch(() => ({}));
        const backups = normalizeCredentialBackupMap(stored?.[BACKUP_STORAGE_KEY] || {});
        for (const email of safeEmailSet) {
          if (Object.prototype.hasOwnProperty.call(backups, email)) {
            delete backups[email];
            deletedCount += 1;
            deletedEmailSet.add(email);
          }
        }
        await chromeApi.storage.local.set({ [BACKUP_STORAGE_KEY]: backups });
      }

      const nextItems = currentResults.items.filter((item) => {
        const email = normalizeEmail(item.email);
        const keep = !safeEmailSet.has(email);
        if (!keep && email) {
          deletedEmailSet.add(email);
        }
        return keep;
      });
      if (input.deleteBackups === false) {
        safeEmailSet.forEach((email) => deletedEmailSet.add(email));
      }
      const nextResults = await saveResults({
        ...currentResults,
        items: nextItems,
        total: nextItems.length,
        completed: Math.min(currentResults.completed, nextItems.length),
        updatedAt: new Date().toISOString(),
      });
      const pool = await getUpiCredentialMembershipCredentialPool();
      const deletedEmails = Array.from(deletedEmailSet);
      return {
        deletedCount: input.deleteBackups === false ? safeEmailSet.size : Math.max(deletedCount, deletedEmails.length),
        deletedEmails,
        skippedCount: skippedEmails.length,
        skippedEmails,
        blockedEmails: skippedEmails,
        pool,
        results: nextResults,
      };
    }

    async function deleteUpiCredentialMembershipCheckResults(input = {}) {
      const rawStatus = normalizeString(input.status || 'paid').toLowerCase() || 'paid';
      const status = ['paid-upi', 'paid-ideal', 'paid-all'].includes(rawStatus) ? 'paid' : rawStatus;
      const requestedChannel = normalizeString(input.channel).toLowerCase();
      const targetChannel = ['upi', 'ideal'].includes(requestedChannel)
        ? normalizeRedeemChannel(requestedChannel)
        : (rawStatus === 'paid-upi' ? 'upi' : (rawStatus === 'paid-ideal' ? 'ideal' : ''));
      const plusDeleteChannels = status === 'paid'
        ? (targetChannel ? [targetChannel] : ['upi', 'ideal'])
        : [];
      const emails = (Array.isArray(input.emails) ? input.emails : [])
        .map(normalizeEmail)
        .filter(Boolean);
      const emailSet = new Set(emails);
      const currentResults = await getStoredResults();

      const isTargetStatusItem = (item = {}) => {
        const itemStatus = normalizeString(item.status).toLowerCase();
        if (status === 'free') {
          return itemStatus === 'free' || itemStatus === 'failed';
        }
        if (status === 'paid') {
          if (itemStatus !== 'paid') return false;
          return !targetChannel || getResultItemRedeemChannel(item) === targetChannel;
        }
        return itemStatus === status;
      };
      const targetItems = currentResults.items.filter((item) => (
        isTargetStatusItem(item)
        && (!emailSet.size || emailSet.has(normalizeEmail(item.email)))
      ));
      const targetEmailSet = new Set([
        ...emails,
        ...targetItems.map((item) => normalizeEmail(item.email)).filter(Boolean),
      ]);
      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      const skippedEmailSet = new Set([
        ...getActiveUpiCredentialMembershipRedeemEmailSet(currentResults, targetEmailSet),
        ...getActiveRedeemCdkeyUsageEmailSetFromState(latestState, targetEmailSet),
      ]);
      const safeTargetItems = targetItems.filter((item) => !skippedEmailSet.has(normalizeEmail(item.email)));
      const safeRequestedEmailSet = new Set(emails.filter((email) => !skippedEmailSet.has(email)));
      const deletedEmailSet = new Set([
        ...safeRequestedEmailSet,
        ...safeTargetItems.map((item) => normalizeEmail(item.email)).filter(Boolean),
      ]);
      const skippedEmails = Array.from(skippedEmailSet);
      const currentDeletionState = buildRedeemDeletionStatePatch(currentResults);
      const nextRedeemAutoDeletedEmails = deletedEmailSet.size && status !== 'paid'
        ? normalizeEmailList([
          ...currentDeletionState.redeemAutoDeletedEmails,
          ...deletedEmailSet,
        ])
        : currentDeletionState.redeemAutoDeletedEmails;
      const nextRedeemPlusDeletedEmailsByChannel = deletedEmailSet.size && status === 'paid'
        ? addRedeemPlusDeletedEmailsByChannel(
          currentDeletionState.redeemPlusDeletedEmailsByChannel,
          deletedEmailSet,
          plusDeleteChannels
        )
        : currentDeletionState.redeemPlusDeletedEmailsByChannel;
      const nextDeletionStatePatch = buildRedeemDeletionStatePatch({
        redeemAutoDeletedEmails: nextRedeemAutoDeletedEmails,
        redeemPlusDeletedEmailsByChannel: nextRedeemPlusDeletedEmailsByChannel,
      });
      let updates = {};

      if (deletedEmailSet.size) {
        const usageCleanupChannels = status === 'paid' ? plusDeleteChannels : ['upi', 'ideal'];
        usageCleanupChannels.forEach((channel) => {
          const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(latestState, channel));
          const usageCleanup = clearUpiRedeemCdkeyUsageAccountBindings(usage, deletedEmailSet, {
            clearNonActive: status === 'free',
          });
          if (usageCleanup.changed) {
            updates = {
              ...updates,
              ...buildRedeemChannelUsageUpdates(channel, usageCleanup.usage),
            };
          }
        });
      }

      if (!targetItems.length) {
        const nextResults = deletedEmailSet.size
          ? await saveResults({
            ...currentResults,
            ...nextDeletionStatePatch,
            updatedAt: new Date().toISOString(),
          })
          : currentResults;
        if (Object.keys(updates).length && typeof setState === 'function') {
          await setState(updates).catch(() => {});
          broadcastDataUpdate(updates);
        }
        return {
          status,
          deletedCount: deletedEmailSet.size,
          deletedEmails: Array.from(deletedEmailSet),
          skippedCount: skippedEmails.length,
          skippedEmails,
          blockedEmails: skippedEmails,
          results: nextResults,
          updates,
        };
      }

      const nextItems = emailSet.size
        ? currentResults.items.filter((item) => !(
          isTargetStatusItem(item)
          && safeRequestedEmailSet.has(normalizeEmail(item.email))
        ))
        : currentResults.items.filter((item) => !(
          isTargetStatusItem(item)
          && !skippedEmailSet.has(normalizeEmail(item.email))
        ));
      const nextResults = await saveResults({
        ...currentResults,
        items: nextItems,
        ...nextDeletionStatePatch,
        total: nextItems.length,
        completed: Math.min(currentResults.completed, nextItems.length),
        updatedAt: new Date().toISOString(),
      });
      if (Object.keys(updates).length && typeof setState === 'function') {
        await setState(updates).catch(() => {});
        broadcastDataUpdate(updates);
      }
      return {
        status,
        deletedCount: Math.max(safeTargetItems.length, deletedEmailSet.size),
        deletedEmails: Array.from(deletedEmailSet),
        skippedCount: skippedEmails.length,
        skippedEmails,
        blockedEmails: skippedEmails,
        results: nextResults,
        updates,
      };
    }

    function resolveInputCredentials(input = {}) {
      const textCredentials = parseCredentialBackupText(input.text || input.fileContent || '');
      const directCredentials = Array.isArray(input.credentials)
        ? input.credentials.map((item) => {
            const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
            const no2faFreeRoute = source.no2faFreeRoute === true;
            const recordedAt = Math.max(0, Math.floor(Number(source.recordedAt || source.no2faFreeRecordedAt) || 0));
            return {
              email: normalizeEmail(source.email),
              password: no2faFreeRoute ? '' : normalizeString(source.password),
              gptPassword: no2faFreeRoute ? '' : normalizeString(source.gptPassword || source.password),
              totpMfaSecret: no2faFreeRoute ? '' : normalizeTotpSecret(source.totpMfaSecret || source.totpSecret),
              passkeyEnabled: no2faFreeRoute ? false : (source.passkeyEnabled === true || Boolean(normalizeString(source.passkeyCredentialId || source.credentialId || source.credential_id))),
              passkeyEnabledAt: normalizeString(source.passkeyEnabledAt),
              passkeyCredentialId: normalizeString(source.passkeyCredentialId || source.credentialId || source.credential_id),
              passkeyFactorId: normalizeString(source.passkeyFactorId || source.factorId || source.factor_id),
              passkeyRpId: normalizeString(source.passkeyRpId || source.rpId || source.rp_id),
              passkeyUserHandle: normalizeString(source.passkeyUserHandle || source.userHandle || source.user_handle),
              passkeyPrivateJwk: source.passkeyPrivateJwk && typeof source.passkeyPrivateJwk === 'object' && !Array.isArray(source.passkeyPrivateJwk)
                ? source.passkeyPrivateJwk
                : null,
              passkeyPublicKeyCose: normalizeString(source.passkeyPublicKeyCose || source.publicKeyCose || source.public_key_cose),
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

    async function upsertTrialEligibleFreeCredential(input = {}) {
      const credential = input.credential && typeof input.credential === 'object' && !Array.isArray(input.credential)
        ? input.credential
        : {};
      const email = normalizeEmail(input.email || credential.email);
      if (!email) {
        throw new Error('缺少要写入 Free 分组的账号邮箱。');
      }
      const checkedAt = normalizeString(input.checkedAt) || new Date().toISOString();
      const currentResults = await getStoredResults();
      const nextRedeemAutoDeletedEmails = (Array.isArray(currentResults.redeemAutoDeletedEmails)
        ? currentResults.redeemAutoDeletedEmails
        : []
      ).map(normalizeEmail).filter((item) => item && item !== email);
      const currentRedeemPlusDeletedEmailsByChannel = normalizeRedeemPlusDeletedEmailsByChannel(
        currentResults.redeemPlusDeletedEmailsByChannel
      );
      const existingItem = currentResults.items.find((item) => normalizeEmail(item?.email) === email) || {};
      let backupCredential = {};
      try {
        const pool = await getUpiCredentialMembershipCredentialPool();
        backupCredential = (pool.items || []).find((item) => normalizeEmail(item?.email) === email) || {};
      } catch {
        backupCredential = {};
      }
      const source = normalizeString(input.source || credential.source);
      const reason = normalizeString(input.reason || input.message || credential.reason) || '账号有试用资格，可进行 CDK 兑换';
      const trialEligibilityStatus = normalizeString(
        input.trialEligibilityStatus
        || credential.trialEligibilityStatus
        || existingItem.trialEligibilityStatus
        || 'eligible'
      );
      const trialEligibilityReason = normalizeString(
        input.trialEligibilityReason
        || credential.trialEligibilityReason
        || reason
      );
      const trialEligibilityCheckedAt = normalizeString(
        input.trialEligibilityCheckedAt
        || credential.trialEligibilityCheckedAt
        || checkedAt
      );
      const accessToken = normalizeString(input.accessToken || input.token || input.access_token || credential.accessToken || existingItem.accessToken);
      const accessTokenUpdatedAt = accessToken
        ? normalizeString(input.accessTokenUpdatedAt || credential.accessTokenUpdatedAt || checkedAt)
        : normalizeString(existingItem.accessTokenUpdatedAt);
      const verificationUrl = normalizeString(
        input.verificationUrl
        || credential.verificationUrl
        || credential.emailVerificationUrl
        || credential.url
        || existingItem.verificationUrl
        || existingItem.emailVerificationUrl
      );
      const recordedAt = Math.max(0, Math.floor(Number(
        input.recordedAt
        || credential.recordedAt
        || existingItem.recordedAt
        || Date.parse(trialEligibilityCheckedAt)
        || Date.now()
      ) || Date.now()));
      const hasIncoming2faMaterial = Boolean(
        normalizeTotpSecret(credential.totpMfaSecret || credential.totpSecret || input.totpMfaSecret || input.totpSecret)
      );
      const no2faFreeRoute = input.no2faFreeRoute === true
        || credential.no2faFreeRoute === true
        || (!hasIncoming2faMaterial && existingItem.no2faFreeRoute === true);
      const twoFactorEnabled = no2faFreeRoute ? false : (
        input.twoFactorEnabled === true
        || credential.twoFactorEnabled === true
        || Boolean(normalizeTotpSecret(credential.totpMfaSecret || credential.totpSecret || input.totpMfaSecret || input.totpSecret || backupCredential.totpMfaSecret || existingItem.totpMfaSecret))
      );
      const nextPassword = no2faFreeRoute
        ? ''
        : normalizeString(credential.password || input.password || backupCredential.password || existingItem.password);
      const nextTotpMfaSecret = no2faFreeRoute
        ? ''
        : normalizeTotpSecret(credential.totpMfaSecret || credential.totpSecret || input.totpMfaSecret || input.totpSecret || backupCredential.totpMfaSecret || existingItem.totpMfaSecret);
	      const gptPassword = no2faFreeRoute
	        ? ''
	        : normalizeString(credential.gptPassword || input.gptPassword || credential.password || input.password || backupCredential.password || existingItem.gptPassword || existingItem.password);
	      const passkeyCredentialId = normalizeString(
	        input.passkeyCredentialId
	        || credential.passkeyCredentialId
	        || backupCredential.passkeyCredentialId
	        || existingItem.passkeyCredentialId
	      );
	      const passkeyEnabled = no2faFreeRoute ? false : (
	        input.passkeyEnabled === true
	        || credential.passkeyEnabled === true
	        || backupCredential.passkeyEnabled === true
	        || existingItem.passkeyEnabled === true
	        || Boolean(passkeyCredentialId)
	      );
	      const passkeyPrivateJwk = input.passkeyPrivateJwk !== undefined
	        ? input.passkeyPrivateJwk
	        : (
	          credential.passkeyPrivateJwk !== undefined
	            ? credential.passkeyPrivateJwk
	            : (backupCredential.passkeyPrivateJwk || existingItem.passkeyPrivateJwk || null)
	        );
	      const hasRedeemField = (key) => (
	        Object.prototype.hasOwnProperty.call(input, key)
	        || Object.prototype.hasOwnProperty.call(credential, key)
      );
      const getRedeemField = (key) => (
        Object.prototype.hasOwnProperty.call(input, key) ? input[key] : credential[key]
      );
      const hasRedeemCdkey = (
        Object.prototype.hasOwnProperty.call(input, 'cdkey')
        || hasRedeemField('upiRedeemCdkey')
        || hasRedeemField('cdkey')
      );
      const resetRedeemStateRequested = input.resetRedeemState === true
        || credential.resetRedeemState === true
        || source === 'registration-free-entry'
        || source === 'registration-upi-eligibility';
      const shouldResetRedeemState = resetRedeemStateRequested
        && !isActiveUpiCredentialMembershipRedeemResultItem(existingItem, currentResults);
      const nextRedeemPlusDeletedEmailsByChannel = currentRedeemPlusDeletedEmailsByChannel;
      const nextRedeemStatus = hasRedeemField('redeemStatus')
        ? normalizeString(getRedeemField('redeemStatus'))
        : (shouldResetRedeemState ? '' : (existingItem.redeemStatus === 'success' ? existingItem.redeemStatus : normalizeString(existingItem.redeemStatus)));
      const nextRedeemReason = hasRedeemField('redeemReason')
        ? normalizeString(getRedeemField('redeemReason'))
        : (shouldResetRedeemState ? '' : existingItem.redeemReason);
      const nextRedeemFailureCount = hasRedeemField('redeemFailureCount')
        ? normalizeRetryCount(getRedeemField('redeemFailureCount'))
        : (shouldResetRedeemState || existingItem.redeemStatus === 'success' ? 0 : existingItem.redeemFailureCount);
      const nextRedeemChannel = hasRedeemField('redeemChannel') || hasRedeemField('channel')
        ? normalizeRedeemChannel(getRedeemField('redeemChannel') || getRedeemField('channel'))
        : (shouldResetRedeemState ? '' : normalizeString(existingItem.redeemChannel));
      const nextRedeemCdkey = hasRedeemCdkey
        ? normalizeString(
            Object.prototype.hasOwnProperty.call(input, 'cdkey')
              ? input.cdkey
              : (getRedeemField('upiRedeemCdkey') || getRedeemField('cdkey'))
          )
        : (shouldResetRedeemState ? '' : normalizeString(existingItem.upiRedeemCdkey));
      const nextItems = upsertResultItem(currentResults.items, {
        ...existingItem,
        ...backupCredential,
        ...credential,
        email,
        password: nextPassword,
        gptPassword,
        totpMfaSecret: nextTotpMfaSecret,
	        verificationUrl,
	        recordedAt,
	        no2faFreeRoute,
	        twoFactorEnabled,
	        passkeyEnabled,
	        passkeyEnabledAt: normalizeString(input.passkeyEnabledAt || credential.passkeyEnabledAt || backupCredential.passkeyEnabledAt || existingItem.passkeyEnabledAt),
	        passkeyCredentialId,
	        passkeyFactorId: normalizeString(input.passkeyFactorId || credential.passkeyFactorId || backupCredential.passkeyFactorId || existingItem.passkeyFactorId),
	        passkeyRpId: normalizeString(input.passkeyRpId || credential.passkeyRpId || backupCredential.passkeyRpId || existingItem.passkeyRpId),
	        passkeyUserHandle: normalizeString(input.passkeyUserHandle || credential.passkeyUserHandle || backupCredential.passkeyUserHandle || existingItem.passkeyUserHandle),
	        passkeyPrivateJwk: passkeyPrivateJwk && typeof passkeyPrivateJwk === 'object' && !Array.isArray(passkeyPrivateJwk)
	          ? passkeyPrivateJwk
	          : null,
	        passkeyPublicKeyCose: normalizeString(input.passkeyPublicKeyCose || credential.passkeyPublicKeyCose || backupCredential.passkeyPublicKeyCose || existingItem.passkeyPublicKeyCose),
	        passkeyApiPersisted: input.passkeyApiPersisted === true || credential.passkeyApiPersisted === true || backupCredential.passkeyApiPersisted === true || existingItem.passkeyApiPersisted === true,
	        status: 'free',
        planType: 'free',
        checkedAt,
        reason,
        accessToken,
        accessTokenMasked: normalizeString(input.accessTokenMasked || credential.accessTokenMasked || existingItem.accessTokenMasked) || maskAccessToken(accessToken),
        accessTokenUpdatedAt,
        trialEligibilityStatus,
        trialEligibilityReason,
        trialEligibilityCheckedAt,
        redeemStatus: nextRedeemStatus,
        redeemReason: nextRedeemReason,
        redeemFailureCount: nextRedeemFailureCount,
        redeemFailureLimit: hasRedeemField('redeemFailureLimit')
          ? normalizeRetryCount(getRedeemField('redeemFailureLimit'))
          : (shouldResetRedeemState ? REDEEM_CHANNEL_FAILURE_LIMIT : existingItem.redeemFailureLimit),
        upiRedeemFailureCount: hasRedeemField('upiRedeemFailureCount')
          ? normalizeRetryCount(getRedeemField('upiRedeemFailureCount'))
          : (shouldResetRedeemState ? 0 : existingItem.upiRedeemFailureCount),
        idealRedeemFailureCount: hasRedeemField('idealRedeemFailureCount')
          ? normalizeRetryCount(getRedeemField('idealRedeemFailureCount'))
          : (shouldResetRedeemState ? 0 : existingItem.idealRedeemFailureCount),
        redeemLocked: hasRedeemField('redeemLocked') ? getRedeemField('redeemLocked') === true : (shouldResetRedeemState ? false : existingItem.redeemLocked),
        redeemLockedReason: hasRedeemField('redeemLockedReason') ? normalizeString(getRedeemField('redeemLockedReason')) : (shouldResetRedeemState ? '' : existingItem.redeemLockedReason),
        redeemLockedAt: hasRedeemField('redeemLockedAt') ? normalizeString(getRedeemField('redeemLockedAt')) : (shouldResetRedeemState ? '' : existingItem.redeemLockedAt),
        redeemChannel: nextRedeemChannel,
        redeemLastFailedAt: hasRedeemField('redeemLastFailedAt')
          ? normalizeString(getRedeemField('redeemLastFailedAt'))
          : (shouldResetRedeemState || existingItem.redeemStatus === 'success' ? '' : existingItem.redeemLastFailedAt),
        redeemAttemptedAt: hasRedeemField('redeemAttemptedAt') ? normalizeString(getRedeemField('redeemAttemptedAt')) : (shouldResetRedeemState ? '' : existingItem.redeemAttemptedAt),
        redeemSuccessAt: hasRedeemField('redeemSuccessAt') ? normalizeString(getRedeemField('redeemSuccessAt')) : (shouldResetRedeemState ? '' : existingItem.redeemSuccessAt),
        lastFailedUpiRedeemCdkey: hasRedeemField('lastFailedUpiRedeemCdkey') ? normalizeString(getRedeemField('lastFailedUpiRedeemCdkey')) : (shouldResetRedeemState ? '' : existingItem.lastFailedUpiRedeemCdkey),
        upiRedeemCdkey: nextRedeemCdkey,
        upiRedeemPendingVerifySince: hasRedeemField('upiRedeemPendingVerifySince') ? normalizeString(getRedeemField('upiRedeemPendingVerifySince')) : (shouldResetRedeemState ? '' : existingItem.upiRedeemPendingVerifySince),
        upiRedeemPendingVerifyLastCheckedAt: hasRedeemField('upiRedeemPendingVerifyLastCheckedAt') ? normalizeString(getRedeemField('upiRedeemPendingVerifyLastCheckedAt')) : (shouldResetRedeemState ? '' : existingItem.upiRedeemPendingVerifyLastCheckedAt),
        upiRedeemPendingVerifyLoggedAt: hasRedeemField('upiRedeemPendingVerifyLoggedAt') ? normalizeString(getRedeemField('upiRedeemPendingVerifyLoggedAt')) : (shouldResetRedeemState ? '' : existingItem.upiRedeemPendingVerifyLoggedAt),
        upiRedeemPendingVerifyReason: hasRedeemField('upiRedeemPendingVerifyReason') ? normalizeString(getRedeemField('upiRedeemPendingVerifyReason')) : (shouldResetRedeemState ? '' : existingItem.upiRedeemPendingVerifyReason),
        membershipOverrideStatus: hasRedeemField('membershipOverrideStatus')
          ? normalizeString(getRedeemField('membershipOverrideStatus'))
          : (shouldResetRedeemState ? 'free' : existingItem.membershipOverrideStatus),
        membershipOverrideCheckedAt: hasRedeemField('membershipOverrideCheckedAt')
          ? normalizeString(getRedeemField('membershipOverrideCheckedAt'))
          : (shouldResetRedeemState ? checkedAt : existingItem.membershipOverrideCheckedAt),
        ...(hasRedeemField('upiRedeemSubscriptionActive') || shouldResetRedeemState || Object.prototype.hasOwnProperty.call(existingItem, 'upiRedeemSubscriptionActive')
          ? {
              upiRedeemSubscriptionActive: hasRedeemField('upiRedeemSubscriptionActive')
                ? getRedeemField('upiRedeemSubscriptionActive') === true
                : (shouldResetRedeemState ? false : existingItem.upiRedeemSubscriptionActive),
            }
          : {}),
        ...(hasRedeemField('upiRedeemSubscriptionPlanType') || shouldResetRedeemState || Object.prototype.hasOwnProperty.call(existingItem, 'upiRedeemSubscriptionPlanType')
          ? {
              upiRedeemSubscriptionPlanType: hasRedeemField('upiRedeemSubscriptionPlanType')
                ? normalizePlanType(getRedeemField('upiRedeemSubscriptionPlanType'))
                : (shouldResetRedeemState ? '' : existingItem.upiRedeemSubscriptionPlanType),
            }
          : {}),
        ...(hasRedeemField('upiRedeemSubscriptionCheckedAt') || shouldResetRedeemState || Object.prototype.hasOwnProperty.call(existingItem, 'upiRedeemSubscriptionCheckedAt')
          ? {
              upiRedeemSubscriptionCheckedAt: hasRedeemField('upiRedeemSubscriptionCheckedAt')
                ? normalizeString(getRedeemField('upiRedeemSubscriptionCheckedAt'))
                : (shouldResetRedeemState ? '' : existingItem.upiRedeemSubscriptionCheckedAt),
            }
          : {}),
      });
      return saveResults({
        ...currentResults,
        items: nextItems,
        redeemAutoDeletedEmails: nextRedeemAutoDeletedEmails,
        redeemPlusDeletedEmailsByChannel: nextRedeemPlusDeletedEmailsByChannel,
        updatedAt: checkedAt,
        source: source || normalizeString(currentResults.source || 'registration-upi-eligibility'),
        total: Math.max(currentResults.total || 0, nextItems.length),
        completed: Math.max(currentResults.completed || 0, nextItems.length),
      });
    }

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

    function isRedeemTerminalResultItem(item = {}) {
      const redeemStatus = normalizeUpiRedeemRemoteStatus(item.redeemStatus);
      const status = normalizeString(item.status).toLowerCase();
      const trialEligibilityStatus = normalizeString(item.trialEligibilityStatus).toLowerCase();
      return trialEligibilityStatus === 'ineligible'
        || isRedeemAccountLocked(item)
        || status === 'paid'
        || (status !== 'free' && ['success', 'skipped'].includes(redeemStatus))
        || ['running', 'submitted', 'pending', 'processing', 'accepted'].includes(redeemStatus);
	    }

    function filterRedeemableCredentialsForCurrentResults(credentials = [], results = {}) {
      const lookup = {};
      (Array.isArray(results.items) ? results.items : []).forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (email) {
          lookup[email] = item;
        }
      });
      return (Array.isArray(credentials) ? credentials : []).filter((credential) => {
        const email = normalizeEmail(credential?.email);
        if (!email) {
          return false;
        }
        const existingItem = lookup[email] || {};
        if (normalizeString(existingItem.trialEligibilityStatus).toLowerCase() === 'ineligible') {
          return false;
        }
        return !isRedeemTerminalResultItem(existingItem);
      });
    }

    function isAutoContinuationPendingRedeemItem(item = {}) {
      const status = normalizeString(item?.status).toLowerCase();
      const redeemStatus = normalizeUpiRedeemRemoteStatus(item?.redeemStatus);
      const reason = normalizeString(item?.redeemReason || item?.reason);
      if (status !== 'free') return false;
      if (!normalizeString(item?.accessToken)) return false;
      if (normalizeString(item?.trialEligibilityStatus).toLowerCase() === 'ineligible') return false;
      if (isRedeemTerminalResultItem(item)) return false;
      if (isActiveUpiRedeemRemoteStatus(redeemStatus)) return false;
      if (['blocked', 'stopped', 'success', 'canceled'].includes(redeemStatus)) return false;
      if (normalizeString(item?.upiRedeemCdkey || item?.cdkey)) return false;
      if (isPreSubmitUpiRedeemBlockedResultItem(item)) return false;
      if (isNonRetryableUpiRedeemRetryError(reason)) return false;
      return !redeemStatus || ['unused', 'not_found', 'available', 'ready', 'new'].includes(redeemStatus);
    }

    function hasPriorUpiRedeemAttempt(item = {}) {
      return Boolean(
        normalizeString(item?.redeemAttemptedAt)
        || normalizeString(item?.redeemLastFailedAt)
        || normalizeString(item?.lastFailedUpiRedeemCdkey)
        || normalizeString(item?.lastCanceledUpiRedeemCdkey)
        || normalizeString(item?.upiRedeemSubscriptionCheckedAt)
        || normalizeRetryCount(item?.redeemFailureCount) > 0
      );
    }

    function buildAutoContinuationRedeemCandidates(items = [], totalRoundLimit = 1, targetEmail = '', channel = 'upi', options = {}) {
      const fresh = [];
      const released = [];
      const failed = [];
      const seen = new Set();
      const normalizedTargetEmail = normalizeEmail(targetEmail);
      const includeFresh = options.includeFresh === true;

      const pushCandidate = (bucket, item) => {
        const normalized = normalizeResultItem(item);
        const email = normalizeEmail(normalized.email);
        if (!email || seen.has(email)) return;
        if (normalizedTargetEmail && email !== normalizedTargetEmail) return;
        if (!shouldRedeemItemUseChannel(normalized, channel)) return;
        seen.add(email);
        bucket.push(normalized);
      };

      (Array.isArray(items) ? items : []).forEach((item) => {
        if (isAutoContinuationPendingRedeemItem(item)) {
          if (hasPriorUpiRedeemAttempt(item)) {
            pushCandidate(released, item);
          } else {
            pushCandidate(fresh, item);
          }
          return;
        }
        if (isRetryableUpiRedeemRoundResultItem(item, totalRoundLimit, channel)) {
          pushCandidate(failed, item);
        }
      });

      return {
        candidates: includeFresh ? [...released, ...fresh, ...failed] : [...released, ...failed],
        freshCount: fresh.length,
        releasedCount: released.length,
        failedCount: failed.length,
      };
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

    async function getLoginEmailCodeForCredential({ state, credential, challenge = {}, throwIfStopRequested = null }) {
      if (typeof fetchVerificationCodeOnly !== 'function') {
        throw new Error('登录需要邮箱一次性验证码，但邮箱取码能力尚未接入。');
      }
      const targetEmail = normalizeEmail(
        credential.email
        || state?.step8VerificationTargetEmail
        || state?.email
        || challenge.displayedEmail
      );
      if (!targetEmail) {
        throw new Error('登录需要邮箱一次性验证码，但未识别当前登录邮箱。');
      }
      if (typeof throwIfStopRequested === 'function') throwIfStopRequested();
      await addLog(`UPI 备份核验：${targetEmail} 登录需要邮箱一次性验证码，正在通过邮箱取码链接获取验证码。`, 'info');
      const requestedAt = Math.max(0, Date.now() - (2 * 60 * 1000));
      const result = await fetchVerificationCodeOnly(8, {
        ...(state || {}),
        email: targetEmail,
        step8VerificationTargetEmail: targetEmail,
        loginVerificationRequestedAt: state?.loginVerificationRequestedAt || requestedAt,
      }, null, {
        targetEmail,
        completionStep: 8,
        filterAfterTimestamp: requestedAt,
        allowExcludedAfterTimestamp: true,
      });
      if (typeof throwIfStopRequested === 'function') throwIfStopRequested();
      if (!result?.handled) {
        throw new Error(`登录需要邮箱一次性验证码，但未在自定义邮箱池找到 ${targetEmail} 的取码链接。`);
      }
      const code = normalizeString(result.code).replace(/[^\d]/g, '');
      if (!code) {
        throw new Error(`登录需要邮箱一次性验证码，但邮箱取码暂未返回 ${targetEmail} 的有效验证码。`);
      }
      return {
        ...result,
        code,
        source: 'email',
      };
    }

    async function openFreshLoginTab(email) {
      if (typeof reuseOrCreateTab === 'function') {
        return reuseOrCreateTab(AUTH_SOURCE, CHATGPT_LOGIN_URL, {
          active: true,
          forceNew: true,
          inject: SIGNUP_PAGE_INJECT_FILES,
          injectSource: AUTH_SOURCE,
        });
      }
      const tab = await chromeApi.tabs.create({ url: CHATGPT_LOGIN_URL, active: true });
      await registerTab(AUTH_SOURCE, tab.id);
      return tab.id;
    }

    async function openFreshChatGptSessionTab() {
      if (typeof reuseOrCreateTab === 'function') {
        return reuseOrCreateTab(AUTH_SOURCE, CHATGPT_ENTRY_URL, {
          active: true,
          forceNew: true,
          inject: SIGNUP_PAGE_INJECT_FILES,
          injectSource: AUTH_SOURCE,
        });
      }
      const tab = await chromeApi.tabs.create({ url: CHATGPT_ENTRY_URL, active: true });
      await registerTab(AUTH_SOURCE, tab.id);
      return tab.id;
    }

    async function isBrowserTabAlive(tabId) {
      if (!Number.isInteger(tabId)) {
        return false;
      }
      if (chromeApi?.tabs?.get) {
        try {
          await chromeApi.tabs.get(tabId);
          return true;
        } catch {
          return false;
        }
      }
      return isTabAlive(tabId);
    }

    async function ensureAuthContentScript(tabId, timeoutMs = 30000, options = {}) {
      if (typeof ensureContentScriptReadyOnTabUntilStopped !== 'function') return;
      if (typeof options.throwIfStopRequested === 'function') options.throwIfStopRequested();
      await ensureContentScriptReadyOnTabUntilStopped(AUTH_SOURCE, tabId, {
        inject: SIGNUP_PAGE_INJECT_FILES,
        injectSource: AUTH_SOURCE,
        timeoutMs,
      });
      if (typeof options.throwIfStopRequested === 'function') options.throwIfStopRequested();
    }

    async function sendAuthMessage(tabId, message, options = {}) {
      if (typeof sendTabMessageUntilStopped !== 'function') {
        throw new Error('内容脚本通信能力尚未接入。');
      }
      if (typeof options.throwIfStopRequested === 'function') options.throwIfStopRequested();
      await ensureAuthContentScript(tabId, options.readyTimeoutMs || 30000, {
        throwIfStopRequested: options.throwIfStopRequested,
      });
      if (typeof options.throwIfStopRequested === 'function') options.throwIfStopRequested();
      const result = await sendTabMessageUntilStopped(tabId, AUTH_SOURCE, message, {
        timeoutMs: options.timeoutMs || 45000,
        responseTimeoutMs: options.responseTimeoutMs || 45000,
      });
      if (typeof options.throwIfStopRequested === 'function') options.throwIfStopRequested();
      if (result?.error) {
        throw new Error(result.error);
      }
      return result || {};
    }

    async function getLoginAuthState(tabId, options = {}) {
      return sendAuthMessage(tabId, {
        type: 'GET_LOGIN_AUTH_STATE',
        payload: {},
      }, {
        timeoutMs: 15000,
        responseTimeoutMs: 15000,
        throwIfStopRequested: options.throwIfStopRequested,
      }).catch((error) => {
        if (isMembershipStopError(error)) throw error;
        return null;
      });
    }

    function isLoginEntryOpenStalledResult(result = {}) {
      return result?.step6Outcome === 'recoverable'
        && (
          normalizeString(result.reason) === 'login_entry_open_stalled'
          || /点击登录入口后仍未进入/.test(normalizeString(result.message))
        );
    }

    async function navigateLoginTabToDirectLogin(tabId, options = {}) {
      if (typeof options.throwIfStopRequested === 'function') options.throwIfStopRequested();
      if (!chromeApi?.tabs?.update) {
        return false;
      }
      await chromeApi.tabs.update(tabId, { url: CHATGPT_LOGIN_URL, active: true });
      if (typeof options.throwIfStopRequested === 'function') options.throwIfStopRequested();
      await sleepWithStop(1500);
      if (typeof options.throwIfStopRequested === 'function') options.throwIfStopRequested();
      await ensureAuthContentScript(tabId, 45000, {
        throwIfStopRequested: options.throwIfStopRequested,
      });
      return true;
    }

    function mergeLoginChallengeState(loginResult = {}, authState = {}) {
      const resultState = loginResult && typeof loginResult === 'object' ? loginResult : {};
      const pageState = authState && typeof authState === 'object' ? authState : {};
      const liveState = normalizeString(pageState.state || resultState.state);
      const pageStateHasFreshState = Boolean(normalizeString(pageState.state));
      const pageStateIndicatesVerification = pageStateHasFreshState && Boolean(
        pageState.verificationReady
        || pageState.loginVerificationRequestedAt
        || pageState.verificationVisible
        || pageState.hasVerificationTarget
        || liveState === 'verification_page'
      );
      const shouldDiscardStaleVerificationFlags = pageStateHasFreshState && !pageStateIndicatesVerification;
      return {
        ...resultState,
        ...pageState,
        ...(shouldDiscardStaleVerificationFlags ? {
          verificationReady: false,
          loginVerificationRequestedAt: null,
          verificationVisible: false,
          hasVerificationTarget: false,
        } : {}),
        state: liveState,
        url: normalizeString(pageState.url || resultState.url),
        verificationKind: normalizeVerificationKind(pageState.verificationKind || resultState.verificationKind),
        displayedEmail: shouldDiscardStaleVerificationFlags
          ? normalizeString(pageState.displayedEmail)
          : normalizeString(pageState.displayedEmail || resultState.displayedEmail),
      };
    }

    function hasLoginVerificationChallenge(snapshot = {}) {
      const state = normalizeString(snapshot.state);
      return Boolean(
        snapshot.verificationReady
        || snapshot.loginVerificationRequestedAt
        || snapshot.verificationVisible
        || snapshot.hasVerificationTarget
        || state === 'verification_page'
      );
    }

    function isEmailVerificationChallenge(snapshot = {}) {
      const kind = normalizeVerificationKind(snapshot.verificationKind);
      const pathAndUrl = `${normalizeString(snapshot.path)} ${normalizeString(snapshot.url)}`;
      return kind === 'email'
        || Boolean(snapshot.displayedEmail)
        || /\/email-verification(?:[/?#]|$)/i.test(pathAndUrl);
    }

    function isTotpVerificationChallenge(snapshot = {}) {
      const kind = normalizeVerificationKind(snapshot.verificationKind);
      const pathAndUrl = `${normalizeString(snapshot.path)} ${normalizeString(snapshot.url)}`;
      return kind === 'totp' || /\/(?:mfa|totp|2fa|two-factor)(?:[/?#]|$)/i.test(pathAndUrl);
    }

    function isChatGptUrl(url = '') {
      try {
        const parsed = new URL(normalizeString(url));
        const hostname = parsed.hostname.toLowerCase();
        if (!['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com'].includes(hostname)) {
          return false;
        }
        return !/^\/auth(?:[/?#]|$)/i.test(parsed.pathname || '');
      } catch {
        return false;
      }
    }

    async function getTabUrl(tabId) {
      if (!chromeApi?.tabs?.get) return '';
      try {
        const tab = await chromeApi.tabs.get(tabId);
        return normalizeString(tab?.url);
      } catch {
        return '';
      }
    }

    async function getExistingChatGptSessionTabIds() {
      if (!chromeApi?.tabs?.query) return [];
      let tabs = [];
      try {
        tabs = await chromeApi.tabs.query({
          url: [
            'https://chatgpt.com/*',
            'https://www.chatgpt.com/*',
            'https://chat.openai.com/*',
          ],
        });
      } catch {
        try {
          tabs = await chromeApi.tabs.query({});
        } catch {
          tabs = [];
        }
      }
      return (Array.isArray(tabs) ? tabs : [])
        .filter((tab) => Number.isInteger(tab?.id) && isChatGptUrl(tab.url))
        .map((tab) => tab.id);
    }

    async function ensureChatGptSessionTab(tabId) {
      const currentUrl = await getTabUrl(tabId);
      if (isChatGptUrl(currentUrl)) return false;
      if (!chromeApi?.tabs?.update) return false;
      await chromeApi.tabs.update(tabId, { url: CHATGPT_ENTRY_URL, active: true });
      return true;
    }

    function buildLoginFailureReason(snapshot = {}, fallback = '') {
      const state = normalizeString(snapshot.state);
      if (state === 'verification_page' || snapshot.verificationVisible) {
        if (isEmailVerificationChallenge(snapshot)) return '登录后需要邮箱一次性验证码';
        if (isTotpVerificationChallenge(snapshot)) return '登录后仍停留在 2FA 验证码页面';
        return fallback || '登录后仍停留在验证码页面';
      }
      if (state === 'password_page') return '登录密码未通过或仍停留在密码页';
      if (state === 'login_timeout_error_page') return '认证页登录超时或触发重试/风控';
      if (state === 'email_page') return '登录后仍停留在邮箱输入页';
      return fallback || `未进入 ChatGPT 已登录态${state ? `（${state}）` : ''}`;
    }

    function isRecoverableCodeSubmitStateError(error) {
      const message = getErrorMessage(error);
      return /当前未进入登录验证码页面/i.test(message)
        || /消息发送超时/i.test(message)
        || /消息响应超时/i.test(message)
        || /Could not establish connection/i.test(message)
        || /Receiving end does not exist/i.test(message)
        || /message channel is closed/i.test(message)
        || /Extension context invalidated/i.test(message);
    }

    function getChatGptSessionEmail(result = {}) {
      return normalizeEmail(
        result?.email
        || result?.session?.user?.email
        || result?.session?.email
        || result?.user?.email
        || ''
      );
    }

    function normalizeChatGptSessionPayload(value = {}) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
      }
      const nestedSession = value.session;
      if (nestedSession && typeof nestedSession === 'object' && !Array.isArray(nestedSession)) {
        return nestedSession;
      }
      return value;
    }

    function getChatGptSessionFieldCount(value = {}) {
      const session = normalizeChatGptSessionPayload(value);
      return session && typeof session === 'object' && !Array.isArray(session)
        ? Object.keys(session).length
        : 0;
    }

    function hasChatGptSessionPayload(value = {}) {
      return getChatGptSessionFieldCount(value) > 0;
    }

    function getChatGptSessionAccessToken(value = {}) {
      const session = normalizeChatGptSessionPayload(value);
      return normalizeString(value?.accessToken || value?.access_token || session.accessToken || session.access_token);
    }

    function getCredentialSessionMatch(result = {}, credential = {}) {
      const sessionEmail = getChatGptSessionEmail(result);
      const targetEmail = normalizeEmail(credential.email);
      return {
        sessionEmail,
        targetEmail,
        matches: Boolean(sessionEmail && targetEmail && sessionEmail === targetEmail),
      };
    }

    async function tryReadCredentialSessionFromTab(tabId, credential = {}, options = {}) {
      const throwIfStopRequested = resolveStopChecker(options, 'check');
      throwIfStopRequested();
      const currentUrl = await getTabUrl(tabId);
      throwIfStopRequested();
      if (!isChatGptUrl(currentUrl)) {
        return null;
      }
      try {
        await ensureAuthContentScript(tabId, 8000, { throwIfStopRequested });
        const result = await sendAuthMessage(tabId, {
          type: 'READ_CHATGPT_SESSION_EXPORT_DATA',
          payload: {},
        }, {
          timeoutMs: 10000,
          responseTimeoutMs: 10000,
          readyTimeoutMs: 8000,
          throwIfStopRequested,
        });
        throwIfStopRequested();
        if (!hasChatGptSessionPayload(result)) {
          return null;
        }
        const accessToken = getChatGptSessionAccessToken(result);
        const { sessionEmail, targetEmail, matches } = getCredentialSessionMatch(result, credential);
        if (!matches) {
          if (targetEmail) {
            await addLog(
              `UPI 备份核验：检测到已登录账号 ${sessionEmail || '未知账号'}，与目标 ${targetEmail} 不一致，继续重新登录。`,
              'warn'
            );
          }
          return null;
        }
        await addLog(
          options.message || `UPI 备份核验：检测到 ${targetEmail} 已在 ChatGPT 登录，跳过登录和 2FA。`,
          'ok'
        );
        return {
          tabId,
          accessToken,
          session: result,
        };
      } catch (error) {
        if (isMembershipStopError(error)) throw error;
        return null;
      }
    }

    async function tryReadExistingCredentialSession(credential = {}, options = {}) {
      const throwIfStopRequested = resolveStopChecker(options, 'check');
      const tabIds = await getExistingChatGptSessionTabIds();
      for (const tabId of tabIds) {
        throwIfStopRequested();
        const session = await tryReadCredentialSessionFromTab(tabId, credential, { throwIfStopRequested });
        if (hasChatGptSessionPayload(session?.session || session)) {
          return session;
        }
      }
      return null;
    }

    async function readChatGptSession(tabId, options = {}) {
      const throwIfStopRequested = resolveStopChecker(options, 'check');
      let activeTabId = tabId;
      const startedAt = Date.now();
      let lastError = null;
      let triedChatGptNavigation = false;
      let reopenedAfterClose = false;
      await addLog('UPI 备份核验：获取/确认 AT：开始读取 ChatGPT session。', 'info');
      while (Date.now() - startedAt < 45000) {
        throwIfStopRequested();
        if (!(await isBrowserTabAlive(activeTabId))) {
          throwIfStopRequested();
          if (reopenedAfterClose) {
            throw new Error('登录标签页已关闭，重新打开 ChatGPT 后仍无法读取 session。');
          }
          reopenedAfterClose = true;
          activeTabId = await openFreshChatGptSessionTab();
          throwIfStopRequested();
          triedChatGptNavigation = false;
          await addLog('UPI 备份核验：登录标签页已关闭，正在重新打开 ChatGPT 读取 session。', 'warn');
          continue;
        }
        try {
          if (!triedChatGptNavigation) {
            triedChatGptNavigation = true;
            if (await ensureChatGptSessionTab(activeTabId)) {
              await addLog('UPI 备份核验：登录后正在切回 ChatGPT 读取 session。', 'info');
            }
          }
          throwIfStopRequested();
          await ensureAuthContentScript(activeTabId, 15000, { throwIfStopRequested });
          const result = await sendAuthMessage(activeTabId, {
            type: 'READ_CHATGPT_SESSION_EXPORT_DATA',
            payload: {},
          }, {
            timeoutMs: 20000,
            responseTimeoutMs: 20000,
            throwIfStopRequested,
          });
          throwIfStopRequested();
          if (hasChatGptSessionPayload(result)) {
            const accessToken = getChatGptSessionAccessToken(result);
            await addLog(
              `UPI 备份核验：获取/确认 AT：已读取 ChatGPT session：session字段 ${getChatGptSessionFieldCount(result)}${accessToken ? `（token 摘要 ${maskAccessToken(accessToken)}）` : ''}。`,
              'ok'
            );
            return {
              ...result,
              accessToken,
            };
          }
          await addLog('UPI 备份核验：获取/确认 AT：本次读取未返回 ChatGPT session，1 秒后重试。', 'info');
        } catch (error) {
          if (isMembershipStopError(error)) throw error;
          lastError = error;
          await addLog(`UPI 备份核验：获取/确认 AT：读取 ChatGPT session 失败，将重试：${getErrorMessage(error)}`, 'warn');
        }
        await sleepWithStop(1000);
        throwIfStopRequested();
      }
      const snapshot = await getLoginAuthState(activeTabId, { throwIfStopRequested });
      throw new Error(buildLoginFailureReason(snapshot, getErrorMessage(lastError) || '未读取到 ChatGPT session'));
    }

    async function submitLoginVerificationCodeOrYieldToSessionRead(tabId, verificationCode, credential, options = {}) {
      const throwIfStopRequested = resolveStopChecker(options, 'check');
      const membershipLogLabel = normalizeString(options.membershipLogLabel || '获取/确认 AT') || '获取/确认 AT';
      const codeLabel = normalizeString(options.codeLabel || '2FA 动态码') || '2FA 动态码';
      const verificationKind = normalizeVerificationKind(options.verificationKind || 'totp');
      try {
        const codeResult = await sendAuthMessage(tabId, {
          type: 'FILL_CODE',
          step: 8,
          payload: {
            code: verificationCode,
            visibleStep: 8,
            purpose: 'login',
            loginIdentifierType: 'email',
            verificationKind,
            membershipCheck: true,
            membershipLogLabel,
          },
        }, {
          timeoutMs: 45000,
          responseTimeoutMs: 45000,
          throwIfStopRequested,
        });
        throwIfStopRequested();
        if (codeResult?.invalidCode) {
          throw new Error(`${codeLabel}被页面拒绝：${codeResult.errorText || 'Incorrect code'}`);
        }
        return null;
      } catch (error) {
        if (isMembershipStopError(error)) throw error;
        if (!isRecoverableCodeSubmitStateError(error)) {
          throw error;
        }
        await addLog(
          `UPI 备份核验：${credential.email} 登录验证提交后认证页状态已变化（${getErrorMessage(error)}），尝试直接读取 ChatGPT 登录态。`,
          'warn'
        );
        return null;
      }
    }

    async function submitLoginTotpOrYieldToSessionRead(tabId, totpCode, credential, options = {}) {
      return submitLoginVerificationCodeOrYieldToSessionRead(tabId, totpCode, credential, {
        ...options,
        codeLabel: '2FA 动态码',
        verificationKind: 'totp',
      });
    }

    function buildChatGptCookieUrl(entry = {}) {
      const rawDomain = normalizeString(entry?.domain).replace(/^\.+/, '').replace(/\.$/, '').toLowerCase();
      const allowedRoots = ['chatgpt.com', 'openai.com'];
      const host = allowedRoots.some((root) => rawDomain === root || rawDomain.endsWith(`.${root}`))
        ? rawDomain
        : 'chatgpt.com';
      const rawPath = normalizeString(entry?.path || '/');
      const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
      return `https://${host}${path}`;
    }

    function normalizeChatGptCookieDomain(value = '') {
      return normalizeString(value).replace(/\.$/, '').toLowerCase();
    }

    function isAllowedChatGptCookieDomain(value = '') {
      const domain = normalizeChatGptCookieDomain(value).replace(/^\.+/, '');
      return ['chatgpt.com', 'openai.com'].some((root) => domain === root || domain.endsWith(`.${root}`));
    }

    async function setChatGptCookieEntries(cookieEntries = []) {
      const entries = Array.isArray(cookieEntries) ? cookieEntries : [];
      if (!chromeApi?.cookies?.set) {
        return { setCount: 0, skipped: entries.length, skippedCount: entries.length };
      }
      let setCount = 0;
      let skippedCount = 0;
      for (const entry of entries) {
        const name = normalizeString(entry?.name);
        if (!name || entry?.value === undefined || entry?.value === null) {
          skippedCount += 1;
          continue;
        }
        const rawPath = normalizeString(entry.path || '/') || '/';
        const details = {
          url: buildChatGptCookieUrl(entry),
          name,
          value: String(entry.value),
          path: rawPath.startsWith('/') ? rawPath : `/${rawPath}`,
          secure: entry.secure !== false,
          httpOnly: entry.httpOnly === true,
          sameSite: normalizeString(entry.sameSite || 'lax') || 'lax',
        };
        const normalizedDomain = normalizeChatGptCookieDomain(entry.domain);
        if (normalizedDomain && !isAllowedChatGptCookieDomain(normalizedDomain)) {
          skippedCount += 1;
          await addLog(`UPI 备份核验：跳过非 ChatGPT/OpenAI 域名 cookie（${normalizedDomain}）。`, 'warn');
          continue;
        }
        if (!name.startsWith('__Host-') && entry.hostOnly !== true && normalizedDomain) {
          details.domain = normalizedDomain;
        }
        const expirationDate = Number(entry.expirationDate);
        if (Number.isFinite(expirationDate) && expirationDate > 0) {
          details.expirationDate = expirationDate;
        }
        if (entry.storeId) details.storeId = entry.storeId;
        if (entry.partitionKey) details.partitionKey = entry.partitionKey;
        try {
          await chromeApi.cookies.set(details);
          setCount += 1;
        } catch {
          skippedCount += 1;
        }
      }
      return { setCount, skipped: skippedCount, skippedCount };
    }

    async function applyPasskeyLoginCookies(loginResult = {}, credential = {}, options = {}) {
      const cookieEntries = Array.isArray(loginResult?.cookieEntries) ? loginResult.cookieEntries : [];
      const sessionToken = normalizeString(loginResult?.sessionToken);
      if (!cookieEntries.length && !sessionToken) {
        return { tabId: 0, setCount: 0, skipped: 0 };
      }
      const throwIfStopRequested = resolveStopChecker(options, 'check');
      throwIfStopRequested();
      await clearOpenAiCookies();
      throwIfStopRequested();
      const tabId = await openFreshLoginTab(credential.email);
      throwIfStopRequested();
      const entries = cookieEntries.length ? cookieEntries : [{
        name: '__Secure-next-auth.session-token',
        value: sessionToken,
        domain: '.chatgpt.com',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      }];
      const { setCount, skipped } = await setChatGptCookieEntries(entries);
      throwIfStopRequested();
      await addLog(
        `UPI 备份核验：${credential.email} Passkey API 登录已写入 ${setCount} 个 ChatGPT cookie${skipped ? `，跳过 ${skipped} 个` : ''}。`,
        setCount > 0 ? 'ok' : 'warn'
      );
      if (chromeApi?.tabs?.reload && Number.isInteger(tabId)) {
        await chromeApi.tabs.reload(tabId).catch(() => null);
      }
      return { tabId, setCount, skipped };
    }

    async function tryPasskeyApiLoginAndReadAccessToken(credential = {}, state = {}, options = {}) {
      if (!hasPasskeyCredential(credential)) {
        return null;
      }
      const core = getPasskeyLoginCore();
      if (
        typeof core.buildPasskeyLoginRequest !== 'function'
        || typeof core.normalizePasskeyLoginResponse !== 'function'
      ) {
        throw new Error('Passkey API 登录能力尚未加载。');
      }
      if (typeof fetchImpl !== 'function') {
        throw new Error('当前环境不支持 fetch，无法调用 Passkey 登录接口。');
      }
      const throwIfStopRequested = resolveStopChecker(options, 'check');
      const targetEmail = normalizeEmail(credential.email);
      const apiUrl = buildPasskeyLoginApiUrl(state);
      const timeoutMs = resolvePasskeyLoginTimeoutMs(state);
      const requestBody = core.buildPasskeyLoginRequest(
        targetEmail,
        buildPasskeyLoginOptionsFromCredential(credential, state)
      );
      throwIfStopRequested();
      await addLog(`UPI 备份核验：${credential.email} 正在调用 Passkey API 登录。`, 'info');
      const response = await fetchPasskeyLoginResponse(fetchImpl, apiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, timeoutMs);
      throwIfStopRequested();
      const text = await response.text().catch(() => '');
      let payload = {};
      let parsedJson = true;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        parsedJson = false;
        payload = { raw: text };
      }
      if (!response.ok) {
        const ownBackendMessage = parsedJson ? getBackendOwnErrorMessage(payload) : '';
        const plainTextMessage = normalizeString(text);
        const backendMessage = typeof core.getLoginFailureMessage === 'function'
          ? normalizeString(core.getLoginFailureMessage(payload))
          : '';
        const reason = ownBackendMessage || backendMessage || (!parsedJson ? plainTextMessage : '') || response.statusText || `HTTP ${response.status}`;
        const error = new Error(`Passkey API 登录返回 HTTP ${response.status}${reason ? `：${reason}` : ''}`);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }
      const loginResult = core.normalizePasskeyLoginResponse(payload);
      const responseEmail = normalizeEmail(loginResult.email || payload?.email);
      if (targetEmail && responseEmail && responseEmail !== targetEmail) {
        throw createSessionAccountMismatchError(
          `UPI 备份核验：${credential.email} Passkey API 登录返回账号 ${responseEmail}，不是当前目标 ${targetEmail}，已停止提交 CDK。`,
          { sessionEmail: responseEmail, targetEmail }
        );
      }
      let tabId = 0;
      let cookieApplyResult = { tabId: 0, setCount: 0, skipped: 0 };
      if (options.applyCookies !== false) {
        const applied = await applyPasskeyLoginCookies(loginResult, credential, { throwIfStopRequested });
        cookieApplyResult = applied;
        tabId = applied.tabId || 0;
      }
      loginResult.cookieApplyResult = cookieApplyResult;
      const returnedCookieEntries = Array.isArray(loginResult?.cookieEntries) ? loginResult.cookieEntries : [];
      const returnedSessionToken = normalizeString(loginResult?.sessionToken);
      if (!loginResult.accessToken && (returnedCookieEntries.length || returnedSessionToken) && cookieApplyResult.setCount <= 0) {
        const message = `UPI 备份核验：${credential.email} Passkey API 登录返回了 Cookie，但未能写入浏览器 Cookie，已停止继续读取页面 AT。`;
        await addLog(message, 'warn');
        throw new Error(message);
      }
      if (loginResult.accessToken) {
        await addLog(
          `UPI 备份核验：${credential.email} Passkey API 登录已获取 AT（token 摘要 ${maskAccessToken(loginResult.accessToken)}）。`,
          'ok'
        );
      } else {
        await addLog(`UPI 备份核验：${credential.email} Passkey API 登录已获取 Cookie，将继续读取页面 AT。`, 'ok');
      }
      return {
        tabId,
        accessToken: loginResult.accessToken,
        session: {
          accessToken: loginResult.accessToken,
          accountEmail: responseEmail || targetEmail,
          email: responseEmail || targetEmail,
          passkeyLogin: true,
        },
        cookieApplyResult,
        passkeyLoginResult: loginResult,
      };
    }

    async function loginAndReadAccessToken(credential, state, options = {}) {
      const throwIfStopRequested = resolveStopChecker(options, 'check');
      const allowSessionMismatchRetry = options.sessionMismatchRetry !== false;
      const shouldReadAccessToken = options.readAccessToken !== false;
      const membershipLogLabel = shouldReadAccessToken ? '获取/确认 AT' : '登录';
      const reportStage = async (stage) => {
        throwIfStopRequested();
        if (typeof options.onStage === 'function') {
          await options.onStage(normalizeFlowStage(stage) || stage);
        }
        throwIfStopRequested();
      };
      await reportStage('open-chatgpt');
      const existingSession = shouldReadAccessToken
        ? await tryReadExistingCredentialSession(credential, { throwIfStopRequested })
        : null;
      if (shouldReadAccessToken && hasChatGptSessionPayload(existingSession?.session || existingSession)) {
        await reportStage('token');
        await addLog(
          `UPI 备份核验：${credential.email} 获取/确认 AT：复用现有 ChatGPT session：session字段 ${getChatGptSessionFieldCount(existingSession?.session || existingSession)}。`,
          'ok'
        );
        return existingSession;
      }
      throwIfStopRequested();
      if (hasPasskeyCredential(credential)) {
        try {
          await reportStage('passkey-login');
          const passkeySession = await tryPasskeyApiLoginAndReadAccessToken(credential, state, {
            ...options,
            applyCookies: true,
          });
          throwIfStopRequested();
          const passkeyLoginResult = passkeySession?.passkeyLoginResult || {};
          const cookieApplyResult = passkeySession?.cookieApplyResult || passkeyLoginResult.cookieApplyResult || {};
          const cookieSetCount = Number(cookieApplyResult.setCount || 0);
          const returnedCookieEntries = Array.isArray(passkeyLoginResult.cookieEntries)
            ? passkeyLoginResult.cookieEntries
            : [];
          const returnedSessionToken = normalizeString(passkeyLoginResult.sessionToken);
          const hasPasskeyBrowserSession = Boolean(
            cookieSetCount > 0 && (returnedSessionToken || returnedCookieEntries.length)
          );
          if (shouldReadAccessToken && passkeySession?.accessToken) {
            await reportStage('token');
            return passkeySession;
          }
          if (shouldReadAccessToken && passkeySession && hasPasskeyBrowserSession) {
            await reportStage('token');
            const session = await readChatGptSession(passkeySession.tabId || 0, { throwIfStopRequested });
            throwIfStopRequested();
            const { sessionEmail, targetEmail, matches } = getCredentialSessionMatch(session, credential);
            if (!matches) {
              const mismatchMessage = `UPI 备份核验：${credential.email} Passkey API 登录后读取到的 ChatGPT session 属于 ${sessionEmail || '未知账号'}，不是当前目标 ${targetEmail || credential.email}`;
              if (allowSessionMismatchRetry) {
                await addLog(`${mismatchMessage}，将清理登录态后重新登录当前账号。`, 'warn');
                throwIfStopRequested();
                await clearOpenAiCookies();
                throwIfStopRequested();
                return loginAndReadAccessToken(credential, state, {
                  ...options,
                  sessionMismatchRetry: false,
                });
              }
              throw createSessionAccountMismatchError(`${mismatchMessage}，已停止提交 CDK。`, {
                sessionEmail,
                targetEmail,
              });
            }
            await addLog(
              `UPI 备份核验：${credential.email} 获取/确认 AT：Passkey API 登录后已读取 ChatGPT session：session字段 ${getChatGptSessionFieldCount(session)}（账号已确认：${sessionEmail}）。`,
              'ok'
            );
            return {
              ...passkeySession,
              tabId: passkeySession.tabId || 0,
              accessToken: getChatGptSessionAccessToken(session),
              session,
            };
          }
          if (!shouldReadAccessToken && passkeySession && hasPasskeyBrowserSession) {
            await addLog(`UPI 账号登录：${credential.email} 已通过 Passkey API 登录。`, 'ok');
            return {
              tabId: passkeySession.tabId || 0,
              loggedIn: true,
              passkeyLogin: true,
            };
          }
          if (!shouldReadAccessToken && passkeySession && !hasPasskeyBrowserSession) {
            await addLog(`UPI Passkey 登录：${credential.email} -> 后端只返回 AT 或 Cookie 未写入成功，行登录回落网页登录。`, 'warn');
          }
        } catch (passkeyError) {
          if (isMembershipStopError(passkeyError)) throw passkeyError;
          await addLog(
            `UPI Passkey 登录：${credential.email} -> ${getErrorMessage(passkeyError) || passkeyError}，回落网页登录。`,
            'warn'
          );
        }
      }
      throwIfStopRequested();
      await clearOpenAiCookies();
      throwIfStopRequested();
      const tabId = await openFreshLoginTab(credential.email);
      throwIfStopRequested();
      await ensureAuthContentScript(tabId, 45000, { throwIfStopRequested });
      await addLog(`UPI 备份核验：正在登录 ${credential.email}...`, 'info');
      await reportStage('login');
      const loginPayload = {
        visibleStep: 7,
        email: credential.email,
        password: credential.password,
        loginIdentifierType: 'email',
        membershipCheck: true,
        membershipLogLabel,
      };
      const executeLoginNode = () => sendAuthMessage(tabId, {
        type: 'EXECUTE_NODE',
        nodeId: 'oauth-login',
        payload: loginPayload,
      }, {
        timeoutMs: 120000,
        responseTimeoutMs: 120000,
        throwIfStopRequested,
      });
      let loginResult = await executeLoginNode();
      throwIfStopRequested();
      if (isLoginEntryOpenStalledResult(loginResult) && await navigateLoginTabToDirectLogin(tabId, { throwIfStopRequested })) {
        await addLog(
          `UPI 备份核验：${credential.email} 点击登录入口后未进入登录表单，已改用 /auth/login 直达登录页重试。`,
          'warn'
        );
        loginResult = await executeLoginNode();
        throwIfStopRequested();
      }

      const liveAuthState = await getLoginAuthState(tabId, { throwIfStopRequested });
      throwIfStopRequested();
      const loginChallenge = mergeLoginChallengeState(loginResult, liveAuthState);
      const loginNeedsCode = hasLoginVerificationChallenge(loginChallenge);
      if (
        loginResult?.step6Outcome === 'recoverable'
        && !loginNeedsCode
      ) {
        throw new Error(loginResult.message || buildLoginFailureReason(loginChallenge, '登录未进入验证码页'));
      }
      if (loginNeedsCode) {
        const currentSession = shouldReadAccessToken
          ? await tryReadCredentialSessionFromTab(tabId, credential, {
            message: `UPI 备份核验：${credential.email} 已进入 ChatGPT 登录态，跳过提交 2FA。`,
            throwIfStopRequested,
          })
          : null;
        if (shouldReadAccessToken && hasChatGptSessionPayload(currentSession?.session || currentSession)) {
          await reportStage('token');
          await addLog(
            `UPI 备份核验：${credential.email} 获取/确认 AT：已从当前登录态读取 ChatGPT session：session字段 ${getChatGptSessionFieldCount(currentSession?.session || currentSession)}。`,
            'ok'
          );
          return currentSession;
        }
        if (isEmailVerificationChallenge(loginChallenge)) {
          await reportStage('email-code');
          const emailCode = await getLoginEmailCodeForCredential({
            state,
            credential,
            challenge: loginChallenge,
            throwIfStopRequested,
          });
          await addLog(`UPI 备份核验：已通过邮箱取码获取 ${credential.email} 的登录一次性验证码。`, 'ok');
          await submitLoginVerificationCodeOrYieldToSessionRead(tabId, emailCode.code, credential, {
            throwIfStopRequested,
            membershipLogLabel,
            codeLabel: '邮箱一次性验证码',
            verificationKind: 'email',
          });
        } else {
          if (!isTotpVerificationChallenge(loginChallenge)) {
            await addLog(
              `UPI 备份核验：${credential.email} 的登录验证码页类型未明确识别，尝试按 2FA/TOTP 动态码处理。`,
              'warn'
            );
          }
          await reportStage('totp');
          const totp = await getTotpCodeForCredential({ state, credential, throwIfStopRequested });
          await addLog(
            `UPI 备份核验：已通过${totp.source === 'lookup' ? 'TOTP lookup 兜底接口' : '本地 TOTP'}获取 ${credential.email} 的 6 位码。`,
            'ok'
          );
          throwIfStopRequested();
          const latestAuthState = await getLoginAuthState(tabId, { throwIfStopRequested });
          throwIfStopRequested();
          const latestChallenge = mergeLoginChallengeState(loginChallenge, latestAuthState);
          if (!hasLoginVerificationChallenge(latestChallenge)) {
            await addLog(
              `UPI 备份核验：${credential.email} 的认证页已离开 2FA 输入页，尝试直接读取 ChatGPT 登录态。`,
              'warn'
            );
          } else if (isEmailVerificationChallenge(latestChallenge)) {
            await reportStage('email-code');
            const emailCode = await getLoginEmailCodeForCredential({
              state,
              credential,
              challenge: latestChallenge,
              throwIfStopRequested,
            });
            await addLog(`UPI 备份核验：已通过邮箱取码获取 ${credential.email} 的登录一次性验证码。`, 'ok');
            await submitLoginVerificationCodeOrYieldToSessionRead(tabId, emailCode.code, credential, {
              throwIfStopRequested,
              membershipLogLabel,
              codeLabel: '邮箱一次性验证码',
              verificationKind: 'email',
            });
          } else {
            await submitLoginTotpOrYieldToSessionRead(tabId, totp.code, credential, {
              throwIfStopRequested,
              membershipLogLabel,
            });
          }
        }
      }

      if (!shouldReadAccessToken) {
        await addLog(`UPI 账号登录：${credential.email} 已完成网页登录。`, 'ok');
        return {
          tabId,
          loggedIn: true,
        };
      }

      await reportStage('token');
      const session = await readChatGptSession(tabId, { throwIfStopRequested });
      throwIfStopRequested();
      const { sessionEmail, targetEmail, matches } = getCredentialSessionMatch(session, credential);
      if (!matches) {
        const mismatchMessage = `UPI 备份核验：${credential.email} 获取/确认 AT 读取到的 ChatGPT session 属于 ${sessionEmail || '未知账号'}，不是当前目标 ${targetEmail || credential.email}`;
        if (allowSessionMismatchRetry) {
          await addLog(`${mismatchMessage}，将清理登录态后重新登录当前账号。`, 'warn');
          throwIfStopRequested();
          await clearOpenAiCookies();
          throwIfStopRequested();
          return loginAndReadAccessToken(credential, state, {
            ...options,
            sessionMismatchRetry: false,
          });
        }
        throw createSessionAccountMismatchError(`${mismatchMessage}，已停止提交 CDK。`, {
          sessionEmail,
          targetEmail,
        });
      }
      await addLog(
        `UPI 备份核验：${credential.email} 获取/确认 AT 完成：session字段 ${getChatGptSessionFieldCount(session)}（账号已确认：${sessionEmail}）。`,
        'ok'
      );
      return {
        tabId,
        accessToken: getChatGptSessionAccessToken(session),
        session,
      };
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
      if (!baseItem.totpMfaSecret) {
        batchRunning = false;
        throw new Error(`${email} 缺少 2FA，无法登录。`);
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

    async function fillUpiCredentialMembershipFreeAccessTokens(input = {}) {
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
        .filter((credential) => credential.email && credential.status === 'free' && !credential.accessToken);
      const runtimeState = {
        ...(await getState()),
        ...(input.settings || {}),
      };
      const filled = [];
      const skipped = [];
      const failed = [];

      const saveProgress = async (stage = 'token', email = '') => {
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: true,
          updatedAt: new Date().toISOString(),
          flowStage: stage,
          flowStageEmail: normalizeEmail(email),
          source: normalizeString(input.source || currentResults.source || 'free-fill-at'),
          total: credentials.length,
          completed: filled.length + skipped.length + failed.length,
        });
      };

      try {
        if (!credentials.length) {
          return {
            results: await saveResults({
              ...currentResults,
              items,
              running: false,
              updatedAt: startedAt,
              finishedAt: startedAt,
              flowStage: '',
              flowStageEmail: '',
            }),
            filled,
            skipped,
            failed,
          };
        }

        await addLog(`UPI Free 分组补充 AT：开始处理 ${credentials.length} 个缺 AT 账号。`, 'info');
        for (const credential of credentials) {
          throwIfMembershipStopRequested('check');
          const email = normalizeEmail(credential.email);
          const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
          let activeCredential = normalizeResultItem({
            ...existingItem,
            ...credential,
            email,
            status: 'free',
            planType: 'free',
          });
          const backupCredential = await findBackupCredentialByEmail(email);
          if (backupCredential?.email) {
            activeCredential = normalizeResultItem(mergeCredentialAuthMaterial(activeCredential, backupCredential));
          }
          if (!activeCredential.password) {
            const reason = '缺少 GPT 密码，无法补充 AT';
            skipped.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              reason,
            });
            await saveProgress('token', email);
            await addLog(`UPI Free 分组补充 AT：${email} -> 跳过：${reason}`, 'warn');
            continue;
          }
          if (hasPasskeyCredential(activeCredential)) {
            await addLog(`UPI Free 分组补充 AT：${email} -> 检测到 Passkey，优先使用 Nerver Passkey 登录接口补 AT。`, 'info');
          } else if (!normalizeTotpSecret(activeCredential.totpMfaSecret || activeCredential.totpSecret)) {
            await addLog(`UPI Free 分组补充 AT：${email} -> 未保存 2FA/Passkey，先按邮箱+密码登录；如页面要求验证码会按实际错误返回。`, 'info');
          }

          try {
            await saveProgress('login', email);
            const session = await loginAndReadAccessToken(activeCredential, {
              ...runtimeState,
              ...currentResults,
            }, {
              onStage: async (stage) => saveProgress(stage, email),
              throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
            });
            const accessToken = normalizeString(session.accessToken || getChatGptSessionAccessToken(session.session || session));
            if (!accessToken) {
              throw new Error('未读取到 accessToken');
            }
            const updatedAt = new Date().toISOString();
            filled.push({ email, accessTokenMasked: maskAccessToken(accessToken), updatedAt });
            items = upsertResultItem(items, {
              ...activeCredential,
              reason: activeCredential.reason || '已补充 AT',
              accessToken,
              accessTokenMasked: maskAccessToken(accessToken),
              accessTokenUpdatedAt: updatedAt,
              checkedAt: activeCredential.checkedAt || updatedAt,
            });
            await saveProgress('token', email);
            await addLog(`UPI Free 分组补充 AT：${email} -> 已保存 AT。`, 'ok');
          } catch (error) {
            const reason = getErrorMessage(error) || '补充 AT 失败';
            failed.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              reason,
            });
            await saveProgress('token', email);
            await addLog(`UPI Free 分组补充 AT：${email} -> 失败：${reason}`, 'warn');
          }
        }

        const finishedAt = new Date().toISOString();
        const results = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt,
          flowStage: '',
          flowStageEmail: '',
          total: items.length,
          completed: items.length,
        });
        await addLog(`UPI Free 分组补充 AT：完成，成功 ${filled.length}，跳过 ${skipped.length}，失败 ${failed.length}。`, 'ok');
        return { results, filled, skipped, failed };
      } finally {
        batchRunning = false;
      }
    }

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

    async function pruneIneligibleFreeUpiCredentialMembership(input = {}) {
      if (batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      if (redeemRunning || cdkeyRetryRunning) {
        throw new Error('UPI 无会员账号补兑/CDK 重试正在运行，请等待完成或先停止。');
      }
      if (typeof checkUpiRedeemAccessTokenEligibility !== 'function') {
        throw new Error('UPI 试用资格检查能力尚未接入。');
      }

      const requestedCredentials = resolveInputCredentials(input)
        .filter((credential) => credential.email);
      const source = normalizeString(input.source || 'free-trial-eligibility');
      batchRunning = true;
      batchStopRequested = false;
      const startedAt = new Date().toISOString();
      let currentResults = await getStoredResults();
      let items = mergeCredentialsIntoResultItems(currentResults.items, requestedCredentials);
      const kept = [];
      const skipped = [];
      const failed = [];
      const ineligibleEmails = [];

      const saveProgress = async (stage = 'token', email = '') => {
        currentResults = await saveResults({
          ...currentResults,
          items,
          running: true,
          updatedAt: new Date().toISOString(),
          flowStage: stage,
          flowStageEmail: normalizeEmail(email),
          source: source || currentResults.source,
          total: requestedCredentials.length,
          completed: kept.length + skipped.length + failed.length,
        });
      };

      try {
        if (!requestedCredentials.length) {
          return await saveResults({
            ...currentResults,
            items,
            running: false,
            updatedAt: startedAt,
            finishedAt: startedAt,
            flowStage: '',
            flowStageEmail: '',
          });
        }

        await addLog(`UPI Free 分组试用资格检测：开始检测 ${requestedCredentials.length} 个账号，无资格会标记到邮箱池并移出 Free，不会删除邮箱本身。`, 'info');
        const runtimeState = {
          ...(await getState()),
          ...(input.settings || {}),
        };

        for (const credential of requestedCredentials) {
          throwIfMembershipStopRequested('check');
          const email = normalizeEmail(credential.email);
          const checkedAt = new Date().toISOString();
          if (!email) {
            continue;
          }
          const existingItem = items.find((item) => normalizeEmail(item?.email) === email) || {};
          const activeCredential = normalizeResultItem({
            ...existingItem,
            ...credential,
            email,
            status: 'free',
            planType: 'free',
            checkedAt,
          });

          if (!activeCredential.password || !activeCredential.totpMfaSecret) {
            const reason = !activeCredential.password ? '缺少 GPT 密码，无法检测试用资格' : '缺少 2FA 密钥，无法检测试用资格';
            skipped.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              planType: 'free',
              reason,
              trialEligibilityStatus: 'skipped',
              trialEligibilityReason: reason,
              trialEligibilityCheckedAt: checkedAt,
            });
            await saveProgress('token', email);
            await addLog(`UPI Free 分组试用资格检测：${email} -> 跳过：${reason}`, 'warn');
            continue;
          }

          try {
            await saveProgress('login', email);
            const session = await loginAndReadAccessToken(activeCredential, {
              ...runtimeState,
              ...currentResults,
            }, {
              onStage: async (stage) => saveProgress(stage, email),
              throwIfStopRequested: () => throwIfMembershipStopRequested('check'),
            });
            throwIfMembershipStopRequested('check');
            if (!hasChatGptSessionPayload(session.session || session)) {
              throw new Error('未读取到 ChatGPT session');
            }
            await saveProgress('subscription-check', email);
            const eligibility = await checkUpiRedeemAccessTokenEligibility({
              state: {
                ...runtimeState,
                ...currentResults,
              },
              credential: activeCredential,
              session: session.session || session,
              accessToken: session.accessToken,
              cdkey: input.cdkey,
            });
            const reason = eligibility?.item?.message || eligibility?.item?.reason || '账号有试用资格';
            kept.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              planType: 'free',
              reason,
              accessToken: session.accessToken,
              accessTokenMasked: maskAccessToken(session.accessToken),
              accessTokenUpdatedAt: checkedAt,
              trialEligibilityStatus: 'eligible',
              trialEligibilityReason: reason,
              trialEligibilityCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Free 分组试用资格检测：${email} -> 有试用资格。`, 'ok');
          } catch (error) {
            const reason = getErrorMessage(error) || '试用资格检测失败';
            if (isUpiTrialIneligibleError(error)) {
              ineligibleEmails.push(email);
              failed.push({ email, reason, trialEligibilityStatus: 'ineligible' });
              const markerResult = typeof markRegistrationEmailTrialIneligible === 'function'
                ? await markRegistrationEmailTrialIneligible({
                    ...runtimeState,
                    ...activeCredential,
                    email,
                  }, {
                    email,
                    reason,
                    checkedAt,
                    logPrefix: 'UPI Free 分组试用资格检测',
                    level: 'warn',
                  })
                : { updated: false };
              items = markerResult?.updated
                ? items.filter((item) => normalizeEmail(item?.email) !== email)
                : upsertResultItem(items, {
                    ...activeCredential,
                    status: 'free',
                    planType: 'free',
                    reason,
                    redeemStatus: 'blocked',
                    redeemReason: `账号无试用资格：${reason}`,
                    trialEligibilityStatus: 'ineligible',
                    trialEligibilityReason: reason,
                    trialEligibilityCheckedAt: checkedAt,
                  });
              await saveProgress('subscription-check', email);
              await addLog(
                markerResult?.updated
                  ? `UPI Free 分组试用资格检测：${email} -> 无试用资格，已在邮箱池标记并移出 Free，不再参与兑换。原因：${reason}`
                  : `UPI Free 分组试用资格检测：${email} -> 无试用资格，但没有找到源邮箱池条目，已在 Free 中标记为不可兑换。原因：${reason}`,
                'warn'
              );
              continue;
            }
            failed.push({ email, reason });
            items = upsertResultItem(items, {
              ...activeCredential,
              status: 'free',
              planType: 'free',
              reason,
              trialEligibilityStatus: 'failed',
              trialEligibilityReason: reason,
              trialEligibilityCheckedAt: checkedAt,
            });
            await saveProgress('subscription-check', email);
            await addLog(`UPI Free 分组试用资格检测：${email} -> 检测失败，保留账号：${reason}`, 'warn');
          }
        }

        const finishedAt = new Date().toISOString();
        const finalResults = await saveResults({
          ...currentResults,
          items,
          running: false,
          updatedAt: finishedAt,
          finishedAt,
          flowStage: '',
          flowStageEmail: '',
          source: source || currentResults.source,
          total: items.length,
          completed: items.length,
          trialEligibilitySummary: {
            checkedAt: finishedAt,
            kept,
            skipped,
            failed,
            deletedEmails: [],
            ineligibleEmails,
            eligibleCount: kept.length,
            skippedCount: skipped.length,
            failedCount: failed.length,
            deletedCount: 0,
            ineligibleCount: ineligibleEmails.length,
          },
        });
        await addLog(
          `UPI Free 分组试用资格检测：完成，有资格 ${kept.length}，无试用资格 ${ineligibleEmails.length}，跳过 ${skipped.length}，失败 ${Math.max(0, failed.length - ineligibleEmails.length)}。`,
          'ok'
        );
        return {
          results: finalResults,
          deletedEmails: [],
          ineligibleEmails,
          kept,
          skipped,
          failed,
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
          source: source || currentResults.source,
        }).catch(() => null);
        throw error;
      } finally {
        batchRunning = false;
      }
    }

    async function importUpiCredentialMembershipFreeResults(input = {}) {
      if (batchRunning) {
        throw new Error('UPI 备份账号会员核验正在运行，请等待完成或先停止。');
      }
      const credentials = resolveInputCredentials(input).filter((credential) => credential.email);
      const now = new Date().toISOString();
      const currentResults = await getStoredResults();
      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      const activeUsageEmailSet = getActiveRedeemCdkeyUsageEmailSetFromState(latestState);
      const currentItems = Array.isArray(currentResults.items) ? currentResults.items : [];
      const existingByEmail = {};
      currentItems.forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (email) {
          existingByEmail[email] = item;
        }
      });
      const importedItemsByEmail = {};
      const importedEmails = new Set();
      const restoredEmails = new Set();
      const skippedEmails = new Set();
      const deletedBeforeImport = new Set((Array.isArray(currentResults.redeemAutoDeletedEmails)
        ? currentResults.redeemAutoDeletedEmails
        : []
      ).map(normalizeEmail).filter(Boolean));
      credentials.forEach((credential) => {
        const email = normalizeEmail(credential.email);
        if (!email) {
          return;
        }
        const existingItem = existingByEmail[email] || {};
        if (
          existingItem.status === 'paid'
          || isActiveUpiCredentialMembershipRedeemResultItem(existingItem, currentResults)
          || activeUsageEmailSet.has(email)
        ) {
          skippedEmails.add(email);
          return;
        }
        importedEmails.add(email);
        if (deletedBeforeImport.has(email)) {
          restoredEmails.add(email);
        }
        importedItemsByEmail[email] = normalizeResultItem({
          ...credential,
          status: 'free',
          planType: 'free',
          checkedAt: credential.checkedAt || credential.accessTokenUpdatedAt || now,
          reason: '待兑换',
          redeemStatus: '',
          redeemReason: '',
          redeemFailureCount: 0,
          upiRedeemFailureCount: 0,
          idealRedeemFailureCount: 0,
          ...buildRedeemAccountUnlockedPatch(),
          redeemLastFailedAt: '',
          membershipOverrideStatus: 'free',
          membershipOverrideCheckedAt: credential.checkedAt || credential.accessTokenUpdatedAt || now,
        });
      });
      const nextRedeemAutoDeletedEmails = (Array.isArray(currentResults.redeemAutoDeletedEmails)
        ? currentResults.redeemAutoDeletedEmails
        : []
      ).map(normalizeEmail).filter((email) => email && !importedEmails.has(email));
      const handledImportedEmails = new Set();
      const items = currentItems.map((item) => {
        const email = normalizeEmail(item?.email);
        if (email && importedEmails.has(email)) {
          handledImportedEmails.add(email);
          return importedItemsByEmail[email];
        }
        return item;
      });
      importedEmails.forEach((email) => {
        if (!handledImportedEmails.has(email)) {
          items.push(importedItemsByEmail[email]);
        }
      });
      const nextResults = await saveResults({
        ...currentResults,
        items,
        running: currentResults.running === true,
        redeeming: currentResults.redeeming === true && (redeemRunning || cdkeyRetryRunning),
        startedAt: currentResults.startedAt,
        updatedAt: now,
        finishedAt: currentResults.finishedAt,
        stoppedAt: currentResults.stoppedAt,
        redeemStartedAt: currentResults.redeemStartedAt,
        redeemUpdatedAt: currentResults.redeemUpdatedAt,
        redeemFinishedAt: currentResults.redeemFinishedAt,
        redeemStoppedAt: currentResults.redeemStoppedAt,
        redeemAutoDeletedEmails: nextRedeemAutoDeletedEmails,
        redeemAutoDeletedCount: nextRedeemAutoDeletedEmails.length,
        flowStage: currentResults.flowStage,
        flowStageEmail: currentResults.flowStageEmail,
        source: normalizeString(input.source || currentResults.source || 'txt-free'),
        total: items.length,
        completed: items.length,
        redeemTotal: currentResults.redeemTotal,
        redeemCompleted: currentResults.redeemCompleted,
      });
      return {
        ...nextResults,
        importedCount: importedEmails.size,
        restoredCount: restoredEmails.size,
        restoredEmails: Array.from(restoredEmails),
        skippedCount: skippedEmails.size,
        skippedEmails: Array.from(skippedEmails),
      };
    }

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

    async function exportUpiCredentialMembershipCheckResults(input = {}) {
      const rawStatus = normalizeString(input.status || 'paid');
      const channel = rawStatus === 'paid-upi'
        ? 'upi'
        : rawStatus === 'paid-ideal'
          ? 'ideal'
          : normalizeString(input.channel || input.redeemChannel || '');
      const status = rawStatus === 'paid-upi' || rawStatus === 'paid-ideal' || rawStatus === 'paid-all'
        ? 'paid'
        : rawStatus;
      const results = await getStoredResults();
      const removeAfterExport = input.removeAfterExport === true || input.clearAfterExport === true;
      if (removeAfterExport && (results.running || results.redeeming)) {
        throw new Error('UPI 备份账号核验/补兑正在运行，请先停止后再导出并清空当前批次。');
      }
      const allowedEmails = normalizeEmailList(input.emails || input.emailList || []);
      const rows = buildResultExportRows(results, status, channel, allowedEmails);
      const normalizedResults = normalizeResultsPayload(results);
      const allowedEmailSet = new Set(allowedEmails);
      const seenExportEmails = new Set();
      const exportedEmails = normalizedResults.items
        .filter((item) => {
          const email = normalizeEmail(item.email);
          if (!email || (allowedEmailSet.size && !allowedEmailSet.has(email))) return false;
          const statusMatches = status === 'free'
            ? item.status === 'free' || item.status === 'failed'
            : item.status === status;
          if (!statusMatches) return false;
          if (status === 'paid' && channel) {
            const normalizedChannel = normalizeRedeemChannel(channel);
            if (
              getResultItemRedeemChannel(item) !== normalizedChannel
              || isResultItemHiddenByPlusDeletion(normalizedResults, item, normalizedChannel)
            ) {
              return false;
            }
          } else if (status === 'paid' && isResultItemHiddenByPlusDeletion(normalizedResults, item)) {
            return false;
          }
          if (status === 'failed' && !item.email) return false;
          if (status !== 'failed') {
            const no2faExportable = status === 'free'
              && item.no2faFreeRoute === true
              && item.email
              && item.verificationUrl
              && item.accessToken;
            const passkeyExportable = isResultItemPasskeyExportableForStatus(item, status);
            const password2faExportable = Boolean(item.email && item.password && item.totpMfaSecret);
            if (!no2faExportable && !passkeyExportable && !password2faExportable) return false;
          }
          const key = status === 'paid'
            ? `${getResultItemRedeemChannel(item)}:${email}`
            : `${status}:${email}`;
          if (seenExportEmails.has(key)) return false;
          seenExportEmails.add(key);
          return true;
        })
        .map((item) => item.email);
      const allFreeRowsAreNo2fa = status === 'free'
        && rows.length > 0
        && rows.every((row) => {
          const parts = String(row || '').split(/---+/).map((part) => part.trim());
          return parts.length === 4 && isLikelyVerificationUrl(parts[1]);
        });
      const allFreeRowsArePasskey = status === 'free'
        && rows.length > 0
        && rows.every((row) => {
          const parts = String(row || '').split(/---+/).map((part) => part.trim());
          return parts.length >= 4 && isPasskeyExportMarker(parts[2]);
        });
      const allPaidRowsArePasskey = status === 'paid'
        && rows.length > 0
        && rows.every((row) => {
          const parts = String(row || '').split(/---+/).map((part) => part.trim());
          return parts.length >= 4 && isPasskeyExportMarker(parts[2]);
        });
      const nameMap = {
        paid: allPaidRowsArePasskey ? 'upi-membership-paid-password-passkey' : 'upi-membership-paid-password-2fa',
        'paid-upi': allPaidRowsArePasskey ? 'upi-membership-paid-password-passkey' : 'upi-membership-paid-password-2fa',
        'paid-ideal': allPaidRowsArePasskey ? 'ideal-membership-paid-password-passkey' : 'ideal-membership-paid-password-2fa',
        free: allFreeRowsAreNo2fa
          ? 'upi-membership-free-email-url-at'
          : (allFreeRowsArePasskey ? 'upi-membership-free-password-passkey' : 'upi-membership-free-password-2fa'),
        failed: 'upi-membership-check-failed',
      };
      const deleteResult = rows.length && removeAfterExport
        ? await deleteUpiCredentialMembershipCheckResults({ status, emails: exportedEmails })
        : null;
      return {
        status,
        channel: channel ? normalizeRedeemChannel(channel) : '',
        count: rows.length,
        fileName: rows.length ? buildTimestampedFileName(nameMap[rawStatus] || nameMap[status] || 'upi-membership-check') : '',
        fileContent: rows.length ? `${rows.join('\n')}\n` : '',
        removedCount: Math.max(0, Number(deleteResult?.deletedCount) || 0),
        results: deleteResult?.results,
      };
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
