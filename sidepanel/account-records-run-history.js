// sidepanel/account-records-run-history.js - Account run record identity, filtering, and summary helpers.
(function attachSidepanelAccountRecordsRunHistory(globalScope) {
  function createAccountRecordsRunHistory(context = {}) {
    const accountRecordsViewModel = context.accountRecordsViewModel || {};
    const buildRecordId = typeof context.buildRecordId === 'function'
      ? context.buildRecordId
      : (record = {}) => String(record.id || record.email || record.accountIdentifier || '').trim();
    const getRecordDisplayStatus = typeof context.getRecordDisplayStatus === 'function'
      ? context.getRecordDisplayStatus
      : (record = {}) => String(record.displayStatus || record.status || '').trim().toLowerCase();
    const normalizeTimestamp = typeof context.normalizeTimestamp === 'function'
      ? context.normalizeTimestamp
      : (value) => {
        const timestamp = Date.parse(String(value || ''));
        return Number.isFinite(timestamp) ? timestamp : 0;
      };
    const normalizeRetryCount = typeof context.normalizeRetryCount === 'function'
      ? context.normalizeRetryCount
      : (value) => {
        const count = Math.floor(Number(value) || 0);
        return count > 0 ? count : 0;
      };

    function isAutoRunRecordDisplayRunning(currentState = {}) {
      const phase = String(currentState.autoRunPhase || '').trim().toLowerCase();
      return Boolean(currentState.autoRunning)
        && ['running', 'waiting_step', 'waiting_email', 'retrying'].includes(phase);
    }

    function buildCurrentAccountRecordId(currentState = {}) {
      const email = String(currentState.email || '').trim();
      const accountIdentifier = String(currentState.accountIdentifier || email || '').trim();
      return buildRecordId({
        accountIdentifier,
        email,
      });
    }

    function applyRunningDisplayState(record = {}, currentState = {}) {
      if (!isAutoRunRecordDisplayRunning(currentState)) {
        return record;
      }
      if (getRecordDisplayStatus(record) === 'success') {
        return record;
      }

      const currentRecordId = buildCurrentAccountRecordId(currentState);
      if (!currentRecordId || buildRecordId(record) !== currentRecordId) {
        return record;
      }

      return {
        ...record,
        displayStatus: 'running',
        displaySummary: '正在运行',
      };
    }

    function getRecordIdentifierType(record = {}) {
      if (typeof accountRecordsViewModel.getRecordIdentifierType === 'function') {
        return accountRecordsViewModel.getRecordIdentifierType(record);
      }
      return 'email';
    }

    function getRecordEmail(record = {}) {
      if (typeof accountRecordsViewModel.getRecordEmail === 'function') {
        return accountRecordsViewModel.getRecordEmail(record);
      }
      const identifierType = getRecordIdentifierType(record);
      return String(
        record.email
        || (identifierType === 'email' ? record.accountIdentifier : '')
        || ''
      ).trim();
    }

    function getRecordPrimaryIdentifier(record = {}) {
      const email = getRecordEmail(record);
      return email || String(record.accountIdentifier || '').trim();
    }

    function getRecordSecondaryIdentifier() {
      return '';
    }

    function getRecordTitle(record = {}) {
      const primaryIdentifier = getRecordPrimaryIdentifier(record) || '(空账号)';
      const secondaryIdentifier = getRecordSecondaryIdentifier(record);
      return secondaryIdentifier
        ? `${primaryIdentifier} / ${secondaryIdentifier}`
        : primaryIdentifier;
    }

    function getAccountRunRecords(currentState = {}) {
      return (Array.isArray(currentState?.accountRunHistory) ? currentState.accountRunHistory : [])
        .filter((item) => item && typeof item === 'object')
        .slice()
        .sort((left, right) => normalizeTimestamp(right.finishedAt) - normalizeTimestamp(left.finishedAt))
        .map((record) => applyRunningDisplayState(record, currentState));
    }

    function summarizeAccountRunHistory(records = []) {
      if (typeof accountRecordsViewModel.summarizeAccountRunHistory === 'function') {
        return accountRecordsViewModel.summarizeAccountRunHistory(records);
      }
      return records.reduce((summary, record) => {
        const retryCount = normalizeRetryCount(record.retryCount);
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

    function matchesRecordFilter(record = {}, filterKey = 'all') {
      if (typeof accountRecordsViewModel.matchesFilter === 'function') {
        return accountRecordsViewModel.matchesFilter(record, filterKey);
      }
      switch (String(filterKey || '').trim().toLowerCase()) {
        case 'success':
          return getRecordDisplayStatus(record) === 'success';
        case 'running':
          return getRecordDisplayStatus(record) === 'running';
        case 'failed':
          return getRecordDisplayStatus(record) === 'failed';
        case 'stopped':
          return getRecordDisplayStatus(record) === 'stopped';
        case 'retry':
          return normalizeRetryCount(record.retryCount) > 0;
        case 'all':
        default:
          return true;
      }
    }

    function getFilteredRecords(records = [], activeFilter = 'all') {
      if (typeof accountRecordsViewModel.filterRecords === 'function') {
        return accountRecordsViewModel.filterRecords(records, activeFilter);
      }
      return records.filter((record) => matchesRecordFilter(record, activeFilter));
    }

    return {
      applyRunningDisplayState,
      buildCurrentAccountRecordId,
      getAccountRunRecords,
      getFilteredRecords,
      getRecordEmail,
      getRecordIdentifierType,
      getRecordPrimaryIdentifier,
      getRecordSecondaryIdentifier,
      getRecordTitle,
      isAutoRunRecordDisplayRunning,
      matchesRecordFilter,
      summarizeAccountRunHistory,
    };
  }

  const api = {
    createAccountRecordsRunHistory,
  };

  globalScope.SidepanelAccountRecordsRunHistory = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
