(function attachSidepanelCdkPoolManager(globalScope) {
  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function normalizeRedeemChannel(value = '') {
    const helper = globalScope.MultiPageRedeemChannelState?.normalizeRedeemChannel;
    if (typeof helper === 'function') return helper(value);
    const normalized = normalizeText(value).toLowerCase();
    return normalized === 'ideal' || normalized === 'pix' ? normalized : 'upi';
  }

  function createCdkPoolManager(context = {}) {
    const {
      dom = {},
      helpers = {},
    } = context;

    let eventsBound = false;

    function getChannelLabel(channel = 'upi') {
      const normalizedChannel = normalizeRedeemChannel(channel);
      if (normalizedChannel === 'ideal') return 'IDEAL';
      if (normalizedChannel === 'pix') return 'PIX';
      return 'UPI';
    }

    function showImportError(channel, error) {
      const label = `${getChannelLabel(channel)} CDK`;
      helpers.showToast?.(`导入 ${label} 失败：${error?.message || error || '未知错误'}`, 'error');
    }

    function showDeleteError(channel, error) {
      const label = `${getChannelLabel(channel)} CDK`;
      helpers.showToast?.(`删除 ${label} 失败：${error?.message || error || '未知错误'}`, 'error');
    }

    function importChannel(channel = 'upi') {
      const redeemChannel = normalizeRedeemChannel(channel);
      return helpers.importCdkPoolFromTextarea?.({ channel: redeemChannel, autoResume: true });
    }

    function deleteChannel(channel = 'upi') {
      return helpers.deleteAllUpiRedeemCdkeys?.(normalizeRedeemChannel(channel));
    }

    function bindImportButton(button, channel = 'upi') {
      button?.addEventListener('click', () => {
        Promise.resolve(importChannel(channel)).catch((error) => {
          showImportError(channel, error);
        });
      });
    }

    function bindDeleteButton(button, channel = 'upi') {
      button?.addEventListener('click', () => {
        Promise.resolve(deleteChannel(channel)).catch((error) => {
          showDeleteError(channel, error);
        });
      });
    }

    function bindImportShortcut(input, channel = 'upi') {
      input?.addEventListener('keydown', (event) => {
        if (!((event.ctrlKey || event.metaKey) && event.key === 'Enter')) {
          return;
        }
        event.preventDefault();
        Promise.resolve(importChannel(channel)).catch((error) => {
          showImportError(channel, error);
        });
      });
    }

    function bindEvents() {
      if (eventsBound) {
        return;
      }
      eventsBound = true;

      dom.btnUpiRedeemCdkeyStatusRefresh?.addEventListener('click', () => {
        helpers.refreshAllUpiRedeemCdkeyStatuses?.();
      });
      bindImportButton(dom.btnImportCdkPool, 'upi');
      bindDeleteButton(dom.btnDeleteAllCdkPool, 'upi');
      bindImportButton(dom.btnImportIdealCdkPool, 'ideal');
      bindDeleteButton(dom.btnDeleteAllIdealCdkPool, 'ideal');
      bindImportButton(dom.btnImportPixCdkPool, 'pix');
      bindDeleteButton(dom.btnDeleteAllPixCdkPool, 'pix');
      bindImportShortcut(dom.inputUpiRedeemCdkeyPool, 'upi');
      bindImportShortcut(dom.inputIdealRedeemCdkeyPool, 'ideal');
      bindImportShortcut(dom.inputPixRedeemCdkeyPool, 'pix');
    }

    return {
      bindEvents,
      importChannel,
      deleteChannel,
      getChannelLabel,
    };
  }

  globalScope.SidepanelCdkPoolManager = {
    createCdkPoolManager,
  };
})(window);
