(function attachBackgroundAutoRunLogSnapshot(root, factory) {
  const api = factory();
  if (root) {
    root.MultiPageBackgroundAutoRunLogSnapshot = api;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createBackgroundAutoRunLogSnapshotModule() {
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_STORAGE_KEY = 'autoRunRoundLogSnapshots';
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_MAX_ITEMS = 50;
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_MAX_LOGS = 300;
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_COMPACT_ITEMS = 20;
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_COMPACT_LOGS = 120;
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_REPLAY_MAX_LOGS = 120;
  const AUTO_RUN_ROUND_LOG_MESSAGE_MAX_LENGTH = 1200;

  function createAutoRunLogSnapshot(deps = {}) {
    const addLog = typeof deps.addLog === 'function' ? deps.addLog : async () => {};
    const getState = typeof deps.getState === 'function' ? deps.getState : async () => ({});
    const getErrorMessage = typeof deps.getErrorMessage === 'function'
      ? deps.getErrorMessage
      : (error) => String(error?.message || error || '');

    function truncateAutoRunRoundLogMessage(value = '') {
      const text = String(value || '');
      if (text.length <= AUTO_RUN_ROUND_LOG_MESSAGE_MAX_LENGTH) {
        return text;
      }
      return `${text.slice(0, AUTO_RUN_ROUND_LOG_MESSAGE_MAX_LENGTH)}...`;
    }

    function normalizeAutoRunRoundLogEntry(entry = {}) {
      const step = Math.floor(Number(entry?.step) || 0);
      return {
        message: truncateAutoRunRoundLogMessage(entry?.message),
        level: String(entry?.level || 'info'),
        timestamp: Number(entry?.timestamp) || Date.now(),
        step: step > 0 ? step : null,
        stepKey: String(entry?.stepKey || '').trim(),
        nodeId: String(entry?.nodeId || '').trim(),
      };
    }

    function createAutoRunRoundLogSnapshotMarker(state = {}) {
      const logs = Array.isArray(state?.logs) ? state.logs : [];
      return {
        index: logs.length,
        timestamp: Date.now(),
      };
    }

    function selectAutoRunRoundLogsForSnapshot(state = {}, marker = null, maxLogs = AUTO_RUN_ROUND_LOG_SNAPSHOT_MAX_LOGS) {
      const logs = Array.isArray(state?.logs) ? state.logs : [];
      const startIndex = Math.max(0, Math.min(
        logs.length,
        Math.floor(Number(marker?.index) || 0)
      ));
      const markerTimestamp = Number(marker?.timestamp) || 0;
      const byIndex = logs.slice(startIndex);
      const byTimestamp = markerTimestamp > 0
        ? logs.filter((entry) => (Number(entry?.timestamp) || 0) >= markerTimestamp)
        : [];
      const selected = byTimestamp.length > byIndex.length ? byTimestamp : byIndex;
      const normalized = selected.map((entry) => normalizeAutoRunRoundLogEntry(entry));
      const limit = Math.max(1, Math.floor(Number(maxLogs) || AUTO_RUN_ROUND_LOG_SNAPSHOT_MAX_LOGS));
      return {
        logs: normalized.slice(-limit),
        totalCount: normalized.length,
        truncated: normalized.length > limit,
      };
    }

    function getAutoRunRoundSnapshotStatus(roundSummary = {}, flags = {}) {
      if (flags.stoppedEarly) {
        return 'stopped';
      }
      if (flags.parkedByTimer) {
        return 'paused';
      }
      const status = String(roundSummary?.status || '').trim().toLowerCase();
      return ['success', 'failed', 'pending'].includes(status) ? status : 'pending';
    }

    function getAutoRunRoundSnapshotReason(status, roundSummary = {}) {
      if (status === 'success') {
        return '';
      }
      if (status === 'stopped') {
        return '用户停止';
      }
      if (status === 'paused') {
        return '等待定时恢复';
      }
      return String(
        roundSummary?.finalFailureReason
        || (Array.isArray(roundSummary?.failureReasons)
          ? roundSummary.failureReasons[roundSummary.failureReasons.length - 1]
          : '')
        || ''
      ).trim();
    }

    async function getStoredAutoRunRoundLogSnapshots() {
      const localStorage = deps.chrome?.storage?.local;
      if (!localStorage?.get) {
        return [];
      }
      const payload = await localStorage.get([AUTO_RUN_ROUND_LOG_SNAPSHOT_STORAGE_KEY]).catch(() => ({}));
      const snapshots = payload?.[AUTO_RUN_ROUND_LOG_SNAPSHOT_STORAGE_KEY];
      return Array.isArray(snapshots) ? snapshots.filter((item) => item && typeof item === 'object') : [];
    }

    async function setStoredAutoRunRoundLogSnapshots(snapshots = []) {
      const localStorage = deps.chrome?.storage?.local;
      if (!localStorage?.set) {
        return false;
      }
      await localStorage.set({
        [AUTO_RUN_ROUND_LOG_SNAPSHOT_STORAGE_KEY]: snapshots,
      });
      return true;
    }

    async function saveAutoRunRoundLogSnapshot(payload = {}) {
      const state = await getState();
      const selected = selectAutoRunRoundLogsForSnapshot(state, payload.marker);
      const savedAt = Date.now();
      const sessionId = Math.max(0, Number(payload.sessionId) || 0);
      const round = Math.max(0, Number(payload.round) || 0);
      const totalRuns = Math.max(0, Number(payload.totalRuns) || 0);
      const attemptRun = Math.max(0, Number(payload.attemptRun) || 0);
      if (!sessionId || !round || !totalRuns) {
        return null;
      }

      const snapshot = {
        id: `auto-run-${sessionId}-${round}-${attemptRun}-${savedAt}`,
        sessionId,
        round,
        totalRuns,
        attemptRun,
        status: String(payload.status || 'pending'),
        reason: String(payload.reason || ''),
        savedAt,
        logCount: selected.logs.length,
        originalLogCount: selected.totalCount,
        truncated: Boolean(selected.truncated),
        logs: selected.logs,
      };

      const previousSnapshots = await getStoredAutoRunRoundLogSnapshots();
      const deduped = previousSnapshots.filter((item) => !(
        Number(item?.sessionId) === sessionId
        && Number(item?.round) === round
        && Number(item?.attemptRun) === attemptRun
      ));
      const nextSnapshots = [...deduped, snapshot].slice(-AUTO_RUN_ROUND_LOG_SNAPSHOT_MAX_ITEMS);
      try {
        await setStoredAutoRunRoundLogSnapshots(nextSnapshots);
      } catch (error) {
        const compactSnapshots = nextSnapshots
          .slice(-AUTO_RUN_ROUND_LOG_SNAPSHOT_COMPACT_ITEMS)
          .map((item) => ({
            ...item,
            logs: Array.isArray(item?.logs)
              ? item.logs.slice(-AUTO_RUN_ROUND_LOG_SNAPSHOT_COMPACT_LOGS)
              : [],
            truncated: true,
          }));
        await setStoredAutoRunRoundLogSnapshots(compactSnapshots);
      }
      return snapshot;
    }

    function findAutoRunRoundLogSnapshot(snapshots = [], predicate = () => true) {
      return (Array.isArray(snapshots) ? snapshots : [])
        .filter((item) => item && typeof item === 'object' && predicate(item))
        .sort((left, right) => (Number(left?.savedAt) || 0) - (Number(right?.savedAt) || 0))
        .pop() || null;
    }

    function formatAutoRunRoundSnapshotLogTime(timestamp) {
      const date = new Date(Number(timestamp) || Date.now());
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }

    function getAutoRunRoundSnapshotLevelLabel(level = '') {
      const normalized = String(level || '').trim().toLowerCase();
      if (normalized === 'ok' || normalized === 'success') {
        return '成功';
      }
      if (normalized === 'warn' || normalized === 'warning') {
        return '警告';
      }
      if (normalized === 'error') {
        return '错误';
      }
      return '信息';
    }

    function formatAutoRunRoundSnapshotLogLine(entry = {}) {
      const time = formatAutoRunRoundSnapshotLogTime(entry?.timestamp);
      const level = getAutoRunRoundSnapshotLevelLabel(entry?.level);
      const step = Math.floor(Number(entry?.step) || 0);
      const stepText = step > 0 ? ` 步${step}` : '';
      return `${time} ${level}${stepText} ${String(entry?.message || '').trim()}`;
    }

    async function replayAutoRunRoundLogSnapshot(snapshot = null, options = {}) {
      if (!snapshot || typeof snapshot !== 'object') {
        return false;
      }
      const maxLogs = Math.max(1, Math.floor(Number(options.maxLogs) || AUTO_RUN_ROUND_LOG_SNAPSHOT_REPLAY_MAX_LOGS));
      const logs = Array.isArray(snapshot.logs) ? snapshot.logs.slice(-maxLogs) : [];
      await addLog(
        `=== 上一轮日志快照：第 ${Number(snapshot.round) || 0}/${Number(snapshot.totalRuns) || 0} 轮，状态 ${String(snapshot.status || 'unknown')}，共 ${Number(snapshot.originalLogCount || snapshot.logCount) || logs.length} 条 ===`,
        'info'
      );
      if (!logs.length) {
        await addLog('上一轮日志快照为空，可能是在快照功能启用前完成的轮次。', 'warn');
        return true;
      }
      if (snapshot.truncated || Number(snapshot.originalLogCount) > logs.length) {
        await addLog(`上一轮日志快照较长，这里显示最后 ${logs.length} 条。`, 'warn');
      }
      for (const entry of logs) {
        await addLog(`快照 ${formatAutoRunRoundSnapshotLogLine(entry)}`, entry?.level || 'info');
      }
      await addLog(`=== 上一轮日志快照结束：第 ${Number(snapshot.round) || 0} 轮 ===`, 'info');
      return true;
    }

    async function replayPreviousSuccessfulAutoRunRoundLogSnapshot(sessionId, beforeRound) {
      const normalizedSessionId = Math.max(0, Number(sessionId) || 0);
      const normalizedBeforeRound = Math.max(0, Number(beforeRound) || 0);
      if (!normalizedSessionId || normalizedBeforeRound <= 1) {
        return false;
      }
      const snapshots = await getStoredAutoRunRoundLogSnapshots();
      const previousSnapshot = findAutoRunRoundLogSnapshot(snapshots, (item) => (
        Number(item?.sessionId) === normalizedSessionId
        && Number(item?.round) < normalizedBeforeRound
        && String(item?.status || '').trim().toLowerCase() === 'success'
      ));
      if (!previousSnapshot) {
        await addLog(`自动运行：未找到第 ${normalizedBeforeRound - 1} 轮或更早成功轮次的日志快照。`, 'warn');
        return false;
      }
      return replayAutoRunRoundLogSnapshot(previousSnapshot);
    }

    return {
      createAutoRunRoundLogSnapshotMarker,
      getAutoRunRoundSnapshotReason,
      getAutoRunRoundSnapshotStatus,
      replayPreviousSuccessfulAutoRunRoundLogSnapshot,
      saveAutoRunRoundLogSnapshot,
    };
  }

  return {
    createAutoRunLogSnapshot,
  };
});
