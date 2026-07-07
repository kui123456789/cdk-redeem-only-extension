// sidepanel/sidepanel-runtime-bridge.js - Runtime messaging helpers for the side panel.
(function attachSidepanelRuntimeBridge(globalScope) {
  const AUTOMATION_WINDOW_MESSAGE_TYPES = Object.freeze([
    'EXECUTE_NODE',
    'AUTO_RUN',
    'SCHEDULE_AUTO_RUN',
    'RESUME_AUTO_RUN',
    'START_SCHEDULED_AUTO_RUN_NOW',
    'SKIP_AUTO_RUN_COUNTDOWN',
  ]);

  function createSidepanelRuntimeBridge(context = {}) {
    const {
      chromeApi = globalScope.chrome,
      getLatestState = () => ({}),
      logger = globalScope.console,
      syncLatestState = () => {},
    } = context;

    function normalizeAutomationWindowId(value) {
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const numeric = Number(value);
      return Number.isInteger(numeric) && numeric >= 0 ? numeric : null;
    }

    async function getCurrentSidepanelWindowId() {
      if (chromeApi?.windows?.getCurrent) {
        try {
          const currentWindow = await chromeApi.windows.getCurrent();
          const windowId = normalizeAutomationWindowId(currentWindow?.id);
          if (windowId !== null) {
            return windowId;
          }
        } catch (error) {
          logger?.warn?.('Failed to get current sidepanel window:', error?.message || error);
        }
      }

      return normalizeAutomationWindowId(getLatestState()?.automationWindowId);
    }

    function shouldAttachAutomationWindow(message = {}) {
      const source = String(message?.source || '').trim();
      if (source && source !== 'sidepanel') {
        return false;
      }
      return AUTOMATION_WINDOW_MESSAGE_TYPES.includes(String(message?.type || '').trim());
    }

    async function sendSidepanelMessage(message = {}) {
      const payload = {
        ...(message || {}),
        source: message?.source || 'sidepanel',
      };
      if (shouldAttachAutomationWindow(payload)) {
        const windowId = await getCurrentSidepanelWindowId();
        if (windowId !== null) {
          payload.payload = {
            ...(payload.payload || {}),
            automationWindowId: windowId,
          };
          syncLatestState({ automationWindowId: windowId });
        }
      }
      return chromeApi.runtime.sendMessage(payload);
    }

    return {
      getCurrentSidepanelWindowId,
      normalizeAutomationWindowId,
      sendSidepanelMessage,
      shouldAttachAutomationWindow,
    };
  }

  globalScope.SidepanelRuntimeBridge = {
    createSidepanelRuntimeBridge,
  };
})(self);
