(function attachSidepanelCdkPoolManager(globalScope) {
  function normalizeText(value = '') {
    return String(value || '').trim();
  }

  function normalizeRedeemChannel(value = '') {
    const helper = globalScope.MultiPageRedeemChannelState?.normalizeRedeemChannel;
    if (typeof helper === 'function') return helper(value);
    return normalizeText(value).toLowerCase() === 'ideal' ? 'ideal' : 'upi';
  }

  function createCdkPoolManager(context = {}) {
    const {
      dom = {},
      helpers = {},
    } = context;

    let eventsBound = false;

    function getChannelLabel(channel = 'upi') {
      return normalizeRedeemChannel(channel) === 'ideal' ? 'IDEAL' : 'UPI';
    }

    function showImportError(channel, error) {
      const label = normalizeRedeemChannel(channel) === 'ideal' ? 'IDEAL CDK' : 'CDK';
      helpers.showToast?.(`导入 ${label} 失败：${error?.message || error || '未知错误'}`, 'error');
    }

    function showDeleteError(channel, error) {
      const label = normalizeRedeemChannel(channel) === 'ideal' ? 'IDEAL CDK' : 'CDK';
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
      bindImportShortcut(dom.inputUpiRedeemCdkeyPool, 'upi');
      bindImportShortcut(dom.inputIdealRedeemCdkeyPool, 'ideal');
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
