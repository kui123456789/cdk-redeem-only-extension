(function attachRedeemAttemptHistory(root, factory) {
  const api = factory();
  root.MultiPageRedeemAttemptHistory = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createRedeemAttemptHistoryModule() {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const DEFAULT_MAX_ENTRIES = 5;
  const DEFAULT_MAX_AGE_MS = 30 * DAY_MS;

  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function normalizeEmail(value = '') {
    return normalizeString(value).toLowerCase();
  }

  function buildAccessTokenFingerprint(accessToken = '') {
    const token = normalizeString(accessToken);
    if (!token) return '';
    let hash = 0x811c9dc5;
    for (let index = 0; index < token.length; index += 1) {
      hash ^= token.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }
    return `at_${(hash >>> 0).toString(16).padStart(8, '0')}`;
  }

  function normalizeRedeemAttempt(entry = {}) {
    const source = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry : {};
    const accessToken = normalizeString(source.accessToken || source.access_token || source.upiRedeemAccessToken);
    return {
      ...source,
      submittedEmail: normalizeEmail(source.submittedEmail || source.email || source.targetEmail),
      tokenEmail: normalizeEmail(source.tokenEmail || source.accountEmail || source.actualEmail),
      accessToken,
      accessTokenFingerprint: normalizeString(source.accessTokenFingerprint) || buildAccessTokenFingerprint(accessToken),
      submittedAt: Math.max(0, Math.floor(Number(source.submittedAt || source.attemptAt || source.createdAt) || 0)),
      recoveredEmail: normalizeEmail(source.recoveredEmail),
      recoveredPlanType: normalizeString(source.recoveredPlanType).toLowerCase(),
      recoveredAt: Math.max(0, Math.floor(Number(source.recoveredAt) || 0)),
    };
  }

  function normalizeRedeemAttemptHistory(value = [], options = {}) {
    const nowMs = Math.max(1, Math.floor(Number(options.nowMs) || Date.now()));
    const maxEntries = Math.max(1, Math.floor(Number(options.maxEntries) || DEFAULT_MAX_ENTRIES));
    const maxAgeMs = Math.max(1, Math.floor(Number(options.maxAgeMs) || DEFAULT_MAX_AGE_MS));
    const cutoff = nowMs - maxAgeMs;
    return (Array.isArray(value) ? value : [])
      .map(normalizeRedeemAttempt)
      .filter((entry) => (entry.accessToken || entry.accessTokenFingerprint) && entry.submittedAt >= cutoff && entry.submittedAt <= nowMs)
      .sort((left, right) => right.submittedAt - left.submittedAt)
      .slice(0, maxEntries);
  }

  function appendRedeemAttempt(history = [], attempt = {}, options = {}) {
    return normalizeRedeemAttemptHistory([
      normalizeRedeemAttempt(attempt),
      ...(Array.isArray(history) ? history : []),
    ], options);
  }

  function markRedeemAttemptRecovered(history = [], recovery = {}, options = {}) {
    const accessToken = normalizeString(recovery.accessToken);
    const fingerprint = normalizeString(recovery.accessTokenFingerprint) || buildAccessTokenFingerprint(accessToken);
    const recoveredAt = Math.max(1, Math.floor(Number(recovery.recoveredAt) || Number(options.nowMs) || Date.now()));
    return normalizeRedeemAttemptHistory((Array.isArray(history) ? history : []).map((entry) => {
      const normalized = normalizeRedeemAttempt(entry);
      if (!fingerprint || normalized.accessTokenFingerprint !== fingerprint) return normalized;
      return {
        ...normalized,
        accessToken: '',
        accessTokenFingerprint: fingerprint,
        recoveredEmail: normalizeEmail(recovery.recoveredEmail || recovery.email),
        recoveredPlanType: normalizeString(recovery.planType).toLowerCase(),
        recoveredAt,
      };
    }), options);
  }

  function decodeJwtPayload(token = '') {
    const rawPayload = normalizeString(token).split('.')[1] || '';
    if (!rawPayload) return null;
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

  function getAccessTokenOwnership(token = '', targetEmail = '') {
    const payload = decodeJwtPayload(token) || {};
    const profile = payload?.['https://api.openai.com/profile'];
    const tokenEmail = normalizeEmail(
      profile?.email
      || payload?.email
      || payload?.user?.email
      || payload?.account?.email
      || ''
    );
    const normalizedTargetEmail = normalizeEmail(targetEmail);
    const verifiable = Boolean(tokenEmail && normalizedTargetEmail);
    return {
      targetEmail: normalizedTargetEmail,
      tokenEmail,
      verifiable,
      matches: verifiable && tokenEmail === normalizedTargetEmail,
    };
  }

  function normalizeRemoteStatus(value = '') {
    const status = normalizeString(value).toLowerCase().replace(/[\s-]+/g, '_');
    if (['success', 'succeeded', 'redeemed', 'used'].includes(status)) return 'success';
    if (/兑换成功|已兑换|已使用|成功/.test(status)) return 'success';
    return status;
  }

  function isSuccessfulUsageEntry(entry = {}) {
    return entry?.subscriptionActive === true
      || normalizeRemoteStatus(entry?.remoteStatus) === 'success'
      || normalizeRemoteStatus(entry?.remoteMessage) === 'success';
  }

  function getChannelUsageSources(state = {}) {
    const source = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
    return [
      ['upi', source.upiRedeemCdkeyUsage || source.cdkUsage || source.upiRedeemCdkUsage || source.pixRedeemCdkeyUsage || {}],
      ['ideal', source.idealRedeemCdkeyUsage || {}],
      ['pix', source.pixChannelRedeemCdkeyUsage || {}],
    ];
  }

  function collectSuccessfulRedeemAttemptCandidates(state = {}, options = {}) {
    const nowMs = Math.max(1, Math.floor(Number(options.nowMs) || Date.now()));
    const candidates = [];
    getChannelUsageSources(state).forEach(([channel, usage]) => {
      Object.entries(usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {}).forEach(([rawCdkey, rawEntry]) => {
        const entry = rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry) ? rawEntry : {};
        if (!isSuccessfulUsageEntry(entry)) return;
        const cdkey = normalizeString(rawCdkey);
        const legacyAttempt = normalizeRedeemAttempt({
          submittedEmail: entry.email || entry.accountEmail || entry.credentialEmail,
          tokenEmail: entry.tokenEmail,
          accessToken: entry.accessToken || entry.access_token || entry.upiRedeemAccessToken,
          submittedAt: entry.accessTokenUpdatedAt || entry.lastAttemptAt || entry.usedAt,
        });
        const history = normalizeRedeemAttemptHistory(entry.redeemAttemptHistory, { nowMs });
        [legacyAttempt, ...history].forEach((attempt) => {
          if (!attempt.accessToken) return;
          candidates.push({
            ...attempt,
            cdkey,
            channel,
          });
        });
      });
    });
    const seenTokens = new Set();
    return candidates
      .sort((left, right) => right.submittedAt - left.submittedAt)
      .filter((candidate) => {
        if (seenTokens.has(candidate.accessToken)) return false;
        seenTokens.add(candidate.accessToken);
        return true;
      });
  }

  function isPaidSubscription(result = {}) {
    const status = normalizeString(result.status).toLowerCase();
    const planType = normalizeString(result.planType || result.plan_type || result.plan).toLowerCase();
    return status === 'paid'
      || result.active === true
      || ['plus', 'pro', 'team'].includes(planType);
  }

  async function recoverPaidRedeemAttempt(input = {}) {
    const currentEmail = normalizeEmail(input.currentEmail);
    const checkSubscription = input.checkSubscription;
    if (!currentEmail || typeof checkSubscription !== 'function') return null;
    const candidates = collectSuccessfulRedeemAttemptCandidates(input.state, { nowMs: input.nowMs });
    for (const candidate of candidates) {
      if (typeof input.throwIfStopRequested === 'function') input.throwIfStopRequested();
      const ownership = getAccessTokenOwnership(candidate.accessToken, currentEmail);
      if (!ownership.verifiable || ownership.matches) continue;
      let subscription;
      try {
        subscription = await checkSubscription({
          email: ownership.tokenEmail,
          accessToken: candidate.accessToken,
          candidate,
        });
      } catch {
        continue;
      }
      if (!isPaidSubscription(subscription)) continue;
      return {
        ...candidate,
        email: ownership.tokenEmail,
        planType: normalizeString(subscription.planType || subscription.plan_type || subscription.plan).toLowerCase(),
        reason: normalizeString(subscription.reason),
        subscription,
      };
    }
    return null;
  }

  function buildRedeemOwnershipRecoveryResult(input = {}) {
    const currentItem = input.currentItem && typeof input.currentItem === 'object' && !Array.isArray(input.currentItem)
      ? input.currentItem
      : {};
    const recoveredBaseItem = input.recoveredBaseItem && typeof input.recoveredBaseItem === 'object' && !Array.isArray(input.recoveredBaseItem)
      ? input.recoveredBaseItem
      : {};
    const recovery = input.recovery && typeof input.recovery === 'object' && !Array.isArray(input.recovery)
      ? input.recovery
      : {};
    const currentEmail = normalizeEmail(currentItem.email);
    const recoveredEmail = normalizeEmail(recovery.email);
    const cdkey = normalizeString(recovery.cdkey);
    const channel = normalizeString(recovery.channel || 'upi').toLowerCase() || 'upi';
    const planType = normalizeString(recovery.planType || recovery.subscription?.planType || 'plus').toLowerCase() || 'plus';
    const checkedAt = normalizeString(input.checkedAt) || new Date().toISOString();
    const currentReason = normalizeString(currentItem.reason);
    const mismatchReason = `CDK ${cdkey || '未知'} 的历史 AT 已确认 Plus 归属 ${recoveredEmail || '其他账号'}，当前邮箱保持非 Plus`;
    return {
      currentItem: {
        ...currentItem,
        email: currentEmail,
        status: 'free',
        planType: 'free',
        reason: currentReason ? `${currentReason}；${mismatchReason}` : mismatchReason,
        redeemRecoveryStatus: 'at_ownership_mismatch',
        redeemRecoveryEmail: recoveredEmail,
        redeemRecoveryCdkey: cdkey,
        redeemRecoveryChannel: channel,
        redeemRecoveryCheckedAt: checkedAt,
      },
      recoveredItem: {
        ...recoveredBaseItem,
        email: recoveredEmail,
        status: 'paid',
        planType,
        reason: normalizeString(recovery.reason) || `通过 ${channel.toUpperCase()} CDK 历史 AT 找回 ${planType}`,
        checkedAt,
        accessToken: normalizeString(recovery.accessToken),
        accessTokenFingerprint: normalizeString(recovery.accessTokenFingerprint) || buildAccessTokenFingerprint(recovery.accessToken),
        accessTokenUpdatedAt: checkedAt,
        redeemStatus: 'success',
        redeemReason: 'CDK 历史 AT 已确认会员真实归属',
        redeemSuccessAt: checkedAt,
        upiRedeemCdkey: cdkey,
        redeemChannel: channel,
        upiRedeemSubscriptionActive: true,
        upiRedeemSubscriptionPlanType: planType,
        upiRedeemSubscriptionCheckedAt: checkedAt,
        redeemRecoveryStatus: 'history_at_paid',
        redeemRecoveredFromEmail: currentEmail,
        redeemRecoveryCheckedAt: checkedAt,
        membershipOverrideStatus: '',
        membershipOverrideCheckedAt: '',
      },
    };
  }

  return {
    DEFAULT_MAX_AGE_MS,
    DEFAULT_MAX_ENTRIES,
    appendRedeemAttempt,
    buildRedeemOwnershipRecoveryResult,
    buildAccessTokenFingerprint,
    collectSuccessfulRedeemAttemptCandidates,
    getAccessTokenOwnership,
    markRedeemAttemptRecovered,
    recoverPaidRedeemAttempt,
    normalizeRedeemAttempt,
    normalizeRedeemAttemptHistory,
  };
});
