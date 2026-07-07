(function attachSidepanelAccountRecordsFlowView(globalScope) {
  function createAccountRecordsFlowView(context = {}) {
    const escapeHtml = typeof context.escapeHtml === 'function' ? context.escapeHtml : fallbackEscapeHtml;
    const compactMembershipReason = typeof context.compactMembershipReason === 'function'
      ? context.compactMembershipReason
      : (value = '') => String(value || '').trim();
    const getMembershipStatusTitle = typeof context.getMembershipStatusTitle === 'function'
      ? context.getMembershipStatusTitle
      : () => '失败';
    const getRedeemChannelLabel = typeof context.getRedeemChannelLabel === 'function'
      ? context.getRedeemChannelLabel
      : (value = '') => String(value || '').trim().toUpperCase() || 'UPI';
    const getChannelFailureLimitBlockedFreeRows = typeof context.getChannelFailureLimitBlockedFreeRows === 'function'
      ? context.getChannelFailureLimitBlockedFreeRows
      : () => [];
    const isRedeemableFreeUpiCredentialMembershipRowForChannel = typeof context.isRedeemableFreeUpiCredentialMembershipRowForChannel === 'function'
      ? context.isRedeemableFreeUpiCredentialMembershipRowForChannel
      : () => false;

    const UPI_CREDENTIAL_MEMBERSHIP_FLOW_STEPS = [
      { key: 'import', title: '准备账号' },
      { key: 'token', title: '获取/确认 AT' },
      { key: 'subscription-check', title: '查询会员资格' },
    ];
    const UPI_CREDENTIAL_MEMBERSHIP_LOGIN_ONLY_FLOW_STEPS = [
      { key: 'open-chatgpt', title: '打开 ChatGPT' },
      { key: 'login', title: '登录' },
      { key: 'done', title: '完成' },
    ];

    function getUpiCredentialMembershipFlowTitle(stepKey = '', results = {}) {
      const normalized = String(stepKey || '').trim().toLowerCase();
      return getUpiCredentialMembershipFlowSteps(results).find((step) => step.key === normalized)?.title || '处理中';
    }

    function getUpiCredentialMembershipFlowSteps(results = {}) {
      return isUpiCredentialMembershipLoginOnlyFlow(results)
        ? UPI_CREDENTIAL_MEMBERSHIP_LOGIN_ONLY_FLOW_STEPS
        : UPI_CREDENTIAL_MEMBERSHIP_FLOW_STEPS;
    }

    function normalizeUpiCredentialMembershipFlowStage(value = '', results = {}) {
      const stage = String(value || '').trim().toLowerCase();
      if (isUpiCredentialMembershipLoginOnlyFlow(results)) {
        if (stage === 'open-chatgpt' || stage === 'import') return 'open-chatgpt';
        if (stage === 'login' || stage === 'passkey-login' || stage === 'totp' || stage === 'token' || stage === 'subscription-check') {
          return 'login';
        }
        return getUpiCredentialMembershipFlowStepIndex(stage, results) >= 0 ? stage : '';
      }
      if (stage === 'upi-redeem-plus' || stage === 'confirm-plus') return 'subscription-check';
      if (stage === 'open-chatgpt' || stage === 'login' || stage === 'passkey-login' || stage === 'totp') return 'token';
      return getUpiCredentialMembershipFlowStepIndex(stage, results) >= 0 ? stage : '';
    }

    function getUpiCredentialMembershipFlowStatus(stepKey = '', results = {}, rows = []) {
      const items = Array.isArray(results.items) ? results.items : [];
      const safeRows = Array.isArray(rows) ? rows : [];
      const hasRows = safeRows.length > 0 || items.length > 0;
      let isRunning = results.running === true;
      const isRedeeming = results.redeeming === true;
      const source = String(results.source || '').trim().toLowerCase();
      const loginOnlyFlow = isUpiCredentialMembershipLoginOnlyFlow(results);
      const currentFlowEmail = normalizeEmail(results.flowStageEmail);
      const currentFlowItem = currentFlowEmail
        ? items.find((item) => normalizeEmail(item?.email) === currentFlowEmail)
        : null;
      const currentFlowStatus = String(currentFlowItem?.status || '').trim().toLowerCase();
      const singleCheckAlreadyFinished = source === 'single'
        && !isRedeeming
        && currentFlowItem
        && ['free', 'paid', 'failed'].includes(currentFlowStatus)
        && Boolean(currentFlowItem.checkedAt || currentFlowItem.upiRedeemSubscriptionCheckedAt || currentFlowItem.accessTokenMasked);
      if (singleCheckAlreadyFinished) isRunning = false;
      const isStopped = !isRunning && !isRedeeming && Boolean(results.stoppedAt || results.redeemStoppedAt);
      const activeStage = (isRunning || isRedeeming)
        ? normalizeUpiCredentialMembershipFlowStage(results.flowStage, results)
        : '';
      const stoppedStage = isStopped
        ? normalizeUpiCredentialMembershipFlowStage(results.flowStage, results)
          || (loginOnlyFlow ? 'login' : 'subscription-check')
        : '';
      const fallbackActiveStage = !activeStage && (isRunning || isRedeeming)
        ? (!hasRows ? (loginOnlyFlow ? 'open-chatgpt' : 'import') : (loginOnlyFlow ? 'login' : 'subscription-check'))
        : '';
      const runningStage = activeStage || fallbackActiveStage;
      if (runningStage) {
        const activeIndex = getUpiCredentialMembershipFlowStepIndex(runningStage, results);
        const stepIndex = getUpiCredentialMembershipFlowStepIndex(stepKey, results);
        if (stepIndex < 0 || activeIndex < 0) return 'pending';
        if (stepIndex < activeIndex) return 'completed';
        if (stepIndex === activeIndex) return 'running';
        return 'pending';
      }
      if (stoppedStage) {
        const stoppedIndex = getUpiCredentialMembershipFlowStepIndex(stoppedStage, results);
        const stepIndex = getUpiCredentialMembershipFlowStepIndex(stepKey, results);
        if (stepIndex < 0 || stoppedIndex < 0) return 'pending';
        if (stepIndex < stoppedIndex) return 'completed';
        if (stepIndex === stoppedIndex) return 'stopped';
        return 'pending';
      }
      const hasCheckedItems = items.some((item) => item?.checkedAt || item?.accessTokenMasked || item?.status === 'paid' || item?.status === 'failed');
      const hasAccessToken = items.some((item) => normalizeText(item?.accessToken || item?.accessTokenMasked))
        || safeRows.some((row) => normalizeText(row?.accessToken || row?.accessTokenMasked));
      const hasRedeemAttempt = items.some((item) => String(item?.redeemStatus || '').trim());
      const importedFreeOnly = source === 'txt-free' && !hasCheckedItems && !hasRedeemAttempt;

      if (loginOnlyFlow) return hasRows ? 'completed' : 'pending';
      if (stepKey === 'import') return hasRows ? 'completed' : 'pending';
      if (!hasRows) return 'pending';
      if (stepKey === 'token') return hasAccessToken || hasCheckedItems || hasRedeemAttempt ? 'completed' : 'pending';
      if (stepKey === 'subscription-check') {
        if (hasCheckedItems || hasRedeemAttempt || (items.length && !importedFreeOnly)) return 'completed';
        return 'pending';
      }
      return 'pending';
    }

    function getUpiCredentialMembershipFlowDetail(results = {}) {
      const items = Array.isArray(results.items) ? results.items : [];
      const currentEmail = normalizeEmail(results.flowStageEmail);
      const currentItem = currentEmail
        ? items.find((item) => normalizeEmail(item?.email) === currentEmail)
        : null;
      if ((results.redeeming || results.running) && currentItem?.redeemReason) return currentItem.redeemReason;
      const failedItem = items.slice().reverse().find((item) => (
        String(item?.redeemStatus || '').trim().toLowerCase() === 'failed'
          || String(item?.status || '').trim().toLowerCase() === 'failed'
      ));
      if (failedItem) return failedItem.redeemReason || failedItem.reason || '';
      const skippedCount = items.filter((item) => String(item?.redeemStatus || '').trim().toLowerCase() === 'skipped').length;
      const successCount = items.filter((item) => String(item?.redeemStatus || '').trim().toLowerCase() === 'success').length;
      if (skippedCount && !successCount) {
        return '已跳过兑换：账号重新核验已经是 Plus/Pro/Team 会员，未消耗 CDK。';
      }
      return '';
    }

    function renderUpiCredentialMembershipFlow(results = {}, rows = []) {
      const detail = getUpiCredentialMembershipFlowDetail(results);
      const flowSteps = getUpiCredentialMembershipFlowSteps(results);
      const membershipRenderer = globalScope.SidepanelMembershipRenderer || {};
      if (typeof membershipRenderer.renderFlow === 'function') {
        return membershipRenderer.renderFlow({
          steps: flowSteps,
          detail,
          escapeHtml,
          getStatus: (stepKey) => getUpiCredentialMembershipFlowStatus(stepKey, results, rows),
          getStatusLabel: getUpiCredentialMembershipFlowStatusLabel,
        });
      }
      return `
        <div class="upi-membership-flow-list" aria-label="UPI 备份会员核验流程">
          ${flowSteps.map((step, index) => {
            const status = getUpiCredentialMembershipFlowStatus(step.key, results, rows);
            const statusLabel = getUpiCredentialMembershipFlowStatusLabel(status);
            return `
              <div class="upi-membership-flow-row ${escapeHtml(status)}" data-upi-membership-flow-step="${escapeHtml(step.key)}">
                <div class="upi-membership-flow-indicator"><span class="upi-membership-flow-num">${escapeHtml(String(index + 1))}</span></div>
                <div class="upi-membership-flow-title">${escapeHtml(step.title)}</div>
                <span class="upi-membership-flow-status">${escapeHtml(statusLabel)}</span>
              </div>
            `;
          }).join('')}
        </div>
        ${detail ? `<div class="upi-membership-flow-detail">${escapeHtml(detail)}</div>` : ''}
      `;
    }

    return {
      getUpiCredentialMembershipFlowTitle,
      getUpiCredentialMembershipFlowSteps,
      normalizeUpiCredentialMembershipFlowStage,
      getUpiCredentialMembershipFlowStatus,
      getUpiCredentialMembershipFlowDetail,
      renderUpiCredentialMembershipFlow,
    };

    function isUpiCredentialMembershipLoginOnlyFlow(results = {}) {
      return String(results?.flowMode || '').trim().toLowerCase() === 'login-only';
    }

    function getUpiCredentialMembershipFlowStepIndex(stepKey = '', results = {}) {
      return getUpiCredentialMembershipFlowSteps(results).findIndex((step) => step.key === stepKey);
    }

    function getUpiCredentialMembershipFlowStatusLabel(status = '') {
      if (status === 'completed') return '完成';
      if (status === 'running') return '进行中';
      if (status === 'stopped') return '已停止';
      if (status === 'failed') return '失败';
      if (status === 'skipped') return '已跳过';
      return '';
    }

    function normalizeEmail(value = '') {
      return String(value || '').trim().toLowerCase();
    }

    function normalizeText(value = '') {
      return String(value || '').trim();
    }
  }

  function fallbackEscapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const api = { createAccountRecordsFlowView };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.SidepanelAccountRecordsFlowView = api;
})(typeof window !== 'undefined' ? window : globalThis);
