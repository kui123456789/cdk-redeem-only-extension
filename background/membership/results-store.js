(function attachMembershipResultsStore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPageMembershipResultsStore = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipResultsStoreModule() {
  function defaultNormalizeResultsPayload(value = {}) {
    return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
  }

  function createMembershipResultsStore(deps = {}) {
    const {
      broadcastDataUpdate = () => {},
      chromeApi = globalThis.chrome,
      mergeRedeemDeletionStateForSave = () => ({}),
      normalizeResultsPayload = defaultNormalizeResultsPayload,
      setState = null,
      storageKey = 'upiCredentialMembershipCheckResults',
    } = deps;

    async function getStoredResults() {
      const stored = await chromeApi.storage.local.get([storageKey]).catch(() => ({}));
      return normalizeResultsPayload(stored?.[storageKey]);
    }

    async function saveResults(results = {}) {
      const stored = await chromeApi.storage.local.get([storageKey]).catch(() => ({}));
      const previousPayload = normalizeResultsPayload(stored?.[storageKey]);
      const payload = normalizeResultsPayload({
        ...results,
        ...mergeRedeemDeletionStateForSave(previousPayload, results),
      });
      await chromeApi.storage.local.set({ [storageKey]: payload });
      if (typeof setState === 'function') {
        await setState({ [storageKey]: payload }).catch(() => {});
      }
      broadcastDataUpdate({ [storageKey]: payload });
      return payload;
    }

    return {
      getStoredResults,
      saveResults,
    };
  }

  return {
    createMembershipResultsStore,
  };
});
