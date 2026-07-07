(function attachSidepanelBootstrap(root, factory) {
  const api = factory(root);
  root.SidepanelBootstrap = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelBootstrapModule(rootScope) {
  const appControllerApi = rootScope.SidepanelAppController
    || (typeof require === 'function' ? require('./sidepanel-app-controller.js') : null);

  function createSidepanelApp(deps = {}) {
    return appControllerApi?.createSidepanelApp?.(deps) || {
      start() {
        return Promise.reject(new Error('SidepanelAppController.createSidepanelApp is unavailable.'));
      },
    };
  }

  return { createSidepanelApp };
});
