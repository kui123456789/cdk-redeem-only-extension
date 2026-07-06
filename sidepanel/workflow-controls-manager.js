(function attachSidepanelWorkflowControlsManager(globalScope) {
  function firstFunction(...candidates) {
    return candidates.find((candidate) => typeof candidate === 'function') || null;
  }

  function optionalWrapper(...candidates) {
    const helper = firstFunction(...candidates);
    return (...args) => helper?.(...args);
  }

  function createWorkflowControlsManager(context = {}) {
    const { helpers = {} } = context;

    return {
      startAutoRun: optionalWrapper(helpers.startAutoRun, helpers.startWorkflow),
      continueAutoRun: optionalWrapper(helpers.continueAutoRun, helpers.resumeAutoRun, helpers.continueWorkflow),
      stopCurrentOperation: optionalWrapper(helpers.stopCurrentOperation, helpers.stopFlow, helpers.stopWorkflow),
      resetState: optionalWrapper(helpers.resetState, helpers.resetFlow, helpers.resetWorkflow),
      executeNode: optionalWrapper(helpers.executeNode, helpers.executeNodeFromSidepanel),
      skipNode: optionalWrapper(helpers.skipNode, helpers.handleSkipNode),
      renderStepsList: optionalWrapper(helpers.renderStepsList),
      renderStepStatuses: optionalWrapper(helpers.renderStepStatuses),
    };
  }

  globalScope.SidepanelWorkflowControlsManager = {
    createWorkflowControlsManager,
  };
})(window);
