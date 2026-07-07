// sidepanel/account-records-membership-state-sync.js - Membership result deletion and redeem-success state sync helpers.
(function attachSidepanelAccountRecordsMembershipStateSync(globalScope) {
  function createAccountRecordsMembershipStateSync(context = {}) {
    const state = context.state || {};
    const membershipRowPolicy = context.membershipRowPolicy || {};
    const locallyDeletedMembershipEmails = context.locallyDeletedUpiCredentialMembershipEmails instanceof Set
      ? context.locallyDeletedUpiCredentialMembershipEmails
      : new Set();
    const locallyDeletedRedeemPlusEmailsByChannel = context.locallyDeletedRedeemPlusEmailsByChannel || {};
    const normalizeEmail = typeof context.normalizeEmail === 'function'
      ? context.normalizeEmail
      : (value = '') => String(value || '').trim().toLowerCase();
    const normalizeText = typeof context.normalizeText === 'function'
      ? context.normalizeText
      : (value = '') => String(value || '').trim();
    const normalizeTimestamp = typeof context.normalizeTimestamp === 'function'
      ? context.normalizeTimestamp
      : (value) => {
        const timestamp = Date.parse(String(value || ''));
        return Number.isFinite(timestamp) ? timestamp : 0;
      };
    const normalizeRedeemChannel = typeof context.normalizeRedeemChannel === 'function'
      ? context.normalizeRedeemChannel
      : (value = '') => (normalizeText(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi');
    const normalizePlanType = typeof context.normalizeSubscriptionPlanType === 'function'
      ? context.normalizeSubscriptionPlanType
      : (value = '') => normalizeText(value).toLowerCase();
    const isPaidPlan = typeof context.isPaidSubscriptionPlan === 'function'
      ? context.isPaidSubscriptionPlan
      : (planType) => ['plus', 'pro', 'team'].includes(normalizePlanType(planType));
    const isActiveRemoteStatus = typeof context.isActiveUpiRedeemRemoteStatus === 'function'
      ? context.isActiveUpiRedeemRemoteStatus
      : () => false;
    const normalizeEmailList = typeof context.normalizeUpiCredentialMembershipEmailList === 'function'
      ? context.normalizeUpiCredentialMembershipEmailList
      : (values = []) => Array.from(new Set((Array.isArray(values) ? values : []).map(normalizeEmail).filter(Boolean)));
    const buildDeletedEmailSetsFromValues = typeof context.buildRedeemPlusDeletedEmailSetsFromValues === 'function'
      ? context.buildRedeemPlusDeletedEmailSetsFromValues
      : (...values) => {
        const merged = { upi: [], ideal: [] };
        values.forEach((value) => {
          const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
          merged.upi.push(...normalizeEmailList(source.upi));
          merged.ideal.push(...normalizeEmailList(source.ideal));
        });
        return { upi: new Set(merged.upi), ideal: new Set(merged.ideal) };
      };
    const mergeDeletedEmailsByChannel = typeof context.mergeRedeemPlusDeletedEmailsByChannel === 'function'
      ? context.mergeRedeemPlusDeletedEmailsByChannel
      : (...values) => {
        const merged = { upi: [], ideal: [] };
        values.forEach((value) => {
          const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
          merged.upi.push(...normalizeEmailList(source.upi));
          merged.ideal.push(...normalizeEmailList(source.ideal));
        });
        return {
          upi: normalizeEmailList(merged.upi),
          ideal: normalizeEmailList(merged.ideal),
        };
      };
    const getUpiRedeemCdkeyUsage = typeof context.getUpiRedeemCdkeyUsage === 'function'
      ? context.getUpiRedeemCdkeyUsage
      : () => ({});
    const getUpiRedeemUsageEmail = typeof context.getUpiRedeemUsageEmail === 'function'
      ? context.getUpiRedeemUsageEmail
      : (entry = {}) => normalizeEmail(entry.email || entry.accountEmail || entry.account_email || '');
    const findActiveUsageEntryByEmail = typeof context.findActiveUpiRedeemCdkeyUsageEntryByEmail === 'function'
      ? context.findActiveUpiRedeemCdkeyUsageEntryByEmail
      : () => null;

    function getLatestState() {
      return typeof state.getLatestState === 'function' ? state.getLatestState() : {};
    }

    function getLocallyDeletedRedeemPlusEmailsByChannel() {
      return {
        upi: Array.from(locallyDeletedRedeemPlusEmailsByChannel.upi || []),
        ideal: Array.from(locallyDeletedRedeemPlusEmailsByChannel.ideal || []),
      };
    }

    function addLocallyDeletedRedeemPlusEmails(channel = 'upi', emails = []) {
      const normalizedChannel = normalizeRedeemChannel(channel);
      const target = locallyDeletedRedeemPlusEmailsByChannel[normalizedChannel]
        || locallyDeletedRedeemPlusEmailsByChannel.upi;
      if (!target || typeof target.add !== 'function') {
        return;
      }
      normalizeEmailList(Array.isArray(emails) ? emails : [emails]).forEach((email) => target.add(email));
    }

    function clearLocallyDeletedRedeemPlusEmailsByChannel() {
      Object.values(locallyDeletedRedeemPlusEmailsByChannel).forEach((emails) => {
        if (emails && typeof emails.clear === 'function') {
          emails.clear();
        }
      });
    }

    function getLocallyDeletedUpiCredentialMembershipEmails() {
      return Array.from(locallyDeletedMembershipEmails);
    }

    function addLocallyDeletedUpiCredentialMembershipEmail(email = '') {
      const normalized = normalizeEmail(email);
      if (normalized) {
        locallyDeletedMembershipEmails.add(normalized);
      }
    }

    function deleteLocallyDeletedUpiCredentialMembershipEmail(email = '') {
      locallyDeletedMembershipEmails.delete(normalizeEmail(email));
    }

    function clearLocallyDeletedUpiCredentialMembershipEmails() {
      locallyDeletedMembershipEmails.clear();
    }

    function buildRedeemPlusDeletedEmailSets(value = {}) {
      return buildDeletedEmailSetsFromValues(value, getLocallyDeletedRedeemPlusEmailsByChannel());
    }

    function isRedeemPlusDeletedEmail(email = '', channel = 'upi', deletedEmailSets = {}) {
      return membershipRowPolicy.isRedeemPlusDeletedEmail?.(email, channel, deletedEmailSets) === true;
    }

    function isRedeemPlusDeletedDisplayRow(row = {}, deletedEmailSets = {}) {
      return membershipRowPolicy.isRedeemPlusDeletedDisplayRow?.(row, deletedEmailSets) === true;
    }

    function isActiveUpiCredentialMembershipRedeemRow(row = {}, results = getUpiCredentialMembershipCheckResults()) {
      const source = row && typeof row === 'object' && !Array.isArray(row) ? row : {};
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
      ].some((status) => isActiveRemoteStatus(status));
    }

    function isActiveUpiCredentialMembershipRedeemRowOrUsage(row = {}, results = getUpiCredentialMembershipCheckResults()) {
      if (isActiveUpiCredentialMembershipRedeemRow(row, results)) {
        return true;
      }
      return Boolean(findActiveUsageEntryByEmail(row?.email, getLatestState(), row?.redeemChannel || row?.channel));
    }

    function isVerifiedPaidUpiRedeemUsageEntry(entry = {}) {
      if (entry?.subscriptionActive !== true) {
        return false;
      }
      const planType = normalizePlanType(entry.subscriptionPlanType || entry.subscription_plan_type || '');
      return !planType || isPaidPlan(planType);
    }

    function getUpiRedeemSuccessCheckedAt(entry = {}) {
      const timestamp = Math.max(
        0,
        Number(entry.subscriptionCheckedAt) || 0,
        Number(entry.remoteCheckedAt) || 0,
        Number(entry.usedAt) || 0,
        Number(entry.lastAttemptAt) || 0
      );
      if (!timestamp) {
        return '';
      }
      const date = new Date(timestamp);
      return Number.isNaN(date.getTime()) ? '' : date.toISOString();
    }

    function getUpiRedeemSuccessPlanType(entry = {}) {
      const planType = normalizePlanType(entry.subscriptionPlanType || entry.subscription_plan_type || '');
      return isPaidPlan(planType) ? planType : 'plus';
    }

    function buildUpiRedeemSuccessMembershipLookup(currentState = getLatestState()) {
      const byCdkey = {};
      const byEmail = {};
      const plusDeletedEmailSets = buildRedeemPlusDeletedEmailSets(
        currentState?.upiCredentialMembershipCheckResults?.redeemPlusDeletedEmailsByChannel
      );
      ['upi', 'ideal'].forEach((channel) => {
        const usage = getUpiRedeemCdkeyUsage(currentState, channel);
        Object.entries(usage).forEach(([rawCdkey, entry]) => {
          const cdkey = String(rawCdkey || '').trim();
          if (!cdkey || !isVerifiedPaidUpiRedeemUsageEntry(entry)) {
            return;
          }
          const email = getUpiRedeemUsageEmail(entry);
          if (!email || isRedeemPlusDeletedEmail(email, channel, plusDeletedEmailSets)) {
            return;
          }
          const patch = {
            email,
            status: 'paid',
            planType: getUpiRedeemSuccessPlanType(entry),
            reason: entry.subscriptionReason || entry.remoteMessage || 'CDK 已确认兑换成功',
            upiRedeemCdkey: cdkey,
            redeemChannel: channel,
            upiRedeemSubscriptionCheckedAt: getUpiRedeemSuccessCheckedAt(entry),
          };
          byCdkey[`${channel}:${cdkey.toLowerCase()}`] = patch;
          if (channel === 'upi') {
            byCdkey[cdkey.toLowerCase()] = patch;
          }
          byEmail[`${channel}:${email}`] = patch;
          if (!byEmail[email]) {
            byEmail[email] = patch;
          }
        });
      });
      return { byCdkey, byEmail, plusDeletedEmailSets };
    }

    function shouldKeepCheckedFreeMembershipResult(row = {}, patch = {}) {
      if (String(row.status || '').trim().toLowerCase() !== 'free') {
        return false;
      }
      const patchCheckedAt = normalizeTimestamp(patch.upiRedeemSubscriptionCheckedAt);
      if (String(row.membershipOverrideStatus || '').trim().toLowerCase() === 'free') {
        const overrideCheckedAt = normalizeTimestamp(row.membershipOverrideCheckedAt || row.checkedAt);
        return !patchCheckedAt || !overrideCheckedAt || overrideCheckedAt >= patchCheckedAt;
      }
      const rowCheckedAt = normalizeTimestamp(row.checkedAt);
      if (!rowCheckedAt) {
        return false;
      }
      return !patchCheckedAt || rowCheckedAt >= patchCheckedAt;
    }

    function applyUpiRedeemSuccessMembershipPatch(row = {}, lookup = buildUpiRedeemSuccessMembershipLookup()) {
      const email = normalizeEmail(row.email);
      const cdkey = String(row.upiRedeemCdkey || row.cdkey || '').trim().toLowerCase();
      const rawChannel = normalizeText(row.redeemChannel || row.channel);
      const channel = normalizeRedeemChannel(rawChannel);
      const patch = (cdkey && (lookup.byCdkey?.[`${channel}:${cdkey}`] || lookup.byCdkey?.[cdkey]))
        || (email && rawChannel && lookup.byEmail?.[`${channel}:${email}`])
        || (email && !rawChannel && lookup.byEmail?.[email])
        || null;
      if (!patch) {
        return row;
      }
      const patchChannel = normalizeRedeemChannel(patch.redeemChannel || row.redeemChannel || row.channel);
      if (isRedeemPlusDeletedEmail(email, patchChannel, lookup.plusDeletedEmailSets)) {
        return row;
      }
      if (shouldKeepCheckedFreeMembershipResult(row, patch)) {
        return row;
      }
      return {
        ...row,
        ...patch,
        redeemStatus: row.redeemStatus === 'success' ? row.redeemStatus : 'success',
        redeemReason: row.redeemReason || patch.reason,
        checkedAt: patch.upiRedeemSubscriptionCheckedAt || row.checkedAt,
        redeemSuccessAt: row.redeemSuccessAt || patch.upiRedeemSubscriptionCheckedAt,
        membershipOverrideStatus: '',
        membershipOverrideCheckedAt: '',
      };
    }

    function buildFreeMembershipOverridePatch(checkedAt = new Date().toISOString()) {
      const timestamp = String(checkedAt || '').trim() || new Date().toISOString();
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

    function mergeManualFreeMembershipOverridesIntoResults(results = {}, currentState = getLatestState()) {
      const previousResults = currentState?.upiCredentialMembershipCheckResults || {};
      const mergedPlusDeletedEmailsByChannel = mergeDeletedEmailsByChannel(
        previousResults.redeemPlusDeletedEmailsByChannel,
        results?.redeemPlusDeletedEmailsByChannel,
        getLocallyDeletedRedeemPlusEmailsByChannel()
      );
      const resultsWithDeletionState = {
        ...results,
        redeemPlusDeletedEmailsByChannel: mergedPlusDeletedEmailsByChannel,
        redeemPlusDeletedCountByChannel: {
          upi: mergedPlusDeletedEmailsByChannel.upi.length,
          ideal: mergedPlusDeletedEmailsByChannel.ideal.length,
        },
      };
      const deletedEmailSet = new Set([
        ...(Array.isArray(previousResults.redeemAutoDeletedEmails) ? previousResults.redeemAutoDeletedEmails : []),
        ...(Array.isArray(resultsWithDeletionState?.redeemAutoDeletedEmails) ? resultsWithDeletionState.redeemAutoDeletedEmails : []),
        ...locallyDeletedMembershipEmails,
      ].map(normalizeEmail).filter(Boolean));
      const overrides = {};
      (Array.isArray(previousResults.items) ? previousResults.items : []).forEach((row) => {
        const email = normalizeEmail(row?.email);
        if (
          !email
          || deletedEmailSet.has(email)
          || String(row?.membershipOverrideStatus || '').trim().toLowerCase() !== 'free'
        ) {
          return;
        }
        overrides[email] = row;
      });
      if (!Object.keys(overrides).length || !Array.isArray(resultsWithDeletionState?.items)) {
        return resultsWithDeletionState;
      }
      let changed = false;
      const items = resultsWithDeletionState.items.map((item) => {
        const email = normalizeEmail(item?.email);
        const override = email ? overrides[email] : null;
        if (!override || deletedEmailSet.has(email)) {
          return item;
        }
        const itemStatus = String(item.status || '').trim().toLowerCase();
        const itemCheckedAt = normalizeTimestamp(item.checkedAt);
        const overrideCheckedAt = normalizeTimestamp(override.membershipOverrideCheckedAt || override.checkedAt);
        if (itemStatus === 'paid' && itemCheckedAt > overrideCheckedAt) {
          return {
            ...item,
            membershipOverrideStatus: '',
            membershipOverrideCheckedAt: '',
          };
        }
        const redeemStatus = String(item.redeemStatus || '').trim().toLowerCase();
        changed = true;
        return {
          ...item,
          ...buildFreeMembershipOverridePatch(override.membershipOverrideCheckedAt || override.checkedAt || item.checkedAt),
          checkedAt: override.checkedAt || item.checkedAt,
          reason: override.reason || item.reason || '单账号检测确认当前无会员',
          redeemStatus: ['success', 'skipped'].includes(redeemStatus) ? '' : item.redeemStatus,
          redeemReason: ['success', 'skipped'].includes(redeemStatus) ? '' : item.redeemReason,
        };
      });
      return changed ? { ...resultsWithDeletionState, items } : resultsWithDeletionState;
    }

    function getUpiCredentialMembershipCheckResults(currentState = getLatestState()) {
      const raw = currentState?.upiCredentialMembershipCheckResults || {};
      const rawDeletedEmails = (Array.isArray(raw.redeemAutoDeletedEmails) ? raw.redeemAutoDeletedEmails : [])
        .map(normalizeEmail)
        .filter(Boolean);
      const rawDeletedEmailSet = new Set(rawDeletedEmails);
      if (locallyDeletedMembershipEmails.size) {
        const restoredEmailSet = new Set((Array.isArray(raw.items) ? raw.items : [])
          .filter((item) => {
            const status = String(item?.status || '').trim().toLowerCase();
            return status === 'free' || status === 'failed';
          })
          .map((item) => normalizeEmail(item?.email))
          .filter((email) => email && !rawDeletedEmailSet.has(email)));
        restoredEmailSet.forEach((email) => locallyDeletedMembershipEmails.delete(email));
      }
      const deletedEmailSet = new Set([
        ...rawDeletedEmails,
        ...locallyDeletedMembershipEmails,
      ]);
      const redeemPlusDeletedEmailsByChannel = mergeDeletedEmailsByChannel(
        raw.redeemPlusDeletedEmailsByChannel,
        getLocallyDeletedRedeemPlusEmailsByChannel()
      );
      const plusDeletedEmailSets = buildRedeemPlusDeletedEmailSets(redeemPlusDeletedEmailsByChannel);
      const successLookup = buildUpiRedeemSuccessMembershipLookup(currentState);
      const items = (Array.isArray(raw.items) ? raw.items : [])
        .filter((item) => !deletedEmailSet.has(normalizeEmail(item?.email)))
        .map((item) => applyUpiRedeemSuccessMembershipPatch(item, successLookup))
        .filter((item) => !isRedeemPlusDeletedDisplayRow(item, plusDeletedEmailSets));
      const stoppedAt = String(raw.stoppedAt || '').trim();
      const redeemStoppedAt = String(raw.redeemStoppedAt || '').trim();
      return {
        items,
        running: raw.running === true && !stoppedAt,
        redeeming: raw.redeeming === true && !redeemStoppedAt,
        source: String(raw.source || '').trim(),
        total: Math.max(0, Math.floor(Number(raw.total) || items.length || 0)),
        completed: Math.max(0, Math.floor(Number(raw.completed) || items.length || 0)),
        redeemTotal: Math.max(0, Math.floor(Number(raw.redeemTotal) || 0)),
        redeemCompleted: Math.max(0, Math.floor(Number(raw.redeemCompleted) || 0)),
        flowStage: String(raw.flowStage || '').trim().toLowerCase(),
        flowStageEmail: normalizeEmail(raw.flowStageEmail || ''),
        flowMode: String(raw.flowMode || '').trim().toLowerCase(),
        paidCount: items.filter((item) => item?.status === 'paid').length,
        freeCount: items.filter((item) => item?.status === 'free').length,
        failedCount: items.filter((item) => item?.status === 'failed').length,
        updatedAt: String(raw.updatedAt || '').trim(),
        stoppedAt,
        redeemStoppedAt,
        redeemAutoDeletedEmails: Array.from(deletedEmailSet),
        redeemAutoDeletedCount: deletedEmailSet.size,
        redeemPlusDeletedEmailsByChannel,
        redeemPlusDeletedCountByChannel: {
          upi: redeemPlusDeletedEmailsByChannel.upi.length,
          ideal: redeemPlusDeletedEmailsByChannel.ideal.length,
        },
      };
    }

    return {
      addLocallyDeletedRedeemPlusEmails,
      addLocallyDeletedUpiCredentialMembershipEmail,
      applyUpiRedeemSuccessMembershipPatch,
      buildFreeMembershipOverridePatch,
      buildRedeemPlusDeletedEmailSets,
      buildUpiRedeemSuccessMembershipLookup,
      clearLocallyDeletedRedeemPlusEmailsByChannel,
      clearLocallyDeletedUpiCredentialMembershipEmails,
      deleteLocallyDeletedUpiCredentialMembershipEmail,
      getLocallyDeletedRedeemPlusEmailsByChannel,
      getLocallyDeletedUpiCredentialMembershipEmails,
      getUpiCredentialMembershipCheckResults,
      isActiveUpiCredentialMembershipRedeemRow,
      isActiveUpiCredentialMembershipRedeemRowOrUsage,
      isRedeemPlusDeletedDisplayRow,
      isRedeemPlusDeletedEmail,
      mergeManualFreeMembershipOverridesIntoResults,
    };
  }

  const api = {
    createAccountRecordsMembershipStateSync,
  };

  globalScope.SidepanelAccountRecordsMembershipStateSync = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
