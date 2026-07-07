(function attachSidepanelAutoRunStatusController(globalScope) {
  function createAutoRunStatusController(deps = {}) {
    const {
      dom = {},
      getters = {},
      helpers = {},
      state = {},
    } = deps;

    function applyAutoRunStatus(payload = getters.getCurrentAutoRun?.()) {
      state.syncAutoRunState?.(payload);
      const currentAutoRun = getters.getCurrentAutoRun?.() || {};
      const runLabel = helpers.getAutoRunLabel?.(currentAutoRun) || '';
      const locked = Boolean(helpers.isAutoRunLockedPhase?.());
      const paused = Boolean(helpers.isAutoRunPausedPhase?.());
      const scheduled = Boolean(helpers.isAutoRunScheduledPhase?.());
      const settingsCardLocked = scheduled || locked;

      helpers.setSettingsCardLocked?.(settingsCardLocked);

      if (dom.inputRunCount) {
        const runCountLocked = Boolean(helpers.shouldLockRunCountToEmailPool?.());
        dom.inputRunCount.disabled = Boolean(currentAutoRun.autoRunning) || runCountLocked;
        dom.inputRunCount.title = runCountLocked ? '运行次数已跟随当前可用邮箱数量' : '';
      }
      if (dom.btnAutoRun) dom.btnAutoRun.disabled = Boolean(currentAutoRun.autoRunning);
      if (dom.btnFetchEmail) {
        dom.btnFetchEmail.disabled = locked
          || Boolean(helpers.isCustomMailProvider?.())
          || Boolean(helpers.usesCustomEmailPoolGenerator?.());
      }
      if (dom.inputEmail) dom.inputEmail.disabled = locked;
      if (dom.inputSub2ApiAccountPriority) dom.inputSub2ApiAccountPriority.disabled = locked;
      if (dom.inputAutoSkipFailures) {
        dom.inputAutoSkipFailures.checked = true;
        dom.inputAutoSkipFailures.disabled = scheduled;
      }
      if (dom.inputAutoRunRetryNonFreeTrial) dom.inputAutoRunRetryNonFreeTrial.disabled = scheduled;
      if (dom.inputAutoRunRetryLegacyWalletCallback) dom.inputAutoRunRetryLegacyWalletCallback.disabled = scheduled;
      if (dom.inputRemovedContactCardDeclinedRetryEnabled) {
        dom.inputRemovedContactCardDeclinedRetryEnabled.disabled = scheduled;
      }

      const isSyncPhase = typeof helpers.isAutoRunSourceSyncPhase === 'function'
        ? helpers.isAutoRunSourceSyncPhase
        : (phase) => ['scheduled', 'running', 'waiting_step', 'waiting_email', 'retrying', 'waiting_interval'].includes(phase);
      const shouldSyncRunCount = typeof helpers.shouldSyncRunCountFromAutoRunSource === 'function'
        ? helpers.shouldSyncRunCountFromAutoRunSource(currentAutoRun)
        : (currentAutoRun.autoRunning || isSyncPhase(currentAutoRun.phase));
      if (shouldSyncRunCount && currentAutoRun.totalRuns > 0 && dom.inputRunCount) {
        dom.inputRunCount.value = String(currentAutoRun.totalRuns);
      }

      switch (currentAutoRun.phase) {
        case 'scheduled':
          if (dom.autoContinueBar) dom.autoContinueBar.style.display = 'none';
          if (dom.btnAutoRun) dom.btnAutoRun.innerHTML = `已计划${runLabel}`;
          break;
        case 'waiting_step':
          if (dom.autoContinueBar) dom.autoContinueBar.style.display = 'none';
          if (dom.btnAutoRun) dom.btnAutoRun.innerHTML = `等待中${runLabel}`;
          break;
        case 'waiting_email':
          if (dom.autoContinueBar) dom.autoContinueBar.style.display = 'flex';
          if (dom.btnAutoRun) dom.btnAutoRun.innerHTML = `已暂停${runLabel}`;
          break;
        case 'running':
          if (dom.autoContinueBar) dom.autoContinueBar.style.display = 'none';
          if (dom.btnAutoRun) dom.btnAutoRun.innerHTML = `运行中${runLabel}`;
          break;
        case 'retrying':
          if (dom.autoContinueBar) dom.autoContinueBar.style.display = 'none';
          if (dom.btnAutoRun) dom.btnAutoRun.innerHTML = `重试中${runLabel}`;
          break;
        case 'waiting_interval':
          if (dom.autoContinueBar) dom.autoContinueBar.style.display = 'none';
          if (dom.btnAutoRun) dom.btnAutoRun.innerHTML = `等待中${runLabel}`;
          break;
        default:
          if (dom.autoContinueBar) dom.autoContinueBar.style.display = 'none';
          helpers.setDefaultAutoRunButton?.();
          if (dom.inputEmail) dom.inputEmail.disabled = false;
          if (dom.btnFetchEmail && !locked) {
            dom.btnFetchEmail.disabled = Boolean(helpers.isCustomMailProvider?.())
              || Boolean(helpers.usesCustomEmailPoolGenerator?.());
          }
          break;
      }

      helpers.updateAutoDelayInputState?.();
      helpers.updateFallbackThreadIntervalInputState?.();
      helpers.syncScheduledCountdownTicker?.();
      const hasRunningStep = Object.values(helpers.getStepStatuses?.() || {}).some((status) => status === 'running');
      helpers.updateStopButtonState?.(scheduled || paused || locked || hasRunningStep);
      helpers.updateConfigMenuControls?.();
      helpers.renderContributionMode?.();
    }

    return { applyAutoRunStatus };
  }

  const api = { createAutoRunStatusController };
  globalScope.SidepanelAutoRunStatusController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
