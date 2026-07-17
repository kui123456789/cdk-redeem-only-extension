(function attachSidepanelMembershipRedeemProgress(globalScope) {
  function fallbackEscapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function defaultNormalizeText(value = '') {
    return String(value || '').trim();
  }

  function defaultNormalizeEmail(value = '') {
    return defaultNormalizeText(value).toLowerCase();
  }

  function defaultNormalizeRedeemChannel(value = '') {
    const normalized = defaultNormalizeText(value).toLowerCase();
    return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
  }

  function defaultGetRedeemChannelLabel(channel = 'upi') {
    return defaultNormalizeRedeemChannel(channel).toUpperCase();
  }

  function defaultNormalizeRemoteStatus(status = '') {
    const normalized = defaultNormalizeText(status).toLowerCase().replace(/[\s-]+/g, '_');
    if (normalized === 'cancelled') {
      return 'canceled';
    }
    if (normalized === 'succeeded' || normalized === 'redeemed' || normalized === 'used') {
      return 'success';
    }
    if (normalized === 'failure' || normalized === 'error') {
      return 'failed';
    }
    return normalized;
  }

  function defaultIsActiveRemoteStatus(status = '') {
    return [
      'pending',
      'pending_token',
      'pending_dispatch',
      'dispatched',
      'dispatching',
      'running',
      'redeeming',
      'processing',
      'in_progress',
      'queued',
      'accepted',
      'submitted',
    ].includes(defaultNormalizeRemoteStatus(status));
  }

  function clampRedeemProgressPercent(value = 0) {
    const percent = Math.floor(Number(value) || 0);
    return Math.max(0, Math.min(100, percent));
  }

  function getUpiCredentialMembershipRedeemProgressMeta(row = {}, results = {}, options = {}) {
    const normalizeEmail = typeof options.normalizeEmail === 'function'
      ? options.normalizeEmail
      : defaultNormalizeEmail;
    const normalizeText = typeof options.normalizeText === 'function'
      ? options.normalizeText
      : defaultNormalizeText;
    const normalizeRemoteStatus = typeof options.normalizeRemoteStatus === 'function'
      ? options.normalizeRemoteStatus
      : defaultNormalizeRemoteStatus;
    const isActiveRemoteStatus = typeof options.isActiveRemoteStatus === 'function'
      ? options.isActiveRemoteStatus
      : defaultIsActiveRemoteStatus;
    const normalizeChannel = typeof options.normalizeChannel === 'function'
      ? options.normalizeChannel
      : defaultNormalizeRedeemChannel;
    const getChannelLabel = typeof options.getChannelLabel === 'function'
      ? options.getChannelLabel
      : defaultGetRedeemChannelLabel;
    const isRedeemLocked = typeof options.isRedeemLocked === 'function'
      ? options.isRedeemLocked
      : () => false;
    const getRedeemLockReason = typeof options.getRedeemLockReason === 'function'
      ? options.getRedeemLockReason
      : () => 'IDEAL 已失败 3 次，账号已封存，不再使用';

    const rowEmail = normalizeEmail(row.email);
    const currentEmail = normalizeEmail(results.flowStageEmail);
    const status = String(row.status || '').trim().toLowerCase();
    const redeemStatus = normalizeRemoteStatus(row.redeemStatus || '');
    const reason = normalizeText(row.redeemReason || row.reason);
    const isCurrentRedeemRow = Boolean(results.redeeming && rowEmail && currentEmail && rowEmail === currentEmail);
    const activeRedeemStatus = isActiveRemoteStatus(redeemStatus) || isCurrentRedeemRow;
    const channel = normalizeChannel(row.redeemChannel || row.channel || row.paymentChannel || 'upi');
    const channelLabel = getChannelLabel(channel);

    if (row.enabled === false) {
      return {
        percent: 0,
        label: '停用',
        className: 'is-muted',
        title: '当前账号已停用，不参与兑换。',
      };
    }
    if (status === 'paid') {
      return {
        percent: 100,
        label: '100%',
        className: 'is-success',
        title: `${channelLabel} 兑换已完成。`,
      };
    }
    if (isRedeemLocked(row)) {
      return {
        percent: 100,
        label: '封存',
        className: 'is-failed',
        title: getRedeemLockReason(row),
      };
    }
    if (redeemStatus === 'failed' || status === 'failed') {
      return {
        percent: 100,
        label: '失败',
        className: 'is-failed',
        title: reason || '兑换失败。',
      };
    }
    if (redeemStatus === 'canceled' || redeemStatus === 'cancelled') {
      return {
        percent: 0,
        label: '取消',
        className: 'is-muted',
        title: reason || '兑换已取消。',
      };
    }
    if (activeRedeemStatus) {
      const statusProgress = {
        queued: 18,
        pending: 24,
        pending_token: 32,
        pending_dispatch: 44,
        dispatching: 52,
        dispatched: 62,
        submitted: 68,
        accepted: 70,
        running: 76,
        redeeming: 78,
        processing: 82,
        in_progress: 82,
      };
      const percent = clampRedeemProgressPercent(statusProgress[redeemStatus] || (isCurrentRedeemRow ? 36 : 50));
      return {
        percent,
        label: `${percent}%`,
        className: 'is-running',
        running: true,
        title: reason || `${channelLabel} 兑换处理中。`,
      };
    }
    if (!normalizeText(row.accessToken)) {
      return {
        percent: 0,
        label: '缺AT',
        className: 'is-muted',
        title: '缺少 AT，无法兑换。',
      };
    }
    return {
      percent: 0,
      label: '0%',
      className: 'is-idle',
      title: reason || `${channelLabel} 待兑换。`,
    };
  }

  function renderUpiCredentialMembershipRedeemProgress(row = {}, progress = {}, cancelRedeemControl = {}, options = {}) {
    const normalizeEmail = typeof options.normalizeEmail === 'function'
      ? options.normalizeEmail
      : defaultNormalizeEmail;
    const escapeHtml = typeof options.escapeHtml === 'function'
      ? options.escapeHtml
      : fallbackEscapeHtml;
    const email = normalizeEmail(row.email);
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

  const api = {
    clampRedeemProgressPercent,
    getUpiCredentialMembershipRedeemProgressMeta,
    renderUpiCredentialMembershipRedeemProgress,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  globalScope.SidepanelMembershipRedeemProgress = api;
})(typeof window !== 'undefined' ? window : globalThis);
