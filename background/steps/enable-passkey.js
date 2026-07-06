(function attachBackgroundEnablePasskey(root, factory) {
  root.MultiPageBackgroundEnablePasskey = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createBackgroundEnablePasskeyModule() {
  const CHATGPT_SOURCE = 'chatgpt-session-reader';
  const DEFAULT_NERVER_API_BASE_URL = 'https://cha.nerver.cc';
  const CHATGPT_SECURITY_URL = 'https://chatgpt.com/#settings/Security';
  const SESSION_TAB_COMPLETE_TIMEOUT_MS = 60000;
  const PASSKEY_ENABLE_TIMEOUT_MS = 60000;
  const PASSKEY_ENABLE_MAX_ATTEMPTS = 3;
  const PASSKEY_ENABLE_RETRY_DELAYS_MS = Object.freeze([3000, 7000]);
  const SESSION_COOKIE_NAMES = Object.freeze([
    '__Secure-next-auth.session-token',
    'next-auth.session-token',
    '__Secure-authjs.session-token',
    'authjs.session-token',
  ]);

  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function normalizeErrorField(value) {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return normalizeString(value);
    }
    if (typeof value === 'object') {
      try {
        return normalizeString(JSON.stringify(value));
      } catch {
        return normalizeString(value);
      }
    }
    return normalizeString(value);
  }

  function normalizeEmail(value = '') {
    const email = normalizeString(value).toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
  }

  function getPayloadError(payload = {}) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return normalizeErrorField(payload);
    }
    const nestedError = payload.error && typeof payload.error === 'object' && !Array.isArray(payload.error)
      ? payload.error
      : null;
    const candidates = [
      payload.message,
      payload.error_message,
      payload.errorMessage,
      nestedError?.message,
      nestedError?.detail,
      nestedError?.code,
      typeof payload.error === 'string' ? payload.error : '',
      payload.detail,
      payload.reason,
      payload.code,
    ];
    for (const candidate of candidates) {
      const value = normalizeErrorField(candidate);
      if (value) {
        return value;
      }
    }
    return '';
  }

  function isChatGptUrl(url = '') {
    try {
      const parsed = new URL(String(url || ''));
      return /^https?:$/i.test(parsed.protocol) && /(^|\.)chatgpt\.com$/i.test(parsed.hostname);
    } catch {
      return false;
    }
  }

  function isSupportedSessionUrl(url = '') {
    try {
      const parsed = new URL(String(url || ''));
      if (!/^https?:$/i.test(parsed.protocol)) {
        return false;
      }
      const hostname = normalizeString(parsed.hostname).toLowerCase();
      return /(^|\.)chatgpt\.com$/.test(hostname)
        || hostname === 'chat.openai.com'
        || /(^|\.)openai\.com$/.test(hostname);
    } catch {
      return false;
    }
  }

  function pickPreferredSessionTab(tabs = []) {
    const candidates = (Array.isArray(tabs) ? tabs : [])
      .filter((tab) => Number.isInteger(tab?.id) && isSupportedSessionUrl(tab.url));
    if (!candidates.length) {
      return null;
    }
    return candidates.reduce((best, candidate) => {
      if (!best) return candidate;
      if (isChatGptUrl(candidate.url) !== isChatGptUrl(best.url)) {
        return isChatGptUrl(candidate.url) ? candidate : best;
      }
      const candidateActive = candidate.active ? 0 : 1;
      const bestActive = best.active ? 0 : 1;
      if (candidateActive !== bestActive) {
        return candidateActive < bestActive ? candidate : best;
      }
      const candidateLastAccessed = Number(candidate?.lastAccessed) || 0;
      const bestLastAccessed = Number(best?.lastAccessed) || 0;
      if (candidateLastAccessed !== bestLastAccessed) {
        return candidateLastAccessed > bestLastAccessed ? candidate : best;
      }
      return Number(candidate.id) < Number(best.id) ? candidate : best;
    }, null);
  }

  function normalizeNerverApiBaseUrl(value = '') {
    let normalized = normalizeString(value || DEFAULT_NERVER_API_BASE_URL).replace(/\/+$/g, '');
    try {
      const parsed = new URL(normalized);
      parsed.hash = '';
      parsed.search = '';
      parsed.pathname = parsed.pathname
        .replace(/\/api\/v1\/passkey\/enable$/i, '')
        .replace(/\/api\/v1\/totp\/(?:enable|lookup|code)$/i, '')
        .replace(/\/api\/v1\/subscription$/i, '')
        .replace(/\/api\/external\/cdkey-redeems\/status$/i, '')
        .replace(/\/api\/external\/cdkey-redeems$/i, '')
        .replace(/\/api\/?$/i, '')
        .replace(/\/+$/g, '');
      normalized = parsed.toString().replace(/\/+$/g, '');
    } catch {
      normalized = normalized.replace(/[?#].*$/g, '');
    }
    normalized = normalized
      .replace(/\/api\/v1\/passkey\/enable$/i, '')
      .replace(/\/api\/v1\/totp\/(?:enable|lookup|code)$/i, '')
      .replace(/\/api\/v1\/subscription$/i, '')
      .replace(/\/api\/external\/cdkey-redeems\/status$/i, '')
      .replace(/\/api\/external\/cdkey-redeems$/i, '')
      .replace(/\/api\/?$/i, '')
      .replace(/\/+$/g, '');
    return normalized || DEFAULT_NERVER_API_BASE_URL;
  }

  function buildPasskeyEnableApiUrl(state = {}) {
    const baseUrl = normalizeNerverApiBaseUrl(
      state.passkeyApiBaseUrl
      || state.upiCredentialMembershipCheckTotpApiBaseUrl
      || state.totpMfaApiBaseUrl
      || DEFAULT_NERVER_API_BASE_URL
    );
    try {
      const parsed = new URL(baseUrl);
      if (!/^https?:$/i.test(parsed.protocol)) {
        throw new Error('Passkey API Base URL 只支持 http/https。');
      }
    } catch (error) {
      throw new Error(`Passkey API Base URL 格式无效：${normalizeString(error?.message || error) || baseUrl}`);
    }
    return `${baseUrl}/api/v1/passkey/enable`;
  }

  function getPasskeyApiAuthToken(state = {}) {
    return normalizeString(state.passkeyApiKey || state.totpMfaApiKey || state.nerverApiKey);
  }

  function createDeviceId() {
    const randomUuid = globalThis.crypto?.randomUUID?.();
    if (randomUuid) {
      return randomUuid;
    }
    const stamp = Math.max(1, Math.floor(Date.now())).toString(36);
    const randomPart = Math.random().toString(36).slice(2, 12) || 'local';
    return `cdk-redeem-${stamp}-${randomPart}`;
  }

  function getCookieChunkValue(cookies = [], baseName = '') {
    const exact = cookies.find((cookie) => cookie?.name === baseName && normalizeString(cookie.value));
    if (exact) {
      return normalizeString(exact.value);
    }
    const chunks = cookies
      .filter((cookie) => String(cookie?.name || '').startsWith(`${baseName}.`) && normalizeString(cookie.value))
      .map((cookie) => {
        const suffix = String(cookie.name).slice(baseName.length + 1);
        const index = Math.max(0, Math.floor(Number(suffix) || 0));
        return { index, value: normalizeString(cookie.value) };
      })
      .sort((left, right) => left.index - right.index);
    return chunks.map((chunk) => chunk.value).join('');
  }

  function pickSessionTokenFromCookies(cookies = []) {
    for (const name of SESSION_COOKIE_NAMES) {
      const value = getCookieChunkValue(cookies, name);
      if (value) {
        return value;
      }
    }
    return '';
  }

  function buildCookieHeaderFromCookies(cookies = []) {
    const seenNames = new Set();
    return (Array.isArray(cookies) ? cookies : [])
      .map((cookie) => {
        const name = normalizeString(cookie?.name);
        const value = normalizeString(cookie?.value);
        if (!name || !value || seenNames.has(name)) {
          return '';
        }
        seenNames.add(name);
        return `${name}=${value}`;
      })
      .filter(Boolean)
      .join('; ');
  }

  async function readResponseBody(response) {
    if (!response) {
      return null;
    }
    if (typeof response.text === 'function') {
      const text = await response.text();
      if (!normalizeString(text)) {
        return null;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    if (typeof response.json === 'function') {
      return response.json().catch(() => null);
    }
    return null;
  }

  function getResponseContentType(response) {
    try {
      return normalizeString(response?.headers?.get?.('content-type')).toLowerCase();
    } catch {
      return '';
    }
  }

  function isHtmlResponsePayload(response, payload) {
    const contentType = getResponseContentType(response);
    if (contentType.includes('text/html')) {
      return true;
    }
    if (typeof payload !== 'string') {
      return false;
    }
    return /^\s*(?:<!doctype\s+html\b|<html[\s>]|<head[\s>]|<body[\s>])/i.test(payload);
  }

  function createEnablePasskeyExecutor(deps = {}) {
    const {
      addLog: rawAddLog = async () => {},
      appendAccountRunRecord = null,
      checkRegistrationUpiTrialEligibility = null,
      chrome: chromeApi = globalThis.chrome,
      completeNodeFromBackground = async () => {},
      fetchImpl = typeof fetch === 'function' ? fetch.bind(globalThis) : null,
      getState = async () => ({}),
      getTabId,
      isTabAlive,
      markCurrentRegistrationAccountUsed = null,
      now = () => Date.now(),
      registerTab,
      setState = async () => {},
      sleepWithStop = async (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      throwIfStopped = () => {},
      upsertUpiAccountCredentialBackup = null,
      waitForTabCompleteUntilStopped = async () => {},
    } = deps;

    function getErrorMessage(error) {
      return normalizeString(error?.message || error);
    }

    function resolveVisibleStep(state = {}) {
      const visibleStep = Math.floor(Number(state?.visibleStep) || 0);
      return visibleStep > 0 ? visibleStep : 7;
    }

    function addStepLog(step, message, level = 'info') {
      return rawAddLog(message, level, {
        step,
        stepKey: 'enable-passkey',
      });
    }

    function formatLogPresence(label, value = '') {
      const normalized = normalizeString(value);
      return `${label}=${normalized ? `已读取(${normalized.length})` : '未读取'}`;
    }

    function formatLogField(label, value = '') {
      const normalized = normalizeString(value);
      return normalized ? `${label}=${normalized}` : '';
    }

    function formatLogBooleanField(label, value) {
      if (value === true || value === false) {
        return `${label}=${value ? 'true' : 'false'}`;
      }
      return '';
    }

    function buildPasskeyEnableRequestLog(apiUrl, details = {}) {
      return [
        `Passkey：正在提交到 ${apiUrl}`,
        formatLogPresence('accessToken', details.accessToken),
        formatLogPresence('sessionToken', details.sessionToken),
        formatLogPresence('cookie', details.cookie),
        details.deviceId ? 'deviceId=已设置' : 'deviceId=自动生成',
      ].filter(Boolean).join('，');
    }

    function buildPasskeyEnableResponseLog(payload = {}) {
      const source = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
      const parts = [
        formatLogBooleanField('ok', typeof source.ok === 'boolean' ? source.ok : undefined),
        formatLogField('reason', source.reason),
        formatLogField('credentialId', source.credentialId || source.credential_id),
        formatLogField('factorId', source.factorId || source.factor_id),
        formatLogField('rpId', source.rpId || source.rp_id),
        source.privateJwk || source.private_jwk ? 'privateJwk=已返回' : '',
        normalizeString(source.publicKeyCose || source.public_key_cose) ? 'publicKeyCose=已返回' : '',
        formatLogBooleanField('persisted', source.persisted),
        formatLogField('email', source.email),
        formatLogField('account_id', source.account_id || source.accountId),
        formatLogField('plan_type', source.plan_type || source.planType),
      ].filter(Boolean);
      return `Passkey 接口响应：${parts.join('，')}`;
    }

    function isRecoverablePasskeyEnableError(error) {
      const message = getErrorMessage(error).toLowerCase();
      return /failed\s+to\s+fetch|fetch\s+failed|load\s+failed|request timeout|timed out|\btimeout\b|http\s*(?:429|500|502|503|504)|fetch-error|server-error|network|abort/i.test(message);
    }

    function resolveTargetAccountEmail(state = {}) {
      return normalizeEmail(
        state.email
        || state.step8VerificationTargetEmail
        || state.registrationEmailState?.current
        || (normalizeString(state.accountIdentifierType).toLowerCase() === 'email' ? state.accountIdentifier : '')
        || state.accountIdentifier
      );
    }

    function resolveSessionAccountEmail(session = {}) {
      return normalizeEmail(
        session.email
        || session.session?.user?.email
        || session.session?.email
        || session.session?.user_email
        || session.user?.email
        || session.user_email
      );
    }

    function resolveAccountEmail(state = {}, session = {}) {
      const targetEmail = resolveTargetAccountEmail(state);
      const sessionEmail = resolveSessionAccountEmail(session);
      if (targetEmail && sessionEmail && targetEmail !== sessionEmail) {
        throw new Error(`步骤 7：当前 ChatGPT 登录态邮箱 ${sessionEmail} 与本轮目标邮箱 ${targetEmail} 不一致，已停止，避免把 Passkey/Free 分组写到错误账号。`);
      }
      return sessionEmail || targetEmail;
    }

    function isManualEnablePasskeyCurrentSessionMode(state = {}) {
      return state?.manualEnablePasskeyUseCurrentSession === true
        || state?.manualEnableTotpUseCurrentSession === true;
    }

    function isPasswordTrustedForAccount(state = {}, accountEmail = '') {
      const normalizedAccountEmail = normalizeEmail(accountEmail);
      if (!normalizedAccountEmail) {
        return false;
      }
      const passwordAccountIdentifierType = normalizeString(state.passwordAccountIdentifierType).toLowerCase();
      const passwordAccountIdentifier = normalizeEmail(state.passwordAccountIdentifier);
      return (!passwordAccountIdentifierType || passwordAccountIdentifierType === 'email')
        && passwordAccountIdentifier === normalizedAccountEmail;
    }

    async function resolveExecutionAccountEmail(state = {}, session = {}, visibleStep = 7) {
      const targetEmail = resolveTargetAccountEmail(state);
      const sessionEmail = resolveSessionAccountEmail(session);
      const manualCurrentSessionMode = isManualEnablePasskeyCurrentSessionMode(state);

      if (!manualCurrentSessionMode) {
        return {
          accountEmail: resolveAccountEmail(state, session),
          runtimeState: state,
        };
      }

      if (!sessionEmail) {
        throw new Error(`步骤 ${visibleStep}：单独执行第 7 步未读取到 ChatGPT 登录邮箱，请先登录目标 ChatGPT 账号后再执行。`);
      }

      if (targetEmail && targetEmail !== sessionEmail) {
        await addStepLog(
          visibleStep,
          `单独执行第 7 步：当前已登录 ChatGPT 账号为 ${sessionEmail}，旧目标邮箱为 ${targetEmail}，本次按当前已登录账号继续开通 Passkey。`,
          'warn'
        );
      } else {
        await addStepLog(
          visibleStep,
          `单独执行第 7 步：本次按当前已登录 ChatGPT 账号 ${sessionEmail} 开通 Passkey。`,
          'info'
        );
      }

      const passwordTrusted = isPasswordTrustedForAccount(state, sessionEmail);
      const registrationEmailState = state.registrationEmailState && typeof state.registrationEmailState === 'object'
        ? {
            ...state.registrationEmailState,
            current: sessionEmail,
            source: 'manual_step7_passkey_current_session',
            updatedAt: new Date(Math.max(1, Math.floor(Number(now()) || Date.now()))).toISOString(),
          }
        : {
            current: sessionEmail,
            source: 'manual_step7_passkey_current_session',
            updatedAt: new Date(Math.max(1, Math.floor(Number(now()) || Date.now()))).toISOString(),
          };
      const runtimeState = {
        ...state,
        email: sessionEmail,
        accountIdentifierType: 'email',
        accountIdentifier: sessionEmail,
        step8VerificationTargetEmail: '',
        registrationEmailState,
      };
      if (!passwordTrusted) {
        runtimeState.password = '';
        runtimeState.customPassword = '';
        runtimeState.passwordAccountIdentifierType = null;
        runtimeState.passwordAccountIdentifier = '';
      }
      await setState({
        email: sessionEmail,
        accountIdentifierType: 'email',
        accountIdentifier: sessionEmail,
        step8VerificationTargetEmail: '',
        registrationEmailState,
      });
      return {
        accountEmail: sessionEmail,
        runtimeState,
      };
    }

    async function getMergedState(state = {}) {
      const latestState = typeof getState === 'function'
        ? await getState().catch(() => ({}))
        : {};
      return {
        ...(latestState || {}),
        ...(state || {}),
      };
    }

    async function recordStep7AccountCheckpoint({
      runtimeState = {},
      patch = {},
      email = '',
      visibleStep = 7,
      nodeId = 'enable-passkey',
      success = false,
    } = {}) {
      if (typeof appendAccountRunRecord !== 'function') {
        return null;
      }
      const accountEmail = normalizeString(email || runtimeState.email || runtimeState.registrationEmailState?.current).toLowerCase();
      if (!accountEmail) {
        await addStepLog(visibleStep, '已到达第 7 步，但当前邮箱为空，无法写入账号记录。', 'warn');
        return null;
      }

      const checkpointState = await getMergedState({
        ...patch,
        email: accountEmail,
        accountIdentifierType: runtimeState.accountIdentifierType || 'email',
        accountIdentifier: runtimeState.accountIdentifier || accountEmail,
        password: normalizeString(runtimeState.password || runtimeState.customPassword),
        customPassword: normalizeString(runtimeState.customPassword),
        passwordAccountIdentifierType: runtimeState.passwordAccountIdentifierType || null,
        passwordAccountIdentifier: runtimeState.passwordAccountIdentifier || '',
        currentNodeId: nodeId || 'enable-passkey',
      });
      const reason = success
        ? `步骤 ${visibleStep}：已到达第 7 步并开通 Passkey，账号已记录，可后续查询。`
        : `步骤 ${visibleStep}：已到达第 7 步，账号邮箱已记录，可后续查询。`;
      await appendAccountRunRecord('running', checkpointState, reason);
      await addStepLog(
        visibleStep,
        success
          ? `已更新第 7 步 Passkey 账号记录，后续可按邮箱查询：${accountEmail}`
          : `已记录到达第 7 步账号，后续可按邮箱查询：${accountEmail}`,
        'info'
      );
      return checkpointState;
    }

    async function readSupportedSessionTab(tabId) {
      const numericTabId = Number(tabId) || 0;
      if (!numericTabId || !chromeApi?.tabs?.get) {
        return null;
      }
      const tab = await chromeApi.tabs.get(numericTabId).catch(() => null);
      return tab?.id && isSupportedSessionUrl(tab.url) ? tab : null;
    }

    async function findFallbackSessionTab() {
      if (!chromeApi?.tabs?.query) {
        return null;
      }
      const activeTabs = await chromeApi.tabs.query({ active: true, currentWindow: true }).catch(() => []);
      const activeMatch = pickPreferredSessionTab(activeTabs);
      const allTabs = await chromeApi.tabs.query({}).catch(() => []);
      const globalMatch = pickPreferredSessionTab(allTabs);
      return pickPreferredSessionTab([activeMatch, globalMatch]);
    }

    async function resolveSessionTabId(state = {}) {
      const registeredTabId = typeof getTabId === 'function'
        ? await getTabId(CHATGPT_SOURCE)
        : null;
      if (registeredTabId && typeof isTabAlive === 'function' && await isTabAlive(CHATGPT_SOURCE)) {
        const registeredTab = await readSupportedSessionTab(registeredTabId);
        if (registeredTab?.id) {
          return registeredTab.id;
        }
      }

      const storedTabId = Number(state?.chatgptSessionReaderTabId) || 0;
      const storedTab = await readSupportedSessionTab(storedTabId);
      if (storedTab?.id) {
        if (typeof registerTab === 'function') {
          await registerTab(CHATGPT_SOURCE, storedTab.id);
        }
        return storedTab.id;
      }

      const fallbackTab = await findFallbackSessionTab();
      if (fallbackTab?.id) {
        if (typeof registerTab === 'function') {
          await registerTab(CHATGPT_SOURCE, fallbackTab.id);
        }
        return fallbackTab.id;
      }

      throw new Error('未找到可开通 Passkey 的 ChatGPT 标签页，请先打开已登录的 ChatGPT 页面。');
    }

    async function ensureChatGptSecurityTab(tabId, visibleStep) {
      let tab = await chromeApi?.tabs?.get?.(tabId).catch(() => null);
      if (!tab?.id) {
        throw new Error(`步骤 ${visibleStep}：ChatGPT 标签页不存在或已关闭，无法开通 Passkey。`);
      }
      if (!isChatGptUrl(tab.url)) {
        await addStepLog(visibleStep, '当前标签页不在 chatgpt.com，正在切换到 ChatGPT 安全设置页...', 'info');
        tab = await chromeApi.tabs.update(tab.id, { url: CHATGPT_SECURITY_URL, active: true }).catch(() => tab);
      } else if (chromeApi?.tabs?.update) {
        await chromeApi.tabs.update(tab.id, { active: true }).catch(() => {});
      }
      await waitForTabCompleteUntilStopped(tab.id, {
        timeoutMs: SESSION_TAB_COMPLETE_TIMEOUT_MS,
        retryDelayMs: 300,
      });
      await sleepWithStop(500);
      const latestTab = await chromeApi?.tabs?.get?.(tab.id).catch(() => tab);
      if (!isChatGptUrl(latestTab?.url || tab.url)) {
        throw new Error(`步骤 ${visibleStep}：未能打开 chatgpt.com，无法读取 ChatGPT 会话。`);
      }
      if (typeof registerTab === 'function') {
        await registerTab(CHATGPT_SOURCE, tab.id);
      }
      return latestTab || tab;
    }

    async function executeChatGptFetch(tabId, input = {}) {
      if (!chromeApi?.scripting?.executeScript) {
        throw new Error('当前浏览器不支持 chrome.scripting.executeScript，无法读取 ChatGPT 会话。');
      }
      const results = await chromeApi.scripting.executeScript({
        target: { tabId },
        func: async (request) => {
          const response = await fetch(request.url, {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: {
              accept: 'application/json, text/plain, */*',
            },
          });
          const text = await response.text().catch(() => '');
          let payload = null;
          if (text) {
            try {
              payload = JSON.parse(text);
            } catch {
              payload = { text: text.slice(0, 2000) };
            }
          }
          return {
            ok: response.ok,
            status: response.status,
            payload,
          };
        },
        args: [input],
      }).catch((error) => {
        throw new Error(`ChatGPT 会话读取脚本执行失败：${error?.message || error}`);
      });
      const result = Array.isArray(results) ? results[0]?.result : null;
      if (!result) {
        throw new Error('ChatGPT 会话读取脚本没有返回结果。');
      }
      return result;
    }

    async function readAuthSessionInTab(tabId) {
      const result = await executeChatGptFetch(tabId, {
        url: 'https://chatgpt.com/api/auth/session',
      });
      if (result.ok === false) {
        throw new Error(`/api/auth/session 请求失败（HTTP ${result.status || 0}）。`);
      }
      const payload = result.payload && typeof result.payload === 'object' ? result.payload : {};
      return {
        accessToken: normalizeString(payload.accessToken || payload.access_token),
        sessionToken: normalizeString(payload.sessionToken || payload.session_token),
        email: normalizeString(payload.user?.email || payload.email),
        session: payload,
      };
    }

    async function readSessionCookieDataFromCookies(tab = {}) {
      if (!chromeApi?.cookies?.getAll) {
        return { sessionToken: '', cookie: '' };
      }
      const urls = [
        isSupportedSessionUrl(tab?.url) ? tab.url : '',
        'https://chatgpt.com/',
        'https://chat.openai.com/',
      ].filter(Boolean);
      const stores = chromeApi.cookies.getAllCookieStores
        ? await chromeApi.cookies.getAllCookieStores().catch(() => [{ id: undefined }])
        : [{ id: undefined }];
      const cookies = [];
      const seen = new Set();
      for (const store of stores || [{ id: undefined }]) {
        const storeId = store?.id;
        for (const url of urls) {
          const batch = await chromeApi.cookies.getAll({
            url,
            ...(storeId ? { storeId } : {}),
          }).catch(() => []);
          for (const cookie of batch || []) {
            const key = [
              cookie.storeId || storeId || '',
              cookie.domain || '',
              cookie.path || '',
              cookie.name || '',
              cookie.partitionKey ? JSON.stringify(cookie.partitionKey) : '',
            ].join('|');
            if (seen.has(key)) {
              continue;
            }
            seen.add(key);
            cookies.push(cookie);
          }
        }
      }
      return {
        sessionToken: pickSessionTokenFromCookies(cookies),
        cookie: buildCookieHeaderFromCookies(cookies),
      };
    }

    async function postPasskeyEnable({ apiUrl, apiKey, token, sessionToken, cookie, deviceId }) {
      if (typeof fetchImpl !== 'function') {
        throw new Error('当前运行环境不支持 fetch，无法请求 Passkey 开通接口。');
      }
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller
        ? setTimeout(() => controller.abort(), PASSKEY_ENABLE_TIMEOUT_MS)
        : null;
      try {
        const headers = {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        };
        if (apiKey) {
          headers.Authorization = `Bearer ${apiKey}`;
          headers['X-External-Api-Key'] = apiKey;
        }
        const response = await fetchImpl(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            token,
            ...(sessionToken ? { sessionToken } : {}),
            ...(cookie ? { cookie } : {}),
            ...(deviceId ? { deviceId } : {}),
          }),
          ...(controller ? { signal: controller.signal } : {}),
        });
        const payload = await readResponseBody(response);
        if (isHtmlResponsePayload(response, payload)) {
          throw new Error('Passkey 开通接口返回了 HTML 页面，可能 API Base URL 填错，或后端没有 /api/v1/passkey/enable 路由。');
        }
        if (!response?.ok) {
          const payloadError = getPayloadError(payload);
          throw new Error(`Passkey 开通接口请求失败：POST ${apiUrl} 返回 HTTP ${response?.status || 0}${payloadError ? `：${payloadError}` : ''}`);
        }
        if (payload && typeof payload === 'object' && !Array.isArray(payload) && payload.ok === false) {
          throw new Error(`Passkey 开通接口返回失败：${getPayloadError(payload) || 'unknown'}`);
        }
        return payload && typeof payload === 'object' && !Array.isArray(payload)
          ? payload
          : {};
      } catch (error) {
        if (error?.name === 'AbortError') {
          throw new Error('Passkey 开通接口请求超时。');
        }
        throw error;
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    }

    async function executeEnablePasskey(state = {}) {
      throwIfStopped();
      let runtimeState = await getMergedState(state);
      const visibleStep = resolveVisibleStep(runtimeState);
      if (!runtimeState.gptPasswordSet) {
        await addStepLog(
          visibleStep,
          '未检测到第 6 步“设置 GPT 密码”完成记录，仍按独立第 7 步继续开通 Passkey；如后端要求最近认证，请重新执行第 6 步后再试。',
          'warn'
        );
      }
      await setState({
        passkeyEnabled: false,
        passkeyEnabledAt: '',
        passkeyCredentialId: '',
        passkeyFactorId: '',
        passkeyRpId: '',
        passkeyUserHandle: '',
        passkeyPrivateJwk: null,
        passkeyPublicKeyCose: '',
        passkeyApiPersisted: false,
      });

      await addStepLog(visibleStep, '正在通过 Nerver API 开通 ChatGPT Passkey，成功后检测 UPI 试用资格...', 'info');
      const tabId = await resolveSessionTabId(runtimeState);
      const tab = await ensureChatGptSecurityTab(tabId, visibleStep);
      const authSession = await readAuthSessionInTab(tab.id);
      const accessToken = normalizeString(authSession.accessToken);
      if (!accessToken) {
        throw new Error(`步骤 ${visibleStep}：未读取到 ChatGPT accessToken，请确认当前 ChatGPT 标签页仍处于已登录状态。`);
      }
      const cookieData = await readSessionCookieDataFromCookies(tab);
      const sessionToken = normalizeString(authSession.sessionToken || cookieData.sessionToken);
      const cookieHeader = normalizeString(cookieData.cookie);
      if (!sessionToken && !cookieHeader) {
        await addStepLog(visibleStep, '未读取到 ChatGPT sessionToken/cookie，将只使用 accessToken 调用 Passkey 开通接口。', 'warn');
      }

      const apiUrl = buildPasskeyEnableApiUrl(runtimeState);
      const apiKey = getPasskeyApiAuthToken(runtimeState);
      const deviceId = normalizeString(runtimeState.passkeyDeviceId || runtimeState.totpMfaDeviceId) || createDeviceId();
      const executionAccount = await resolveExecutionAccountEmail(runtimeState, authSession, visibleStep);
      runtimeState = executionAccount.runtimeState;
      const accountEmail = executionAccount.accountEmail;
      try {
        await recordStep7AccountCheckpoint({
          runtimeState,
          email: accountEmail,
          visibleStep,
          nodeId: state?.nodeId || 'enable-passkey',
        });
      } catch (recordError) {
        await addStepLog(
          visibleStep,
          `已到达第 7 步，但写入账号记录失败：${getErrorMessage(recordError)}`,
          'warn'
        );
      }

      await addStepLog(visibleStep, buildPasskeyEnableRequestLog(apiUrl, {
        accessToken,
        sessionToken,
        cookie: cookieHeader,
        deviceId,
      }), 'info');
      let payload = null;
      let lastEnableError = null;
      for (let attempt = 1; attempt <= PASSKEY_ENABLE_MAX_ATTEMPTS; attempt += 1) {
        try {
          if (attempt > 1) {
            await addStepLog(visibleStep, `Passkey：正在第 ${attempt}/${PASSKEY_ENABLE_MAX_ATTEMPTS} 次重试 enable 接口...`, 'warn');
          }
          payload = await postPasskeyEnable({
            apiUrl,
            apiKey,
            token: accessToken,
            sessionToken,
            cookie: cookieHeader,
            deviceId,
          });
          break;
        } catch (enableError) {
          lastEnableError = enableError;
          const message = getErrorMessage(enableError);
          const recoverable = isRecoverablePasskeyEnableError(enableError);
          await addStepLog(visibleStep, `Passkey enable 第 ${attempt}/${PASSKEY_ENABLE_MAX_ATTEMPTS} 次失败：${message}`, recoverable ? 'warn' : 'error');
          if (!recoverable || attempt >= PASSKEY_ENABLE_MAX_ATTEMPTS) {
            throw enableError;
          }
          const retryDelayMs = PASSKEY_ENABLE_RETRY_DELAYS_MS[Math.min(attempt - 1, PASSKEY_ENABLE_RETRY_DELAYS_MS.length - 1)] || 3000;
          await addStepLog(visibleStep, `Passkey：${Math.round(retryDelayMs / 1000)} 秒后重试 enable 接口。`, 'warn');
          await sleepWithStop(retryDelayMs);
        }
      }
      if (!payload) {
        throw lastEnableError || new Error('Passkey 开通接口未返回结果。');
      }

      const reason = normalizeString(payload.reason).toLowerCase();
      const credentialId = normalizeString(payload.credentialId || payload.credential_id);
      const factorId = normalizeString(payload.factorId || payload.factor_id);
      await addStepLog(visibleStep, buildPasskeyEnableResponseLog(payload), credentialId ? 'info' : 'warn');
      if (!credentialId && reason !== 'already-enabled' && reason !== 'ok') {
        throw new Error(`开通 Passkey 失败：接口未返回 credentialId${reason ? `（reason=${reason}）` : ''}。`);
      }

      const enabledAt = new Date(Math.max(1, Math.floor(Number(now()) || Date.now()))).toISOString();
      const patch = {
        passkeyEnabled: true,
        passkeyEnabledAt: enabledAt,
        passkeyCredentialId: credentialId,
        passkeyFactorId: factorId,
        passkeyRpId: normalizeString(payload.rpId || payload.rp_id),
        passkeyUserHandle: normalizeString(payload.userHandle || payload.user_handle),
        passkeyPrivateJwk: payload.privateJwk || payload.private_jwk || null,
        passkeyPublicKeyCose: normalizeString(payload.publicKeyCose || payload.public_key_cose),
        passkeyApiPersisted: payload.persisted !== false,
        twoFactorEnabled: true,
        no2faFreeRoute: false,
      };
      await setState(patch);
      if (typeof upsertUpiAccountCredentialBackup === 'function') {
        await upsertUpiAccountCredentialBackup({
          email: accountEmail,
          password: normalizeString(runtimeState.password || runtimeState.customPassword),
          ...patch,
          sourceStep: 'enable-passkey',
        });
      }
      try {
        await recordStep7AccountCheckpoint({
          runtimeState,
          patch,
          email: accountEmail,
          visibleStep,
          nodeId: state?.nodeId || 'enable-passkey',
          success: true,
        });
      } catch (recordError) {
        await addStepLog(
          visibleStep,
          `第 7 步账号已开通 Passkey，但写入账号记录失败：${getErrorMessage(recordError)}`,
          'warn'
        );
      }
      if (typeof markCurrentRegistrationAccountUsed === 'function') {
        try {
          await markCurrentRegistrationAccountUsed({
            ...runtimeState,
            ...patch,
            email: accountEmail || runtimeState.email,
            accessToken,
            upiRedeemAccessToken: accessToken,
            accessTokenUpdatedAt: enabledAt,
            accountIdentifierType: runtimeState.accountIdentifierType || 'email',
            accountIdentifier: runtimeState.accountIdentifier || accountEmail || runtimeState.email,
          }, {
            logPrefix: '第 7 步 Passkey 已完成',
            level: 'ok',
            preferProvidedState: true,
          });
        } catch (markError) {
          await addStepLog(
            visibleStep,
            `第 7 步 Passkey 已完成，但标记当前注册邮箱已用失败：${getErrorMessage(markError)}`,
            'warn'
          );
        }
      }
      if (typeof checkRegistrationUpiTrialEligibility === 'function') {
        await checkRegistrationUpiTrialEligibility({
          state: {
            ...runtimeState,
            email: accountEmail || runtimeState.email,
          },
          patch,
          session: authSession.session || authSession,
          accessToken,
          email: accountEmail,
          visibleStep,
        });
      }
      await addStepLog(visibleStep, `ChatGPT Passkey 已通过 Nerver API 开通：${credentialId || 'already-enabled'}`, 'success');
      if (state?.suppressNodeCompletion !== true) {
        await completeNodeFromBackground(state?.nodeId || 'enable-passkey', patch);
      }
      return patch;
    }

    return {
      executeEnablePasskey,
    };
  }

  return {
    createEnablePasskeyExecutor,
    normalizeNerverApiBaseUrl,
  };
});
