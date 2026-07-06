(function attachPersistentSettings(root, factory) {
  const api = factory();
  root.MultiPagePersistentSettings = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createPersistentSettingsRegistry() {
  function createPersistentSettingsModule(defaults = {}) {
    const keys = Object.keys(defaults);

    function pickPersistedSettings(source = {}) {
      const values = source && typeof source === 'object' ? source : {};
      return Object.fromEntries(keys.map((key) => [key, values[key] ?? defaults[key]]));
    }

    return {
      defaults,
      keys,
      pickPersistedSettings,
    };
  }

  return {
    createPersistentSettingsModule,
  };
});
