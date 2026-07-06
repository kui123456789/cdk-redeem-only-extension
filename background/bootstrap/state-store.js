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
      return buildStateViewWithRuntimeState({
        ...defaultState,
        ...persistedSettings,
        ...persistedAliasState,
        ...state,
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
