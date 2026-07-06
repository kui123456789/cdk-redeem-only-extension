(function attachRuntimeListeners(root, factory) {
  const api = factory();
  root.MultiPageBackgroundRuntimeListeners = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createRuntimeListenersModule() {
  function createRuntimeListenerRegistrar({
    chromeApi,
    handleMessage,
    handleAlarm,
    handleTabUpdated,
    handleStartup,
    handleInstalled,
    handleError = () => {},
  } = {}) {
    function registerRuntimeListeners() {
      chromeApi.runtime.onMessage.addListener((message, sender, sendResponse) => {
        try {
          return handleMessage(message, sender, sendResponse);
        } catch (error) {
          handleError('runtime.onMessage', error);
          throw error;
        }
      });
      chromeApi.alarms.onAlarm.addListener((alarm) => handleAlarm(alarm));
      chromeApi.tabs.onUpdated.addListener((tabId, changeInfo, tab) => handleTabUpdated(tabId, changeInfo, tab));
      chromeApi.runtime.onStartup.addListener(() => handleStartup());
      chromeApi.runtime.onInstalled.addListener((details) => handleInstalled(details));
    }

    return { registerRuntimeListeners };
  }

  return { createRuntimeListenerRegistrar };
});
