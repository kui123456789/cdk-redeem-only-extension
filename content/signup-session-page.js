// content/signup-session-page.js - ChatGPT session helpers for signup flows.
(function attachSignupSessionPage(root) {
  function createSignupSessionPage(context = {}) {
    const {
      documentRef = document,
      locationRef = location,
      fetchRef = typeof fetch === 'function' ? fetch.bind(root) : null,
      sessionApiUrl = 'https://chatgpt.com/api/auth/session',
      findSignupEntryTrigger = null,
      getActionText = null,
      isVisibleElement = null,
      isActionEnabled = null,
    } = context;

    async function readChatGptSession() {
      if (typeof fetchRef !== 'function') {
        throw new Error('当前环境不支持 fetch，无法读取 ChatGPT 会话。');
      }

      const sessionResponse = await fetchRef(sessionApiUrl, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (!sessionResponse.ok) {
        throw new Error(`读取 ChatGPT 会话失败（HTTP ${sessionResponse.status}）。`);
      }

      const session = await sessionResponse.json().catch(() => ({}));
      if (!session || typeof session !== 'object' || Array.isArray(session) || !Object.keys(session).length) {
        throw new Error('当前页面未返回可用 ChatGPT session，无法导出登录态。');
      }

      return session;
    }

    function extractAccessToken(session = {}) {
      return String(session?.accessToken || session?.access_token || '').trim();
    }

    async function readChatGptSessionExportData() {
      const session = await readChatGptSession();
      return {
        session,
        accessToken: extractAccessToken(session),
        email: String(session?.user?.email || '').trim(),
        expiresAt: session?.expires || '',
      };
    }

    function detectLoggedInHome(rawUrl = locationRef.href) {
      const url = String(rawUrl || '').trim();
      if (!url) {
        return false;
      }

      try {
        const parsed = new URL(url);
        const host = String(parsed.hostname || '').toLowerCase();
        if (!['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com'].includes(host)) {
          return false;
        }

        const path = String(parsed.pathname || '');
        if (/^\/(?:auth\/|create-account\/|email-verification|log-in)(?:[/?#]|$)/i.test(path)) {
          return false;
        }

        const signupTrigger = typeof findSignupEntryTrigger === 'function'
          ? findSignupEntryTrigger()
          : null;
        if (signupTrigger) {
          return false;
        }

        if (documentRef && typeof documentRef.querySelectorAll === 'function') {
          const loginActionPattern = /登录|log\s*in|sign\s*in/i;
          const candidates = documentRef.querySelectorAll(
            'a, button, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
          );

          for (const el of candidates) {
            const text = typeof getActionText === 'function'
              ? getActionText(el)
              : [
                el?.textContent,
                el?.value,
                el?.getAttribute?.('aria-label'),
                el?.getAttribute?.('title'),
              ]
                .filter(Boolean)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (!text || !loginActionPattern.test(text)) {
              continue;
            }

            const visible = typeof isVisibleElement === 'function'
              ? isVisibleElement(el)
              : true;
            if (!visible) {
              continue;
            }

            const enabled = typeof isActionEnabled === 'function'
              ? isActionEnabled(el)
              : (Boolean(el) && !el.disabled && el?.getAttribute?.('aria-disabled') !== 'true');
            if (enabled) {
              return false;
            }
          }
        }

        return true;
      } catch {
        return false;
      }
    }

    return {
      readChatGptSession,
      extractAccessToken,
      detectLoggedInHome,
      readChatGptSessionExportData,
    };
  }

  root.MultiPageSignupSessionPage = { createSignupSessionPage };
})(typeof self !== 'undefined' ? self : window);
