// sidepanel/account-records-membership-helpers.js - Membership row selectors and credential builders.
(function attachSidepanelAccountRecordsMembershipHelpers(globalScope) {
  function createAccountRecordsMembershipHelpers(context = {}) {
    const {
      state = {},
      getLatestState = () => state.getLatestState?.() || {},
      getUpiCredentialMembershipCheckResults = () => ({ items: [] }),
      buildUpiCredentialMembershipDisplayRows = () => [],
      getUpiCredentialMembershipPoolRows = () => [],
      isUpiCredentialMembershipEmailDisabled = () => false,
      normalizeUpiCredentialMembershipEmail = (value = '') => String(value || '').trim().toLowerCase(),
      normalizeUpiCredentialMembershipText = (value = '') => String(value || '').trim(),
      normalizeUpiCredentialMembershipTotpSecret = (value = '') => String(value || '').trim(),
      collectUpiCredentialMembershipPasskeyNumericMetadataPatch = () => ({}),
      getUpiCredentialMembershipFailureLimit = () => 3,
      getRedeemChannelFailureCount = () => 0,
      isUpiCredentialMembershipRedeemLocked = () => false,
      getUpiCredentialMembershipRedeemLockReason = () => '',
      getUpiCredentialMembershipGroup = () => 'free',
      isRedeemableFreeUpiCredentialMembershipRow = () => false,
      isRedeemableFreeUpiCredentialMembershipRowForChannel = () => false,
      normalizeRedeemChannel = (value = '') => {
        const normalized = String(value || '').trim().toLowerCase();
        return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
      },
      getStoredCdkPoolText = () => '',
      parseUpiRedeemCdkeyPoolText = () => [],
      getUpiRedeemCdkeyUsage = () => ({}),
      normalizeUpiRedeemRemoteStatus = (value = '') => String(value || '').trim().toLowerCase(),
      isActiveUpiRedeemRemoteStatus = () => false,
      normalizeUpiCredentialMembershipCapabilityFlag = (value) => value === true,
      getUpiCredentialMembershipCheckBusy = () => false,
      getUpiCredentialMembershipRedeemBusy = () => false,
    } = context;

    function buildNormalizedMembershipCredentialFields(row = {}) {
      const passkeyCredentialId = normalizeUpiCredentialMembershipText(row.passkeyCredentialId || row.credentialId || row.credential_id);
      const passkeyEnabled = row.passkeyEnabled === true || Boolean(passkeyCredentialId);
      const passkeyNumericMetadataPatch = collectUpiCredentialMembershipPasskeyNumericMetadataPatch(row);
      return {
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
        pixChannelEligibilityStatus: normalizeUpiCredentialMembershipText(row.pixChannelEligibilityStatus),
        pixChannelEligibilityReason: normalizeUpiCredentialMembershipText(row.pixChannelEligibilityReason),
      };
    }

    function getEnabledUpiCredentialMembershipPoolRows() {
      return getUpiCredentialMembershipPoolRows()
        .filter((item) => item?.email && !isUpiCredentialMembershipEmailDisabled(item.email))
        .map((item) => ({
          email: item.email,
          password: item.password,
          totpMfaSecret: item.totpMfaSecret,
          accessToken: item.accessToken,
          accessTokenUpdatedAt: item.accessTokenUpdatedAt || item.checkedAt,
        }));
    }

    function buildUpiCredentialMembershipRedeemCredential(row = {}) {
      return {
        email: normalizeUpiCredentialMembershipEmail(row.email),
        ...buildNormalizedMembershipCredentialFields(row),
        status: normalizeUpiCredentialMembershipText(row.status),
        planType: normalizeUpiCredentialMembershipText(row.planType),
        redeemStatus: normalizeUpiCredentialMembershipText(row.redeemStatus),
        redeemReason: normalizeUpiCredentialMembershipText(row.redeemReason),
        redeemFailureCount: Math.max(0, Math.floor(Number(row.redeemFailureCount) || 0)),
        redeemFailureLimit: getUpiCredentialMembershipFailureLimit(row),
        upiRedeemFailureCount: getRedeemChannelFailureCount(row, 'upi'),
        idealRedeemFailureCount: getRedeemChannelFailureCount(row, 'ideal'),
        pixRedeemFailureCount: getRedeemChannelFailureCount(row, 'pix'),
        redeemLocked: isUpiCredentialMembershipRedeemLocked(row),
        redeemLockedReason: getUpiCredentialMembershipRedeemLockReason(row),
        redeemLockedAt: normalizeUpiCredentialMembershipText(row.redeemLockedAt),
        redeemChannel: normalizeUpiCredentialMembershipText(row.redeemChannel || row.channel),
      };
    }

    function buildUpiCredentialMembershipActionCredential(row = {}) {
      return {
        ...row,
        email: normalizeUpiCredentialMembershipEmail(row.email),
        ...buildNormalizedMembershipCredentialFields(row),
        status: normalizeUpiCredentialMembershipText(row.status),
        planType: normalizeUpiCredentialMembershipText(row.planType),
      };
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

    function getUpiRedeemCdkeyUsageEntryByCdkey(cdkey = '', currentState = getLatestState(), channel = 'upi') {
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

    function findActiveUpiRedeemCdkeyUsageEntryByEmail(email = '', currentState = getLatestState(), channel = '') {
      const normalizedEmail = normalizeUpiCredentialMembershipEmail(email);
      if (!normalizedEmail) {
        return null;
      }
      const channels = channel ? [normalizeRedeemChannel(channel)] : ['upi', 'ideal', 'pix'];
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

    function getUpiCredentialMembershipRedeemCdkey(row = {}, currentState = getLatestState()) {
      const directCdkey = String(row.upiRedeemCdkey || row.cdkey || '').trim();
      if (directCdkey) {
        return directCdkey;
      }
      const match = findActiveUpiRedeemCdkeyUsageEntryByEmail(row.email, currentState, row.redeemChannel);
      return String(match?.cdkey || '').trim();
    }

    function getUpiCredentialMembershipRedeemCancelControl(row = {}, results = getUpiCredentialMembershipCheckResults()) {
      const currentState = getLatestState();
      const cdkey = getUpiCredentialMembershipRedeemCdkey(row, currentState);
      const rowChannel = normalizeRedeemChannel(row.redeemChannel || row.channel);
      const activeMatch = findActiveUpiRedeemCdkeyUsageEntryByEmail(row.email, currentState, rowChannel);
      const usageEntry = getUpiRedeemCdkeyUsageEntryByCdkey(cdkey, currentState, rowChannel)
        || activeMatch?.entry
        || {};
      const channel = activeMatch?.channel || rowChannel;
      const active = (
        normalizeUpiCredentialMembershipEmail(row?.email)
        && results?.redeeming === true
        && normalizeUpiCredentialMembershipEmail(results?.flowStageEmail) === normalizeUpiCredentialMembershipEmail(row.email)
      )
        || isActiveUpiRedeemRemoteStatus(row.redeemStatus)
        || isActiveUpiRedeemRemoteStatus(row.remoteStatus)
        || isActiveUpiRedeemRemoteStatus(row.remote_message)
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

    function getAvailableUpiRedeemCdkeyCount(currentState = getLatestState(), channel = 'upi') {
      const cdkeys = parseUpiRedeemCdkeyPoolText(getStoredCdkPoolText(currentState, channel));
      return cdkeys.filter((cdkey) => isSelectableUpiRedeemCdkeyUsageEntry(
        getUpiRedeemCdkeyUsageEntryByCdkey(cdkey, currentState, channel) || {}
      )).length;
    }

    function isRemoteRedeemSuccess(cdkey = '', usage = {}) {
      const entry = usage?.[cdkey] || {};
      return normalizeUpiRedeemRemoteStatus(entry.remoteStatus) === 'success';
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
      const currentState = getLatestState();
      const targets = {
        upi: new Set(),
        ideal: new Set(),
        pix: new Set(),
      };
      const emailMap = {
        upi: {},
        ideal: {},
        pix: {},
      };
      const unresolvedChannels = {
        upi: false,
        ideal: false,
        pix: false,
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

      ['upi', 'ideal', 'pix'].forEach((channel) => {
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

    return {
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
      isSelectableUpiRedeemCdkeyUsageEntry,
      getAvailableUpiRedeemCdkeyCount,
      isRemoteRedeemSuccess,
      getUpiCredentialMembershipSingleRedeemRow,
      isUpiCredentialMembershipRedeemStatusRefreshable,
      getUpiRedeemUsageRelatedEmail,
      buildUpiCredentialMembershipRedeemStatusRefreshTargets,
      getUpiCredentialMembershipDisplayRowByEmail,
    };
  }

  const api = {
    createAccountRecordsMembershipHelpers,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsMembershipHelpers = api;
})(typeof window !== 'undefined' ? window : globalThis);
