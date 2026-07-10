(function attachMembershipImportExportService(root, factory) {
  const api = factory();
  root.MultiPageMembershipImportExportService = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipImportExportServiceModule() {
  function createImportExportService(deps = {}) {
    const {
      buildRedeemAccountUnlockedPatch,
      buildResultExportRows,
      buildTimestampedFileName,
      deleteUpiCredentialMembershipCheckResults,
      getActiveRedeemCdkeyUsageEmailSetFromState,
      getResultItemRedeemChannel,
      getState,
      getStoredResults,
      isActiveUpiCredentialMembershipRedeemResultItem,
      isBatchRunning,
      isCdkeyRetryRunning,
      isLikelyVerificationUrl,
      isPasskeyExportMarker,
      isRedeemRunning,
      isResultItemHiddenByPlusDeletion,
      isResultItemPasskeyExportableForStatus,
      normalizeEmail,
      normalizeEmailList,
      normalizeRedeemChannel,
      normalizeResultItem,
      normalizeResultsPayload,
      normalizeString,
      resolveInputCredentials,
      saveResults,
    } = deps;

    async function importUpiCredentialMembershipFreeResults(input = {}) {
      if (isBatchRunning()) {
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
        redeeming: currentResults.redeeming === true && (isRedeemRunning() || isCdkeyRetryRunning()),
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
      const includeVerificationUrl = input.includeVerificationUrl !== false;
      const rows = buildResultExportRows(results, status, channel, allowedEmails, {
        includeVerificationUrl,
      });
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
              && (!includeVerificationUrl || item.verificationUrl)
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
      const allFreeRowsAreNo2faWithUrl = status === 'free'
        && rows.length > 0
        && rows.every((row) => {
          const parts = String(row || '').split(/---+/).map((part) => part.trim());
          return parts.length === 4 && isLikelyVerificationUrl(parts[1]);
        });
      const allFreeRowsAreNo2faWithoutUrl = status === 'free'
        && rows.length > 0
        && rows.every((row) => {
          const parts = String(row || '').split(/---+/).map((part) => part.trim());
          return parts.length === 3 && !isLikelyVerificationUrl(parts[1]);
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
        free: allFreeRowsAreNo2faWithUrl
          ? 'upi-membership-free-email-url-at'
          : (allFreeRowsAreNo2faWithoutUrl
            ? 'upi-membership-free-email-at'
            : (allFreeRowsArePasskey ? 'upi-membership-free-password-passkey' : 'upi-membership-free-password-2fa')),
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
      exportUpiCredentialMembershipCheckResults,
      importUpiCredentialMembershipFreeResults,
    };
  }

  return {
    createImportExportService,
  };
});
