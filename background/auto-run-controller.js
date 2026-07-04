(function attachBackgroundAutoRunController(root, factory) {
  root.MultiPageBackgroundAutoRunController = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createBackgroundAutoRunControllerModule() {
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_STORAGE_KEY = 'autoRunRoundLogSnapshots';
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_MAX_ITEMS = 50;
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_MAX_LOGS = 300;
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_COMPACT_ITEMS = 20;
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_COMPACT_LOGS = 120;
  const AUTO_RUN_ROUND_LOG_SNAPSHOT_REPLAY_MAX_LOGS = 120;
  const AUTO_RUN_ROUND_LOG_MESSAGE_MAX_LENGTH = 1200;

  function createAutoRunController(deps = {}) {
    const {
      addLog,
      appendAccountRunRecord,
      AUTO_RUN_MAX_RETRIES_PER_ROUND,
      AUTO_RUN_RETRY_DELAY_MS,
      AUTO_RUN_TIMER_KIND_BEFORE_RETRY,
      AUTO_RUN_TIMER_KIND_BETWEEN_ROUNDS,
      broadcastAutoRunStatus,
      broadcastStopToContentScripts,
      cancelPendingCommands,
      clearStopRequest,
      createAutoRunSessionId,
      ensureHotmailMailboxReadyForAutoRunRound,
      getAutoRunStatusPayload,
      getErrorMessage,
      getFirstUnfinishedNodeId,
      getPendingAutoRunTimerPlan,
      getRunningNodeIds,
      getState,
      hasSavedNodeProgress,
      isCloudCheckoutAlreadyPaidFailure,
      isCardHelperTaskEndedFailure,
      isHostedCheckoutGenericErrorFailure,
      isHostedCheckoutVerificationResendLimitFailure,
      isChatgptSessionReaderNonFreeTrialFailure,
      isUpiRedeemBackendFailure,
      isUpiRedeemNetworkFailure,
      isRestartCurrentAttemptError,
      isStep4Route405RecoveryLimitFailure,
      isSignupUserAlreadyExistsFailure,
      isStopError,
      launchAutoRunTimerPlan,
      normalizeAutoRunFallbackThreadIntervalMinutes,
      persistAutoRunTimerPlan,
      resetState,
      runAutoSequenceFromNode,
      runtime,
      setState,
      sleepWithStop,
      throwIfAutoRunSessionStopped,
      waitForRunningNodesToFinish,
    } = deps;

    function getRunningWorkflowNodes(state = {}) {
      if (typeof getRunningNodeIds === 'function') {
        return getRunningNodeIds(state.nodeStatuses || {}, state);
      }
      return [];
    }

    function getFirstUnfinishedWorkflowNode(state = {}) {
      if (typeof getFirstUnfinishedNodeId === 'function') {
        return getFirstUnfinishedNodeId(state.nodeStatuses || {}, state);
      }
      return null;
    }

    function hasSavedWorkflowProgress(state = {}) {
      if (typeof hasSavedNodeProgress === 'function') {
        return hasSavedNodeProgress(state.nodeStatuses || {}, state);
      }
      return false;
    }

    async function waitForRunningWorkflowNodesToFinish(payload = {}) {
      if (typeof waitForRunningNodesToFinish === 'function') {
        return waitForRunningNodesToFinish(payload);
      }
      return getState();
    }

    async function runAutoSequenceFromWorkflowNode(startNodeId, context = {}) {
      if (typeof runAutoSequenceFromNode === 'function') {
        return runAutoSequenceFromNode(startNodeId, context);
      }
      throw new Error('自动运行节点执行器未接入。');
    }

    function createAutoRunRoundSummary(round) {
      return {
        round,
        status: 'pending',
        attempts: 0,
        failureReasons: [],
        finalFailureReason: '',
      };
    }

    function normalizeAutoRunRoundSummary(summary, round) {
      const base = createAutoRunRoundSummary(round);
      if (!summary || typeof summary !== 'object') {
        return base;
      }

      const status = String(summary.status || '').trim().toLowerCase();
      return {
        round,
        status: ['pending', 'success', 'failed'].includes(status) ? status : base.status,
        attempts: Math.max(0, Math.floor(Number(summary.attempts) || 0)),
        failureReasons: Array.isArray(summary.failureReasons)
          ? summary.failureReasons.map((item) => String(item || '').trim()).filter(Boolean)
          : [],
        finalFailureReason: String(summary.finalFailureReason || '').trim(),
      };
    }

    function buildAutoRunRoundSummaries(totalRuns, rawSummaries = []) {
      return Array.from({ length: totalRuns }, (_, index) => normalizeAutoRunRoundSummary(rawSummaries[index], index + 1));
    }

    function serializeAutoRunRoundSummaries(totalRuns, roundSummaries = []) {
      return buildAutoRunRoundSummaries(totalRuns, roundSummaries).map((summary) => ({
        ...summary,
        failureReasons: [...summary.failureReasons],
      }));
    }

    function getAutoRunRoundRetryCount(summary) {
      return Math.max(0, Number(summary?.attempts || 0) - 1);
    }

    function normalizeRecordNode(value = '') {
      return String(value || '').trim();
    }

    function extractNodeFromRecordStatus(status = '') {
      const match = String(status || '').trim().match(/^node:([^:]+):(failed|stopped)$/i);
      return match ? normalizeRecordNode(match[1]) : '';
    }

    function getKnownNodeIdsFromState(state = {}) {
      const ids = new Set();
      for (const key of Object.keys(state?.nodeStatuses || {})) {
        const nodeId = normalizeRecordNode(key);
        if (nodeId) {
          ids.add(nodeId);
        }
      }

      const currentNodeId = normalizeRecordNode(state?.currentNodeId);
      if (currentNodeId) {
        ids.add(currentNodeId);
      }

      return Array.from(ids);
    }

    function inferRecordNodeFromState(state = {}, preferredStatuses = []) {
      const statuses = state?.nodeStatuses || {};
      const preferredStatusSet = new Set(preferredStatuses.map((item) => String(item || '').trim()).filter(Boolean));
      const nodeIds = getKnownNodeIdsFromState(state);
      const currentNodeId = normalizeRecordNode(state?.currentNodeId);

      if (currentNodeId && preferredStatusSet.has(String(statuses[currentNodeId] || '').trim())) {
        return currentNodeId;
      }

      const matchingNodes = nodeIds.filter((nodeId) => preferredStatusSet.has(String(statuses[nodeId] || '').trim()));
      if (matchingNodes.length) {
        return matchingNodes[matchingNodes.length - 1];
      }

      if (currentNodeId) {
        const currentStatus = String(statuses[currentNodeId] || '').trim();
        if (!['', 'pending', 'completed', 'manual_completed', 'skipped'].includes(currentStatus)) {
          return currentNodeId;
        }
      }

      return '';
    }

    function inferRecordNodeFromError(errorLike = null, state = {}) {
      if (!errorLike || typeof errorLike !== 'object') {
        return '';
      }

      return normalizeRecordNode(errorLike.failedNodeId)
        || normalizeRecordNode(errorLike.nodeId)
        || normalizeRecordNode(errorLike.currentNodeId);
    }

    function resolveAutoRunAccountRecordStatus(status, state = {}, errorLike = null) {
      const normalizedStatus = String(status || '').trim().toLowerCase();
      const explicitNode = extractNodeFromRecordStatus(status);
      if (explicitNode) {
        return `node:${explicitNode}:${normalizedStatus.endsWith(':stopped') ? 'stopped' : 'failed'}`;
      }
      if (normalizedStatus === 'failed') {
        const failedNode = inferRecordNodeFromError(errorLike, state)
          || inferRecordNodeFromState(state, ['failed', 'running']);
        return failedNode ? `node:${failedNode}:failed` : status;
      }

      if (normalizedStatus === 'stopped') {
        const stoppedNode = inferRecordNodeFromError(errorLike, state)
          || inferRecordNodeFromState(state, ['stopped', 'running']);
        return stoppedNode ? `node:${stoppedNode}:stopped` : status;
      }

      return status;
    }

    function formatAutoRunFailureReasons(reasons = []) {
      if (!Array.isArray(reasons) || !reasons.length) {
        return '未知错误';
      }

      const counts = new Map();
      for (const reason of reasons) {
        const normalized = String(reason || '').trim() || '未知错误';
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }

      return Array.from(counts.entries())
        .map(([reason, count]) => (count > 1 ? `${reason}（${count}次）` : reason))
        .join('；');
    }

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

    function shouldKeepCustomMailProviderPoolEmail(state = {}) {
      return String(state?.mailProvider || '').trim().toLowerCase() === 'custom'
        && Array.isArray(state?.customMailProviderPool)
        && state.customMailProviderPool.length > 0;
    }

    function isUpiAccountIneligibleFailure(error) {
      const rawMessage = String(typeof error === 'string' ? error : error?.message || '');
      const message = String(
        typeof getErrorMessage === 'function'
          ? getErrorMessage(error)
          : rawMessage
      );
      const combinedMessage = `${rawMessage}\n${message}`;
      return /UPI_ACCOUNT_INELIGIBLE::|UPI\s*资格检查失败[：:][\s\S]*账号无资格|UPI[\s\S]*(?:account|账号)[\s\S]*(?:ineligible|无资格)/i.test(combinedMessage);
    }

    async function logAutoRunFinalSummary(totalRuns, roundSummaries = []) {
      const summaries = buildAutoRunRoundSummaries(totalRuns, roundSummaries);
      const successRounds = summaries.filter((item) => item.status === 'success');
      const failedRounds = summaries.filter((item) => item.status === 'failed');
      const pendingRounds = summaries.filter((item) => item.status === 'pending');

      await addLog('=== 自动运行汇总 ===', failedRounds.length ? 'warn' : 'ok');
      await addLog(
        `总轮数：${totalRuns}；成功：${successRounds.length}；失败：${failedRounds.length}；未完成：${pendingRounds.length}`,
        failedRounds.length ? 'warn' : 'ok'
      );

      if (successRounds.length) {
        await addLog(
          `成功轮次：${successRounds
            .map((item) => `第 ${item.round} 轮（重试 ${getAutoRunRoundRetryCount(item)} 次）`)
            .join('；')}`,
          'ok'
        );
      }

      if (failedRounds.length) {
        await addLog(
          `失败轮次：${failedRounds
            .map((item) => {
              const retryCount = getAutoRunRoundRetryCount(item);
              const finalReason = item.finalFailureReason || item.failureReasons[item.failureReasons.length - 1] || '未知错误';
              const reasonSummary = formatAutoRunFailureReasons(item.failureReasons);
              return !reasonSummary || reasonSummary === finalReason
                ? `第 ${item.round} 轮（重试 ${retryCount} 次，最终原因：${finalReason}）`
                : `第 ${item.round} 轮（重试 ${retryCount} 次，最终原因：${finalReason}；失败记录：${reasonSummary}）`;
            })
            .join('；')}`,
          'error'
        );
      }

      if (pendingRounds.length) {
        await addLog(
          `未完成轮次：${pendingRounds.map((item) => `第 ${item.round} 轮`).join('；')}`,
          'warn'
        );
      }
    }

    async function skipAutoRunCountdown() {
      const state = await getState();
      const plan = getPendingAutoRunTimerPlan(state);
      if (!plan || state.autoRunPhase !== 'waiting_interval') {
        return false;
      }

      return launchAutoRunTimerPlan('manual', {
        expectedKinds: [
          AUTO_RUN_TIMER_KIND_BETWEEN_ROUNDS,
          AUTO_RUN_TIMER_KIND_BEFORE_RETRY,
        ],
      });
    }

    async function waitBetweenAutoRunRounds(targetRun, totalRuns, roundSummary, options = {}) {
      const {
        autoRunSkipFailures = false,
        autoRunRetryNonFreeTrial = false,
        autoRunRetryLegacyWalletCallback = false,
        roundSummaries = [],
      } = options;
      if (totalRuns <= 1 || targetRun >= totalRuns) {
        return false;
      }

      const fallbackThreadIntervalMinutes = normalizeAutoRunFallbackThreadIntervalMinutes(
        (await getState()).autoRunFallbackThreadIntervalMinutes
      );
      if (fallbackThreadIntervalMinutes <= 0) {
        return false;
      }

      const currentRuntime = runtime.get();
      const statusLabel = roundSummary?.status === 'failed' ? '失败' : '完成';
      await addLog(
        `线程间隔：第 ${targetRun}/${totalRuns} 轮已${statusLabel}，等待 ${fallbackThreadIntervalMinutes} 分钟后开始下一轮。`,
        'info'
      );
      await persistAutoRunTimerPlan({
        kind: AUTO_RUN_TIMER_KIND_BETWEEN_ROUNDS,
        fireAt: Date.now() + fallbackThreadIntervalMinutes * 60 * 1000,
        currentRun: targetRun,
        totalRuns,
        attemptRun: currentRuntime.autoRunAttemptRun,
        autoRunSessionId: currentRuntime.autoRunSessionId,
        autoRunSkipFailures,
        autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback,
        roundSummaries,
        countdownTitle: '线程间隔中',
        countdownNote: `第 ${Math.min(targetRun + 1, totalRuns)}/${totalRuns} 轮即将开始`,
      }, {
        autoRunSkipFailures,
        autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback,
        autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
      });
      runtime.set({ autoRunActive: false });
      return true;
    }

    async function waitBeforeAutoRunRetry(targetRun, totalRuns, nextAttemptRun, options = {}) {
      const {
        autoRunSkipFailures = false,
        autoRunRetryNonFreeTrial = false,
        autoRunRetryLegacyWalletCallback = false,
        roundSummaries = [],
      } = options;
      const fallbackThreadIntervalMinutes = normalizeAutoRunFallbackThreadIntervalMinutes(
        (await getState()).autoRunFallbackThreadIntervalMinutes
      );
      if (fallbackThreadIntervalMinutes <= 0) {
        return false;
      }

      await addLog(
        `线程间隔：等待 ${fallbackThreadIntervalMinutes} 分钟后开始第 ${targetRun}/${totalRuns} 轮第 ${nextAttemptRun} 次尝试。`,
        'info'
      );
      await persistAutoRunTimerPlan({
        kind: AUTO_RUN_TIMER_KIND_BEFORE_RETRY,
        fireAt: Date.now() + fallbackThreadIntervalMinutes * 60 * 1000,
        currentRun: targetRun,
        totalRuns,
        attemptRun: nextAttemptRun,
        autoRunSessionId: runtime.get().autoRunSessionId,
        autoRunSkipFailures,
        autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback,
        roundSummaries,
        countdownTitle: '线程间隔中',
        countdownNote: `第 ${targetRun}/${totalRuns} 轮第 ${nextAttemptRun} 次尝试即将开始`,
      }, {
        autoRunSkipFailures,
        autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback,
        autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
      });
      runtime.set({ autoRunActive: false });
      return true;
    }

    async function handleAutoRunLoopUnhandledError(error) {
      const currentRuntime = runtime.get();
      console.error('Auto run loop crashed:', error);
      if (!isStopError(error)) {
        await addLog(`自动运行异常终止：${getErrorMessage(error) || '未知错误'}`, 'error');
      }

      runtime.set({ autoRunActive: false, autoRunSessionId: 0 });
      await broadcastAutoRunStatus('stopped', {
        currentRun: currentRuntime.autoRunCurrentRun,
        totalRuns: currentRuntime.autoRunTotalRuns,
        attemptRun: currentRuntime.autoRunAttemptRun,
        sessionId: 0,
      }, {
        autoRunSessionId: 0,
        autoRunTimerPlan: null,
        scheduledAutoRunPlan: null,
      });
      if (!isStopError(error)) {
        clearStopRequest();
      }
    }

    function startAutoRunLoop(totalRuns, options = {}) {
      autoRunLoop(totalRuns, options).catch((error) => {
        handleAutoRunLoopUnhandledError(error).catch(() => {});
      });
    }

    async function autoRunLoop(totalRuns, options = {}) {
      let currentRuntime = runtime.get();
      if (currentRuntime.autoRunActive) {
        await addLog('自动运行已在进行中', 'warn');
        return;
      }

      let sessionId = Number.isInteger(options.autoRunSessionId) && options.autoRunSessionId > 0
        ? options.autoRunSessionId
        : 0;
      if (sessionId) {
        throwIfAutoRunSessionStopped(sessionId);
      } else {
        sessionId = createAutoRunSessionId();
      }

      clearStopRequest();
      runtime.set({
        autoRunActive: true,
        autoRunTotalRuns: totalRuns,
        autoRunCurrentRun: 0,
        autoRunAttemptRun: 0,
        autoRunSessionId: sessionId,
      });
      currentRuntime = runtime.get();

      const autoRunSkipFailures = true;
      const autoRunRetryNonFreeTrial = Boolean(options.autoRunRetryNonFreeTrial);
      const autoRunRetryLegacyWalletCallback = Boolean(options.autoRunRetryLegacyWalletCallback);
      const initialMode = options.mode === 'continue' ? 'continue' : 'restart';
      const resumeCurrentRun = Number.isInteger(options.resumeCurrentRun) && options.resumeCurrentRun > 0
        ? Math.min(totalRuns, options.resumeCurrentRun)
        : 1;
      const resumeAttemptRun = Number.isInteger(options.resumeAttemptRun) && options.resumeAttemptRun > 0
        ? Math.min(AUTO_RUN_MAX_RETRIES_PER_ROUND + 1, options.resumeAttemptRun)
        : 1;
      let continueCurrentOnFirstAttempt = initialMode === 'continue';
      let forceFreshTabsNextRun = false;
      let stoppedEarly = false;
      let parkedByTimer = false;
      const roundSummaries = buildAutoRunRoundSummaries(totalRuns, options.resumeRoundSummaries);

      if (continueCurrentOnFirstAttempt && resumeCurrentRun > 1) {
        for (let round = 1; round < resumeCurrentRun; round += 1) {
          const summary = roundSummaries[round - 1];
          if (summary.status === 'pending') {
            summary.status = 'success';
            if (!summary.attempts) {
              summary.attempts = 1;
            }
          }
        }
      }

      let successfulRuns = roundSummaries.filter((item) => item.status === 'success').length;
      const initialState = await getState();
      const initialPhase = continueCurrentOnFirstAttempt && getRunningWorkflowNodes(initialState).length
        ? 'waiting_step'
        : 'running';
      const showResumePosition = continueCurrentOnFirstAttempt || resumeCurrentRun > 1 || resumeAttemptRun > 1;

      await setState({
        autoRunSessionId: sessionId,
        autoRunSkipFailures,
        autoRunRetryNonFreeTrial,
        autoRunRetryLegacyWalletCallback,
        autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
        ...getAutoRunStatusPayload(initialPhase, {
          currentRun: showResumePosition ? resumeCurrentRun : 0,
          totalRuns,
          attemptRun: showResumePosition ? resumeAttemptRun : 0,
          sessionId,
        }),
      });

      for (let targetRun = resumeCurrentRun; targetRun <= totalRuns; targetRun += 1) {
        const roundSummary = roundSummaries[targetRun - 1];
        let roundRecordAppended = false;
        let roundLogSnapshotMarker = null;
        let roundLogSnapshotSaved = false;
        const resumingCurrentRound = continueCurrentOnFirstAttempt && targetRun === resumeCurrentRun;
        let attemptRun = resumingCurrentRound ? resumeAttemptRun : 1;
        let reuseExistingProgress = resumingCurrentRound;
        const maxAttemptsForRound = autoRunSkipFailures || autoRunRetryNonFreeTrial || autoRunRetryLegacyWalletCallback
          ? AUTO_RUN_MAX_RETRIES_PER_ROUND + 1
          : Math.max(AUTO_RUN_MAX_RETRIES_PER_ROUND + 1, attemptRun);

        const saveRoundLogSnapshotIfNeeded = async (flags = {}) => {
          if (roundLogSnapshotSaved || !roundLogSnapshotMarker) {
            return null;
          }
          const status = getAutoRunRoundSnapshotStatus(roundSummary, flags);
          const reason = getAutoRunRoundSnapshotReason(status, roundSummary);
          try {
            const snapshot = await saveAutoRunRoundLogSnapshot({
              sessionId,
              round: targetRun,
              totalRuns,
              attemptRun,
              status,
              reason,
              marker: roundLogSnapshotMarker,
            });
            roundLogSnapshotSaved = Boolean(snapshot);
            if (snapshot) {
              await addLog(
                `自动运行：已保存第 ${targetRun}/${totalRuns} 轮日志快照（${snapshot.logCount}${snapshot.truncated ? `/${snapshot.originalLogCount}` : ''} 条）。`,
                'info'
              );
            }
            return snapshot;
          } catch (snapshotError) {
            roundLogSnapshotSaved = true;
            await addLog(
              `自动运行：保存第 ${targetRun}/${totalRuns} 轮日志快照失败：${getErrorMessage(snapshotError) || snapshotError?.message || '未知错误'}`,
              'warn'
            );
            return null;
          }
        };

        while (attemptRun <= maxAttemptsForRound) {
          runtime.set({
            autoRunCurrentRun: targetRun,
            autoRunAttemptRun: attemptRun,
          });
          roundSummary.attempts = attemptRun;
          const defaultStartNodeId = typeof runAutoSequenceFromNode === 'function' ? 'open-chatgpt' : 1;
          let startNodeId = defaultStartNodeId;
          let useExistingProgress = false;

          if (reuseExistingProgress) {
            let currentState = await getState();
            if (getRunningWorkflowNodes(currentState).length) {
              currentState = await waitForRunningWorkflowNodesToFinish({
                currentRun: targetRun,
                totalRuns,
                attemptRun,
              });
            }
            const resumeNodeId = getFirstUnfinishedWorkflowNode(currentState);
            if (resumeNodeId && hasSavedWorkflowProgress(currentState)) {
              startNodeId = resumeNodeId;
              useExistingProgress = true;
            } else if (hasSavedWorkflowProgress(currentState)) {
              await addLog('检测到当前流程已处理完成，本轮将改为从首个节点重新开始。', 'info');
            }
          }

          if (!useExistingProgress) {
            const prevState = await getState();
            const keepSettings = {
              vpsUrl: prevState.vpsUrl,
              vpsPassword: prevState.vpsPassword,
              customPassword: prevState.customPassword,
              plusModeEnabled: prevState.plusModeEnabled,
              plusPaymentMethod: prevState.plusPaymentMethod,
              plusAccountAccessStrategy: prevState.plusAccountAccessStrategy,
              chatgptSessionReaderMode: prevState.chatgptSessionReaderMode,
              chatgptSessionReaderProfiles: prevState.chatgptSessionReaderProfiles,
              plusHostedCheckoutOauthDelaySeconds: prevState.plusHostedCheckoutOauthDelaySeconds,
              hostedCheckoutVerificationPopupDelaySeconds: prevState.hostedCheckoutVerificationPopupDelaySeconds,
              hostedCheckoutVerificationUrl: prevState.hostedCheckoutVerificationUrl,
              hostedCheckoutFirstDirectResendEnabled: prevState.hostedCheckoutFirstDirectResendEnabled,
              hostedCheckoutFirstResendWaitSeconds: prevState.hostedCheckoutFirstResendWaitSeconds,
              hostedCheckoutSubsequentResendWaitSeconds: prevState.hostedCheckoutSubsequentResendWaitSeconds,
              hostedCheckoutVerificationResendMaxAttempts: prevState.hostedCheckoutVerificationResendMaxAttempts,
              hostedCheckoutVerificationPollAttempts: prevState.hostedCheckoutVerificationPollAttempts,
              hostedCheckoutVerificationPollIntervalSeconds: prevState.hostedCheckoutVerificationPollIntervalSeconds,
              upiRedeemExternalApiKey: prevState.upiRedeemExternalApiKey,
              upiRedeemClientId: prevState.upiRedeemClientId,
              upiRedeemStopAfterRedeem: prevState.upiRedeemStopAfterRedeem,
              upiRedeemContinueAfterRedeem: prevState.upiRedeemContinueAfterRedeem,
              cdkPoolText: prevState.cdkPoolText,
              upiRedeemCdkPoolText: prevState.upiRedeemCdkPoolText,
              upiRedeemCdkeyPoolText: prevState.upiRedeemCdkeyPoolText,
              cdkUsage: prevState.cdkUsage,
              upiRedeemCdkUsage: prevState.upiRedeemCdkUsage,
              upiRedeemCdkeyUsage: prevState.upiRedeemCdkeyUsage,
              legacyWalletEmail: prevState.legacyWalletEmail,
              legacyWalletPassword: prevState.legacyWalletPassword,
              legacyWalletAccounts: prevState.legacyWalletAccounts,
              currentLegacyWalletAccountId: prevState.currentLegacyWalletAccountId,
              autoRunSkipFailures: prevState.autoRunSkipFailures,
              autoRunRetryNonFreeTrial: prevState.autoRunRetryNonFreeTrial,
              autoRunRetryLegacyWalletCallback: prevState.autoRunRetryLegacyWalletCallback,
              autoRunFallbackThreadIntervalMinutes: prevState.autoRunFallbackThreadIntervalMinutes,
              autoRunDelayEnabled: prevState.autoRunDelayEnabled,
              autoRunDelayMinutes: prevState.autoRunDelayMinutes,
              autoStepDelaySeconds: prevState.autoStepDelaySeconds,
              signupMethod: prevState.signupMethod,
              mailProvider: prevState.mailProvider,
              emailGenerator: prevState.emailGenerator,
              gmailBaseEmail: prevState.gmailBaseEmail,
              mail2925BaseEmail: prevState.mail2925BaseEmail,
              currentMail2925AccountId: prevState.currentMail2925AccountId,
              emailPrefix: prevState.emailPrefix,
              outlookAliasMaxPerAccount: prevState.outlookAliasMaxPerAccount,
              hotmailAliasUsage: prevState.hotmailAliasUsage,
              inbucketHost: prevState.inbucketHost,
              inbucketMailbox: prevState.inbucketMailbox,
              cloudflareDomain: prevState.cloudflareDomain,
              cloudflareDomains: prevState.cloudflareDomains,
              autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              autoRunSessionId: sessionId,
              tabRegistry: {},
              sourceLastUrls: {},
              ...getAutoRunStatusPayload('running', { currentRun: targetRun, totalRuns, attemptRun, sessionId }),
            };
            await resetState();
            await setState(keepSettings);
            deps.chrome.runtime.sendMessage({ type: 'AUTO_RUN_RESET' }).catch(() => { });
            await sleepWithStop(500);
          } else {
            await setState({
              autoRunSessionId: sessionId,
              autoRunSkipFailures,
              autoRunRetryNonFreeTrial,
              autoRunRetryLegacyWalletCallback,
              autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              ...getAutoRunStatusPayload('running', { currentRun: targetRun, totalRuns, attemptRun, sessionId }),
            });
          }

          if (!roundLogSnapshotMarker) {
            roundLogSnapshotMarker = createAutoRunRoundLogSnapshotMarker(await getState());
          }

          if (forceFreshTabsNextRun) {
            await addLog(`上一轮尝试已放弃，当前开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试。`, 'warn');
            forceFreshTabsNextRun = false;
          }

          const appendRoundRecordIfNeeded = async (status, reason = '', errorLike = null) => {
            if (roundRecordAppended) {
              return;
            }

            if (typeof appendAccountRunRecord !== 'function') {
              return;
            }

            const recordState = await getState();
            const recordStatus = resolveAutoRunAccountRecordStatus(status, recordState, errorLike);
            const record = await appendAccountRunRecord(recordStatus, recordState, reason);
            if (record) {
              roundRecordAppended = true;
            }
          };

          try {
            throwIfAutoRunSessionStopped(sessionId);
            await broadcastAutoRunStatus('running', {
              currentRun: targetRun,
              totalRuns,
              attemptRun,
              sessionId,
            });

            if (!useExistingProgress && startNodeId === defaultStartNodeId && typeof ensureHotmailMailboxReadyForAutoRunRound === 'function') {
              await ensureHotmailMailboxReadyForAutoRunRound({
                targetRun,
                totalRuns,
                attemptRun,
                sessionId,
              });
            }

            await runAutoSequenceFromWorkflowNode(startNodeId, {
              targetRun,
              totalRuns,
              attemptRuns: attemptRun,
              continued: useExistingProgress,
            });

            roundSummary.status = 'success';
            roundSummary.finalFailureReason = '';
            successfulRuns += 1;
            await setState({
              autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
            });
            await addLog(`=== 第 ${targetRun}/${totalRuns} 轮完成（第 ${attemptRun} 次尝试成功）===`, 'ok');
            break;
          } catch (err) {
            if (isStopError(err)) {
              stoppedEarly = true;
              await appendRoundRecordIfNeeded('stopped', getErrorMessage(err), err);
              await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }

            const reason = getErrorMessage(err);
            roundSummary.failureReasons.push(reason);
            const blockedByUpiAccountIneligible = isUpiAccountIneligibleFailure(err);
            const blockedByPlusNonFreeTrial = !blockedByUpiAccountIneligible
              && typeof isChatgptSessionReaderNonFreeTrialFailure === 'function'
              && isChatgptSessionReaderNonFreeTrialFailure(err);
            const blockedByUpiRedeemBackendFailure = typeof isUpiRedeemBackendFailure === 'function'
              && isUpiRedeemBackendFailure(err);
            const blockedByUpiRedeemNetworkFailure = typeof isUpiRedeemNetworkFailure === 'function'
              && isUpiRedeemNetworkFailure(err);
            const blockedByCardHelperTaskEnded = typeof isCardHelperTaskEndedFailure === 'function'
              ? isCardHelperTaskEndedFailure(err)
              : /CARD_HELPER_TASK_ENDED::/i.test(err?.message || String(err || ''));
            const blockedByHostedCheckoutGenericError = typeof isHostedCheckoutGenericErrorFailure === 'function'
              ? isHostedCheckoutGenericErrorFailure(err)
              : /HOSTED_CHECKOUT_GENERIC_ERROR::/i.test(err?.message || String(err || ''));
            const blockedByHostedCheckoutCardFallback = typeof isHostedCheckoutCardFallbackFailure === 'function'
              ? isHostedCheckoutCardFallbackFailure(err)
              : /HOSTED_CHECKOUT_CARD_FALLBACK::/i.test(err?.message || String(err || ''));
            const blockedByHostedCheckoutVerificationResendLimit = typeof isHostedCheckoutVerificationResendLimitFailure === 'function'
              ? isHostedCheckoutVerificationResendLimitFailure(err)
              : /HOSTED_CHECKOUT_VERIFICATION_RESEND_LIMIT::/i.test(err?.message || String(err || ''));
            const blockedByCloudCheckoutAlreadyPaid = typeof isCloudCheckoutAlreadyPaidFailure === 'function'
              ? isCloudCheckoutAlreadyPaidFailure(err)
              : /\buser\s+is\s+already\s+paid\b|already\s+(?:paid|subscribed)/i.test(err?.message || String(err || ''));
            const blockedBySignupUserAlreadyExists = typeof isSignupUserAlreadyExistsFailure === 'function'
              && isSignupUserAlreadyExistsFailure(err);
            const blockedByStep4Route405 = typeof isStep4Route405RecoveryLimitFailure === 'function'
              && isStep4Route405RecoveryLimitFailure(err);
            const maxPlusNonFreeTrialAttempts = AUTO_RUN_MAX_RETRIES_PER_ROUND + 1;
            const retryablePlusNonFreeTrial = blockedByPlusNonFreeTrial
              && autoRunRetryNonFreeTrial
              && attemptRun < maxPlusNonFreeTrialAttempts;
            const retryableUpiRedeemBackendFailure = blockedByUpiRedeemBackendFailure
              && attemptRun < maxPlusNonFreeTrialAttempts;
            const retryableUpiRedeemNetworkFailure = blockedByUpiRedeemNetworkFailure
              && attemptRun < maxPlusNonFreeTrialAttempts;
            const retryableHostedCheckoutGenericError = blockedByHostedCheckoutGenericError
              && autoRunRetryLegacyWalletCallback
              && attemptRun < maxPlusNonFreeTrialAttempts;
            const retryableHostedCheckoutCardFallback = blockedByHostedCheckoutCardFallback
              && attemptRun < maxPlusNonFreeTrialAttempts;
            const canRetry = !blockedByUpiAccountIneligible
              && !blockedByPlusNonFreeTrial
              && !blockedByUpiRedeemBackendFailure
              && !blockedByUpiRedeemNetworkFailure
              && !blockedByCardHelperTaskEnded
              && !blockedByHostedCheckoutGenericError
              && !blockedByHostedCheckoutCardFallback
              && !blockedByHostedCheckoutVerificationResendLimit
              && !blockedByCloudCheckoutAlreadyPaid
              && !blockedBySignupUserAlreadyExists
              && autoRunSkipFailures
              && attemptRun < maxAttemptsForRound;
            await setState({
              autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
            });

            if (retryablePlusNonFreeTrial) {
              const retryIndex = attemptRun;
              await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试没有 Plus 免费试用资格：${reason}`, 'warn');
              cancelPendingCommands('当前尝试因无免费试用资格已放弃。');
              await broadcastStopToContentScripts();
              await broadcastAutoRunStatus('retrying', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId,
              });
              forceFreshTabsNextRun = true;
              await addLog(
                `无试用套餐自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后换新邮箱，开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                'warn'
              );
              try {
                await sleepWithStop(AUTO_RUN_RETRY_DELAY_MS);
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              try {
                const parkedForRetry = await waitBeforeAutoRunRetry(targetRun, totalRuns, attemptRun + 1, {
                  autoRunSkipFailures,
                  autoRunRetryNonFreeTrial,
                  autoRunRetryLegacyWalletCallback,
                  roundSummaries,
                });
                if (parkedForRetry) {
                  parkedByTimer = true;
                  break;
                }
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              attemptRun += 1;
              reuseExistingProgress = false;
              continue;
            }

            if (retryableUpiRedeemBackendFailure) {
              const retryIndex = attemptRun;
              await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试 UPI 后端返回 CDK 兑换失败：${reason}`, 'warn');
              cancelPendingCommands('当前尝试因 CDK 兑换失败已放弃。');
              await broadcastStopToContentScripts();
              await broadcastAutoRunStatus('retrying', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId,
              });
              forceFreshTabsNextRun = true;
              await addLog(
                `UPI 兑换失败自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后换新邮箱，开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                'warn'
              );
              try {
                await sleepWithStop(AUTO_RUN_RETRY_DELAY_MS);
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              try {
                const parkedForRetry = await waitBeforeAutoRunRetry(targetRun, totalRuns, attemptRun + 1, {
                  autoRunSkipFailures,
                  autoRunRetryNonFreeTrial,
                  autoRunRetryLegacyWalletCallback,
                  roundSummaries,
                });
                if (parkedForRetry) {
                  parkedByTimer = true;
                  break;
                }
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              attemptRun += 1;
              reuseExistingProgress = false;
              continue;
            }

            if (retryableUpiRedeemNetworkFailure) {
              const retryIndex = attemptRun;
              await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试 UPI 接口网络异常：${reason}`, 'warn');
              cancelPendingCommands('当前尝试因 UPI 接口网络异常已放弃。');
              await broadcastStopToContentScripts();
              await broadcastAutoRunStatus('retrying', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId,
              });
              forceFreshTabsNextRun = true;
              await addLog(
                `UPI 接口网络异常自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后重开当前轮，开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                'warn'
              );
              try {
                await sleepWithStop(AUTO_RUN_RETRY_DELAY_MS);
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              try {
                const parkedForRetry = await waitBeforeAutoRunRetry(targetRun, totalRuns, attemptRun + 1, {
                  autoRunSkipFailures,
                  autoRunRetryNonFreeTrial,
                  autoRunRetryLegacyWalletCallback,
                  roundSummaries,
                });
                if (parkedForRetry) {
                  parkedByTimer = true;
                  break;
                }
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              attemptRun += 1;
              reuseExistingProgress = false;
              continue;
            }

            if (retryableHostedCheckoutGenericError) {
              const retryIndex = attemptRun;
              await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试遇到 LegacyWallet Checkout 异常：${reason}`, 'warn');
              cancelPendingCommands('当前尝试因 LegacyWallet Checkout 异常已放弃。');
              await broadcastStopToContentScripts();
              await broadcastAutoRunStatus('retrying', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId,
              });
              forceFreshTabsNextRun = true;
              await addLog(
                `LegacyWallet Checkout 异常自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后换新邮箱，开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                'warn'
              );
              try {
                await sleepWithStop(AUTO_RUN_RETRY_DELAY_MS);
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              try {
                const parkedForRetry = await waitBeforeAutoRunRetry(targetRun, totalRuns, attemptRun + 1, {
                  autoRunSkipFailures,
                  autoRunRetryNonFreeTrial,
                  autoRunRetryLegacyWalletCallback,
                  roundSummaries,
                });
                if (parkedForRetry) {
                  parkedByTimer = true;
                  break;
                }
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              attemptRun += 1;
              reuseExistingProgress = false;
              continue;
            }

            if (retryableHostedCheckoutCardFallback) {
              const retryIndex = attemptRun;
              await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试落到银行卡分支：${reason}`, 'warn');
              cancelPendingCommands('当前尝试因 hosted checkout 落到银行卡分支已放弃。');
              await broadcastStopToContentScripts();
              await broadcastAutoRunStatus('retrying', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId,
              });
              forceFreshTabsNextRun = true;
              await addLog(
                `hosted checkout 银行卡分支默认自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后换新邮箱，开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                'warn'
              );
              try {
                await sleepWithStop(AUTO_RUN_RETRY_DELAY_MS);
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              try {
                const parkedForRetry = await waitBeforeAutoRunRetry(targetRun, totalRuns, attemptRun + 1, {
                  autoRunSkipFailures,
                  autoRunRetryNonFreeTrial,
                  autoRunRetryLegacyWalletCallback,
                  roundSummaries,
                });
                if (parkedForRetry) {
                  parkedByTimer = true;
                  break;
                }
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              attemptRun += 1;
              reuseExistingProgress = false;
              continue;
            }

            if (blockedByUpiAccountIneligible) {
              roundSummary.status = 'failed';
              roundSummary.finalFailureReason = reason;
              await setState({
                autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              });
              await appendRoundRecordIfNeeded('failed', reason, err);
              cancelPendingCommands('当前轮因 UPI 账号无资格已终止。');
              await broadcastStopToContentScripts();
              await addLog(`第 ${targetRun}/${totalRuns} 轮 UPI 账号无资格：${reason}`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 UPI 账号无资格提前结束，自动切换下一个账号。`
                  : `第 ${targetRun}/${totalRuns} 轮因 UPI 账号无资格提前结束，已无后续账号，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (blockedByPlusNonFreeTrial) {
              roundSummary.status = 'failed';
              roundSummary.finalFailureReason = reason;
              await setState({
                autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              });
              await appendRoundRecordIfNeeded('failed', reason, err);
              cancelPendingCommands('当前轮因 Plus 免费试用资格不可用已终止。');
              await broadcastStopToContentScripts();
              if (!autoRunSkipFailures) {
                await addLog(
                  autoRunRetryNonFreeTrial
                    ? `第 ${targetRun}/${totalRuns} 轮检测到 Plus 今日应付金额非 0，已达到无试用套餐自动重试上限，当前自动运行将停止。`
                    : `第 ${targetRun}/${totalRuns} 轮检测到 Plus 今日应付金额非 0，自动重试未开启，当前自动运行将停止。`,
                  'warn'
                );
                stoppedEarly = true;
                await broadcastAutoRunStatus('stopped', {
                  currentRun: targetRun,
                  totalRuns,
                  attemptRun,
                  sessionId: 0,
                });
                break;
              }

              await addLog(`第 ${targetRun}/${totalRuns} 轮没有 Plus 免费试用资格，本轮将直接失败并跳过剩余重试。`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 Plus 今日应付金额非 0 提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因 Plus 今日应付金额非 0 提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (blockedByUpiRedeemBackendFailure) {
              roundSummary.status = 'failed';
              roundSummary.finalFailureReason = reason;
              await setState({
                autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              });
              await appendRoundRecordIfNeeded('failed', reason, err);
              cancelPendingCommands('当前轮因 CDK 兑换失败已终止。');
              await broadcastStopToContentScripts();
              if (!autoRunSkipFailures) {
                await addLog(
                  `第 ${targetRun}/${totalRuns} 轮 UPI 后端返回 CDK 兑换失败，已达到自动重试上限，当前自动运行将停止。`,
                  'warn'
                );
                stoppedEarly = true;
                await broadcastAutoRunStatus('stopped', {
                  currentRun: targetRun,
                  totalRuns,
                  attemptRun,
                  sessionId: 0,
                });
                break;
              }

              await addLog(`第 ${targetRun}/${totalRuns} 轮 UPI 后端返回 CDK 兑换失败，本轮将直接失败并跳过剩余重试。`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 CDK 兑换失败提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因 CDK 兑换失败提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (blockedByUpiRedeemNetworkFailure) {
              roundSummary.status = 'failed';
              roundSummary.finalFailureReason = reason;
              await setState({
                autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              });
              await appendRoundRecordIfNeeded('failed', reason, err);
              cancelPendingCommands('当前轮因 UPI 接口网络异常已达到重试上限。');
              await broadcastStopToContentScripts();
              await addLog(`第 ${targetRun}/${totalRuns} 轮 UPI 接口网络异常已重试 ${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次仍失败，本轮将切换下一轮：${reason}`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 UPI 接口网络异常提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因 UPI 接口网络异常提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (blockedByCardHelperTaskEnded) {
              roundSummary.status = 'failed';
              roundSummary.finalFailureReason = reason;
              await setState({
                autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              });
              await appendRoundRecordIfNeeded('failed', reason, err);
              cancelPendingCommands('当前轮因 CARD_HELPER 任务已结束。');
              await broadcastStopToContentScripts();
              if (!autoRunSkipFailures) {
                await addLog(
                  `第 ${targetRun}/${totalRuns} 轮 CARD_HELPER 任务已结束，自动重试未开启，当前自动运行将停止。`,
                  'warn'
                );
                stoppedEarly = true;
                await broadcastAutoRunStatus('stopped', {
                  currentRun: targetRun,
                  totalRuns,
                  attemptRun,
                  sessionId: 0,
                });
                break;
              }

              await addLog(`第 ${targetRun}/${totalRuns} 轮 CARD_HELPER 任务已结束，本轮将直接失败并跳过剩余重试。`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 CARD_HELPER 任务结束提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因 CARD_HELPER 任务结束提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (blockedByHostedCheckoutGenericError) {
              roundSummary.status = 'failed';
              roundSummary.finalFailureReason = reason;
              await setState({
                autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              });
              await appendRoundRecordIfNeeded('failed', reason, err);
              cancelPendingCommands(
                autoRunRetryLegacyWalletCallback
                  ? '当前轮因 LegacyWallet Checkout genericError 已达到自动重试上限。'
                  : '当前轮因 LegacyWallet Checkout genericError 已终止，等待用户选择检查或重试。'
              );
              await broadcastStopToContentScripts();
              if (autoRunSkipFailures) {
                await addLog(`第 ${targetRun}/${totalRuns} 轮检测到 LegacyWallet Checkout genericError，本轮将直接失败并继续下一邮箱。`, 'warn');
                forceFreshTabsNextRun = true;
                break;
              }
              await addLog(
                autoRunRetryLegacyWalletCallback
                  ? `第 ${targetRun}/${totalRuns} 轮检测到 LegacyWallet Checkout genericError，已达到 LEGACY_WALLET回调自动重试上限，当前自动运行将停止。`
                  : `第 ${targetRun}/${totalRuns} 轮检测到 LegacyWallet Checkout genericError，当前自动运行已停止，请在弹窗中选择“检查”或“重试”。`,
                'warn'
              );
              stoppedEarly = true;
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }

            if (blockedByHostedCheckoutCardFallback) {
              roundSummary.status = 'failed';
              roundSummary.finalFailureReason = reason;
              await setState({
                autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              });
              await appendRoundRecordIfNeeded('failed', reason, err);
              cancelPendingCommands('当前轮因 hosted checkout 连续落到银行卡分支已终止。');
              await broadcastStopToContentScripts();
              if (autoRunSkipFailures) {
                await addLog(`第 ${targetRun}/${totalRuns} 轮检测到 hosted checkout 连续落到银行卡分支，本轮将直接失败并继续下一邮箱。`, 'warn');
                forceFreshTabsNextRun = true;
                break;
              }
              await addLog(
                `第 ${targetRun}/${totalRuns} 轮检测到 hosted checkout 连续落到银行卡分支，已达到默认自动重试上限，当前自动运行将停止。`,
                'warn'
              );
              stoppedEarly = true;
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }

            if (blockedByHostedCheckoutVerificationResendLimit) {
              roundSummary.status = 'failed';
              roundSummary.finalFailureReason = reason;
              await setState({
                autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              });
              await appendRoundRecordIfNeeded('failed', reason, err);
              cancelPendingCommands('当前轮因 LegacyWallet 验证码自动 Resend 达到上限已终止。');
              await broadcastStopToContentScripts();
              if (autoRunSkipFailures) {
                await addLog(`第 ${targetRun}/${totalRuns} 轮 LegacyWallet 验证码自动 Resend 已达到上限，本轮将直接失败并继续下一邮箱。`, 'warn');
                forceFreshTabsNextRun = true;
                break;
              }
              await addLog(
                `第 ${targetRun}/${totalRuns} 轮 LegacyWallet 验证码自动 Resend 已达到上限，当前自动运行已停止；请尝试在页面手动获取验证码并填入。`,
                'warn'
              );
              stoppedEarly = true;
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }

            if (blockedByCloudCheckoutAlreadyPaid) {
              roundSummary.status = 'failed';
              roundSummary.finalFailureReason = reason;
              await setState({
                autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              });
              await appendRoundRecordIfNeeded('failed', reason, err);
              cancelPendingCommands('当前轮因云端确认账号已开通 Plus，已停止自动重试。');
              await broadcastStopToContentScripts();
              if (autoRunSkipFailures) {
                await addLog(`第 ${targetRun}/${totalRuns} 轮云端返回 User is already paid，本轮将直接失败并继续下一邮箱。`, 'warn');
                forceFreshTabsNextRun = true;
                break;
              }
              await addLog(
                `第 ${targetRun}/${totalRuns} 轮云端返回 User is already paid，当前自动运行已停止，请检查 PLUS 是否已经开通。`,
                'warn'
              );
              stoppedEarly = true;
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }

            if (blockedBySignupUserAlreadyExists) {
              roundSummary.status = 'failed';
              roundSummary.finalFailureReason = reason;
              await setState({
                autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              });
              await appendRoundRecordIfNeeded('failed', reason, err);
              cancelPendingCommands('当前轮因 user_already_exists 已终止。');
              await broadcastStopToContentScripts();
              if (!autoRunSkipFailures) {
                await addLog(
                  `第 ${targetRun}/${totalRuns} 轮触发 user_already_exists/用户已存在，自动重试未开启，当前自动运行将停止。`,
                  'warn'
                );
                stoppedEarly = true;
                await broadcastAutoRunStatus('stopped', {
                  currentRun: targetRun,
                  totalRuns,
                  attemptRun,
                  sessionId: 0,
                });
                break;
              }

              await addLog(`第 ${targetRun}/${totalRuns} 轮触发 user_already_exists/用户已存在，本轮将直接失败并跳过剩余重试。`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因 user_already_exists/用户已存在提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因 user_already_exists/用户已存在提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (blockedByStep4Route405) {
              roundSummary.status = 'failed';
              roundSummary.finalFailureReason = reason;
              await setState({
                autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
              });
              await appendRoundRecordIfNeeded('failed', reason, err);
              cancelPendingCommands('当前轮因步骤 4 连续 405 错误已终止。');
              await broadcastStopToContentScripts();
              if (!autoRunSkipFailures) {
                await addLog(
                  `第 ${targetRun}/${totalRuns} 轮步骤 4 连续 405 恢复失败，自动重试未开启，当前自动运行将停止。`,
                  'warn'
                );
                stoppedEarly = true;
                await broadcastAutoRunStatus('stopped', {
                  currentRun: targetRun,
                  totalRuns,
                  attemptRun,
                  sessionId: 0,
                });
                break;
              }

              await addLog(`第 ${targetRun}/${totalRuns} 轮步骤 4 连续 405 恢复失败，本轮将直接失败并跳过剩余重试。`, 'warn');
              await addLog(
                targetRun < totalRuns
                  ? `第 ${targetRun}/${totalRuns} 轮因步骤 4 连续 405 提前结束，自动流程将继续下一轮。`
                  : `第 ${targetRun}/${totalRuns} 轮因步骤 4 连续 405 提前结束，已无后续轮次，本次自动运行结束。`,
                'warn'
              );
              forceFreshTabsNextRun = true;
              break;
            }

            if (canRetry) {
              const retryIndex = attemptRun;
              if (isRestartCurrentAttemptError(err)) {
                await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试需要整轮重开：${reason}`, 'warn');
              } else {
                await addLog(`第 ${targetRun}/${totalRuns} 轮第 ${attemptRun} 次尝试失败：${reason}`, 'error');
              }
              cancelPendingCommands('当前尝试已放弃。');
              await broadcastStopToContentScripts();
              await broadcastAutoRunStatus('retrying', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId,
              });
              forceFreshTabsNextRun = true;
              await addLog(
                `自动重试：${Math.round(AUTO_RUN_RETRY_DELAY_MS / 1000)} 秒后开始第 ${targetRun}/${totalRuns} 轮第 ${attemptRun + 1} 次尝试（第 ${retryIndex}/${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试）。`,
                'warn'
              );
              try {
                await sleepWithStop(AUTO_RUN_RETRY_DELAY_MS);
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              try {
                const parkedForRetry = await waitBeforeAutoRunRetry(targetRun, totalRuns, attemptRun + 1, {
                  autoRunSkipFailures,
                  autoRunRetryNonFreeTrial,
                  autoRunRetryLegacyWalletCallback,
                  roundSummaries,
                });
                if (parkedForRetry) {
                  parkedByTimer = true;
                  break;
                }
              } catch (sleepError) {
                if (isStopError(sleepError)) {
                  stoppedEarly = true;
                  await appendRoundRecordIfNeeded('stopped', getErrorMessage(sleepError), sleepError);
                  await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
                  await broadcastAutoRunStatus('stopped', {
                    currentRun: targetRun,
                    totalRuns,
                    attemptRun,
                    sessionId: 0,
                  });
                  break;
                }
                throw sleepError;
              }
              attemptRun += 1;
              reuseExistingProgress = false;
              continue;
            }

            roundSummary.status = 'failed';
            roundSummary.finalFailureReason = reason;
            await setState({
              autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
            });
            await appendRoundRecordIfNeeded('failed', reason, err);
            if (!autoRunSkipFailures) {
              cancelPendingCommands('当前轮执行失败。');
              await broadcastStopToContentScripts();
              await addLog('当前轮执行失败，自动运行将在当前失败后停止。', 'warn');
              stoppedEarly = true;
              await broadcastAutoRunStatus('stopped', {
                currentRun: targetRun,
                totalRuns,
                attemptRun,
                sessionId: 0,
              });
              break;
            }
            await addLog(`第 ${targetRun}/${totalRuns} 轮最终失败：${reason}`, 'error');
            await addLog(
              targetRun < totalRuns
                ? `第 ${targetRun}/${totalRuns} 轮已达到 ${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试上限，继续下一轮。`
                : `第 ${targetRun}/${totalRuns} 轮已达到 ${AUTO_RUN_MAX_RETRIES_PER_ROUND} 次重试上限，本次自动运行结束。`,
              'warn'
            );
            cancelPendingCommands('当前轮已达到重试上限。');
            await broadcastStopToContentScripts();
            forceFreshTabsNextRun = true;
            break;
          } finally {
            reuseExistingProgress = false;
            continueCurrentOnFirstAttempt = false;
          }
        }

        await saveRoundLogSnapshotIfNeeded({ stoppedEarly, parkedByTimer });

        if (stoppedEarly || parkedByTimer) {
          break;
        }

        try {
          const parkedForNextRound = await waitBetweenAutoRunRounds(targetRun, totalRuns, roundSummary, {
            autoRunSkipFailures,
            autoRunRetryNonFreeTrial,
            autoRunRetryLegacyWalletCallback,
            roundSummaries,
          });
          if (parkedForNextRound) {
            parkedByTimer = true;
            break;
          }
        } catch (sleepError) {
          if (isStopError(sleepError)) {
            stoppedEarly = true;
            await addLog(`第 ${targetRun}/${totalRuns} 轮已被用户停止`, 'warn');
            await broadcastAutoRunStatus('stopped', {
              currentRun: targetRun,
              totalRuns,
              attemptRun: runtime.get().autoRunAttemptRun,
              sessionId: 0,
            });
            break;
          }
          throw sleepError;
        }
      }

      if (parkedByTimer) {
        runtime.set({ autoRunActive: false });
        clearStopRequest();
        return;
      }

      await setState({
        autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
      });
      await logAutoRunFinalSummary(totalRuns, roundSummaries);

      const finalRuntime = runtime.get();
      if (deps.getStopRequested() || stoppedEarly) {
        await replayPreviousSuccessfulAutoRunRoundLogSnapshot(sessionId, finalRuntime.autoRunCurrentRun);
        await addLog(`=== 已停止，完成 ${successfulRuns}/${finalRuntime.autoRunTotalRuns} 轮 ===`, 'warn');
        await broadcastAutoRunStatus('stopped', {
          currentRun: finalRuntime.autoRunCurrentRun,
          totalRuns: finalRuntime.autoRunTotalRuns,
          attemptRun: finalRuntime.autoRunAttemptRun,
          sessionId: 0,
        });
      } else {
        await addLog(`=== 全部 ${finalRuntime.autoRunTotalRuns} 轮已执行完成，成功 ${successfulRuns} 轮 ===`, 'ok');
        await broadcastAutoRunStatus('complete', {
          currentRun: finalRuntime.autoRunTotalRuns,
          totalRuns: finalRuntime.autoRunTotalRuns,
          attemptRun: finalRuntime.autoRunAttemptRun,
          sessionId: 0,
        });
      }
      runtime.set({ autoRunActive: false, autoRunSessionId: 0 });
      const afterRuntime = runtime.get();
      await setState({
        autoRunSessionId: 0,
        autoRunRoundSummaries: serializeAutoRunRoundSummaries(totalRuns, roundSummaries),
        autoRunTimerPlan: null,
        scheduledAutoRunPlan: null,
        ...getAutoRunStatusPayload(deps.getStopRequested() || stoppedEarly ? 'stopped' : 'complete', {
          currentRun: deps.getStopRequested() || stoppedEarly ? afterRuntime.autoRunCurrentRun : afterRuntime.autoRunTotalRuns,
          totalRuns: afterRuntime.autoRunTotalRuns,
          attemptRun: afterRuntime.autoRunAttemptRun,
          sessionId: 0,
        }),
      });
      if (!(deps.getStopRequested() || stoppedEarly)) {
        clearStopRequest();
      }
    }

    return {
      autoRunLoop,
      buildAutoRunRoundSummaries,
      createAutoRunRoundSummary,
      formatAutoRunFailureReasons,
      getAutoRunRoundRetryCount,
      handleAutoRunLoopUnhandledError,
      logAutoRunFinalSummary,
      normalizeAutoRunRoundSummary,
      resolveAutoRunAccountRecordStatus,
      serializeAutoRunRoundSummaries,
      skipAutoRunCountdown,
      startAutoRunLoop,
      waitBetweenAutoRunRounds,
      waitBeforeAutoRunRetry,
    };
  }

  return {
    createAutoRunController,
  };
});
