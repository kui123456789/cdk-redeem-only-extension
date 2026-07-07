(function attachSidepanelAccountRecordsPanelController(globalScope) {
  function createAccountRecordsPanelController(deps = {}) {
    const {
      constants = {},
      dom = {},
      helpers = {},
      runtime = {},
      state = {},
    } = deps;
    let accountRecordsManager = null;

    function getAccountRecordsManager() {
      if (accountRecordsManager) {
        return accountRecordsManager;
      }
      const factory = globalScope.SidepanelAccountRecordsManager?.createAccountRecordsManager;
      accountRecordsManager = typeof factory === 'function'
        ? factory({
          state: {
            getLatestState: state.getLatestState,
            syncLatestState: state.syncLatestState,
          },
          dom,
          helpers,
          runtime,
          constants,
        })
        : null;
      if (typeof state.onManagerCreated === 'function') {
        state.onManagerCreated(accountRecordsManager);
      }
      return accountRecordsManager;
    }

    return {
      bindEvents() {
        getAccountRecordsManager()?.bindEvents?.();
      },
      closePanel() {
        getAccountRecordsManager()?.closePanel?.();
      },
      getAccountRecordsManager,
      render(currentState = state.getLatestState?.()) {
        getAccountRecordsManager()?.render?.(currentState);
      },
    };
  }

  const api = { createAccountRecordsPanelController };
  globalScope.SidepanelAccountRecordsPanelController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
