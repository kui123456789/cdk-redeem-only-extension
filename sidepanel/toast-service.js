(function attachSidepanelToastService(globalScope) {
  const DEFAULT_TOAST_ICONS = {
    error: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    success: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  function createToastService(context = {}) {
    const {
      container = null,
      documentRef = globalScope.document,
      escapeHtml = (value) => String(value || ''),
      icons = DEFAULT_TOAST_ICONS,
    } = context;

    function dismissToast(toast) {
      if (!toast?.parentNode) return;
      toast.classList.add('toast-exit');
      toast.addEventListener('animationend', () => toast.remove());
    }

    function showToast(message, type = 'error', duration = 4000) {
      if (!container || !documentRef?.createElement) {
        return null;
      }
      const toast = documentRef.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerHTML = `${icons[type] || ''}<span class="toast-msg">${escapeHtml(message)}</span><button class="toast-close">&times;</button>`;

      toast.querySelector('.toast-close')?.addEventListener('click', () => dismissToast(toast));
      container.appendChild(toast);

      if (duration > 0) {
        setTimeout(() => dismissToast(toast), duration);
      }
      return toast;
    }

    return {
      dismissToast,
      showToast,
    };
  }

  globalScope.SidepanelToastService = {
    createToastService,
  };
})(window);
