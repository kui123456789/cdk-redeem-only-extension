(function attachWorkflowRoutes(root, factory) {
  const api = factory();
  root.MultiPageWorkflowRoutes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createWorkflowRoutesModule() {
  function requireHandler(handler, name) {
    if (typeof handler !== 'function') {
      throw new Error(`Missing workflow route handler: ${name}`);
    }
    return handler;
  }

  function createWorkflowRoutes(deps = {}) {
    const {
      autoRun,
      cancelScheduledAutoRun,
      executeNode,
      reset,
      resumeAutoRun,
      scheduleAutoRun,
      skipAutoRunCountdown,
      startScheduledAutoRunNow,
    } = deps;

    return {
      RESET: (payload, message, sender) => (
        requireHandler(reset, 'reset')(payload, message, sender)
      ),
      EXECUTE_NODE: (payload, message, sender) => (
        requireHandler(executeNode, 'executeNode')(payload, message, sender)
      ),
      AUTO_RUN: (payload, message, sender) => (
        requireHandler(autoRun, 'autoRun')(payload, message, sender)
      ),
      SCHEDULE_AUTO_RUN: (payload, message, sender) => (
        requireHandler(scheduleAutoRun, 'scheduleAutoRun')(payload, message, sender)
      ),
      START_SCHEDULED_AUTO_RUN_NOW: (payload, message, sender) => (
        requireHandler(startScheduledAutoRunNow, 'startScheduledAutoRunNow')(payload, message, sender)
      ),
      CANCEL_SCHEDULED_AUTO_RUN: (payload, message, sender) => (
        requireHandler(cancelScheduledAutoRun, 'cancelScheduledAutoRun')(payload, message, sender)
      ),
      SKIP_AUTO_RUN_COUNTDOWN: (payload, message, sender) => (
        requireHandler(skipAutoRunCountdown, 'skipAutoRunCountdown')(payload, message, sender)
      ),
      RESUME_AUTO_RUN: (payload, message, sender) => (
        requireHandler(resumeAutoRun, 'resumeAutoRun')(payload, message, sender)
      ),
    };
  }

  return {
    createWorkflowRoutes,
  };
});
