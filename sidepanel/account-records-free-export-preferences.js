(function attachFreeExportPreferences(globalScope) {
  const STORAGE_KEY = 'upiFreeExportIncludeVerificationUrl';

  function createFreeExportPreferences(options = {}) {
    const storage = options.storage || globalScope.localStorage;

    function getIncludeVerificationUrl() {
      try {
        return storage?.getItem(STORAGE_KEY) !== 'false';
      } catch {
        return true;
      }
    }

    function setIncludeVerificationUrl(value) {
      const enabled = value !== false;
      try {
        storage?.setItem(STORAGE_KEY, String(enabled));
      } catch {}
      return enabled;
    }

    function toggleIncludeVerificationUrl() {
      return setIncludeVerificationUrl(!getIncludeVerificationUrl());
    }

    return { getIncludeVerificationUrl, setIncludeVerificationUrl, toggleIncludeVerificationUrl };
  }

  const api = { STORAGE_KEY, createFreeExportPreferences };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsFreeExportPreferences = api;
})(typeof window !== 'undefined' ? window : globalThis);
