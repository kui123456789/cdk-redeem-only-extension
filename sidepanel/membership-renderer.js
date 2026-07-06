(function attachSidepanelMembershipRenderer(globalScope) {
  function fallbackEscapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
    renderFlow,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelMembershipRenderer = api;
})(typeof window !== 'undefined' ? window : globalThis);
