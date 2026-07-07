(function attachSidepanelAccountRecordsManager(globalScope) {
  function createAccountRecordsManager(context = {}) {
    const {
      state,
      dom,
      helpers,
      runtime,
      constants = {},
    } = context;

    const root = typeof window !== 'undefined' ? window : globalScope;
    const displayTimeZone = constants.displayTimeZone || 'Asia/Shanghai';
    const pageSize = Math.max(1, Math.floor(Number(constants.pageSize) || 10));
    const accountRecordsViewModel = globalScope.SidepanelAccountRecordsViewModel || {};
    const membershipViewModel = globalScope.SidepanelMembershipViewModel || {};
    const membershipRowPolicy = globalScope.SidepanelMembershipRowPolicy || {};
    const membershipRenderer = globalScope.SidepanelMembershipRenderer || {};
    const REDEEM_CHANNEL_FAILURE_LIMIT = 3;
    const REDEEM_CHANNEL_DAILY_LIMIT_BLOCK_MS = 24 * 60 * 60 * 1000;
    const membershipRedeemProgress = globalScope.SidepanelMembershipRedeemProgress || {};
    if (
      typeof membershipRedeemProgress.clampRedeemProgressPercent !== 'function'
      || typeof membershipRedeemProgress.getUpiCredentialMembershipRedeemProgressMeta !== 'function'
      || typeof membershipRedeemProgress.renderUpiCredentialMembershipRedeemProgress !== 'function'
    ) {
      throw new Error('Membership redeem progress module is not loaded.');
    }
    const accountRecordsExport = globalScope.SidepanelAccountRecordsExport || {};
    if (typeof accountRecordsExport.createAccountRecordsExportHelpers !== 'function') {
      throw new Error('Account records export module is not loaded.');
    }
    const {
      buildRecordId,
      getRecordDisplayStatus,
      getRecordExportUrl,
      getRecordTotpMfaSecret,
      getRecordGptPassword,
      sanitizeExportField,
      isUpiRedeemSuccessRecord,
      getRecordUpiRedeemCdkey,
      getRecordUpiRedeemAccessToken,
    } = accountRecordsExport.createAccountRecordsExportHelpers({
      accountRecordsViewModel,
    });
    const accountRecordsSubscription = globalScope.SidepanelAccountRecordsSubscription || {};
    if (typeof accountRecordsSubscription.createAccountRecordsSubscriptionHelpers !== 'function') {
      throw new Error('Account records subscription module is not loaded.');
    }
    const {
      normalizeSubscriptionPlanType,
      isPaidSubscriptionPlan,
      getRecordSubscriptionPlanType,
      buildSubscriptionCheckId,
      buildSubscriptionResultLookup,
      isRecordPaidSubscription,
      getConfirmedUpiSubscriptionLabel,
    } = accountRecordsSubscription.createAccountRecordsSubscriptionHelpers({
      buildRecordId,
      getRecordEmail: (record) => getRecordEmail(record),
      getRecordUpiRedeemCdkey,
    });
    const accountRecordsMembershipGroups = globalScope.SidepanelAccountRecordsMembershipGroups || {};
    if (typeof accountRecordsMembershipGroups.createAccountRecordsMembershipGroupHelpers !== 'function') {
      throw new Error('Account records membership groups module is not loaded.');
    }
    const {
      getMembershipViewModelGroup,
      getUpiCredentialMembershipUiGroup,
      buildMembershipViewModelRows,
      summarizeMembershipViewModelRows,
      buildUpiCredentialMembershipDisplayRowKey,
    } = accountRecordsMembershipGroups.createAccountRecordsMembershipGroupHelpers({
      membershipViewModel,
      membershipRowPolicy,
      normalizeEmail: (value) => normalizeUpiCredentialMembershipEmail(value),
      normalizeText: (value) => normalizeUpiCredentialMembershipText(value),
      normalizeRedeemChannel: (value) => normalizeRedeemChannel(value),
    });
    const accountRecordsRedeemStatus = globalScope.SidepanelAccountRecordsRedeemStatus || {};
    if (typeof accountRecordsRedeemStatus.createAccountRecordsRedeemStatusHelpers !== 'function') {
      throw new Error('Account records redeem status module is not loaded.');
    }
    const {
      normalizeUpiRedeemRemoteStatus,
      isActiveUpiRedeemRemoteStatus,
      normalizeUpiCredentialMembershipCapabilityFlag,
      getRedeemChannelLabel,
    } = accountRecordsRedeemStatus.createAccountRecordsRedeemStatusHelpers({
      normalizeRedeemChannel: (value) => normalizeRedeemChannel(value),
    });
    const accountRecordsCdkPoolText = globalScope.SidepanelAccountRecordsCdkPoolText || {};
    if (typeof accountRecordsCdkPoolText.createAccountRecordsCdkPoolTextHelpers !== 'function') {
      throw new Error('Account records CDK pool text module is not loaded.');
    }
    const {
      getUpiRedeemCdkeyUsage,
      getStoredCdkPoolText,
      parseUpiRedeemCdkeyPoolText,
    } = accountRecordsCdkPoolText.createAccountRecordsCdkPoolTextHelpers({
      normalizeRedeemChannel: (value) => normalizeRedeemChannel(value),
    });
    const accountRecordsDeletionState = globalScope.SidepanelAccountRecordsDeletionState || {};
    if (typeof accountRecordsDeletionState.createAccountRecordsDeletionStateHelpers !== 'function') {
      throw new Error('Account records deletion state module is not loaded.');
    }
    const {
      normalizeUpiCredentialMembershipEmailList,
      normalizeRedeemPlusDeletedEmailsByChannel,
      mergeRedeemPlusDeletedEmailsByChannel,
      buildRedeemPlusDeletedEmailSets: buildRedeemPlusDeletedEmailSetsFromValues,
    } = accountRecordsDeletionState.createAccountRecordsDeletionStateHelpers({
      normalizeEmail: (value) => normalizeUpiCredentialMembershipEmail(value),
    });
    const accountRecordsExportBuilders = globalScope.SidepanelAccountRecordsExportBuilders || {};
    if (typeof accountRecordsExportBuilders.createAccountRecordsExportBuilders !== 'function') {
      throw new Error('Account records export builders module is not loaded.');
    }
    const {
      buildUpiRedeemSuccessEmailExportRows,
      summarizeUpiRedeemSuccessExportEligibility,
      buildUpiRedeemSuccessExportBlockedMessage,
      getUpiRedeemSuccessExportSubscriptionItems,
      getUpiRedeemSuccessExportCdkeys,
      buildUpiRedeemSuccessEmailExportFileName,
    } = accountRecordsExportBuilders.createAccountRecordsExportBuilders({
      buildSubscriptionCheckId,
      getRecordEmail: (record) => getRecordEmail(record),
      getRecordGptPassword,
      getRecordTotpMfaSecret,
      getRecordUpiRedeemAccessToken,
      getRecordUpiRedeemCdkey,
      isRecordPaidSubscription,
      isRemoteRedeemSuccess: (cdkey, usage) => isRemoteRedeemSuccess(cdkey, usage),
      isUpiRedeemSuccessRecord,
      sanitizeExportField,
    });
    const accountRecordsRedeemPolicy = globalScope.SidepanelAccountRecordsRedeemPolicy || {};
    if (typeof accountRecordsRedeemPolicy.createAccountRecordsRedeemPolicy !== 'function') {
      throw new Error('Account records redeem policy module is not loaded.');
    }
    const {
      getRedeemChannelFailureField,
      getRedeemChannelFailureCount,
      getRedeemChannelDailyLimitBlockedAtField,
      getRedeemChannelDailyLimitBlockedUntilField,
      getRedeemChannelDailyLimitReasonField,
      isRedeemChannelDailyLimitReason,
      isRedeemChannelDailyLimitBlocked,
      isUpiCredentialMembershipRedeemLocked,
      getUpiCredentialMembershipRedeemLockReason,
      getUpiCredentialMembershipFailureLimit,
      shouldApplyRedeemFailureLimitForChannel,
      isPreSubmitUpiCredentialMembershipBlockedReason,
      isPreSubmitUpiCredentialMembershipBlockedRow,
      hasUpiCredentialMembershipLoginMaterial,
      isManualLoginRetryableUpiCredentialMembershipRow,
      isDuplicateCdkeyPendingMembershipRow,
    } = accountRecordsRedeemPolicy.createAccountRecordsRedeemPolicy({
      failureLimit: REDEEM_CHANNEL_FAILURE_LIMIT,
      getRedeemChannelStateHelpers: () => getRedeemChannelStateHelpers(),
      membershipRowPolicy,
      normalizeRedeemChannel: (value) => normalizeRedeemChannel(value),
    });

    function getRedeemChannelStateHelpers() {
      const rootScope = typeof window !== 'undefined' ? window : globalThis;
      return rootScope.MultiPageRedeemChannelState || {};
    }

    function getMembershipCredentialFormatHelpers() {
      const helpers = root.MultiPageMembershipCredentialFormat;
      if (!helpers || typeof helpers.parseCredentialLine !== 'function') {
        throw new Error('Membership credential format module is not loaded.');
      }
      return helpers;
    }

    const accountRecordsCredentialParser = globalScope.SidepanelAccountRecordsCredentialParser || {};
    if (typeof accountRecordsCredentialParser.createAccountRecordsCredentialParser !== 'function') {
      throw new Error('Account records credential parser module is not loaded.');
    }
    const {
      parseUpiCredentialMembershipText,
      normalizeUpiCredentialMembershipCredential,
      parseUpiCredentialMembershipParts,
      normalizeUpiCredentialMembershipTotpSecret,
      parseUpiCredentialMembershipPasskeyMarker,
    } = accountRecordsCredentialParser.createAccountRecordsCredentialParser({
      normalizeEmail: (value) => normalizeUpiCredentialMembershipEmail(value),
      normalizeText: (value) => normalizeUpiCredentialMembershipText(value),
      getMembershipCredentialFormatHelpers,
    });
    const accountRecordsDisplayModel = globalScope.SidepanelAccountRecordsDisplayModel || {};
    if (typeof accountRecordsDisplayModel.createAccountRecordsDisplayModel !== 'function') {
      throw new Error('Account records display model module is not loaded.');
    }
    const accountRecordsStatusMeta = globalScope.SidepanelAccountRecordsStatusMeta || {};
    if (typeof accountRecordsStatusMeta.createAccountRecordsStatusMeta !== 'function') {
      throw new Error('Account records status meta module is not loaded.');
    }
    const accountRecordsFlowView = globalScope.SidepanelAccountRecordsFlowView || {};
    if (typeof accountRecordsFlowView.createAccountRecordsFlowView !== 'function') {
      throw new Error('Account records flow view module is not loaded.');
    }
    const accountRecordsRenderer = globalScope.SidepanelAccountRecordsRenderer || {};
    if (typeof accountRecordsRenderer.createAccountRecordsRenderer !== 'function') {
      throw new Error('Account records renderer module is not loaded.');
    }
    const accountRecordsMembershipActions = globalScope.SidepanelAccountRecordsMembershipActions || {};
    if (typeof accountRecordsMembershipActions.createAccountRecordsMembershipActions !== 'function') {
      throw new Error('Account records membership actions module is not loaded.');
    }
    const accountRecordsRedeemActions = globalScope.SidepanelAccountRecordsRedeemActions || {};
    if (typeof accountRecordsRedeemActions.createAccountRecordsRedeemActions !== 'function') {
      throw new Error('Account records redeem actions module is not loaded.');
    }
    const accountRecordsMembershipHelpers = globalScope.SidepanelAccountRecordsMembershipHelpers || {};
    if (typeof accountRecordsMembershipHelpers.createAccountRecordsMembershipHelpers !== 'function') {
      throw new Error('Account records membership helpers module is not loaded.');
    }
    const accountRecordsMembershipPoolOps = globalScope.SidepanelAccountRecordsMembershipPoolOps || {};
    if (typeof accountRecordsMembershipPoolOps.createAccountRecordsMembershipPoolOps !== 'function') {
      throw new Error('Account records membership pool ops module is not loaded.');
    }
    const accountRecordsMembershipResultOps = globalScope.SidepanelAccountRecordsMembershipResultOps || {};
    if (typeof accountRecordsMembershipResultOps.createAccountRecordsMembershipResultOps !== 'function') {
      throw new Error('Account records membership result ops module is not loaded.');
    }
    const accountRecordsPanelEvents = globalScope.SidepanelAccountRecordsPanelEvents || {};
    if (typeof accountRecordsPanelEvents.createAccountRecordsPanelEvents !== 'function') {
      throw new Error('Account records panel events module is not loaded.');
    }
    const {
      buildUpiCredentialMembershipResultLookup,
      sanitizeUpiCredentialMembershipDisplayRow,
      mergeUpiCredentialMembershipDisplayCredentialResult,
      buildUpiCredentialMembershipDisplayRows,
      getUpiCredentialMembershipRowStatusMeta,
    } = accountRecordsDisplayModel.createAccountRecordsDisplayModel({
      normalizeEmail: (value) => normalizeUpiCredentialMembershipEmail(value),
      normalizeText: (value) => normalizeUpiCredentialMembershipText(value),
      createAccountRecordsStatusMeta: (displayContext) => accountRecordsStatusMeta.createAccountRecordsStatusMeta(displayContext),
      getMembershipCredentialFormatHelpers,
      collectPasskeyNumericMetadataPatch: (...sources) => collectUpiCredentialMembershipPasskeyNumericMetadataPatch(...sources),
      getUpiCredentialMembershipCheckResults: (currentState) => getUpiCredentialMembershipCheckResults(currentState),
      buildRedeemPlusDeletedEmailSets: (value) => buildRedeemPlusDeletedEmailSets(value),
      buildUpiRedeemSuccessMembershipLookup: (currentState) => buildUpiRedeemSuccessMembershipLookup(currentState),
      getLatestState: () => state.getLatestState(),
      getUpiCredentialMembershipPoolRows: () => upiCredentialMembershipPoolRows,
      getUpiCredentialMembershipPoolSource: () => upiCredentialMembershipPoolSource,
      isUpiCredentialMembershipEmailDisabled: (email) => disabledUpiCredentialMembershipEmails.has(email),
      getLocallyDeletedUpiCredentialMembershipEmails: () => Array.from(locallyDeletedUpiCredentialMembershipEmails),
      applyUpiRedeemSuccessMembershipPatch: (row, lookup) => applyUpiRedeemSuccessMembershipPatch(row, lookup),
      buildMembershipViewModelRows,
      buildUpiCredentialMembershipDisplayRowKey,
      isRedeemPlusDeletedDisplayRow: (row, deletedEmailSets) => isRedeemPlusDeletedDisplayRow(row, deletedEmailSets),
      getUpiCredentialMembershipFlowTitle: (stepKey, results) => getUpiCredentialMembershipFlowTitle(stepKey, results),
      getMembershipPlanLabel: (planType) => getMembershipPlanLabel(planType),
      normalizeTrialEligibilityStatus: (value) => normalizeTrialEligibilityStatus(value),
      getRedeemChannelFailureCount: (row, channel) => getRedeemChannelFailureCount(row, channel),
      isUpiCredentialMembershipRedeemLocked: (row) => isUpiCredentialMembershipRedeemLocked(row),
      getUpiCredentialMembershipRedeemLockReason: (row) => getUpiCredentialMembershipRedeemLockReason(row),
      isDuplicateCdkeyPendingMembershipRow: (row) => isDuplicateCdkeyPendingMembershipRow(row),
      isActiveUpiRedeemRemoteStatus: (value) => isActiveUpiRedeemRemoteStatus(value),
      getUpiCredentialMembershipFailureLimit: (row) => getUpiCredentialMembershipFailureLimit(row),
      normalizeRedeemChannel: (value) => normalizeRedeemChannel(value),
      getRedeemChannelLabel: (value) => getRedeemChannelLabel(value),
      isPreSubmitUpiCredentialMembershipBlockedRow: (row) => isPreSubmitUpiCredentialMembershipBlockedRow(row),
      isManualLoginRetryableUpiCredentialMembershipRow: (row) => isManualLoginRetryableUpiCredentialMembershipRow(row),
      getTrialEligibilityChannelBlockedDetail: (row, channel) => getTrialEligibilityChannelBlockedDetail(row, channel),
      compactMembershipReason: (value, maxLength) => compactMembershipReason(value, maxLength),
      getUpiCredentialMembershipCheckingEmail: () => upiCredentialMembershipCheckingEmail,
      getUpiCredentialMembershipLoginEmail: () => upiCredentialMembershipLoginEmail,
      getUpiCredentialMembershipRedeemProgressMeta: (row, results) => getUpiCredentialMembershipRedeemProgressMeta(row, results),
    });

    const FILTER_CONFIG = {
      all: {
        label: '总',
        className: '',
        matches: () => true,
        metaLabel: '全部',
      },
      success: {
        label: '成',
        className: 'is-success',
        matches: (record) => matchesRecordFilter(record, 'success'),
        metaLabel: '成功',
      },
      running: {
        label: '运行',
        className: 'is-running',
        matches: (record) => matchesRecordFilter(record, 'running'),
        metaLabel: '运行中',
      },
      failed: {
        label: '失',
        className: 'is-failed',
        matches: (record) => matchesRecordFilter(record, 'failed'),
        metaLabel: '失败',
      },
      stopped: {
        label: '停',
        className: 'is-stopped',
        matches: (record) => matchesRecordFilter(record, 'stopped'),
        metaLabel: '停止',
      },
      retry: {
        label: '重试',
        className: 'is-retry',
        matches: (record) => matchesRecordFilter(record, 'retry'),
        metaLabel: '重试',
      },
    };

    let currentPage = 1;
    let activeFilter = 'all';
    let selectionMode = false;
    let eventsBound = false;
    let upiCredentialBackupPreviewVisible = false;
    let upiCredentialMembershipCheckBusy = false;
    let upiCredentialMembershipRedeemBusy = false;
    let upiCredentialMembershipAllRedeemBusy = false;
    let upiCredentialMembershipPoolRows = [];
    let upiCredentialMembershipPoolSource = '';
    let upiCredentialMembershipPoolLoaded = false;
    let upiCredentialMembershipPoolLoading = false;
    let upiCredentialMembershipCheckingEmail = '';
    let upiCredentialMembershipLoginEmail = '';
    let upiCredentialMembershipRedeemStatusRefreshBusy = false;
    let upiCredentialMembershipGroup = 'free';
    const disabledUpiCredentialMembershipEmails = new Set();
    const locallyDeletedUpiCredentialMembershipEmails = new Set();
    const locallyDeletedRedeemPlusEmailsByChannel = {
      upi: new Set(),
      ideal: new Set(),
    };
    const selectedRecordIds = new Set();

    function escapeHtml(value) {
      if (typeof helpers.escapeHtml === 'function') {
        return helpers.escapeHtml(String(value || ''));
      }
      return String(value || '');
    }

    function normalizeTimestamp(value) {
      const timestamp = Date.parse(String(value || ''));
      return Number.isFinite(timestamp) ? timestamp : 0;
    }

    function normalizeRetryCount(value) {
      const count = Math.floor(Number(value) || 0);
      return count > 0 ? count : 0;
    }

    function normalizeUpiRedeemConfiguredRoundCount(value, fallback = 3) {
      const fallbackNumber = Math.floor(Number(fallback));
      const fallbackCount = Number.isFinite(fallbackNumber)
        ? Math.max(0, Math.min(20, fallbackNumber))
        : 3;
      const rawValue = String(value ?? '').trim();
      if (!rawValue) {
        return fallbackCount;
      }
      const count = Math.floor(Number(rawValue));
      if (!Number.isFinite(count)) {
        return fallbackCount;
      }
      return Math.max(0, Math.min(20, count));
    }

    function normalizeUpiRedeemTotalRoundLimit(value, fallback = 3) {
      const configuredRoundCount = normalizeUpiRedeemConfiguredRoundCount(value, fallback);
      return configuredRoundCount > 0 ? configuredRoundCount : 1;
    }

    function normalizeRedeemChannel(value = '') {
      const helper = getRedeemChannelStateHelpers().normalizeRedeemChannel;
      if (typeof helper === 'function') {
        return helper(value);
      }
      return membershipRowPolicy.normalizeRedeemChannel?.(value)
        || (normalizeUpiCredentialMembershipText(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi');
    }

    function getLocallyDeletedRedeemPlusEmailsByChannel() {
      return {
        upi: Array.from(locallyDeletedRedeemPlusEmailsByChannel.upi),
        ideal: Array.from(locallyDeletedRedeemPlusEmailsByChannel.ideal),
      };
    }

    function addLocallyDeletedRedeemPlusEmails(channel = 'upi', emails = []) {
      const normalizedChannel = normalizeRedeemChannel(channel);
      const target = locallyDeletedRedeemPlusEmailsByChannel[normalizedChannel];
      normalizeUpiCredentialMembershipEmailList(Array.isArray(emails) ? emails : [emails])
        .forEach((email) => target.add(email));
    }

    function buildRedeemPlusDeletedEmailSets(value = {}) {
      return buildRedeemPlusDeletedEmailSetsFromValues(value, getLocallyDeletedRedeemPlusEmailsByChannel());
    }

    function isRedeemPlusDeletedEmail(email = '', channel = 'upi', deletedEmailSets = {}) {
      return membershipRowPolicy.isRedeemPlusDeletedEmail?.(email, channel, deletedEmailSets) === true;
    }

    function isRedeemPlusDeletedDisplayRow(row = {}, deletedEmailSets = {}) {
      return membershipRowPolicy.isRedeemPlusDeletedDisplayRow?.(row, deletedEmailSets) === true;
    }

    function isActiveUpiCredentialMembershipRedeemRow(row = {}, results = getUpiCredentialMembershipCheckResults()) {
      const source = row && typeof row === 'object' && !Array.isArray(row) ? row : {};
      const email = normalizeUpiCredentialMembershipEmail(source.email);
      const currentEmail = normalizeUpiCredentialMembershipEmail(results?.flowStageEmail);
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

    function isActiveUpiCredentialMembershipRedeemRowOrUsage(row = {}, results = getUpiCredentialMembershipCheckResults()) {
      if (isActiveUpiCredentialMembershipRedeemRow(row, results)) {
        return true;
      }
      return Boolean(findActiveUpiRedeemCdkeyUsageEntryByEmail(row?.email, state.getLatestState(), row?.redeemChannel || row?.channel));
    }

    function isVerifiedPaidUpiRedeemUsageEntry(entry = {}) {
      if (entry?.subscriptionActive !== true) {
        return false;
      }
      const planType = normalizeSubscriptionPlanType(entry.subscriptionPlanType || entry.subscription_plan_type || '');
      return !planType || isPaidSubscriptionPlan(planType);
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
      const planType = normalizeSubscriptionPlanType(entry.subscriptionPlanType || entry.subscription_plan_type || '');
      return isPaidSubscriptionPlan(planType) ? planType : 'plus';
    }

    function buildUpiRedeemSuccessMembershipLookup(currentState = state.getLatestState()) {
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
          if (!email) {
            return;
          }
          if (isRedeemPlusDeletedEmail(email, channel, plusDeletedEmailSets)) {
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
      const email = normalizeUpiCredentialMembershipEmail(row.email);
      const cdkey = String(row.upiRedeemCdkey || row.cdkey || '').trim().toLowerCase();
      const rawChannel = normalizeUpiCredentialMembershipText(row.redeemChannel || row.channel);
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

    function mergeManualFreeMembershipOverridesIntoResults(results = {}, currentState = state.getLatestState()) {
      const previousResults = currentState?.upiCredentialMembershipCheckResults || {};
      const mergedPlusDeletedEmailsByChannel = mergeRedeemPlusDeletedEmailsByChannel(
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
        ...locallyDeletedUpiCredentialMembershipEmails,
      ].map(normalizeUpiCredentialMembershipEmail).filter(Boolean));
      const overrides = {};
      (Array.isArray(previousResults.items) ? previousResults.items : []).forEach((row) => {
        const email = normalizeUpiCredentialMembershipEmail(row?.email);
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
        const email = normalizeUpiCredentialMembershipEmail(item?.email);
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

    function getUpiCredentialMembershipCheckResults(currentState = state.getLatestState()) {
      const raw = currentState?.upiCredentialMembershipCheckResults || {};
      const rawDeletedEmails = (Array.isArray(raw.redeemAutoDeletedEmails) ? raw.redeemAutoDeletedEmails : [])
        .map(normalizeUpiCredentialMembershipEmail)
        .filter(Boolean);
      const rawDeletedEmailSet = new Set(rawDeletedEmails);
      if (locallyDeletedUpiCredentialMembershipEmails.size) {
        const restoredEmailSet = new Set((Array.isArray(raw.items) ? raw.items : [])
          .filter((item) => {
            const status = String(item?.status || '').trim().toLowerCase();
            return status === 'free' || status === 'failed';
          })
          .map((item) => normalizeUpiCredentialMembershipEmail(item?.email))
          .filter((email) => email && !rawDeletedEmailSet.has(email)));
        restoredEmailSet.forEach((email) => locallyDeletedUpiCredentialMembershipEmails.delete(email));
      }
      const deletedEmailSet = new Set([
        ...rawDeletedEmails,
        ...locallyDeletedUpiCredentialMembershipEmails,
      ]);
      const redeemPlusDeletedEmailsByChannel = mergeRedeemPlusDeletedEmailsByChannel(
        raw.redeemPlusDeletedEmailsByChannel,
        getLocallyDeletedRedeemPlusEmailsByChannel()
      );
      const plusDeletedEmailSets = buildRedeemPlusDeletedEmailSets(redeemPlusDeletedEmailsByChannel);
      const successLookup = buildUpiRedeemSuccessMembershipLookup(currentState);
      const items = (Array.isArray(raw.items) ? raw.items : [])
        .filter((item) => !deletedEmailSet.has(normalizeUpiCredentialMembershipEmail(item?.email)))
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
        flowStageEmail: normalizeUpiCredentialMembershipEmail(raw.flowStageEmail || ''),
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

    function getMembershipStatusTitle(status = '') {
      if (status === 'paid-upi') return 'UPI Plus';
      if (status === 'paid-ideal') return 'IDEAL Plus';
      if (status === 'paid-all') return '全部 Plus';
      if (status === 'paid') return '有会员';
      if (status === 'free') return '无会员';
      return '失败';
    }

    function getMembershipPlanLabel(planType = '') {
      const normalized = normalizeSubscriptionPlanType(planType);
      if (normalized === 'pro') return 'Pro';
      if (normalized === 'team') return 'Team';
      if (normalized === 'plus') return 'Plus';
      return normalized || '-';
    }

    function compactMembershipReason(value = '', maxLength = 42) {
      const text = String(value || '').replace(/\s+/g, ' ').trim();
      if (!text) {
        return '';
      }
      const limit = Math.max(8, Math.floor(Number(maxLength) || 42));
      return text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
    }

    function normalizeUpiCredentialMembershipEmail(value = '') {
      return String(value || '').trim().toLowerCase();
    }

    function normalizeUpiCredentialMembershipText(value = '') {
      return String(value || '').trim();
    }

    function readFirstFiniteUpiCredentialMembershipNumericMetadataValue(values = []) {
      for (const value of values) {
        if (value === undefined || value === null) continue;
        if (typeof value === 'string' && value.trim() === '') continue;
        const numeric = Number(value);
        if (Number.isFinite(numeric)) return numeric;
      }
      return undefined;
    }

    function collectUpiCredentialMembershipPasskeyNumericMetadataPatch(...sources) {
      const signCountNumeric = readFirstFiniteUpiCredentialMembershipNumericMetadataValue(sources.flatMap((source) => (
        source && typeof source === 'object' && !Array.isArray(source)
          ? [source.passkeySignCount, source.signCount, source.sign_count]
          : [source]
      )));
      const alg = readFirstFiniteUpiCredentialMembershipNumericMetadataValue(sources.flatMap((source) => (
        source && typeof source === 'object' && !Array.isArray(source)
          ? [source.passkeyAlg, source.alg]
          : [source]
      )));
      const signCount = signCountNumeric === undefined ? undefined : Math.max(0, Math.floor(signCountNumeric));
      return {
        ...(signCount !== undefined ? { passkeySignCount: signCount } : {}),
        ...(alg !== undefined ? { passkeyAlg: alg } : {}),
      };
    }

    function setUpiCredentialMembershipPoolRows(rows = [], source = '') {
      const seen = new Set();
      upiCredentialMembershipPoolRows = (Array.isArray(rows) ? rows : [])
        .map((item) => normalizeUpiCredentialMembershipCredential(item, source))
        .filter((item) => {
          if (!item?.email || seen.has(item.email)) {
            return false;
          }
          seen.add(item.email);
          return true;
        });
      upiCredentialMembershipPoolSource = normalizeUpiCredentialMembershipText(source);
      for (const email of Array.from(disabledUpiCredentialMembershipEmails)) {
        if (!seen.has(email)) {
          disabledUpiCredentialMembershipEmails.delete(email);
        }
      }
    }

    function clampRedeemProgressPercent(value = 0) {
      return membershipRedeemProgress.clampRedeemProgressPercent(value);
    }

    function getUpiCredentialMembershipRedeemProgressMeta(row = {}, results = getUpiCredentialMembershipCheckResults()) {
      return membershipRedeemProgress.getUpiCredentialMembershipRedeemProgressMeta(row, results, {
        normalizeEmail: normalizeUpiCredentialMembershipEmail,
        normalizeText: normalizeUpiCredentialMembershipText,
        normalizeRemoteStatus: normalizeUpiRedeemRemoteStatus,
        isActiveRemoteStatus: isActiveUpiRedeemRemoteStatus,
        normalizeChannel: normalizeRedeemChannel,
        getChannelLabel: getRedeemChannelLabel,
        isRedeemLocked: isUpiCredentialMembershipRedeemLocked,
        getRedeemLockReason: getUpiCredentialMembershipRedeemLockReason,
      });
    }

    function renderUpiCredentialMembershipRedeemProgress(row = {}, progress = {}, cancelRedeemControl = {}) {
      return membershipRedeemProgress.renderUpiCredentialMembershipRedeemProgress(row, progress, cancelRedeemControl, {
        normalizeEmail: normalizeUpiCredentialMembershipEmail,
        escapeHtml,
      });
    }

    function normalizeTrialEligibilityStatus(value = '') {
      return membershipRowPolicy.normalizeTrialEligibilityStatus?.(value) || '';
    }

    function getTrialEligibilityApiHelpers() {
      return (typeof window !== 'undefined' ? window.MultiPageTrialEligibilityApi : null) || {};
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
        : 'upiChannelEligibilityReason';
      return normalizeUpiCredentialMembershipText(row[reasonField])
        || `${getRedeemChannelLabel(redeemChannel)} 渠道当前不可用`;
    }

    function normalizeTrialEligibilitySummaryItem(item = {}) {
      const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
      return {
        email: normalizeUpiCredentialMembershipEmail(source.email),
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
        ? source.ineligibleEmails.map(normalizeUpiCredentialMembershipEmail).filter(Boolean)
        : [];
      const deletedEmails = Array.isArray(source.deletedEmails)
        ? source.deletedEmails.map(normalizeUpiCredentialMembershipEmail).filter(Boolean)
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
      const hasStoredSummary = Boolean(source.checkedAt || kept.length || skipped.length || failed.length || deletedEmails.length || ineligibleEmails.length);
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
      const results = getUpiCredentialMembershipCheckResults();
      const allFreeRows = buildUpiCredentialMembershipDisplayRows(results)
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
        return `${failureBlockedCount} 个 Free 账号 IDEAL 已失败满 ${REDEEM_CHANNEL_FAILURE_LIMIT} 次并已封存，不会再参与兑换。`;
      }
      return `没有启用的 Free 账号可用 ${label} 兑换。`;
    }

    function getNotRedeemableFreeUpiCredentialMembershipReason(row = {}) {
      return membershipRowPolicy.getNotRedeemableReason?.(row) || '当前不可兑换';
    }

    function getUpiCredentialMembershipGroup(row = {}) {
      return getMembershipViewModelGroup(row) === 'free' ? 'free' : 'paid';
    }

    function filterUpiCredentialMembershipRowsByGroup(rows = [], group = upiCredentialMembershipGroup) {
      const normalizedGroup = String(group || '').trim().toLowerCase() === 'paid' ? 'paid' : 'free';
      return (Array.isArray(rows) ? rows : []).filter((row) => getUpiCredentialMembershipGroup(row) === normalizedGroup);
    }

    function isUpiCredentialMembershipRowInResultGroup(row = {}, normalizedStatus = 'paid', targetChannel = '') {
      const status = String(row?.status || '').trim().toLowerCase();
      const uiGroup = getUpiCredentialMembershipUiGroup(row);
      if (normalizedStatus === 'free') {
        return uiGroup === 'free';
      }
      if (normalizedStatus === 'paid') {
        if (targetChannel === 'ideal') {
          return uiGroup === 'paid-ideal';
        }
        if (targetChannel === 'upi') {
          return uiGroup === 'paid-upi';
        }
        return uiGroup !== 'free';
      }
      if (status !== normalizedStatus) {
        return false;
      }
      return !targetChannel || normalizeRedeemChannel(row.redeemChannel || row.channel) === targetChannel;
    }

    function getUpiCredentialMembershipGroupLabel(group = upiCredentialMembershipGroup) {
      return String(group || '').trim().toLowerCase() === 'paid' ? '有 Plus' : 'Free';
    }
    const {
      getUpiCredentialMembershipFlowTitle,
      getUpiCredentialMembershipFlowSteps,
      normalizeUpiCredentialMembershipFlowStage,
      getUpiCredentialMembershipFlowStatus,
      getUpiCredentialMembershipFlowDetail,
      renderUpiCredentialMembershipFlow,
    } = accountRecordsFlowView.createAccountRecordsFlowView({
      escapeHtml,
      compactMembershipReason,
      getMembershipStatusTitle,
      getRedeemChannelLabel,
      getChannelFailureLimitBlockedFreeRows,
      isRedeemableFreeUpiCredentialMembershipRowForChannel,
    });

    function isAutoRunRecordDisplayRunning(currentState = {}) {
      const phase = String(currentState.autoRunPhase || '').trim().toLowerCase();
      return Boolean(currentState.autoRunning)
        && ['running', 'waiting_step', 'waiting_email', 'retrying'].includes(phase);
    }

    function buildCurrentAccountRecordId(currentState = {}) {
      const email = String(currentState.email || '').trim();
      const accountIdentifier = String(
        currentState.accountIdentifier
        || email
        || ''
      ).trim();
      return buildRecordId({
        accountIdentifier,
        email,
      });
    }

    function applyRunningDisplayState(record = {}, currentState = {}) {
      if (!isAutoRunRecordDisplayRunning(currentState)) {
        return record;
      }
      if (getRecordDisplayStatus(record) === 'success') {
        return record;
      }

      const currentRecordId = buildCurrentAccountRecordId(currentState);
      if (!currentRecordId || buildRecordId(record) !== currentRecordId) {
        return record;
      }

      return {
        ...record,
        displayStatus: 'running',
        displaySummary: '正在运行',
      };
    }

    function getRecordIdentifierType(record = {}) {
      if (typeof accountRecordsViewModel.getRecordIdentifierType === 'function') {
        return accountRecordsViewModel.getRecordIdentifierType(record);
      }
      return 'email';
    }

    function getRecordEmail(record = {}) {
      if (typeof accountRecordsViewModel.getRecordEmail === 'function') {
        return accountRecordsViewModel.getRecordEmail(record);
      }
      const identifierType = getRecordIdentifierType(record);
      return String(
        record.email
        || (identifierType === 'email' ? record.accountIdentifier : '')
        || ''
      ).trim();
    }

    function getRecordPrimaryIdentifier(record = {}) {
      const email = getRecordEmail(record);
      return email || String(record.accountIdentifier || '').trim();
    }

    function getRecordSecondaryIdentifier(record = {}) {
      return '';
    }

    function getRecordTitle(record = {}) {
      const primaryIdentifier = getRecordPrimaryIdentifier(record) || '(空账号)';
      const secondaryIdentifier = getRecordSecondaryIdentifier(record);
      return secondaryIdentifier
        ? `${primaryIdentifier} / ${secondaryIdentifier}`
        : primaryIdentifier;
    }

    function getAccountRunRecords(currentState = state.getLatestState()) {
      return (Array.isArray(currentState?.accountRunHistory) ? currentState.accountRunHistory : [])
        .filter((item) => item && typeof item === 'object')
        .slice()
        .sort((left, right) => normalizeTimestamp(right.finishedAt) - normalizeTimestamp(left.finishedAt))
        .map((record) => applyRunningDisplayState(record, currentState));
    }

    function summarizeAccountRunHistory(records = []) {
      if (typeof accountRecordsViewModel.summarizeAccountRunHistory === 'function') {
        return accountRecordsViewModel.summarizeAccountRunHistory(records);
      }
      return records.reduce((summary, record) => {
        const retryCount = normalizeRetryCount(record.retryCount);
        const status = getRecordDisplayStatus(record);
        summary.total += 1;
        if (status === 'success') {
          summary.success += 1;
        } else if (status === 'running') {
          summary.running += 1;
        } else if (status === 'failed') {
          summary.failed += 1;
        } else if (status === 'stopped') {
          summary.stopped += 1;
        }
        if (retryCount > 0) {
          summary.retryRecordCount += 1;
        }
        summary.retryTotal += retryCount;
        return summary;
      }, {
        total: 0,
        success: 0,
        running: 0,
        failed: 0,
        stopped: 0,
        retryRecordCount: 0,
        retryTotal: 0,
      });
    }

    function getFilterConfig(filterKey = activeFilter) {
      return FILTER_CONFIG[filterKey] || FILTER_CONFIG.all;
    }

    function matchesRecordFilter(record = {}, filterKey = activeFilter) {
      if (typeof accountRecordsViewModel.matchesFilter === 'function') {
        return accountRecordsViewModel.matchesFilter(record, filterKey);
      }
      switch (String(filterKey || '').trim().toLowerCase()) {
        case 'success':
          return getRecordDisplayStatus(record) === 'success';
        case 'running':
          return getRecordDisplayStatus(record) === 'running';
        case 'failed':
          return getRecordDisplayStatus(record) === 'failed';
        case 'stopped':
          return getRecordDisplayStatus(record) === 'stopped';
        case 'retry':
          return normalizeRetryCount(record.retryCount) > 0;
        case 'all':
        default:
          return true;
      }
    }

    function getFilteredRecords(records = []) {
      if (typeof accountRecordsViewModel.filterRecords === 'function') {
        return accountRecordsViewModel.filterRecords(records, activeFilter);
      }
      return records.filter((record) => matchesRecordFilter(record, activeFilter));
    }

    function pruneSelectedRecordIds(records = []) {
      const availableIds = new Set(records.map((record) => buildRecordId(record)).filter(Boolean));
      for (const recordId of Array.from(selectedRecordIds)) {
        if (!availableIds.has(recordId)) {
          selectedRecordIds.delete(recordId);
        }
      }
    }

    function setNodeHidden(node, hidden) {
      if (node) {
        node.hidden = Boolean(hidden);
      }
    }

    function setNodeDisabled(node, disabled) {
      if (node) {
        node.disabled = Boolean(disabled);
      }
    }

    function toggleNodeClass(node, className, enabled) {
      if (!node || !className) {
        return;
      }
      if (node.classList && typeof node.classList.toggle === 'function') {
        node.classList.toggle(className, Boolean(enabled));
      }
    }

    function setNodeText(node, value) {
      if (node) {
        node.textContent = String(value || '');
      }
    }

    function setNodeAttr(node, name, value) {
      if (!node || !name) {
        return;
      }
      if (typeof node.setAttribute === 'function') {
        node.setAttribute(name, String(value));
        return;
      }
      node[name] = value;
    }

    function getDatasetValue(node, attrName) {
      if (!node || !attrName) {
        return '';
      }

      if (typeof node.getAttribute === 'function') {
        return String(node.getAttribute(attrName) || '');
      }

      const dataKey = attrName
        .replace(/^data-/, '')
        .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      return String(node.dataset?.[dataKey] || '');
    }

    function findClosest(target, selector) {
      if (!target || typeof target.closest !== 'function') {
        return null;
      }
      try {
        return target.closest(selector);
      } catch {
        return null;
      }
    }

    function ensureValidCurrentPage(totalRecords) {
      const totalPages = totalRecords > 0 ? Math.ceil(totalRecords / pageSize) : 0;
      if (totalPages === 0) {
        currentPage = 1;
      } else if (currentPage > totalPages) {
        currentPage = totalPages;
      } else if (currentPage < 1) {
        currentPage = 1;
      }
      return totalPages;
    }

    const {
      renderAccountRecordsPanel,
      renderUpiCredentialMembershipCheckResults,
      updateHeader,
      updateStats,
      updatePagination,
    } = accountRecordsRenderer.createAccountRecordsRenderer({
      dom,
      state,
      pageSize,
      displayTimeZone,
      redeemChannelFailureLimit: REDEEM_CHANNEL_FAILURE_LIMIT,
      escapeHtml,
      getAccountRunRecords: (currentState) => getAccountRunRecords(currentState),
      getFilteredRecords: (records) => getFilteredRecords(records),
      summarizeAccountRunHistory,
      getRecordDisplayStatus,
      getConfirmedUpiSubscriptionLabel,
      getRecordTitle: (record) => getRecordTitle(record),
      normalizeRetryCount,
      getFilterConfig: (filterKey) => getFilterConfig(filterKey),
      getCurrentPage: () => currentPage,
      getActiveFilter: () => activeFilter,
      getSelectionMode: () => selectionMode,
      getSelectedRecordCount: () => selectedRecordIds.size,
      isRecordSelected: (recordId) => selectedRecordIds.has(recordId),
      setNodeText,
      setNodeDisabled,
      setNodeHidden,
      toggleNodeClass,
      setNodeAttr,
      buildUpiRedeemSuccessEmailExportRows,
      getUpiCredentialBackupPreviewVisible: () => upiCredentialBackupPreviewVisible,
      ensureValidCurrentPage,
      buildRecordId,
      getRecordPrimaryIdentifier: (record) => getRecordPrimaryIdentifier(record),
      getRecordSecondaryIdentifier: (record) => getRecordSecondaryIdentifier(record),
      getUpiCredentialMembershipCheckResults: (currentState) => getUpiCredentialMembershipCheckResults(currentState),
      buildUpiCredentialMembershipDisplayRows: (results) => buildUpiCredentialMembershipDisplayRows(results),
      normalizeUpiCredentialMembershipEmail,
      normalizeUpiCredentialMembershipText,
      isActiveUpiCredentialMembershipRedeemRow: (row, results) => isActiveUpiCredentialMembershipRedeemRow(row, results),
      isAutoRunRecordDisplayRunning: (currentState) => isAutoRunRecordDisplayRunning(currentState),
      summarizeMembershipViewModelRows,
      getUpiCredentialMembershipUiGroup,
      getChannelFailureLimitBlockedFreeRows: (rows, channel) => getChannelFailureLimitBlockedFreeRows(rows, channel),
      isRedeemChannelDailyLimitBlocked: (row, channel) => isRedeemChannelDailyLimitBlocked(row, channel),
      isUpiCredentialMembershipRedeemLocked: (row) => isUpiCredentialMembershipRedeemLocked(row),
      hasUpiCredentialMembershipLoginMaterial: (row) => hasUpiCredentialMembershipLoginMaterial(row),
      getUpiCredentialMembershipRowStatusMeta: (row, results) => getUpiCredentialMembershipRowStatusMeta(row, results),
      getUpiCredentialMembershipRedeemCancelControl: (row, results) => getUpiCredentialMembershipRedeemCancelControl(row, results),
      getUpiCredentialMembershipRedeemProgressMeta: (row, results) => getUpiCredentialMembershipRedeemProgressMeta(row, results),
      renderUpiCredentialMembershipRedeemProgress: (row, progress, cancelControl) => renderUpiCredentialMembershipRedeemProgress(row, progress, cancelControl),
      getAvailableUpiRedeemCdkeyCount: (currentState, channel) => getAvailableUpiRedeemCdkeyCount(currentState, channel),
      isRedeemableFreeUpiCredentialMembershipRow: (row) => isRedeemableFreeUpiCredentialMembershipRow(row),
      isRedeemableFreeUpiCredentialMembershipRowForChannel: (row, channel) => isRedeemableFreeUpiCredentialMembershipRowForChannel(row, channel),
      getRedeemChannelLabel: (channel) => getRedeemChannelLabel(channel),
      renderUpiCredentialMembershipFlow: (results, rows) => renderUpiCredentialMembershipFlow(results, rows),
      getUpiCredentialMembershipFlowTitle: (stepKey, results) => getUpiCredentialMembershipFlowTitle(stepKey, results),
      getUpiCredentialMembershipCheckBusy: () => upiCredentialMembershipCheckBusy,
      getUpiCredentialMembershipRedeemBusy: () => upiCredentialMembershipRedeemBusy,
      getUpiCredentialMembershipAllRedeemBusy: () => upiCredentialMembershipAllRedeemBusy,
      getUpiCredentialMembershipCheckingEmail: () => upiCredentialMembershipCheckingEmail,
      getUpiCredentialMembershipLoginEmail: () => upiCredentialMembershipLoginEmail,
      setExportButtonsBusy,
    });

    function render(currentState = state.getLatestState()) {
      const allRecords = getAccountRunRecords(currentState);
      pruneSelectedRecordIds(allRecords);

      if (!allRecords.length) {
        selectionMode = false;
      }

      const membershipResults = getUpiCredentialMembershipCheckResults(currentState);
      upiCredentialMembershipCheckBusy = membershipResults.running;
      upiCredentialMembershipRedeemBusy = membershipResults.redeeming;
      renderAccountRecordsPanel(currentState);
    }

    function toggleRecordSelection(recordId, forceSelected = null) {
      const normalizedRecordId = String(recordId || '').trim().toLowerCase();
      if (!selectionMode || !normalizedRecordId) {
        return;
      }

      const shouldSelect = forceSelected === null
        ? !selectedRecordIds.has(normalizedRecordId)
        : Boolean(forceSelected);

      if (shouldSelect) {
        selectedRecordIds.add(normalizedRecordId);
      } else {
        selectedRecordIds.delete(normalizedRecordId);
      }
    }
    function setExportButtonsBusy(busy) {
      setNodeDisabled(dom.btnExportSuccessAccountRecords, busy);
      setNodeDisabled(dom.btnShowUpiCredentialBackups, busy);
      setNodeDisabled(dom.btnExportUpiCredentialBackups, busy);
      const membershipBusy = upiCredentialMembershipCheckBusy || upiCredentialMembershipRedeemBusy;
      setNodeDisabled(dom.btnCheckUpiCredentialMembershipLocal, busy || membershipBusy);
      setNodeDisabled(dom.btnImportUpiCredentialMembershipTxt, busy || membershipBusy);
      setNodeDisabled(dom.btnImportUpiCredentialMembershipFreeTxt, busy || membershipBusy);
      setNodeDisabled(dom.btnExportUpiRedeemSuccessRecords, busy);
      setNodeText(dom.btnExportUpiRedeemSuccessRecords, busy ? '查询中' : '导出已开通会员密码2FA');
      setNodeText(dom.btnShowUpiCredentialBackups, busy ? '读取中' : '查看全部已存密码2FA');
      setNodeText(dom.btnExportUpiCredentialBackups, busy ? '查询中' : '导出当前 CDK 成功密码2FA');
      setNodeText(dom.btnCheckUpiCredentialMembershipLocal, membershipBusy ? (upiCredentialMembershipRedeemBusy ? '兑换中' : '核验中') : '核验启用已存备份');
      setNodeText(dom.btnImportUpiCredentialMembershipTxt, membershipBusy ? (upiCredentialMembershipRedeemBusy ? '兑换中' : '核验中') : '导入备份TXT并核验');
      setNodeText(dom.btnImportUpiCredentialMembershipFreeTxt, membershipBusy ? (upiCredentialMembershipRedeemBusy ? '兑换中' : '核验中') : '导入 Free TXT');
      setNodeHidden(dom.btnStopUpiCredentialMembershipCheck, !upiCredentialMembershipCheckBusy);
    }

    function setUpiCredentialBackupPreviewText(content = '') {
      if (dom.upiCredentialBackupPreview) {
        dom.upiCredentialBackupPreview.value = String(content || '').trimEnd()
          || '暂无已保存的 UPI 密码 2FA 备份。';
      }
      setNodeHidden(dom.upiCredentialBackupPreviewWrap, !upiCredentialBackupPreviewVisible);
    }

    const membershipCredentialHelpers = accountRecordsMembershipHelpers.createAccountRecordsMembershipHelpers({
      state,
      getLatestState: () => state.getLatestState(),
      getUpiCredentialMembershipCheckResults: (currentState) => getUpiCredentialMembershipCheckResults(currentState),
      buildUpiCredentialMembershipDisplayRows: (results) => buildUpiCredentialMembershipDisplayRows(results),
      getUpiCredentialMembershipPoolRows: () => upiCredentialMembershipPoolRows,
      isUpiCredentialMembershipEmailDisabled: (email) => disabledUpiCredentialMembershipEmails.has(email),
      normalizeUpiCredentialMembershipEmail,
      normalizeUpiCredentialMembershipText,
      normalizeUpiCredentialMembershipTotpSecret,
      collectUpiCredentialMembershipPasskeyNumericMetadataPatch,
      getUpiCredentialMembershipFailureLimit: (row) => getUpiCredentialMembershipFailureLimit(row),
      getRedeemChannelFailureCount: (row, channel) => getRedeemChannelFailureCount(row, channel),
      isUpiCredentialMembershipRedeemLocked: (row) => isUpiCredentialMembershipRedeemLocked(row),
      getUpiCredentialMembershipRedeemLockReason: (row) => getUpiCredentialMembershipRedeemLockReason(row),
      getUpiCredentialMembershipGroup: (row) => getUpiCredentialMembershipGroup(row),
      isRedeemableFreeUpiCredentialMembershipRow: (row) => isRedeemableFreeUpiCredentialMembershipRow(row),
      isRedeemableFreeUpiCredentialMembershipRowForChannel: (row, channel) => isRedeemableFreeUpiCredentialMembershipRowForChannel(row, channel),
      normalizeRedeemChannel,
      getStoredCdkPoolText: (currentState, channel) => getStoredCdkPoolText(currentState, channel),
      parseUpiRedeemCdkeyPoolText,
      getUpiRedeemCdkeyUsage: (currentState, channel) => getUpiRedeemCdkeyUsage(currentState, channel),
      normalizeUpiRedeemRemoteStatus,
      isActiveUpiRedeemRemoteStatus,
      normalizeUpiCredentialMembershipCapabilityFlag,
      getUpiCredentialMembershipCheckBusy: () => upiCredentialMembershipCheckBusy,
      getUpiCredentialMembershipRedeemBusy: () => upiCredentialMembershipRedeemBusy,
    });
    const {
      getEnabledUpiCredentialMembershipPoolRows,
      getEnabledFreeUpiCredentialMembershipRows,
      getEnabledFreeUpiCredentialMembershipRowsForChannel,
      getIdealFallbackUpiCredentialMembershipRows,
      getEnabledFreeUpiCredentialMembershipRowsMissingAt,
      getEnabledFreeUpiCredentialMembershipRowsWithAt,
      getEnabledPlusUpiCredentialMembershipRowsWithAt,
      buildUpiCredentialMembershipRedeemCredential,
      buildUpiCredentialMembershipActionCredential,
      getUpiRedeemUsageEmail,
      getUpiRedeemCdkeyUsageEntryByCdkey,
      findActiveUpiRedeemCdkeyUsageEntryByEmail,
      getUpiCredentialMembershipRedeemCdkey,
      getUpiCredentialMembershipRedeemCancelControl,
      getAvailableUpiRedeemCdkeyCount,
      isRemoteRedeemSuccess,
      getUpiCredentialMembershipSingleRedeemRow,
      getUpiRedeemUsageRelatedEmail,
      buildUpiCredentialMembershipRedeemStatusRefreshTargets,
      getUpiCredentialMembershipDisplayRowByEmail,
    } = membershipCredentialHelpers;

    const redeemActions = accountRecordsRedeemActions.createAccountRecordsRedeemActions({
      state,
      helpers,
      runtime,
      normalizeRedeemChannel,
      getRedeemChannelLabel: (channel) => getRedeemChannelLabel(channel),
      normalizeUpiCredentialMembershipEmail,
      getUpiCredentialMembershipCheckResults: (currentState) => getUpiCredentialMembershipCheckResults(currentState),
      refreshUpiCredentialMembershipCheckResults: (...args) => refreshUpiCredentialMembershipCheckResults(...args),
      getMembershipCheckSettingsPayload: () => getMembershipCheckSettingsPayload(),
      mergeManualFreeMembershipOverridesIntoResults: (results) => mergeManualFreeMembershipOverridesIntoResults(results),
      getEnabledFreeUpiCredentialMembershipRowsForChannel: (channel) => getEnabledFreeUpiCredentialMembershipRowsForChannel(channel),
      buildNoRedeemableForChannelMessage: (channel) => buildNoRedeemableForChannelMessage(channel),
      getAvailableUpiRedeemCdkeyCount: (currentState, channel) => getAvailableUpiRedeemCdkeyCount(currentState, channel),
      getIdealFallbackUpiCredentialMembershipRows: () => getIdealFallbackUpiCredentialMembershipRows(),
      getUpiCredentialMembershipPoolRows: () => upiCredentialMembershipPoolRows,
      setUpiCredentialMembershipPoolRows: (rows, source) => setUpiCredentialMembershipPoolRows(rows, source),
      getUpiCredentialMembershipPoolSource: () => upiCredentialMembershipPoolSource,
      deleteDisabledUpiCredentialMembershipEmail: (email) => disabledUpiCredentialMembershipEmails.delete(email),
      getUpiCredentialMembershipSingleRedeemRow: (email) => getUpiCredentialMembershipSingleRedeemRow(email),
      isRedeemableFreeUpiCredentialMembershipRow: (row) => isRedeemableFreeUpiCredentialMembershipRow(row),
      getNotRedeemableFreeUpiCredentialMembershipReason: (row) => getNotRedeemableFreeUpiCredentialMembershipReason(row),
      isRedeemableFreeUpiCredentialMembershipRowForChannel: (row, channel) => isRedeemableFreeUpiCredentialMembershipRowForChannel(row, channel),
      buildUpiCredentialMembershipRedeemCredential: (row) => buildUpiCredentialMembershipRedeemCredential(row),
      getUpiCredentialMembershipDisplayRowByEmail: (email) => getUpiCredentialMembershipDisplayRowByEmail(email),
      getUpiCredentialMembershipRedeemCdkey: (row) => getUpiCredentialMembershipRedeemCdkey(row),
      getStoredCdkPoolText: (currentState, channel) => getStoredCdkPoolText(currentState, channel),
      buildUpiCredentialMembershipRedeemStatusRefreshTargets: (results) => (
        buildUpiCredentialMembershipRedeemStatusRefreshTargets(
          buildUpiCredentialMembershipDisplayRows(results || getUpiCredentialMembershipCheckResults())
        )
      ),
      getUpiCredentialMembershipCheckBusy: () => upiCredentialMembershipCheckBusy,
      setUpiCredentialMembershipRedeemBusy: (value) => {
        upiCredentialMembershipRedeemBusy = value === true;
      },
      getUpiCredentialMembershipRedeemBusy: () => upiCredentialMembershipRedeemBusy,
      setUpiCredentialMembershipAllRedeemBusy: (value) => {
        upiCredentialMembershipAllRedeemBusy = value === true;
      },
      getUpiCredentialMembershipAllRedeemBusy: () => upiCredentialMembershipAllRedeemBusy,
      setUpiCredentialMembershipRedeemStatusRefreshBusy: (value) => {
        upiCredentialMembershipRedeemStatusRefreshBusy = value === true;
      },
      getUpiCredentialMembershipRedeemStatusRefreshBusy: () => upiCredentialMembershipRedeemStatusRefreshBusy,
      setExportButtonsBusy,
      isAutoRunRecordDisplayRunning: (currentState) => isAutoRunRecordDisplayRunning(currentState),
      render: () => render(),
    });
    const {
      refreshUpiCredentialMembershipRedeemStatuses,
      startUpiCredentialMembershipFreeRedeem,
      startUpiCredentialMembershipAllRedeem,
      startSingleUpiCredentialMembershipFreeRedeem,
      cancelUpiCredentialMembershipRedeemJob,
    } = redeemActions;

    function getMembershipCheckSettingsPayload() {
      const latest = state.getLatestState();
      return {
        upiCredentialMembershipCheckTotpApiBaseUrl: String(
          dom.inputUpiCredentialMembershipTotpApiBaseUrl?.value
          || latest?.upiCredentialMembershipCheckTotpApiBaseUrl
          || 'https://cha.nerver.cc'
        ).trim(),
        upiCredentialMembershipCheckTotpLookupKey: String(
          dom.inputUpiCredentialMembershipTotpLookupKey?.value
          || latest?.upiCredentialMembershipCheckTotpLookupKey
          || ''
        ).trim(),
        upiSubscriptionApiBaseUrl: String(
          dom.inputUpiSubscriptionApiBaseUrl?.value
          || latest?.upiSubscriptionApiBaseUrl
          || latest?.upiCredentialMembershipCheckTotpApiBaseUrl
          || 'https://cha.nerver.cc'
        ).trim(),
        upiRedeemExternalApiKey: String(
          dom.inputUpiRedeemExternalApiKey?.value
          || latest?.upiRedeemExternalApiKey
          || latest?.pixRedeemExternalApiKey
          || ''
        ).trim(),
        upiRedeemClientId: String(
          dom.inputUpiRedeemClientId?.value
          || latest?.upiRedeemClientId
          || latest?.pixRedeemClientId
          || ''
        ).trim(),
        upiRedeemFailedAccountRetryLimit: Math.max(0, Math.min(20, Math.floor(Number(
          dom.inputUpiRedeemFailedAccountRetryLimit?.value
          ?? latest?.upiRedeemFailedAccountRetryLimit
          ?? 3
        ) || 0))),
        cdkPoolText: getStoredCdkPoolText(latest, 'upi'),
        upiRedeemCdkPoolText: getStoredCdkPoolText(latest, 'upi'),
        upiRedeemCdkeyPoolText: getStoredCdkPoolText(latest, 'upi'),
        idealRedeemCdkeyPoolText: getStoredCdkPoolText(latest, 'ideal'),
      };
    }

    const membershipActions = accountRecordsMembershipActions.createAccountRecordsMembershipActions({
      state,
      helpers,
      runtime,
      getMembershipCheckSettingsPayload: () => getMembershipCheckSettingsPayload(),
      getUpiCredentialMembershipCheckResults: (currentState) => getUpiCredentialMembershipCheckResults(currentState),
      mergeManualFreeMembershipOverridesIntoResults: (results) => mergeManualFreeMembershipOverridesIntoResults(results),
      getEnabledFreeUpiCredentialMembershipRowsMissingAt: () => getEnabledFreeUpiCredentialMembershipRowsMissingAt(),
      getEnabledFreeUpiCredentialMembershipRowsWithAt: () => getEnabledFreeUpiCredentialMembershipRowsWithAt(),
      getEnabledPlusUpiCredentialMembershipRowsWithAt: () => getEnabledPlusUpiCredentialMembershipRowsWithAt(),
      normalizeUpiCredentialMembershipText,
      normalizeUpiCredentialMembershipEmail,
      getUpiCredentialMembershipDisplayRowByEmail: (email) => getUpiCredentialMembershipDisplayRowByEmail(email),
      hasUpiCredentialMembershipLoginMaterial: (row) => hasUpiCredentialMembershipLoginMaterial(row),
      buildUpiCredentialMembershipActionCredential: (row) => buildUpiCredentialMembershipActionCredential(row),
      mergeUpiCredentialMembershipResultItem: (item) => mergeUpiCredentialMembershipResultItem(item),
      renderUpiCredentialMembershipCheckResults: () => renderUpiCredentialMembershipCheckResults(),
      getUpiCredentialMembershipCheckingEmail: () => upiCredentialMembershipCheckingEmail,
      getUpiCredentialMembershipLoginEmail: () => upiCredentialMembershipLoginEmail,
      setUpiCredentialMembershipLoginEmail: (value) => {
        upiCredentialMembershipLoginEmail = value || '';
      },
      setUpiCredentialMembershipCheckBusy: (value) => {
        upiCredentialMembershipCheckBusy = value === true;
      },
      setUpiCredentialMembershipRedeemBusy: (value) => {
        upiCredentialMembershipRedeemBusy = value === true;
      },
      setExportButtonsBusy,
      render: () => render(),
    });
    const {
      refreshUpiCredentialMembershipCheckResults,
      fillFreeUpiCredentialMembershipAccessTokens,
      identifyFreeUpiCredentialMembershipPlus,
      verifyPlusUpiCredentialMembershipRows,
      loginUpiCredentialMembershipAccount,
      moveUpiCredentialMembershipAccountGroup,
    } = membershipActions;

    const membershipPoolOps = accountRecordsMembershipPoolOps.createAccountRecordsMembershipPoolOps({
      state,
      dom,
      helpers,
      runtime,
      parseUpiCredentialMembershipText,
      getUpiCredentialMembershipCheckResults: (currentState) => getUpiCredentialMembershipCheckResults(currentState),
      mergeManualFreeMembershipOverridesIntoResults: (results) => mergeManualFreeMembershipOverridesIntoResults(results),
      buildUpiCredentialMembershipDisplayRows: (results) => buildUpiCredentialMembershipDisplayRows(results),
      normalizeUpiCredentialMembershipEmail,
      isActiveUpiCredentialMembershipRedeemRowOrUsage: (row, results) => isActiveUpiCredentialMembershipRedeemRowOrUsage(row, results),
      renderUpiCredentialMembershipCheckResults: () => renderUpiCredentialMembershipCheckResults(),
      getEnabledUpiCredentialMembershipPoolRows: () => getEnabledUpiCredentialMembershipPoolRows(),
      getEnabledFreeUpiCredentialMembershipRowsForChannel: (channel) => getEnabledFreeUpiCredentialMembershipRowsForChannel(channel),
      startUpiCredentialMembershipFreeRedeem: (...args) => startUpiCredentialMembershipFreeRedeem(...args),
      getMembershipCheckSettingsPayload: () => getMembershipCheckSettingsPayload(),
      refreshUpiCredentialMembershipCheckResults: (...args) => refreshUpiCredentialMembershipCheckResults(...args),
      getUpiCredentialMembershipPoolRows: () => upiCredentialMembershipPoolRows,
      setUpiCredentialMembershipPoolRows: (rows, source) => setUpiCredentialMembershipPoolRows(rows, source),
      getUpiCredentialMembershipPoolSource: () => upiCredentialMembershipPoolSource,
      getUpiCredentialMembershipPoolLoaded: () => upiCredentialMembershipPoolLoaded,
      setUpiCredentialMembershipPoolLoaded: (value) => {
        upiCredentialMembershipPoolLoaded = value === true;
      },
      getUpiCredentialMembershipPoolLoading: () => upiCredentialMembershipPoolLoading,
      setUpiCredentialMembershipPoolLoading: (value) => {
        upiCredentialMembershipPoolLoading = value === true;
      },
      clearLocallyDeletedUpiCredentialMembershipEmails: () => {
        locallyDeletedUpiCredentialMembershipEmails.clear();
      },
      clearLocallyDeletedRedeemPlusEmailsByChannel: () => {
        locallyDeletedRedeemPlusEmailsByChannel.upi.clear();
        locallyDeletedRedeemPlusEmailsByChannel.ideal.clear();
      },
      deleteLocallyDeletedUpiCredentialMembershipEmail: (email) => {
        locallyDeletedUpiCredentialMembershipEmails.delete(email);
      },
      setExportButtonsBusy,
      render: () => render(),
      getAvailableUpiRedeemCdkeyCount: (currentState, channel) => getAvailableUpiRedeemCdkeyCount(currentState, channel),
      normalizeRedeemChannel,
      getUpiCredentialMembershipCheckBusy: () => upiCredentialMembershipCheckBusy,
      setUpiCredentialMembershipCheckBusy: (value) => {
        upiCredentialMembershipCheckBusy = value === true;
      },
      getUpiCredentialMembershipRedeemBusy: () => upiCredentialMembershipRedeemBusy,
      setUpiCredentialMembershipRedeemBusy: (value) => {
        upiCredentialMembershipRedeemBusy = value === true;
      },
      getUpiCredentialMembershipAllRedeemBusy: () => upiCredentialMembershipAllRedeemBusy,
      isAutoRunRecordDisplayRunning: (currentState) => isAutoRunRecordDisplayRunning(currentState),
      setUpiCredentialBackupPreviewVisible: (value) => {
        upiCredentialBackupPreviewVisible = value === true;
      },
      setUpiCredentialBackupPreviewText: (content) => setUpiCredentialBackupPreviewText(content),
    });
    const {
      refreshUpiCredentialMembershipCredentialPool,
      reloadUpiCredentialMembershipAfterRuntimeImport,
      exportUpiCredentialBackupTextFile,
      showUpiCredentialBackupText,
      startUpiCredentialMembershipCheck,
      startLocalUpiCredentialMembershipCheck,
      openUpiCredentialMembershipTxtImport,
      handleUpiCredentialMembershipTxtSelected,
      stopUpiCredentialMembershipCheck,
      resumeFreeRedeemAfterCdkImport,
      stopUpiCredentialMembershipRedeem,
    } = membershipPoolOps;

    function mergeUpiCredentialMembershipResultItem(item = {}) {
      const email = normalizeUpiCredentialMembershipEmail(item?.email);
      if (!email) {
        return;
      }
      const currentResults = getUpiCredentialMembershipCheckResults();
      const items = Array.isArray(currentResults.items) ? [...currentResults.items] : [];
      const index = items.findIndex((row) => normalizeUpiCredentialMembershipEmail(row?.email) === email);
      const itemStatus = String(item.status || '').trim().toLowerCase();
      const nextItem = {
        ...(index >= 0 ? items[index] : {}),
        ...item,
        email,
      };
      if (itemStatus === 'free') {
        Object.assign(nextItem, buildFreeMembershipOverridePatch(item.checkedAt || nextItem.checkedAt));
      } else if (itemStatus === 'paid') {
        delete nextItem.membershipOverrideStatus;
        delete nextItem.membershipOverrideCheckedAt;
      }
      if (index >= 0) {
        items[index] = nextItem;
      } else {
        items.push(nextItem);
      }
      state.syncLatestState({
        upiCredentialMembershipCheckResults: {
          ...currentResults,
          items,
          running: false,
          updatedAt: new Date().toISOString(),
          flowStage: '',
          flowStageEmail: '',
          total: Math.max(Number(currentResults.total) || 0, items.length),
          completed: Math.max(Number(currentResults.completed) || 0, items.length),
        },
      });
    }

    const membershipResultOps = accountRecordsMembershipResultOps.createAccountRecordsMembershipResultOps({
      state,
      helpers,
      runtime,
      getAccountRunRecords: (currentState) => getAccountRunRecords(currentState),
      getUpiRedeemCdkeyUsage: (currentState, channel) => getUpiRedeemCdkeyUsage(currentState, channel),
      getUpiRedeemSuccessExportCdkeys,
      buildUpiRedeemSuccessEmailExportRows,
      summarizeUpiRedeemSuccessExportEligibility,
      buildUpiRedeemSuccessExportBlockedMessage,
      buildUpiRedeemSuccessEmailExportFileName,
      setExportButtonsBusy,
      render: () => render(),
      getUpiCredentialMembershipCheckResults: (currentState) => getUpiCredentialMembershipCheckResults(currentState),
      refreshUpiCredentialMembershipCheckResults: (...args) => refreshUpiCredentialMembershipCheckResults(...args),
      mergeManualFreeMembershipOverridesIntoResults: (results) => mergeManualFreeMembershipOverridesIntoResults(results),
      buildUpiCredentialMembershipDisplayRows: (results) => buildUpiCredentialMembershipDisplayRows(results),
      isUpiCredentialMembershipRowInResultGroup: (row, status, channel) => isUpiCredentialMembershipRowInResultGroup(row, status, channel),
      getMembershipStatusTitle,
      normalizeUpiCredentialMembershipEmail,
      normalizeUpiCredentialMembershipText,
      normalizeRedeemChannel,
      isActiveUpiCredentialMembershipRedeemRowOrUsage: (row, results) => isActiveUpiCredentialMembershipRedeemRowOrUsage(row, results),
      getUpiCredentialMembershipDisplayRowByEmail: (email, channel) => getUpiCredentialMembershipDisplayRowByEmail(email, channel),
      addLocallyDeletedRedeemPlusEmails: (channel, emails) => addLocallyDeletedRedeemPlusEmails(channel, emails),
      addLocallyDeletedUpiCredentialMembershipEmail: (email) => {
        locallyDeletedUpiCredentialMembershipEmails.add(email);
      },
      removeDisabledUpiCredentialMembershipEmail: (email) => {
        disabledUpiCredentialMembershipEmails.delete(email);
      },
      getUpiCredentialMembershipPoolRows: () => upiCredentialMembershipPoolRows,
      setUpiCredentialMembershipPoolRows: (rows, source) => setUpiCredentialMembershipPoolRows(rows, source),
      getUpiCredentialMembershipPoolSource: () => upiCredentialMembershipPoolSource,
      getMembershipCheckSettingsPayload: () => getMembershipCheckSettingsPayload(),
      getMembershipPlanLabel,
      getUpiCredentialMembershipCheckingEmail: () => upiCredentialMembershipCheckingEmail,
      setUpiCredentialMembershipCheckingEmail: (value) => {
        upiCredentialMembershipCheckingEmail = value || '';
      },
      mergeUpiCredentialMembershipResultItem: (item) => mergeUpiCredentialMembershipResultItem(item),
    });
    const {
      exportUpiRedeemSuccessEmailTextFile,
      exportUpiCredentialMembershipCheckResultTextFile,
      deleteUpiCredentialMembershipResultGroup,
      deleteUpiCredentialMembershipCredential,
      checkOneUpiCredentialMembership,
    } = membershipResultOps;

    const panelEvents = accountRecordsPanelEvents.createAccountRecordsPanelEvents({
      state,
      dom,
      helpers,
      runtime,
      FILTER_CONFIG,
      render: () => render(),
      refreshUpiCredentialMembershipCredentialPool: (...args) => refreshUpiCredentialMembershipCredentialPool(...args),
      getUpiCredentialMembershipPoolLoaded: () => upiCredentialMembershipPoolLoaded,
      setNodeHidden,
      getDatasetValue,
      findClosest,
      buildRecordId,
      getAccountRunRecords: (currentState) => getAccountRunRecords(currentState),
      getSelectedRecordIds: () => selectedRecordIds,
      getSelectionMode: () => selectionMode,
      setSelectionModeState: (value) => {
        selectionMode = value === true;
      },
      getActiveFilter: () => activeFilter,
      setActiveFilter: (value) => {
        activeFilter = value || 'all';
      },
      getCurrentPage: () => currentPage,
      setCurrentPage: (value) => {
        currentPage = value;
      },
      getEventsBound: () => eventsBound,
      setEventsBound: (value) => {
        eventsBound = value === true;
      },
      getUpiCredentialMembershipGroup: () => upiCredentialMembershipGroup,
      setUpiCredentialMembershipGroup: (value) => {
        upiCredentialMembershipGroup = value === 'paid' ? 'paid' : 'free';
        renderUpiCredentialMembershipCheckResults();
      },
      toggleRecordSelectionImpl: (recordId, forceSelected) => toggleRecordSelection(recordId, forceSelected),
      exportUpiRedeemSuccessEmailTextFile: (...args) => exportUpiRedeemSuccessEmailTextFile(...args),
      showUpiCredentialBackupText: (...args) => showUpiCredentialBackupText(...args),
      startLocalUpiCredentialMembershipCheck: (...args) => startLocalUpiCredentialMembershipCheck(...args),
      openUpiCredentialMembershipTxtImport: (mode) => openUpiCredentialMembershipTxtImport(mode),
      handleUpiCredentialMembershipTxtSelected: (...args) => handleUpiCredentialMembershipTxtSelected(...args),
      stopUpiCredentialMembershipCheck: (...args) => stopUpiCredentialMembershipCheck(...args),
      stopUpiCredentialMembershipRedeem: (...args) => stopUpiCredentialMembershipRedeem(...args),
      checkOneUpiCredentialMembership: (...args) => checkOneUpiCredentialMembership(...args),
      fillFreeUpiCredentialMembershipAccessTokens: (...args) => fillFreeUpiCredentialMembershipAccessTokens(...args),
      identifyFreeUpiCredentialMembershipPlus: (...args) => identifyFreeUpiCredentialMembershipPlus(...args),
      verifyPlusUpiCredentialMembershipRows: (...args) => verifyPlusUpiCredentialMembershipRows(...args),
      loginUpiCredentialMembershipAccount: (...args) => loginUpiCredentialMembershipAccount(...args),
      moveUpiCredentialMembershipAccountGroup: (...args) => moveUpiCredentialMembershipAccountGroup(...args),
      startUpiCredentialMembershipFreeRedeem: (...args) => startUpiCredentialMembershipFreeRedeem(...args),
      startUpiCredentialMembershipAllRedeem: (...args) => startUpiCredentialMembershipAllRedeem(...args),
      exportUpiCredentialMembershipCheckResultTextFile: (...args) => exportUpiCredentialMembershipCheckResultTextFile(...args),
      deleteUpiCredentialMembershipResultGroup: (...args) => deleteUpiCredentialMembershipResultGroup(...args),
      cancelUpiCredentialMembershipRedeemJob: (...args) => cancelUpiCredentialMembershipRedeemJob(...args),
      deleteUpiCredentialMembershipCredential: (...args) => deleteUpiCredentialMembershipCredential(...args),
      addDisabledUpiCredentialMembershipEmail: (email) => {
        disabledUpiCredentialMembershipEmails.add(email);
      },
      removeDisabledUpiCredentialMembershipEmail: (email) => {
        disabledUpiCredentialMembershipEmails.delete(email);
      },
      normalizeUpiCredentialMembershipEmail,
    });
    const {
      bindEvents,
      clearRecords,
      closePanel,
      deleteSelectedRecords,
      openPanel,
      reset,
      setSelectionMode,
      toggleSelectionMode,
    } = panelEvents;

    return {
      bindEvents,
      clearRecords,
      closePanel,
      deleteSelectedRecords,
      exportUpiCredentialBackupTextFile,
      exportUpiRedeemSuccessEmailTextFile,
      openPanel,
      reloadUpiCredentialMembershipAfterRuntimeImport,
      render,
      reset,
      resumeFreeRedeemAfterCdkImport,
      setSelectionMode,
      showUpiCredentialBackupText,
      summarizeAccountRunHistory,
      toggleSelectionMode,
    };
  }

  globalScope.SidepanelAccountRecordsManager = {
    createAccountRecordsManager,
  };
})(typeof window !== 'undefined' ? window : globalThis);
