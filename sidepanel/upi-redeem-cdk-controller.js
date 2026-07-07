(function attachSidepanelUpiRedeemCdkController(root, factory) {
  const api = factory(root);
  root.SidepanelUpiRedeemCdkController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelUpiRedeemCdkControllerModule(rootScope) {
  const stateApi = rootScope.SidepanelUpiRedeemCdkState
    || (typeof require === 'function' ? require('./upi-redeem-cdk-state.js') : null);
  const statusViewApi = rootScope.SidepanelUpiRedeemCdkStatusView
    || (typeof require === 'function' ? require('./upi-redeem-cdk-status-view.js') : null);

  function createUpiRedeemCdkController(deps = {}) {
    const {
      cdkPoolStateHelpers = {},
      dom = {},
      state = {},
      helpers = {},
      constants = {},
      runtime = {},
    } = deps;
    const {
      parseUpiRedeemCdkeyPoolTextValue = () => [],
      normalizeRedeemChannel = (value) => (String(value || '').trim().toLowerCase() === 'ideal' ? 'ideal' : 'upi'),
      getRedeemChannelLabel = (value) => (String(value || '').trim().toLowerCase() === 'ideal' ? 'IDEAL' : 'UPI'),
      getStoredCdkPoolText = () => '',
      getStoredCdkUsage = () => ({}),
      buildCdkPoolStatePatch = () => ({}),
      isUpiRedeemRemoteActiveStatus = () => false,
    } = cdkPoolStateHelpers;
    const {
      document: documentRef = typeof document !== 'undefined' ? document : null,
      window: windowRef = typeof window !== 'undefined' ? window : null,
      rowUpiRedeemCdkeyPool = null,
      inputUpiRedeemCdkeyPool = null,
      upiRedeemCdkeyPoolSummary = null,
      inputIdealRedeemCdkeyPool = null,
      idealRedeemCdkeyPoolSummary = null,
      btnImportCdkPool = null,
      btnDeleteAllCdkPool = null,
      btnImportIdealCdkPool = null,
      btnDeleteAllIdealCdkPool = null,
      inputUpiRedeemExternalApiKey = null,
      inputUpiRedeemClientId = null,
      inputPlusModeEnabled = null,
      inputUpiRedeemFailedAccountRetryLimit = null,
      btnUpiRedeemCdkeyStatusRefresh = null,
      upiRedeemCdkeyStatusList = null,
      idealRedeemCdkeyStatusList = null,
    } = dom;
    const getLatestState = typeof state.getLatestState === 'function' ? state.getLatestState : () => ({});
    const syncLatestState = typeof state.syncLatestState === 'function' ? state.syncLatestState : () => {};
    const getAccountRecordsManager = typeof state.getAccountRecordsManager === 'function' ? state.getAccountRecordsManager : () => null;
    const showToast = typeof helpers.showToast === 'function' ? helpers.showToast : () => {};
    const openConfirmModal = typeof helpers.openConfirmModal === 'function' ? helpers.openConfirmModal : async () => false;
    const renderAccountRecords = typeof helpers.renderAccountRecords === 'function' ? helpers.renderAccountRecords : () => {};
    const markSettingsDirty = typeof helpers.markSettingsDirty === 'function' ? helpers.markSettingsDirty : () => {};
    const saveSettings = typeof helpers.saveSettings === 'function' ? helpers.saveSettings : () => Promise.resolve();
    const normalizeUpiRedeemFailedAccountRetryLimit = typeof helpers.normalizeUpiRedeemFailedAccountRetryLimit === 'function'
      ? helpers.normalizeUpiRedeemFailedAccountRetryLimit
      : (value) => value;
    const getSelectedPlusPaymentMethod = typeof helpers.getSelectedPlusPaymentMethod === 'function'
      ? helpers.getSelectedPlusPaymentMethod
      : () => '';
    const isAutoRunLockedPhase = typeof helpers.isAutoRunLockedPhase === 'function' ? helpers.isAutoRunLockedPhase : () => false;
    const isAutoRunPausedPhase = typeof helpers.isAutoRunPausedPhase === 'function' ? helpers.isAutoRunPausedPhase : () => false;
    const isAutoRunScheduledPhase = typeof helpers.isAutoRunScheduledPhase === 'function' ? helpers.isAutoRunScheduledPhase : () => false;
    const runtimeSendMessage = typeof runtime.sendMessage === 'function'
      ? runtime.sendMessage
      : () => Promise.resolve({});
    const plusPaymentMethodUpi = String(constants.PLUS_PAYMENT_METHOD_UPI || 'upi').trim().toLowerCase();
    const statusAutoRefreshMs = Math.max(
      1000,
      Number(constants.UPI_REDEEM_CDKEY_STATUS_AUTO_REFRESH_MS) || 5000
    );

    let upiRedeemCdkeyStatusAutoRefreshTimer = null;
    let upiRedeemCdkeyStatusRefreshInFlight = false;

    function getCdkPoolInputForChannel(channel = 'upi') {
      return normalizeRedeemChannel(channel) === 'ideal' ? inputIdealRedeemCdkeyPool : inputUpiRedeemCdkeyPool;
    }

    function getImportCdkButtonForChannel(channel = 'upi') {
      return normalizeRedeemChannel(channel) === 'ideal' ? btnImportIdealCdkPool : btnImportCdkPool;
    }

    function getDeleteAllCdkButtonForChannel(channel = 'upi') {
      return normalizeRedeemChannel(channel) === 'ideal' ? btnDeleteAllIdealCdkPool : btnDeleteAllCdkPool;
    }

    function shouldPreserveFocusedUpiRedeemCdkeyPoolEdit(channel = '') {
      const focusedInputs = channel
        ? [getCdkPoolInputForChannel(channel)]
        : [inputUpiRedeemCdkeyPool, inputIdealRedeemCdkeyPool];
      return Boolean(
        documentRef
        && focusedInputs.some((input) => input && documentRef.activeElement === input)
      );
    }

    function getCurrentUpiRedeemExternalApiKey() {
      const latestState = getLatestState();
      return String(
        inputUpiRedeemExternalApiKey?.value
        || latestState?.upiRedeemExternalApiKey
        || latestState?.pixRedeemExternalApiKey
        || ''
      ).trim();
    }

    function getCurrentUpiRedeemClientId() {
      const latestState = getLatestState();
      return String(
        inputUpiRedeemClientId?.value
        || latestState?.upiRedeemClientId
        || latestState?.pixRedeemClientId
        || ''
      ).trim();
    }

    const cdkState = stateApi?.createUpiRedeemCdkState?.({
      cdkPoolStateHelpers,
      getLatestState,
      getCurrentUpiRedeemExternalApiKey,
    }) || {};
    const {
      isUpiRedeemApiAuthErrorMessage = () => false,
      getUpiRedeemApiAuthErrorDisplayMessage = (message) => String(message || '').trim(),
      getUpiRedeemCdkeySubscriptionDisplay = () => null,
      mergeCurrentUpiRedeemSubscriptionState = (entry) => entry,
      getDefaultUpiRedeemCdkeyUsageEntry = () => ({}),
      getUpiRedeemCdkeyUsageEntry = () => ({}),
    } = cdkState;

    function isUpiRedeemCdkeyPoolMutationLocked() {
      return isAutoRunLockedPhase()
        || isAutoRunPausedPhase()
        || isAutoRunScheduledPhase();
    }

    const statusView = statusViewApi?.createUpiRedeemCdkStatusView?.({
      cdkPoolStateHelpers,
      dom: {
        document: documentRef,
        window: windowRef,
        inputUpiRedeemCdkeyPool,
        inputIdealRedeemCdkeyPool,
        btnImportCdkPool,
        btnDeleteAllCdkPool,
        upiRedeemCdkeyPoolSummary,
        btnImportIdealCdkPool,
        btnDeleteAllIdealCdkPool,
        idealRedeemCdkeyPoolSummary,
        upiRedeemCdkeyStatusList,
        idealRedeemCdkeyStatusList,
      },
      helpers: {
        getLatestState,
        isUpiRedeemCdkeyPoolMutationLocked,
        getUpiRedeemCdkeyUsageEntry,
        mergeCurrentUpiRedeemSubscriptionState,
        getUpiRedeemCdkeySubscriptionDisplay,
        markUpiRedeemCdkeyUnused,
        operateUpiRedeemCdkeyJob,
        deleteUpiRedeemCdkey,
        updateUpiRedeemCdkeyEnabled,
        showToast,
        getCdkPoolInputForChannel,
        getImportCdkButtonForChannel,
        getDeleteAllCdkButtonForChannel,
      },
    }) || {};
    const {
      renderUpiRedeemCdkeyStatusList = () => {},
      updateUpiRedeemCdkeyPoolSummary = () => {},
    } = statusView;

    function updateAllUpiRedeemCdkeyPoolSummaries(stateValue = getLatestState(), options = {}) {
      ['upi', 'ideal'].forEach((channel) => {
        updateUpiRedeemCdkeyPoolSummary(stateValue, {
          ...options,
          channel,
        });
      });
    }

    function commitCdkPoolState(poolText = '', usage = {}, channel = 'upi', options = {}) {
      const redeemChannel = normalizeRedeemChannel(channel);
      syncLatestState(buildCdkPoolStatePatch(poolText, usage, redeemChannel));
      const nextState = getLatestState();
      renderUpiRedeemCdkeyStatusList(nextState, redeemChannel);
      updateUpiRedeemCdkeyPoolSummary(nextState, { skipRender: true, channel: redeemChannel });
      renderAccountRecords(nextState);
      if (options.markDirty !== false) {
        markSettingsDirty(true);
      }
      if (options.save !== false) {
        saveSettings({ silent: true, ...(options.saveOptions || {}) }).catch(() => {});
      }
      return nextState;
    }

    function updateUpiRedeemCdkeyEnabled(cdkey = '', enabled = true, channel = 'upi') {
      const redeemChannel = normalizeRedeemChannel(channel);
      const normalizedCdkey = String(cdkey || '').trim();
      if (!normalizedCdkey) {
        return;
      }
      if (isUpiRedeemCdkeyPoolMutationLocked()) {
        showToast('自动流程运行中只能追加导入 CDK，不能修改已保存 CDK 状态。', 'warn', 2200);
        renderUpiRedeemCdkeyStatusList(getLatestState(), redeemChannel);
        return;
      }
      const latestState = getLatestState();
      const usage = getStoredCdkUsage(latestState, redeemChannel);
      const currentEntry = getUpiRedeemCdkeyUsageEntry(usage, normalizedCdkey);
      commitCdkPoolState(getStoredCdkPoolText(latestState, redeemChannel), {
        ...usage,
        [normalizedCdkey]: {
          ...currentEntry,
          enabled: Boolean(enabled),
        },
      }, redeemChannel);
    }

    function markUpiRedeemCdkeyUnused(cdkey = '', channel = 'upi') {
      const redeemChannel = normalizeRedeemChannel(channel);
      const normalizedCdkey = String(cdkey || '').trim();
      if (!normalizedCdkey) {
        return;
      }
      if (isUpiRedeemCdkeyPoolMutationLocked()) {
        showToast('自动流程运行中只能追加导入 CDK，不能重置已保存 CDK。', 'warn', 2200);
        renderUpiRedeemCdkeyStatusList(getLatestState(), redeemChannel);
        return;
      }
      const latestState = getLatestState();
      const usage = getStoredCdkUsage(latestState, redeemChannel);
      const currentEntry = getUpiRedeemCdkeyUsageEntry(usage, normalizedCdkey);
      commitCdkPoolState(getStoredCdkPoolText(latestState, redeemChannel), {
        ...usage,
        [normalizedCdkey]: {
          ...currentEntry,
          usedAt: 0,
          lastError: '',
          remoteStatus: '',
          remoteMessage: '',
          remoteCheckedAt: 0,
          canCancel: false,
          canRetry: false,
          canReuseToken: false,
          hasAccessToken: false,
          retryCount: 0,
          lastRetryAt: 0,
          retrying: false,
          retryError: '',
          subscriptionActive: null,
          subscriptionPlanType: '',
          subscriptionCheckedAt: 0,
          subscriptionReason: '',
        },
      }, redeemChannel);
    }

    function deleteUpiRedeemCdkey(cdkey = '', channel = 'upi') {
      const redeemChannel = normalizeRedeemChannel(channel);
      const normalizedCdkey = String(cdkey || '').trim();
      if (!normalizedCdkey) {
        return;
      }
      if (isUpiRedeemCdkeyPoolMutationLocked()) {
        showToast('自动流程运行中只能追加导入 CDK，不能删除已保存 CDK。', 'warn', 2200);
        renderUpiRedeemCdkeyStatusList(getLatestState(), redeemChannel);
        return;
      }
      const latestState = getLatestState();
      const nextUsage = getStoredCdkUsage(latestState, redeemChannel);
      delete nextUsage[normalizedCdkey];
      const nextPoolText = parseUpiRedeemCdkeyPoolTextValue(getStoredCdkPoolText(latestState, redeemChannel))
        .filter((item) => item !== normalizedCdkey)
        .join('\n');
      commitCdkPoolState(nextPoolText, nextUsage, redeemChannel);
    }

    async function deleteAllUpiRedeemCdkeys(channel = 'upi') {
      const redeemChannel = normalizeRedeemChannel(channel);
      const channelLabel = getRedeemChannelLabel(redeemChannel);
      if (isUpiRedeemCdkeyPoolMutationLocked()) {
        showToast('自动流程运行中只能追加导入 CDK，不能删除 CDK 池。', 'warn', 2200);
        updateUpiRedeemCdkeyPoolSummary(getLatestState(), { skipRender: true, channel: redeemChannel });
        return;
      }
      const latestState = getLatestState();
      const currentCdkeys = parseUpiRedeemCdkeyPoolTextValue(getStoredCdkPoolText(latestState, redeemChannel));
      if (!currentCdkeys.length) {
        showToast('当前没有已保存的 CDK。', 'info', 1800);
        return;
      }
      const confirmed = await openConfirmModal({
        title: `删除全部 ${channelLabel} CDK`,
        message: `确认删除当前 ${channelLabel} 池全部 ${currentCdkeys.length} 个 CDK 吗？此操作不可撤销。`,
        confirmLabel: '一键删除',
        confirmVariant: 'btn-danger',
      });
      if (!confirmed) {
        return;
      }
      syncLatestState(buildCdkPoolStatePatch('', {}, redeemChannel));
      const input = getCdkPoolInputForChannel(redeemChannel);
      if (input) {
        input.value = '';
      }
      const nextState = getLatestState();
      renderUpiRedeemCdkeyStatusList(nextState, redeemChannel);
      updateUpiRedeemCdkeyPoolSummary(nextState, { skipRender: true, channel: redeemChannel });
      renderAccountRecords(nextState);
      renderAccountRecords(nextState);
      markSettingsDirty(true);
      await saveSettings({ silent: true, force: true }).catch((error) => {
        showToast(`CDK 已删除，但保存失败：${error.message}`, 'error');
      });
      showToast(`已删除 ${channelLabel} CDK ${currentCdkeys.length} 个。`, 'success', 1800);
    }

    function getCurrentUpiRedeemCdkeys(channel = 'upi') {
      return parseUpiRedeemCdkeyPoolTextValue(getStoredCdkPoolText(getLatestState(), channel));
    }

    async function importCdkPoolFromTextarea(options = {}) {
      const redeemChannel = normalizeRedeemChannel(options.channel || options.redeemChannel);
      const channelLabel = getRedeemChannelLabel(redeemChannel);
      const input = getCdkPoolInputForChannel(redeemChannel);
      const importText = String(input?.value || '');
      const incomingCdks = parseUpiRedeemCdkeyPoolTextValue(importText);
      if (!incomingCdks.length) {
        showToast(`请先粘贴要导入的 ${channelLabel} CDK。`, 'warn');
        input?.focus?.();
        return { imported: 0, skipped: 0 };
      }

      const latestState = getLatestState();
      const existingCdks = parseUpiRedeemCdkeyPoolTextValue(getStoredCdkPoolText(latestState, redeemChannel));
      const seen = new Set(existingCdks.map((cdk) => cdk.toLowerCase()));
      const nextCdks = [...existingCdks];
      const nextUsage = getStoredCdkUsage(latestState, redeemChannel);
      let imported = 0;
      let skipped = 0;

      incomingCdks.forEach((cdk) => {
        const key = cdk.toLowerCase();
        if (!cdk || seen.has(key)) {
          skipped += 1;
          return;
        }
        seen.add(key);
        nextCdks.push(cdk);
        if (!nextUsage[cdk]) {
          nextUsage[cdk] = {
            ...getDefaultUpiRedeemCdkeyUsageEntry(),
            enabled: true,
          };
        }
        imported += 1;
      });

      if (!imported) {
        showToast(`没有新增 CDK，已跳过重复 ${skipped} 条。`, 'info');
        if (input) {
          input.value = '';
        }
        return { imported: 0, skipped };
      }

      syncLatestState(buildCdkPoolStatePatch(nextCdks.join('\n'), nextUsage, redeemChannel));
      if (input) {
        input.value = '';
      }
      const nextState = getLatestState();
      renderUpiRedeemCdkeyStatusList(nextState, redeemChannel);
      updateUpiRedeemCdkeyPoolSummary(nextState, { skipRender: true, channel: redeemChannel });
      renderAccountRecords(nextState);
      markSettingsDirty(true);
      await saveSettings({ silent: true, force: true }).catch((error) => {
        showToast(`CDK 已导入，但保存失败：${error.message}`, 'error');
      });
      scheduleUpiRedeemCdkeyStatusAutoRefresh({ immediate: true });
      showToast(`已导入 CDK ${imported} 条${skipped ? `，跳过重复 ${skipped} 条` : ''}。`, 'success');

      if (options.autoResume === true) {
        getAccountRecordsManager()?.resumeFreeRedeemAfterCdkImport?.({
          source: 'cdk-import-resume',
          channel: redeemChannel,
        });
      }
      return { imported, skipped };
    }

    function isDocumentVisibleForUpiRedeemCdkeyAutoRefresh() {
      if (documentRef && documentRef.hidden) {
        return false;
      }
      return true;
    }

    function isUpiRedeemCdkeyStatusAutoRefreshVisible() {
      if (!isDocumentVisibleForUpiRedeemCdkeyAutoRefresh()) {
        return false;
      }
      const selectedUpiPayment = Boolean(inputPlusModeEnabled?.checked)
        && String(getSelectedPlusPaymentMethod() || '').trim().toLowerCase() === plusPaymentMethodUpi;
      const cdkeyRowVisible = Boolean(
        rowUpiRedeemCdkeyPool
        && rowUpiRedeemCdkeyPool.style
        && rowUpiRedeemCdkeyPool.style.display !== 'none'
      );
      return selectedUpiPayment && cdkeyRowVisible;
    }

    function hasPendingUpiRedeemMembershipStatusRefresh(stateValue = getLatestState()) {
      const items = Array.isArray(stateValue?.upiCredentialMembershipCheckResults?.items)
        ? stateValue.upiCredentialMembershipCheckResults.items
        : [];
      return items.some((item) => {
        if (!item || typeof item !== 'object') {
          return false;
        }
        const cdkey = String(item.upiRedeemCdkey || item.cdkey || '').trim();
        if (!cdkey) {
          return false;
        }
        return isUpiRedeemRemoteActiveStatus(item.redeemStatus)
          || isUpiRedeemRemoteActiveStatus(item.remoteStatus)
          || isUpiRedeemRemoteActiveStatus(item.redeemReason);
      });
    }

    function shouldAutoRefreshUpiRedeemCdkeyStatuses() {
      const refreshVisible = isUpiRedeemCdkeyStatusAutoRefreshVisible();
      const pendingMembershipRefresh = isDocumentVisibleForUpiRedeemCdkeyAutoRefresh()
        && hasPendingUpiRedeemMembershipStatusRefresh(getLatestState());
      return Boolean(
        (refreshVisible || pendingMembershipRefresh)
        && (
          getCurrentUpiRedeemCdkeys('upi').length
          || getCurrentUpiRedeemCdkeys('ideal').length
        )
        && getCurrentUpiRedeemExternalApiKey()
      );
    }

    function clearUpiRedeemCdkeyStatusAutoRefresh() {
      if (!upiRedeemCdkeyStatusAutoRefreshTimer) {
        return;
      }
      clearInterval(upiRedeemCdkeyStatusAutoRefreshTimer);
      upiRedeemCdkeyStatusAutoRefreshTimer = null;
    }

    function triggerUpiRedeemCdkeyStatusAutoRefresh() {
      if (!shouldAutoRefreshUpiRedeemCdkeyStatuses()) {
        clearUpiRedeemCdkeyStatusAutoRefresh();
        return;
      }
      refreshAllUpiRedeemCdkeyStatuses({ silent: true, autoRefresh: true }).catch(() => {});
    }

    function scheduleUpiRedeemCdkeyStatusAutoRefresh(options = {}) {
      if (!shouldAutoRefreshUpiRedeemCdkeyStatuses()) {
        clearUpiRedeemCdkeyStatusAutoRefresh();
        return;
      }
      if (!upiRedeemCdkeyStatusAutoRefreshTimer) {
        upiRedeemCdkeyStatusAutoRefreshTimer = setInterval(
          triggerUpiRedeemCdkeyStatusAutoRefresh,
          statusAutoRefreshMs
        );
      }
      if (options.immediate) {
        triggerUpiRedeemCdkeyStatusAutoRefresh();
      }
    }

    async function refreshUpiRedeemCdkeyStatuses(options = {}) {
      const redeemChannel = normalizeRedeemChannel(options.channel || options.redeemChannel);
      const silent = Boolean(options.silent);
      const cdkeys = Array.isArray(options.cdkeys)
        ? parseUpiRedeemCdkeyPoolTextValue(options.cdkeys.join('\n'))
        : getCurrentUpiRedeemCdkeys(redeemChannel);
      if (!cdkeys.length) {
        if (!silent) {
          showToast('请先导入 CDK。', 'warn');
        }
        return { skipped: true, reason: 'empty-cdkeys' };
      }
      const upiRedeemExternalApiKey = getCurrentUpiRedeemExternalApiKey();
      const upiRedeemClientId = getCurrentUpiRedeemClientId();
      if (!upiRedeemExternalApiKey) {
        if (!silent) {
          showToast('请先填写 UPI External API Key。', 'warn');
        }
        return { skipped: true, reason: 'missing-external-api-key' };
      }
      if (upiRedeemCdkeyStatusRefreshInFlight) {
        if (!silent) {
          showToast('CDK 状态正在刷新，请稍候。', 'info');
        }
        return { skipped: true, reason: 'in-flight' };
      }

      let shouldResumeAutoRefresh = !options.autoRefresh;
      upiRedeemCdkeyStatusRefreshInFlight = true;
      if (!silent && btnUpiRedeemCdkeyStatusRefresh) {
        btnUpiRedeemCdkeyStatusRefresh.disabled = true;
        btnUpiRedeemCdkeyStatusRefresh.textContent = '刷新中';
      }
      try {
        const latestState = getLatestState();
        const response = await runtimeSendMessage({
          type: 'REFRESH_UPI_REDEEM_CDKEY_STATUSES',
          source: 'sidepanel',
          payload: {
            cdkeys,
            channel: redeemChannel,
            upiRedeemExternalApiKey,
            upiRedeemClientId,
            upiRedeemFailedAccountRetryLimit: normalizeUpiRedeemFailedAccountRetryLimit(
              inputUpiRedeemFailedAccountRetryLimit?.value,
              latestState?.upiRedeemFailedAccountRetryLimit
            ),
            autoRefresh: Boolean(options.autoRefresh),
            skipAutoRetry: options.allowAutoRetry === true
              ? Boolean(options.skipAutoRetry)
              : true,
            cdkPoolText: getStoredCdkPoolText(latestState, 'upi'),
            upiRedeemCdkPoolText: getStoredCdkPoolText(latestState, 'upi'),
            upiRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'upi'),
            pixRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'upi'),
            idealRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'ideal'),
          },
        });
        if (response?.error) {
          throw new Error(response.error);
        }
        if (response?.updates) {
          syncLatestState(response.updates);
        }
        const nextState = getLatestState();
        renderUpiRedeemCdkeyStatusList(nextState, redeemChannel);
        updateUpiRedeemCdkeyPoolSummary(nextState, { skipRender: true, channel: redeemChannel });
        renderAccountRecords(nextState);
        if (!silent) {
          const backendRetrySubmitted = Math.max(0, Math.floor(Number(response?.autoRetry?.backendJobRetry?.submitted) || 0));
          const localRetrySubmitted = Math.max(0, Math.floor(Number(response?.autoRetry?.localRetry?.submitted) || 0));
          const localRetryAttempted = Math.max(0, Math.floor(Number(response?.autoRetry?.localRetry?.attempted) || 0));
          const autoRetryParts = options.allowAutoRetry === true ? [
            backendRetrySubmitted ? `后端重试重新入列 ${backendRetrySubmitted} 个` : '',
            localRetrySubmitted || localRetryAttempted ? `换卡续兑 ${localRetrySubmitted || localRetryAttempted} 个` : '',
          ].filter(Boolean) : [];
          const autoRetryText = autoRetryParts.length ? `${autoRetryParts.join('，')}。` : '';
          showToast(`${getRedeemChannelLabel(redeemChannel)} CDK 状态已刷新：${response?.checkedCount || cdkeys.length} 条。${autoRetryText}`, 'success');
        }
        return response || {};
      } catch (error) {
        const rawMessage = error?.message || '刷新 CDK 状态失败。';
        const authError = isUpiRedeemApiAuthErrorMessage(rawMessage);
        const message = authError
          ? getUpiRedeemApiAuthErrorDisplayMessage(rawMessage)
          : rawMessage;
        if (authError) {
          clearUpiRedeemCdkeyStatusAutoRefresh();
          shouldResumeAutoRefresh = false;
        }
        if (!silent) {
          showToast(message, 'error');
        }
        return { error: message, authError };
      } finally {
        upiRedeemCdkeyStatusRefreshInFlight = false;
        if (!silent && btnUpiRedeemCdkeyStatusRefresh) {
          btnUpiRedeemCdkeyStatusRefresh.disabled = false;
          btnUpiRedeemCdkeyStatusRefresh.textContent = '刷新全部状态';
        }
        if (shouldResumeAutoRefresh) {
          scheduleUpiRedeemCdkeyStatusAutoRefresh();
        }
      }
    }

    async function refreshAllUpiRedeemCdkeyStatuses(options = {}) {
      const channels = ['upi', 'ideal'].filter((channel) => getCurrentUpiRedeemCdkeys(channel).length);
      if (!channels.length) {
        return refreshUpiRedeemCdkeyStatuses({ ...options, channel: 'upi' });
      }
      let latestResponse = {};
      for (const [index, channel] of channels.entries()) {
        const response = await refreshUpiRedeemCdkeyStatuses({
          ...options,
          channel,
          silent: Boolean(options.silent || index > 0),
        });
        latestResponse = response || {};
        if (latestResponse.authError) {
          break;
        }
      }
      return latestResponse;
    }

    function getUpiRedeemCdkeyJobOperationResultItem(response = {}, cdkey = '') {
      const normalizedCdkey = String(cdkey || '').trim().toLowerCase();
      return (Array.isArray(response?.items) ? response.items : [])
        .find((item) => String(item?.cdkey || item?.cdk || '').trim().toLowerCase() === normalizedCdkey)
        || null;
    }

    async function operateUpiRedeemCdkeyJob(cdkey = '', action = '', channel = 'upi') {
      const redeemChannel = normalizeRedeemChannel(channel);
      const normalizedCdkey = String(cdkey || '').trim();
      const normalizedAction = String(action || '').trim().toLowerCase();
      if (!normalizedCdkey || !['cancel', 'retry'].includes(normalizedAction)) {
        return;
      }
      if (isUpiRedeemCdkeyPoolMutationLocked() && normalizedAction !== 'cancel') {
        showToast('自动流程运行中不能手动重试 CDK 任务。', 'warn', 2200);
        renderUpiRedeemCdkeyStatusList(getLatestState(), redeemChannel);
        return;
      }

      const latestState = getLatestState();
      const response = await runtimeSendMessage({
        type: normalizedAction === 'cancel'
          ? 'CANCEL_UPI_REDEEM_CDKEY_JOBS'
          : 'RETRY_UPI_REDEEM_CDKEY_JOBS',
        source: 'sidepanel',
        payload: {
          cdkeys: [normalizedCdkey],
          channel: redeemChannel,
          upiRedeemExternalApiKey: getCurrentUpiRedeemExternalApiKey(),
          upiRedeemClientId: getCurrentUpiRedeemClientId(),
          cdkPoolText: getStoredCdkPoolText(latestState, 'upi'),
          upiRedeemCdkPoolText: getStoredCdkPoolText(latestState, 'upi'),
          upiRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'upi'),
          pixRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'upi'),
          idealRedeemCdkeyPoolText: getStoredCdkPoolText(latestState, 'ideal'),
        },
      });
      if (response?.error) {
        throw new Error(response.error);
      }
      if (response?.updates) {
        syncLatestState(response.updates);
      }
      const nextState = getLatestState();
      renderUpiRedeemCdkeyStatusList(nextState, redeemChannel);
      updateUpiRedeemCdkeyPoolSummary(nextState, { skipRender: true, channel: redeemChannel });

      const resultItem = getUpiRedeemCdkeyJobOperationResultItem(response, normalizedCdkey);
      const succeeded = normalizedAction === 'cancel'
        ? resultItem?.cancelled === true
        : resultItem?.retried === true;
      const reason = String(resultItem?.reason || '').trim();
      if (succeeded) {
        showToast(
          normalizedAction === 'cancel'
            ? `CDK ${normalizedCdkey} 已提交取消。`
            : `CDK ${normalizedCdkey} 已复用后端 access_token 重新入列。`,
          'success'
        );
      } else {
        showToast(
          `${normalizedAction === 'cancel' ? '取消' : '重试'}未完成：${reason || '后端未返回成功结果。'}`,
          'warn'
        );
      }

      await refreshUpiRedeemCdkeyStatuses({
        cdkeys: [normalizedCdkey],
        silent: true,
        skipAutoRetry: true,
        channel: redeemChannel,
      });
      scheduleUpiRedeemCdkeyStatusAutoRefresh();
    }

    return {
      shouldPreserveFocusedUpiRedeemCdkeyPoolEdit,
      importCdkPoolFromTextarea,
      deleteAllUpiRedeemCdkeys,
      refreshUpiRedeemCdkeyStatuses,
      refreshAllUpiRedeemCdkeyStatuses,
      scheduleUpiRedeemCdkeyStatusAutoRefresh,
      clearUpiRedeemCdkeyStatusAutoRefresh,
      updateUpiRedeemCdkeyPoolSummary,
      updateAllUpiRedeemCdkeyPoolSummaries,
    };
  }

  return { createUpiRedeemCdkController };
});
