(function attachBackgroundStateStore(globalScope) {
  function createBackgroundStateStore(deps = {}) {
    const {
      alignUpiRedeemCdkeyAliasStatePatch = (patch) => patch || {},
      buildStatePatchWithRuntimeState = (_currentState, updates) => updates || {},
      buildStateViewWithRuntimeState = (state) => state || {},
      chrome: chromeApi = globalScope.chrome,
      defaultState = {},
      getPersistedAccountRunHistory = async () => [],
      getPersistedAliasState = async () => ({}),
      getPersistedSettings = async () => ({}),
      logPrefix = '[MultiPage]',
      membershipResultsStorageKey = 'upiCredentialMembershipCheckResults',
      normalizeBooleanMap = (value) => value || {},
      normalizeIcloudAliasCacheList = (value) => Array.isArray(value) ? value : [],
      normalizePersistentSettingValue = (_key, value) => value,
      protectFreshMembershipResultsInStatePatch = async () => {},
      setPersistentSettings = async () => {},
    } = deps;

    function hasNonEmptyArray(value) {
      return Array.isArray(value) && value.length > 0;
    }

    function getCustomEmailPoolEntryKey(entry) {
      const raw = entry && typeof entry === 'object'
        ? (entry.email || entry.credential || '')
        : entry;
      return String(raw || '').split('----')[0].trim().toLowerCase();
    }

    function mergePartialCustomEmailPoolEntries(persistedEntries = [], sessionEntries = []) {
      const sessionEntriesByEmail = new Map();
      const persistedEmails = new Set();

      for (const entry of sessionEntries) {
        const email = getCustomEmailPoolEntryKey(entry);
        if (email) {
          sessionEntriesByEmail.set(email, entry);
        }
      }

      const mergedEntries = persistedEntries.map((entry) => {
        const email = getCustomEmailPoolEntryKey(entry);
        if (email) {
          persistedEmails.add(email);
        }
        const sessionEntry = sessionEntriesByEmail.get(email);
        return sessionEntry && typeof entry === 'object' && typeof sessionEntry === 'object'
          ? { ...entry, ...sessionEntry }
          : (sessionEntry || entry);
      });

      for (const entry of sessionEntries) {
        const email = getCustomEmailPoolEntryKey(entry);
        if (!email || !persistedEmails.has(email)) {
          mergedEntries.push(entry);
        }
      }

      return mergedEntries;
    }

    function protectPersistedCustomEmailPoolOnReload(state = {}, persistedSettings = {}) {
      const merged = { ...(state || {}) };
      const sessionEntries = state?.customEmailPoolEntries;
      const persistedEntries = persistedSettings?.customEmailPoolEntries;
      const sessionPool = state?.customEmailPool;
      const persistedPool = persistedSettings?.customEmailPool;
      const persistedEntryEmails = new Set(
        (Array.isArray(persistedEntries) ? persistedEntries : [])
          .map(getCustomEmailPoolEntryKey)
          .filter(Boolean)
      );
      const sessionEntryEmails = new Set(
        (Array.isArray(sessionEntries) ? sessionEntries : [])
          .map(getCustomEmailPoolEntryKey)
          .filter(Boolean)
      );
      const shouldRestoreStructuredEntries = Array.isArray(sessionEntries)
        && hasNonEmptyArray(persistedEntries)
        && [...persistedEntryEmails].some((email) => !sessionEntryEmails.has(email));
      const shouldRestoreLegacyPool = Array.isArray(sessionPool)
        && sessionPool.length < (Array.isArray(persistedPool) ? persistedPool.length : 0)
        && hasNonEmptyArray(persistedPool);

      if (shouldRestoreStructuredEntries) {
        // Workflow snapshots can carry only the account currently in progress.
        // Preserve that account's fresh fields while retaining the stored pool.
        merged.customEmailPoolEntries = mergePartialCustomEmailPoolEntries(persistedEntries, sessionEntries);
      }
      if (shouldRestoreLegacyPool) {
        merged.customEmailPool = persistedPool;
      }
      if (
        (shouldRestoreStructuredEntries || shouldRestoreLegacyPool)
        && !String(merged.selectedCustomEmailPoolEmail || '').trim()
        && String(persistedSettings?.selectedCustomEmailPoolEmail || '').trim()
      ) {
        merged.selectedCustomEmailPoolEmail = persistedSettings.selectedCustomEmailPoolEmail;
      }
      return merged;
    }

    async function getState() {
      const [state, persistedSettings, persistedAliasState, accountRunHistory, credentialMembershipCheckState] = await Promise.all([
        chromeApi.storage.session.get(null),
        getPersistedSettings(),
        getPersistedAliasState(),
        getPersistedAccountRunHistory(),
        chromeApi.storage.local.get([membershipResultsStorageKey]).catch(() => ({})),
      ]);
      const persistedCredentialMembershipCheckResults = credentialMembershipCheckState?.[membershipResultsStorageKey]
        || defaultState.upiCredentialMembershipCheckResults;
      const sessionState = protectPersistedCustomEmailPoolOnReload(state, persistedSettings);
      return buildStateViewWithRuntimeState({
        ...defaultState,
        ...persistedSettings,
        ...persistedAliasState,
        ...sessionState,
        upiCredentialMembershipCheckResults: persistedCredentialMembershipCheckResults,
        accountRunHistory,
      });
    }

    async function initializeSessionStorageAccess() {
      try {
        if (chromeApi.storage?.session?.setAccessLevel) {
          await chromeApi.storage.session.setAccessLevel({
            accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS',
          });
          console.log(logPrefix, 'Enabled storage.session for content scripts');
        }
      } catch (err) {
        console.warn(logPrefix, 'Failed to enable storage.session for content scripts:', err?.message || err);
      }
    }

    async function setState(updates) {
      console.log(logPrefix, 'storage.set:', JSON.stringify(updates).slice(0, 200));
      if (Object.keys(updates || {}).length <= 0) {
        return;
      }

      const currentSessionState = await chromeApi.storage.session.get(null);
      const sessionUpdates = alignUpiRedeemCdkeyAliasStatePatch(buildStatePatchWithRuntimeState({
        ...defaultState,
        ...currentSessionState,
      }, updates));
      await protectFreshMembershipResultsInStatePatch(sessionUpdates);
      await chromeApi.storage.session.set(sessionUpdates);

      const persistentAliasUpdates = {};
      if (Object.prototype.hasOwnProperty.call(sessionUpdates, 'manualAliasUsage')) {
        persistentAliasUpdates.manualAliasUsage = normalizeBooleanMap(sessionUpdates.manualAliasUsage);
      }
      if (Object.prototype.hasOwnProperty.call(sessionUpdates, 'preservedAliases')) {
        persistentAliasUpdates.preservedAliases = normalizeBooleanMap(sessionUpdates.preservedAliases);
      }
      if (Object.prototype.hasOwnProperty.call(sessionUpdates, 'icloudAliasCache')) {
        persistentAliasUpdates.icloudAliasCache = normalizeIcloudAliasCacheList(sessionUpdates.icloudAliasCache);
      }
      if (Object.prototype.hasOwnProperty.call(sessionUpdates, 'icloudAliasCacheAt')) {
        persistentAliasUpdates.icloudAliasCacheAt = Math.max(0, Number(sessionUpdates.icloudAliasCacheAt) || 0);
      }
      if (Object.keys(persistentAliasUpdates).length > 0) {
        await chromeApi.storage.local.set(persistentAliasUpdates);
      }

      if (Object.prototype.hasOwnProperty.call(sessionUpdates, 'upiRedeemCdkeyUsage')) {
        await chromeApi.storage.local.set({
          upiRedeemCdkeyUsage: normalizePersistentSettingValue(
            'upiRedeemCdkeyUsage',
            sessionUpdates.upiRedeemCdkeyUsage
          ),
        });
      }
      if (Object.prototype.hasOwnProperty.call(sessionUpdates, 'idealRedeemCdkeyUsage')) {
        await chromeApi.storage.local.set({
          idealRedeemCdkeyUsage: normalizePersistentSettingValue(
            'idealRedeemCdkeyUsage',
            sessionUpdates.idealRedeemCdkeyUsage
          ),
        });
      }
      if (Object.prototype.hasOwnProperty.call(sessionUpdates, membershipResultsStorageKey)) {
        await chromeApi.storage.local.set({
          [membershipResultsStorageKey]: sessionUpdates[membershipResultsStorageKey],
        });
      }
      if (Object.prototype.hasOwnProperty.call(sessionUpdates, 'upiRedeemClientId')) {
        await setPersistentSettings({
          upiRedeemClientId: sessionUpdates.upiRedeemClientId,
        });
      }
    }

    return {
      getState,
      initializeSessionStorageAccess,
      setState,
    };
  }

  globalScope.MultiPageBackgroundStateStore = {
    createBackgroundStateStore,
  };
})(self);
