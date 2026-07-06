(function attachStatePatchHelpers(root, factory) {
  const api = factory();
  root.MultiPageBackgroundStatePatchHelpers = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createStatePatchHelpersModule() {
  function createStatePatchHelpers({
    registrationEmailStateHelpers = null,
    runtimeStateHelpers = null,
    chromeStorageLocal = null,
    membershipResultsStorageKey = 'upiCredentialMembershipCheckResults',
    defaultRegistrationEmailState = {
      current: '',
      previous: '',
      source: '',
      updatedAt: 0,
    },
    logPrefix = '[MultiPage:bg]',
    logger = console,
  } = {}) {
    function getRegistrationEmailState(state = {}) {
      if (registrationEmailStateHelpers?.getRegistrationEmailState) {
        return registrationEmailStateHelpers.getRegistrationEmailState(state);
      }
      const fallbackEmail = String(state?.email || '').trim();
      return {
        current: fallbackEmail,
        previous: fallbackEmail,
        source: '',
        updatedAt: 0,
      };
    }

    function buildRegistrationEmailStateUpdates(state = {}, options = {}) {
      if (registrationEmailStateHelpers?.buildRegistrationEmailStateUpdates) {
        return registrationEmailStateHelpers.buildRegistrationEmailStateUpdates(state, options);
      }
      const currentEmail = String(options?.currentEmail || '').trim();
      const preservePrevious = Boolean(options?.preservePrevious);
      const currentState = getRegistrationEmailState(state);
      return {
        email: currentEmail || null,
        registrationEmailState: {
          current: currentEmail,
          previous: currentEmail || (preservePrevious ? currentState.previous : ''),
          source: currentEmail
            ? String(options?.source || '').trim()
            : (preservePrevious ? currentState.source : ''),
          updatedAt: currentEmail || (preservePrevious && currentState.previous) ? Date.now() : 0,
        },
      };
    }

    function getRegistrationEmailBaseline(state = {}, options = {}) {
      if (registrationEmailStateHelpers?.getRegistrationEmailBaseline) {
        return registrationEmailStateHelpers.getRegistrationEmailBaseline(state, options);
      }
      const preferredEmail = String(options?.preferredEmail || '').trim();
      const fallbackEmail = String(options?.fallbackEmail || '').trim();
      const currentState = getRegistrationEmailState(state);
      return preferredEmail || currentState.current || currentState.previous || fallbackEmail || '';
    }

    function buildFlowRegistrationEmailStateUpdates(state = {}, options = {}) {
      if (registrationEmailStateHelpers?.buildFlowRegistrationEmailStateUpdates) {
        return registrationEmailStateHelpers.buildFlowRegistrationEmailStateUpdates(state, options);
      }
      return buildRegistrationEmailStateUpdates(state, options);
    }

    function buildClearedRegistrationEmailStateUpdates(state = {}, options = {}) {
      if (registrationEmailStateHelpers?.buildClearedRegistrationEmailStateUpdates) {
        return registrationEmailStateHelpers.buildClearedRegistrationEmailStateUpdates(state, options);
      }
      return buildFlowRegistrationEmailStateUpdates(state, {
        currentEmail: '',
        preservePrevious: options?.preservePrevious !== false,
        preserveAccountIdentity: Boolean(options?.preserveAccountIdentity),
        source: options?.source || '',
      });
    }

    function buildStateViewWithRuntimeState(state = {}) {
      if (runtimeStateHelpers?.buildStateView) {
        return runtimeStateHelpers.buildStateView(state);
      }
      return state;
    }

    function buildStatePatchWithRuntimeState(currentState = {}, updates = {}) {
      if (runtimeStateHelpers?.buildSessionStatePatch) {
        return runtimeStateHelpers.buildSessionStatePatch(currentState, updates);
      }
      return updates;
    }

    function normalizeMembershipResultsTimestamp(results = {}) {
      const timestamp = Date.parse(String(results?.updatedAt || results?.checkedAt || ''));
      return Number.isFinite(timestamp) ? timestamp : 0;
    }

    function getMembershipResultsItemCount(results = {}) {
      return Array.isArray(results?.items) ? results.items.length : 0;
    }

    function shouldKeepPersistedMembershipResults(persistedResults = null, incomingResults = null) {
      if (!persistedResults || typeof persistedResults !== 'object' || Array.isArray(persistedResults)) {
        return false;
      }
      if (!incomingResults || typeof incomingResults !== 'object' || Array.isArray(incomingResults)) {
        return true;
      }
      const persistedUpdatedAt = normalizeMembershipResultsTimestamp(persistedResults);
      const incomingUpdatedAt = normalizeMembershipResultsTimestamp(incomingResults);
      if (persistedUpdatedAt > incomingUpdatedAt) {
        return true;
      }
      return persistedUpdatedAt === incomingUpdatedAt
        && getMembershipResultsItemCount(persistedResults) > getMembershipResultsItemCount(incomingResults);
    }

    async function protectFreshMembershipResultsInStatePatch(sessionUpdates = {}) {
      if (
        !sessionUpdates
        || typeof sessionUpdates !== 'object'
        || !Object.prototype.hasOwnProperty.call(sessionUpdates, membershipResultsStorageKey)
      ) {
        return sessionUpdates;
      }
      const stored = await chromeStorageLocal
        ?.get?.([membershipResultsStorageKey])
        ?.catch?.(() => ({})) || {};
      const persistedResults = stored?.[membershipResultsStorageKey];
      const incomingResults = sessionUpdates[membershipResultsStorageKey];
      if (shouldKeepPersistedMembershipResults(persistedResults, incomingResults)) {
        logger.warn?.(
          logPrefix,
          'Skipped stale upiCredentialMembershipCheckResults state patch:',
          JSON.stringify({
            persistedUpdatedAt: persistedResults?.updatedAt || '',
            incomingUpdatedAt: incomingResults?.updatedAt || '',
            persistedItems: getMembershipResultsItemCount(persistedResults),
            incomingItems: getMembershipResultsItemCount(incomingResults),
          })
        );
        sessionUpdates[membershipResultsStorageKey] = persistedResults;
      }
      return sessionUpdates;
    }

    function alignUpiRedeemCdkeyAliasStatePatch(patch = {}) {
      if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
        return patch;
      }

      const hasOwn = (key) => Object.prototype.hasOwnProperty.call(patch, key);
      const pickAliasValue = (keys) => {
        for (const key of keys) {
          if (hasOwn(key)) {
            return patch[key];
          }
        }
        return undefined;
      };

      const cdkeyPoolAliasKeys = [
        'upiRedeemCdkeyPoolText',
        'cdkPoolText',
        'upiRedeemCdkPoolText',
        'pixRedeemCdkeyPoolText',
      ];
      const cdkeyUsageAliasKeys = [
        'upiRedeemCdkeyUsage',
        'cdkUsage',
        'upiRedeemCdkUsage',
        'pixRedeemCdkeyUsage',
      ];

      const poolText = pickAliasValue(cdkeyPoolAliasKeys);
      if (poolText !== undefined) {
        patch.upiRedeemCdkeyPoolText = poolText;
        patch.cdkPoolText = poolText;
        patch.upiRedeemCdkPoolText = poolText;
        patch.pixRedeemCdkeyPoolText = poolText;
      }

      const usage = pickAliasValue(cdkeyUsageAliasKeys);
      if (usage !== undefined) {
        patch.upiRedeemCdkeyUsage = usage;
        patch.cdkUsage = usage;
        patch.upiRedeemCdkUsage = usage;
        patch.pixRedeemCdkeyUsage = usage;
      }

      return patch;
    }

    function statePatchHasChanges(state = {}, patch = {}) {
      return Object.keys(patch).some((key) => JSON.stringify(state?.[key] ?? null) !== JSON.stringify(patch[key] ?? null));
    }

    return {
      DEFAULT_REGISTRATION_EMAIL_STATE: defaultRegistrationEmailState,
      getRegistrationEmailState,
      buildRegistrationEmailStateUpdates,
      getRegistrationEmailBaseline,
      buildFlowRegistrationEmailStateUpdates,
      buildClearedRegistrationEmailStateUpdates,
      buildStateViewWithRuntimeState,
      buildStatePatchWithRuntimeState,
      normalizeMembershipResultsTimestamp,
      getMembershipResultsItemCount,
      shouldKeepPersistedMembershipResults,
      protectFreshMembershipResultsInStatePatch,
      alignUpiRedeemCdkeyAliasStatePatch,
      statePatchHasChanges,
    };
  }

  return { createStatePatchHelpers };
});
