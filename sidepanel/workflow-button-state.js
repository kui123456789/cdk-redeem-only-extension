(function attachSidepanelWorkflowButtonState(globalScope) {
  function normalizeNodeId(value = '') {
    return String(value || '').trim();
  }

  function toNodeList(value) {
    return Array.isArray(value) ? value.map(normalizeNodeId).filter(Boolean) : [];
  }

  function toNodeSet(value) {
    if (value instanceof Set) {
      return value;
    }
    return new Set(toNodeList(value));
  }

  function createWorkflowButtonStateManager(context = {}) {
    const {
      getNodeIds = () => [],
      getIndependentExecuteNodes = () => new Set(),
      getSkippableNodes = () => new Set(),
      isDoneStatus = (status) => status === 'completed' || status === 'manual_completed' || status === 'skipped',
    } = context;

    function nodeIds() {
      return toNodeList(getNodeIds());
    }

    function independentExecuteNodes() {
      return toNodeSet(getIndependentExecuteNodes());
    }

    function skippableNodes() {
      return toNodeSet(getSkippableNodes());
    }

    function arePreviousNodesReadyForManualExecute(nodeId = '', statuses = {}) {
      const normalizedNodeId = normalizeNodeId(nodeId);
      const ids = nodeIds();
      const currentIndex = ids.indexOf(normalizedNodeId);
      if (currentIndex <= 0) {
        return true;
      }
      return ids.slice(0, currentIndex).every((previousNodeId) => isDoneStatus(statuses[previousNodeId]));
    }

    function canExecuteNodeWithoutPreviousNode(nodeId = '', statuses = {}) {
      const normalizedNodeId = normalizeNodeId(nodeId);
      return independentExecuteNodes().has(normalizedNodeId)
        && arePreviousNodesReadyForManualExecute(normalizedNodeId, statuses);
    }

    function getStepButtonState(options = {}) {
      const {
        nodeId = '',
        index,
        statuses = {},
        anyRunning = false,
        autoLocked = false,
        autoScheduled = false,
      } = options;
      const normalizedNodeId = normalizeNodeId(nodeId);
      const ids = nodeIds();
      const currentIndex = Number.isInteger(index) ? index : ids.indexOf(normalizedNodeId);
      const currentStatus = statuses[normalizedNodeId];
      const previousNodeId = currentIndex > 0 ? ids[currentIndex - 1] : '';
      const previousStatus = previousNodeId ? statuses[previousNodeId] : 'completed';
      const previousReady = arePreviousNodesReadyForManualExecute(normalizedNodeId, statuses);
      const canRun = currentIndex === 0
        || canExecuteNodeWithoutPreviousNode(normalizedNodeId, statuses)
        || (previousReady && isDoneStatus(previousStatus))
        || (previousReady && (currentStatus === 'failed' || currentStatus === 'stopped' || isDoneStatus(currentStatus)));
      return {
        canRun,
        disabled: Boolean(anyRunning || autoLocked || autoScheduled || !canRun),
      };
    }

    function getManualSkipButtonState(options = {}) {
      const {
        nodeId = '',
        statuses = {},
        anyRunning = false,
        autoLocked = false,
        autoScheduled = false,
      } = options;
      const normalizedNodeId = normalizeNodeId(nodeId);
      const ids = nodeIds();
      const currentStatus = statuses[normalizedNodeId];
      const currentIndex = ids.indexOf(normalizedNodeId);
      const previousNodeId = currentIndex > 0 ? ids[currentIndex - 1] : '';
      const previousStatus = previousNodeId ? statuses[previousNodeId] : 'completed';
      const canSkip = skippableNodes().has(normalizedNodeId)
        && !anyRunning
        && !autoLocked
        && !autoScheduled
        && currentStatus !== 'running'
        && !isDoneStatus(currentStatus)
        && (!previousNodeId || isDoneStatus(previousStatus));
      return {
        canSkip,
        visible: canSkip,
        disabled: !canSkip,
        title: canSkip ? `跳过节点 ${normalizedNodeId}` : '当前不可跳过',
      };
    }

    function isResetDisabled(options = {}) {
      const {
        anyRunning = false,
        autoLocked = false,
        autoScheduled = false,
        autoPaused = false,
      } = options;
      return Boolean(anyRunning || autoScheduled || autoPaused || autoLocked);
    }

    function isActiveControlEnabled(options = {}) {
      return !isResetDisabled(options);
    }

    return {
      arePreviousNodesReadyForManualExecute,
      canExecuteNodeWithoutPreviousNode,
      getManualSkipButtonState,
      getStepButtonState,
      isActiveControlEnabled,
      isResetDisabled,
    };
  }

  const api = {
    createWorkflowButtonStateManager,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelWorkflowButtonState = api;
})(typeof window !== 'undefined' ? window : globalThis);
