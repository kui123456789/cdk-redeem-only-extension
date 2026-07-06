// sidepanel/log-panel-manager.js - Log panel rendering and clear behavior.
(function attachSidepanelLogPanelManager(globalScope) {
  function create(context = {}) {
    const {
      logArea,
      state = {},
      sendMessage,
      helpers = {},
      constants = {},
    } = context;

    const displayTimeZone = constants.displayTimeZone || 'Asia/Shanghai';
    const logLevelLabels = constants.logLevelLabels || {};
    const clearLogMessageType = constants.clearLogMessageType || 'SAVE_SETTING';
    const escapeHtml = typeof helpers.escapeHtml === 'function'
      ? helpers.escapeHtml
      : (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[char] || char));

    function appendLog(entry = {}) {
      if (!logArea) {
        return;
      }
      const timestamp = Number(entry.timestamp) || Date.now();
      const time = new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour12: false,
        timeZone: displayTimeZone,
      });
      const level = String(entry.level || 'info').trim().toLowerCase() || 'info';
      const levelLabel = logLevelLabels[level] || level;
      const line = document.createElement('div');
      line.className = `log-line log-${level}`;
      const step = Math.floor(Number(entry.step) || 0);
      line.innerHTML = [
        `<span class="log-time">${escapeHtml(time)}</span>`,
        `<span class="log-level log-level-${escapeHtml(level)}">${escapeHtml(levelLabel)}</span>`,
        step > 0 ? `<span class="log-step-tag step-${escapeHtml(step)}">步${escapeHtml(step)}</span>` : '',
        `<span class="log-msg">${escapeHtml(entry.message || '')}</span>`,
      ].filter(Boolean).join(' ');
      logArea.appendChild(line);
      logArea.scrollTop = logArea.scrollHeight;
    }

    function renderLogs(logs = []) {
      if (!logArea) {
        return;
      }
      logArea.innerHTML = '';
      if (Array.isArray(logs)) {
        logs.forEach((entry) => appendLog(entry));
      }
    }

    async function clearLog(options = {}) {
      if (logArea) {
        logArea.innerHTML = '';
      }
      state.syncLatestState?.({ logs: [] });
      if (!options.persist) {
        return;
      }
      try {
        await sendMessage?.({
          type: clearLogMessageType,
          source: 'sidepanel',
          payload: { logs: [] },
        });
      } catch {
        // The visible log is already cleared; background log persistence is best-effort.
      }
    }

    return {
      appendLog,
      renderLogs,
      clearLog,
    };
  }

  globalScope.SidepanelLogPanelManager = {
    create,
  };
})(self);
