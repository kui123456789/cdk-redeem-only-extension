(function attachRouterPaymentSessionService(root, factory) {
  const api = factory(root);
  root.MultiPageRouterPaymentSessionService = api;
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
})(typeof self !== 'undefined' ? self : globalThis, function createRouterPaymentSessionServiceModule(_rootScope) {
  const CHATGPT_SESSION_SOURCE = 'chatgpt-session-reader';
  const LEGACY_WALLET_SOURCE = 'legacyWallet-flow';
  const LEGACY_PAY_SOURCE = 'legacyPay-flow';
  const CHATGPT_SESSION_INJECT_FILES = ['content/utils.js', 'content/operation-delay.js', 'content/chatgpt-session-reader.js'];
  const LEGACY_WALLET_GENERIC_ERROR_CHECK_URL = 'https://chatgpt.com/';
  const LEGACY_WALLET_GENERIC_ERROR_SESSION_SETTLE_WAIT_MS = 5000;

  function createRouterPaymentSessionService(deps = {}) {
    const {
      addLog = async () => {},
      ensureContentScriptReadyOnTabUntilStopped = null,
      getState = async () => ({}),
      getTabId = null,
      registerTab = null,
      sendTabMessageUntilStopped = null,
      setState = async () => {},
      sleepWithStop = async () => {},
      waitForTabCompleteUntilStopped = async () => {},
    } = deps;

    function normalizeString(value = '') {
      return String(value || '').trim();
    }

    function normalizePlusPaymentMethod(value = '') {
      const normalized = normalizeString(value).toLowerCase();
      if (normalized === 'legacyPay') {
        return 'legacyPay';
      }
      if (normalized === 'cardHelper-helper') {
        return 'cardHelper-helper';
      }
      if (normalized === 'upi' || normalized === 'pix') {
        return 'upi';
      }
      return 'legacyWallet';
    }

    function parseUrlSafely(rawUrl) {
      const normalized = normalizeString(rawUrl);
      if (!normalized) {
        return null;
      }
      try {
        return new URL(normalized);
      } catch {
        return null;
      }
    }

    function isChatgptSessionReaderPaymentUrl(url = '') {
      const parsed = parseUrlSafely(url);
      if (!parsed) {
        return false;
      }
      const hostname = normalizeString(parsed.hostname).toLowerCase();
      return hostname === 'pay.openai.com' || hostname === 'checkout.stripe.com';
    }

    function isLegacyWalletPaymentUrl(url = '') {
      const parsed = parseUrlSafely(url);
      if (!parsed) {
        return false;
      }
      const hostname = normalizeString(parsed.hostname).toLowerCase();
      return hostname === 'legacyWallet.com' || hostname.endsWith('.legacyWallet.com');
    }

    function isLegacyPayPaymentUrl(url = '') {
      const parsed = parseUrlSafely(url);
      if (!parsed) {
        return false;
      }
      const hostname = normalizeString(parsed.hostname).toLowerCase();
      return hostname === 'legacyPay.co.id'
        || hostname.endsWith('.legacyPay.co.id')
        || hostname === 'gojek.com'
        || hostname.endsWith('.gojek.com')
        || hostname === 'midtrans.com'
        || hostname.endsWith('.midtrans.com')
        || hostname === 'xendit.co'
        || hostname.endsWith('.xendit.co')
        || hostname === 'xendit.co.id'
        || hostname.endsWith('.xendit.co.id');
    }

    function isKnownPaymentFlowUrl(url = '') {
      const parsed = parseUrlSafely(url);
      if (!parsed) {
        return false;
      }
      const href = normalizeString(parsed.href);
      if (
        href.startsWith('https://pay.openai.com/c/pay/')
        || href.startsWith('https://checkout.stripe.com/c/pay/')
        || href.startsWith('https://www.legacyWallet.com/checkoutweb/signup')
        || href.startsWith('https://legacyWallet.com/checkoutweb/signup')
      ) {
        return true;
      }
      return false;
    }

    async function cleanupPaymentTabsAfterSuccessfulFlow() {
      const chromeApi = typeof chrome !== 'undefined' ? chrome : globalThis.chrome;
      const sources = [
        { source: CHATGPT_SESSION_SOURCE, shouldCloseUrl: isChatgptSessionReaderPaymentUrl },
        { source: LEGACY_WALLET_SOURCE, shouldCloseUrl: isLegacyWalletPaymentUrl },
        { source: LEGACY_PAY_SOURCE, shouldCloseUrl: isLegacyPayPaymentUrl },
      ];
      const closedIds = new Set();
      let closedCount = 0;

      if (chromeApi?.tabs?.get && chromeApi?.tabs?.remove && typeof getTabId === 'function') {
        for (const entry of sources) {
          try {
            const tabId = await getTabId(entry.source);
            if (!Number.isInteger(tabId) || tabId <= 0 || closedIds.has(tabId)) {
              continue;
            }
            const tab = await chromeApi.tabs.get(tabId).catch(() => null);
            const currentUrl = normalizeString(tab?.url);
            if (!entry.shouldCloseUrl(currentUrl)) {
              continue;
            }
            await chromeApi.tabs.remove(tabId).catch(() => {});
            closedIds.add(tabId);
            closedCount += 1;
          } catch (_) {
            // Best effort cleanup only.
          }
        }
      }

      if (chromeApi?.tabs?.query && chromeApi?.tabs?.remove) {
        try {
          const allTabs = await chromeApi.tabs.query({});
          const matchedIds = (Array.isArray(allTabs) ? allTabs : [])
            .filter((tab) => Number.isInteger(tab?.id))
            .filter((tab) => !closedIds.has(tab.id))
            .filter((tab) => isKnownPaymentFlowUrl(tab?.url || ''))
            .map((tab) => tab.id);
          if (matchedIds.length) {
            await chromeApi.tabs.remove(matchedIds).catch(() => {});
            for (const id of matchedIds) {
              closedIds.add(id);
            }
            closedCount += matchedIds.length;
          }
        } catch (_) {
          // Best effort cleanup only.
        }
      }

      const latestState = await getState();
      const nextTabRegistry = {
        ...(latestState?.tabRegistry || {}),
        [CHATGPT_SESSION_SOURCE]: null,
        [LEGACY_WALLET_SOURCE]: null,
        [LEGACY_PAY_SOURCE]: null,
      };
      const nextSourceLastUrls = {
        ...(latestState?.sourceLastUrls || {}),
      };
      delete nextSourceLastUrls[CHATGPT_SESSION_SOURCE];
      delete nextSourceLastUrls[LEGACY_WALLET_SOURCE];
      delete nextSourceLastUrls[LEGACY_PAY_SOURCE];

      await setState({
        chatgptSessionReaderTabId: null,
        chatgptSessionReaderUrl: null,
        tabRegistry: nextTabRegistry,
        sourceLastUrls: nextSourceLastUrls,
      });

      if (closedCount > 0) {
        await addLog(`流程完成：已关闭 ${closedCount} 个支付相关标签页。`, 'info');
      }
    }

    function firstNonEmpty(...values) {
      for (const value of values) {
        const normalized = normalizeString(value);
        if (normalized) {
          return normalized;
        }
      }
      return '';
    }

    function collectSessionFieldValues(root, targetKeys = []) {
      const normalizedTargets = new Set((Array.isArray(targetKeys) ? targetKeys : []).map((key) => normalizeString(key).toLowerCase()));
      if (!normalizedTargets.size || !root || typeof root !== 'object') {
        return [];
      }

      const results = [];
      const queue = [{ value: root, path: '$' }];
      const visited = new Set();
      while (queue.length && results.length < 32) {
        const current = queue.shift();
        const value = current?.value;
        if (!value || typeof value !== 'object') {
          continue;
        }
        if (visited.has(value)) {
          continue;
        }
        visited.add(value);

        const entries = Array.isArray(value)
          ? value.map((entry, index) => [String(index), entry])
          : Object.entries(value);
        for (const [key, entryValue] of entries) {
          const normalizedKey = normalizeString(key).toLowerCase();
          const path = `${current.path}.${key}`;
          if (normalizedTargets.has(normalizedKey)) {
            results.push({ key: normalizedKey, path, value: entryValue });
          }
          if (entryValue && typeof entryValue === 'object') {
            queue.push({ value: entryValue, path });
          }
        }
      }
      return results;
    }

    function normalizePlanType(value = '') {
      return normalizeString(value)
        .toLowerCase()
        .replace(/\s+/g, '_');
    }

    function isPaidPlanType(value = '') {
      const normalized = normalizePlanType(value);
      if (!normalized) {
        return false;
      }
      return !/(^|[_-])(free|guest|basic|default|none|null|unknown)([_-]|$)/i.test(normalized);
    }

    function inspectPlusActivationFromSession(session = null) {
      const planSignals = collectSessionFieldValues(session, [
        'planType',
        'plan_type',
        'chatgpt_plan_type',
      ]);
      const booleanSignals = collectSessionFieldValues(session, [
        'isPaid',
        'is_paid',
        'hasActiveSubscription',
        'has_active_subscription',
        'subscriptionActive',
        'subscription_active',
        'isSubscribed',
        'is_subscribed',
      ]);
      const planType = firstNonEmpty(
        ...planSignals.map((entry) => typeof entry?.value === 'string' ? entry.value : ''),
        session?.account?.planType,
        session?.account?.plan_type,
        session?.planType,
        session?.plan_type
      );
      const paidSignal = booleanSignals.some((entry) => entry?.value === true);
      return {
        active: paidSignal || isPaidPlanType(planType),
        paidSignal,
        planType,
        planSignalPath: normalizeString(planSignals[0]?.path || ''),
      };
    }

    async function openChatGptTabForLegacyWalletGenericErrorCheck() {
      const chromeApi = typeof chrome !== 'undefined' ? chrome : globalThis.chrome;
      if (!chromeApi?.tabs?.create) {
        throw new Error('当前环境不支持打开 ChatGPT 标签页。');
      }
      const tab = await chromeApi.tabs.create({ url: LEGACY_WALLET_GENERIC_ERROR_CHECK_URL, active: true });
      const tabId = Number(tab?.id) || 0;
      if (!tabId) {
        throw new Error('打开 ChatGPT 页面失败，无法检查 PLUS 状态。');
      }
      if (typeof registerTab === 'function') {
        await registerTab(CHATGPT_SESSION_SOURCE, tabId);
      }
      return tabId;
    }

    async function readChatGptSessionForLegacyWalletGenericErrorCheck(tabId) {
      if (typeof ensureContentScriptReadyOnTabUntilStopped !== 'function' || typeof sendTabMessageUntilStopped !== 'function') {
        throw new Error('缺少 ChatGPT 会话检测依赖，无法检查 PLUS 状态。');
      }
      await waitForTabCompleteUntilStopped(tabId, {
        timeoutMs: 60000,
        retryDelayMs: 300,
      });
      await sleepWithStop(1000);
      await ensureContentScriptReadyOnTabUntilStopped(CHATGPT_SESSION_SOURCE, tabId, {
        inject: CHATGPT_SESSION_INJECT_FILES,
        injectSource: CHATGPT_SESSION_SOURCE,
        timeoutMs: 45000,
        retryDelayMs: 700,
        logMessage: '步骤 6：正在等待 ChatGPT 页面完成加载，以检查 PLUS 状态...',
      });
      const sessionResult = await sendTabMessageUntilStopped(tabId, CHATGPT_SESSION_SOURCE, {
        type: 'READ_CHATGPT_SESSION',
        source: 'background',
        payload: {
          includeSession: true,
          includeAccessToken: true,
        },
      }, {
        timeoutMs: 30000,
        responseTimeoutMs: 15000,
        retryDelayMs: 300,
      });
      if (sessionResult?.error) {
        throw new Error(sessionResult.error);
      }
      return sessionResult || {};
    }

    async function refreshChatGptSessionAndInspectPlusActivation() {
      const chromeApi = typeof chrome !== 'undefined' ? chrome : globalThis.chrome;
      const tabId = await openChatGptTabForLegacyWalletGenericErrorCheck();
      await setState({ chatgptSessionReaderTabId: tabId });
      await waitForTabCompleteUntilStopped(tabId, {
        timeoutMs: 60000,
        retryDelayMs: 300,
      });
      await addLog('步骤 6：已打开 ChatGPT，等待 5 秒后刷新会话并检查 PLUS 状态。', 'info');
      await sleepWithStop(LEGACY_WALLET_GENERIC_ERROR_SESSION_SETTLE_WAIT_MS);
      if (chromeApi?.tabs?.reload) {
        await chromeApi.tabs.reload(tabId).catch(() => {});
      }
      const sessionResult = await readChatGptSessionForLegacyWalletGenericErrorCheck(tabId);
      const session = sessionResult?.session && typeof sessionResult.session === 'object' ? sessionResult.session : null;
      return {
        tabId,
        session,
        accessToken: normalizeString(sessionResult?.accessToken || session?.accessToken),
        ...inspectPlusActivationFromSession(session),
      };
    }

    return {
      cleanupPaymentTabsAfterSuccessfulFlow,
      collectSessionFieldValues,
      inspectPlusActivationFromSession,
      isChatgptSessionReaderPaymentUrl,
      isKnownPaymentFlowUrl,
      isLegacyPayPaymentUrl,
      isLegacyWalletPaymentUrl,
      isPaidPlanType,
      normalizePlanType,
      normalizePlusPaymentMethod,
      openChatGptTabForLegacyWalletGenericErrorCheck,
      parseUrlSafely,
      readChatGptSessionForLegacyWalletGenericErrorCheck,
      refreshChatGptSessionAndInspectPlusActivation,
    };
  }

  return {
    createRouterPaymentSessionService,
  };
});
