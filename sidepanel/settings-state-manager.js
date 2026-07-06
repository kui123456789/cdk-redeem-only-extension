(function attachSidepanelSettingsStateManager(globalScope) {
  function firstFunction(...candidates) {
    return candidates.find((candidate) => typeof candidate === 'function') || null;
  }

  function createSettingsStateManager(context = {}) {
    const { helpers = {} } = context;
    const collectSettingsPayload = firstFunction(context.collectSettingsPayload, helpers.collectSettingsPayload);
    const applySettingsState = firstFunction(context.applySettingsState, helpers.applySettingsState);

    return {
      collectSettingsPayload: (...args) => collectSettingsPayload?.(...args),
      applySettingsState: (...args) => applySettingsState?.(...args),
    };
  }

  globalScope.SidepanelSettingsStateManager = {
    createSettingsStateManager,
  };
})(window);
