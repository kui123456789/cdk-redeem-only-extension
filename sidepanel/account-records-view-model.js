(function attachSidepanelAccountRecordsViewModel(globalScope) {
  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function normalizeEmail(value = '') {
    return normalizeText(value).toLowerCase();
  }

  function normalizeRetryCount(value) {
    const count = Math.floor(Number(value) || 0);
    return count > 0 ? count : 0;
  }

  function buildRecordId(record = {}) {
    const rawRecordId = normalizeText(record?.recordId);
    if (rawRecordId) {
      return rawRecordId.toLowerCase();
    }
    return normalizeEmail(record?.email || record?.accountIdentifier);
  }

  function getRecordIdentifierType(record = {}) {
    return 'email';
  }

  function getRecordEmail(record = {}) {
    const identifierType = getRecordIdentifierType(record);
    return normalizeText(
      record?.email
      || (identifierType === 'email' ? record?.accountIdentifier : '')
    );
  }

  function getRecordDisplayStatus(record = {}) {
    return normalizeText(record?.displayStatus || record?.finalStatus).toLowerCase();
  }

  function summarizeAccountRunHistory(records = []) {
    return (Array.isArray(records) ? records : []).reduce((summary, record) => {
      const retryCount = normalizeRetryCount(record?.retryCount);
      const status = getRecordDisplayStatus(record);
      summary.total += 1;
      if (status === 'success') {
        summary.success += 1;
      } else if (status === 'running') {
        summary.running += 1;
      } else if (status === 'failed') {
        summary.failed += 1;
      } else if (status === 'stopped') {
        summary.stopped += 1;
      }
      if (retryCount > 0) {
        summary.retryRecordCount += 1;
      }
      summary.retryTotal += retryCount;
      return summary;
    }, {
      total: 0,
      success: 0,
      running: 0,
      failed: 0,
      stopped: 0,
      retryRecordCount: 0,
      retryTotal: 0,
    });
  }

  function matchesFilter(record = {}, filterKey = 'all') {
    switch (normalizeText(filterKey).toLowerCase()) {
      case 'success':
        return getRecordDisplayStatus(record) === 'success';
      case 'running':
        return getRecordDisplayStatus(record) === 'running';
      case 'failed':
        return getRecordDisplayStatus(record) === 'failed';
      case 'stopped':
        return getRecordDisplayStatus(record) === 'stopped';
      case 'retry':
        return normalizeRetryCount(record?.retryCount) > 0;
      case 'all':
      default:
        return true;
    }
  }

  function filterRecords(records = [], filterKey = 'all') {
    return (Array.isArray(records) ? records : []).filter((record) => matchesFilter(record, filterKey));
  }

  const api = {
    buildRecordId,
    filterRecords,
    getRecordDisplayStatus,
    getRecordEmail,
    getRecordIdentifierType,
    matchesFilter,
    normalizeEmail,
    normalizeRetryCount,
    summarizeAccountRunHistory,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsViewModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
