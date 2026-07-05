// background/passkey-api-login-executor.js - Passkey API login support for UPI membership checks
(function attachPasskeyApiLoginExecutor(root) {
  const DEFAULT_TOTP_API_BASE_URL = 'https://cha.nerver.cc';
  const DEFAULT_PASSKEY_LOGIN_TIMEOUT_MS = 30000;

  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function normalizeEmail(value = '') {
    return normalizeString(value).toLowerCase();
  }

  function readFirstFiniteNumericMetadataValue(values = []) {
    for (const value of values) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'string' && value.trim() === '') continue;
      const numeric = Number(value);
      if (Number.isFinite(numeric)) return numeric;
    }
    return undefined;
  }

  function readPasskeySignCountMetadata(...sources) {
    const numeric = readFirstFiniteNumericMetadataValue(sources.flatMap((source) => (
      source && typeof source === 'object' && !Array.isArray(source)
        ? [source.passkeySignCount, source.signCount, source.sign_count]
        : [source]
    )));
    return numeric === undefined ? undefined : Math.max(0, Math.floor(numeric));
  }

  function readPasskeyAlgMetadata(...sources) {
    return readFirstFiniteNumericMetadataValue(sources.flatMap((source) => (
      source && typeof source === 'object' && !Array.isArray(source)
        ? [source.passkeyAlg, source.alg]
        : [source]
    )));
  }

  function buildPasskeyNumericMetadataPatch(...sources) {
    const signCount = readPasskeySignCountMetadata(...sources);
    const alg = readPasskeyAlgMetadata(...sources);
    return {
      ...(signCount !== undefined ? { passkeySignCount: signCount } : {}),
      ...(alg !== undefined ? { passkeyAlg: alg } : {}),
    };
  }

  function isPasskeyExportMarker(value = '') {
    return /^PASSKEY(?::|$)/i.test(normalizeString(value));
  }

  function getPasskeyCredentialIdFromExportMarker(value = '') {
    return parsePasskeyExportMarker(value).credentialId || '';
  }

  function parsePasskeyExportMarker(value = '') {
    const marker = normalizeString(value);
    if (!isPasskeyExportMarker(marker)) {
      return { credentialId: '' };
    }
    const [credentialIdPart, ...metadataParts] = marker.replace(/^PASSKEY:?/i, '').trim().split(';');
    const metadata = {};
    metadataParts.forEach((part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex <= 0) return;
      const key = normalizeString(part.slice(0, separatorIndex)).toLowerCase();
      const rawValue = normalizeString(part.slice(separatorIndex + 1));
      if (!rawValue) return;
      if (key === 'signcount' || key === 'sign_count') {
        metadata.signCount = rawValue;
      } else if (key === 'alg') {
        metadata.alg = rawValue;
      }
    });
    return {
      credentialId: normalizeString(credentialIdPart),
      ...buildPasskeyNumericMetadataPatch(metadata),
    };
  }

  function buildPasskeyExportMarker(item = {}) {
    const credentialId = normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id);
    if (!credentialId) return 'PASSKEY';
    const metadata = buildPasskeyNumericMetadataPatch(item);
    const segments = [`PASSKEY:${credentialId}`];
    if (metadata.passkeySignCount !== undefined) segments.push(`signCount=${metadata.passkeySignCount}`);
    if (metadata.passkeyAlg !== undefined) segments.push(`alg=${metadata.passkeyAlg}`);
    return segments.join(';');
  }

  function hasPasskeyCredential(item = {}) {
    return item.passkeyEnabled === true
      || Boolean(normalizeString(item.passkeyCredentialId || item.credentialId || item.credential_id));
  }

  function isResultItemPasskeyExportableForStatus(item = {}, status = '') {
    const normalizedStatus = normalizeString(status);
    if (normalizedStatus !== 'free' && normalizedStatus !== 'paid') {
      return false;
    }
    if (!hasPasskeyCredential(item) || !item.email || !item.password) return false;
    return normalizedStatus === 'paid' || Boolean(item.accessToken);
  }

  function getPasskeyLoginCore() {
    const rootScope = typeof self !== 'undefined' ? self : globalThis;
    return rootScope.MultiPagePasskeyLoginCore || {};
  }

  function normalizeNerverPasskeyLoginBaseUrl(value = '') {
    const raw = normalizeString(value);
    if (!raw) return DEFAULT_TOTP_API_BASE_URL;
    try {
      const url = new URL(raw);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Passkey API 基础地址必须使用 http 或 https 协议。');
      }
      url.hash = '';
      url.search = '';
      url.pathname = url.pathname
        .replace(/\/+$/g, '')
        .replace(/\/api\/v1\/passkey\/(?:enable|login)$/i, '')
        .replace(/\/api\/v1\/totp\/(?:enable|lookup|code)$/i, '')
        .replace(/\/+$/g, '');
      return url.toString().replace(/\/+$/g, '');
    } catch (error) {
      if (error instanceof Error && /Passkey API/.test(error.message)) {
        throw error;
      }
      throw new Error('Passkey API 基础地址无效，请填写有效的 http(s) URL。');
    }
  }

  function buildPasskeyLoginApiUrl(state = {}) {
    const baseUrl = normalizeNerverPasskeyLoginBaseUrl(
      state?.passkeyLoginApiBaseUrl
      || state?.passkeyApiBaseUrl
      || state?.upiCredentialMembershipCheckTotpApiBaseUrl
      || state?.totpMfaApiBaseUrl
      || DEFAULT_TOTP_API_BASE_URL
    ) || DEFAULT_TOTP_API_BASE_URL;
    return `${baseUrl}/api/v1/passkey/login`;
  }

  function resolvePasskeyLoginTimeoutMs(state = {}) {
    const configured = Number(state?.passkeyLoginTimeoutMs);
    if (Number.isFinite(configured) && configured > 0) {
      return Math.max(1, Math.floor(configured));
    }
    return DEFAULT_PASSKEY_LOGIN_TIMEOUT_MS;
  }

  function normalizeBackendErrorValue(value) {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return normalizeString(value);
    }
    try {
      return normalizeString(JSON.stringify(value)).slice(0, 300);
    } catch {
      return normalizeString(value);
    }
  }

  function getBackendOwnErrorMessage(payload = {}) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return '';
    for (const key of ['reason', 'message', 'error']) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const message = normalizeBackendErrorValue(payload[key]);
        if (message) return message;
      }
    }
    return '';
  }

  async function fetchPasskeyLoginResponse(fetchImpl, apiUrl, requestOptions = {}, timeoutMs = DEFAULT_PASSKEY_LOGIN_TIMEOUT_MS) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const options = { ...requestOptions };
    let timeoutId = null;
    let timedOut = false;
    if (controller) {
      options.signal = controller.signal;
    }
    try {
      if (controller) {
        timeoutId = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs);
        return await fetchImpl(apiUrl, options);
      }
      return await new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          timedOut = true;
          reject(new Error('Passkey 登录接口请求超时'));
        }, timeoutMs);
        Promise.resolve()
          .then(() => fetchImpl(apiUrl, options))
          .then(resolve, reject);
      });
    } catch (error) {
      if (timedOut || error?.name === 'AbortError') {
        throw new Error('Passkey 登录接口请求超时');
      }
      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  function buildPasskeyLoginOptionsFromCredential(credential = {}, state = {}) {
    const signCount = readPasskeySignCountMetadata(credential);
    const alg = readPasskeyAlgMetadata(credential);
    const options = {
      deviceId: normalizeString(
        credential.deviceId
        || credential.passkeyDeviceId
        || credential.device_id
        || state?.deviceId
        || state?.passkeyDeviceId
        || state?.passkeyLoginDeviceId
        || state?.totpMfaDeviceId
        || state?.upiCredentialMembershipCheckDeviceId
      ),
      credentialId: normalizeString(credential.passkeyCredentialId || credential.credentialId || credential.credential_id),
      privateJwk: credential.passkeyPrivateJwk || credential.privateJwk || credential.private_jwk,
      rpId: normalizeString(credential.passkeyRpId || credential.rpId || credential.rp_id),
      userHandle: normalizeString(credential.passkeyUserHandle || credential.userHandle || credential.user_handle),
      ...(signCount !== undefined ? { signCount } : {}),
      ...(alg !== undefined ? { alg } : {}),
    };
    Object.keys(options).forEach((key) => {
      if (options[key] === undefined || options[key] === null || options[key] === '') {
        delete options[key];
      }
    });
    return options;
  }

  function buildChatGptCookieUrl(entry = {}) {
    const rawDomain = normalizeString(entry?.domain).replace(/^\.+/, '').replace(/\.$/, '').toLowerCase();
    const allowedRoots = ['chatgpt.com', 'openai.com'];
    const host = allowedRoots.some((root) => rawDomain === root || rawDomain.endsWith(`.${root}`))
      ? rawDomain
      : 'chatgpt.com';
    const rawPath = normalizeString(entry?.path || '/');
    const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    return `https://${host}${path}`;
  }

  function normalizeChatGptCookieDomain(value = '') {
    return normalizeString(value).replace(/\.$/, '').toLowerCase();
  }

  function isAllowedChatGptCookieDomain(value = '') {
    const domain = normalizeChatGptCookieDomain(value).replace(/^\.+/, '');
    return ['chatgpt.com', 'openai.com'].some((root) => domain === root || domain.endsWith(`.${root}`));
  }

  function isPasskeySessionCookieName(name = '') {
    const normalizedName = normalizeString(name).toLowerCase();
    return /^(?:__secure-next-auth|next-auth|__secure-authjs|authjs)\.session-token(?:\.\d+)?$/.test(normalizedName);
  }

  function isChatGptCookieTarget(cookie = {}) {
    const domain = normalizeChatGptCookieDomain(cookie?.domain).replace(/^\.+/, '');
    if (domain) {
      return domain === 'chatgpt.com';
    }
    try {
      const url = new URL(normalizeString(cookie?.url));
      return url.protocol === 'https:' && url.hostname.toLowerCase() === 'chatgpt.com';
    } catch {
      return false;
    }
  }

  function hasWrittenPasskeySessionCookie(loginResult = {}, cookieApplyResult = {}) {
    const writtenCookies = Array.isArray(cookieApplyResult?.writtenCookies)
      ? cookieApplyResult.writtenCookies
      : [];
    const hasWrittenSessionCookie = writtenCookies.some((cookie) => (
      isPasskeySessionCookieName(cookie?.name) && isChatGptCookieTarget(cookie)
    ));
    if (!hasWrittenSessionCookie) {
      return false;
    }
    const returnedCookieEntries = Array.isArray(loginResult?.cookieEntries) ? loginResult.cookieEntries : [];
    const returnedSessionToken = normalizeString(loginResult?.sessionToken);
    return Boolean(returnedSessionToken || returnedCookieEntries.some((entry) => isPasskeySessionCookieName(entry?.name)));
  }

  function createPasskeyApiLoginExecutor(deps = {}) {
    const {
      chromeApi = globalThis.chrome,
      fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null,
      addLog = async () => {},
      resolveStopChecker = () => () => {},
      clearOpenAiCookies = async () => {},
      openFreshLoginTab = async () => 0,
      createSessionAccountMismatchError = (message) => new Error(message),
      maskAccessToken = (token = '') => String(token || '').slice(0, 8),
    } = deps;
    const normalizeStringDep = typeof deps.normalizeString === 'function' ? deps.normalizeString : normalizeString;
    const normalizeEmailDep = typeof deps.normalizeEmail === 'function' ? deps.normalizeEmail : normalizeEmail;
    const hasPasskeyCredentialDep = typeof deps.hasPasskeyCredential === 'function' ? deps.hasPasskeyCredential : hasPasskeyCredential;

    async function setChatGptCookieEntries(cookieEntries = []) {
      const entries = Array.isArray(cookieEntries) ? cookieEntries : [];
      if (!chromeApi?.cookies?.set) {
        return { setCount: 0, skipped: entries.length, skippedCount: entries.length, writtenCookieNames: [], writtenCookies: [] };
      }
      let setCount = 0;
      let skippedCount = 0;
      const writtenCookieNames = [];
      const writtenCookies = [];
      for (const entry of entries) {
        const name = normalizeStringDep(entry?.name);
        if (!name || entry?.value === undefined || entry?.value === null) {
          skippedCount += 1;
          continue;
        }
        const rawPath = normalizeStringDep(entry.path || '/') || '/';
        const details = {
          url: buildChatGptCookieUrl(entry),
          name,
          value: String(entry.value),
          path: rawPath.startsWith('/') ? rawPath : `/${rawPath}`,
          secure: entry.secure !== false,
          httpOnly: entry.httpOnly === true,
          sameSite: normalizeStringDep(entry.sameSite || 'lax') || 'lax',
        };
        const normalizedDomain = normalizeChatGptCookieDomain(entry.domain);
        if (normalizedDomain && !isAllowedChatGptCookieDomain(normalizedDomain)) {
          skippedCount += 1;
          await addLog(`UPI 备份核验：跳过非 ChatGPT/OpenAI 域名 cookie（${normalizedDomain}）。`, 'warn');
          continue;
        }
        if (!name.startsWith('__Host-') && entry.hostOnly !== true && normalizedDomain) {
          details.domain = normalizedDomain;
        }
        const expirationDate = Number(entry.expirationDate);
        if (Number.isFinite(expirationDate) && expirationDate > 0) {
          details.expirationDate = expirationDate;
        }
        if (entry.storeId) details.storeId = entry.storeId;
        if (entry.partitionKey) details.partitionKey = entry.partitionKey;
        try {
          await chromeApi.cookies.set(details);
          setCount += 1;
          writtenCookieNames.push(name);
          writtenCookies.push({
            name,
            url: details.url,
            ...(details.domain ? { domain: details.domain } : {}),
          });
        } catch {
          skippedCount += 1;
        }
      }
      return { setCount, skipped: skippedCount, skippedCount, writtenCookieNames, writtenCookies };
    }

    async function applyPasskeyLoginCookies(loginResult = {}, credential = {}, options = {}) {
      const cookieEntries = Array.isArray(loginResult?.cookieEntries) ? loginResult.cookieEntries : [];
      const sessionToken = normalizeStringDep(loginResult?.sessionToken);
      if (!cookieEntries.length && !sessionToken) {
        return { tabId: 0, setCount: 0, skipped: 0, writtenCookieNames: [], writtenCookies: [] };
      }
      const throwIfStopRequested = resolveStopChecker(options, 'check');
      throwIfStopRequested();
      await clearOpenAiCookies();
      throwIfStopRequested();
      const tabId = await openFreshLoginTab(credential.email);
      throwIfStopRequested();
      const entries = cookieEntries.length ? cookieEntries : [{
        name: '__Secure-next-auth.session-token',
        value: sessionToken,
        domain: '.chatgpt.com',
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      }];
      const { setCount, skipped, writtenCookieNames, writtenCookies } = await setChatGptCookieEntries(entries);
      throwIfStopRequested();
      await addLog(
        `UPI 备份核验：${credential.email} Passkey API 登录已写入 ${setCount} 个 ChatGPT cookie${skipped ? `，跳过 ${skipped} 个` : ''}。`,
        setCount > 0 ? 'ok' : 'warn'
      );
      if (chromeApi?.tabs?.reload && Number.isInteger(tabId)) {
        await chromeApi.tabs.reload(tabId).catch(() => null);
      }
      return { tabId, setCount, skipped, writtenCookieNames, writtenCookies };
    }

    async function tryPasskeyApiLoginAndReadAccessToken(credential = {}, state = {}, options = {}) {
      if (!hasPasskeyCredentialDep(credential)) {
        return null;
      }
      const core = getPasskeyLoginCore();
      if (
        typeof core.buildPasskeyLoginRequest !== 'function'
        || typeof core.normalizePasskeyLoginResponse !== 'function'
      ) {
        throw new Error('Passkey API 登录能力尚未加载。');
      }
      if (typeof fetchImpl !== 'function') {
        throw new Error('当前环境不支持 fetch，无法调用 Passkey 登录接口。');
      }
      const throwIfStopRequested = resolveStopChecker(options, 'check');
      const targetEmail = normalizeEmailDep(credential.email);
      const apiUrl = buildPasskeyLoginApiUrl(state);
      const timeoutMs = resolvePasskeyLoginTimeoutMs(state);
      const requestBody = core.buildPasskeyLoginRequest(
        targetEmail,
        buildPasskeyLoginOptionsFromCredential(credential, state)
      );
      throwIfStopRequested();
      await addLog(`UPI 备份核验：${credential.email} 正在调用 Passkey API 登录。`, 'info');
      const response = await fetchPasskeyLoginResponse(fetchImpl, apiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(requestBody),
      }, timeoutMs);
      throwIfStopRequested();
      const text = await response.text().catch(() => '');
      let payload = {};
      let parsedJson = true;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch {
        parsedJson = false;
        payload = { raw: text };
      }
      if (!response.ok) {
        const ownBackendMessage = parsedJson ? getBackendOwnErrorMessage(payload) : '';
        const plainTextMessage = normalizeStringDep(text);
        const backendMessage = typeof core.getLoginFailureMessage === 'function'
          ? normalizeStringDep(core.getLoginFailureMessage(payload))
          : '';
        const reason = ownBackendMessage || backendMessage || (!parsedJson ? plainTextMessage : '') || response.statusText || `HTTP ${response.status}`;
        const error = new Error(`Passkey API 登录返回 HTTP ${response.status}${reason ? `：${reason}` : ''}`);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }
      const loginResult = core.normalizePasskeyLoginResponse(payload);
      const responseEmail = normalizeEmailDep(loginResult.email || payload?.email);
      if (targetEmail && responseEmail && responseEmail !== targetEmail) {
        throw createSessionAccountMismatchError(
          `UPI 备份核验：${credential.email} Passkey API 登录返回账号 ${responseEmail}，不是当前目标 ${targetEmail}，已停止提交 CDK。`,
          { sessionEmail: responseEmail, targetEmail }
        );
      }
      let tabId = 0;
      let cookieApplyResult = { tabId: 0, setCount: 0, skipped: 0, writtenCookieNames: [], writtenCookies: [] };
      if (options.applyCookies !== false) {
        const applied = await applyPasskeyLoginCookies(loginResult, credential, { throwIfStopRequested });
        cookieApplyResult = applied;
        tabId = applied.tabId || 0;
      }
      loginResult.cookieApplyResult = cookieApplyResult;
      const returnedCookieEntries = Array.isArray(loginResult?.cookieEntries) ? loginResult.cookieEntries : [];
      const returnedSessionToken = normalizeStringDep(loginResult?.sessionToken);
      if (!loginResult.accessToken && (returnedCookieEntries.length || returnedSessionToken) && !hasWrittenPasskeySessionCookie(loginResult, cookieApplyResult)) {
        const message = `UPI 备份核验：${credential.email} Passkey API 登录返回了 Cookie，但未能写入浏览器会话 Cookie，已停止继续读取页面 AT。`;
        await addLog(message, 'warn');
        throw new Error(message);
      }
      if (loginResult.accessToken) {
        await addLog(
          `UPI 备份核验：${credential.email} Passkey API 登录已获取 AT（token 摘要 ${maskAccessToken(loginResult.accessToken)}）。`,
          'ok'
        );
      } else {
        await addLog(`UPI 备份核验：${credential.email} Passkey API 登录已获取 Cookie，将继续读取页面 AT。`, 'ok');
      }
      return {
        tabId,
        accessToken: loginResult.accessToken,
        session: {
          accessToken: loginResult.accessToken,
          accountEmail: responseEmail || targetEmail,
          email: responseEmail || targetEmail,
          passkeyLogin: true,
        },
        cookieApplyResult,
        passkeyLoginResult: loginResult,
      };
    }

    return {
      applyPasskeyLoginCookies,
      hasWrittenPasskeySessionCookie,
      setChatGptCookieEntries,
      tryPasskeyApiLoginAndReadAccessToken,
    };
  }

  root.MultiPagePasskeyApiLoginExecutor = {
    buildPasskeyExportMarker,
    buildPasskeyNumericMetadataPatch,
    createPasskeyApiLoginExecutor,
    getPasskeyCredentialIdFromExportMarker,
    hasPasskeyCredential,
    isPasskeyExportMarker,
    isResultItemPasskeyExportableForStatus,
    parsePasskeyExportMarker,
    readPasskeyAlgMetadata,
    readPasskeySignCountMetadata,
  };
})(typeof self !== 'undefined' ? self : globalThis);
