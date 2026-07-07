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

    function getUpiRedeemCdkeyUsageEntryByCdkey(cdkey = '', currentState = state.getLatestState(), channel = 'upi') {
      const targetCdkey = String(cdkey || '').trim();
      if (!targetCdkey) {
        return null;
      }
      const usage = getUpiRedeemCdkeyUsage(currentState, channel);
      if (usage[targetCdkey]) {
        return usage[targetCdkey];
      }
      const targetKey = targetCdkey.toLowerCase();
      const match = Object.entries(usage)
        .find(([rawCdkey]) => String(rawCdkey || '').trim().toLowerCase() === targetKey);
      return match ? match[1] : null;
    }

    function findActiveUpiRedeemCdkeyUsageEntryByEmail(email = '', currentState = state.getLatestState(), channel = '') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      if (!normalizedEmail) {
        return null;
      }
      const channels = channel ? [normalizeRedeemChannel(channel)] : ['upi', 'ideal'];
      for (const currentChannel of channels) {
        const usage = getUpiRedeemCdkeyUsage(currentState, currentChannel);
        const match = Object.entries(usage)
          .find(([, entry]) => {
            const entryEmail = getUpiRedeemUsageEmail(entry);
            return entryEmail === normalizedEmail
              && (
                normalizeUpiCredentialMembershipCapabilityFlag(entry?.canCancel ?? entry?.can_cancel)
                || isActiveUpiRedeemRemoteStatus(entry?.remoteStatus)
                || isActiveUpiRedeemRemoteStatus(entry?.remoteMessage)
              );
          });
        if (match) {
          return { cdkey: match[0], entry: match[1], channel: currentChannel };
        }
      }
      return null;
    }

    function getUpiCredentialMembershipRedeemCdkey(row = {}, currentState = state.getLatestState()) {
      const directCdkey = String(row.upiRedeemCdkey || row.cdkey || '').trim();
      if (directCdkey) {
        return directCdkey;
      }
      const match = findActiveUpiRedeemCdkeyUsageEntryByEmail(row.email, currentState, row.redeemChannel);
      return String(match?.cdkey || '').trim();
    }

    function getUpiCredentialMembershipRedeemCancelControl(row = {}, results = getUpiCredentialMembershipCheckResults()) {
      const currentState = state.getLatestState();
      const cdkey = getUpiCredentialMembershipRedeemCdkey(row, currentState);
      const rowChannel = normalizeRedeemChannel(row.redeemChannel || row.channel);
      const activeMatch = findActiveUpiRedeemCdkeyUsageEntryByEmail(row.email, currentState, rowChannel);
      const usageEntry = getUpiRedeemCdkeyUsageEntryByCdkey(cdkey, currentState, rowChannel)
        || activeMatch?.entry
        || {};
      const channel = activeMatch?.channel || rowChannel;
      const active = isActiveUpiCredentialMembershipRedeemRow(row, results)
        || isActiveUpiRedeemRemoteStatus(usageEntry.remoteStatus)
        || isActiveUpiRedeemRemoteStatus(usageEntry.remoteMessage);
      if (!active) {
        return { visible: false, cdkey: '', canCancel: false, disabled: true, title: '' };
      }
      const backendCanCancel = normalizeUpiCredentialMembershipCapabilityFlag(
        row.canCancel
        ?? row.can_cancel
        ?? usageEntry.canCancel
        ?? usageEntry.can_cancel
      );
      const canCancel = Boolean(backendCanCancel || active);
      const disabled = !cdkey || !canCancel;
      const title = !cdkey
        ? '该账号暂未绑定可取消的 CDK。'
        : canCancel
          ? (backendCanCancel ? `取消该账号绑定的 CDK 任务：${cdkey}` : `尝试取消该账号绑定的活跃 CDK 任务：${cdkey}`)
          : '后端暂未返回该任务可取消，请先刷新 CDK 状态。';
      return {
        visible: true,
        cdkey,
        channel,
        canCancel,
        disabled,
        title,
      };
    }

    function isSelectableUpiRedeemCdkeyUsageEntry(entry = {}) {
      if (!entry || entry.enabled === false) {
        return false;
      }
      const remoteStatus = normalizeUpiRedeemRemoteStatus(entry.remoteStatus);
      const remoteMessageStatus = normalizeUpiRedeemRemoteStatus(entry.remoteMessage);
      if (entry.subscriptionActive === true) {
        return false;
      }
      if (
        remoteStatus === 'success'
        || (
          (remoteStatus === 'pending_dispatch' || remoteMessageStatus === 'pending_dispatch')
          && Boolean(normalizeUpiCredentialMembershipEmail(entry.email) || normalizeUpiCredentialMembershipText(entry.accessToken))
        )
        || remoteStatus === 'invalid'
        || remoteMessageStatus === 'invalid'
        || isActiveUpiRedeemRemoteStatus(remoteStatus)
        || isActiveUpiRedeemRemoteStatus(entry.remoteMessage)
        || entry.retrying === true
      ) {
        return false;
      }
      return true;
    }

    function getAvailableUpiRedeemCdkeyCount(currentState = state.getLatestState(), channel = 'upi') {
      const cdkeys = parseUpiRedeemCdkeyPoolText(getStoredCdkPoolText(currentState, channel));
      return cdkeys.filter((cdkey) => isSelectableUpiRedeemCdkeyUsageEntry(
        getUpiRedeemCdkeyUsageEntryByCdkey(cdkey, currentState, channel) || {}
      )).length;
    }

    function getUpiRedeemUsageEmail(entry = {}) {
      return normalizeUpiCredentialMembershipEmail(
        entry.email
        || entry.accountEmail
        || entry.account_email
        || entry.credentialEmail
        || entry.credential_email
        || entry.targetEmail
        || entry.target_email
        || ''
      );
    }

    function isRemoteRedeemSuccess(cdkey = '', usage = {}) {
      const entry = usage?.[cdkey] || {};
      return normalizeUpiRedeemRemoteStatus(entry.remoteStatus) === 'success';
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

    function openPanel() {
      setNodeHidden(dom.accountRecordsOverlay, false);
      render();
      if (!upiCredentialMembershipPoolLoaded) {
        refreshUpiCredentialMembershipCredentialPool({ silent: true }).catch(() => null);
      }
    }

    function closePanel() {
      setNodeHidden(dom.accountRecordsOverlay, true);
    }

    function resetSelection() {
      selectedRecordIds.clear();
    }

    function setSelectionMode(nextValue) {
      const nextSelectionMode = Boolean(nextValue);
      if (!nextSelectionMode) {
        resetSelection();
      }
      selectionMode = nextSelectionMode;
      currentPage = 1;
      render();
    }

    function toggleSelectionMode() {
      setSelectionMode(!selectionMode);
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

    async function clearRecords() {
      const records = getAccountRunRecords();
      if (!records.length) {
        helpers.showToast?.('没有可清理的账号记录。', 'warn', 1800);
        return;
      }

      const confirmed = await helpers.openConfirmModal({
        title: '清理账号记录',
        message: '确认清理当前全部账号记录吗？该操作会同时清空面板记录与本地同步快照。',
        confirmLabel: '确认清理',
        confirmVariant: 'btn-danger',
      });
      if (!confirmed) {
        return;
      }

      const response = await runtime.sendMessage({
        type: 'CLEAR_ACCOUNT_RUN_HISTORY',
        source: 'sidepanel',
      });
      if (response?.error) {
        throw new Error(response.error);
      }

      activeFilter = 'all';
      currentPage = 1;
      selectionMode = false;
      resetSelection();
      state.syncLatestState({ accountRunHistory: [] });
      helpers.showToast?.(`已清理 ${Math.max(0, Number(response?.clearedCount) || 0)} 条账号记录。`, 'success', 2200);
    }

    async function deleteSelectedRecords() {
      const recordIds = Array.from(selectedRecordIds).filter(Boolean);
      if (!recordIds.length) {
        helpers.showToast?.('请先勾选要删除的账号记录。', 'warn', 1800);
        return;
      }

      const confirmed = await helpers.openConfirmModal({
        title: '删除选中记录',
        message: `确认删除选中的 ${recordIds.length} 条账号记录吗？该操作会同步更新本地 helper 快照。`,
        confirmLabel: '确认删除',
        confirmVariant: 'btn-danger',
      });
      if (!confirmed) {
        return;
      }

      const response = await runtime.sendMessage({
        type: 'DELETE_ACCOUNT_RUN_HISTORY_RECORDS',
        source: 'sidepanel',
        payload: {
          recordIds,
        },
      });
      if (response?.error) {
        throw new Error(response.error);
      }

      const existingRecords = getAccountRunRecords();
      const selectedIds = new Set(recordIds);
      const nextRecords = existingRecords.filter((record) => !selectedIds.has(buildRecordId(record)));

      resetSelection();
      state.syncLatestState({ accountRunHistory: nextRecords });
      helpers.showToast?.(`已删除 ${Math.max(0, Number(response?.deletedCount) || 0)} 条账号记录。`, 'success', 2200);
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

    async function fetchUpiCredentialBackupExportPayload() {
      const response = await runtime.sendMessage({
        type: 'EXPORT_UPI_ACCOUNT_CREDENTIAL_BACKUPS',
        source: 'sidepanel',
        payload: {},
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      return response || {};
    }

    async function fetchUpiCredentialMembershipCredentialPool() {
      const response = await runtime.sendMessage({
        type: 'GET_UPI_CREDENTIAL_MEMBERSHIP_CREDENTIAL_POOL',
        source: 'sidepanel',
        payload: {},
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      return response?.pool || { items: [] };
    }

    async function refreshUpiCredentialMembershipCredentialPool(options = {}) {
      if (upiCredentialMembershipPoolLoading) {
        return upiCredentialMembershipPoolRows;
      }
      upiCredentialMembershipPoolLoading = true;
      try {
        const pool = await fetchUpiCredentialMembershipCredentialPool();
        setUpiCredentialMembershipPoolRows(pool?.items || [], 'local');
        upiCredentialMembershipPoolLoaded = true;
        renderUpiCredentialMembershipCheckResults();
        return upiCredentialMembershipPoolRows;
      } catch (error) {
        if (!options.silent) {
          helpers.showToast?.(`读取 UPI 备份账号核验池失败：${error.message}`, 'error');
        }
        return upiCredentialMembershipPoolRows;
      } finally {
        upiCredentialMembershipPoolLoading = false;
      }
    }

    async function reloadUpiCredentialMembershipAfterRuntimeImport(options = {}) {
      locallyDeletedUpiCredentialMembershipEmails.clear();
      locallyDeletedRedeemPlusEmailsByChannel.upi.clear();
      locallyDeletedRedeemPlusEmailsByChannel.ideal.clear();
      upiCredentialMembershipPoolLoaded = false;
      return refreshUpiCredentialMembershipCredentialPool({
        silent: true,
        ...(options || {}),
      });
    }

    function getEnabledUpiCredentialMembershipPoolRows() {
      return upiCredentialMembershipPoolRows
        .filter((item) => item?.email && !disabledUpiCredentialMembershipEmails.has(item.email))
        .map((item) => ({
          email: item.email,
          password: item.password,
          totpMfaSecret: item.totpMfaSecret,
          accessToken: item.accessToken,
          accessTokenUpdatedAt: item.accessTokenUpdatedAt || item.checkedAt,
        }));
    }

    function getEnabledFreeUpiCredentialMembershipRows() {
      const results = getUpiCredentialMembershipCheckResults();
      return buildUpiCredentialMembershipDisplayRows(results)
        .filter(isRedeemableFreeUpiCredentialMembershipRow)
        .map(buildUpiCredentialMembershipRedeemCredential)
        .filter((row) => row.email);
    }

    function getEnabledFreeUpiCredentialMembershipRowsForChannel(channel = 'upi') {
      const redeemChannel = normalizeRedeemChannel(channel);
      const results = getUpiCredentialMembershipCheckResults();
      return buildUpiCredentialMembershipDisplayRows(results)
        .filter((row) => isRedeemableFreeUpiCredentialMembershipRowForChannel(row, redeemChannel))
        .map(buildUpiCredentialMembershipRedeemCredential)
        .filter((row) => row.email);
    }

    function getIdealFallbackUpiCredentialMembershipRows() {
      const failureLimit = getUpiCredentialMembershipFailureLimit();
      const results = getUpiCredentialMembershipCheckResults();
      return buildUpiCredentialMembershipDisplayRows(results)
        .filter((row) => (
          isRedeemableFreeUpiCredentialMembershipRowForChannel(row, 'ideal')
          && getRedeemChannelFailureCount(row, 'upi') >= failureLimit
          && getRedeemChannelFailureCount(row, 'ideal') < failureLimit
        ))
        .map(buildUpiCredentialMembershipRedeemCredential)
        .filter((row) => row.email);
    }

    function getEnabledFreeUpiCredentialMembershipRowsMissingAt() {
      const results = getUpiCredentialMembershipCheckResults();
      return buildUpiCredentialMembershipDisplayRows(results)
        .filter((row) => {
          return row?.email
            && row.enabled !== false
            && getUpiCredentialMembershipGroup(row) === 'free'
            && !normalizeUpiCredentialMembershipText(row.accessToken);
        })
        .map(buildUpiCredentialMembershipRedeemCredential)
        .filter((row) => row.email);
    }

    function getEnabledFreeUpiCredentialMembershipRowsWithAt() {
      const results = getUpiCredentialMembershipCheckResults();
      return buildUpiCredentialMembershipDisplayRows(results)
        .filter((row) => {
          return row?.email
            && row.enabled !== false
            && getUpiCredentialMembershipGroup(row) === 'free'
            && normalizeUpiCredentialMembershipText(row.accessToken);
        })
        .map(buildUpiCredentialMembershipRedeemCredential)
        .filter((row) => row.email);
    }

    function getEnabledPlusUpiCredentialMembershipRowsWithAt() {
      const results = getUpiCredentialMembershipCheckResults();
      return buildUpiCredentialMembershipDisplayRows(results)
        .filter((row) => {
          return row?.email
            && row.enabled !== false
            && getUpiCredentialMembershipGroup(row) === 'paid'
            && normalizeUpiCredentialMembershipText(row.accessToken);
        })
        .map(buildUpiCredentialMembershipRedeemCredential)
        .filter((row) => row.email);
    }

    function buildUpiCredentialMembershipRedeemCredential(row = {}) {
      const passkeyCredentialId = normalizeUpiCredentialMembershipText(row.passkeyCredentialId || row.credentialId || row.credential_id);
      const passkeyEnabled = row.passkeyEnabled === true || Boolean(passkeyCredentialId);
      const passkeyNumericMetadataPatch = collectUpiCredentialMembershipPasskeyNumericMetadataPatch(row);
      return {
        email: normalizeUpiCredentialMembershipEmail(row.email),
        password: normalizeUpiCredentialMembershipText(row.password),
        gptPassword: normalizeUpiCredentialMembershipText(row.gptPassword || row.password),
        totpMfaSecret: normalizeUpiCredentialMembershipTotpSecret(row.totpMfaSecret),
        passkeyEnabled,
        passkeyEnabledAt: normalizeUpiCredentialMembershipText(row.passkeyEnabledAt),
        passkeyCredentialId,
        passkeyFactorId: normalizeUpiCredentialMembershipText(row.passkeyFactorId || row.factorId || row.factor_id),
        passkeyRpId: normalizeUpiCredentialMembershipText(row.passkeyRpId || row.rpId || row.rp_id),
        passkeyUserHandle: normalizeUpiCredentialMembershipText(row.passkeyUserHandle || row.userHandle || row.user_handle),
        passkeyPrivateJwk: row.passkeyPrivateJwk && typeof row.passkeyPrivateJwk === 'object' && !Array.isArray(row.passkeyPrivateJwk)
          ? row.passkeyPrivateJwk
          : null,
        passkeyPublicKeyCose: normalizeUpiCredentialMembershipText(row.passkeyPublicKeyCose || row.publicKeyCose || row.public_key_cose),
        ...passkeyNumericMetadataPatch,
        passkeyApiPersisted: row.passkeyApiPersisted === true || row.persisted === true,
        accessToken: normalizeUpiCredentialMembershipText(row.accessToken),
        accessTokenUpdatedAt: normalizeUpiCredentialMembershipText(row.accessTokenUpdatedAt || row.checkedAt),
        checkedAt: normalizeUpiCredentialMembershipText(row.checkedAt || row.accessTokenUpdatedAt),
        trialEligibilityStatus: normalizeUpiCredentialMembershipText(row.trialEligibilityStatus),
        trialEligibilityReason: normalizeUpiCredentialMembershipText(row.trialEligibilityReason),
        trialEligibilityCheckedAt: normalizeUpiCredentialMembershipText(row.trialEligibilityCheckedAt),
        trialEligibilityReasonCode: normalizeUpiCredentialMembershipText(row.trialEligibilityReasonCode),
        trialEligibilityCheckedByApi: row.trialEligibilityCheckedByApi === true,
        trialEligibilityTransientFailure: row.trialEligibilityTransientFailure === true,
        trialEligibilityRetryable: row.trialEligibilityRetryable === true,
        trialEligibilityRetryCount: Math.max(0, Math.floor(Number(row.trialEligibilityRetryCount) || 0)),
        trialEligibilityLastError: normalizeUpiCredentialMembershipText(row.trialEligibilityLastError),
        couponState: normalizeUpiCredentialMembershipText(row.couponState),
        registrationType: normalizeUpiCredentialMembershipText(row.registrationType),
        registrationPhone: normalizeUpiCredentialMembershipText(row.registrationPhone),
        phoneVerified: row.phoneVerified === true,
        accountId: normalizeUpiCredentialMembershipText(row.accountId),
        responseEmail: normalizeUpiCredentialMembershipEmail(row.responseEmail),
        jwtExpired: row.jwtExpired === true,
        jwtExpiresInSeconds: Math.max(0, Math.floor(Number(row.jwtExpiresInSeconds) || 0)),
        upiChannelEligibilityStatus: normalizeUpiCredentialMembershipText(row.upiChannelEligibilityStatus),
        upiChannelEligibilityReason: normalizeUpiCredentialMembershipText(row.upiChannelEligibilityReason),
        idealChannelEligibilityStatus: normalizeUpiCredentialMembershipText(row.idealChannelEligibilityStatus),
        idealChannelEligibilityReason: normalizeUpiCredentialMembershipText(row.idealChannelEligibilityReason),
        status: normalizeUpiCredentialMembershipText(row.status),
        planType: normalizeUpiCredentialMembershipText(row.planType),
        redeemStatus: normalizeUpiCredentialMembershipText(row.redeemStatus),
        redeemReason: normalizeUpiCredentialMembershipText(row.redeemReason),
        redeemFailureCount: normalizeRetryCount(row.redeemFailureCount),
        redeemFailureLimit: getUpiCredentialMembershipFailureLimit(row),
        upiRedeemFailureCount: getRedeemChannelFailureCount(row, 'upi'),
        idealRedeemFailureCount: getRedeemChannelFailureCount(row, 'ideal'),
        redeemLocked: isUpiCredentialMembershipRedeemLocked(row),
        redeemLockedReason: getUpiCredentialMembershipRedeemLockReason(row),
        redeemLockedAt: normalizeUpiCredentialMembershipText(row.redeemLockedAt),
        redeemChannel: normalizeUpiCredentialMembershipText(row.redeemChannel || row.channel),
      };
    }

    function buildUpiCredentialMembershipActionCredential(row = {}) {
      const passkeyCredentialId = normalizeUpiCredentialMembershipText(row.passkeyCredentialId || row.credentialId || row.credential_id);
      const passkeyEnabled = row.passkeyEnabled === true || Boolean(passkeyCredentialId);
      const passkeyNumericMetadataPatch = collectUpiCredentialMembershipPasskeyNumericMetadataPatch(row);
      return {
        ...row,
        email: normalizeUpiCredentialMembershipEmail(row.email),
        password: normalizeUpiCredentialMembershipText(row.password),
        gptPassword: normalizeUpiCredentialMembershipText(row.gptPassword || row.password),
        totpMfaSecret: normalizeUpiCredentialMembershipTotpSecret(row.totpMfaSecret),
        passkeyEnabled,
        passkeyEnabledAt: normalizeUpiCredentialMembershipText(row.passkeyEnabledAt),
        passkeyCredentialId,
        passkeyFactorId: normalizeUpiCredentialMembershipText(row.passkeyFactorId || row.factorId || row.factor_id),
        passkeyRpId: normalizeUpiCredentialMembershipText(row.passkeyRpId || row.rpId || row.rp_id),
        passkeyUserHandle: normalizeUpiCredentialMembershipText(row.passkeyUserHandle || row.userHandle || row.user_handle),
        passkeyPrivateJwk: row.passkeyPrivateJwk && typeof row.passkeyPrivateJwk === 'object' && !Array.isArray(row.passkeyPrivateJwk)
          ? row.passkeyPrivateJwk
          : null,
        passkeyPublicKeyCose: normalizeUpiCredentialMembershipText(row.passkeyPublicKeyCose || row.publicKeyCose || row.public_key_cose),
        ...passkeyNumericMetadataPatch,
        passkeyApiPersisted: row.passkeyApiPersisted === true || row.persisted === true,
        accessToken: normalizeUpiCredentialMembershipText(row.accessToken),
        accessTokenUpdatedAt: normalizeUpiCredentialMembershipText(row.accessTokenUpdatedAt || row.checkedAt),
        checkedAt: normalizeUpiCredentialMembershipText(row.checkedAt || row.accessTokenUpdatedAt),
        trialEligibilityStatus: normalizeUpiCredentialMembershipText(row.trialEligibilityStatus),
        trialEligibilityReason: normalizeUpiCredentialMembershipText(row.trialEligibilityReason),
        trialEligibilityCheckedAt: normalizeUpiCredentialMembershipText(row.trialEligibilityCheckedAt),
        trialEligibilityReasonCode: normalizeUpiCredentialMembershipText(row.trialEligibilityReasonCode),
        trialEligibilityCheckedByApi: row.trialEligibilityCheckedByApi === true,
        trialEligibilityTransientFailure: row.trialEligibilityTransientFailure === true,
        trialEligibilityRetryable: row.trialEligibilityRetryable === true,
        trialEligibilityRetryCount: Math.max(0, Math.floor(Number(row.trialEligibilityRetryCount) || 0)),
        trialEligibilityLastError: normalizeUpiCredentialMembershipText(row.trialEligibilityLastError),
        couponState: normalizeUpiCredentialMembershipText(row.couponState),
        registrationType: normalizeUpiCredentialMembershipText(row.registrationType),
        registrationPhone: normalizeUpiCredentialMembershipText(row.registrationPhone),
        phoneVerified: row.phoneVerified === true,
        accountId: normalizeUpiCredentialMembershipText(row.accountId),
        responseEmail: normalizeUpiCredentialMembershipEmail(row.responseEmail),
        jwtExpired: row.jwtExpired === true,
        jwtExpiresInSeconds: Math.max(0, Math.floor(Number(row.jwtExpiresInSeconds) || 0)),
        upiChannelEligibilityStatus: normalizeUpiCredentialMembershipText(row.upiChannelEligibilityStatus),
        upiChannelEligibilityReason: normalizeUpiCredentialMembershipText(row.upiChannelEligibilityReason),
        idealChannelEligibilityStatus: normalizeUpiCredentialMembershipText(row.idealChannelEligibilityStatus),
        idealChannelEligibilityReason: normalizeUpiCredentialMembershipText(row.idealChannelEligibilityReason),
        status: normalizeUpiCredentialMembershipText(row.status),
        planType: normalizeUpiCredentialMembershipText(row.planType),
      };
    }

    function getUpiCredentialMembershipSingleRedeemRow(email = '') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      if (!normalizedEmail) {
        return null;
      }
      const results = getUpiCredentialMembershipCheckResults();
      return buildUpiCredentialMembershipDisplayRows(results)
        .find((row) => normalizeUpiCredentialMembershipEmail(row.email) === normalizedEmail) || null;
    }

    function isUpiCredentialMembershipRedeemStatusRefreshable(row = {}) {
      const redeemStatus = normalizeUpiRedeemRemoteStatus(row.redeemStatus || row.remoteStatus);
      return Boolean(
        row.upiRedeemCdkey
        || row.cdkey
        || isActiveUpiRedeemRemoteStatus(redeemStatus)
        || ['canceled', 'failed', 'timeout', 'not_found', 'approve_blocked', 'invalid', 'rejected'].includes(redeemStatus)
      );
    }

    function getUpiRedeemUsageRelatedEmail(entry = {}) {
      return normalizeUpiCredentialMembershipEmail(
        getUpiRedeemUsageEmail(entry)
        || entry.releasedEmail
        || entry.approveBlockedEmail
        || entry.lastFailedEmail
        || ''
      );
    }

    function buildUpiCredentialMembershipRedeemStatusRefreshTargets(rows = []) {
      const currentState = state.getLatestState();
      const targets = {
        upi: new Set(),
        ideal: new Set(),
      };
      const emailMap = {
        upi: {},
        ideal: {},
      };
      const unresolvedChannels = {
        upi: false,
        ideal: false,
      };
      const refreshableEmails = new Set();
      const addCdkey = (channel = 'upi', cdkey = '', email = '') => {
        const normalizedChannel = normalizeRedeemChannel(channel);
        const normalizedCdkey = String(cdkey || '').trim();
        if (normalizedCdkey) {
          targets[normalizedChannel].add(normalizedCdkey);
          const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
          if (normalizedEmail && !emailMap[normalizedChannel][normalizedCdkey]) {
            emailMap[normalizedChannel][normalizedCdkey] = normalizedEmail;
          }
        }
      };

      (Array.isArray(rows) ? rows : []).forEach((row) => {
        const rowChannel = normalizeRedeemChannel(row?.redeemChannel || row?.channel);
        const cdkey = getUpiCredentialMembershipRedeemCdkey(row, currentState);
        if (isUpiCredentialMembershipRedeemStatusRefreshable(row)) {
          const rowEmail = normalizeUpiCredentialMembershipEmail(row?.email);
          if (rowEmail) {
            refreshableEmails.add(rowEmail);
          }
          if (cdkey) {
            addCdkey(rowChannel, cdkey, row.email);
          } else {
            unresolvedChannels[rowChannel] = true;
          }
        }
      });

      ['upi', 'ideal'].forEach((channel) => {
        const usage = getUpiRedeemCdkeyUsage(currentState, channel);
        Object.entries(usage).forEach(([cdkey, entry]) => {
          const relatedEmail = getUpiRedeemUsageRelatedEmail(entry);
          const remoteStatus = normalizeUpiRedeemRemoteStatus(entry?.remoteStatus || entry?.remoteMessage);
          if (
            relatedEmail
            && refreshableEmails.has(relatedEmail)
            && (
              isActiveUpiRedeemRemoteStatus(remoteStatus)
              || ['canceled', 'failed', 'timeout', 'not_found', 'approve_blocked', 'invalid', 'rejected'].includes(remoteStatus)
            )
          ) {
            addCdkey(channel, cdkey, relatedEmail);
          }
        });
        if (unresolvedChannels[channel]) {
          parseUpiRedeemCdkeyPoolText(getStoredCdkPoolText(currentState, channel))
            .forEach((cdkey) => addCdkey(channel, cdkey));
        }
      });

      const cdkCount = targets.upi.size + targets.ideal.size;
      const emailCount = refreshableEmails.size;
      return {
        upi: Array.from(targets.upi),
        ideal: Array.from(targets.ideal),
        emailMap,
        emailCount,
        cdkCount,
        total: emailCount,
      };
    }

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

    async function refreshRemoteRedeemStatusesForExport(records = []) {
      const cdkeys = getUpiRedeemSuccessExportCdkeys(records);
      if (!cdkeys.length) {
        return null;
      }
      const response = await runtime.sendMessage({
        type: 'REFRESH_UPI_REDEEM_CDKEY_STATUSES',
        source: 'sidepanel',
        payload: { cdkeys, skipAutoRetry: true },
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      if (response?.updates) {
        state.syncLatestState(response.updates);
      }
      return response;
    }

    async function checkPaidSubscriptionStatusesForExport(records = [], options = {}) {
      const items = getUpiRedeemSuccessExportSubscriptionItems(records, options);
      if (!items.length) {
        return { items: [] };
      }
      const response = await runtime.sendMessage({
        type: 'CHECK_UPI_REDEEM_SUBSCRIPTION_STATUSES',
        source: 'sidepanel',
        payload: { items },
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      return response || { items: [] };
    }

    async function exportUpiRedeemSuccessEmailTextFile() {
      const candidateRecords = getAccountRunRecords();
      const candidateRows = buildUpiRedeemSuccessEmailExportRows(candidateRecords);
      if (!candidateRows.length) {
        const summary = summarizeUpiRedeemSuccessExportEligibility(candidateRecords, {
          usage: getUpiRedeemCdkeyUsage(),
        });
        helpers.showToast?.(buildUpiRedeemSuccessExportBlockedMessage(summary), 'warn', 2600);
        return;
      }
      if (typeof helpers.downloadTextFile !== 'function') {
        helpers.showToast?.('当前环境不支持导出 TXT。', 'error');
        return;
      }
      try {
        setExportButtonsBusy(true);
        await refreshRemoteRedeemStatusesForExport(candidateRecords);
        const latestRecords = getAccountRunRecords();
        const latestUsage = getUpiRedeemCdkeyUsage();
        const rows = buildUpiRedeemSuccessEmailExportRows(latestRecords, {
          usage: latestUsage,
          requireRemoteSuccess: true,
        });
        if (!rows.length) {
          const summary = summarizeUpiRedeemSuccessExportEligibility(latestRecords, {
            usage: latestUsage,
          });
          helpers.showToast?.(buildUpiRedeemSuccessExportBlockedMessage(summary), 'warn', 3200);
          return;
        }
        const downloadResult = await helpers.downloadTextFile(`${rows.join('\n')}\n`, buildUpiRedeemSuccessEmailExportFileName(), 'text/plain;charset=utf-8');
        if (downloadResult?.cancelled) {
          helpers.showToast?.('已取消导出兑换成功邮箱 2FA。', 'info', 1800);
          return;
        }
        helpers.showToast?.(`已按远端 CDK 状态导出 ${rows.length} 条兑换成功邮箱 2FA。`, 'success', 2200);
      } catch (error) {
        helpers.showToast?.(`导出兑换成功邮箱 2FA 失败：${error.message}`, 'error');
      } finally {
        setExportButtonsBusy(false);
        render();
      }
    }

    async function exportUpiCredentialBackupTextFile() {
      if (typeof helpers.downloadTextFile !== 'function') {
        helpers.showToast?.('当前环境不支持导出 TXT。', 'error');
        return;
      }
      try {
        setExportButtonsBusy(true);
        const response = await fetchUpiCredentialBackupExportPayload();
        if (!response?.fileContent || !response?.fileName) {
          helpers.showToast?.('没有已保存的 UPI 密码 2FA 备份。', 'warn', 2600);
          return;
        }
        const downloadResult = await helpers.downloadTextFile(response.fileContent, response.fileName, 'text/plain;charset=utf-8');
        if (downloadResult?.cancelled) {
          helpers.showToast?.('已取消导出已保存密码 2FA。', 'info', 1800);
          return;
        }
        helpers.showToast?.(`已导出 ${response.count || 0} 条已保存密码 2FA 备份。`, 'success', 2200);
      } catch (error) {
        helpers.showToast?.(`导出已保存密码 2FA 失败：${error.message}`, 'error');
      } finally {
        setExportButtonsBusy(false);
        render();
      }
    }

    async function showUpiCredentialBackupText() {
      try {
        setExportButtonsBusy(true);
        const response = await fetchUpiCredentialBackupExportPayload();
        upiCredentialBackupPreviewVisible = true;
        setUpiCredentialBackupPreviewText(response?.fileContent || '');
        setUpiCredentialMembershipPoolRows(parseUpiCredentialMembershipText(response?.fileContent || ''), 'local');
        upiCredentialMembershipPoolLoaded = true;
        if (!response?.fileContent) {
          helpers.showToast?.('没有已保存的 UPI 密码 2FA 备份。', 'warn', 2600);
          return;
        }
        helpers.showToast?.(`已显示 ${response.count || 0} 条已保存密码 2FA。`, 'success', 1800);
      } catch (error) {
        helpers.showToast?.(`读取已保存密码 2FA 失败：${error.message}`, 'error');
      } finally {
        setExportButtonsBusy(false);
        render();
      }
    }

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

    async function startUpiCredentialMembershipCheck(payload = {}) {
      try {
        upiCredentialMembershipCheckBusy = true;
        setExportButtonsBusy(false);
        const response = await runtime.sendMessage({
          type: 'CHECK_UPI_CREDENTIAL_MEMBERSHIP_BATCH',
          source: 'sidepanel',
          payload: {
            ...payload,
            settings: getMembershipCheckSettingsPayload(),
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          state.syncLatestState({
            upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(response.results),
          });
        }
        const results = response?.results || getUpiCredentialMembershipCheckResults();
        helpers.showToast?.(`核验完成：有会员 ${results.paidCount || 0}，无会员 ${results.freeCount || 0}，失败 ${results.failedCount || 0}。`, 'success', 2600);
      } catch (error) {
        helpers.showToast?.(`UPI 备份账号会员核验失败：${error.message}`, 'error');
      } finally {
        upiCredentialMembershipCheckBusy = false;
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        setExportButtonsBusy(false);
        render();
      }
    }

    async function startLocalUpiCredentialMembershipCheck() {
      await refreshUpiCredentialMembershipCredentialPool({ silent: true });
      const credentials = getEnabledUpiCredentialMembershipPoolRows();
      if (!credentials.length) {
        helpers.showToast?.('没有启用的 UPI 备份账号可核验。', 'warn', 2000);
        return;
      }
      await startUpiCredentialMembershipCheck({ source: 'local-selected', credentials });
    }

    async function readTextFile(file) {
      if (!file) return '';
      if (typeof file.text === 'function') {
        return await file.text();
      }
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(reader.error || new Error('读取 TXT 文件失败。'));
        reader.readAsText(file, 'utf-8');
      });
    }

    function mergeUpiCredentialMembershipFreeImportPoolRows(credentials = []) {
      const currentResults = getUpiCredentialMembershipCheckResults();
      const protectedEmails = new Set(
        buildUpiCredentialMembershipDisplayRows(currentResults)
          .filter((row) => {
            const status = String(row.status || '').trim().toLowerCase();
            return status === 'paid' || isActiveUpiCredentialMembershipRedeemRowOrUsage(row, currentResults);
          })
          .map((row) => normalizeUpiCredentialMembershipEmail(row.email))
          .filter(Boolean)
      );
      const byEmail = {};
      upiCredentialMembershipPoolRows.forEach((row) => {
        const email = normalizeUpiCredentialMembershipEmail(row?.email);
        if (email) {
          byEmail[email] = row;
        }
      });
      (Array.isArray(credentials) ? credentials : []).forEach((credential) => {
        const email = normalizeUpiCredentialMembershipEmail(credential?.email);
        if (!email || protectedEmails.has(email)) {
          return;
        }
        byEmail[email] = {
          ...(byEmail[email] || {}),
          ...credential,
          email,
          source: 'txt-free',
        };
      });
      return Object.values(byEmail);
    }

    async function importUpiCredentialMembershipFreeText(text = '') {
      const credentials = parseUpiCredentialMembershipText(text);
      const importedEmailSet = new Set(
        credentials
          .map((credential) => normalizeUpiCredentialMembershipEmail(credential?.email))
          .filter(Boolean)
      );
      importedEmailSet.forEach((email) => {
        locallyDeletedUpiCredentialMembershipEmails.delete(email);
      });
      setUpiCredentialMembershipPoolRows(mergeUpiCredentialMembershipFreeImportPoolRows(credentials), 'txt-free');
      upiCredentialMembershipPoolLoaded = true;
      const response = await runtime.sendMessage({
        type: 'IMPORT_UPI_CREDENTIAL_MEMBERSHIP_FREE_RESULTS',
        source: 'sidepanel',
        payload: {
          source: 'txt-free',
          text,
        },
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      const results = response?.results || {
        items: credentials.map((credential) => ({
          ...credential,
          status: 'free',
          planType: 'free',
          reason: '待兑换',
        })),
        source: 'txt-free',
      };
      const restoredEmails = Array.isArray(response?.restoredEmails || response?.results?.restoredEmails)
        ? (response?.restoredEmails || response?.results?.restoredEmails)
        : [];
      restoredEmails
        .map(normalizeUpiCredentialMembershipEmail)
        .filter(Boolean)
        .forEach((email) => locallyDeletedUpiCredentialMembershipEmails.delete(email));
      state.syncLatestState({ upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(results) });
      renderUpiCredentialMembershipCheckResults();
      const importedCountValue = response?.importedCount ?? response?.results?.importedCount;
      const restoredCountValue = response?.restoredCount ?? response?.results?.restoredCount;
      return {
        results,
        importedCount: importedCountValue === undefined
          ? credentials.length
          : Math.max(0, Math.floor(Number(importedCountValue) || 0)),
        restoredCount: restoredCountValue === undefined
          ? 0
          : Math.max(0, Math.floor(Number(restoredCountValue) || 0)),
        skippedCount: Math.floor(Number(response?.skippedCount ?? response?.results?.skippedCount) || 0),
      };
    }

    function openUpiCredentialMembershipTxtImport(mode = 'check') {
      if (dom.inputUpiCredentialMembershipTxt?.dataset) {
        dom.inputUpiCredentialMembershipTxt.dataset.membershipImportMode = mode === 'free' ? 'free' : 'check';
      }
      dom.inputUpiCredentialMembershipTxt?.click?.();
    }

    async function handleUpiCredentialMembershipTxtSelected(event) {
      const file = event?.target?.files?.[0] || null;
      const importMode = String(event?.target?.dataset?.membershipImportMode || 'check').trim().toLowerCase();
      if (event?.target) {
        event.target.value = '';
        event.target.dataset.membershipImportMode = 'check';
      }
      if (!file) return;
      try {
        const text = await readTextFile(file);
        if (!text.trim()) {
          helpers.showToast?.('导入的 TXT 为空。', 'warn', 1800);
          return;
        }
        if (importMode === 'free') {
          const importResult = await importUpiCredentialMembershipFreeText(text);
          const details = [
            importResult.restoredCount ? `恢复 ${importResult.restoredCount} 条已删除账号` : '',
            importResult.skippedCount ? `跳过 ${importResult.skippedCount} 条 Plus/处理中账号` : '',
          ].filter(Boolean).join('，');
          helpers.showToast?.(
            `已导入 Free ${importResult.importedCount || 0} 条账号${details ? `，${details}` : ''}，可补充 AT 或直接兑换。`,
            'success',
            2600
          );
          return;
        }
        const credentials = parseUpiCredentialMembershipText(text);
        setUpiCredentialMembershipPoolRows(credentials, 'txt');
        upiCredentialMembershipPoolLoaded = true;
        renderUpiCredentialMembershipCheckResults();
        await startUpiCredentialMembershipCheck({ source: 'txt', text });
      } catch (error) {
        helpers.showToast?.(`读取备份 TXT 失败：${error.message}`, 'error');
      }
    }

    async function stopUpiCredentialMembershipCheck() {
      try {
        const response = await runtime.sendMessage({
          type: 'STOP_UPI_CREDENTIAL_MEMBERSHIP_CHECK',
          source: 'sidepanel',
          payload: {},
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          state.syncLatestState({
            upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(response.results),
          });
        }
        upiCredentialMembershipCheckBusy = false;
        helpers.showToast?.('已停止 UPI 备份账号会员核验。', 'warn', 1800);
      } catch (error) {
        helpers.showToast?.(`停止核验失败：${error.message}`, 'error');
      } finally {
        setExportButtonsBusy(false);
        render();
      }
    }

    async function resumeFreeRedeemAfterCdkImport(options = {}) {
      const currentState = state.getLatestState();
      const results = getUpiCredentialMembershipCheckResults();
      if (
        upiCredentialMembershipCheckBusy
        || upiCredentialMembershipRedeemBusy
        || upiCredentialMembershipAllRedeemBusy
        || results.running === true
        || results.redeeming === true
        || isAutoRunRecordDisplayRunning(currentState)
      ) {
        return { started: false, reason: 'busy' };
      }
      const redeemChannel = normalizeRedeemChannel(options.channel || options.redeemChannel);
      if (getAvailableUpiRedeemCdkeyCount(currentState, redeemChannel) <= 0) {
        return { started: false, reason: 'no-cdk' };
      }
      const credentials = getEnabledFreeUpiCredentialMembershipRowsForChannel(redeemChannel);
      if (!credentials.length) {
        return { started: false, reason: 'no-free-credentials' };
      }
      await startUpiCredentialMembershipFreeRedeem(credentials, {
        source: options.source || 'cdk-import-resume',
        channel: redeemChannel,
      });
      return { started: true, count: credentials.length };
    }

    async function stopUpiCredentialMembershipRedeem() {
      try {
        const response = await runtime.sendMessage({
          type: 'STOP_UPI_CREDENTIAL_MEMBERSHIP_REDEEM',
          source: 'sidepanel',
          payload: {},
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          state.syncLatestState({
            upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(response.results),
          });
        }
        upiCredentialMembershipRedeemBusy = false;
        helpers.showToast?.('已停止 UPI Free 账号兑换。', 'warn', 1800);
      } catch (error) {
        helpers.showToast?.(`停止兑换失败：${error.message}`, 'error');
      } finally {
        setExportButtonsBusy(false);
        render();
      }
    }

    async function exportUpiCredentialMembershipCheckResultTextFile(status = 'paid') {
      const rawStatus = String(status || '').trim().toLowerCase() || 'paid';
      const payloadStatus = rawStatus === 'paid-upi' || rawStatus === 'paid-ideal' || rawStatus === 'paid-all'
        ? rawStatus
        : status;
      const normalizedStatus = rawStatus === 'paid-upi' || rawStatus === 'paid-ideal' || rawStatus === 'paid-all'
        ? 'paid'
        : rawStatus;
      const targetChannel = rawStatus === 'paid-upi'
        ? 'upi'
        : rawStatus === 'paid-ideal'
          ? 'ideal'
          : '';
      if (typeof helpers.downloadTextFile !== 'function') {
        helpers.showToast?.('当前环境不支持导出 TXT。', 'error');
        return;
      }
      try {
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        const visibleResults = getUpiCredentialMembershipCheckResults();
        const visibleRows = buildUpiCredentialMembershipDisplayRows(visibleResults)
          .filter((item) => isUpiCredentialMembershipRowInResultGroup(item, normalizedStatus, targetChannel));
        const exportEmails = visibleRows
          .map((item) => normalizeUpiCredentialMembershipEmail(item?.email))
          .filter(Boolean);
        if (!exportEmails.length) {
          helpers.showToast?.(`${getMembershipStatusTitle(rawStatus)} 分组没有可导出的记录。`, 'warn', 1800);
          return;
        }
        const response = await runtime.sendMessage({
          type: 'EXPORT_UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS',
          source: 'sidepanel',
          payload: { status: payloadStatus, emails: exportEmails, removeAfterExport: false },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (!response?.fileContent || !response?.fileName) {
          helpers.showToast?.(`${getMembershipStatusTitle(rawStatus)} 分组没有可导出的记录。`, 'warn', 1800);
          return;
        }
        const downloadResult = await helpers.downloadTextFile(response.fileContent, response.fileName, 'text/plain;charset=utf-8');
        if (downloadResult?.cancelled) {
          helpers.showToast?.(`已取消导出${getMembershipStatusTitle(rawStatus)}记录。`, 'info', 1800);
          return;
        }
        if (response?.results) {
          state.syncLatestState({
            upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(response.results),
          });
        }
        helpers.showToast?.(
          `已导出 ${response.count || 0} 条${getMembershipStatusTitle(rawStatus)}记录。`,
          'success',
          2200
        );
        render();
      } catch (error) {
        helpers.showToast?.(`导出核验结果失败：${error.message}`, 'error');
      }
    }

    async function deleteUpiCredentialMembershipResultGroup(status = 'paid') {
      const rawStatus = String(status || '').trim().toLowerCase() || 'paid';
      const normalizedStatus = rawStatus === 'paid-upi' || rawStatus === 'paid-ideal' ? 'paid' : rawStatus;
      const targetChannel = rawStatus === 'paid-upi'
        ? 'upi'
        : rawStatus === 'paid-ideal'
          ? 'ideal'
          : '';
      const results = getUpiCredentialMembershipCheckResults();
      const targetItems = buildUpiCredentialMembershipDisplayRows(results)
        .filter((item) => isUpiCredentialMembershipRowInResultGroup(item, normalizedStatus, targetChannel));
      const blockedItems = targetItems.filter((item) => isActiveUpiCredentialMembershipRedeemRowOrUsage(item, results));
      const safeItems = targetItems.filter((item) => !isActiveUpiCredentialMembershipRedeemRowOrUsage(item, results));
      const safeEmails = safeItems
        .map((item) => normalizeUpiCredentialMembershipEmail(item?.email))
        .filter(Boolean);
      const count = targetItems.length;
      if (!count) {
        helpers.showToast?.(`${getMembershipStatusTitle(rawStatus)} 分组没有可删除的记录。`, 'warn', 1800);
        return;
      }
      if (!safeEmails.length) {
        helpers.showToast?.('正在兑换或等待远端结果的账号不能删除，请先取消对应 CDK 任务。', 'warn', 2600);
        return;
      }

      const confirmed = typeof helpers.openConfirmModal === 'function'
        ? await helpers.openConfirmModal({
          title: `删除${getMembershipStatusTitle(rawStatus)}分组`,
          message: `确认从当前核验结果中删除 ${safeEmails.length} 条${getMembershipStatusTitle(rawStatus)}记录吗？该操作只清理当前结果列表，不删除本地密码/2FA 备份。${blockedItems.length ? ` 将跳过 ${blockedItems.length} 条正在兑换或等待远端结果的账号。` : ''}`,
          confirmLabel: '确认删除',
          confirmVariant: 'btn-danger',
        })
        : true;
      if (!confirmed) {
        return;
      }

      try {
        const response = await runtime.sendMessage({
          type: 'DELETE_UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS',
          source: 'sidepanel',
          payload: { status: normalizedStatus, channel: targetChannel, emails: safeEmails },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        const stateUpdates = {};
        if (response?.results) {
          stateUpdates.upiCredentialMembershipCheckResults = mergeManualFreeMembershipOverridesIntoResults(response.results);
        }
        if (response?.updates && typeof response.updates === 'object') {
          Object.assign(stateUpdates, response.updates);
        }
        if (Object.keys(stateUpdates).length) {
          state.syncLatestState(stateUpdates);
        }
        const responseDeletedEmails = Array.isArray(response?.deletedEmails)
          ? response.deletedEmails.map(normalizeUpiCredentialMembershipEmail).filter(Boolean)
          : safeEmails;
        if (responseDeletedEmails.length && normalizedStatus === 'free') {
          const deletedSet = new Set(responseDeletedEmails);
          responseDeletedEmails.forEach((email) => locallyDeletedUpiCredentialMembershipEmails.add(email));
          setUpiCredentialMembershipPoolRows(
            upiCredentialMembershipPoolRows.filter((item) => !deletedSet.has(normalizeUpiCredentialMembershipEmail(item.email))),
            upiCredentialMembershipPoolSource
          );
          responseDeletedEmails.forEach((email) => disabledUpiCredentialMembershipEmails.delete(email));
        } else if (responseDeletedEmails.length && normalizedStatus === 'paid' && targetChannel) {
          addLocallyDeletedRedeemPlusEmails(targetChannel, responseDeletedEmails);
          responseDeletedEmails.forEach((email) => disabledUpiCredentialMembershipEmails.delete(email));
        }
        const skippedCount = Math.max(blockedItems.length, Math.floor(Number(response?.skippedCount) || 0));
        helpers.showToast?.(
          `已删除 ${response?.deletedCount || 0} 条${getMembershipStatusTitle(rawStatus)}分组记录${skippedCount ? `，跳过 ${skippedCount} 条处理中账号` : ''}。`,
          'success',
          2200
        );
      } catch (error) {
        helpers.showToast?.(`删除${getMembershipStatusTitle(rawStatus)}分组失败：${error.message}`, 'error');
      } finally {
        render();
      }
    }

    async function deleteUpiCredentialMembershipCredential(email = '', channel = '') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      if (!normalizedEmail) {
        return;
      }
      const currentResults = getUpiCredentialMembershipCheckResults();
      const requestedChannel = normalizeUpiCredentialMembershipText(channel);
      const row = getUpiCredentialMembershipDisplayRowByEmail(normalizedEmail, requestedChannel);
      if (row && isActiveUpiCredentialMembershipRedeemRowOrUsage(row, currentResults)) {
        helpers.showToast?.('正在兑换或等待远端结果的账号不能删除，请先取消对应 CDK 任务。', 'warn', 2600);
        return;
      }
      const rowStatus = String(row?.status || '').trim().toLowerCase();
      const deleteStatus = rowStatus === 'paid' ? 'paid' : 'free';
      const deleteChannel = rowStatus === 'paid'
        ? normalizeRedeemChannel(requestedChannel || row?.redeemChannel || row?.channel)
        : '';
      try {
        const response = await runtime.sendMessage({
          type: 'DELETE_UPI_CREDENTIAL_MEMBERSHIP_CHECK_RESULTS',
          source: 'sidepanel',
          payload: {
            status: deleteStatus,
            channel: deleteChannel,
            emails: [normalizedEmail],
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        const skippedCount = Math.floor(Number(response?.skippedCount) || 0);
        const deletedEmails = Array.isArray(response?.deletedEmails)
          ? response.deletedEmails.map(normalizeUpiCredentialMembershipEmail).filter(Boolean)
          : (Number(response?.deletedCount) > 0 ? [normalizedEmail] : []);
        if (deletedEmails.length) {
          const deletedSet = new Set(deletedEmails);
          if (deleteStatus === 'free') {
            deletedEmails.forEach((email) => locallyDeletedUpiCredentialMembershipEmails.add(email));
          } else if (deleteStatus === 'paid' && deleteChannel) {
            addLocallyDeletedRedeemPlusEmails(deleteChannel, deletedEmails);
          }
          deletedEmails.forEach((email) => disabledUpiCredentialMembershipEmails.delete(email));
          if (deleteStatus === 'free') {
            setUpiCredentialMembershipPoolRows(
              upiCredentialMembershipPoolRows.filter((item) => !deletedSet.has(normalizeUpiCredentialMembershipEmail(item.email))),
              upiCredentialMembershipPoolSource
            );
          }
        }
        const stateUpdates = {};
        if (response?.results) {
          stateUpdates.upiCredentialMembershipCheckResults = mergeManualFreeMembershipOverridesIntoResults(response.results);
        }
        if (response?.updates && typeof response.updates === 'object') {
          Object.assign(stateUpdates, response.updates);
        }
        if (Object.keys(stateUpdates).length) {
          state.syncLatestState(stateUpdates);
        }
        if (skippedCount || !deletedEmails.length) {
          helpers.showToast?.(`${normalizedEmail} 正在兑换或等待远端结果，已跳过删除。`, 'warn', 2200);
        } else {
          helpers.showToast?.(
            `已从当前 ${getMembershipStatusTitle(deleteStatus === 'paid' && deleteChannel ? `paid-${deleteChannel}` : deleteStatus)} 分组删除 ${normalizedEmail}`,
            'success',
            1800
          );
        }
      } catch (error) {
        helpers.showToast?.(`删除 UPI 核验账号失败：${error.message}`, 'error');
      } finally {
        render();
      }
    }

    function getUpiCredentialMembershipDisplayRowByEmail(email = '', channel = '') {
      const targetEmail = normalizeUpiCredentialMembershipEmail(email);
      if (!targetEmail) {
        return null;
      }
      const requestedChannel = normalizeUpiCredentialMembershipText(channel);
      const rows = buildUpiCredentialMembershipDisplayRows()
        .filter((row) => normalizeUpiCredentialMembershipEmail(row.email) === targetEmail);
      if (requestedChannel) {
        const targetChannel = normalizeRedeemChannel(requestedChannel);
        const channelMatchedRow = rows.find((row) => normalizeRedeemChannel(row.redeemChannel || row.channel) === targetChannel);
        if (channelMatchedRow) {
          return channelMatchedRow;
        }
      }
      return rows[0] || null;
    }

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

    async function checkOneUpiCredentialMembership(email = '') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      if (!normalizedEmail || upiCredentialMembershipCheckingEmail) {
        return;
      }
      const row = getUpiCredentialMembershipDisplayRowByEmail(normalizedEmail);
      if (!row) {
        helpers.showToast?.(`未找到账号 ${normalizedEmail}`, 'warn', 1800);
        return;
      }
      if (!row.password || !row.totpMfaSecret) {
        helpers.showToast?.(`账号 ${normalizedEmail} 缺少密码或 2FA，无法检测。`, 'error');
        return;
      }
      upiCredentialMembershipCheckingEmail = normalizedEmail;
      render();
      let completedSingleCheckItem = null;
      try {
        const response = await runtime.sendMessage({
          type: 'CHECK_UPI_CREDENTIAL_MEMBERSHIP_ONE',
          source: 'sidepanel',
          payload: {
            email: normalizedEmail,
            source: 'single',
            settings: getMembershipCheckSettingsPayload(),
            credential: {
              email: normalizedEmail,
              password: row.password,
              totpMfaSecret: row.totpMfaSecret,
            },
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.results) {
          state.syncLatestState({
            upiCredentialMembershipCheckResults: mergeManualFreeMembershipOverridesIntoResults(response.results),
          });
        }
        const item = response?.item || {};
        completedSingleCheckItem = item?.email ? item : null;
        mergeUpiCredentialMembershipResultItem(item);
        const status = String(item.status || '').trim().toLowerCase();
        if (status === 'paid') {
          helpers.showToast?.(`${normalizedEmail} 已开通 ${getMembershipPlanLabel(item.planType)}。`, 'success', 2200);
        } else if (status === 'free') {
          helpers.showToast?.(`${normalizedEmail} 当前无会员。`, 'warn', 2200);
        } else {
          helpers.showToast?.(`${normalizedEmail} 检测失败：${item.reason || '未知错误'}`, 'error');
        }
      } catch (error) {
        helpers.showToast?.(`检测 ${normalizedEmail} 失败：${error.message}`, 'error');
      } finally {
        upiCredentialMembershipCheckingEmail = '';
        await refreshUpiCredentialMembershipCheckResults().catch(() => null);
        if (completedSingleCheckItem) {
          mergeUpiCredentialMembershipResultItem(completedSingleCheckItem);
        }
        render();
      }
    }

    function handleStatsClick(event) {
      const filterNode = findClosest(event?.target, '[data-account-record-filter]');
      if (!filterNode) {
        return;
      }

      const nextFilter = getDatasetValue(filterNode, 'data-account-record-filter');
      if (!FILTER_CONFIG[nextFilter]) {
        return;
      }

      activeFilter = activeFilter === nextFilter && nextFilter !== 'all'
        ? 'all'
        : nextFilter;
      currentPage = 1;
      render();
    }

    function handleRecordListClick(event) {
      if (!selectionMode) {
        return;
      }

      const toggleNode = findClosest(event?.target, '[data-account-record-toggle]');
      if (toggleNode) {
        const recordId = getDatasetValue(toggleNode, 'data-account-record-toggle');
        const explicitChecked = typeof event?.target?.checked === 'boolean' ? event.target.checked : null;
        toggleRecordSelection(recordId, explicitChecked);
        render();
        return;
      }

      const recordNode = findClosest(event?.target, '[data-account-record-id]');
      if (!recordNode) {
        return;
      }

      toggleRecordSelection(getDatasetValue(recordNode, 'data-account-record-id'));
      render();
    }

    function handleUpiCredentialMembershipCheckResultsClick(event) {
      const groupNode = findClosest(event?.target, '[data-upi-membership-group]');
      if (groupNode) {
        const nextGroup = getDatasetValue(groupNode, 'data-upi-membership-group') === 'paid' ? 'paid' : 'free';
        if (upiCredentialMembershipGroup !== nextGroup) {
          upiCredentialMembershipGroup = nextGroup;
          renderUpiCredentialMembershipCheckResults();
        }
        return;
      }

      const checkOneNode = findClosest(event?.target, '[data-upi-membership-check-one]');
      if (checkOneNode) {
        const email = getDatasetValue(checkOneNode, 'data-upi-membership-check-one');
        checkOneUpiCredentialMembership(email);
        return;
      }

      const fillFreeAtNode = findClosest(event?.target, '[data-upi-membership-fill-free-at]');
      if (fillFreeAtNode) {
        fillFreeUpiCredentialMembershipAccessTokens();
        return;
      }

      const identifyFreePlusNode = findClosest(event?.target, '[data-upi-membership-identify-free-plus]');
      if (identifyFreePlusNode) {
        identifyFreeUpiCredentialMembershipPlus();
        return;
      }

      const verifyPlusNode = findClosest(event?.target, '[data-upi-membership-verify-plus]');
      if (verifyPlusNode) {
        verifyPlusUpiCredentialMembershipRows();
        return;
      }

      const loginNode = findClosest(event?.target, '[data-upi-membership-login]');
      if (loginNode) {
        loginUpiCredentialMembershipAccount(getDatasetValue(loginNode, 'data-upi-membership-login'));
        return;
      }

      const moveGroupNode = findClosest(event?.target, '[data-upi-membership-move-group]');
      if (moveGroupNode) {
        moveUpiCredentialMembershipAccountGroup(
          getDatasetValue(moveGroupNode, 'data-upi-membership-move-group'),
          getDatasetValue(moveGroupNode, 'data-upi-membership-move-target')
        );
        return;
      }

      const refreshAllEmailStatusesNode = findClosest(event?.target, '[data-upi-membership-refresh-all-email-statuses]');
      if (refreshAllEmailStatusesNode) {
        identifyFreeUpiCredentialMembershipPlus({ allowDuringAutoRun: true });
        return;
      }

      const redeemFreeNode = findClosest(event?.target, '[data-upi-membership-redeem-free]');
      if (redeemFreeNode) {
        startUpiCredentialMembershipFreeRedeem(null, {
          channel: getDatasetValue(redeemFreeNode, 'data-upi-membership-redeem-channel'),
        });
        return;
      }

      const redeemAllNode = findClosest(event?.target, '[data-upi-membership-redeem-all]');
      if (redeemAllNode) {
        startUpiCredentialMembershipAllRedeem();
        return;
      }

      const exportNode = findClosest(event?.target, '[data-upi-membership-export]');
      if (exportNode) {
        exportUpiCredentialMembershipCheckResultTextFile(getDatasetValue(exportNode, 'data-upi-membership-export'));
        return;
      }

      const deleteGroupNode = findClosest(event?.target, '[data-upi-membership-delete-group]');
      if (deleteGroupNode) {
        deleteUpiCredentialMembershipResultGroup(getDatasetValue(deleteGroupNode, 'data-upi-membership-delete-group'));
        return;
      }

      const importFreeNode = findClosest(event?.target, '[data-upi-membership-import-free]');
      if (importFreeNode) {
        openUpiCredentialMembershipTxtImport('free');
        return;
      }

      const stopCheckNode = findClosest(event?.target, '[data-upi-membership-stop-check]');
      if (stopCheckNode) {
        stopUpiCredentialMembershipCheck();
        return;
      }

      const stopRedeemNode = findClosest(event?.target, '[data-upi-membership-stop-redeem]');
      if (stopRedeemNode) {
        stopUpiCredentialMembershipRedeem();
        return;
      }

      const cancelRedeemNode = findClosest(event?.target, '[data-upi-membership-cancel-redeem]');
      if (cancelRedeemNode) {
        cancelUpiCredentialMembershipRedeemJob(
          getDatasetValue(cancelRedeemNode, 'data-upi-membership-cancel-redeem'),
          getDatasetValue(cancelRedeemNode, 'data-upi-membership-cancel-cdkey'),
          getDatasetValue(cancelRedeemNode, 'data-upi-membership-cancel-channel')
        );
        return;
      }

      const deleteNode = findClosest(event?.target, '[data-upi-membership-delete]');
      if (deleteNode) {
        deleteUpiCredentialMembershipCredential(
          getDatasetValue(deleteNode, 'data-upi-membership-delete'),
          getDatasetValue(deleteNode, 'data-upi-membership-delete-channel')
        );
      }
    }

    function handleUpiCredentialMembershipCheckResultsChange(event) {
      const toggleNode = findClosest(event?.target, '[data-upi-membership-toggle]');
      if (!toggleNode) {
        return;
      }
      const email = normalizeUpiCredentialMembershipEmail(getDatasetValue(toggleNode, 'data-upi-membership-toggle'));
      if (!email) {
        return;
      }
      const checked = event?.target?.checked !== false;
      if (checked) {
        disabledUpiCredentialMembershipEmails.delete(email);
      } else {
        disabledUpiCredentialMembershipEmails.add(email);
      }
      renderUpiCredentialMembershipCheckResults();
    }

    function bindEvents() {
      if (eventsBound) {
        return;
      }
      eventsBound = true;

      dom.btnOpenAccountRecords?.addEventListener('click', () => {
        openPanel();
      });
      dom.btnCloseAccountRecords?.addEventListener('click', () => {
        closePanel();
      });
      dom.accountRecordsOverlay?.addEventListener('click', (event) => {
        if (event.target === dom.accountRecordsOverlay) {
          closePanel();
        }
      });
      dom.accountRecordsStats?.addEventListener('click', (event) => {
        handleStatsClick(event);
      });
      dom.accountRecordsList?.addEventListener('click', (event) => {
        handleRecordListClick(event);
      });
      dom.btnAccountRecordsPrev?.addEventListener('click', () => {
        if (currentPage <= 1) {
          return;
        }
        currentPage -= 1;
        render();
      });
      dom.btnAccountRecordsNext?.addEventListener('click', () => {
        currentPage += 1;
        render();
      });
      dom.btnToggleAccountRecordsSelection?.addEventListener('click', () => {
        toggleSelectionMode();
      });
      dom.btnDeleteSelectedAccountRecords?.addEventListener('click', async () => {
        try {
          await deleteSelectedRecords();
        } catch (error) {
          helpers.showToast?.(`删除账号记录失败：${error.message}`, 'error');
        }
      });
      dom.btnExportSuccessAccountRecords?.addEventListener('click', () => {
        exportUpiRedeemSuccessEmailTextFile();
      });
      dom.btnShowUpiCredentialBackups?.addEventListener('click', () => {
        showUpiCredentialBackupText();
      });
      dom.btnExportUpiCredentialBackups?.addEventListener('click', async () => {
        await exportUpiRedeemSuccessEmailTextFile();
      });
      dom.btnCheckUpiCredentialMembershipLocal?.addEventListener('click', () => {
        startLocalUpiCredentialMembershipCheck();
      });
      dom.btnImportUpiCredentialMembershipTxt?.addEventListener('click', () => {
        openUpiCredentialMembershipTxtImport('check');
      });
      dom.btnImportUpiCredentialMembershipFreeTxt?.addEventListener('click', () => {
        openUpiCredentialMembershipTxtImport('free');
      });
      dom.inputUpiCredentialMembershipTxt?.addEventListener('change', (event) => {
        handleUpiCredentialMembershipTxtSelected(event);
      });
      dom.btnStopUpiCredentialMembershipCheck?.addEventListener('click', () => {
        stopUpiCredentialMembershipCheck();
      });
      dom.upiCredentialMembershipCheckResults?.addEventListener('click', (event) => {
        handleUpiCredentialMembershipCheckResultsClick(event);
      });
      dom.upiCredentialMembershipCheckResults?.addEventListener('change', (event) => {
        handleUpiCredentialMembershipCheckResultsChange(event);
      });
      dom.btnExportUpiRedeemSuccessRecords?.addEventListener('click', () => {
        exportUpiRedeemSuccessEmailTextFile();
      });
      dom.btnClearAccountRecords?.addEventListener('click', async () => {
        try {
          await clearRecords();
        } catch (error) {
          helpers.showToast?.(`清理账号记录失败：${error.message}`, 'error');
        }
      });
    }

    function reset() {
      currentPage = 1;
      activeFilter = 'all';
      selectionMode = false;
      resetSelection();
      closePanel();
      render();
    }

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
