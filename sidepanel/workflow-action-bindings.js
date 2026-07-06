(function attachWorkflowActionBindings(root, factory) {
  const api = factory();
  root.SidepanelWorkflowActionBindings = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createWorkflowActionBindingsModule() {
  function bindClick(element, callback) {
    element?.addEventListener?.('click', async (event) => {
      event?.preventDefault?.();
      await callback(event);
    });
  }

  function createWorkflowActionBindings({ dom = {}, actions = {} } = {}) {
    function bind() {
      bindClick(dom.btnAutoRun, actions.startAutoRun || (async () => {}));
      bindClick(dom.btnAutoContinue, actions.autoContinue || (async () => {}));
      bindClick(dom.btnAutoRunNow, actions.runScheduledNow || (async () => {}));
      bindClick(dom.btnAutoCancelSchedule, actions.cancelSchedule || (async () => {}));
      bindClick(dom.btnStop, actions.stopCurrentRun || (async () => {}));
      bindClick(dom.btnReset, actions.resetWorkflow || (async () => {}));
      bindClick(dom.btnClearLog, actions.clearLog || (async () => {}));
      dom.stepsList?.addEventListener?.('click', (event) => actions.handleStepListClick?.(event));
    }
    return { bind };
  }

  return { bindClick, createWorkflowActionBindings };
});
