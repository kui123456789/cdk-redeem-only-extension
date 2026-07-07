(function attachSidepanelSettingsController(root, factory) {
  const api = factory();
  root.SidepanelSettingsController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelSettingsControllerModule() {
  function createCombinedScope(appState, scopeValues = {}) {
  const stateScope = appState?.createScope?.() || {};
  const globalScope = typeof globalThis !== 'undefined' ? globalThis : {};
  return new Proxy({}, {
    has(_target, prop) {
      if (prop === Symbol.unscopables) {
        return false;
      }
      return true;
    },
    get(_target, prop) {
      if (prop === Symbol.unscopables) {
        return undefined;
      }
      if (prop in scopeValues) {
        return scopeValues[prop];
      }
      if (prop in stateScope) {
        return stateScope[prop];
      }
      return globalScope[prop];
    },
    set(_target, prop, value) {
      if (typeof prop === 'string' && prop in scopeValues) {
        scopeValues[prop] = value;
        return true;
      }
      stateScope[prop] = value;
      return true;
    },
  });
}

  function createSettingsController(deps = {}) {
    const { appState = null, scopeValues = {} } = deps;
    const scope = createCombinedScope(appState, scopeValues);
    with (scope) {
      function markSettingsDirty(isDirty = true) {
        settingsDirty = isDirty;
        if (isDirty) {
          settingsSaveRevision += 1;
        }
        updateSaveButtonState();
      }
      
      function updateSaveButtonState() {
        btnSaveSettings.disabled = settingsSaveInFlight || !settingsDirty;
        updateConfigMenuControls();
        btnSaveSettings.textContent = settingsSaveInFlight ? '保存中' : '保存';
      }
      
      function scheduleSettingsAutoSave() {
        clearTimeout(settingsAutoSaveTimer);
        settingsAutoSaveTimer = setTimeout(() => {
          saveSettings({ silent: true }).catch(() => { });
        }, 500);
      }
      
      function scheduleSettingsSave() {
        markSettingsDirty(true);
        scheduleSettingsAutoSave();
      }
      
      function shouldUseSettingsCardAutosave(target) {
        if (!target || typeof target.matches !== 'function') {
          return false;
        }
        if (!target.matches('input, select, textarea')) {
          return false;
        }
        const type = String(target.type || '').trim().toLowerCase();
        if (['button', 'submit', 'reset', 'file', 'hidden'].includes(type)) {
          return false;
        }
        return ![
          'input-custom-email-pool-search',
          'select-custom-email-pool-filter',
          'checkbox-custom-email-pool-select-all',
          'input-upi-redeem-cdkey-pool',
          'input-ideal-redeem-cdkey-pool',
        ].includes(String(target.id || '').trim());
      }
      
      function queueSettingsCardAutosaveFromEvent(event) {
        const target = event?.target;
        if (!shouldUseSettingsCardAutosave(target)) {
          return;
        }
        markSettingsDirty(true);
        scheduleSettingsAutoSave();
      }
      
      function flushDirtySettingsBeforePanelUnload() {
        clearTimeout(settingsAutoSaveTimer);
        if (!settingsDirty || settingsSaveInFlight) {
          return;
        }
        saveSettings({ silent: true }).catch(() => { });
      }
      
      async function sendRuntimeMessageWithTimeout(message, timeoutMs = 20000, timeoutLabel = '请求') {
        const effectiveTimeoutMs = Math.max(1000, Number(timeoutMs) || 20000);
        let timer = null;
        try {
          return await Promise.race([
            chrome.runtime.sendMessage(message),
            new Promise((_, reject) => {
              timer = setTimeout(() => {
                reject(new Error(`${timeoutLabel}超时（>${Math.round(effectiveTimeoutMs / 1000)} 秒）`));
              }, effectiveTimeoutMs);
            }),
          ]);
        } finally {
          if (timer) {
            clearTimeout(timer);
          }
        }
      }
      
      async function saveSettings(options = {}) {
        const { silent = false, force = false } = options;
        clearTimeout(settingsAutoSaveTimer);
      
        if (!force && !settingsDirty && !settingsSaveInFlight && silent) {
          return;
        }
      
        const payload = collectSettingsPayload();
        const saveRevision = settingsSaveRevision;
        settingsSaveInFlight = true;
        updateSaveButtonState();
      
        try {
          const response = await sendRuntimeMessageWithTimeout({
            type: 'SAVE_SETTING',
            source: 'sidepanel',
            payload,
          }, 15000, '保存配置');
      
          if (response?.error) {
            throw new Error(response.error);
          }
      
          if (saveRevision !== settingsSaveRevision) {
            return;
          }
      
          if (response?.state) {
            applySettingsState(preserveHotmailAccountsForSettingsSaveResponse(response.state, payload));
          } else {
            syncLatestState(payload);
            markSettingsDirty(false);
            updatePanelModeUI();
            updateMailProviderUI();
            updateButtonStates();
          }
          if (!silent) {
            showToast('配置已保存', 'success', 1800);
          }
        } catch (err) {
          markSettingsDirty(true);
          if (!silent) {
            showToast(`保存失败：${err.message}`, 'error');
          }
          throw err;
        } finally {
          settingsSaveInFlight = false;
          updateSaveButtonState();
        }
      }
      
      function buildCustomEmailPoolSettingsPayload(extraPayload = {}) {
        const entries = typeof getNormalizedCustomEmailPoolEntriesState === 'function'
          ? getNormalizedCustomEmailPoolEntriesState()
          : [];
        const activeEmails = typeof getActiveCustomEmailPoolEmails === 'function'
          ? getActiveCustomEmailPoolEmails(entries)
          : [];
        const payload = {
          customEmailPoolEntries: entries,
          customEmailPool: activeEmails,
          selectedCustomEmailPoolEmail: String(
            extraPayload.selectedCustomEmailPoolEmail ?? latestState?.selectedCustomEmailPoolEmail ?? ''
          ).trim().toLowerCase(),
        };
        if (Object.prototype.hasOwnProperty.call(extraPayload, 'email')) {
          payload.email = String(extraPayload.email || '').trim().toLowerCase();
        }
        return payload;
      }
      
      async function persistCustomEmailPoolSettings(extraPayload = {}) {
        const payload = buildCustomEmailPoolSettingsPayload(extraPayload);
        const response = await sendRuntimeMessageWithTimeout({
          type: 'SAVE_SETTING',
          source: 'sidepanel',
          payload,
        }, 15000, '保存自定义邮箱池');
      
        if (response?.error) {
          throw new Error(response.error);
        }
      
        syncLatestState({
          customEmailPoolEntries: response?.state?.customEmailPoolEntries ?? payload.customEmailPoolEntries,
          customEmailPool: response?.state?.customEmailPool ?? payload.customEmailPool,
          selectedCustomEmailPoolEmail: response?.state?.selectedCustomEmailPoolEmail ?? payload.selectedCustomEmailPoolEmail,
          ...(Object.prototype.hasOwnProperty.call(payload, 'email')
            ? { email: response?.state?.email ?? payload.email }
            : {}),
        });
        return response;
      }
      
      async function persistCustomPasswordInput(options = {}) {
        const { silent = true } = options;
        const customPassword = inputPassword.value;
        const saveRevision = customPasswordSaveRevision + 1;
        customPasswordSaveRevision = saveRevision;
        syncLatestState({ customPassword });
      
        try {
          const response = await sendRuntimeMessageWithTimeout({
            type: 'SAVE_SETTING',
            source: 'sidepanel',
            payload: { customPassword },
          }, 8000, '保存账户密码');
      
          if (response?.error) {
            throw new Error(response.error);
          }
          if (saveRevision === customPasswordSaveRevision) {
            syncLatestState({ customPassword });
          }
        } catch (err) {
          markSettingsDirty(true);
          if (!silent) {
            showToast(`账户密码保存失败：${err.message}`, 'error');
          } else {
            console.warn('账户密码保存失败：', err);
          }
        }
      }

      async function waitForSettingsSaveIdle() {
        while (settingsSaveInFlight) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      async function flushPendingSettingsBeforeExport() {
        clearTimeout(settingsAutoSaveTimer);
        await waitForSettingsSaveIdle();
        if (settingsDirty) {
          await saveSettings({ silent: true });
        }
      }

      async function settlePendingSettingsBeforeImport() {
        clearTimeout(settingsAutoSaveTimer);
        await waitForSettingsSaveIdle();
      }
      
      async function persistCurrentSettingsForAction() {
        clearTimeout(settingsAutoSaveTimer);
        await waitForSettingsSaveIdle();
        await saveSettings({ silent: true, force: true });
      }
      return {
        markSettingsDirty,
        updateSaveButtonState,
        scheduleSettingsAutoSave,
        scheduleSettingsSave,
        shouldUseSettingsCardAutosave,
        queueSettingsCardAutosaveFromEvent,
        flushDirtySettingsBeforePanelUnload,
        waitForSettingsSaveIdle,
        flushPendingSettingsBeforeExport,
        settlePendingSettingsBeforeImport,
        sendRuntimeMessageWithTimeout,
        buildCustomEmailPoolSettingsPayload,
        persistCustomEmailPoolSettings,
        persistCustomPasswordInput,
        saveSettings,
        persistCurrentSettingsForAction,
      };
    }
  }

  return { createSettingsController };
});
