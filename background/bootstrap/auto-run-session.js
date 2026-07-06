(function attachBackgroundAutoRunSession(globalScope) {
  function normalizeAutoRunSessionId(value) {
    const numeric = Math.floor(Number(value) || 0);
    return numeric > 0 ? numeric : 0;
  }

  function createAutoRunSessionManager(deps = {}) {
    const {
      stopErrorMessage = '流程已被用户停止。',
      throwIfStopped = () => {},
    } = deps;

    let autoRunSessionId = normalizeAutoRunSessionId(deps.initialSessionId);
    let autoRunSessionSeed = normalizeAutoRunSessionId(deps.initialSessionSeed);

    function getCurrentAutoRunSessionId() {
      return autoRunSessionId;
    }

    function createAutoRunSessionId() {
      autoRunSessionSeed = Math.max(autoRunSessionSeed + 1, Date.now());
      autoRunSessionId = autoRunSessionSeed;
      return autoRunSessionId;
    }

    function setCurrentAutoRunSessionId(value) {
      autoRunSessionId = normalizeAutoRunSessionId(value);
      return autoRunSessionId;
    }

    function clearCurrentAutoRunSessionId(expectedSessionId = null) {
      if (expectedSessionId === null) {
        autoRunSessionId = 0;
        return autoRunSessionId;
      }

      const normalizedExpected = normalizeAutoRunSessionId(expectedSessionId);
      if (!normalizedExpected || normalizedExpected === autoRunSessionId) {
        autoRunSessionId = 0;
      }
      return autoRunSessionId;
    }

    function isCurrentAutoRunSessionId(value) {
      const normalized = normalizeAutoRunSessionId(value);
      return normalized > 0 && normalized === autoRunSessionId;
    }

    function throwIfAutoRunSessionStopped(sessionId) {
      const normalizedSessionId = normalizeAutoRunSessionId(sessionId);
      if (normalizedSessionId && !isCurrentAutoRunSessionId(normalizedSessionId)) {
        throw new Error(stopErrorMessage);
      }
      throwIfStopped();
    }

    return {
      clearCurrentAutoRunSessionId,
      createAutoRunSessionId,
      getCurrentAutoRunSessionId,
      isCurrentAutoRunSessionId,
      normalizeAutoRunSessionId,
      setCurrentAutoRunSessionId,
      throwIfAutoRunSessionStopped,
    };
  }

  globalScope.MultiPageBackgroundAutoRunSession = {
    createAutoRunSessionManager,
    normalizeAutoRunSessionId,
  };
})(self);
