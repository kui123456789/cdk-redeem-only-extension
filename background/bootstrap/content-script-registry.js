(function attachContentScriptRegistry(root, factory) {
  const api = factory();
  root.MultiPageBackgroundContentScriptRegistry = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis, function createContentScriptRegistryModule() {
  const SIGNUP_ENTRY_URL = 'https://chatgpt.com/';
  const SIGNUP_AUTH_ENTRY_URL = 'https://chatgpt.com/auth/login';
  const SIGNUP_PAGE_INJECT_FILES = Object.freeze([
    'content/utils.js',
    'content/operation-delay.js',
    'content/auth-page-recovery.js',
    'content/auth-page-detectors.js',
    'content/signup-dom-utils.js',
    'content/signup-entry-page.js',
    'content/signup-verification-page.js',
    'content/signup-password-page.js',
    'content/signup-profile-page.js',
    'content/signup-session-page.js',
    'content/signup-page-detector.js',
    'content/signup-page-orchestrator.js',
    'content/signup-page.js',
  ]);

  function normalizeInjectFileList(files = []) {
    const seen = new Set();
    const result = [];
    for (const value of Array.isArray(files) ? files : []) {
      const file = String(value || '').trim();
      if (!file || seen.has(file)) continue;
      seen.add(file);
      result.push(file);
    }
    return result;
  }

  function createContentScriptRegistry() {
    return {
      getSignupEntryUrl: () => SIGNUP_ENTRY_URL,
      getSignupAuthEntryUrl: () => SIGNUP_AUTH_ENTRY_URL,
      getSignupPageInjectFiles: () => normalizeInjectFileList(SIGNUP_PAGE_INJECT_FILES),
    };
  }

  return {
    createContentScriptRegistry,
    normalizeInjectFileList,
  };
});
