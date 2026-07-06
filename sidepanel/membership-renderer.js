(function attachSidepanelMembershipRenderer(globalScope) {
  function fallbackEscapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function clampRedeemProgressPercent(value = 0) {
    const percent = Math.floor(Number(value) || 0);
    return Math.max(0, Math.min(100, percent));
  }

  function renderRedeemProgress(options = {}) {
    const escapeHtml = typeof options.escapeHtml === 'function' ? options.escapeHtml : fallbackEscapeHtml;
    const row = options.row || {};
    const progress = options.progress || {};
    const cancelRedeemControl = options.cancelRedeemControl || {};
    const email = String(options.email || row.email || '').trim().toLowerCase();
    const percent = clampRedeemProgressPercent(progress.percent);
    const className = [
      'upi-membership-redeem-progress',
      progress.className || 'is-idle',
      progress.running ? 'is-running' : '',
    ].filter(Boolean).join(' ');
    const title = cancelRedeemControl.visible
      ? cancelRedeemControl.title
      : (progress.title || '兑换进度');
    const content = `
        <span class="upi-membership-redeem-progress-track" aria-hidden="true">
          <span class="upi-membership-redeem-progress-bar"></span>
        </span>
        <span class="upi-membership-redeem-progress-label">${escapeHtml(progress.label || `${percent}%`)}</span>
      `;
    const commonAttrs = `class="${escapeHtml(className)}" style="--redeem-progress:${escapeHtml(String(percent))}%;" title="${escapeHtml(title)}"`;
    if (cancelRedeemControl.visible) {
      return `<button ${commonAttrs} type="button" data-upi-membership-cancel-redeem="${escapeHtml(email)}" data-upi-membership-cancel-cdkey="${escapeHtml(cancelRedeemControl.cdkey)}" data-upi-membership-cancel-channel="${escapeHtml(cancelRedeemControl.channel || 'upi')}" ${cancelRedeemControl.disabled ? 'disabled' : ''} aria-label="${escapeHtml(title)}">${content}</button>`;
    }
    return `<span ${commonAttrs} role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${escapeHtml(String(percent))}">${content}</span>`;
  }

  function renderFlow(options = {}) {
    const escapeHtml = typeof options.escapeHtml === 'function' ? options.escapeHtml : fallbackEscapeHtml;
    const steps = Array.isArray(options.steps) ? options.steps : [];
    const getStatus = typeof options.getStatus === 'function' ? options.getStatus : () => 'pending';
    const getStatusLabel = typeof options.getStatusLabel === 'function' ? options.getStatusLabel : () => '';
    const detail = String(options.detail || '');
    return `
        <div class="upi-membership-flow-list" aria-label="UPI 备份会员核验流程">
          ${steps.map((step, index) => {
            const status = getStatus(step.key);
            const statusLabel = getStatusLabel(status);
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

  const api = {
    clampRedeemProgressPercent,
    renderRedeemProgress,
    renderFlow,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelMembershipRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);
