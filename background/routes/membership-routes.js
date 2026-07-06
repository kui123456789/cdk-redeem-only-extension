(function attachMembershipRoutes(root, factory) {
  const api = factory();
  root.MultiPageMembershipRoutes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMembershipRoutesModule() {
  function requireHandler(handler, name) {
    if (typeof handler !== 'function') {
      throw new Error(`Missing membership route handler: ${name}`);
    }
    return handler;
  }

  function createMembershipRoutes(deps = {}) {
    const {
      checkBatch,
      checkOne,
      checkTrialEligibility,
      fillFreeAccessTokens,
    } = deps;

    return {
      CHECK_UPI_CREDENTIAL_MEMBERSHIP_BATCH: (payload, message, sender) => (
        requireHandler(checkBatch, 'checkBatch')(payload, message, sender)
      ),
      CHECK_UPI_CREDENTIAL_MEMBERSHIP_ONE: (payload, message, sender) => (
        requireHandler(checkOne, 'checkOne')(payload, message, sender)
      ),
      CHECK_UPI_CREDENTIAL_MEMBERSHIP_TRIAL_ELIGIBILITY: (payload, message, sender) => (
        requireHandler(checkTrialEligibility, 'checkTrialEligibility')(payload, message, sender)
      ),
      CHECK_UPI_CREDENTIAL_MEMBERSHIP_TRIAL_ELIGIBILITY_BATCH: (payload, message, sender) => (
        requireHandler(checkTrialEligibility, 'checkTrialEligibility')(payload, message, sender)
      ),
      FILL_UPI_CREDENTIAL_MEMBERSHIP_FREE_ACCESS_TOKENS: (payload, message, sender) => (
        requireHandler(fillFreeAccessTokens, 'fillFreeAccessTokens')(payload, message, sender)
      ),
    };
  }

  return {
    createMembershipRoutes,
  };
});
