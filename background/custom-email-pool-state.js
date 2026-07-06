(function attachCustomEmailPoolState(root, factory) {
  const api = factory();
  root.MultiPageCustomEmailPoolState = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createCustomEmailPoolStateRegistry() {
  function wrapDependency(fn) {
    return typeof fn === 'function' ? (...args) => fn(...args) : undefined;
  }

  function createCustomEmailPoolState(deps = {}) {
    return {
      getCustomEmailPoolEntries: wrapDependency(deps.getCustomEmailPoolEntries),
      markCustomEmailPoolEntryTrialEligibility: wrapDependency(deps.markCustomEmailPoolEntryTrialEligibility),
      markCurrentCustomEmailPoolEntryUsed: wrapDependency(deps.markCurrentCustomEmailPoolEntryUsed),
      markCurrentCustomEmailPoolEntryTrialIneligible: wrapDependency(deps.markCurrentCustomEmailPoolEntryTrialIneligible),
    };
  }

  return {
    createCustomEmailPoolState,
  };
});
