(function attachSidepanelWorkflowController(root, factory) {
  const api = factory(root);
  root.SidepanelWorkflowController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelWorkflowControllerModule(rootScope) {
  function getWorkflowActionBindingsApi() {
    return rootScope.SidepanelWorkflowActionBindings
      || (typeof require === 'function' ? require('./workflow-action-bindings.js') : null);
  }

  function createWorkflowController(context = {}) {
    const {
      dom = {},
      managers = {},
      actions = {},
      state = {},
      workflow = {},
      helpers = {},
    } = context;

    let workflowActionBindings = null;
    let renderingMissingStepsList = false;

    function getLatestState() {
      return state.getLatestState?.() || {};
    }

    function getNodeIds() {
      return workflow.getNodeIds?.() || [];
    }

    function getWorkflowNodes() {
      return workflow.getWorkflowNodes?.() || [];
    }

    function getNodeStatuses(currentState = getLatestState()) {
      return workflow.getNodeStatuses?.(currentState) || {};
    }

    function renderStepsList() {
      managers.workflowStateView?.renderStepsList?.();
    }

    function ensureStepsListRendered() {
      if (renderingMissingStepsList || !dom.stepsList) {
        return false;
      }
      if (!getWorkflowNodes().length || dom.stepsList.querySelector?.('.step-row')) {
        return false;
      }
      renderingMissingStepsList = true;
      try {
        renderStepsList();
      } finally {
        renderingMissingStepsList = false;
      }
      return true;
    }

    function syncStepDefinitionsForMode(plusModeEnabled = false, plusPaymentMethodOrOptions = {}, maybeOptions = {}) {
      const options = typeof plusPaymentMethodOrOptions === 'string'
        ? maybeOptions
        : (plusPaymentMethodOrOptions || {});
      const latestState = getLatestState();
      const rawPaymentMethod = typeof plusPaymentMethodOrOptions === 'string'
        ? plusPaymentMethodOrOptions
        : (options.plusPaymentMethod || workflow.getSelectedPlusPaymentMethod?.(latestState));
      const stepDefinitionState = typeof workflow.resolveStepDefinitionCapabilityState === 'function'
        ? workflow.resolveStepDefinitionCapabilityState({
          ...(latestState || {}),
          plusModeEnabled: Boolean(plusModeEnabled),
          plusPaymentMethod: rawPaymentMethod,
          plusAccountAccessStrategy: options.plusAccountAccessStrategy || latestState?.plusAccountAccessStrategy,
          signupMethod: options.signupMethod || workflow.getCurrentSignupMethod?.(),
          registrationFreeRoute: options.registrationFreeRoute || latestState?.registrationFreeRoute,
          panelMode: options.panelMode || latestState?.panelMode,
          activeFlowId: options.activeFlowId || latestState?.activeFlowId,
        }, {
          signupMethod: options.signupMethod || workflow.getCurrentSignupMethod?.(),
          plusAccountAccessStrategy: options.plusAccountAccessStrategy || latestState?.plusAccountAccessStrategy,
          registrationFreeRoute: options.registrationFreeRoute || latestState?.registrationFreeRoute,
          panelMode: options.panelMode || latestState?.panelMode,
          activeFlowId: options.activeFlowId || latestState?.activeFlowId,
        })
        : {
          plusModeEnabled: Boolean(plusModeEnabled),
          signupMethod: helpers.normalizeSignupMethod?.(options.signupMethod || workflow.getCurrentSignupMethod?.() || workflow.defaultSignupMethod),
          plusAccountAccessStrategy: workflow.normalizePlusAccountAccessStrategy?.(options.plusAccountAccessStrategy || workflow.getCurrentPlusAccountAccessStrategy?.()),
        };

      workflow.rebuildStepDefinitionState?.(Boolean(stepDefinitionState.plusModeEnabled), {
        activeFlowId: options.activeFlowId,
        panelMode: options.panelMode,
        plusPaymentMethod: rawPaymentMethod,
        plusAccountAccessStrategy: stepDefinitionState.plusAccountAccessStrategy,
        signupMethod: stepDefinitionState.signupMethod,
        upiRedeemStopAfterRedeem: options.upiRedeemStopAfterRedeem ?? workflow.getCurrentUpiRedeemStopAfterRedeem?.(),
        upiRedeemContinueAfterRedeem: options.upiRedeemContinueAfterRedeem,
        totpMfaAfterProfileEnabled: options.totpMfaAfterProfileEnabled ?? workflow.getCurrentTotpMfaAfterProfileEnabled?.(),
        registrationFreeRoute: options.registrationFreeRoute ?? workflow.getCurrentRegistrationFreeRoute?.(),
      });

      if (latestState && typeof state.setLatestState === 'function') {
        state.setLatestState({
          ...latestState,
          nodeStatuses: getNodeStatuses(latestState),
        });
      }

      renderStepsList();
    }

    function renderSingleNodeStatus(nodeId, status) {
      managers.workflowStateView?.renderSingleNodeStatus?.(nodeId, status);
    }

    function renderSingleStepStatus(step, status) {
      managers.workflowStateView?.renderSingleStepStatus?.(step, status);
    }

    function renderStepStatuses(currentState = getLatestState()) {
      managers.workflowStateView?.renderStepStatuses?.(currentState);
    }

    function updateProgressCounter() {
      managers.workflowStateView?.updateProgressCounter?.();
    }

    function arePreviousNodesReadyForManualExecute(nodeId = '', statuses = getNodeStatuses()) {
      return managers.workflowButtonStateManager?.arePreviousNodesReadyForManualExecute?.(nodeId, statuses) || false;
    }

    function canExecuteNodeWithoutPreviousNode(nodeId = '', statuses = getNodeStatuses()) {
      return managers.workflowButtonStateManager?.canExecuteNodeWithoutPreviousNode?.(nodeId, statuses) || false;
    }

    function updateStopButtonState(active) {
      if (dom.btnStop) {
        dom.btnStop.disabled = !active;
      }
    }

    function updateButtonStates() {
      ensureStepsListRendered();
      const statuses = getNodeStatuses(getLatestState());
      const anyRunning = Object.values(statuses).some((status) => status === 'running');
      const autoLocked = workflow.isAutoRunLockedPhase?.() || false;
      const autoScheduled = workflow.isAutoRunScheduledPhase?.() || false;
      const autoPaused = workflow.isAutoRunPausedPhase?.() || false;

      getNodeIds().forEach((nodeId, index) => {
        const selectorNodeId = helpers.escapeCssValue?.(nodeId) || String(nodeId || '');
        const btn = dom.document?.querySelector?.(`.step-btn[data-node-id="${selectorNodeId}"]`);
        if (!btn) {
          return;
        }
        btn.disabled = Boolean(managers.workflowButtonStateManager?.getStepButtonState?.({
          nodeId,
          index,
          statuses,
          anyRunning,
          autoLocked,
          autoScheduled,
        }).disabled);
      });

      dom.document?.querySelectorAll?.('.step-manual-btn')?.forEach?.((btn) => {
        const nodeId = String(btn.dataset.nodeId || '').trim();
        const skipState = managers.workflowButtonStateManager?.getManualSkipButtonState?.({
          nodeId,
          statuses,
          anyRunning,
          autoLocked,
          autoScheduled,
        }) || {};
        btn.style.display = skipState.visible ? '' : 'none';
        btn.disabled = Boolean(skipState.disabled);
        btn.title = skipState.title || '';
      });

      const workflowControlsBusy = Boolean(managers.workflowButtonStateManager?.isResetDisabled?.({
        anyRunning,
        autoScheduled,
        autoPaused,
        autoLocked,
      }));
      if (dom.btnReset) {
        dom.btnReset.disabled = workflowControlsBusy;
      }
      updateStopButtonState(workflowControlsBusy);
      updateProgressCounter();
    }

    function updateNodeUI(nodeId, status) {
      const normalizedNodeId = String(nodeId || '').trim();
      if (!normalizedNodeId) {
        return;
      }
      actions.syncLatestState?.({
        nodeStatuses: {
          ...getNodeStatuses(getLatestState()),
          [normalizedNodeId]: status || 'pending',
        },
      });
      renderSingleNodeStatus(normalizedNodeId, status);
      updateButtonStates();
      updateStatusDisplay(getLatestState());
    }

    function updateStepUI(step, status) {
      const nodeId = workflow.getNodeIdByStepForCurrentMode?.(step);
      if (nodeId) {
        updateNodeUI(nodeId, status);
        return;
      }
      renderSingleStepStatus(step, status);
      updateButtonStates();
      updateStatusDisplay(getLatestState());
    }

    function updateStatusDisplay(currentState = getLatestState()) {
      if (!dom.displayStatus || !dom.statusBar) {
        return;
      }
      dom.statusBar.className = 'status-bar';
      const autoRun = workflow.getCurrentAutoRun?.() || {};
      const displayState = managers.workflowStatusDisplayManager?.getStatusDisplayState?.({
        autoLocked: workflow.isAutoRunLockedPhase?.() || false,
        autoPaused: workflow.isAutoRunPausedPhase?.() || false,
        autoRunLabel: workflow.getAutoRunLabel?.() || '',
        autoRunPhase: autoRun.phase,
        countdown: workflow.getActiveAutoRunCountdown?.(),
        nodeIds: getNodeIds(),
        nodeStatuses: getNodeStatuses(currentState),
        now: Date.now(),
        runningNodes: workflow.getRunningNodes?.(currentState) || [],
      }) || { text: '就绪', tone: '' };
      dom.displayStatus.textContent = displayState.text;
      if (displayState.tone) {
        dom.statusBar.classList.add(displayState.tone);
      }
    }

    function bindActions() {
      const workflowActionBindingsApi = getWorkflowActionBindingsApi();
      workflowActionBindings = workflowActionBindingsApi?.createWorkflowActionBindings?.({
        dom: {
          stepsList: dom.stepsList,
          btnAutoRun: dom.btnAutoRun,
          btnAutoContinue: dom.btnAutoContinue,
          btnAutoRunNow: dom.btnAutoRunNow,
          btnAutoCancelSchedule: dom.btnAutoCancelSchedule,
          btnStop: dom.btnStop,
          btnReset: dom.btnReset,
          btnClearLog: dom.btnClearLog,
        },
        actions: {
          handleStepListClick: actions.handleStepListClick,
          startAutoRun: actions.startAutoRun,
          autoContinue: actions.autoContinue,
          runScheduledNow: actions.runScheduledNow,
          cancelSchedule: actions.cancelSchedule,
          stopCurrentRun: actions.stopCurrentRun,
          resetWorkflow: actions.resetWorkflow,
          clearLog: actions.clearLog,
        },
      }) || null;
      workflowActionBindings?.bind?.();
    }

    return {
      arePreviousNodesReadyForManualExecute,
      bindActions,
      canExecuteNodeWithoutPreviousNode,
      renderSingleNodeStatus,
      renderSingleStepStatus,
      renderStepStatuses,
      renderStepsList,
      syncStepDefinitionsForMode,
      updateButtonStates,
      updateNodeUI,
      updateProgressCounter,
      updateStatusDisplay,
      updateStepUI,
    };
  }

  return { createWorkflowController };
});
