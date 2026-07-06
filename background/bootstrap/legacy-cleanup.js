(function attachBackgroundLegacyCleanup(globalScope) {
  function createBackgroundLegacyCleanup(deps = {}) {
    const {
      chrome: chromeApi = globalScope.chrome,
      logPrefix = '[MultiPage]',
    } = deps;

    const formerNetworkStoragePrefix = 'removed' + 'Network';
    const formerNetworkCleanupMarker = 'formerNetworkCleanupCompletedAt';

    function isCleanupPlainObject(value) {
      return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
    }

    function buildFormerNetworkNestedCleanupPatch(payload = {}) {
      const updates = {};
      const serviceState = payload.serviceState;
      if (
        isCleanupPlainObject(serviceState)
        && Object.prototype.hasOwnProperty.call(serviceState, 'proxy')
      ) {
        const nextServiceState = { ...serviceState };
        delete nextServiceState.proxy;
        updates.serviceState = nextServiceState;
      }

      const runtimeState = payload.runtimeState;
      const runtimeServiceState = runtimeState?.serviceState;
      if (
        isCleanupPlainObject(runtimeState)
        && isCleanupPlainObject(runtimeServiceState)
        && Object.prototype.hasOwnProperty.call(runtimeServiceState, 'proxy')
      ) {
        const nextRuntimeServiceState = { ...runtimeServiceState };
        delete nextRuntimeServiceState.proxy;
        updates.runtimeState = {
          ...runtimeState,
          serviceState: nextRuntimeServiceState,
        };
      }
      return updates;
    }

    async function cleanupFormerNetworkNestedState(storageArea) {
      if (typeof storageArea.get !== 'function' || typeof storageArea.set !== 'function') {
        return false;
      }

      const freshPayload = await storageArea.get(['runtimeState', 'serviceState']).catch(() => ({}));
      const updates = buildFormerNetworkNestedCleanupPatch(freshPayload);
      if (!Object.keys(updates).length) {
        return false;
      }

      await storageArea.set(updates);
      return true;
    }

    async function cleanupFormerNetworkStorageArea(storageArea, payload = {}) {
      if (!storageArea) {
        return { changed: false, removedKeys: 0 };
      }
      const keysToRemove = Object.keys(payload || {})
        .filter((key) => key.startsWith(formerNetworkStoragePrefix));
      if (keysToRemove.length && typeof storageArea.remove === 'function') {
        await storageArea.remove(keysToRemove);
      }

      const nestedChanged = await cleanupFormerNetworkNestedState(storageArea);

      return {
        changed: keysToRemove.length > 0 || nestedChanged,
        removedKeys: keysToRemove.length,
      };
    }

    async function clearFormerNetworkProxyResidue() {
      const settings = chromeApi.proxy?.settings;
      if (!settings?.clear) {
        return false;
      }

      return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
          if (!settled) {
            settled = true;
            resolve(value);
          }
        };
        try {
          const maybePromise = settings.clear({ scope: 'regular' }, () => {
            finish(!chromeApi.runtime?.lastError);
          });
          if (maybePromise && typeof maybePromise.then === 'function') {
            maybePromise.then(() => finish(true), () => finish(false));
          }
        } catch {
          finish(false);
        }
      });
    }

    async function purgeFormerNetworkResidue(reason = 'startup') {
      const localPayload = await chromeApi.storage.local.get(null).catch(() => ({}));
      const sessionPayload = await chromeApi.storage.session.get(null).catch(() => ({}));
      const localResult = await cleanupFormerNetworkStorageArea(chromeApi.storage.local, localPayload);
      const sessionResult = await cleanupFormerNetworkStorageArea(chromeApi.storage.session, sessionPayload);
      const markerExists = Boolean(localPayload?.[formerNetworkCleanupMarker]);
      const shouldClearProxyResidue = !markerExists || localResult.changed || sessionResult.changed;
      let proxyCleared = false;
      if (shouldClearProxyResidue) {
        proxyCleared = await clearFormerNetworkProxyResidue();
      }
      if (!markerExists || localResult.changed || sessionResult.changed || proxyCleared) {
        await chromeApi.storage.local.set({
          [formerNetworkCleanupMarker]: Date.now(),
        }).catch(() => {});
      }
      if (localResult.changed || sessionResult.changed || proxyCleared) {
        console.info(logPrefix, 'Cleaned legacy network residue:', JSON.stringify({
          reason,
          localRemovedKeys: localResult.removedKeys,
          sessionRemovedKeys: sessionResult.removedKeys,
          proxyCleared,
        }));
      }
    }

    return {
      purgeFormerNetworkResidue,
    };
  }

  globalScope.MultiPageBackgroundLegacyCleanup = {
    createBackgroundLegacyCleanup,
  };
})(self);
