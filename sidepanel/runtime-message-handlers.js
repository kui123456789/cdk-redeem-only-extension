(function attachSidepanelRuntimeMessageHandlers(root, factory) {
  const api = factory();
  root.SidepanelRuntimeMessageHandlers = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSidepanelRuntimeMessageHandlersModule() {
  const runtimeMessageDataHandlerApi = (typeof window !== 'undefined' ? window : globalThis).SidepanelRuntimeMessageDataHandler
    || (typeof require === 'function' ? require('./runtime-message-data-handler.js') : null);

  function createRuntimeMessageHandlers(deps = {}) {
    const {
      appState = null,
      createCombinedScope = null,
      scopeValues = {},
    } = deps;
    const dataHandler = runtimeMessageDataHandlerApi?.createRuntimeMessageDataHandler?.(deps);

    function buildMessageScope(message, sender, sendResponse) {
      if (typeof createCombinedScope === 'function') {
        return createCombinedScope(appState, {
          ...scopeValues,
          message,
          _sender: sender,
          sendResponse,
        });
      }
      return {
        ...scopeValues,
        message,
        _sender: sender,
        sendResponse,
      };
    }

    function handleMessage(message, sender, sendResponse) {
      const messageScope = buildMessageScope(message, sender, sendResponse);
      with (messageScope) {
        switch (message.type) {
          case 'REQUEST_CUSTOM_VERIFICATION_BYPASS_CONFIRMATION': {
            (async () => {
              const step = Number(message.payload?.step);
              const result = await openCustomVerificationConfirmDialog(step);
              sendResponse(result || { confirmed: false });
            })().catch((err) => {
              sendResponse({ error: err.message });
            });
            return true;
          }

          case 'REQUEST_LEGACY_PAY_OTP_INPUT': {
            (async () => {
              const result = await openLegacyPayOtpInputDialog(message.payload || {});
              sendResponse(result || { cancelled: true, code: '' });
            })().catch((err) => {
              sendResponse({ error: err.message });
            });
            return true;
          }

          case 'SECURITY_BLOCKED_ALERT': {
            openConfirmModal({
              title: message.payload?.title || '流程已完全停止',
              message: message.payload?.message || '检测到安全风控，当前流程已完全停止。',
              alert: message.payload?.alert || { text: '检测到 Cloudflare 风控，请暂停当前操作。', tone: 'danger' },
              confirmLabel: '我知道了',
              confirmVariant: 'btn-danger',
            }).catch(() => { });
            break;
          }

          case 'LOG_ENTRY':
            appendLog(message.payload);
            if (message.payload.level === 'error') {
              showToast(message.payload.message, 'error');
              if (isLocalHelperStartupErrorMessage(message.payload.message)) {
                showLocalHelperStartupAlert(message.payload.message);
              }
              scheduleAccountRunHistoryRefresh();
            }
            break;

          case 'NODE_STATUS_CHANGED': {
            const { nodeId, status } = message.payload;
            updateNodeUI(nodeId, status);
            chrome.runtime.sendMessage({ type: 'GET_STATE', source: 'sidepanel' }).then(state => {
              syncLatestState(state);
              syncAutoRunState(state);
              updateStatusDisplay(latestState);
              updateButtonStates();
              if (status === 'completed' || status === 'manual_completed' || status === 'skipped') {
                syncPasswordField(state);
                if (state.oauthUrl) {
                  displayOauthUrl.textContent = state.oauthUrl;
                  displayOauthUrl.classList.add('has-value');
                }
                setOauthLoginCodeDisplay(state.lastLoginCode || '');
                if (state.localhostUrl) {
                  displayLocalhostUrl.textContent = state.localhostUrl;
                  displayLocalhostUrl.classList.add('has-value');
                }
              }
            }
            ).catch(() => { });
            break;
          }

          case 'AUTO_RUN_RESET': {
            syncLatestState({
              oauthUrl: null,
              lastLoginCode: null,
              localhostUrl: null,
              email: null,
              password: null,
              removedPaymentWorkerJobId: '',
              removedPaymentWorkerJobStatus: '',
              removedPaymentWorkerCurrentAttempt: 0,
              removedPaymentWorkerPauseRequested: false,
              removedPaymentWorkerLastLogIndex: 0,
              nodeStatuses: NODE_DEFAULT_STATUSES,
              logs: [],
              scheduledAutoRunAt: null,
              autoRunCountdownAt: null,
              autoRunCountdownTitle: '',
              autoRunCountdownNote: '',
            });
            displayOauthUrl.textContent = '等待中...';
            displayOauthUrl.classList.remove('has-value');
            setOauthLoginCodeDisplay('');
            displayLocalhostUrl.textContent = '等待中...';
            displayLocalhostUrl.classList.remove('has-value');
            inputEmail.value = '';
            displayStatus.textContent = '就绪';
            statusBar.className = 'status-bar';
            logArea.innerHTML = '';
            resetIcloudManager();
            resetLuckmailManager();
            resetCustomEmailPoolManager();
            document.querySelectorAll('.step-row').forEach(row => row.className = 'step-row');
            document.querySelectorAll('.step-status').forEach(el => el.textContent = '');
            syncAutoRunState({
              autoRunning: false,
              autoRunPhase: 'idle',
              autoRunCurrentRun: 0,
              autoRunTotalRuns: 1,
              autoRunAttemptRun: 0,
              scheduledAutoRunAt: null,
              autoRunCountdownAt: null,
              autoRunCountdownTitle: '',
              autoRunCountdownNote: '',
            });
            applyAutoRunStatus(currentAutoRun);
            updateProgressCounter();
            updateButtonStates();
            renderLegacyWalletAccounts();
            renderHotmailAccounts();
            renderMail2925Accounts();
            updateRemovedPaymentWorkerUi(latestState);
            if (isLuckmailProvider()) {
              queueLuckmailPurchaseRefresh();
            }
            break;
          }

          case 'DATA_UPDATED': {
            return dataHandler?.handleDataUpdated?.(message, sender, sendResponse);
          }

          case 'ICLOUD_LOGIN_REQUIRED': {
            const loginMessage = '需要登录 iCloud，我已经为你打开登录页。';
            showToast(loginMessage, 'warn', 5000);
            if (icloudSummary) {
              icloudSummary.textContent = loginMessage;
            }
            showIcloudLoginHelp(message.payload || {});
            break;
          }

          case 'ICLOUD_ALIASES_CHANGED': {
            queueIcloudAliasRefresh();
            break;
          }

          case 'AUTO_RUN_STATUS': {
            syncLatestState({
              autoRunning: ['scheduled', 'running', 'waiting_step', 'waiting_email', 'retrying', 'waiting_interval'].includes(message.payload.phase),
              autoRunPhase: message.payload.phase,
              autoRunCurrentRun: message.payload.currentRun,
              autoRunTotalRuns: message.payload.totalRuns,
              autoRunAttemptRun: message.payload.attemptRun,
              scheduledAutoRunAt: message.payload.scheduledAt ?? null,
              autoRunCountdownAt: message.payload.countdownAt ?? null,
              autoRunCountdownTitle: message.payload.countdownTitle ?? '',
              autoRunCountdownNote: message.payload.countdownNote ?? '',
            });
            applyAutoRunStatus(message.payload);
            updateStatusDisplay(latestState);
            updateButtonStates();
            if (!['scheduled', 'running', 'waiting_step', 'waiting_email', 'retrying', 'waiting_interval'].includes(message.payload.phase)) {
              scheduleAccountRunHistoryRefresh();
            }
            break;
          }
        }
      }
      return undefined;
    }

    return { handleMessage };
  }

  return { createRuntimeMessageHandlers };
});
