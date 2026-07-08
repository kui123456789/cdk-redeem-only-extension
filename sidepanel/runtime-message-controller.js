(function attachSidepanelRuntimeMessageController(root, factory) {
  const api = factory(root);
  root.SidepanelRuntimeMessageController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelRuntimeMessageControllerModule(rootScope) {
  const runtimeMessageHandlersApi = rootScope.SidepanelRuntimeMessageHandlers
    || (typeof require === 'function' ? require('./runtime-message-handlers.js') : null);

  const WINDOW_BOUND_GLOBAL_FUNCTIONS = new Set([
    'clearInterval',
    'clearTimeout',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'setInterval',
    'setTimeout',
  ]);

  function createCombinedScope(appState, scopeValues = {}) {
    const stateScope = appState?.createScope?.() || {};
    const globalScope = typeof globalThis !== 'undefined' ? globalThis : {};
    return new Proxy({}, {
      has(_target, prop) {
        if (prop === Symbol.unscopables) {
          return false;
        }
        return true;
      },
      get(_target, prop) {
        if (prop === Symbol.unscopables) {
          return undefined;
        }
        if (prop in scopeValues) {
          return scopeValues[prop];
        }
        if (prop in stateScope) {
          return stateScope[prop];
        }
        const globalValue = globalScope[prop];
        return WINDOW_BOUND_GLOBAL_FUNCTIONS.has(prop) && typeof globalValue === 'function'
          ? globalValue.bind(globalScope)
          : globalValue;
      },
      set(_target, prop, value) {
        if (typeof prop === 'string' && prop in scopeValues) {
          scopeValues[prop] = value;
          return true;
        }
        stateScope[prop] = value;
        return true;
      },
    });
  }

  function createRuntimeMessageController(deps = {}) {
    const {
      appState = null,
      chromeApi = null,
      scopeValues = {},
    } = deps;
    let started = false;
    const messageHandlers = runtimeMessageHandlersApi?.createRuntimeMessageHandlers?.({
      appState,
      createCombinedScope,
      scopeValues: {
        ...scopeValues,
        chrome: chromeApi,
      },
    });

    function handleMessage(message, sender, sendResponse) {
      return messageHandlers?.handleMessage?.(message, sender, sendResponse);
    }

    function start() {
      if (started) {
        return;
      }
      started = true;
      chromeApi?.runtime?.onMessage?.addListener?.(handleMessage);
    }

    return {
      handleMessage,
      start,
    };
  }

  return { createRuntimeMessageController };
});
