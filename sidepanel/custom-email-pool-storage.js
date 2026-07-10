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
    return restoreEntriesFromStateWithSource(state, normalizeEntries).entries;
  }

  function restoreEntriesFromStateWithSource(state = {}, normalizeEntries = (entries) => entries) {
    const rawEntries = Array.isArray(state?.customEmailPoolEntries) ? state.customEmailPoolEntries : [];
    const structuredEntries = normalizeEntries(rawEntries);
    if (structuredEntries.length > 0) {
      return { entries: structuredEntries, source: 'structured' };
    }
    const legacyEntries = normalizeEntries(state?.customEmailPool);
    if (legacyEntries.length > 0) {
      return { entries: legacyEntries, source: 'legacy' };
    }
    return { entries: readEntriesBackup(normalizeEntries), source: 'backup' };
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
    restoreEntriesFromStateWithSource,
    syncEntriesBackup,
    writeEntriesBackup,
  };
})(typeof window !== 'undefined' ? window : globalThis);
