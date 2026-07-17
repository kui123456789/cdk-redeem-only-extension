// sidepanel/account-records-trial-eligibility.js - Trial eligibility and redeemability helpers for account records.
(function attachSidepanelAccountRecordsTrialEligibility(globalScope) {
  function createAccountRecordsTrialEligibility(context = {}) {
    const membershipRowPolicy = context.membershipRowPolicy || {};
    const failureLimit = Math.max(1, Math.floor(Number(context.failureLimit) || 3));
    const normalizeEmail = typeof context.normalizeEmail === 'function'
      ? context.normalizeEmail
      : (value = '') => String(value || '').trim().toLowerCase();
    const normalizeText = typeof context.normalizeText === 'function'
      ? context.normalizeText
      : (value = '') => String(value || '').trim();
    const normalizeRedeemChannel = typeof context.normalizeRedeemChannel === 'function'
      ? context.normalizeRedeemChannel
      : (value = '') => {
        const normalized = normalizeText(value).toLowerCase();
        return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
      };
    const getRedeemChannelLabel = typeof context.getRedeemChannelLabel === 'function'
      ? context.getRedeemChannelLabel
      : (channel = '') => (normalizeRedeemChannel(channel) === 'ideal' ? 'IDEAL' : 'UPI');
    const getCheckResults = typeof context.getUpiCredentialMembershipCheckResults === 'function'
      ? context.getUpiCredentialMembershipCheckResults
      : () => ({});
    const buildDisplayRows = typeof context.buildUpiCredentialMembershipDisplayRows === 'function'
      ? context.buildUpiCredentialMembershipDisplayRows
      : (rows) => Array.isArray(rows) ? rows : [];

    function getTrialEligibilityApiHelpers() {
      const root = typeof window !== 'undefined' ? window : globalScope;
      return root?.MultiPageTrialEligibilityApi || {};
    }

    function normalizeTrialEligibilityStatus(value = '') {
      return membershipRowPolicy.normalizeTrialEligibilityStatus?.(value) || '';
    }

    function isTrialEligibilityChannelAllowed(row = {}, channel = 'upi') {
      const helper = getTrialEligibilityApiHelpers().isTrialEligibilityChannelAllowed;
      if (typeof helper === 'function') {
        return helper(row, channel);
      }
      return membershipRowPolicy.isTrialEligibilityChannelAllowed?.(row, channel) !== false;
    }

    function getTrialEligibilityChannelBlockedDetail(row = {}, channel = 'upi') {
      const redeemChannel = normalizeRedeemChannel(channel);
      if (isTrialEligibilityChannelAllowed(row, redeemChannel)) {
        return '';
      }
      const reasonField = redeemChannel === 'ideal'
        ? 'idealChannelEligibilityReason'
        : (redeemChannel === 'pix' ? 'pixChannelEligibilityReason' : 'upiChannelEligibilityReason');
      return normalizeText(row[reasonField]) || `${getRedeemChannelLabel(redeemChannel)} 渠道当前不可用`;
    }

    function normalizeTrialEligibilitySummaryItem(item = {}) {
      const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
      return {
        email: normalizeEmail(source.email),
        reason: String(source.reason || '').trim(),
        trialEligibilityStatus: normalizeTrialEligibilityStatus(source.trialEligibilityStatus),
      };
    }

    function buildUpiCredentialMembershipTrialEligibilitySummary(results = {}, rows = []) {
      const source = results?.trialEligibilitySummary && typeof results.trialEligibilitySummary === 'object'
        ? results.trialEligibilitySummary
        : {};
      const kept = Array.isArray(source.kept) ? source.kept.map(normalizeTrialEligibilitySummaryItem).filter((item) => item.email) : [];
      const skipped = Array.isArray(source.skipped) ? source.skipped.map(normalizeTrialEligibilitySummaryItem).filter((item) => item.email) : [];
      const failed = Array.isArray(source.failed) ? source.failed.map(normalizeTrialEligibilitySummaryItem).filter((item) => item.email) : [];
      const ineligibleEmails = Array.isArray(source.ineligibleEmails)
        ? source.ineligibleEmails.map(normalizeEmail).filter(Boolean)
        : [];
      const deletedEmails = Array.isArray(source.deletedEmails)
        ? source.deletedEmails.map(normalizeEmail).filter(Boolean)
        : [];
      failed.forEach((item) => {
        if (item.trialEligibilityStatus === 'ineligible' && item.email && !ineligibleEmails.includes(item.email)) {
          ineligibleEmails.push(item.email);
        }
      });
      const rowCounts = (Array.isArray(rows) ? rows : []).reduce((counts, row) => {
        const trialStatus = normalizeTrialEligibilityStatus(row?.trialEligibilityStatus);
        if (trialStatus === 'eligible') counts.eligible += 1;
        if (trialStatus === 'skipped') counts.skipped += 1;
        if (trialStatus === 'failed') counts.failed += 1;
        if (trialStatus === 'ineligible') counts.ineligible += 1;
        return counts;
      }, { eligible: 0, skipped: 0, failed: 0, ineligible: 0 });
      const hasStoredSummary = Boolean(
        source.checkedAt
        || kept.length
        || skipped.length
        || failed.length
        || deletedEmails.length
        || ineligibleEmails.length
      );
      const storedIneligibleCount = Math.max(0, Math.floor(Number(source.ineligibleCount) || ineligibleEmails.length || 0));
      return {
        checkedAt: String(source.checkedAt || '').trim(),
        eligibleCount: hasStoredSummary ? Math.max(0, Math.floor(Number(source.eligibleCount) || kept.length || 0)) : rowCounts.eligible,
        skippedCount: hasStoredSummary ? Math.max(0, Math.floor(Number(source.skippedCount) || skipped.length || 0)) : rowCounts.skipped,
        failedCount: hasStoredSummary ? Math.max(0, Math.floor(Number(source.failedCount) || failed.length || 0) - storedIneligibleCount) : rowCounts.failed,
        ineligibleCount: hasStoredSummary ? storedIneligibleCount : rowCounts.ineligible,
        deletedCount: hasStoredSummary ? Math.max(0, Math.floor(Number(source.deletedCount) || deletedEmails.length || 0)) : 0,
        deletedEmails,
        ineligibleEmails,
      };
    }

    function isRedeemableFreeUpiCredentialMembershipRowForChannel(row = {}, channel = 'upi') {
      return membershipRowPolicy.isRedeemableFreeRowForChannel?.(row, channel, {
        isTrialEligibilityChannelAllowed,
      }) === true;
    }

    function isRedeemableFreeUpiCredentialMembershipRow(row = {}) {
      return isRedeemableFreeUpiCredentialMembershipRowForChannel(row, 'upi')
        || isRedeemableFreeUpiCredentialMembershipRowForChannel(row, 'ideal');
    }

    function isUpiCredentialMembershipChannelFailureLimitReached(row = {}, channel = 'upi') {
      return membershipRowPolicy.isChannelFailureLimitReached?.(row, channel) === true;
    }

    function getChannelFailureLimitBlockedFreeRows(rows = [], channel = 'upi') {
      return membershipRowPolicy.getChannelFailureLimitBlockedRows?.(rows, channel, {
        isTrialEligibilityChannelAllowed,
      }) || [];
    }

    function buildNoRedeemableForChannelMessage(channel = 'upi') {
      const redeemChannel = normalizeRedeemChannel(channel);
      const results = getCheckResults();
      const allFreeRows = buildDisplayRows(results)
        .filter((row) => String(row.status || '').trim().toLowerCase() === 'free');
      const overallRedeemableCount = allFreeRows.filter(isRedeemableFreeUpiCredentialMembershipRow).length;
      const channelRedeemableCount = allFreeRows
        .filter((row) => isRedeemableFreeUpiCredentialMembershipRowForChannel(row, redeemChannel))
        .length;
      const failureBlockedCount = getChannelFailureLimitBlockedFreeRows(allFreeRows, redeemChannel).length;
      const label = getRedeemChannelLabel(redeemChannel);
      if (channelRedeemableCount > 0) {
        return '';
      }
      if (redeemChannel === 'ideal' && overallRedeemableCount > 0 && failureBlockedCount > 0) {
        return `${failureBlockedCount} 个 Free 账号 IDEAL 已失败满 ${failureLimit} 次并已封存，不会再参与兑换。`;
      }
      return `没有启用的 Free 账号可用 ${label} 兑换。`;
    }

    function getNotRedeemableFreeUpiCredentialMembershipReason(row = {}) {
      return membershipRowPolicy.getNotRedeemableReason?.(row) || '当前不可兑换';
    }

    return {
      buildNoRedeemableForChannelMessage,
      buildUpiCredentialMembershipTrialEligibilitySummary,
      getChannelFailureLimitBlockedFreeRows,
      getNotRedeemableFreeUpiCredentialMembershipReason,
      getTrialEligibilityChannelBlockedDetail,
      isRedeemableFreeUpiCredentialMembershipRow,
      isRedeemableFreeUpiCredentialMembershipRowForChannel,
      isTrialEligibilityChannelAllowed,
      isUpiCredentialMembershipChannelFailureLimitReached,
      normalizeTrialEligibilityStatus,
    };
  }

  const api = {
    createAccountRecordsTrialEligibility,
  };

  globalScope.SidepanelAccountRecordsTrialEligibility = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
