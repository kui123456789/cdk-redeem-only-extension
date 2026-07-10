(function attachMembershipResultState(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPageMembershipResultState = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipResultStateModule(root) {
  const REDEEM_CHANNEL_FAILURE_LIMIT = 3;
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

  function getRedeemChannelStateHelpers() {
    return root.MultiPageRedeemChannelState || {};
  }

  function normalizeRedeemChannel(value = '') {
    const helper = getRedeemChannelStateHelpers().normalizeRedeemChannel;
    if (typeof helper === 'function') {
      return helper(value);
    }
    return normalizeString(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
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
    if (value !== undefined && value !== null && normalizeString(value) !== '') {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 0) {
        return Math.floor(numeric > 1000000000000 ? numeric : numeric * 1000);
      }
    }
    const timestamp = Date.parse(normalizeString(value));
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function normalizeNo2faFreeVerificationUrlForExport(value = '') {
    const raw = normalizeString(value);
    const sharedNormalizer = getMembershipCredentialFormat().normalizeVerificationUrlForExport;
    if (typeof sharedNormalizer === 'function') {
      return sharedNormalizer(raw);
    }
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
      if (
        url.hostname.toLowerCase() === 'mail.334401.xyz'
        && /^\/json\//i.test(url.pathname)
      ) {
        url.pathname = url.pathname.replace(/^\/json\//i, '/show/');
      }
      return url.toString();
    } catch {
      return raw.replace(/^(https?:\/\/mail\.334401\.xyz)\/json\//i, '$1/show/');
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

  function getPasskeyApiLoginHelper() {
    return root.MultiPagePasskeyApiLoginExecutor || {};
  }

  function readFirstFiniteNumericMetadataValue(values = []) {
    for (const value of values) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' && value.trim() === '') continue;
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric;
    }
    return undefined;
  }

  function readPasskeySignCountMetadata(...sources) {
    const numeric = readFirstFiniteNumericMetadataValue(sources.flatMap((source) => (
      source && typeof source === 'object' && !Array.isArray(source)
        ? [source.passkeySignCount, source.signCount, source.sign_count]
        : [source]
    )));
    return numeric === undefined ? undefined : Math.max(0, Math.floor(numeric));
  }

  function readPasskeyAlgMetadata(...sources) {
    return readFirstFiniteNumericMetadataValue(sources.flatMap((source) => (
      source && typeof source === 'object' && !Array.isArray(source)
        ? [source.passkeyAlg, source.alg]
        : [source]
    )));
  }

  function buildPasskeyNumericMetadataPatch(...sources) {
    const helper = getPasskeyApiLoginHelper().buildPasskeyNumericMetadataPatch;
    if (typeof helper === 'function') {
      return helper(...sources);
    }
    const signCount = readPasskeySignCountMetadata(...sources);
    const alg = readPasskeyAlgMetadata(...sources);
    return {
      ...(signCount !== undefined ? { passkeySignCount: signCount } : {}),
      ...(alg !== undefined ? { passkeyAlg: alg } : {}),
    };
  }

  function buildPasskeyExportMarker(item = {}) {
    const helper = getPasskeyApiLoginHelper().buildPasskeyExportMarker;
    if (typeof helper === 'function') {
      return helper(item);
    }
    const credentialId = normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id);
    if (!credentialId) return 'PASSKEY';
    const metadata = buildPasskeyNumericMetadataPatch(item);
    const segments = [`PASSKEY:${credentialId}`];
    if (metadata.passkeySignCount !== undefined) segments.push(`signCount=${metadata.passkeySignCount}`);
    if (metadata.passkeyAlg !== undefined) segments.push(`alg=${metadata.passkeyAlg}`);
    return segments.join(';');
  }

  function hasPasskeyCredential(item = {}) {
    const helper = getPasskeyApiLoginHelper().hasPasskeyCredential;
    if (typeof helper === 'function') {
      return helper(item);
    }
    return item.passkeyEnabled === true
      || Boolean(normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id));
  }

  function isResultItemPasskeyExportableForStatus(item = {}, status = '') {
    const helper = getPasskeyApiLoginHelper().isResultItemPasskeyExportableForStatus;
    if (typeof helper === 'function') {
      return helper(item, status);
    }
    const normalizedStatus = normalizeString(status);
    if (normalizedStatus !== 'free' && normalizedStatus !== 'paid') {
      return false;
    }
    if (!hasPasskeyCredential(item) || !item.email || !item.password) return false;
    return normalizedStatus === 'paid' || Boolean(item.accessToken);
  }

  function getMembershipCredentialFormat() {
    return root.MultiPageMembershipCredentialFormat || {};
  }

  function isInternalRedeemImplementationError(item = {}) {
    const text = [
      item?.redeemReason,
      item?.reason,
      item?.lastError,
      item?.remoteMessage,
    ].map(normalizeString).join(' ');
    return /\bREDEEM_CHANNEL_FAILURE_LIMIT\s+is\s+not\s+defined\b/i.test(text)
      || /\bcontext\.parseCdkeyPoolText\s+is\s+not\s+a\s+function\b/i.test(text);
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
    const shouldClearInternalRedeemFailure = isInternalRedeemImplementationError(item);
    const rawRedeemChannel = normalizeString(item.redeemChannel || item.channel || item.paymentChannel);
    const redeemChannel = shouldClearInternalRedeemFailure ? '' : (rawRedeemChannel ? normalizeRedeemChannel(rawRedeemChannel) : '');
    const legacyFailureCount = Math.max(0, Math.floor(Number(item.redeemFailureCount) || 0));
    const upiRedeemFailureCount = shouldClearInternalRedeemFailure ? 0 : Math.max(0, Math.floor(Number(
      item.upiRedeemFailureCount ?? (redeemChannel === 'upi' ? legacyFailureCount : 0)
    ) || 0));
    const idealRedeemFailureCount = shouldClearInternalRedeemFailure ? 0 : Math.max(0, Math.floor(Number(
      item.idealRedeemFailureCount ?? (redeemChannel === 'ideal' ? legacyFailureCount : 0)
    ) || 0));
    const redeemLocked = !shouldClearInternalRedeemFailure
      && (normalizeBoolean(item.redeemLocked) || idealRedeemFailureCount >= REDEEM_CHANNEL_FAILURE_LIMIT);
    const passkeyNumericMetadataPatch = buildPasskeyNumericMetadataPatch(item);
    const normalized = {
      email,
      password: normalizeString(item.password),
      totpMfaSecret: normalizeTotpSecret(item.totpMfaSecret),
      gptPassword: normalizeString(item.gptPassword || item.password),
      verificationUrl: normalizeString(item.verificationUrl || item.emailVerificationUrl || item.url),
      recordedAt: Math.max(0, Math.floor(Number(item.recordedAt || item.no2faFreeRecordedAt) || 0)),
      no2faFreeRoute: item.no2faFreeRoute === true,
      passkeyEnabled: item.passkeyEnabled === true || Boolean(normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id)),
      passkeyEnabledAt: normalizeString(item.passkeyEnabledAt), passkeyCredentialId: normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id),
      passkeyFactorId: normalizeString(item.passkeyFactorId || item.factorId || item.factor_id), passkeyRpId: normalizeString(item.passkeyRpId || item.rpId || item.rp_id),
      passkeyUserHandle: normalizeString(item.passkeyUserHandle || item.userHandle || item.user_handle),
      passkeyPrivateJwk: item.passkeyPrivateJwk && typeof item.passkeyPrivateJwk === 'object' && !Array.isArray(item.passkeyPrivateJwk) ? item.passkeyPrivateJwk : null,
      passkeyPublicKeyCose: normalizeString(item.passkeyPublicKeyCose || item.publicKeyCose || item.public_key_cose), ...passkeyNumericMetadataPatch,
      passkeyApiPersisted: item.passkeyApiPersisted === true || item.persisted === true,
      twoFactorEnabled: item.twoFactorEnabled === true
        || Boolean(normalizeTotpSecret(item.totpMfaSecret))
        || item.passkeyEnabled === true
        || Boolean(normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id)),
      status,
      planType: normalizePlanType(item.planType),
      checkedAt: normalizeString(item.checkedAt),
      reason: shouldClearInternalRedeemFailure
        ? (normalizeString(item.trialEligibilityReason) || '账号有试用资格，可进行 CDK 兑换')
        : normalizeString(item.reason),
      trialEligibilityStatus: normalizeString(item.trialEligibilityStatus),
      trialEligibilityReason: normalizeString(item.trialEligibilityReason),
      trialEligibilityCheckedAt: normalizeString(item.trialEligibilityCheckedAt),
      trialEligibilityReasonCode: normalizeString(item.trialEligibilityReasonCode),
      trialEligibilityCheckedByApi: item.trialEligibilityCheckedByApi === true,
      trialEligibilityTransientFailure: item.trialEligibilityTransientFailure === true,
      trialEligibilityRetryable: item.trialEligibilityRetryable === true,
      trialEligibilityRetryCount: Math.max(0, Math.floor(Number(item.trialEligibilityRetryCount) || 0)),
      trialEligibilityLastError: normalizeString(item.trialEligibilityLastError),
      couponState: normalizeString(item.couponState || item.coupon_state),
      registrationType: normalizeString(item.registrationType || item.reg_type),
      registrationPhone: normalizeString(item.registrationPhone || item.phone_number),
      phoneVerified: item.phoneVerified === true,
      accountId: normalizeString(item.accountId || item.account_id),
      responseEmail: normalizeEmail(item.responseEmail || item.emailFromApi || item.apiEmail),
      jwtExpired: item.jwtExpired === true,
      jwtExpiresInSeconds: Math.max(0, Math.floor(Number(item.jwtExpiresInSeconds || item.jwt_exp_in_sec) || 0)),
      upiChannelEligibilityStatus: normalizeString(item.upiChannelEligibilityStatus || item.upiEligibilityStatus),
      upiChannelEligibilityReason: normalizeString(item.upiChannelEligibilityReason || item.upi_eligible_reason || item.upiEligibleReason),
      idealChannelEligibilityStatus: normalizeString(item.idealChannelEligibilityStatus || item.idealEligibilityStatus),
      idealChannelEligibilityReason: normalizeString(item.idealChannelEligibilityReason || item.ideal_eligible_reason || item.idealEligibleReason),
      accessToken,
      accessTokenMasked: accessToken ? (normalizeString(item.accessTokenMasked) || maskAccessToken(accessToken)) : '',
      accessTokenUpdatedAt,
      redeemStatus: shouldClearInternalRedeemFailure ? '' : normalizeString(item.redeemStatus),
      redeemReason: shouldClearInternalRedeemFailure ? '' : normalizeString(item.redeemReason),
      redeemFailureCount: shouldClearInternalRedeemFailure ? 0 : Math.max(0, Math.floor(Number(item.redeemFailureCount) || 0)),
      redeemFailureLimit: shouldClearInternalRedeemFailure ? REDEEM_CHANNEL_FAILURE_LIMIT : Math.max(0, Math.floor(Number(item.redeemFailureLimit) || 0)),
      upiRedeemFailureCount,
      idealRedeemFailureCount,
      redeemLocked,
      redeemLockedReason: redeemLocked
        ? (normalizeString(item.redeemLockedReason) || 'IDEAL 已失败 3 次，账号已封存，不再使用')
        : '',
      redeemLockedAt: redeemLocked ? normalizeString(item.redeemLockedAt) : '',
      redeemLastFailedAt: shouldClearInternalRedeemFailure ? '' : normalizeString(item.redeemLastFailedAt),
      redeemAttemptedAt: shouldClearInternalRedeemFailure ? '' : normalizeString(item.redeemAttemptedAt),
      redeemSuccessAt: normalizeString(item.redeemSuccessAt),
      redeemChannel,
      upiRedeemCdkey: shouldClearInternalRedeemFailure ? '' : normalizeString(item.upiRedeemCdkey || item.cdkey),
      lastFailedUpiRedeemCdkey: shouldClearInternalRedeemFailure ? '' : normalizeString(item.lastFailedUpiRedeemCdkey || item.failedUpiRedeemCdkey),
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
      const updatedAt = getResultItemUpdatedAt(item, normalized);
      const previous = byEmail[normalized.email];
      if (!previous || updatedAt >= previous.updatedAt) {
        byEmail[normalized.email] = { item: normalized, updatedAt };
      }
    });
    return Object.values(byEmail).map((entry) => entry.item);
  }

  function getResultItemUpdatedAt(...items) {
    return Math.max(
      0,
      ...items.map((item) => Math.max(
        normalizeResultsTimestamp(item?.updatedAt),
        normalizeResultsTimestamp(item?.checkedAt),
        normalizeResultsTimestamp(item?.trialEligibilityCheckedAt),
        normalizeResultsTimestamp(item?.accessTokenUpdatedAt),
        normalizeResultsTimestamp(item?.redeemAttemptedAt),
        normalizeResultsTimestamp(item?.redeemLastFailedAt),
        normalizeResultsTimestamp(item?.redeemSuccessAt)
      ))
    );
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
    const ineligibleEmails = Array.isArray(source.ineligibleEmails)
      ? source.ineligibleEmails.map(normalizeEmail).filter(Boolean)
      : [];
    return {
      checkedAt: normalizeString(source.checkedAt),
      kept,
      skipped,
      failed,
      deletedEmails,
      ineligibleEmails,
      eligibleCount: Math.max(0, Math.floor(Number(source.eligibleCount) || kept.length || 0)),
      skippedCount: Math.max(0, Math.floor(Number(source.skippedCount) || skipped.length || 0)),
      failedCount: Math.max(0, Math.floor(Number(source.failedCount) || failed.length || 0)),
      deletedCount: Math.max(0, Math.floor(Number(source.deletedCount) || deletedEmails.length || 0)),
      ineligibleCount: Math.max(0, Math.floor(Number(source.ineligibleCount) || ineligibleEmails.length || 0)),
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

  function buildResultExportRowsFreeFallback(item = {}, options = {}) {
    const timestamp = formatNo2faFreeExportTime(getNo2faFreeExportTimestamp(item));
    const verificationUrl = item.verificationUrl ? normalizeNo2faFreeVerificationUrlForExport(item.verificationUrl) : '';
    const includeVerificationUrl = options.includeVerificationUrl !== false;
    if (item.no2faFreeRoute === true && item.accessToken) {
      return includeVerificationUrl && item.verificationUrl
        ? `${item.email}---${verificationUrl}---${item.accessToken || ''}---${timestamp}`
        : `${item.email}---${item.accessToken || ''}---${timestamp}`;
    }
    if (item.passkeyEnabled === true && item.password && item.accessToken && !item.totpMfaSecret) {
      const passkeyMarker = buildPasskeyExportMarker(item);
      return includeVerificationUrl && verificationUrl ? `${item.email}---${item.password}---${passkeyMarker}---${verificationUrl}---${item.accessToken || ''}---${timestamp}` : `${item.email}---${item.password}---${passkeyMarker}---${item.accessToken || ''}---${timestamp}`;
    }
    return includeVerificationUrl && verificationUrl ? `${item.email}---${item.password}---${item.totpMfaSecret}---${verificationUrl}---${item.accessToken || ''}---${timestamp}` : `${item.email}---${item.password}---${item.totpMfaSecret}---${item.accessToken || ''}---${timestamp}`;
  }

  function buildResultExportRows(results = {}, status = 'paid', channel = '', emails = [], options = {}) {
    const normalizedStatus = normalizeString(status);
    const normalizedChannel = normalizeString(channel) ? normalizeRedeemChannel(channel) : '';
    const normalizedResults = normalizeResultsPayload(results);
    const allowedEmailSet = new Set(normalizeEmailList(emails));
    const includeVerificationUrl = options.includeVerificationUrl !== false;
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
            && (!includeVerificationUrl || item.verificationUrl)
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
          const formatFreeCredentialLine = getMembershipCredentialFormat().formatFreeCredentialLine;
          if (typeof formatFreeCredentialLine === 'function') {
            return formatFreeCredentialLine({ ...item, checkedAt: formatNo2faFreeExportTime(getNo2faFreeExportTimestamp(item)) }, options);
          }
          return buildResultExportRowsFreeFallback(item, options);
        }
        const timestamp = item.redeemSuccessAt || item.upiRedeemSubscriptionCheckedAt || item.checkedAt || '';
        const verificationUrl = includeVerificationUrl && item.verificationUrl
          ? normalizeNo2faFreeVerificationUrlForExport(item.verificationUrl)
          : '';
        if (item.passkeyEnabled === true && item.password && !item.totpMfaSecret) {
          const prefix = `${item.email}----${item.password}---${buildPasskeyExportMarker(item)}`;
          return verificationUrl
            ? `${prefix}---${verificationUrl}---${timestamp}`
            : `${prefix}---${timestamp}`;
        }
        const prefix = `${item.email}----${item.password}---${item.totpMfaSecret}`;
        return verificationUrl
          ? `${prefix}---${verificationUrl}---${timestamp}`
          : `${prefix}---${timestamp}`;
      })
      .filter(Boolean);
  }

  return {
    addRedeemPlusDeletedEmailsByChannel,
    buildRedeemDeletionStatePatch,
    buildResultExportRows,
    dedupeResultItemsByEmail,
    mergeRedeemDeletionStateForSave,
    normalizeRedeemPlusDeletedEmailsByChannel,
    normalizeResultItem,
    normalizeResultsPayload,
  };
});
