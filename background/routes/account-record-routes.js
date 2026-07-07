(function attachAccountRecordRoutes(root, factory) {
  const api = factory();
  root.MultiPageAccountRecordRoutes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createAccountRecordRoutesModule() {
  function createAccountRecordRoutes(deps = {}) {
    const {
      clearAccountRunHistory,
      deleteAccountRunHistoryRecords,
      getState,
      isAutoRunLockedState,
    } = deps;

    async function clearAccountRunHistoryRoute() {
      const state = await getState();
      if (isAutoRunLockedState(state)) {
        throw new Error('自动流程运行中，当前不能清理邮箱记录。');
      }
      if (typeof clearAccountRunHistory !== 'function') {
        return { ok: true, clearedCount: 0 };
      }
      const result = await clearAccountRunHistory(state);
      return { ok: true, ...result };
    }

    async function deleteAccountRunHistoryRecordsRoute(payload = {}) {
      const state = await getState();
      if (isAutoRunLockedState(state)) {
        throw new Error('自动流程运行中，当前不能删除邮箱记录。');
      }
      if (typeof deleteAccountRunHistoryRecords !== 'function') {
        return { ok: true, deletedCount: 0, remainingCount: 0 };
      }
      const recordIds = Array.isArray(payload?.recordIds) ? payload.recordIds : [];
      const result = await deleteAccountRunHistoryRecords(recordIds, state);
      return { ok: true, ...result };
    }

    return {
      CLEAR_ACCOUNT_RUN_HISTORY: clearAccountRunHistoryRoute,
      DELETE_ACCOUNT_RUN_HISTORY_RECORDS: deleteAccountRunHistoryRecordsRoute,
    };
  }

  return {
    createAccountRecordRoutes,
  };
});
