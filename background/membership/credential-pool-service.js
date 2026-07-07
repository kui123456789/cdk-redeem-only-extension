(function attachMembershipCredentialPoolService(root, factory) {
  const api = factory();
  root.MultiPageMembershipCredentialPoolService = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipCredentialPoolServiceModule() {
  function createCredentialPoolService(deps = {}) {
    const {
      BACKUP_STORAGE_KEY,
      addRedeemPlusDeletedEmailsByChannel,
      broadcastDataUpdate,
      buildCredentialRowsFromBackupMap,
      buildPasskeyNumericMetadataPatch,
      buildRedeemChannelUsageUpdates,
      buildRedeemDeletionStatePatch,
      chromeApi,
      clearUpiRedeemCdkeyUsageAccountBindings,
      getRedeemChannelUsage,
      getResultItemRedeemChannel,
      getState,
      getStoredResults,
      getUpiRedeemCdkeyUsageEntryEmail,
      isActiveUpiRedeemRemoteStatus,
      normalizeBoolean,
      normalizeCredentialBackupMap,
      normalizeEmail,
      normalizeEmailList,
      normalizeRedeemChannel,
      normalizeString,
      normalizeTotpSecret,
      normalizeUpiRedeemCdkeyUsage,
      saveResults,
      setState,
    } = deps;

    async function getBackupCredentialsFromLocalStorage() {
      const stored = await chromeApi.storage.local.get([BACKUP_STORAGE_KEY]).catch(() => ({}));
      return buildCredentialRowsFromBackupMap(stored?.[BACKUP_STORAGE_KEY] || {});
    }

    async function getUpiCredentialMembershipCredentialPool() {
      const stored = await chromeApi.storage.local.get([BACKUP_STORAGE_KEY]).catch(() => ({}));
      const backups = normalizeCredentialBackupMap(stored?.[BACKUP_STORAGE_KEY] || {});
      const items = Object.values(backups)
        .sort((left, right) => Date.parse(right.updatedAt || '') - Date.parse(left.updatedAt || ''))
        .map((record) => {
          const passkeyNumericMetadataPatch = buildPasskeyNumericMetadataPatch(record);
          return {
            email: normalizeEmail(record.email),
            password: normalizeString(record.password),
            totpMfaSecret: normalizeTotpSecret(record.totpMfaSecret),
            verificationUrl: normalizeString(record.verificationUrl || record.emailVerificationUrl || record.url),
            passkeyEnabled: record.passkeyEnabled === true, passkeyEnabledAt: normalizeString(record.passkeyEnabledAt),
            passkeyCredentialId: normalizeString(record.passkeyCredentialId), passkeyFactorId: normalizeString(record.passkeyFactorId),
            passkeyRpId: normalizeString(record.passkeyRpId), passkeyUserHandle: normalizeString(record.passkeyUserHandle),
            passkeyPrivateJwk: record.passkeyPrivateJwk && typeof record.passkeyPrivateJwk === 'object' && !Array.isArray(record.passkeyPrivateJwk) ? record.passkeyPrivateJwk : null,
            passkeyPublicKeyCose: normalizeString(record.passkeyPublicKeyCose), ...passkeyNumericMetadataPatch,
            passkeyApiPersisted: record.passkeyApiPersisted === true,
            updatedAt: normalizeString(record.updatedAt),
            source: 'local',
          };
        })
        .filter((item) => item.email);
      return {
        items,
        total: items.length,
        updatedAt: new Date().toISOString(),
      };
    }

    async function findBackupCredentialByEmail(email = '') {
      const normalizedEmail = normalizeEmail(email);
      if (!normalizedEmail) {
        return {};
      }
      try {
        const pool = await getUpiCredentialMembershipCredentialPool();
        return (pool.items || []).find((item) => normalizeEmail(item?.email) === normalizedEmail) || {};
      } catch {
        return {};
      }
    }

    function isActiveUpiCredentialMembershipRedeemResultItem(item = {}, results = {}) {
      const source = item && typeof item === 'object' && !Array.isArray(item) ? item : {};
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
      ].some((status) => isActiveUpiRedeemRemoteStatus(status));
    }

    function getActiveUpiCredentialMembershipRedeemEmailSet(results = {}, emailSet = null) {
      const activeEmails = new Set();
      (Array.isArray(results.items) ? results.items : []).forEach((item) => {
        const email = normalizeEmail(item?.email);
        if (!email || (emailSet && !emailSet.has(email))) {
          return;
        }
        if (isActiveUpiCredentialMembershipRedeemResultItem(item, results)) {
          activeEmails.add(email);
        }
      });
      return activeEmails;
    }

    function getActiveUpiRedeemCdkeyUsageEmailSet(usage = {}, emailSet = null) {
      const activeEmails = new Set();
      const source = usage && typeof usage === 'object' && !Array.isArray(usage) ? usage : {};
      Object.values(source).forEach((entry) => {
        const email = getUpiRedeemCdkeyUsageEntryEmail(entry);
        if (!email || (emailSet && !emailSet.has(email))) {
          return;
        }
        if (
          normalizeBoolean(entry?.canCancel ?? entry?.can_cancel)
          || isActiveUpiRedeemRemoteStatus(entry?.remoteStatus)
          || isActiveUpiRedeemRemoteStatus(entry?.remoteMessage)
          || entry?.retrying === true
        ) {
          activeEmails.add(email);
        }
      });
      return activeEmails;
    }

    function getActiveRedeemCdkeyUsageEmailSetFromState(state = {}, emailSet = null) {
      const activeEmails = new Set();
      ['upi', 'ideal'].forEach((channel) => {
        getActiveUpiRedeemCdkeyUsageEmailSet(
          normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(state, channel)),
          emailSet
        ).forEach((email) => activeEmails.add(email));
      });
      return activeEmails;
    }

    async function deleteUpiCredentialMembershipCredentials(input = {}) {
      const emails = (Array.isArray(input.emails) ? input.emails : [input.email])
        .map(normalizeEmail)
        .filter(Boolean);
      const emailSet = new Set(emails);
      if (!emailSet.size) {
        return {
          deletedCount: 0,
          pool: await getUpiCredentialMembershipCredentialPool(),
          results: await getStoredResults(),
        };
      }

      const currentResults = await getStoredResults();
      const skippedEmailSet = getActiveUpiCredentialMembershipRedeemEmailSet(currentResults, emailSet);
      const safeEmailSet = new Set(emails.filter((email) => !skippedEmailSet.has(email)));
      const skippedEmails = Array.from(skippedEmailSet);
      if (!safeEmailSet.size) {
        return {
          deletedCount: 0,
          deletedEmails: [],
          skippedCount: skippedEmails.length,
          skippedEmails,
          blockedEmails: skippedEmails,
          pool: await getUpiCredentialMembershipCredentialPool(),
          results: currentResults,
        };
      }

      let deletedCount = 0;
      const deletedEmailSet = new Set();
      if (input.deleteBackups !== false) {
        const stored = await chromeApi.storage.local.get([BACKUP_STORAGE_KEY]).catch(() => ({}));
        const backups = normalizeCredentialBackupMap(stored?.[BACKUP_STORAGE_KEY] || {});
        for (const email of safeEmailSet) {
          if (Object.prototype.hasOwnProperty.call(backups, email)) {
            delete backups[email];
            deletedCount += 1;
            deletedEmailSet.add(email);
          }
        }
        await chromeApi.storage.local.set({ [BACKUP_STORAGE_KEY]: backups });
      }

      const nextItems = currentResults.items.filter((item) => {
        const email = normalizeEmail(item.email);
        const keep = !safeEmailSet.has(email);
        if (!keep && email) {
          deletedEmailSet.add(email);
        }
        return keep;
      });
      if (input.deleteBackups === false) {
        safeEmailSet.forEach((email) => deletedEmailSet.add(email));
      }
      const nextResults = await saveResults({
        ...currentResults,
        items: nextItems,
        total: nextItems.length,
        completed: Math.min(currentResults.completed, nextItems.length),
        updatedAt: new Date().toISOString(),
      });
      const pool = await getUpiCredentialMembershipCredentialPool();
      const deletedEmails = Array.from(deletedEmailSet);
      return {
        deletedCount: input.deleteBackups === false ? safeEmailSet.size : Math.max(deletedCount, deletedEmails.length),
        deletedEmails,
        skippedCount: skippedEmails.length,
        skippedEmails,
        blockedEmails: skippedEmails,
        pool,
        results: nextResults,
      };
    }

    async function deleteUpiCredentialMembershipCheckResults(input = {}) {
      const rawStatus = normalizeString(input.status || 'paid').toLowerCase() || 'paid';
      const status = ['paid-upi', 'paid-ideal', 'paid-all'].includes(rawStatus) ? 'paid' : rawStatus;
      const requestedChannel = normalizeString(input.channel).toLowerCase();
      const targetChannel = ['upi', 'ideal'].includes(requestedChannel)
        ? normalizeRedeemChannel(requestedChannel)
        : (rawStatus === 'paid-upi' ? 'upi' : (rawStatus === 'paid-ideal' ? 'ideal' : ''));
      const plusDeleteChannels = status === 'paid'
        ? (targetChannel ? [targetChannel] : ['upi', 'ideal'])
        : [];
      const emails = (Array.isArray(input.emails) ? input.emails : [])
        .map(normalizeEmail)
        .filter(Boolean);
      const emailSet = new Set(emails);
      const currentResults = await getStoredResults();

      const isTargetStatusItem = (item = {}) => {
        const itemStatus = normalizeString(item.status).toLowerCase();
        if (status === 'free') {
          return itemStatus === 'free' || itemStatus === 'failed';
        }
        if (status === 'paid') {
          if (itemStatus !== 'paid') return false;
          return !targetChannel || getResultItemRedeemChannel(item) === targetChannel;
        }
        return itemStatus === status;
      };
      const targetItems = currentResults.items.filter((item) => (
        isTargetStatusItem(item)
        && (!emailSet.size || emailSet.has(normalizeEmail(item.email)))
      ));
      const targetEmailSet = new Set([
        ...emails,
        ...targetItems.map((item) => normalizeEmail(item.email)).filter(Boolean),
      ]);
      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      const skippedEmailSet = new Set([
        ...getActiveUpiCredentialMembershipRedeemEmailSet(currentResults, targetEmailSet),
        ...getActiveRedeemCdkeyUsageEmailSetFromState(latestState, targetEmailSet),
      ]);
      const safeTargetItems = targetItems.filter((item) => !skippedEmailSet.has(normalizeEmail(item.email)));
      const safeRequestedEmailSet = new Set(emails.filter((email) => !skippedEmailSet.has(email)));
      const deletedEmailSet = new Set([
        ...safeRequestedEmailSet,
        ...safeTargetItems.map((item) => normalizeEmail(item.email)).filter(Boolean),
      ]);
      const skippedEmails = Array.from(skippedEmailSet);
      const currentDeletionState = buildRedeemDeletionStatePatch(currentResults);
      const nextRedeemAutoDeletedEmails = deletedEmailSet.size && status !== 'paid'
        ? normalizeEmailList([
          ...currentDeletionState.redeemAutoDeletedEmails,
          ...deletedEmailSet,
        ])
        : currentDeletionState.redeemAutoDeletedEmails;
      const nextRedeemPlusDeletedEmailsByChannel = deletedEmailSet.size && status === 'paid'
        ? addRedeemPlusDeletedEmailsByChannel(
          currentDeletionState.redeemPlusDeletedEmailsByChannel,
          deletedEmailSet,
          plusDeleteChannels
        )
        : currentDeletionState.redeemPlusDeletedEmailsByChannel;
      const nextDeletionStatePatch = buildRedeemDeletionStatePatch({
        redeemAutoDeletedEmails: nextRedeemAutoDeletedEmails,
        redeemPlusDeletedEmailsByChannel: nextRedeemPlusDeletedEmailsByChannel,
      });
      let updates = {};

      if (deletedEmailSet.size) {
        const usageCleanupChannels = status === 'paid' ? plusDeleteChannels : ['upi', 'ideal'];
        usageCleanupChannels.forEach((channel) => {
          const usage = normalizeUpiRedeemCdkeyUsage(getRedeemChannelUsage(latestState, channel));
          const usageCleanup = clearUpiRedeemCdkeyUsageAccountBindings(usage, deletedEmailSet, {
            clearNonActive: status === 'free',
          });
          if (usageCleanup.changed) {
            updates = {
              ...updates,
              ...buildRedeemChannelUsageUpdates(channel, usageCleanup.usage),
            };
          }
        });
      }

      if (!targetItems.length) {
        const nextResults = deletedEmailSet.size
          ? await saveResults({
            ...currentResults,
            ...nextDeletionStatePatch,
            updatedAt: new Date().toISOString(),
          })
          : currentResults;
        if (Object.keys(updates).length && typeof setState === 'function') {
          await setState(updates).catch(() => {});
          broadcastDataUpdate(updates);
        }
        return {
          status,
          deletedCount: deletedEmailSet.size,
          deletedEmails: Array.from(deletedEmailSet),
          skippedCount: skippedEmails.length,
          skippedEmails,
          blockedEmails: skippedEmails,
          results: nextResults,
          updates,
        };
      }

      const nextItems = emailSet.size
        ? currentResults.items.filter((item) => !(
          isTargetStatusItem(item)
          && safeRequestedEmailSet.has(normalizeEmail(item.email))
        ))
        : currentResults.items.filter((item) => !(
          isTargetStatusItem(item)
          && !skippedEmailSet.has(normalizeEmail(item.email))
        ));
      const nextResults = await saveResults({
        ...currentResults,
        items: nextItems,
        ...nextDeletionStatePatch,
        total: nextItems.length,
        completed: Math.min(currentResults.completed, nextItems.length),
        updatedAt: new Date().toISOString(),
      });
      if (Object.keys(updates).length && typeof setState === 'function') {
        await setState(updates).catch(() => {});
        broadcastDataUpdate(updates);
      }
      return {
        status,
        deletedCount: Math.max(safeTargetItems.length, deletedEmailSet.size),
        deletedEmails: Array.from(deletedEmailSet),
        skippedCount: skippedEmails.length,
        skippedEmails,
        blockedEmails: skippedEmails,
        results: nextResults,
        updates,
      };
    }

    return {
      deleteUpiCredentialMembershipCheckResults,
      deleteUpiCredentialMembershipCredentials,
      findBackupCredentialByEmail,
      getActiveRedeemCdkeyUsageEmailSetFromState,
      getActiveUpiCredentialMembershipRedeemEmailSet,
      getBackupCredentialsFromLocalStorage,
      getUpiCredentialMembershipCredentialPool,
      isActiveUpiCredentialMembershipRedeemResultItem,
    };
  }

  return {
    createCredentialPoolService,
  };
});
