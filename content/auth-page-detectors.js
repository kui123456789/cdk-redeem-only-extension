// content/auth-page-detectors.js - Pure text and URL detectors for OpenAI auth pages.
(function attachAuthPageDetectors(root) {
  const AUTH_HOSTS = ['auth.openai.com', 'auth0.openai.com', 'accounts.openai.com'];
  const CHATGPT_HOSTS = ['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com'];

  const SIGNUP_ENTRY_TRIGGER_PATTERN = /^(?:免费注册|立即注册|注册|创建(?:账号|帐号|账户|帐户)|sign\s*up|register|create\s+(?:an?\s+)?account|get\s*started|(?:無料で)?サインアップ|新規登録|アカウント(?:を)?作成|साइन\s*अप(?:\s*करें)?|(?:मुफ्त|मुफ़्त)(?:\s+में)?\s+साइन\s*अप|(?:खाता|अकाउंट)\s*(?:बनाएं|बनाएँ|बनाये|बनाइए)|शुरू\s*करें)$/i;
  const LOGIN_ENTRY_PATTERN = /^(?:log\s*in|sign\s*in|登录|登陆|登入|ログイン|サインイン|लॉग\s*इन(?:\s*करें)?|साइन\s*इन(?:\s*करें)?)$/i;
  const SIGNUP_ENTRY_EXCLUDED_ACTION_PATTERN = /plans?|pricing|プラン|料金|प्लान्स?|प्राइसिंग|कीमत|मूल्य/i;
  const CONTINUE_ACTION_PATTERN = /^(?:继续|下一步|送信|続行|続ける|次へ|continue|next|submit|send|जारी\s+रखें|आगे|सबमिट|भेजें)$/i;
  const RESEND_VERIFICATION_CODE_PATTERN = /^(?:重新发送(?:验证码|电子邮件|邮件)?|再次发送(?:验证码|电子邮件|邮件)?|重发(?:验证码)?|未收到(?:验证码|邮件)|メールを再送信|コードを再送信|resend(?:\s+(?:code|email|verification\s+(?:code|email)))?|send\s+(?:a\s+)?new\s+code|send\s+(?:it\s+)?again|request\s+(?:a\s+)?new\s+code|didn'?t\s+receive(?:\s+(?:the\s+)?(?:code|email))?\??|(?:कोड|ई-?मेल|मेल)\s+(?:फिर\s+से|दोबारा|पुनः)\s+भेजें|(?:फिर\s+से|दोबारा|पुनः)\s+(?:कोड|ई-?मेल|मेल)\s+भेजें|प्राप्त\s+नहीं\s+हुआ)$/i;
  const PASSWORD_PAGE_TEXT_PATTERN = /password|पासवर्ड|パスワード|密码|密碼/i;
  const PASSWORD_PAGE_PATH_PATTERN = /\/(?:create-account|log-in)\/password(?:[/?#]|$)/i;
  const SIGNUP_PROFILE_PAGE_PATH_PATTERN = /\/(?:create-account\/profile|u\/signup\/profile|signup\/profile|about-you)(?:[/?#]|$)/i;
  const ABOUT_YOU_PATH_PATTERN = /\/about-you(?:[/?#]|$)/i;
  const CHATGPT_AUTH_PATH_PATTERN = /^\/(?:auth\/|create-account\/|email-verification|log-in)(?:[/?#]|$)/i;

  function normalizePageText(text = '') {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function isExcludedSignupEntryText(text = '') {
    const normalized = normalizePageText(text);
    return Boolean(normalized && SIGNUP_ENTRY_EXCLUDED_ACTION_PATTERN.test(normalized));
  }

  function isSignupEntryText(text = '') {
    const normalized = normalizePageText(text);
    return Boolean(normalized && !isExcludedSignupEntryText(normalized) && SIGNUP_ENTRY_TRIGGER_PATTERN.test(normalized));
  }

  function isLoginEntryText(text = '') {
    const normalized = normalizePageText(text);
    return Boolean(normalized && !isExcludedSignupEntryText(normalized) && LOGIN_ENTRY_PATTERN.test(normalized));
  }

  function isHindiLoginEntryText(text = '') {
    return /लॉग\s*इन(?:\s*करें)?|साइन\s*इन(?:\s*करें)?/i.test(normalizePageText(text));
  }

  function isContinueText(text = '') {
    return CONTINUE_ACTION_PATTERN.test(normalizePageText(text));
  }

  function isResendEmailText(text = '') {
    return RESEND_VERIFICATION_CODE_PATTERN.test(normalizePageText(text));
  }

  function isPasswordPageText(text = '') {
    return PASSWORD_PAGE_TEXT_PATTERN.test(normalizePageText(text));
  }

  function parseUrl(rawUrl = '') {
    const url = String(rawUrl || '').trim();
    if (!url) return null;
    try {
      return new URL(url);
    } catch {
      return null;
    }
  }

  function isAuthHost(parsedUrl) {
    return AUTH_HOSTS.includes(String(parsedUrl?.hostname || '').toLowerCase());
  }

  function isPasswordPageUrl(rawUrl = '') {
    const parsed = parseUrl(rawUrl);
    return Boolean(parsed && PASSWORD_PAGE_PATH_PATTERN.test(String(parsed.pathname || '')));
  }

  function isAboutYouUrl(rawUrl = '') {
    const parsed = parseUrl(rawUrl);
    return Boolean(parsed && isAuthHost(parsed) && ABOUT_YOU_PATH_PATTERN.test(String(parsed.pathname || '')));
  }

  function isSignupProfileUrl(rawUrl = '') {
    const parsed = parseUrl(rawUrl);
    return Boolean(parsed && isAuthHost(parsed) && SIGNUP_PROFILE_PAGE_PATH_PATTERN.test(String(parsed.pathname || '')));
  }

  function isChatGptHomeUrl(rawUrl = '') {
    const parsed = parseUrl(rawUrl);
    if (!parsed || !CHATGPT_HOSTS.includes(String(parsed.hostname || '').toLowerCase())) {
      return false;
    }
    return !CHATGPT_AUTH_PATH_PATTERN.test(String(parsed.pathname || ''));
  }

  const api = Object.freeze({
    normalizePageText,
    isExcludedSignupEntryText,
    isSignupEntryText,
    isLoginEntryText,
    isHindiLoginEntryText,
    isContinueText,
    isResendEmailText,
    isPasswordPageText,
    isPasswordPageUrl,
    isAboutYouUrl,
    isSignupProfileUrl,
    isChatGptHomeUrl,
  });

  root.MultiPageAuthPageDetectors = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis);
