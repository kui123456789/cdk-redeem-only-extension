(function attachSidepanelWorkflowStatusDisplay(globalScope) {
  function toStatusEntries(statuses = {}) {
    return Object.entries(statuses && typeof statuses === 'object' ? statuses : {});
  }

  function createWorkflowStatusDisplayManager(context = {}) {
    const {
      isDoneStatus = (status) => status === 'completed' || status === 'manual_completed' || status === 'skipped',
      formatCountdown = (remainingMs) => `${Math.max(0, Math.ceil(Number(remainingMs) || 0))}ms`,
    } = context;

    function getLastCompletedNodeId(statuses = {}, nodeIds = []) {
      return toStatusEntries(statuses)
        .filter(([, status]) => isDoneStatus(status))
        .map(([nodeId]) => nodeId)
        .sort((left, right) => nodeIds.indexOf(right) - nodeIds.indexOf(left))[0] || '';
    }

    function getStatusDisplayState(options = {}) {
      const {
        autoLocked = false,
        autoPaused = false,
        autoRunLabel = '',
        autoRunPhase = '',
        countdown = null,
        nodeIds = [],
        nodeStatuses = {},
        now = Date.now(),
        runningNodes = [],
      } = options;

      if (countdown) {
        const remainingMs = Number(countdown.at) - Number(now);
        return {
          text: remainingMs > 0
            ? `${countdown.title}，剩余 ${formatCountdown(remainingMs)}`
            : `${countdown.title}，即将结束...`,
          tone: countdown.tone === 'scheduled' ? 'scheduled' : 'running',
        };
      }

      if (autoPaused) {
        return {
          text: `自动已暂停${autoRunLabel}，等待继续`,
          tone: 'paused',
        };
      }

      if (autoLocked) {
        return {
          text: runningNodes.length
            ? `节点 ${runningNodes.join(', ')} 运行中...`
            : `${autoRunPhase === 'retrying' ? '自动重试中' : '自动运行中'}${autoRunLabel}`,
          tone: 'running',
        };
      }

      const running = toStatusEntries(nodeStatuses).find(([, status]) => status === 'running');
      if (running) {
        return {
          text: `节点 ${running[0]} 运行中...`,
          tone: 'running',
        };
      }

      const failed = toStatusEntries(nodeStatuses).find(([, status]) => status === 'failed');
      if (failed) {
        return {
          text: `节点 ${failed[0]} 失败`,
          tone: 'failed',
        };
      }

      const stopped = toStatusEntries(nodeStatuses).find(([, status]) => status === 'stopped');
      if (stopped) {
        return {
          text: `节点 ${stopped[0]} 已停止`,
          tone: 'stopped',
        };
      }

      const lastCompleted = getLastCompletedNodeId(nodeStatuses, nodeIds);
      if (lastCompleted === nodeIds[nodeIds.length - 1]) {
        return {
          text: '全部节点已完成',
          tone: 'completed',
        };
      }

      return {
        text: lastCompleted ? `节点 ${lastCompleted} 已完成` : '就绪',
        tone: '',
      };
    }

    return {
      getLastCompletedNodeId,
      getStatusDisplayState,
    };
  }

  const api = {
    createWorkflowStatusDisplayManager,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelWorkflowStatusDisplay = api;
})(typeof window !== 'undefined' ? window : globalThis);
