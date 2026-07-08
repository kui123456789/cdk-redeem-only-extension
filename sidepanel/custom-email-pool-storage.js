(function attachSidepanelCustomEmailPoolStorage(globalScope) {
  const BACKUP_STORAGE_KEY = 'multiPageCustomEmailPoolEntriesBackup';

  function readEntriesBackup(normalizeEntries = (entries) => entries) {
    try {
      const parsed = JSON.parse(globalScope.localStorage?.getItem(BACKUP_STORAGE_KEY) || '[]');
      return normalizeEntries(Array.isArray(parsed) ? parsed : []);
    } catch (_) {
      return [];
    }
  }

  function writeEntriesBackup(entries = []) {
    if (!Array.isArray(entries) || entries.length <= 0) return;
    try {
      globalScope.localStorage?.setItem(BACKUP_STORAGE_KEY, JSON.stringify(entries));
    } catch (_) { }
  }

  function clearEntriesBackup() {
    try {
      globalScope.localStorage?.removeItem(BACKUP_STORAGE_KEY);
    } catch (_) { }
  }

  function restoreEntriesFromState(state = {}, normalizeEntries = (entries) => entries) {
    const rawEntries = Array.isArray(state?.customEmailPoolEntries) ? state.customEmailPoolEntries : [];
    const structuredEntries = normalizeEntries(rawEntries);
    if (structuredEntries.length > 0) return structuredEntries;
    const legacyEntries = normalizeEntries(state?.customEmailPool);
    return legacyEntries.length > 0 ? legacyEntries : readEntriesBackup(normalizeEntries);
  }

  function syncEntriesBackup(entries = [], options = {}) {
    if (options.persistBackup !== false && Array.isArray(entries) && entries.length > 0) {
      writeEntriesBackup(entries);
    } else if (options.clearBackup) {
      clearEntriesBackup();
    }
  }

  globalScope.SidepanelCustomEmailPoolStorage = {
    clearEntriesBackup,
    readEntriesBackup,
    restoreEntriesFromState,
    syncEntriesBackup,
    writeEntriesBackup,
  };
})(typeof window !== 'undefined' ? window : globalThis);
