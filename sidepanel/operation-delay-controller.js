(function attachSidepanelOperationDelayController(globalScope) {
  function createOperationDelayController(deps = {}) {
    const {
      dom = {},
      helpers = {},
      runtime = {},
      state = {},
    } = deps;
    let lastConfirmedOperationDelayEnabled = false;

    function normalizeEnabled(value) {
      return typeof value === 'boolean' ? value : false;
    }

    function appendDelayLog(enabled, level = 'info', message = '') {
      helpers.appendLog?.({
        timestamp: Date.now(),
        level,
        message: message || (enabled
          ? '操作间延迟已开启：页面输入、选择、点击、提交、继续、授权后等待 2 秒。'
          : '操作间延迟已关闭：页面操作将连续执行。'),
      });
    }

    function applyState(nextState = state.getLatestState?.(), options = {}) {
      const enabled = options.restoreFailed ? false : normalizeEnabled(nextState?.operationDelayEnabled);
      lastConfirmedOperationDelayEnabled = enabled;
      if (dom.inputOperationDelayEnabled) dom.inputOperationDelayEnabled.checked = enabled;
      state.syncLatestState?.({ operationDelayEnabled: enabled });
      if (options.restoreFailed) {
        appendDelayLog(false, 'warn', '操作间延迟设置读取失败，已回退为默认关闭。');
      }
    }

    async function persistToggle() {
      const nextEnabled = normalizeEnabled(dom.inputOperationDelayEnabled?.checked);
      try {
        const response = await runtime.sendMessage?.({
          type: 'SAVE_SETTING',
          source: 'sidepanel',
          payload: { operationDelayEnabled: nextEnabled },
        });
        if (response?.error) throw new Error(response.error);
        const confirmed = normalizeEnabled(response?.state?.operationDelayEnabled ?? nextEnabled);
        lastConfirmedOperationDelayEnabled = confirmed;
        if (dom.inputOperationDelayEnabled) dom.inputOperationDelayEnabled.checked = confirmed;
        state.syncLatestState?.({ operationDelayEnabled: confirmed });
        appendDelayLog(confirmed);
      } catch (error) {
        if (dom.inputOperationDelayEnabled) {
          dom.inputOperationDelayEnabled.checked = lastConfirmedOperationDelayEnabled;
        }
        appendDelayLog(lastConfirmedOperationDelayEnabled, 'error', `操作间延迟设置保存失败，已恢复为上一次确认的状态：${error.message}`);
        throw error;
      }
    }

    return {
      applyState,
      normalizeEnabled,
      persistToggle,
    };
  }

  const api = { createOperationDelayController };
  globalScope.SidepanelOperationDelayController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
