(function attachEmailProviderRegistry(root, factory) {
  root.MultiPageEmailProviderRegistry = factory(root);
})(typeof self !== 'undefined' ? self : globalThis, function createEmailProviderRegistryModule(root) {
  const ICLOUD_PROVIDER = 'icloud';
  const ICLOUD_API_PROVIDER = 'icloud-api';
  const GMAIL_PROVIDER = 'gmail';
  const GMAIL_ALIAS_GENERATOR = 'gmail-alias';
  const HOTMAIL_PROVIDER = 'hotmail-api';
  const LUCKMAIL_PROVIDER = 'luckmail-api';
  const CLOUDFLARE_TEMP_EMAIL_PROVIDER = 'cloudflare-temp-email';
  const CLOUDFLARE_TEMP_EMAIL_GENERATOR = 'cloudflare-temp-email';
  const CLOUD_MAIL_PROVIDER = 'cloudmail';
  const CLOUD_MAIL_GENERATOR = 'cloudmail';
  const FREEMAIL_PROVIDER = 'freemail';
  const FREEMAIL_GENERATOR = 'freemail';
  const MOEMAIL_PROVIDER = 'moemail';
  const MOEMAIL_GENERATOR = 'moemail';
  const YYDSMAIL_PROVIDER = 'yydsmail';
  const YYDSMAIL_GENERATOR = 'yydsmail';
  const OUTLOOK_EMAIL_PLUS_PROVIDER = 'outlook-email-plus';
  const OUTLOOK_EMAIL_PLUS_GENERATOR = 'outlook-email-plus';
  const CUSTOM_EMAIL_POOL_GENERATOR = 'custom-pool';

  const EMAIL_PROVIDER_IDS = Object.freeze({
    ICLOUD_PROVIDER,
    ICLOUD_API_PROVIDER,
    GMAIL_PROVIDER,
    HOTMAIL_PROVIDER,
    LUCKMAIL_PROVIDER,
    CLOUDFLARE_TEMP_EMAIL_PROVIDER,
    CLOUD_MAIL_PROVIDER,
    FREEMAIL_PROVIDER,
    MOEMAIL_PROVIDER,
    YYDSMAIL_PROVIDER,
    OUTLOOK_EMAIL_PLUS_PROVIDER,
  });

  const EMAIL_GENERATOR_IDS = Object.freeze({
    GMAIL_ALIAS_GENERATOR,
    CLOUDFLARE_TEMP_EMAIL_GENERATOR,
    CLOUD_MAIL_GENERATOR,
    FREEMAIL_GENERATOR,
    MOEMAIL_GENERATOR,
    YYDSMAIL_GENERATOR,
    OUTLOOK_EMAIL_PLUS_GENERATOR,
    CUSTOM_EMAIL_POOL_GENERATOR,
  });

  function getProvider(stateOrProvider) {
    return typeof stateOrProvider === 'string'
      ? stateOrProvider
      : stateOrProvider?.mailProvider;
  }

  function defaultNormalizeMail2925Mode(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'receive' ? 'receive' : 'provide';
  }

  function create(context = {}) {
    const normalizeMail2925Mode = typeof context.normalizeMail2925Mode === 'function'
      ? context.normalizeMail2925Mode
      : defaultNormalizeMail2925Mode;
    const getMail2925Mode = typeof context.getMail2925Mode === 'function'
      ? context.getMail2925Mode
      : (stateOrMode) => {
        if (typeof stateOrMode === 'string') {
          return normalizeMail2925Mode(stateOrMode);
        }
        return normalizeMail2925Mode(stateOrMode?.mail2925Mode);
      };
    const getManagedAliasUtils = typeof context.getManagedAliasUtils === 'function'
      ? context.getManagedAliasUtils
      : () => root.MultiPageManagedAliasUtils || null;
    const isCustomMailProvider = typeof context.isCustomMailProvider === 'function'
      ? context.isCustomMailProvider
      : (stateOrProvider) => getProvider(stateOrProvider) === 'custom';
    const isHotmailProvider = typeof context.isHotmailProvider === 'function'
      ? context.isHotmailProvider
      : (stateOrProvider) => getProvider(stateOrProvider) === HOTMAIL_PROVIDER;
    const mail2925ModeProvide = String(
      context.MAIL_2925_MODE_PROVIDE
      || context.mail2925ModeProvide
      || 'provide'
    );

    function normalizeEmailGenerator(value = '') {
      const normalized = String(value || '').trim().toLowerCase();
      if (normalized === 'custom' || normalized === 'manual') {
        return 'custom';
      }
      if (normalized === GMAIL_ALIAS_GENERATOR) {
        return GMAIL_ALIAS_GENERATOR;
      }
      if (normalized === CUSTOM_EMAIL_POOL_GENERATOR) {
        return CUSTOM_EMAIL_POOL_GENERATOR;
      }
      if (normalized === 'icloud') {
        return 'icloud';
      }
      if (normalized === 'cloudflare') return 'cloudflare';
      if (normalized === CLOUDFLARE_TEMP_EMAIL_GENERATOR) return CLOUDFLARE_TEMP_EMAIL_GENERATOR;
      if (normalized === CLOUD_MAIL_GENERATOR) return CLOUD_MAIL_GENERATOR;
      if (normalized === FREEMAIL_GENERATOR) return FREEMAIL_GENERATOR;
      if (normalized === MOEMAIL_GENERATOR) return MOEMAIL_GENERATOR;
      if (normalized === YYDSMAIL_GENERATOR) return YYDSMAIL_GENERATOR;
      if (normalized === OUTLOOK_EMAIL_PLUS_GENERATOR) return OUTLOOK_EMAIL_PLUS_GENERATOR;
      return 'duck';
    }

    function isGeneratedAliasProvider(stateOrProvider, mail2925Mode = undefined) {
      if (
        stateOrProvider
        && typeof stateOrProvider === 'object'
        && !Array.isArray(stateOrProvider)
        && normalizeEmailGenerator(stateOrProvider.emailGenerator) === CUSTOM_EMAIL_POOL_GENERATOR
      ) {
        return false;
      }
      const provider = getProvider(stateOrProvider);
      const resolvedMail2925Mode = mail2925Mode !== undefined
        ? normalizeMail2925Mode(mail2925Mode)
        : getMail2925Mode(stateOrProvider);
      const utils = getManagedAliasUtils();
      if (utils?.usesManagedAliasGeneration) {
        return utils.usesManagedAliasGeneration(provider, { mail2925Mode: resolvedMail2925Mode });
      }
      if (utils?.isManagedAliasProvider) {
        if (String(provider || '').trim().toLowerCase() === '2925') {
          return utils.isManagedAliasProvider(provider) && resolvedMail2925Mode === mail2925ModeProvide;
        }
        return utils.isManagedAliasProvider(provider);
      }
      return provider === GMAIL_PROVIDER
        || (provider === '2925' && resolvedMail2925Mode === mail2925ModeProvide);
    }

    function shouldUseCustomRegistrationEmail(state = {}) {
      return isCustomMailProvider(state)
        || (!isHotmailProvider(state)
          && !isGeneratedAliasProvider(state)
          && normalizeEmailGenerator(state.emailGenerator) === 'custom');
    }

    return Object.freeze({
      ...EMAIL_PROVIDER_IDS,
      ...EMAIL_GENERATOR_IDS,
      EMAIL_PROVIDER_IDS,
      EMAIL_GENERATOR_IDS,
      normalizeEmailGenerator,
      isGeneratedAliasProvider,
      shouldUseCustomRegistrationEmail,
    });
  }

  return Object.freeze({
    create,
    EMAIL_PROVIDER_IDS,
    EMAIL_GENERATOR_IDS,
  });
});
