(function attachSidepanelAutoRunCountdownView(globalScope) {
  function formatCountdown(remainingMs) {
    const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function createAutoRunCountdownView(options = {}) {
    const {
      clearInterval: clearIntervalFn = globalScope.clearInterval?.bind(globalScope),
      dom = {},
      getAutoRun = () => ({}),
      getLatestState = () => null,
      setInterval: setIntervalFn = globalScope.setInterval?.bind(globalScope),
      timeZone = 'Asia/Shanghai',
      updateStatusDisplay = () => {},
    } = options;

    let scheduledCountdownTimer = null;

    function formatScheduleTime(timestamp) {
      return new Date(timestamp).toLocaleString('zh-CN', {
        hour12: false,
        timeZone,
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }

    function stopScheduledCountdownTicker() {
      clearIntervalFn?.(scheduledCountdownTimer);
      scheduledCountdownTimer = null;
    }

    function getActiveAutoRunCountdown() {
      const currentAutoRun = getAutoRun() || {};
      if (currentAutoRun.phase === 'scheduled' && Number.isFinite(currentAutoRun.scheduledAt)) {
        return {
          at: currentAutoRun.scheduledAt,
          title: '已计划自动运行',
          note: `计划于 ${formatScheduleTime(currentAutoRun.scheduledAt)} 开始`,
          tone: 'scheduled',
        };
      }

      if (currentAutoRun.phase !== 'waiting_interval') {
        return null;
      }

      if (!Number.isFinite(currentAutoRun.countdownAt)) {
        return null;
      }

      return {
        at: currentAutoRun.countdownAt,
        title: currentAutoRun.countdownTitle || '等待中',
        note: currentAutoRun.countdownNote || '',
        tone: 'running',
      };
    }

    function renderScheduledAutoRunInfo() {
      const { autoScheduleBar, autoScheduleMeta, autoScheduleTitle, btnAutoCancelSchedule, btnAutoRunNow } = dom;
      if (!autoScheduleBar) {
        return;
      }

      const countdown = getActiveAutoRunCountdown();
      if (!countdown) {
        autoScheduleBar.style.display = 'none';
        return;
      }

      const currentAutoRun = getAutoRun() || {};
      const remainingMs = countdown.at - Date.now();
      autoScheduleBar.style.display = 'flex';
      if (btnAutoRunNow) {
        btnAutoRunNow.hidden = false;
        btnAutoRunNow.textContent = currentAutoRun.phase === 'waiting_interval' ? '立即继续' : '立即开始';
      }
      if (btnAutoCancelSchedule) {
        btnAutoCancelSchedule.hidden = true;
      }
      if (autoScheduleTitle) {
        autoScheduleTitle.textContent = countdown.title;
      }
      if (autoScheduleMeta) {
        autoScheduleMeta.textContent = remainingMs > 0
          ? `${countdown.note ? `${countdown.note}，` : ''}剩余 ${formatCountdown(remainingMs)}`
          : '倒计时即将结束，正在准备继续...';
      }
    }

    function syncScheduledCountdownTicker() {
      renderScheduledAutoRunInfo();
      if (getActiveAutoRunCountdown()) {
        if (scheduledCountdownTimer) {
          return;
        }

        scheduledCountdownTimer = setIntervalFn?.(() => {
          renderScheduledAutoRunInfo();
          updateStatusDisplay(getLatestState());
        }, 1000) || null;
        return;
      }

      stopScheduledCountdownTicker();
    }

    return {
      formatCountdown,
      formatScheduleTime,
      getActiveAutoRunCountdown,
      renderScheduledAutoRunInfo,
      stopScheduledCountdownTicker,
      syncScheduledCountdownTicker,
    };
  }

  const api = {
    createAutoRunCountdownView,
    formatCountdown,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelAutoRunCountdownView = api;
})(typeof window !== 'undefined' ? window : globalThis);
