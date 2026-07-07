// sidepanel/mail-provider-state.js - Mail provider and alias state helpers.
(function attachSidepanelMailProviderState(globalScope) {
  function createMailProviderState(context = {}) {
    const {
      constants = {},
      getters = {},
      helpers = {},
      normalizers = {},
      rootScope = globalScope,
    } = context;

    const {
      customEmailPoolGenerator = 'custom-pool',
      cloudMailProvider = 'cloudmail',
      cloudflareTempEmailProvider = 'cloudflare-temp-email',
      freemailProvider = 'freemail',
      gmailAliasGenerator = 'gmail-alias',
      gmailProvider = 'gmail',
      luckmailProvider = 'luckmail-api',
      moemailGenerator = 'moemail',
      outlookEmailPlusGenerator = 'outlook-email-plus',
      yydsMailGenerator = 'yydsmail',
      defaultLuckmailBaseUrl = 'https://mails.luckyous.com',
      defaultLuckmailEmailType = 'ms_graph',
      mail2925ModeProvide = 'provide',
    } = constants;

    function getMailProviderValue(stateOrProvider = getters.getSelectedMailProviderValue?.()) {
      const provider = typeof stateOrProvider === 'string'
        ? stateOrProvider
        : stateOrProvider?.mailProvider;
      return String(provider || '').trim().toLowerCase();
    }

    function isCustomMailProvider(stateOrProvider = getters.getSelectedMailProviderValue?.()) {
      return getMailProviderValue(stateOrProvider) === 'custom';
    }

    function isLuckmailProvider(stateOrProvider = getters.getSelectedMailProviderValue?.()) {
      return getMailProviderValue(stateOrProvider) === luckmailProvider;
    }

    function getManagedAliasUtils() {
      return rootScope.MultiPageManagedAliasUtils || null;
    }

    function isManagedAliasProvider(
      provider = getters.getSelectedMailProviderValue?.(),
      mail2925Mode = getters.getSelectedMail2925Mode?.()
    ) {
      const utils = getManagedAliasUtils();
      if (utils?.usesManagedAliasGeneration) {
        return utils.usesManagedAliasGeneration(provider, { mail2925Mode });
      }
      if (utils?.isManagedAliasProvider) {
        const normalizedProvider = String(provider || '').trim().toLowerCase();
        if (normalizedProvider === '2925') {
          return utils.isManagedAliasProvider(provider)
            && normalizers.normalizeMail2925Mode?.(mail2925Mode) === mail2925ModeProvide;
        }
        return utils.isManagedAliasProvider(provider);
      }
      const normalizedProvider = String(provider || '').trim().toLowerCase();
      if (normalizedProvider === '2925') {
        return normalizers.normalizeMail2925Mode?.(mail2925Mode) === mail2925ModeProvide;
      }
      return normalizedProvider === gmailProvider;
    }

    function parseManagedAliasBaseEmail(rawValue, provider = getters.getSelectedMailProviderValue?.()) {
      const utils = getManagedAliasUtils();
      if (utils?.parseManagedAliasBaseEmail) {
        return utils.parseManagedAliasBaseEmail(rawValue, provider);
      }
      return null;
    }

    function isManagedAliasEmail(value, baseEmail = '', provider = getters.getSelectedMailProviderValue?.()) {
      const utils = getManagedAliasUtils();
      if (utils?.isManagedAliasEmail) {
        return utils.isManagedAliasEmail(value, provider, baseEmail);
      }
      return false;
    }

    function getSelectedEmailGenerator() {
      const generator = String(getters.getSelectedEmailGeneratorValue?.() || '').trim().toLowerCase();
      if (generator === 'custom' || generator === 'manual') {
        return 'custom';
      }
      if (generator === gmailAliasGenerator) return gmailAliasGenerator;
      if (generator === customEmailPoolGenerator) return customEmailPoolGenerator;
      if (generator === 'icloud') return 'icloud';
      if (generator === 'cloudflare') return 'cloudflare';
      if (generator === cloudflareTempEmailProvider) return cloudflareTempEmailProvider;
      if (generator === cloudMailProvider) return cloudMailProvider;
      if (generator === freemailProvider) return freemailProvider;
      if (generator === moemailGenerator) return moemailGenerator;
      if (generator === yydsMailGenerator) return yydsMailGenerator;
      if (generator === outlookEmailPlusGenerator) return outlookEmailPlusGenerator;
      return 'duck';
    }

    function normalizeLuckmailBaseUrl(value = '') {
      if (rootScope.LuckMailUtils?.normalizeLuckmailBaseUrl) {
        return rootScope.LuckMailUtils.normalizeLuckmailBaseUrl(value);
      }
      const trimmed = String(value || '').trim();
      if (!trimmed) {
        return defaultLuckmailBaseUrl;
      }
      try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return defaultLuckmailBaseUrl;
        }
        parsed.pathname = parsed.pathname.replace(/\/+$/g, '');
        parsed.search = '';
        parsed.hash = '';
        return parsed.toString().replace(/\/$/g, '');
      } catch {
        return defaultLuckmailBaseUrl;
      }
    }

    function normalizeLuckmailEmailType(value = '') {
      if (rootScope.LuckMailUtils?.normalizeLuckmailEmailType) {
        return rootScope.LuckMailUtils.normalizeLuckmailEmailType(value);
      }
      const normalized = String(value || '').trim().toLowerCase();
      return ['self_built', 'ms_imap', 'ms_graph', 'google_variant'].includes(normalized)
        ? normalized
        : defaultLuckmailEmailType;
    }

    function getManagedAliasProviderUiCopy(
      provider = getters.getSelectedMailProviderValue?.(),
      mail2925Mode = getters.getSelectedMail2925Mode?.()
    ) {
      if (!isManagedAliasProvider(provider, mail2925Mode)) {
        return null;
      }
      const utils = getManagedAliasUtils();
      if (utils?.getManagedAliasProviderUiCopy) {
        return utils.getManagedAliasProviderUiCopy(provider);
      }
      const normalizedProvider = String(provider || '').trim().toLowerCase();
      if (normalizedProvider === gmailProvider) {
        return {
          baseLabel: '基邮箱',
          basePlaceholder: '例如 yourname@gmail.com',
          buttonLabel: '生成',
          successVerb: '生成',
          label: 'Gmail +tag 邮箱',
          placeholder: '点击生成 Gmail +tag 邮箱，或手动填写完整邮箱',
          hint: '先填写基邮箱后点“生成”，也可以直接手动填写完整的 Gmail 邮箱。',
        };
      }
      if (normalizedProvider === '2925') {
        return {
          baseLabel: '基邮箱',
          basePlaceholder: '例如 yourname@2925.com',
          buttonLabel: '生成',
          successVerb: '生成',
          label: '2925 邮箱',
          placeholder: '点击生成 2925 邮箱，或手动填写完整邮箱',
          hint: '先填写基邮箱后点“生成”，也可以直接手动填写完整的 2925 邮箱。',
        };
      }
      return null;
    }

    function getManagedAliasBaseEmailKey(provider = getters.getSelectedMailProviderValue?.()) {
      const normalizedProvider = String(provider || '').trim().toLowerCase();
      if (normalizedProvider === gmailProvider) {
        return 'gmailBaseEmail';
      }
      if (normalizedProvider === '2925') {
        return 'mail2925BaseEmail';
      }
      return '';
    }

    function isMail2925AccountPoolEnabled(state = getters.getLatestState?.()) {
      return Boolean(state?.mail2925UseAccountPool);
    }

    function getManagedAliasBaseEmailForProvider(
      provider = getters.getSelectedMailProviderValue?.(),
      state = getters.getLatestState?.()
    ) {
      if (String(provider || '').trim().toLowerCase() === '2925' && isMail2925AccountPoolEnabled(state)) {
        const currentMail2925Email = helpers.getCurrentMail2925Email?.(state);
        if (currentMail2925Email) {
          return currentMail2925Email;
        }
      }

      const key = getManagedAliasBaseEmailKey(provider);
      if (!key) {
        return '';
      }

      const providerValue = String(state?.[key] || '').trim();
      if (providerValue) {
        return providerValue;
      }

      const legacyEmailPrefix = String(state?.emailPrefix || '').trim();
      return parseManagedAliasBaseEmail(legacyEmailPrefix, provider) ? legacyEmailPrefix : '';
    }

    function isRegistrationEmailCompatible(options = {}) {
      const {
        email = getters.getInputEmailValue?.(),
        provider = getters.getSelectedMailProviderValue?.(),
        mail2925Mode = getters.getSelectedMail2925Mode?.(),
        state = getters.getLatestState?.(),
      } = options;
      if (!helpers.usesGeneratedAliasMailProvider?.(provider, mail2925Mode) || !email) {
        return true;
      }
      const baseEmail = getManagedAliasBaseEmailForProvider(provider, state);
      return isManagedAliasEmail(email, baseEmail, provider);
    }

    return {
      getMailProviderValue,
      getManagedAliasBaseEmailForProvider,
      getManagedAliasBaseEmailKey,
      getManagedAliasProviderUiCopy,
      getManagedAliasUtils,
      getSelectedEmailGenerator,
      isCustomMailProvider,
      isLuckmailProvider,
      isMail2925AccountPoolEnabled,
      isManagedAliasEmail,
      isManagedAliasProvider,
      isRegistrationEmailCompatible,
      normalizeLuckmailBaseUrl,
      normalizeLuckmailEmailType,
      parseManagedAliasBaseEmail,
    };
  }

  globalScope.SidepanelMailProviderState = {
    createMailProviderState,
  };
})(self);
