// sidepanel/account-records-panel-events.js - Account records panel selection and event bindings.
(function attachSidepanelAccountRecordsPanelEvents(globalScope) {
  function createAccountRecordsPanelEvents(context = {}) {
    const {
      state = {},
      dom = {},
      helpers = {},
      runtime = {},
      FILTER_CONFIG = {},
      render = () => {},
      refreshUpiCredentialMembershipCredentialPool = async () => [],
      getUpiCredentialMembershipPoolLoaded = () => false,
      setNodeHidden = () => {},
      getDatasetValue = () => '',
      findClosest = () => null,
      buildRecordId = () => '',
      getAccountRunRecords = () => [],
      getSelectedRecordIds = () => new Set(),
      getSelectionMode = () => false,
      setSelectionModeState = () => {},
      getActiveFilter = () => 'all',
      setActiveFilter = () => {},
      getCurrentPage = () => 1,
      setCurrentPage = () => {},
      getEventsBound = () => false,
      setEventsBound = () => {},
      getUpiCredentialMembershipGroup = () => 'free',
      setUpiCredentialMembershipGroup = () => {},
      toggleRecordSelectionImpl = null,
      openPanelImpl = null,
      closePanelImpl = null,
      exportUpiRedeemSuccessEmailTextFile = async () => {},
      showUpiCredentialBackupText = async () => {},
      startLocalUpiCredentialMembershipCheck = async () => {},
      openUpiCredentialMembershipTxtImport = () => {},
      handleUpiCredentialMembershipTxtSelected = async () => {},
      stopUpiCredentialMembershipCheck = async () => {},
      stopUpiCredentialMembershipRedeem = async () => {},
      checkOneUpiCredentialMembership = async () => {},
      fillFreeUpiCredentialMembershipAccessTokens = async () => {},
      identifyFreeUpiCredentialMembershipPlus = async () => {},
      verifyPlusUpiCredentialMembershipRows = async () => {},
      loginUpiCredentialMembershipAccount = async () => {},
      moveUpiCredentialMembershipAccountGroup = async () => {},
      startUpiCredentialMembershipFreeRedeem = async () => {},
      startUpiCredentialMembershipAllRedeem = async () => {},
      toggleFreeExportIncludeVerificationUrl = () => true,
      exportUpiCredentialMembershipCheckResultTextFile = async () => {},
      deleteUpiCredentialMembershipResultGroup = async () => {},
      cancelUpiCredentialMembershipRedeemJob = async () => {},
      deleteUpiCredentialMembershipCredential = async () => {},
    } = context;

    function resetSelection() {
      getSelectedRecordIds().clear();
    }

    function openPanel() {
      setNodeHidden(dom.accountRecordsOverlay, false);
      render();
      if (!getUpiCredentialMembershipPoolLoaded()) {
        refreshUpiCredentialMembershipCredentialPool({ silent: true }).catch(() => null);
      }
    }

    function closePanel() {
      setNodeHidden(dom.accountRecordsOverlay, true);
    }

    function setSelectionMode(nextValue) {
      const nextSelectionMode = Boolean(nextValue);
      if (!nextSelectionMode) {
        resetSelection();
      }
      setSelectionModeState(nextSelectionMode);
      setCurrentPage(1);
      render();
    }

    function toggleSelectionMode() {
      setSelectionMode(!getSelectionMode());
    }

    function toggleRecordSelection(recordId, forceSelected = null) {
      if (typeof toggleRecordSelectionImpl === 'function') {
        toggleRecordSelectionImpl(recordId, forceSelected);
        return;
      }
      const normalizedRecordId = String(recordId || '').trim().toLowerCase();
      if (!getSelectionMode() || !normalizedRecordId) {
        return;
      }
      const selectedRecordIds = getSelectedRecordIds();
      const shouldSelect = forceSelected === null
        ? !selectedRecordIds.has(normalizedRecordId)
        : Boolean(forceSelected);
      if (shouldSelect) {
        selectedRecordIds.add(normalizedRecordId);
      } else {
        selectedRecordIds.delete(normalizedRecordId);
      }
    }

    async function clearRecords() {
      const records = getAccountRunRecords();
      if (!records.length) {
        helpers.showToast?.('没有可清理的账号记录。', 'warn', 1800);
        return;
      }

      const confirmed = await helpers.openConfirmModal({
        title: '清理账号记录',
        message: '确认清理当前全部账号记录吗？该操作会同时清空面板记录与本地同步快照。',
        confirmLabel: '确认清理',
        confirmVariant: 'btn-danger',
      });
      if (!confirmed) {
        return;
      }

      const response = await runtime.sendMessage({
        type: 'CLEAR_ACCOUNT_RUN_HISTORY',
        source: 'sidepanel',
      });
      if (response?.error) {
        throw new Error(response.error);
      }

      setActiveFilter('all');
      setCurrentPage(1);
      setSelectionModeState(false);
      resetSelection();
      state.syncLatestState({ accountRunHistory: [] });
      helpers.showToast?.(`已清理 ${Math.max(0, Number(response?.clearedCount) || 0)} 条账号记录。`, 'success', 2200);
    }

    async function deleteSelectedRecords() {
      const recordIds = Array.from(getSelectedRecordIds()).filter(Boolean);
      if (!recordIds.length) {
        helpers.showToast?.('请先勾选要删除的账号记录。', 'warn', 1800);
        return;
      }

      const confirmed = await helpers.openConfirmModal({
        title: '删除选中记录',
        message: `确认删除选中的 ${recordIds.length} 条账号记录吗？该操作会同步更新本地 helper 快照。`,
        confirmLabel: '确认删除',
        confirmVariant: 'btn-danger',
      });
      if (!confirmed) {
        return;
      }

      const response = await runtime.sendMessage({
        type: 'DELETE_ACCOUNT_RUN_HISTORY_RECORDS',
        source: 'sidepanel',
        payload: {
          recordIds,
        },
      });
      if (response?.error) {
        throw new Error(response.error);
      }

      const existingRecords = getAccountRunRecords();
      const selectedIds = new Set(recordIds);
      const nextRecords = existingRecords.filter((record) => !selectedIds.has(buildRecordId(record)));

      resetSelection();
      state.syncLatestState({ accountRunHistory: nextRecords });
      helpers.showToast?.(`已删除 ${Math.max(0, Number(response?.deletedCount) || 0)} 条账号记录。`, 'success', 2200);
    }

    function handleStatsClick(event) {
      const filterNode = findClosest(event?.target, '[data-account-record-filter]');
      if (!filterNode) {
        return;
      }

      const nextFilter = getDatasetValue(filterNode, 'data-account-record-filter');
      if (!FILTER_CONFIG[nextFilter]) {
        return;
      }

      const activeFilter = getActiveFilter();
      setActiveFilter(activeFilter === nextFilter && nextFilter !== 'all' ? 'all' : nextFilter);
      setCurrentPage(1);
      render();
    }

    function handleRecordListClick(event) {
      if (!getSelectionMode()) {
        return;
      }

      const toggleNode = findClosest(event?.target, '[data-account-record-toggle]');
      if (toggleNode) {
        const recordId = getDatasetValue(toggleNode, 'data-account-record-toggle');
        const explicitChecked = typeof event?.target?.checked === 'boolean' ? event.target.checked : null;
        toggleRecordSelection(recordId, explicitChecked);
        render();
        return;
      }

      const recordNode = findClosest(event?.target, '[data-account-record-id]');
      if (!recordNode) {
        return;
      }

      toggleRecordSelection(getDatasetValue(recordNode, 'data-account-record-id'));
      render();
    }

    function handleUpiCredentialMembershipCheckResultsClick(event) {
      const groupNode = findClosest(event?.target, '[data-upi-membership-group]');
      if (groupNode) {
        const nextGroup = getDatasetValue(groupNode, 'data-upi-membership-group') === 'paid' ? 'paid' : 'free';
        if (getUpiCredentialMembershipGroup() !== nextGroup) {
          setUpiCredentialMembershipGroup(nextGroup);
          render();
        }
        return;
      }

      const checkOneNode = findClosest(event?.target, '[data-upi-membership-check-one]');
      if (checkOneNode) {
        checkOneUpiCredentialMembership(getDatasetValue(checkOneNode, 'data-upi-membership-check-one'));
        return;
      }

      const fillFreeAtNode = findClosest(event?.target, '[data-upi-membership-fill-free-at]');
      if (fillFreeAtNode) {
        fillFreeUpiCredentialMembershipAccessTokens();
        return;
      }

      const identifyFreePlusNode = findClosest(event?.target, '[data-upi-membership-identify-free-plus]');
      if (identifyFreePlusNode) {
        identifyFreeUpiCredentialMembershipPlus();
        return;
      }

      const verifyPlusNode = findClosest(event?.target, '[data-upi-membership-verify-plus]');
      if (verifyPlusNode) {
        verifyPlusUpiCredentialMembershipRows();
        return;
      }

      const loginNode = findClosest(event?.target, '[data-upi-membership-login]');
      if (loginNode) {
        loginUpiCredentialMembershipAccount(getDatasetValue(loginNode, 'data-upi-membership-login'));
        return;
      }

      const moveGroupNode = findClosest(event?.target, '[data-upi-membership-move-group]');
      if (moveGroupNode) {
        moveUpiCredentialMembershipAccountGroup(
          getDatasetValue(moveGroupNode, 'data-upi-membership-move-group'),
          getDatasetValue(moveGroupNode, 'data-upi-membership-move-target')
        );
        return;
      }

      const refreshAllEmailStatusesNode = findClosest(event?.target, '[data-upi-membership-refresh-all-email-statuses]');
      if (refreshAllEmailStatusesNode) {
        identifyFreeUpiCredentialMembershipPlus({ allowDuringAutoRun: true });
        return;
      }

      const redeemFreeNode = findClosest(event?.target, '[data-upi-membership-redeem-free]');
      if (redeemFreeNode) {
        startUpiCredentialMembershipFreeRedeem(null, {
          channel: getDatasetValue(redeemFreeNode, 'data-upi-membership-redeem-channel'),
        });
        return;
      }

      const redeemAllNode = findClosest(event?.target, '[data-upi-membership-redeem-all]');
      if (redeemAllNode) {
        startUpiCredentialMembershipAllRedeem();
        return;
      }

      const verificationUrlToggleNode = findClosest(event?.target, '[data-upi-membership-toggle-export-verification-url]');
      if (verificationUrlToggleNode) {
        toggleFreeExportIncludeVerificationUrl();
        render();
        return;
      }

      const exportNode = findClosest(event?.target, '[data-upi-membership-export]');
      if (exportNode) {
        exportUpiCredentialMembershipCheckResultTextFile(getDatasetValue(exportNode, 'data-upi-membership-export'));
        return;
      }

      const deleteGroupNode = findClosest(event?.target, '[data-upi-membership-delete-group]');
      if (deleteGroupNode) {
        deleteUpiCredentialMembershipResultGroup(getDatasetValue(deleteGroupNode, 'data-upi-membership-delete-group'));
        return;
      }

      const importFreeNode = findClosest(event?.target, '[data-upi-membership-import-free]');
      if (importFreeNode) {
        openUpiCredentialMembershipTxtImport('free');
        return;
      }

      const stopCheckNode = findClosest(event?.target, '[data-upi-membership-stop-check]');
      if (stopCheckNode) {
        stopUpiCredentialMembershipCheck();
        return;
      }

      const stopRedeemNode = findClosest(event?.target, '[data-upi-membership-stop-redeem]');
      if (stopRedeemNode) {
        stopUpiCredentialMembershipRedeem();
        return;
      }

      const cancelRedeemNode = findClosest(event?.target, '[data-upi-membership-cancel-redeem]');
      if (cancelRedeemNode) {
        cancelUpiCredentialMembershipRedeemJob(
          getDatasetValue(cancelRedeemNode, 'data-upi-membership-cancel-redeem'),
          getDatasetValue(cancelRedeemNode, 'data-upi-membership-cancel-cdkey'),
          getDatasetValue(cancelRedeemNode, 'data-upi-membership-cancel-channel')
        );
        return;
      }

      const deleteNode = findClosest(event?.target, '[data-upi-membership-delete]');
      if (deleteNode) {
        deleteUpiCredentialMembershipCredential(
          getDatasetValue(deleteNode, 'data-upi-membership-delete'),
          getDatasetValue(deleteNode, 'data-upi-membership-delete-channel')
        );
      }
    }

    function handleUpiCredentialMembershipCheckResultsChange(event) {
      const toggleNode = findClosest(event?.target, '[data-upi-membership-toggle]');
      if (!toggleNode) {
        return;
      }
      const email = normalizeUpiCredentialMembershipEmail(getDatasetValue(toggleNode, 'data-upi-membership-toggle'));
      if (!email) {
        return;
      }
      const checked = event?.target?.checked !== false;
      if (checked) {
        context.removeDisabledUpiCredentialMembershipEmail?.(email);
      } else {
        context.addDisabledUpiCredentialMembershipEmail?.(email);
      }
      render();
    }

    function bindEvents() {
      if (getEventsBound()) {
        return;
      }
      setEventsBound(true);

      dom.btnOpenAccountRecords?.addEventListener('click', () => {
        (typeof openPanelImpl === 'function' ? openPanelImpl : openPanel)();
      });
      dom.btnCloseAccountRecords?.addEventListener('click', () => {
        (typeof closePanelImpl === 'function' ? closePanelImpl : closePanel)();
      });
      dom.accountRecordsOverlay?.addEventListener('click', (event) => {
        if (event.target === dom.accountRecordsOverlay) {
          (typeof closePanelImpl === 'function' ? closePanelImpl : closePanel)();
        }
      });
      dom.accountRecordsStats?.addEventListener('click', (event) => {
        handleStatsClick(event);
      });
      dom.accountRecordsList?.addEventListener('click', (event) => {
        handleRecordListClick(event);
      });
      dom.btnAccountRecordsPrev?.addEventListener('click', () => {
        if (getCurrentPage() <= 1) {
          return;
        }
        setCurrentPage(getCurrentPage() - 1);
        render();
      });
      dom.btnAccountRecordsNext?.addEventListener('click', () => {
        setCurrentPage(getCurrentPage() + 1);
        render();
      });
      dom.btnToggleAccountRecordsSelection?.addEventListener('click', () => {
        toggleSelectionMode();
      });
      dom.btnDeleteSelectedAccountRecords?.addEventListener('click', async () => {
        try {
          await deleteSelectedRecords();
        } catch (error) {
          helpers.showToast?.(`删除账号记录失败：${error.message}`, 'error');
        }
      });
      dom.btnExportSuccessAccountRecords?.addEventListener('click', () => {
        exportUpiRedeemSuccessEmailTextFile();
      });
      dom.btnShowUpiCredentialBackups?.addEventListener('click', () => {
        showUpiCredentialBackupText();
      });
      dom.btnExportUpiCredentialBackups?.addEventListener('click', async () => {
        await exportUpiRedeemSuccessEmailTextFile();
      });
      dom.btnCheckUpiCredentialMembershipLocal?.addEventListener('click', () => {
        startLocalUpiCredentialMembershipCheck();
      });
      dom.btnImportUpiCredentialMembershipTxt?.addEventListener('click', () => {
        openUpiCredentialMembershipTxtImport('check');
      });
      dom.btnImportUpiCredentialMembershipFreeTxt?.addEventListener('click', () => {
        openUpiCredentialMembershipTxtImport('free');
      });
      dom.inputUpiCredentialMembershipTxt?.addEventListener('change', (event) => {
        handleUpiCredentialMembershipTxtSelected(event);
      });
      dom.btnStopUpiCredentialMembershipCheck?.addEventListener('click', () => {
        stopUpiCredentialMembershipCheck();
      });
      dom.upiCredentialMembershipCheckResults?.addEventListener('click', (event) => {
        handleUpiCredentialMembershipCheckResultsClick(event);
      });
      dom.upiCredentialMembershipCheckResults?.addEventListener('change', (event) => {
        handleUpiCredentialMembershipCheckResultsChange(event);
      });
      dom.btnExportUpiRedeemSuccessRecords?.addEventListener('click', () => {
        exportUpiRedeemSuccessEmailTextFile();
      });
      dom.btnClearAccountRecords?.addEventListener('click', async () => {
        try {
          await clearRecords();
        } catch (error) {
          helpers.showToast?.(`清理账号记录失败：${error.message}`, 'error');
        }
      });
    }

    function reset() {
      setCurrentPage(1);
      setActiveFilter('all');
      setSelectionModeState(false);
      resetSelection();
      closePanel();
      render();
    }

    return {
      openPanel,
      closePanel,
      resetSelection,
      setSelectionMode,
      toggleSelectionMode,
      toggleRecordSelection,
      clearRecords,
      deleteSelectedRecords,
      handleStatsClick,
      handleRecordListClick,
      handleUpiCredentialMembershipCheckResultsClick,
      handleUpiCredentialMembershipCheckResultsChange,
      bindEvents,
      reset,
    };
  }

  const api = {
    createAccountRecordsPanelEvents,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAccountRecordsPanelEvents = api;
})(typeof window !== 'undefined' ? window : globalThis);
