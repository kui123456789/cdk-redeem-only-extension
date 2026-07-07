(function attachMultiPageUpiRedeemSessionMaterial(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MultiPageUpiRedeemSessionMaterial = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMultiPageUpiRedeemSessionMaterialModule() {
  function createUpiRedeemSessionMaterial(context = {}) {
    const constants = context.constants || {};
    const { CHATGPT_SOURCE, CHATGPT_INJECT_FILES, SESSION_TAB_COMPLETE_TIMEOUT_MS, SESSION_CONTENT_READY_TIMEOUT_MS, SESSION_READ_MESSAGE_TIMEOUT_MS, SESSION_READ_RESPONSE_TIMEOUT_MS, UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX, CHATGPT_SESSION_API_URL } = constants;
    const chrome = context.chrome;
    const now = context.now;
    const sleepWithStop = context.sleepWithStop;
    const ensureContentScriptReadyOnTabUntilStopped = context.ensureContentScriptReadyOnTabUntilStopped;
    const waitForTabCompleteUntilStopped = context.waitForTabCompleteUntilStopped;
    const sendTabMessageUntilStopped = context.sendTabMessageUntilStopped;
    const registerTab = context.registerTab;
    const getTabId = context.getTabId;
    const isTabAlive = context.isTabAlive;

    const normalizeString = (...args) => context.normalizeString(...args);
    const getErrorMessage = (...args) => context.getErrorMessage(...args);
    const addStepLog = (...args) => context.addStepLog(...args);

        function isFetchNetworkError(error) {
          const message = normalizeString(error?.message || error);
          return /failed\s*to\s*fetch|networkerror|load failed|fetch failed|network request failed/i.test(message);
        }


        function maskAccessToken(token = '') {
          const text = normalizeString(token);
          if (!text) {
            return '';
          }
          if (text.length <= 12) {
            return `${text.slice(0, 3)}***`;
          }
          return `${text.slice(0, 6)}...${text.slice(-4)}`;
        }


        function decodeBase64UrlJson(value = '') {
          const text = normalizeString(value);
          if (!text) {
            return null;
          }
          try {
            const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
            const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
            const decoded = typeof atob === 'function'
              ? atob(padded)
              : '';
            if (!decoded) {
              return null;
            }
            const jsonText = decodeURIComponent(
              Array.from(decoded)
                .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
                .join('')
            );
            return JSON.parse(jsonText);
          } catch {
            return null;
          }
        }


        function getAccessTokenExpiryMs(token = '') {
          const parts = normalizeString(token).split('.');
          if (parts.length < 2) {
            return 0;
          }
          const payload = decodeBase64UrlJson(parts[1]);
          const expSeconds = Math.floor(Number(payload?.exp) || 0);
          return expSeconds > 0 ? expSeconds * 1000 : 0;
        }


        function isAccessTokenExpiredOrNearExpiry(token = '', skewMs = 60000) {
          const expiresAt = getAccessTokenExpiryMs(token);
          if (!expiresAt) {
            return false;
          }
          return expiresAt <= Math.max(1, Math.floor(Number(now()) || Date.now())) + Math.max(0, skewMs);
        }


        function getAccessTokenExpiryDescription(token = '') {
          const expiresAt = getAccessTokenExpiryMs(token);
          if (!expiresAt) {
            return '';
          }
          const expiresAtText = new Date(expiresAt).toISOString();
          const remainingSeconds = Math.floor((expiresAt - Math.max(1, Math.floor(Number(now()) || Date.now()))) / 1000);
          return `exp=${expiresAtText}，剩余 ${remainingSeconds} 秒`;
        }


        function splitPoolEntrySource(value = []) {
          return Array.isArray(value)
            ? value
            : String(value || '').split(/[\r\n,，;；]+/);
        }


        function parsePoolEntryEmail(value = '') {
          const rawValue = normalizeString(value);
          if (!rawValue) {
            return '';
          }
          const separatorIndex = rawValue.indexOf('----');
          const email = normalizeString(separatorIndex >= 0 ? rawValue.slice(0, separatorIndex) : rawValue).toLowerCase();
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
        }


        function normalizeVerificationUrlForFreeRecord(value = '') {
          const raw = normalizeString(value);
          if (!/^https?:\/\//i.test(raw)) {
            return '';
          }
          try {
            const parsed = new URL(raw);
            if (
              parsed.hostname.toLowerCase() === 'assurivo.com'
              && ['/console/feed.php', '/console/open.php'].includes(parsed.pathname)
            ) {
              parsed.pathname = '/console/open.php';
            }
            return parsed.toString();
          } catch {
            return '';
          }
        }


        function getEmailFromVerificationUrl(value = '') {
          const url = normalizeVerificationUrlForFreeRecord(value);
          if (!url) return '';
          try {
            const parsed = new URL(url);
            return parsePoolEntryEmail(parsed.searchParams.get('mail') || parsed.searchParams.get('email') || '');
          } catch {
            return '';
          }
        }


        function getVerificationUrlFromPoolEntry(rawEntry = {}) {
          const entry = rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry)
            ? rawEntry
            : { credential: rawEntry, email: rawEntry };
          const directUrl = normalizeVerificationUrlForFreeRecord(
            entry.verificationUrl
            || entry.emailVerificationUrl
            || entry.url
            || entry.fetchUrl
            || entry.codeUrl
            || entry.queryUrl
            || ''
          );
          if (directUrl) return directUrl;
          const parts = normalizeString(entry.credential || entry.email || '').split(/-{3,}/).map((part) => part.trim());
          return parts.map((part) => normalizeVerificationUrlForFreeRecord(part)).find(Boolean) || '';
        }


        function getEmailFromPoolEntry(rawEntry = {}) {
          const entry = rawEntry && typeof rawEntry === 'object' && !Array.isArray(rawEntry)
            ? rawEntry
            : { credential: rawEntry, email: rawEntry };
          const directEmail = parsePoolEntryEmail(entry.email || entry.mail || entry.address || '');
          if (directEmail) return directEmail;
          const verificationUrl = getVerificationUrlFromPoolEntry(entry);
          const urlEmail = getEmailFromVerificationUrl(verificationUrl);
          if (urlEmail) return urlEmail;
          return parsePoolEntryEmail(entry.credential || '');
        }


        function resolveVerificationUrlFromEmailPool(state = {}, email = '') {
          const normalizedEmail = parsePoolEntryEmail(email);
          if (!normalizedEmail) return '';
          const entries = [
            ...(Array.isArray(state.customEmailPoolEntries) ? state.customEmailPoolEntries : []),
            ...splitPoolEntrySource(state.customEmailPool),
          ];
          for (const entry of entries) {
            if (getEmailFromPoolEntry(entry) !== normalizedEmail) {
              continue;
            }
            const verificationUrl = getVerificationUrlFromPoolEntry(entry);
            if (verificationUrl) return verificationUrl;
          }
          return '';
        }


        function resolveCurrentRedeemEmail(state = {}, sessionState = {}) {
          const candidates = [
            sessionState.email,
            sessionState.session?.user?.email,
            sessionState.session?.user_email,
            sessionState.session?.email,
            state.email,
            state.currentEmail,
            state.accountEmail,
            state.accountIdentifierType === 'email' ? state.accountIdentifier : '',
            state.accountIdentifier,
            state.selectedCustomEmailPoolEmail,
          ];
          for (const candidate of candidates) {
            const email = parsePoolEntryEmail(candidate);
            if (email) {
              return email;
            }
          }
          return '';
        }


        function resolveSessionAccountEmail(sessionState = {}) {
          return parsePoolEntryEmail(
            sessionState.email
            || sessionState.session?.user?.email
            || sessionState.session?.email
            || sessionState.session?.user_email
            || sessionState.user?.email
            || sessionState.user_email
          );
        }


        function resolveTargetRedeemEmail(state = {}) {
          return parsePoolEntryEmail(
            state.email
            || state.currentEmail
            || state.accountEmail
            || (normalizeString(state.accountIdentifierType).toLowerCase() === 'email' ? state.accountIdentifier : '')
            || state.accountIdentifier
            || state.selectedCustomEmailPoolEmail
          );
        }


        function assertSessionMatchesTargetEmail({ targetEmail = '', sessionEmail = '', visibleStep = 7 } = {}) {
          const normalizedTargetEmail = parsePoolEntryEmail(targetEmail);
          const normalizedSessionEmail = parsePoolEntryEmail(sessionEmail);
          if (normalizedTargetEmail && normalizedSessionEmail && normalizedTargetEmail !== normalizedSessionEmail) {
            throw new Error(`步骤 ${visibleStep}：当前 ChatGPT 登录态邮箱 ${normalizedSessionEmail} 与本轮目标邮箱 ${normalizedTargetEmail} 不一致，已停止，避免把 AT/Free 分组写到错误账号。`);
          }
          return normalizedSessionEmail || normalizedTargetEmail;
        }


        function normalizeChatGptSessionPayload(value = {}) {
          if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return {};
          }
          const nestedSession = value.session;
          if (nestedSession && typeof nestedSession === 'object' && !Array.isArray(nestedSession)) {
            return nestedSession;
          }
          return value;
        }


        function getChatGptSessionAccessToken(value = {}) {
          const session = normalizeChatGptSessionPayload(value);
          return normalizeString(session.accessToken || session.access_token || value?.accessToken || value?.access_token);
        }


        function getChatGptSessionFieldCount(value = {}) {
          const session = normalizeChatGptSessionPayload(value);
          return session && typeof session === 'object' && !Array.isArray(session)
            ? Object.keys(session).length
            : 0;
        }


        function hasChatGptSessionPayload(value = {}) {
          return getChatGptSessionFieldCount(value) > 0;
        }


        function buildUpiRedeemSessionItem({ cdkey = '', session = {}, accessToken = '' } = {}) {
          const normalizedSession = normalizeChatGptSessionPayload(session);
          if (!Object.keys(normalizedSession).length) {
            throw new Error('缺少完整 ChatGPT session，无法提交 UPI 兑换请求。');
          }
          const normalizedAccessToken = getChatGptSessionAccessToken(normalizedSession) || normalizeString(accessToken);
          if (!normalizedAccessToken) {
            throw new Error(`${UPI_ACCESS_TOKEN_EXPIRED_ERROR_PREFIX}ChatGPT session 内缺少 access_token，无法提交 UPI 兑换请求。`);
          }
          return {
            cdkey,
            access_token: normalizedAccessToken,
            accessToken: normalizedAccessToken,
            session: normalizedSession,
          };
        }


        function normalizeTotpSecret(value = '') {
          return normalizeString(value).replace(/\s+/g, '').toUpperCase();
        }


        function buildCurrentUpiCredentialForMembership(state = {}, email = '') {
          const no2faFreeRoute = state.no2faFreeRoute === true;
          const resolvedEmail = parsePoolEntryEmail(email) || resolveCurrentRedeemEmail(state, {});
          return {
            email: resolvedEmail,
            password: no2faFreeRoute ? '' : normalizeString(
              state.password
              || state.gptPassword
              || state.chatGptPassword
              || state.openAiPassword
              || state.accountPassword
              || state.customPassword
              || ''
            ),
            totpMfaSecret: no2faFreeRoute ? '' : normalizeTotpSecret(
              state.totpMfaSecret
              || state.totpSecret
              || state.twoFactorSecret
              || state.twoFaSecret
              || ''
            ),
            verificationUrl: normalizeString(
              state.verificationUrl
              || state.emailVerificationUrl
              || state.currentVerificationUrl
              || state.currentEmailVerificationUrl
              || ''
            ) || resolveVerificationUrlFromEmailPool(state, resolvedEmail),
            recordedAt: Math.max(0, Math.floor(Number(state.recordedAt || state.no2faFreeRecordedAt) || 0)),
            twoFactorEnabled: no2faFreeRoute ? false : (state.twoFactorEnabled === true || Boolean(state.totpMfaSecret || state.totpSecret)),
            no2faFreeRoute,
          };
        }


        function isSupportedChatGptSessionUrl(url = '') {
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


        function getSessionTabHostPriority(url = '') {
          try {
            const hostname = normalizeString(new URL(String(url || '')).hostname).toLowerCase();
            if (/(^|\.)chatgpt\.com$/.test(hostname)) {
              return 0;
            }
            if (hostname === 'chat.openai.com') {
              return 1;
            }
            if (/(^|\.)openai\.com$/.test(hostname)) {
              return 2;
            }
          } catch {
            return Number.POSITIVE_INFINITY;
          }
          return Number.POSITIVE_INFINITY;
        }


        function getSessionTabActivityPriority(tab = {}) {
          if (tab?.active && tab?.currentWindow) {
            return 0;
          }
          if (tab?.active) {
            return 1;
          }
          return 2;
        }


        function pickPreferredSessionTab(tabs = []) {
          const candidates = (Array.isArray(tabs) ? tabs : [])
            .filter((tab) => Number.isInteger(tab?.id) && isSupportedChatGptSessionUrl(tab.url));
          if (!candidates.length) {
            return null;
          }
          return candidates.reduce((best, candidate) => {
            if (!best) {
              return candidate;
            }
            const candidateHostPriority = getSessionTabHostPriority(candidate.url);
            const bestHostPriority = getSessionTabHostPriority(best.url);
            if (candidateHostPriority !== bestHostPriority) {
              return candidateHostPriority < bestHostPriority ? candidate : best;
            }
            const candidateActivityPriority = getSessionTabActivityPriority(candidate);
            const bestActivityPriority = getSessionTabActivityPriority(best);
            if (candidateActivityPriority !== bestActivityPriority) {
              return candidateActivityPriority < bestActivityPriority ? candidate : best;
            }
            const candidateLastAccessed = Number(candidate?.lastAccessed) || 0;
            const bestLastAccessed = Number(best?.lastAccessed) || 0;
            if (candidateLastAccessed !== bestLastAccessed) {
              return candidateLastAccessed > bestLastAccessed ? candidate : best;
            }
            return Number(candidate.id) < Number(best.id) ? candidate : best;
          }, null);
        }


        async function readSupportedSessionTab(tabId) {
          const numericTabId = Number(tabId) || 0;
          if (!numericTabId || !chrome?.tabs?.get) {
            return null;
          }
          const tab = await chrome.tabs.get(numericTabId).catch(() => null);
          return tab?.id && isSupportedChatGptSessionUrl(tab.url) ? tab : null;
        }


        async function findFallbackSessionTab() {
          if (!chrome?.tabs?.query) {
            return null;
          }
          const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true }).catch(() => []);
          const activeMatch = pickPreferredSessionTab(activeTabs);
          if (activeMatch?.id) {
            return activeMatch;
          }
          const allTabs = await chrome.tabs.query({}).catch(() => []);
          return pickPreferredSessionTab(allTabs);
        }


        async function resolveSessionTabId(state = {}) {
          const activeTab = await findFallbackSessionTab();
          if (activeTab?.id && getSessionTabActivityPriority(activeTab) === 0) {
            if (typeof registerTab === 'function') {
              await registerTab(CHATGPT_SOURCE, activeTab.id);
            }
            return activeTab.id;
          }

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

          const fallbackTab = activeTab || await findFallbackSessionTab();
          if (fallbackTab?.id) {
            if (typeof registerTab === 'function') {
              await registerTab(CHATGPT_SOURCE, fallbackTab.id);
            }
            return fallbackTab.id;
          }

          throw new Error('未找到可读取 ChatGPT session 的标签页，请先打开已登录的 ChatGPT / OpenAI 页面。');
        }


        async function getResolvedSessionTab(tabId, visibleStep) {
          const tab = await chrome?.tabs?.get?.(tabId).catch(() => null);
          if (!tab?.id) {
            throw new Error(`步骤 ${visibleStep}：ChatGPT session 标签页不存在或已关闭，无法读取当前账号状态。`);
          }
          if (!isSupportedChatGptSessionUrl(tab.url)) {
            throw new Error(`步骤 ${visibleStep}：当前标签页不在 ChatGPT / OpenAI 页面，无法读取 ChatGPT session。`);
          }
          return tab;
        }


        async function readSessionWithContentMessage(tabId) {
          if (typeof sendTabMessageUntilStopped !== 'function') {
            return null;
          }
          const sessionResult = await sendTabMessageUntilStopped(tabId, CHATGPT_SOURCE, {
            type: 'READ_CHATGPT_SESSION',
            source: 'background',
            payload: {
              includeSession: true,
              includeAccessToken: true,
              forceRefresh: true,
              sessionApiUrl: CHATGPT_SESSION_API_URL,
            },
          }, {
            timeoutMs: SESSION_READ_MESSAGE_TIMEOUT_MS,
            responseTimeoutMs: SESSION_READ_RESPONSE_TIMEOUT_MS,
            retryDelayMs: 300,
          });
          if (sessionResult?.error) {
            throw new Error(sessionResult.error);
          }
          return sessionResult || null;
        }


        async function readSessionWithScripting(tabId) {
          if (!chrome?.scripting?.executeScript) {
            return null;
          }
          const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: async (sessionApiUrl) => {
              const response = await fetch(sessionApiUrl, {
                credentials: 'include',
                cache: 'no-store',
                headers: {
                  'Cache-Control': 'no-cache',
                  Pragma: 'no-cache',
                },
              });
              const session = await response.json().catch(() => null);
              return {
                ok: response.ok,
                status: response.status,
                session,
                accessToken: session?.accessToken || session?.access_token || '',
              };
            },
            args: [CHATGPT_SESSION_API_URL],
          }).catch((error) => {
            throw new Error(`读取 ${CHATGPT_SESSION_API_URL} 失败：${error?.message || error}`);
          });
          const firstResult = Array.isArray(results) ? results[0]?.result : null;
          if (!firstResult) {
            return null;
          }
          if (firstResult.ok === false) {
            throw new Error(`${CHATGPT_SESSION_API_URL} 请求失败（HTTP ${firstResult.status || 0}）。`);
          }
          return firstResult;
        }


        function extractSessionState(sessionResult) {
          const session = sessionResult?.session && typeof sessionResult.session === 'object' && !Array.isArray(sessionResult.session)
            ? sessionResult.session
            : null;
          const accessToken = normalizeString(
            sessionResult?.accessToken
            || sessionResult?.access_token
            || session?.accessToken
            || session?.access_token
          );
          const email = parsePoolEntryEmail(
            sessionResult?.email
            || sessionResult?.user?.email
            || sessionResult?.user_email
            || session?.user?.email
            || session?.user_email
            || session?.email
          );
          return {
            session,
            accessToken,
            email,
          };
        }


        async function readCurrentChatGptSession(tabId, visibleStep) {
          await waitForTabCompleteUntilStopped(tabId, {
            timeoutMs: SESSION_TAB_COMPLETE_TIMEOUT_MS,
            retryDelayMs: 300,
          });
          await sleepWithStop(500);
          let contentError = null;
          try {
            await ensureContentScriptReadyOnTabUntilStopped(CHATGPT_SOURCE, tabId, {
              inject: CHATGPT_INJECT_FILES,
              injectSource: CHATGPT_SOURCE,
              timeoutMs: SESSION_CONTENT_READY_TIMEOUT_MS,
              retryDelayMs: 700,
              logMessage: `步骤 ${visibleStep}：正在等待 ChatGPT 会话页完成加载，再继续读取 UPI 兑换 ChatGPT session...`,
            });
            const contentState = extractSessionState(await readSessionWithContentMessage(tabId));
            if (hasChatGptSessionPayload(contentState)) {
              if (isAccessTokenExpiredOrNearExpiry(contentState.accessToken)) {
                await addStepLog(
                  visibleStep,
                  `内容脚本返回的 session 内 token 已过期或即将过期（${getAccessTokenExpiryDescription(contentState.accessToken) || '无法读取过期时间'}），仍会按完整 session 提交给 UPI 后端判断。`,
                  'warn'
                );
              }
              return contentState;
            } else {
              contentError = new Error('内容脚本没有返回 ChatGPT session。');
            }
          } catch (error) {
            contentError = error;
            await addStepLog(visibleStep, `内容脚本读取 UPI ChatGPT session 失败，改用 ${CHATGPT_SESSION_API_URL} 读取：${getErrorMessage(error) || '未知错误'}`, 'warn');
          }

          let scriptingError = null;
          try {
            const scriptingState = extractSessionState(await readSessionWithScripting(tabId));
            if (hasChatGptSessionPayload(scriptingState)) {
              if (isAccessTokenExpiredOrNearExpiry(scriptingState.accessToken)) {
                await addStepLog(
                  visibleStep,
                  `${CHATGPT_SESSION_API_URL} 返回的 session 内 token 已过期或即将过期（${getAccessTokenExpiryDescription(scriptingState.accessToken) || '无法读取过期时间'}），仍会按完整 session 提交给 UPI 后端判断。`,
                  'warn'
                );
              }
              return scriptingState;
            }
          } catch (error) {
            scriptingError = error;
          }

          if (contentError || scriptingError) {
            const parts = [];
            if (contentError) {
              parts.push(`内容脚本：${getErrorMessage(contentError) || '未知错误'}`);
            }
            if (scriptingError) {
              parts.push(`${CHATGPT_SESSION_API_URL}：${getErrorMessage(scriptingError) || '未知错误'}`);
            }
            throw new Error(`步骤 ${visibleStep}：未读取到有效 ChatGPT session，请确认当前 ChatGPT / OpenAI 标签页仍处于已登录状态。${parts.length ? `（${parts.join('；')}）` : ''}`);
          }

          throw new Error(`步骤 ${visibleStep}：未读取到有效 ChatGPT session，请确认当前 ChatGPT / OpenAI 标签页仍处于已登录状态。`);
        }


        async function refreshCurrentChatGptSessionAndReadToken(tabId, visibleStep, reason = '') {
          await addStepLog(
            visibleStep,
            `UPI 后端判定 ChatGPT session 失效，正在刷新当前 ChatGPT 页面并重新读取完整 session${reason ? `：${reason}` : '。'}`,
            'warn'
          );
          if (chrome?.tabs?.reload) {
            await chrome.tabs.reload(tabId, { bypassCache: true }).catch(() => {});
          }
          await waitForTabCompleteUntilStopped(tabId, {
            timeoutMs: SESSION_TAB_COMPLETE_TIMEOUT_MS,
            retryDelayMs: 300,
          });
          await sleepWithStop(1500);
          const freshSessionState = await readCurrentChatGptSession(tabId, visibleStep);
          const freshEmailForLog = resolveCurrentRedeemEmail({}, freshSessionState) || 'unknown';
          await addStepLog(
            visibleStep,
            `已重新读取 UPI 兑换 ChatGPT session：${freshEmailForLog} -> session字段 ${getChatGptSessionFieldCount(freshSessionState)}。`,
            'ok'
          );
          return freshSessionState;
        }


    return {
      isFetchNetworkError,
      maskAccessToken,
      decodeBase64UrlJson,
      getAccessTokenExpiryMs,
      isAccessTokenExpiredOrNearExpiry,
      getAccessTokenExpiryDescription,
      splitPoolEntrySource,
      parsePoolEntryEmail,
      normalizeVerificationUrlForFreeRecord,
      getEmailFromVerificationUrl,
      getVerificationUrlFromPoolEntry,
      getEmailFromPoolEntry,
      resolveVerificationUrlFromEmailPool,
      resolveCurrentRedeemEmail,
      resolveSessionAccountEmail,
      resolveTargetRedeemEmail,
      assertSessionMatchesTargetEmail,
      normalizeChatGptSessionPayload,
      getChatGptSessionAccessToken,
      getChatGptSessionFieldCount,
      hasChatGptSessionPayload,
      buildUpiRedeemSessionItem,
      normalizeTotpSecret,
      buildCurrentUpiCredentialForMembership,
      isSupportedChatGptSessionUrl,
      getSessionTabHostPriority,
      getSessionTabActivityPriority,
      pickPreferredSessionTab,
      readSupportedSessionTab,
      findFallbackSessionTab,
      resolveSessionTabId,
      getResolvedSessionTab,
      readSessionWithContentMessage,
      readSessionWithScripting,
      extractSessionState,
      readCurrentChatGptSession,
      refreshCurrentChatGptSessionAndReadToken,
    };
  }

  return {
    createUpiRedeemSessionMaterial,
  };
});
