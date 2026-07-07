(function attachSidepanelRemovedPaymentWorkerController(globalScope) {
  function setInputValue(documentRef, input, value = '') {
    if (!input) return;
    if (documentRef?.activeElement === input) return;
    const nextValue = String(value ?? '');
    if (input.value !== nextValue) input.value = nextValue;
  }

  function createRemovedPaymentWorkerController(deps = {}) {
    const {
      dom = {},
      helpers = {},
      normalizers = {},
      runtime = {},
      state = {},
    } = deps;

    function buildSettingsPayloadFromInputs() {
      const browserBackend = normalizers.normalizeBrowserBackend?.(dom.selectBrowserBackend?.value || 'local') || 'local';
      return {
        removedPaymentWorkerEnabled: Boolean(dom.inputEnabled?.checked),
        removedPaymentWorkerBrowserBackend: browserBackend,
        removedPaymentWorkerAdsPowerApiBase: normalizers.normalizeAdsPowerApiBase?.(dom.inputAdsPowerApiBase?.value || '') || '',
        removedPaymentWorkerAdsPowerApiKey: String(dom.inputAdsPowerApiKey?.value || '').trim(),
        removedPaymentWorkerAdsPowerProfileId: String(dom.inputAdsPowerProfileId?.value || '').trim(),
        removedPaymentWorkerRoxyBrowserApiBase: normalizers.normalizeRoxyBrowserApiBase?.(dom.inputRoxyBrowserApiBase?.value || '') || '',
        removedPaymentWorkerRoxyBrowserApiKey: String(dom.inputRoxyBrowserApiKey?.value || '').trim(),
        removedPaymentWorkerRoxyBrowserProfileId: String(dom.inputRoxyBrowserProfileId?.value || '').trim(),
        removedPaymentWorkerStripePublishableKey: String(dom.inputStripePublishableKey?.value || '').trim(),
        removedPaymentWorkerDeviceId: String(dom.inputDeviceId?.value || '').trim(),
        removedPaymentWorkerUserAgent: String(dom.inputUserAgent?.value || '').trim(),
        removedPaymentWorkerMaxAttempts: normalizers.normalizeMaxAttempts?.(dom.inputMaxAttempts?.value, helpers.defaultMaxAttempts) || helpers.defaultMaxAttempts,
        removedPaymentWorkerPaymentLocale: normalizers.normalizePaymentLocale?.(dom.selectPaymentLocale?.value || 'en') || 'en',
        removedPaymentWorkerCheckoutRebuildMaxAttempts: normalizers.normalizeCheckoutRebuildMaxAttempts?.(
          dom.inputCheckoutRebuildMaxAttempts?.value,
          3,
        ) || 3,
        removedPaymentWorkerDefaultProxy: String(dom.inputDefaultProxy?.value || '').trim(),
        removedPaymentWorkerProviderProxy: String(dom.inputProviderProxy?.value || '').trim(),
      };
    }

    function updateUi(nextState = state.getLatestState?.()) {
      const normalized = normalizers.normalizeSettings?.(nextState || {}) || {};
      const runtimeStatus = String(nextState?.removedPaymentWorkerJobStatus || '').trim().toLowerCase();
      const currentAttempt = Math.max(0, Number(nextState?.removedPaymentWorkerCurrentAttempt) || 0);
      const enabled = Boolean(normalized.removedPaymentWorkerEnabled);
      if (dom.section) dom.section.style.display = '';
      if (dom.inputEnabled) dom.inputEnabled.checked = enabled;
      if (dom.settingsShell) dom.settingsShell.hidden = !enabled;
      if (dom.selectBrowserBackend) dom.selectBrowserBackend.value = normalized.removedPaymentWorkerBrowserBackend;
      [
        dom.rowAdsPowerApiBase,
        dom.rowAdsPowerApiKey,
        dom.rowRoxyBrowserApiBase,
        dom.rowRoxyBrowserApiKey,
        dom.rowAdsPowerProfileId,
        dom.rowRoxyBrowserProfileId,
      ].forEach((row) => {
        if (row) row.style.display = '';
      });
      setInputValue(dom.document, dom.inputAdsPowerApiBase, normalized.removedPaymentWorkerAdsPowerApiBase);
      setInputValue(dom.document, dom.inputAdsPowerApiKey, normalized.removedPaymentWorkerAdsPowerApiKey);
      setInputValue(dom.document, dom.inputRoxyBrowserApiBase, normalized.removedPaymentWorkerRoxyBrowserApiBase);
      setInputValue(dom.document, dom.inputRoxyBrowserApiKey, normalized.removedPaymentWorkerRoxyBrowserApiKey);
      setInputValue(dom.document, dom.inputAdsPowerProfileId, normalized.removedPaymentWorkerAdsPowerProfileId);
      setInputValue(dom.document, dom.inputRoxyBrowserProfileId, normalized.removedPaymentWorkerRoxyBrowserProfileId);
      if (dom.inputStripePublishableKey) dom.inputStripePublishableKey.value = normalized.removedPaymentWorkerStripePublishableKey;
      if (dom.inputDeviceId) dom.inputDeviceId.value = normalized.removedPaymentWorkerDeviceId;
      if (dom.inputUserAgent) dom.inputUserAgent.value = normalized.removedPaymentWorkerUserAgent;
      if (dom.inputMaxAttempts) dom.inputMaxAttempts.value = String(normalized.removedPaymentWorkerMaxAttempts);
      if (dom.selectPaymentLocale) dom.selectPaymentLocale.value = normalized.removedPaymentWorkerPaymentLocale;
      if (dom.inputCheckoutRebuildMaxAttempts) dom.inputCheckoutRebuildMaxAttempts.value = String(normalized.removedPaymentWorkerCheckoutRebuildMaxAttempts);
      if (dom.inputDefaultProxy) dom.inputDefaultProxy.value = normalized.removedPaymentWorkerDefaultProxy;
      if (dom.inputProviderProxy) dom.inputProviderProxy.value = normalized.removedPaymentWorkerProviderProxy;
      if (dom.rowProviderProxy) dom.rowProviderProxy.hidden = false;
      if (dom.displayStatus) dom.displayStatus.textContent = enabled ? '已启用' : '默认关闭';
      if (dom.displayRuntime) {
        if (runtimeStatus === 'pending') {
          dom.displayRuntime.textContent = `准备中：第 ${currentAttempt} / ${normalized.removedPaymentWorkerMaxAttempts} 次`;
        } else if (runtimeStatus === 'running') {
          dom.displayRuntime.textContent = `运行中：第 ${currentAttempt} / ${normalized.removedPaymentWorkerMaxAttempts} 次`;
        } else if (runtimeStatus === 'paused') {
          dom.displayRuntime.textContent = `已暂停：第 ${currentAttempt} / ${normalized.removedPaymentWorkerMaxAttempts} 次`;
        } else if (runtimeStatus === 'succeeded') {
          dom.displayRuntime.textContent = `已成功：第 ${currentAttempt} 次`;
        } else if (runtimeStatus === 'failed') {
          dom.displayRuntime.textContent = `已失败：共 ${currentAttempt} 次`;
        } else {
          dom.displayRuntime.textContent = '未运行';
        }
      }
      if (dom.btnPause) dom.btnPause.disabled = !(enabled && (runtimeStatus === 'running' || runtimeStatus === 'pending'));
      if (dom.btnResume) dom.btnResume.disabled = !(enabled && runtimeStatus === 'paused');
    }

    function resetInputsToDefaults() {
      const defaults = helpers.buildDefaults?.() || {};
      const assignments = [
        [dom.inputEnabled, 'checked', defaults.removedPaymentWorkerEnabled],
        [dom.selectBrowserBackend, 'value', defaults.removedPaymentWorkerBrowserBackend],
        [dom.inputAdsPowerApiBase, 'value', defaults.removedPaymentWorkerAdsPowerApiBase],
        [dom.inputAdsPowerApiKey, 'value', defaults.removedPaymentWorkerAdsPowerApiKey],
        [dom.inputAdsPowerProfileId, 'value', defaults.removedPaymentWorkerAdsPowerProfileId],
        [dom.inputRoxyBrowserProfileId, 'value', defaults.removedPaymentWorkerRoxyBrowserProfileId],
        [dom.inputRoxyBrowserApiBase, 'value', defaults.removedPaymentWorkerRoxyBrowserApiBase],
        [dom.inputRoxyBrowserApiKey, 'value', defaults.removedPaymentWorkerRoxyBrowserApiKey],
        [dom.inputStripePublishableKey, 'value', defaults.removedPaymentWorkerStripePublishableKey],
        [dom.inputDeviceId, 'value', defaults.removedPaymentWorkerDeviceId],
        [dom.inputUserAgent, 'value', defaults.removedPaymentWorkerUserAgent],
        [dom.inputMaxAttempts, 'value', String(defaults.removedPaymentWorkerMaxAttempts)],
        [dom.selectPaymentLocale, 'value', defaults.removedPaymentWorkerPaymentLocale],
        [dom.inputCheckoutRebuildMaxAttempts, 'value', String(defaults.removedPaymentWorkerCheckoutRebuildMaxAttempts)],
        [dom.inputDefaultProxy, 'value', defaults.removedPaymentWorkerDefaultProxy],
        [dom.inputProviderProxy, 'value', defaults.removedPaymentWorkerProviderProxy],
      ];
      assignments.forEach(([element, prop, value]) => {
        if (element) element[prop] = value;
      });
      updateUi({ ...(state.getLatestState?.() || {}), ...defaults });
    }

    async function saveSettings() {
      const payload = buildSettingsPayloadFromInputs();
      const activeWindowId = payload.removedPaymentWorkerBrowserBackend === 'roxybrowser'
        ? payload.removedPaymentWorkerRoxyBrowserProfileId
        : payload.removedPaymentWorkerAdsPowerProfileId;
      if (payload.removedPaymentWorkerBrowserBackend === 'adspower' && !activeWindowId) {
        throw new Error('AdsPower窗口ID 为必填项。');
      }
      if (payload.removedPaymentWorkerBrowserBackend === 'roxybrowser' && !activeWindowId) {
        throw new Error('RoxyBrowser窗口ID 为必填项。');
      }
      if (payload.removedPaymentWorkerBrowserBackend === 'roxybrowser' && /^\d+$/.test(activeWindowId || '')) {
        throw new Error('RoxyBrowser窗口ID 不是 workspaceId。请在 RoxyBrowser-全部窗口-右键窗口-窗口操作-复制窗口ID。');
      }
      if (payload.removedPaymentWorkerBrowserBackend === 'roxybrowser' && !payload.removedPaymentWorkerRoxyBrowserApiKey) {
        throw new Error('RoxyBrowser API Key 为必填项。');
      }
      updateInputValuesFromPayload(payload);
      const response = await runtime.sendRuntimeMessageWithTimeout?.({
        type: 'SAVE_SETTING',
        source: 'sidepanel',
        payload,
      }, 20000, '保存 RemovedPaymentWorker 配置');
      if (response?.error) throw new Error(response.error);
      state.syncLatestState?.({
        ...(state.getLatestState?.() || {}),
        ...payload,
        ...(response?.state && typeof response.state === 'object' ? response.state : {}),
      });
      updateUi(state.getLatestState?.());
      helpers.markSettingsDirty?.(false);
      helpers.showToast?.('RemovedPaymentWorker 配置已保存。', 'success', 1800);
    }

    function updateInputValuesFromPayload(payload = {}) {
      const assignments = [
        [dom.selectBrowserBackend, payload.removedPaymentWorkerBrowserBackend],
        [dom.inputAdsPowerApiBase, payload.removedPaymentWorkerAdsPowerApiBase],
        [dom.inputAdsPowerApiKey, payload.removedPaymentWorkerAdsPowerApiKey],
        [dom.inputAdsPowerProfileId, payload.removedPaymentWorkerAdsPowerProfileId],
        [dom.inputRoxyBrowserProfileId, payload.removedPaymentWorkerRoxyBrowserProfileId],
        [dom.inputRoxyBrowserApiBase, payload.removedPaymentWorkerRoxyBrowserApiBase],
        [dom.inputRoxyBrowserApiKey, payload.removedPaymentWorkerRoxyBrowserApiKey],
        [dom.inputMaxAttempts, String(payload.removedPaymentWorkerMaxAttempts)],
        [dom.selectPaymentLocale, payload.removedPaymentWorkerPaymentLocale],
        [dom.inputCheckoutRebuildMaxAttempts, String(payload.removedPaymentWorkerCheckoutRebuildMaxAttempts)],
        [dom.inputDefaultProxy, payload.removedPaymentWorkerDefaultProxy],
        [dom.inputProviderProxy, payload.removedPaymentWorkerProviderProxy],
      ];
      assignments.forEach(([element, value]) => {
        if (element) element.value = value;
      });
    }

    async function clearSettings() {
      const defaults = helpers.buildDefaults?.() || {};
      resetInputsToDefaults();
      const response = await runtime.sendRuntimeMessageWithTimeout?.({
        type: 'SAVE_SETTING',
        source: 'sidepanel',
        payload: defaults,
      }, 20000, '清除 RemovedPaymentWorker 配置');
      if (response?.error) throw new Error(response.error);
      state.syncLatestState?.({
        ...(state.getLatestState?.() || {}),
        ...defaults,
        ...(response?.state && typeof response.state === 'object' ? response.state : {}),
      });
      updateUi(state.getLatestState?.());
      helpers.markSettingsDirty?.(false);
      helpers.showToast?.('RemovedPaymentWorker 配置已重置。', 'success', 1800);
    }

    async function controlJob(action = 'pause') {
      const type = action === 'resume' ? 'REMOVED_PAYMENT_WORKER_RESUME_JOB' : 'REMOVED_PAYMENT_WORKER_PAUSE_JOB';
      const response = await runtime.sendRuntimeMessageWithTimeout?.({
        type,
        source: 'sidepanel',
        payload: {},
      }, 20000, action === 'resume' ? '继续 RemovedPaymentWorker 任务' : '暂停 RemovedPaymentWorker 任务');
      if (response?.error) throw new Error(response.error);
      if (response?.state && typeof response.state === 'object') {
        state.syncLatestState?.({ ...(state.getLatestState?.() || {}), ...response.state });
        updateUi(state.getLatestState?.());
      }
      helpers.showToast?.(action === 'resume' ? 'RemovedPaymentWorker 已继续。' : 'RemovedPaymentWorker 已请求暂停。', 'info', 1800);
    }

    return {
      buildSettingsPayloadFromInputs,
      clearSettings,
      controlJob,
      resetInputsToDefaults,
      saveSettings,
      updateUi,
    };
  }

  const api = { createRemovedPaymentWorkerController };
  globalScope.SidepanelRemovedPaymentWorkerController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
