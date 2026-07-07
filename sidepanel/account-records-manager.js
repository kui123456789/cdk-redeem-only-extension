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
    const accountRecordsDomHelpers = globalScope.SidepanelAccountRecordsDomHelpers || {};
    if (typeof accountRecordsDomHelpers.createAccountRecordsDomHelpers !== 'function') {
      throw new Error('Account records DOM helpers module is not loaded.');
    }
    const {
      findClosest,
      getDatasetValue,
      setNodeAttr,
      setNodeDisabled,
      setNodeHidden,
      setNodeText,
      toggleNodeClass,
    } = accountRecordsDomHelpers.createAccountRecordsDomHelpers();
    const accountRecordsMembershipStateSync = globalScope.SidepanelAccountRecordsMembershipStateSync || {};
    if (typeof accountRecordsMembershipStateSync.createAccountRecordsMembershipStateSync !== 'function') {
      throw new Error('Account records membership state sync module is not loaded.');
    }
    const accountRecordsTrialEligibility = globalScope.SidepanelAccountRecordsTrialEligibility || {};
    if (typeof accountRecordsTrialEligibility.createAccountRecordsTrialEligibility !== 'function') {
      throw new Error('Account records trial eligibility module is not loaded.');
    }
    const accountRecordsRunHistory = globalScope.SidepanelAccountRecordsRunHistory || {};
    if (typeof accountRecordsRunHistory.createAccountRecordsRunHistory !== 'function') {
      throw new Error('Account records run history module is not loaded.');
    }
    const accountRecordsSettingsPayload = globalScope.SidepanelAccountRecordsSettingsPayload || {};
    if (typeof accountRecordsSettingsPayload.createAccountRecordsSettingsPayload !== 'function') {
      throw new Error('Account records settings payload module is not loaded.');
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
      getLocallyDeletedUpiCredentialMembershipEmails: () => getLocallyDeletedUpiCredentialMembershipEmails(),
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
    const membershipStateSync = accountRecordsMembershipStateSync.createAccountRecordsMembershipStateSync({
      state,
      membershipRowPolicy,
      locallyDeletedUpiCredentialMembershipEmails,
      locallyDeletedRedeemPlusEmailsByChannel,
      normalizeEmail: (value) => normalizeUpiCredentialMembershipEmail(value),
      normalizeText: (value) => normalizeUpiCredentialMembershipText(value),
      normalizeTimestamp,
      normalizeRedeemChannel: (value) => normalizeRedeemChannel(value),
      normalizeSubscriptionPlanType: (value) => normalizeSubscriptionPlanType(value),
      isPaidSubscriptionPlan: (planType) => isPaidSubscriptionPlan(planType),
      isActiveUpiRedeemRemoteStatus: (value) => isActiveUpiRedeemRemoteStatus(value),
      normalizeUpiCredentialMembershipEmailList,
      buildRedeemPlusDeletedEmailSetsFromValues,
      mergeRedeemPlusDeletedEmailsByChannel,
      getUpiRedeemCdkeyUsage: (currentState, channel) => getUpiRedeemCdkeyUsage(currentState, channel),
      getUpiRedeemUsageEmail: (entry) => getUpiRedeemUsageEmail(entry),
      findActiveUpiRedeemCdkeyUsageEntryByEmail: (email, currentState, channel) => (
        findActiveUpiRedeemCdkeyUsageEntryByEmail(email, currentState, channel)
      ),
    });
    const trialEligibility = accountRecordsTrialEligibility.createAccountRecordsTrialEligibility({
      membershipRowPolicy,
      failureLimit: REDEEM_CHANNEL_FAILURE_LIMIT,
      normalizeEmail: (value) => normalizeUpiCredentialMembershipEmail(value),
      normalizeText: (value) => normalizeUpiCredentialMembershipText(value),
      normalizeRedeemChannel: (value) => normalizeRedeemChannel(value),
      getRedeemChannelLabel: (channel) => getRedeemChannelLabel(channel),
      getUpiCredentialMembershipCheckResults: () => getUpiCredentialMembershipCheckResults(),
      buildUpiCredentialMembershipDisplayRows: (results) => buildUpiCredentialMembershipDisplayRows(results),
    });
    const runHistory = accountRecordsRunHistory.createAccountRecordsRunHistory({
      accountRecordsViewModel,
      buildRecordId,
      getRecordDisplayStatus,
      normalizeTimestamp,
      normalizeRetryCount,
    });

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
      return membershipStateSync.getLocallyDeletedRedeemPlusEmailsByChannel();
    }

    function addLocallyDeletedRedeemPlusEmails(channel = 'upi', emails = []) {
      membershipStateSync.addLocallyDeletedRedeemPlusEmails(channel, emails);
    }

    function getLocallyDeletedUpiCredentialMembershipEmails() {
      return membershipStateSync.getLocallyDeletedUpiCredentialMembershipEmails();
    }

    function buildRedeemPlusDeletedEmailSets(value = {}) {
      return membershipStateSync.buildRedeemPlusDeletedEmailSets(value);
    }

    function isRedeemPlusDeletedEmail(email = '', channel = 'upi', deletedEmailSets = {}) {
      return membershipStateSync.isRedeemPlusDeletedEmail(email, channel, deletedEmailSets);
    }

    function isRedeemPlusDeletedDisplayRow(row = {}, deletedEmailSets = {}) {
      return membershipStateSync.isRedeemPlusDeletedDisplayRow(row, deletedEmailSets);
    }

    function isActiveUpiCredentialMembershipRedeemRow(row = {}, results = getUpiCredentialMembershipCheckResults()) {
      return membershipStateSync.isActiveUpiCredentialMembershipRedeemRow(row, results);
    }

    function isActiveUpiCredentialMembershipRedeemRowOrUsage(row = {}, results = getUpiCredentialMembershipCheckResults()) {
      return membershipStateSync.isActiveUpiCredentialMembershipRedeemRowOrUsage(row, results);
    }

    function buildUpiRedeemSuccessMembershipLookup(currentState = state.getLatestState()) {
      return membershipStateSync.buildUpiRedeemSuccessMembershipLookup(currentState);
    }

    function applyUpiRedeemSuccessMembershipPatch(row = {}, lookup = buildUpiRedeemSuccessMembershipLookup()) {
      return membershipStateSync.applyUpiRedeemSuccessMembershipPatch(row, lookup);
    }

    function buildFreeMembershipOverridePatch(checkedAt = new Date().toISOString()) {
      return membershipStateSync.buildFreeMembershipOverridePatch(checkedAt);
    }

    function mergeManualFreeMembershipOverridesIntoResults(results = {}, currentState = state.getLatestState()) {
      return membershipStateSync.mergeManualFreeMembershipOverridesIntoResults(results, currentState);
    }

    function getUpiCredentialMembershipCheckResults(currentState = state.getLatestState()) {
      return membershipStateSync.getUpiCredentialMembershipCheckResults(currentState);
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
      return trialEligibility.normalizeTrialEligibilityStatus(value);
    }

    function isTrialEligibilityChannelAllowed(row = {}, channel = 'upi') {
      return trialEligibility.isTrialEligibilityChannelAllowed(row, channel);
    }

    function getTrialEligibilityChannelBlockedDetail(row = {}, channel = 'upi') {
      return trialEligibility.getTrialEligibilityChannelBlockedDetail(row, channel);
    }

    function buildUpiCredentialMembershipTrialEligibilitySummary(results = {}, rows = []) {
      return trialEligibility.buildUpiCredentialMembershipTrialEligibilitySummary(results, rows);
    }

    function isRedeemableFreeUpiCredentialMembershipRowForChannel(row = {}, channel = 'upi') {
      return trialEligibility.isRedeemableFreeUpiCredentialMembershipRowForChannel(row, channel);
    }

    function isRedeemableFreeUpiCredentialMembershipRow(row = {}) {
      return trialEligibility.isRedeemableFreeUpiCredentialMembershipRow(row);
    }

    function isUpiCredentialMembershipChannelFailureLimitReached(row = {}, channel = 'upi') {
      return trialEligibility.isUpiCredentialMembershipChannelFailureLimitReached(row, channel);
    }

    function getChannelFailureLimitBlockedFreeRows(rows = [], channel = 'upi') {
      return trialEligibility.getChannelFailureLimitBlockedFreeRows(rows, channel);
    }

    function buildNoRedeemableForChannelMessage(channel = 'upi') {
      return trialEligibility.buildNoRedeemableForChannelMessage(channel);
    }

    function getNotRedeemableFreeUpiCredentialMembershipReason(row = {}) {
      return trialEligibility.getNotRedeemableFreeUpiCredentialMembershipReason(row);
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
      return runHistory.isAutoRunRecordDisplayRunning(currentState);
    }

    function buildCurrentAccountRecordId(currentState = {}) {
      return runHistory.buildCurrentAccountRecordId(currentState);
    }

    function applyRunningDisplayState(record = {}, currentState = {}) {
      return runHistory.applyRunningDisplayState(record, currentState);
    }

    function getRecordIdentifierType(record = {}) {
      return runHistory.getRecordIdentifierType(record);
    }

    function getRecordEmail(record = {}) {
      return runHistory.getRecordEmail(record);
    }

    function getRecordPrimaryIdentifier(record = {}) {
      return runHistory.getRecordPrimaryIdentifier(record);
    }

    function getRecordSecondaryIdentifier(record = {}) {
      return runHistory.getRecordSecondaryIdentifier(record);
    }

    function getRecordTitle(record = {}) {
      return runHistory.getRecordTitle(record);
    }

    function getAccountRunRecords(currentState = state.getLatestState()) {
      return runHistory.getAccountRunRecords(currentState);
    }

    function summarizeAccountRunHistory(records = []) {
      return runHistory.summarizeAccountRunHistory(records);
    }

    function getFilterConfig(filterKey = activeFilter) {
      return FILTER_CONFIG[filterKey] || FILTER_CONFIG.all;
    }

    function matchesRecordFilter(record = {}, filterKey = activeFilter) {
      return runHistory.matchesRecordFilter(record, filterKey);
    }

    function getFilteredRecords(records = []) {
      return runHistory.getFilteredRecords(records, activeFilter);
    }

    function pruneSelectedRecordIds(records = []) {
      const availableIds = new Set(records.map((record) => buildRecordId(record)).filter(Boolean));
      for (const recordId of Array.from(selectedRecordIds)) {
        if (!availableIds.has(recordId)) {
          selectedRecordIds.delete(recordId);
        }
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
    const settingsPayload = accountRecordsSettingsPayload.createAccountRecordsSettingsPayload({
      state,
      dom,
      getStoredCdkPoolText: (currentState, channel) => getStoredCdkPoolText(currentState, channel),
    });

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
      return settingsPayload.getMembershipCheckSettingsPayload();
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
        membershipStateSync.clearLocallyDeletedUpiCredentialMembershipEmails();
      },
      clearLocallyDeletedRedeemPlusEmailsByChannel: () => {
        membershipStateSync.clearLocallyDeletedRedeemPlusEmailsByChannel();
      },
      deleteLocallyDeletedUpiCredentialMembershipEmail: (email) => {
        membershipStateSync.deleteLocallyDeletedUpiCredentialMembershipEmail(email);
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
        membershipStateSync.addLocallyDeletedUpiCredentialMembershipEmail(email);
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
