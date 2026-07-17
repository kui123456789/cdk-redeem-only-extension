(function attachSidepanelMembershipRowPolicy(globalScope) {
  const REDEEM_CHANNEL_FAILURE_LIMIT = 3;
  const REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS = 24 * 60 * 60 * 1000;

  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function normalizeEmail(value = '') {
    return normalizeText(value).toLowerCase();
  }

  function normalizeRetryCount(value) {
    const count = Math.floor(Number(value) || 0);
    return count > 0 ? count : 0;
  }

  function normalizeTimestamp(value) {
    const timestamp = Date.parse(String(value || ''));
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function normalizeRedeemChannel(value = '') {
    const normalized = normalizeText(value).toLowerCase();
    return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
  }

  function getMembershipGroup(row = {}) {
    const status = normalizeText(row?.status).toLowerCase();
    if (status !== 'paid') {
      return 'free';
    }
    const channel = normalizeRedeemChannel(row?.redeemChannel || row?.channel || row?.paymentChannel);
    if (channel === 'ideal') return 'ideal-plus';
    if (channel === 'pix') return 'pix-plus';
    return 'upi-plus';
  }

  function getRedeemChannelFailureField(channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    if (normalizedChannel === 'ideal') return 'idealRedeemFailureCount';
    if (normalizedChannel === 'pix') return 'pixRedeemFailureCount';
    return 'upiRedeemFailureCount';
  }

  function getRedeemChannelFailureCount(row = {}, channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    const field = getRedeemChannelFailureField(normalizedChannel);
    if (Object.prototype.hasOwnProperty.call(row || {}, field)) {
      return normalizeRetryCount(row?.[field]);
    }
    const legacyChannel = normalizeText(row?.redeemChannel || row?.channel || row?.paymentChannel)
      ? normalizeRedeemChannel(row.redeemChannel || row.channel || row.paymentChannel)
      : '';
    return legacyChannel === normalizedChannel ? normalizeRetryCount(row?.redeemFailureCount) : 0;
  }

  function getRedeemChannelDailyLimitBlockedAtField(channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    if (normalizedChannel === 'ideal') return 'idealRedeemDailyLimitBlockedAt';
    if (normalizedChannel === 'pix') return 'pixRedeemDailyLimitBlockedAt';
    return 'upiRedeemDailyLimitBlockedAt';
  }

  function getRedeemChannelDailyLimitBlockedUntilField(channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    if (normalizedChannel === 'ideal') return 'idealRedeemDailyLimitBlockedUntil';
    if (normalizedChannel === 'pix') return 'pixRedeemDailyLimitBlockedUntil';
    return 'upiRedeemDailyLimitBlockedUntil';
  }

  function getRedeemChannelDailyLimitReasonField(channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    if (normalizedChannel === 'ideal') return 'idealRedeemDailyLimitReason';
    if (normalizedChannel === 'pix') return 'pixRedeemDailyLimitReason';
    return 'upiRedeemDailyLimitReason';
  }

  function isRedeemChannelDailyLimitReason(message = '') {
    const text = normalizeText(message);
    return /该邮箱/.test(text)
      && /在该渠道今日提交次数已达上限/.test(text)
      && /3\s*次/.test(text)
      && /请\s*24\s*小时后再试/.test(text);
  }

  function isRedeemChannelDailyLimitBlocked(row = {}, channel = 'upi', options = {}) {
    const normalizedChannel = normalizeRedeemChannel(channel);
    const nowMs = Number.isFinite(Number(options.nowMs)) ? Number(options.nowMs) : Date.now();
    const blockedUntil = normalizeTimestamp(row?.[getRedeemChannelDailyLimitBlockedUntilField(normalizedChannel)]);
    if (blockedUntil > nowMs) {
      return true;
    }
    const blockedAt = normalizeTimestamp(row?.[getRedeemChannelDailyLimitBlockedAtField(normalizedChannel)]);
    const storedReason = row?.[getRedeemChannelDailyLimitReasonField(normalizedChannel)];
    if (
      blockedAt > 0
      && blockedAt + REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS > nowMs
      && isRedeemChannelDailyLimitReason(storedReason || row?.redeemReason || row?.reason)
    ) {
      return true;
    }
    const rawRowChannel = normalizeText(row?.redeemChannel || row?.channel || row?.paymentChannel);
    if (!rawRowChannel || normalizeRedeemChannel(rawRowChannel) !== normalizedChannel) {
      return false;
    }
    const legacyReason = row?.redeemReason || row?.reason || row?.remoteMessage;
    if (!isRedeemChannelDailyLimitReason(legacyReason)) {
      return false;
    }
    const legacyBlockedAt = normalizeTimestamp(row?.redeemLastFailedAt || row?.redeemAttemptedAt || row?.checkedAt || row?.updatedAt);
    return !legacyBlockedAt || legacyBlockedAt + REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS > nowMs;
  }

  function getFailureLimit() {
    return REDEEM_CHANNEL_FAILURE_LIMIT;
  }

  function shouldApplyRedeemFailureLimitForChannel(channel = 'upi') {
    const normalizedChannel = normalizeRedeemChannel(channel);
    return normalizedChannel === 'ideal' || normalizedChannel === 'pix';
  }

  function isRedeemLocked(row = {}) {
    return row?.redeemLocked === true
      || getRedeemChannelFailureCount(row, 'ideal') >= REDEEM_CHANNEL_FAILURE_LIMIT;
  }

  function getRedeemLockReason(row = {}) {
    return normalizeText(row?.redeemLockedReason)
      || 'IDEAL 已失败 3 次，账号已封存，不再使用';
  }

  function normalizeTrialEligibilityStatus(value = '') {
    const normalized = normalizeText(value).toLowerCase().replace(/[\s-]+/g, '_');
    if (['eligible', 'trial_eligible', 'available', 'ok', 'success'].includes(normalized)) {
      return 'eligible';
    }
    if (['ineligible', 'not_eligible', 'no_trial', 'trial_ineligible', 'rejected'].includes(normalized)) {
      return 'ineligible';
    }
    if (['failed', 'failure', 'error'].includes(normalized)) {
      return 'failed';
    }
    if (['skipped', 'skip'].includes(normalized)) {
      return 'skipped';
    }
    return '';
  }

  function normalizeRedeemRemoteStatus(status = '') {
    const normalized = normalizeText(status).toLowerCase().replace(/[\s-]+/g, '_');
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
    if (normalized === 'approve_blocked') {
      return 'approve_blocked';
    }
    if (/兑换成功|成功|已兑换|已使用|已用/.test(normalized)) {
      return 'success';
    }
    if (/提交失败|兑换失败|充值失败|失败|超时|拒绝|已拒绝|取消|已取消/.test(normalized)) {
      if (/超时/.test(normalized)) return 'timeout';
      if (/拒绝/.test(normalized)) return 'rejected';
      if (/取消/.test(normalized)) return 'canceled';
      return 'failed';
    }
    if (/未找到|不存在/.test(normalized)) {
      return 'not_found';
    }
    if (/无效|不可用/.test(normalized)) {
      return 'invalid';
    }
    if (/待派发|等待派发|队列|排队/.test(normalized)) {
      return 'pending_dispatch';
    }
    if (/派发中|正在派发/.test(normalized)) {
      return 'dispatching';
    }
    if (/已派发/.test(normalized)) {
      return 'dispatched';
    }
    if (/兑换中|处理中|进行中|正在兑换/.test(normalized)) {
      return 'processing';
    }
    if (/已提交|已接收|排队/.test(normalized)) {
      return 'submitted';
    }
    if (normalized === 'succeeded' || normalized === 'redeemed' || normalized === 'used') {
      return 'success';
    }
    if (normalized === 'failure' || normalized === 'error') {
      return 'failed';
    }
    if (normalized === 'cancelled') {
      return 'canceled';
    }
    if (normalized === 'notused' || normalized === 'not_used' || normalized === 'unredeemed') {
      return 'unused';
    }
    return normalized;
  }

  function isTrialEligibilityChannelAllowed(row = {}, channel = 'upi') {
    const redeemChannel = normalizeRedeemChannel(channel);
    const field = redeemChannel === 'ideal'
      ? 'idealChannelEligibilityStatus'
      : (redeemChannel === 'pix' ? 'pixChannelEligibilityStatus' : 'upiChannelEligibilityStatus');
    const status = normalizeText(row[field]).toLowerCase();
    return !status || status === 'unknown' || status === 'eligible';
  }

  function isActiveRedeemRemoteStatus(status = '') {
    return ['queued', 'pending', 'pending_token', 'pending_dispatch', 'dispatching', 'dispatched', 'submitted', 'accepted', 'running', 'redeeming', 'processing', 'in_progress']
      .includes(normalizeRedeemRemoteStatus(status));
  }

  function isPreSubmitBlockedReason(message = '') {
    const text = normalizeText(message);
    return /缺少\s*GPT\s*密码|缺少\s*2FA|提交密码后|未进入登录验证码页|登录未进入验证码页|登录需要邮箱一次性验证码|登录后需要邮箱|邮箱一次性验证码|验证码页面|登录密码未通过|密码未通过|2FA\s*动态码被页面拒绝|账号登录态不一致|accessToken\s*属于|未读取到\s*accessToken|未进入\s*ChatGPT\s*已登录态|登录或读取\s*accessToken\s*未完成|读取\s*accessToken\s*未完成|verify your identity|one-time password|one-time code/i.test(text);
  }

  function isPreSubmitBlockedRow(row = {}) {
    const redeemStatus = normalizeText(row.redeemStatus).toLowerCase();
    const cdkey = normalizeText(row.upiRedeemCdkey || row.cdkey);
    const reason = row.redeemReason || row.reason || '';
    return redeemStatus === 'failed' && !cdkey && isPreSubmitBlockedReason(reason);
  }

  function hasLoginMaterial(row = {}) {
    return Boolean(normalizeText(row.password));
  }

  function isManualLoginRetryableRow(row = {}) {
    const redeemStatus = normalizeText(row.redeemStatus).toLowerCase();
    if (redeemStatus !== 'blocked' && !isPreSubmitBlockedRow(row)) {
      return false;
    }
    const reason = normalizeText(row.redeemReason || row.reason);
    if (/缺少\s*GPT\s*密码|缺少\s*2FA/i.test(reason)) {
      return false;
    }
    return hasLoginMaterial(row);
  }

  function isDuplicateCdkeyPendingRow(row = {}) {
    const redeemStatus = normalizeText(row.redeemStatus).toLowerCase();
    if (!['running', 'submitted', 'pending', 'processing', 'accepted'].includes(redeemStatus)) {
      return false;
    }
    const reason = normalizeText(row.redeemReason || row.reason);
    return /(?:CDK|CDKEY|卡密)[\s\S]*(?:不可重复提交|重复提交|已提交|already\s+submitted|duplicate\s+submit|duplicate\s+submission|already\s+redeemed|already\s+used)|(?:不可重复提交|重复提交|已提交|already\s+submitted|duplicate\s+submit|duplicate\s+submission|already\s+redeemed|already\s+used)[\s\S]*(?:CDK|CDKEY|卡密)/i.test(reason);
  }

  function isRedeemableFreeRowForChannel(row = {}, channel = 'upi', options = {}) {
    const redeemChannel = normalizeRedeemChannel(channel);
    const status = normalizeText(row.status).toLowerCase();
    if (!row?.email || row.enabled === false || status !== 'free') {
      return false;
    }
    if (normalizeTrialEligibilityStatus(row.trialEligibilityStatus) !== 'eligible') {
      return false;
    }
    if (!normalizeText(row.accessToken)) {
      return false;
    }
    if (isRedeemLocked(row)) {
      return false;
    }
    if (isRedeemChannelDailyLimitBlocked(row, redeemChannel, options)) {
      return false;
    }
    const isChannelAllowed = typeof options.isTrialEligibilityChannelAllowed === 'function'
      ? options.isTrialEligibilityChannelAllowed(row, redeemChannel)
      : isTrialEligibilityChannelAllowed(row, redeemChannel);
    if (!isChannelAllowed) {
      return false;
    }
    const redeemStatus = normalizeText(row.redeemStatus).toLowerCase();
    if (isDuplicateCdkeyPendingRow(row)) {
      return !shouldApplyRedeemFailureLimitForChannel(redeemChannel)
        || getRedeemChannelFailureCount(row, redeemChannel) < REDEEM_CHANNEL_FAILURE_LIMIT;
    }
    if (isActiveRedeemRemoteStatus(redeemStatus)) {
      return false;
    }
    if (redeemStatus === 'blocked' || isPreSubmitBlockedRow(row)) {
      return isManualLoginRetryableRow(row);
    }
    if (redeemStatus === 'failed') {
      return !shouldApplyRedeemFailureLimitForChannel(redeemChannel)
        || getRedeemChannelFailureCount(row, redeemChannel) < REDEEM_CHANNEL_FAILURE_LIMIT;
    }
    return !shouldApplyRedeemFailureLimitForChannel(redeemChannel)
      || getRedeemChannelFailureCount(row, redeemChannel) < REDEEM_CHANNEL_FAILURE_LIMIT;
  }

  function isRedeemableFreeRow(row = {}, options = {}) {
    return isRedeemableFreeRowForChannel(row, 'upi', options)
      || isRedeemableFreeRowForChannel(row, 'ideal', options);
  }

  function isChannelFailureLimitReached(row = {}, channel = 'upi') {
    if (!shouldApplyRedeemFailureLimitForChannel(channel)) {
      return false;
    }
    return getRedeemChannelFailureCount(row, channel) >= REDEEM_CHANNEL_FAILURE_LIMIT;
  }

  function getChannelFailureLimitBlockedRows(rows = [], channel = 'upi', options = {}) {
    const redeemChannel = normalizeRedeemChannel(channel);
    return (Array.isArray(rows) ? rows : []).filter((row) => {
      const status = normalizeText(row.status).toLowerCase();
      if (!row?.email || row.enabled === false || status !== 'free') {
        return false;
      }
      if (redeemChannel === 'upi') {
        return isChannelFailureLimitReached(row, 'upi')
          && !isRedeemLocked(row)
          && isRedeemableFreeRowForChannel(row, 'ideal', options);
      }
      return isChannelFailureLimitReached(row, 'ideal') || isRedeemLocked(row);
    });
  }

  function getNotRedeemableReason(row = {}) {
    const status = normalizeText(row.status).toLowerCase();
    const redeemStatus = normalizeText(row.redeemStatus).toLowerCase();
    const reason = normalizeText(row.redeemReason || row.reason);
    if (!row?.email) {
      return '账号邮箱为空，无法兑换';
    }
    if (row.enabled === false) {
      return '账号已停用';
    }
    if (status !== 'free') {
      return status === 'paid' ? '当前已有会员' : '当前不是无会员状态';
    }
    if (isRedeemLocked(row)) {
      return getRedeemLockReason(row);
    }
    if (isDuplicateCdkeyPendingRow(row)) {
      return '上次 CDK 重复提交，当前账号未提交成功，可重新兑换';
    }
    if (isActiveRedeemRemoteStatus(redeemStatus)) {
      return reason || 'CDK 已提交，等待远端状态刷新';
    }
    if (redeemStatus === 'blocked' || isPreSubmitBlockedRow(row)) {
      if (isManualLoginRetryableRow(row)) {
        return reason || '登录受阻，可点击重新登录或手动接管后继续';
      }
      return reason || '登录或读取 ChatGPT session 未完成，尚未提交 CDK';
    }
    if (['success', 'skipped'].includes(redeemStatus)) {
      return '已有兑换成功记录';
    }
    if (
      getRedeemChannelFailureCount(row, 'upi') >= REDEEM_CHANNEL_FAILURE_LIMIT
      && getRedeemChannelFailureCount(row, 'ideal') >= REDEEM_CHANNEL_FAILURE_LIMIT
    ) {
      return `账号 UPI/IDEAL 兑换次数均已达 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次`;
    }
    return '当前不可兑换';
  }

  function isRedeemPlusDeletedEmail(email = '', channel = 'upi', deletedEmailSets = {}) {
    const normalizedEmail = normalizeEmail(email);
    const normalizedChannel = normalizeRedeemChannel(channel);
    return Boolean(normalizedEmail && deletedEmailSets?.[normalizedChannel]?.has(normalizedEmail));
  }

  function isRedeemPlusDeletedDisplayRow(row = {}, deletedEmailSets = {}) {
    if (normalizeText(row?.status).toLowerCase() !== 'paid') {
      return false;
    }
    const email = normalizeEmail(row.email);
    if (!email) {
      return false;
    }
    const rawChannel = normalizeText(row.redeemChannel || row.channel || row.paymentChannel);
    if (!rawChannel) {
      return Boolean(deletedEmailSets?.upi?.has(email) || deletedEmailSets?.ideal?.has(email));
    }
    return isRedeemPlusDeletedEmail(email, rawChannel, deletedEmailSets);
  }

  function summarizeRows(rows = [], options = {}) {
    const allRows = Array.isArray(rows) ? rows : [];
    const freeSectionRows = allRows.filter((row) => getMembershipGroup(row) === 'free');
    const allFreeRows = freeSectionRows.filter((row) => normalizeText(row.status).toLowerCase() === 'free');
    const failedRows = freeSectionRows.filter((row) => {
      const status = normalizeText(row.status).toLowerCase();
      const redeemStatus = normalizeText(row.redeemStatus).toLowerCase();
      return status === 'failed' || redeemStatus === 'failed';
    });
    const freeRows = allFreeRows.filter((row) => normalizeText(row.redeemStatus).toLowerCase() !== 'failed');
    const redeemableRows = allFreeRows.filter((row) => isRedeemableFreeRow(row, options));
    const redeemableUpiRows = allFreeRows.filter((row) => isRedeemableFreeRowForChannel(row, 'upi', options));
    const redeemableIdealRows = allFreeRows.filter((row) => isRedeemableFreeRowForChannel(row, 'ideal', options));
    const redeemablePixRows = allFreeRows.filter((row) => isRedeemableFreeRowForChannel(row, 'pix', options));
    return {
      total: allRows.length,
      freeSectionCount: freeSectionRows.length,
      freeCount: freeRows.length,
      failedCount: failedRows.length,
      missingAtCount: freeSectionRows.filter((row) => row.enabled !== false && !normalizeText(row.accessToken)).length,
      redeemableFreeCount: redeemableRows.length,
      redeemableUpiFreeCount: redeemableUpiRows.length,
      redeemableIdealFreeCount: redeemableIdealRows.length,
      redeemablePixFreeCount: redeemablePixRows.length,
      upiFailureBlockedFreeCount: getChannelFailureLimitBlockedRows(allFreeRows, 'upi', options).length,
      idealFailureBlockedFreeCount: getChannelFailureLimitBlockedRows(allFreeRows, 'ideal', options).length,
      pixFailureBlockedFreeCount: getChannelFailureLimitBlockedRows(allFreeRows, 'pix', options).length,
      upiDailyLimitBlockedFreeCount: allFreeRows.filter((row) => isRedeemChannelDailyLimitBlocked(row, 'upi', options)).length,
      idealDailyLimitBlockedFreeCount: allFreeRows.filter((row) => isRedeemChannelDailyLimitBlocked(row, 'ideal', options)).length,
      pixDailyLimitBlockedFreeCount: allFreeRows.filter((row) => isRedeemChannelDailyLimitBlocked(row, 'pix', options)).length,
      lockedRedeemCount: allFreeRows.filter(isRedeemLocked).length,
    };
  }

  const api = {
    REDEEM_CHANNEL_FAILURE_LIMIT,
    REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS,
    normalizeRedeemChannel,
    getMembershipGroup,
    getRedeemChannelFailureField,
    getRedeemChannelFailureCount,
    getRedeemChannelDailyLimitBlockedAtField,
    getRedeemChannelDailyLimitBlockedUntilField,
    getRedeemChannelDailyLimitReasonField,
    isRedeemChannelDailyLimitReason,
    isRedeemChannelDailyLimitBlocked,
    getFailureLimit,
    shouldApplyRedeemFailureLimitForChannel,
    isRedeemLocked,
    getRedeemLockReason,
    normalizeTrialEligibilityStatus,
    normalizeRedeemRemoteStatus,
    isTrialEligibilityChannelAllowed,
    isActiveRedeemRemoteStatus,
    isPreSubmitBlockedReason,
    isPreSubmitBlockedRow,
    hasLoginMaterial,
    isManualLoginRetryableRow,
    isDuplicateCdkeyPendingRow,
    isRedeemableFreeRowForChannel,
    isRedeemableFreeRow,
    isChannelFailureLimitReached,
    getChannelFailureLimitBlockedRows,
    getNotRedeemableReason,
    isRedeemPlusDeletedEmail,
    isRedeemPlusDeletedDisplayRow,
    summarizeRows,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelMembershipRowPolicy = api;
})(typeof window !== 'undefined' ? window : globalThis);
