(function attachSidepanelAppState(root, factory) {
  const api = factory();
  root.SidepanelAppState = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelAppStateModule() {
  function createSidepanelAppState(initialState = {}) {
    const store = { ...initialState };
    const keys = new Set(Object.keys(store));

    function registerKey(key) {
      if (typeof key === 'string' && key) {
        keys.add(key);
      }
    }

    function get(key) {
      return store[key];
    }

    function set(key, value) {
      registerKey(key);
      store[key] = value;
      return value;
    }

    function patch(values = {}) {
      Object.keys(values || {}).forEach((key) => {
        set(key, values[key]);
      });
      return snapshot();
    }

    function snapshot() {
      return { ...store };
    }

    function getLatestState() {
      return store.latestState ?? null;
    }

    function setLatestState(value) {
      return set('latestState', value ?? null);
    }

    function patchLatestState(values = {}) {
      const nextState = {
        ...(store.latestState || {}),
        ...(values || {}),
      };
      store.latestState = nextState;
      registerKey('latestState');
      return nextState;
    }

    function createScope() {
      return new Proxy({}, {
        has(_target, prop) {
          return typeof prop === 'string' && keys.has(prop);
        },
        get(_target, prop) {
          if (prop === Symbol.unscopables) {
            return undefined;
          }
          return get(prop);
        },
        set(_target, prop, value) {
          if (typeof prop !== 'string') {
            return false;
          }
          set(prop, value);
          return true;
        },
      });
    }

    return {
      createScope,
      get,
      patch,
      patchLatestState,
      set,
      setLatestState,
      snapshot,
      getLatestState,
    };
  }

  return { createSidepanelAppState };
});
