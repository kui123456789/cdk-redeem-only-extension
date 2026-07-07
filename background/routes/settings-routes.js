(function attachSettingsRoutes(root, factory) {
  const api = factory();
  root.MultiPageSettingsRoutes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createSettingsRoutesModule() {
  function requireHandler(handler, name) {
    if (typeof handler !== 'function') {
      throw new Error(`Missing settings route handler: ${name}`);
    }
    return handler;
  }

  function hasOwn(source = {}, key = '') {
    return Object.prototype.hasOwnProperty.call(source, key);
  }

  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function normalizePlusPaymentMethodForDisplay(value = '') {
    const normalized = normalizeString(value).toLowerCase();
    if (normalized === 'legacyPay') {
      return 'legacyPay';
    }
    if (normalized === 'cardHelper-helper') {
      return 'cardHelper-helper';
    }
    if (normalized === 'upi' || normalized === 'pix') {
      return 'upi';
    }
    return 'legacyWallet';
  }

  function getPlusPaymentMethodLabel(value = '') {
    const method = normalizePlusPaymentMethodForDisplay(value);
    if (method === 'cardHelper-helper') {
      return 'CARD_HELPER';
    }
    if (method === 'upi') {
      return 'UPI';
    }
    return method === 'legacyPay' ? 'LegacyPay' : 'LegacyWallet';
  }

  function createSettingsRoutes(deps = {}) {
    const {
      addLog,
      broadcastDataUpdate,
      buildLuckmailSessionSettingsPayload,
      buildPersistentSettingsPayload,
      exportSettingsBundle,
      getNodeIdsForState,
      getState,
      getStepIdsForState,
      getStepKeyForState,
      importSettingsBundle,
      normalizeHotmailAccounts,
      resolveSignupMethod,
      setContributionMode,
      setPersistentSettings,
      setState,
      validateModeSwitch,
    } = deps;

    async function saveSetting(payload = {}) {
      const currentState = await requireHandler(getState, 'getState')();
      const updates = requireHandler(buildPersistentSettingsPayload, 'buildPersistentSettingsPayload')(payload || {});
      if (
        hasOwn(updates, 'hotmailAccounts')
        && requireHandler(normalizeHotmailAccounts, 'normalizeHotmailAccounts')(updates.hotmailAccounts).length === 0
        && requireHandler(normalizeHotmailAccounts, 'normalizeHotmailAccounts')(currentState.hotmailAccounts).length > 0
      ) {
        delete updates.hotmailAccounts;
      }
      const sessionUpdates = requireHandler(buildLuckmailSessionSettingsPayload, 'buildLuckmailSessionSettingsPayload')(payload || {});
      const modeValidation = requireHandler(validateModeSwitch, 'validateModeSwitch')({
        ...currentState,
        ...updates,
        resolvedSignupMethod: null,
      }, {
        changedKeys: Object.keys(updates),
      });
      if (modeValidation?.normalizedUpdates && Object.keys(modeValidation.normalizedUpdates).length > 0) {
        Object.assign(updates, modeValidation.normalizedUpdates);
      }
      const nextSignupState = {
        ...currentState,
        ...updates,
        resolvedSignupMethod: null,
      };
      if (
        hasOwn(updates, 'plusModeEnabled')
        || hasOwn(updates, 'signupMethod')
        || hasOwn(updates, 'panelMode')
        || hasOwn(updates, 'activeFlowId')
        || hasOwn(updates, 'contributionMode')
      ) {
        updates.signupMethod = requireHandler(resolveSignupMethod, 'resolveSignupMethod')(nextSignupState);
      }
      const modeChanged = hasOwn(updates, 'plusModeEnabled')
        && Boolean(currentState?.plusModeEnabled) !== Boolean(updates.plusModeEnabled);
      const plusPaymentChanged = hasOwn(updates, 'plusPaymentMethod')
        && normalizePlusPaymentMethodForDisplay(currentState?.plusPaymentMethod || 'legacyWallet')
          !== normalizePlusPaymentMethodForDisplay(updates.plusPaymentMethod || 'legacyWallet');
      const nextPlusModeEnabled = hasOwn(updates, 'plusModeEnabled')
        ? Boolean(updates.plusModeEnabled)
        : Boolean(currentState?.plusModeEnabled);
      const stepModeChanged = modeChanged
        || (nextPlusModeEnabled && plusPaymentChanged);
      const oauthFlowTimeoutDisabled = hasOwn(updates, 'oauthFlowTimeoutEnabled')
        && updates.oauthFlowTimeoutEnabled === false;
      await requireHandler(setPersistentSettings, 'setPersistentSettings')(updates);
      const stateUpdates = {
        ...updates,
        ...sessionUpdates,
        ...(oauthFlowTimeoutDisabled ? {
          oauthFlowDeadlineAt: null,
          oauthFlowDeadlineSourceUrl: null,
        } : {}),
      };
      if (hasOwn(updates, 'icloudHostPreference')) {
        const nextHostPreference = String(updates.icloudHostPreference || '').trim().toLowerCase();
        stateUpdates.preferredIcloudHost = nextHostPreference === 'icloud.com' || nextHostPreference === 'icloud.com.cn'
          ? nextHostPreference
          : '';
      }
      if (stepModeChanged && typeof getStepIdsForState === 'function') {
        const nextStateForSteps = { ...currentState, ...stateUpdates };
        const nextNodeIds = typeof getNodeIdsForState === 'function'
          ? getNodeIdsForState(nextStateForSteps)
          : getStepIdsForState(nextStateForSteps).map((stepId) => requireHandler(getStepKeyForState, 'getStepKeyForState')(stepId, nextStateForSteps)).filter(Boolean);
        stateUpdates.nodeStatuses = Object.fromEntries(nextNodeIds.map((nodeId) => [nodeId, 'pending']));
        stateUpdates.currentNodeId = '';
      }
      await requireHandler(setState, 'setState')(stateUpdates);
      if (Boolean(currentState?.contributionMode) && typeof setContributionMode === 'function') {
        await setContributionMode(true);
      }
      if (Object.keys(stateUpdates).length > 0 && typeof broadcastDataUpdate === 'function') {
        broadcastDataUpdate(stateUpdates);
      }
      if (modeChanged) {
        const selectedPlusPaymentMethod = getPlusPaymentMethodLabel(
          stateUpdates.plusPaymentMethod ?? currentState?.plusPaymentMethod ?? 'legacyWallet'
        );
        await requireHandler(addLog, 'addLog')(
          Boolean(updates.plusModeEnabled)
            ? `Plus 模式已开启，已切换为 ChatGPT 会话读取 步骤，当前支付方式：${selectedPlusPaymentMethod}。`
            : 'Plus 模式已关闭，已恢复普通注册授权步骤。',
          'info'
        );
      } else if (plusPaymentChanged && nextPlusModeEnabled) {
        const selectedPlusPaymentMethod = getPlusPaymentMethodLabel(
          stateUpdates.plusPaymentMethod ?? currentState?.plusPaymentMethod ?? 'legacyWallet'
        );
        await requireHandler(addLog, 'addLog')(`Plus 支付方式已切换为 ${selectedPlusPaymentMethod}，已更新对应的 Plus 步骤。`, 'info');
      }
      return {
        ok: true,
        modeValidation,
        state: await requireHandler(getState, 'getState')(),
      };
    }

    async function exportSettings() {
      return { ok: true, ...(await requireHandler(exportSettingsBundle, 'exportSettingsBundle')()) };
    }

    async function importSettings(payload = {}) {
      const state = await requireHandler(importSettingsBundle, 'importSettingsBundle')(payload?.config || null);
      return { ok: true, state };
    }

    return {
      SAVE_SETTING: saveSetting,
      EXPORT_SETTINGS: exportSettings,
      IMPORT_SETTINGS: importSettings,
    };
  }

  return {
    createSettingsRoutes,
  };
});
