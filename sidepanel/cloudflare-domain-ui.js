// sidepanel/cloudflare-domain-ui.js - Cloudflare domain pickers and deletion actions.
(function attachSidepanelCloudflareDomainUi(globalScope) {
  function createCloudflareDomainUi(context = {}) {
    const {
      chromeApi = globalScope.chrome,
      createEditableListPicker,
      dom = {},
      getLatestState = () => ({}),
      helpers = {},
      showToast = () => {},
      syncLatestState = () => {},
    } = context;

    async function saveSettings(payload = {}) {
      await chromeApi.runtime.sendMessage({
        type: 'SAVE_SETTING',
        source: 'sidepanel',
        payload,
      });
    }

    async function handleDeleteCloudflareDomain(domain) {
      const target = helpers.normalizeCloudflareDomainValue?.(domain);
      if (!target) {
        return;
      }
      const latestState = getLatestState();
      const nextDomains = helpers.normalizeCloudflareDomains?.(latestState?.cloudflareDomains || [])
        .filter((item) => item !== target);
      const nextSelected = helpers.normalizeCloudflareDomainValue?.(latestState?.cloudflareDomain) === target
        ? (nextDomains[0] || '')
        : helpers.normalizeCloudflareDomainValue?.(latestState?.cloudflareDomain);
      const payload = {
        cloudflareDomains: nextDomains,
        cloudflareDomain: nextSelected,
      };
      syncLatestState(payload);
      cfDomainPicker.render(nextDomains, nextSelected);
      await saveSettings(payload);
    }

    async function handleDeleteCloudflareTempEmailDomain(domain) {
      const target = helpers.normalizeCloudflareTempEmailDomainValue?.(domain);
      if (!target) {
        return;
      }
      const latestState = getLatestState();
      const nextDomains = helpers.normalizeCloudflareTempEmailDomains?.(latestState?.cloudflareTempEmailDomains || [])
        .filter((item) => item !== target);
      const nextSelected = helpers.normalizeCloudflareTempEmailDomainValue?.(latestState?.cloudflareTempEmailDomain) === target
        ? (nextDomains[0] || '')
        : helpers.normalizeCloudflareTempEmailDomainValue?.(latestState?.cloudflareTempEmailDomain);
      const payload = {
        cloudflareTempEmailDomains: nextDomains,
        cloudflareTempEmailDomain: nextSelected,
      };
      syncLatestState(payload);
      tempEmailDomainPicker.render(nextDomains, nextSelected);
      await saveSettings(payload);
    }

    const cfDomainPicker = createEditableListPicker({
      root: dom.cfDomainPickerRoot,
      input: dom.selectCfDomain,
      trigger: dom.btnCfDomainMenu,
      current: dom.cfDomainCurrent,
      menu: dom.cfDomainMenu,
      emptyLabel: '请先添加域名',
      itemLabel: '域名',
      normalizeItems: (values) => helpers.normalizeCloudflareDomains?.(values) || [],
      normalizeValue: (value) => helpers.normalizeCloudflareDomainValue?.(value) || '',
      onDelete: handleDeleteCloudflareDomain,
      onDeleteError: (error) => showToast(error?.message || '删除 Cloudflare 域名失败。', 'error'),
    });

    const tempEmailDomainPicker = createEditableListPicker({
      root: dom.tempEmailDomainPickerRoot,
      input: dom.selectTempEmailDomain,
      trigger: dom.btnTempEmailDomainMenu,
      current: dom.tempEmailDomainCurrent,
      menu: dom.tempEmailDomainMenu,
      emptyLabel: '请先更新域名',
      itemLabel: '域名',
      normalizeItems: (values) => helpers.normalizeCloudflareTempEmailDomains?.(values) || [],
      normalizeValue: (value) => helpers.normalizeCloudflareTempEmailDomainValue?.(value) || '',
      onDelete: handleDeleteCloudflareTempEmailDomain,
      onDeleteError: (error) => showToast(error?.message || '删除 Cloudflare Temp Email 域名失败。', 'error'),
    });

    return {
      cfDomainPicker,
      handleDeleteCloudflareDomain,
      handleDeleteCloudflareTempEmailDomain,
      tempEmailDomainPicker,
    };
  }

  globalScope.SidepanelCloudflareDomainUi = {
    createCloudflareDomainUi,
  };
})(self);
