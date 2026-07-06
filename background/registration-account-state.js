(function attachRegistrationAccountState(root, factory) {
  const api = factory();
  root.MultiPageRegistrationAccountState = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createRegistrationAccountStateRegistry() {
  function wrapDependency(fn) {
    return typeof fn === 'function' ? (...args) => fn(...args) : undefined;
  }

  function createRegistrationAccountState(deps = {}) {
    return {
      markCurrentRegistrationAccountUsed: wrapDependency(deps.markCurrentRegistrationAccountUsed),
      markCurrentRegistrationAccountTrialIneligible: wrapDependency(deps.markCurrentRegistrationAccountTrialIneligible),
      recordStep7AccountCheckpoint: wrapDependency(deps.recordStep7AccountCheckpoint),
    };
  }

  return {
    createRegistrationAccountState,
  };
});
