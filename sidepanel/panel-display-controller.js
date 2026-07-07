(function attachSidepanelPanelDisplayController(globalScope) {
  function setElementVisible(element, visible) {
    if (element) {
      element.style.display = visible ? '' : 'none';
    }
  }

  function createPanelDisplayController(deps = {}) {
    const {
      constants = {},
      dom = {},
      getters = {},
      helpers = {},
      normalizers = {},
    } = deps;

    function updateMailProviderUI() {
      const latestState = getters.getLatestState?.() || {};
      const provider = String(dom.selectMailProvider?.value || latestState?.mailProvider || '').trim().toLowerCase();
      const emailGenerator = String(dom.selectEmailGenerator?.value || latestState?.emailGenerator || '').trim().toLowerCase();
      const useCustomProvider = provider === 'custom';
      const use2925 = provider === '2925';
      const useLuckmail = provider === constants.LUCKMAIL_PROVIDER;
      const useIcloud = provider === constants.ICLOUD_PROVIDER
        || provider === constants.ICLOUD_API_PROVIDER
        || emailGenerator === constants.ICLOUD_PROVIDER;
      const useCustomPool = provider === constants.CUSTOM_EMAIL_POOL_GENERATOR
        || emailGenerator === constants.CUSTOM_EMAIL_POOL_GENERATOR;
      const useCloudflareTempEmail = provider === constants.CLOUDFLARE_TEMP_EMAIL_PROVIDER
        || emailGenerator === constants.CLOUDFLARE_TEMP_EMAIL_PROVIDER;
      const useCloudMail = provider === constants.CLOUD_MAIL_PROVIDER
        || emailGenerator === constants.CLOUD_MAIL_PROVIDER;
      const useFreemail = provider === constants.FREEMAIL_PROVIDER
        || emailGenerator === constants.FREEMAIL_PROVIDER;

      setElementVisible(dom.rowCustomMailProviderPool, useCustomProvider);
      setElementVisible(dom.rowMail2925Mode, use2925);
      setElementVisible(dom.rowMail2925PoolSettings, use2925);
      setElementVisible(dom.rowCustomEmailPool, useCustomPool);
      if (useCustomPool) {
        helpers.queueCustomEmailPoolRefresh?.();
      } else {
        helpers.resetCustomEmailPoolManager?.();
      }
      setElementVisible(dom.icloudSection, useIcloud);
      setElementVisible(dom.luckmailSection, useLuckmail);
      setElementVisible(dom.cloudflareTempEmailSection, useCloudflareTempEmail);
      setElementVisible(dom.cloudMailSection, useCloudMail);
      setElementVisible(dom.freemailSection, useFreemail);
      setElementVisible(dom.rowEmailGenerator, !useCustomProvider);
      if (dom.selectEmailGenerator) {
        dom.selectEmailGenerator.disabled = useCustomProvider || useLuckmail || provider === 'hotmail-api';
      }

      if (dom.inputIcloudApiBaseUrl) {
        dom.inputIcloudApiBaseUrl.disabled = provider !== constants.ICLOUD_API_PROVIDER;
      }
      if (dom.inputIcloudApiAdminKey) {
        dom.inputIcloudApiAdminKey.disabled = provider !== constants.ICLOUD_API_PROVIDER;
      }
    }

    function updatePanelModeUI() {
      const latestState = getters.getLatestState?.() || {};
      const panelMode = typeof getters.getSelectedPanelMode === 'function'
        ? getters.getSelectedPanelMode()
        : normalizers.normalizePanelMode?.(latestState?.panelMode || constants.DEFAULT_PANEL_MODE);
      const exportTarget = helpers.getExportTargetForPanelMode?.(panelMode);
      const useLocalCpaJson = exportTarget === constants.LOCAL_CPA_JSON_PANEL_MODE
        || panelMode === constants.LOCAL_CPA_JSON_NO_RT_PANEL_MODE;
      const useLocalCpaJsonNoRt = panelMode === constants.LOCAL_CPA_JSON_NO_RT_PANEL_MODE;
      const useCodex2Api = exportTarget === 'codex2api';
      const useSub2Api = false;
      const useCpa = false;

      if (dom.selectPanelMode) {
        dom.selectPanelMode.value = exportTarget;
      }
      if (dom.selectAccountAccessStrategy) {
        dom.selectAccountAccessStrategy.value = helpers.getAccountAccessStrategyUiValueForState?.(latestState);
        dom.selectAccountAccessStrategy.disabled = useCodex2Api;
        dom.selectAccountAccessStrategy.title = useCodex2Api ? 'Codex2API 仅支持 OAuth' : '';
      }
      setElementVisible(dom.rowAccountAccessStrategy, false);
      setElementVisible(dom.rowLocalCpaJsonPluginDir, useLocalCpaJson);
      setElementVisible(dom.rowLocalCpaJsonAdvancedToggle, useLocalCpaJson);
      setElementVisible(dom.rowLocalCpaJsonRelativeAuthDir, useLocalCpaJson && Boolean(getters.getLocalCpaJsonAuthDirExpanded?.()));
      setElementVisible(dom.rowVpsUrl, useCpa);
      setElementVisible(dom.rowVpsPassword, useCpa);
      setElementVisible(dom.rowLocalCpaStep9Mode, useCpa);
      setElementVisible(dom.rowSub2ApiUrl, useSub2Api);
      setElementVisible(dom.rowSub2ApiEmail, useSub2Api);
      setElementVisible(dom.rowSub2ApiPassword, useSub2Api);
      setElementVisible(dom.rowSub2ApiGroup, useSub2Api);
      setElementVisible(dom.rowSub2ApiAccountPriority, useSub2Api);
      setElementVisible(dom.rowSub2ApiDefaultProxy, useSub2Api);
      setElementVisible(dom.rowCodex2ApiUrl, useCodex2Api);
      setElementVisible(dom.rowCodex2ApiAdminKey, useCodex2Api);

      const platformButton = dom.document?.querySelector?.('.step-btn[data-step-key="platform-verify"]');
      if (platformButton) {
        platformButton.textContent = useLocalCpaJson
          ? (useLocalCpaJsonNoRt ? '本地CPA JSON 无RT 导出' : '本地CPA JSON 有RT 导出')
          : (useCodex2Api ? 'Codex2API 回调验证' : 'CPA 回调验证');
      }
    }

    return {
      updateMailProviderUI,
      updatePanelModeUI,
    };
  }

  const api = { createPanelDisplayController };
  globalScope.SidepanelPanelDisplayController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
