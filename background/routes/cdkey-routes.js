(function attachCdkeyRoutes(root, factory) {
  const api = factory();
  root.MultiPageCdkeyRoutes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createCdkeyRoutesModule() {
  function requireHandler(handler, name) {
    if (typeof handler !== 'function') {
      throw new Error(`Missing CDK route handler: ${name}`);
    }
    return handler;
  }

  function createCdkeyRoutes(deps = {}) {
    const {
      refreshStatuses,
      updateJobs,
    } = deps;

    return {
      REFRESH_UPI_REDEEM_CDKEY_STATUSES: (payload, message, sender) => (
        requireHandler(refreshStatuses, 'refreshStatuses')(payload, message, sender)
      ),
      CANCEL_UPI_REDEEM_CDKEY_JOBS: (payload, message, sender) => (
        requireHandler(updateJobs, 'updateJobs')(payload, message, sender)
      ),
      RETRY_UPI_REDEEM_CDKEY_JOBS: (payload, message, sender) => (
        requireHandler(updateJobs, 'updateJobs')(payload, message, sender)
      ),
    };
  }

  return {
    createCdkeyRoutes,
  };
});
