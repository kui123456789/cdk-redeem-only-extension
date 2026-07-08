(function attachSidepanelRegistrationEmailUiCopy(globalScope) {
  function createRegistrationEmailUiCopy(deps = {}) {
    const {
      constants = {},
      getters = {},
      helpers = {},
    } = deps;

    function getCustomMailProviderUiCopy() {
      if (helpers.usesCustomMailProviderPool?.()) {
        return {
          buttonLabel: '自定义邮箱',
          placeholder: '号池会按顺序自动回填，也可以手动覆盖当前轮邮箱',
          successVerb: '使用',
          label: '自定义邮箱',
        };
      }
      return {
        buttonLabel: '自定义邮箱',
        placeholder: '请填写本轮要使用的注册邮箱',
        successVerb: '使用',
        label: '自定义邮箱',
      };
    }

    function getEmailGeneratorUiCopy() {
      const generator = String(getters.getSelectedEmailGenerator?.() || '').trim().toLowerCase();
      if (generator === 'custom') {
        return getCustomMailProviderUiCopy();
      }
      if (generator === constants.GMAIL_ALIAS_GENERATOR) {
        return {
          buttonLabel: '生成',
          placeholder: '步骤 3 自动生成 Gmail +tag 邮箱并回填',
          successVerb: '生成',
          label: 'Gmail +tag 邮箱',
        };
      }
      if (generator === constants.CUSTOM_EMAIL_POOL_GENERATOR) {
        return {
          buttonLabel: '取下一个',
          placeholder: '按邮箱池顺序自动回填，也可以手动粘贴当前轮邮箱',
          successVerb: '取用',
          label: '自定义邮箱池',
        };
      }
      if (generator === constants.ICLOUD_PROVIDER || generator === 'icloud') {
        return {
          buttonLabel: '获取',
          placeholder: '点击获取 iCloud 隐私邮箱，或手动粘贴邮箱',
          successVerb: '获取',
          label: 'iCloud 隐私邮箱',
        };
      }
      if (generator === 'cloudflare') {
        return {
          buttonLabel: '生成',
          placeholder: '点击生成 Cloudflare 邮箱，或手动粘贴邮箱',
          successVerb: '生成',
          label: 'Cloudflare 邮箱',
        };
      }
      if (generator === constants.CLOUDFLARE_TEMP_EMAIL_PROVIDER) {
        return {
          buttonLabel: '生成 Temp',
          placeholder: '点击生成 Cloudflare Temp Email，或手动粘贴邮箱',
          successVerb: '生成',
          label: 'Cloudflare Temp Email',
        };
      }
      if (generator === constants.CLOUD_MAIL_PROVIDER) {
        return {
          buttonLabel: '生成',
          placeholder: '点击生成 Cloud Mail 邮箱，或手动粘贴邮箱',
          successVerb: '生成',
          label: 'Cloud Mail',
        };
      }
      if (generator === constants.FREEMAIL_PROVIDER) {
        return {
          buttonLabel: '生成',
          placeholder: '点击生成 freemail 邮箱，或手动粘贴邮箱',
          successVerb: '生成',
          label: 'freemail',
        };
      }
      if (generator === constants.MOEMAIL_GENERATOR) {
        return {
          buttonLabel: '生成',
          placeholder: '点击生成 MoeMail 邮箱，或手动粘贴邮箱',
          successVerb: '生成',
          label: 'MoeMail',
        };
      }
      if (generator === constants.YYDSMAIL_GENERATOR) {
        return {
          buttonLabel: '生成',
          placeholder: '点击生成 YYDS Mail 邮箱，或手动粘贴邮箱',
          successVerb: '生成',
          label: 'YYDS Mail',
        };
      }
      if (generator === constants.OUTLOOK_EMAIL_PLUS_GENERATOR) {
        return {
          buttonLabel: '认领',
          placeholder: '点击认领 Outlook Email Plus 邮箱，或手动粘贴邮箱',
          successVerb: '认领',
          label: 'Outlook Email Plus',
        };
      }
      return {
        buttonLabel: '获取',
        placeholder: '点击获取 DuckDuckGo 邮箱，或手动粘贴邮箱',
        successVerb: '获取',
        label: 'Duck 邮箱',
      };
    }

    function getCurrentRegistrationEmailUiCopy() {
      const provider = String(getters.getSelectedMailProvider?.() || getters.getLatestState?.()?.mailProvider || '').trim().toLowerCase();
      if (provider === 'hotmail-api') {
        return {
          buttonLabel: '获取',
          placeholder: '由 微软邮箱账户池 自动分配',
          successVerb: '获取',
          label: '微软邮箱账户池',
        };
      }
      if (helpers.isCustomMailProvider?.()) {
        return getCustomMailProviderUiCopy();
      }
      if (helpers.usesGeneratedAliasMailProvider?.()) {
        return helpers.getManagedAliasProviderUiCopy?.() || getEmailGeneratorUiCopy();
      }
      return getEmailGeneratorUiCopy();
    }

    function updateRegistrationEmailUiCopy(dom = {}) {
      const uiCopy = getCurrentRegistrationEmailUiCopy() || {};
      if (dom.inputEmail) dom.inputEmail.placeholder = uiCopy.placeholder || '请填写本轮要使用的注册邮箱';
      if (dom.btnFetchEmail) {
        dom.btnFetchEmail.textContent = uiCopy.buttonLabel || '获取';
        dom.btnFetchEmail.title = uiCopy.label ? `${uiCopy.label}：${uiCopy.successVerb || uiCopy.buttonLabel || '获取'}邮箱` : '';
      }
      return uiCopy;
    }

    return {
      getCurrentRegistrationEmailUiCopy,
      getCustomMailProviderUiCopy,
      getEmailGeneratorUiCopy,
      updateRegistrationEmailUiCopy,
    };
  }

  const api = { createRegistrationEmailUiCopy };
  globalScope.SidepanelRegistrationEmailUiCopy = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
