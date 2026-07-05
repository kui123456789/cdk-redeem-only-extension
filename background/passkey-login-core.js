(function attachPasskeyLoginCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.MultiPagePasskeyLoginCore = api;
})(typeof self !== 'undefined' ? self : globalThis, function createPasskeyLoginCore() {
  const DEFAULT_COOKIE_DOMAIN = '.chatgpt.com';
  const DEFAULT_COOKIE_PATH = '/';
  const OPTIONAL_LOGIN_FIELDS = [
    'deviceId',
    'credentialId',
    'privateJwk',
    'rpId',
    'userHandle',
    'signCount',
    'alg',
  ];
  const FAILURE_MESSAGES = Object.freeze({
    'missing-credential': '没有找到该邮箱的 Passkey 凭据',
    'rate-limited': '请求太频繁，请稍后再试',
    'server-error': '服务器错误，请稍后重试',
  });
  const SAME_SITE_VALUES = Object.freeze({
    lax: true,
    strict: true,
    no_restriction: true,
    unspecified: true,
  });

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }

  function hasProvidedValue(value) {
    return value !== undefined && value !== null && value !== '';
  }

  function ownValue(object, key) {
    return object && hasOwn(object, key) ? object[key] : undefined;
  }

  function defineOwn(object, key, value) {
    Object.defineProperty(object, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }

  function cleanToken(value = '') {
    return String(value || '').trim().replace(/[\r\n]/g, '');
  }

  function selectCleanToken(primary, fallback) {
    const primaryToken = cleanToken(primary);
    return primaryToken || cleanToken(fallback);
  }

  function normalizeCookieDomain(value) {
    if (!hasProvidedValue(value)) return null;
    const rawDomain = String(value).trim().toLowerCase();
    const hasLeadingDot = rawDomain.startsWith('.');
    const bareDomain = rawDomain.replace(/^\.+/, '').replace(/\.$/, '');
    if (!bareDomain || bareDomain.includes('..')) return null;
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*$/.test(bareDomain)) return null;

    const allowedRoots = ['chatgpt.com', 'openai.com'];
    const isAllowed = allowedRoots.some((root) => bareDomain === root || bareDomain.endsWith(`.${root}`));
    if (!isAllowed) return null;
    return hasLeadingDot ? `.${bareDomain}` : bareDomain;
  }

  function isValidEmail(value = '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  }

  function normalizeSameSite(value) {
    if (!hasProvidedValue(value)) return 'lax';
    const normalized = String(value).trim().toLowerCase();
    if (normalized === 'none') return 'no_restriction';
    if (hasOwn(SAME_SITE_VALUES, normalized)) return normalized;
    return 'lax';
  }

  function normalizeExpirationDate(value) {
    if (value === undefined || value === null || value === '') return null;
    const expirationDate = Number(value);
    if (!Number.isFinite(expirationDate) || expirationDate <= 0) return null;
    return expirationDate;
  }

  function buildPasskeyLoginRequest(email, options = {}) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      throw new Error('请输入正确的邮箱');
    }
    const body = { email: normalizedEmail };
    OPTIONAL_LOGIN_FIELDS.forEach((key) => {
      if (hasOwn(options, key) && hasProvidedValue(options[key])) {
        body[key] = options[key];
      }
    });
    return body;
  }

  function normalizeCookieEntry(cookie, options = {}) {
    if (!cookie || typeof cookie !== 'object' || Array.isArray(cookie)) return null;
    const name = String(ownValue(cookie, 'name') || '').trim();
    const value = ownValue(cookie, 'value');
    if (!name || value === undefined || value === null) return null;

    const isHostCookie = name.startsWith('__Host-');
    const pathValue = ownValue(cookie, 'path');
    const secureValue = ownValue(cookie, 'secure');
    const entry = {
      name,
      value: String(value),
      path: isHostCookie ? DEFAULT_COOKIE_PATH : (hasProvidedValue(pathValue) ? String(pathValue) : DEFAULT_COOKIE_PATH),
      secure: isHostCookie ? true : (secureValue === undefined ? true : Boolean(secureValue)),
      httpOnly: ownValue(cookie, 'httpOnly') === true,
      sameSite: normalizeSameSite(ownValue(cookie, 'sameSite')),
    };

    if (!isHostCookie) {
      const domainValue = ownValue(cookie, 'domain');
      const isHostOnly = options.preserveHostOnly === true && ownValue(cookie, 'hostOnly') === true;
      if (isHostOnly) {
        defineOwn(entry, 'hostOnly', true);
      } else if (hasProvidedValue(domainValue)) {
        const normalizedDomain = normalizeCookieDomain(domainValue);
        if (!normalizedDomain) return null;
        defineOwn(entry, 'domain', normalizedDomain);
      } else if (options.defaultDomain === true) {
        defineOwn(entry, 'domain', DEFAULT_COOKIE_DOMAIN);
      }
    }

    const expirationDate = normalizeExpirationDate(ownValue(cookie, 'expirationDate'));
    if (expirationDate !== null) {
      defineOwn(entry, 'expirationDate', expirationDate);
    }

    return entry;
  }

  function normalizeCookieEntries(cookies) {
    if (!cookies) return [];
    if (Array.isArray(cookies)) {
      return cookies
        .map((cookie) => normalizeCookieEntry(cookie, { defaultDomain: true, preserveHostOnly: true }))
        .filter(Boolean);
    }
    if (typeof cookies === 'object') {
      return Object.keys(cookies)
        .map((name) => {
          const value = cookies[name];
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            return normalizeCookieEntry({
              name: hasProvidedValue(ownValue(value, 'name')) ? ownValue(value, 'name') : name,
              value: ownValue(value, 'value'),
              domain: ownValue(value, 'domain'),
              path: ownValue(value, 'path'),
              secure: ownValue(value, 'secure'),
              httpOnly: ownValue(value, 'httpOnly'),
              sameSite: ownValue(value, 'sameSite'),
              expirationDate: ownValue(value, 'expirationDate'),
              hostOnly: ownValue(value, 'hostOnly'),
            }, { defaultDomain: true, preserveHostOnly: true });
          }
          return normalizeCookieEntry({ name, value }, { defaultDomain: true });
        })
        .filter(Boolean);
    }
    return [];
  }

  function getLoginFailureMessage(data = {}) {
    const reason = hasOwn(data, 'reason') ? String(ownValue(data, 'reason') || '') : '';
    if (hasOwn(FAILURE_MESSAGES, reason)) return FAILURE_MESSAGES[reason];
    if (hasOwn(data, 'message')) {
      const message = String(ownValue(data, 'message') || '');
      if (message) return message;
    }
    if (hasOwn(data, 'error')) {
      const error = String(ownValue(data, 'error') || '');
      if (error) return error;
    }
    return '登录失败，请稍后重试';
  }

  function normalizePasskeyLoginResponse(response = {}) {
    const data = response && typeof response === 'object' && !Array.isArray(response) ? response : {};
    if (ownValue(data, 'ok') === false) {
      throw new Error(getLoginFailureMessage(data));
    }
    const cookieEntries = normalizeCookieEntries(ownValue(data, 'cookies'));
    const accessToken = selectCleanToken(ownValue(data, 'accessToken'), ownValue(data, 'access_token'));
    const sessionToken = selectCleanToken(ownValue(data, 'sessionToken'), ownValue(data, 'session_token'));
    if (!cookieEntries.length && !sessionToken && !accessToken) {
      throw new Error('后端未返回可导入的 cookies、sessionToken 或 accessToken');
    }
    const result = {
      email: String(ownValue(data, 'email') || '').trim().toLowerCase(),
      accessToken,
      cookieEntries,
    };
    if (sessionToken) {
      result.sessionToken = sessionToken;
      result.sessionRaw = JSON.stringify({ sessionToken });
    }
    return result;
  }

  return {
    buildPasskeyLoginRequest,
    normalizePasskeyLoginResponse,
    normalizeCookieEntries,
    getLoginFailureMessage,
  };
});
