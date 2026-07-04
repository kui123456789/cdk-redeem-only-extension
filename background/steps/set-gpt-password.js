(function attachBackgroundSetGptPassword(root, factory) {
  root.MultiPageBackgroundSetGptPassword = factory();
})(typeof self !== 'undefined' ? self : globalThis, function createBackgroundSetGptPasswordModule() {
  const AUTH_SOURCE = 'signup-page';
  const SET_GPT_PASSWORD_ENTRY_URL = 'https://chatgpt.com/#settings/Security';
  const SET_GPT_PASSWORD_NEW_PASSWORD_URL = 'https://auth.openai.com/reset-password/new-password';
  const MAIL_2925_FILTER_LOOKBACK_MS = 10 * 60 * 1000;
  const DEFAULT_CODE_SUBMIT_ATTEMPTS = 5;
  const DEFAULT_VERIFICATION_WAIT_SECONDS = 10;
  const MAX_VERIFICATION_WAIT_SECONDS = 300;
  const PASSWORD_SUBMIT_RESPONSE_TIMEOUT_MS = 15000;
  const PASSWORD_SUBMIT_STATE_TIMEOUT_MS = 12000;
  const PASSWORD_SUBMIT_POLL_TIMEOUT_MS = 10000;
  const PASSWORD_SUBMIT_POLL_INTERVAL_MS = 500;
  const PASSWORD_SUBMIT_POLL_STATE_TIMEOUT_MS = 1500;
  const PASSWORD_SUBMIT_CONFIRM_TIMEOUT_MS = 60000;
  const PASSWORD_SUBMIT_CONFIRM_POLL_INTERVAL_MS = 1000;
  const TRANSPORT_LOSS_CONFIRM_TIMEOUT_MS = 5000;
  const TRANSPORT_LOSS_STABLE_MS = 500;
  const SET_PASSWORD_RESET_NAVIGATION_TIMEOUT_MS = 45000;
  const SET_PASSWORD_RESET_PREPARE_WAIT_MS = 8000;
  const SET_PASSWORD_RESET_PREPARE_RETRY_DELAY_MS = 1000;
  const PASSWORD_SETUP_CODE_RESEND_LIMIT = 2;

  function normalizeString(value = '') {
    return String(value || '').trim();
  }

  function normalizeEmail(value = '') {
    return normalizeString(value).toLowerCase();
  }

  function isRetryableContentScriptTransportError(error) {
    const message = normalizeString(typeof error === 'string' ? error : error?.message || '');
    return /back\/forward cache|message channel is closed|Receiving end does not exist|port closed before a response was received|A listener indicated an asynchronous response|内容脚本\s+\d+(?:\.\d+)?\s*秒内未响应|did not respond in \d+s/i.test(message);
  }

  function isPasswordSubmitStateProbeError(error) {
    const message = normalizeString(typeof error === 'string' ? error : error?.message || '');
    return isRetryableContentScriptTransportError(error)
      || /GPT\s*密码提交后仍停留在(?:设置密码页|新密码页)|仍停留在(?:设置密码页|新密码页)/i.test(message);
  }

  function isSetGptPasswordReuseErrorText(value = '') {
    return /password.*(?:must\s+not\s+be\s+)?re(?:use|used)|re(?:use|used).*password|密码.*(?:重复|用过|不能.*相同)|(?:重复|用过|不能.*相同).*密码|パスワード.*(?:再利用|使用済み|同じパスワード)|(?:再利用|使用済み|同じパスワード).*パスワード|पासवर्ड.*(?:(?:पहले|दोबारा)\s+(?:इस्तेमाल|उपयोग)|पुराना|समान)|(?:(?:पहले|दोबारा)\s+(?:इस्तेमाल|उपयोग)|पुराना|समान).*पासवर्ड/i.test(String(value || ''));
  }

  function isRetryablePasswordSetupCodeFetchError(error) {
    const message = normalizeString(typeof error === 'string' ? error : error?.message || '');
    return /HTTP\s*(?:408|429|5\d\d)\b|Gateway Time-out|gateway timeout|暂未返回有效验证码|自定义邮箱暂未返回有效验证码|取码接口.*(?:超时|timeout)/i.test(message);
  }

  function isSetGptPasswordNewPasswordUrl(url = '') {
    try {
      const parsed = new URL(String(url || ''));
      return /\/reset-password\/new-password(?:[/?#]|$)/i.test(parsed.pathname || '');
    } catch {
      return /\/reset-password\/new-password(?:[/?#]|$)/i.test(String(url || ''));
    }
  }

  function isLikelyChatGptLoggedInAfterPasswordUrl(url = '') {
    try {
      const parsed = new URL(String(url || ''));
      const host = String(parsed.hostname || '').toLowerCase();
      if (!['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com'].includes(host)) {
        return false;
      }
      const path = String(parsed.pathname || '');
      return !/^\/(?:auth\/|reset-password\/|create-account\/|email-verification|log-in|login)(?:[/?#]|$)/i.test(path);
    } catch {
      return /^https?:\/\/(?:www\.)?(?:chatgpt\.com|chat\.openai\.com)(?:[/?#]|$)/i.test(String(url || ''));
    }
  }

  function createSetGptPasswordExecutor(deps = {}) {
    const {
      addLog: rawAddLog = async () => {},
      chrome,
      completeNodeFromBackground = async () => {},
      ensureContentScriptReadyOnTab = async () => {},
      ensureMail2925MailboxSession = null,
      fetchVerificationCodeOnly = null,
      generatePassword = null,
      getMailConfig = null,
      getState = async () => ({}),
      getTabId = null,
      getVerificationCodeStateKey = null,
      HOTMAIL_PROVIDER = 'hotmail-api',
      ICLOUD_API_PROVIDER = 'icloud-api',
      isTabAlive = null,
      LUCKMAIL_PROVIDER = 'luckmail-api',
      CLOUDFLARE_TEMP_EMAIL_PROVIDER = 'cloudflare-temp-email',
      CLOUD_MAIL_PROVIDER = 'cloudmail',
      FREEMAIL_PROVIDER = 'freemail',
      MOEMAIL_PROVIDER = 'moemail',
      YYDSMAIL_PROVIDER = 'yydsmail',
      OUTLOOK_EMAIL_PLUS_PROVIDER = 'outlook-email-plus',
      reuseOrCreateTab = null,
      sendToContentScriptResilient = null,
      setPasswordState = null,
      setState = async () => {},
      SIGNUP_PAGE_INJECT_FILES = [],
      sleepWithStop = async (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
      STANDARD_MAIL_VERIFICATION_RESEND_INTERVAL_MS = 25000,
      throwIfStopped = () => {},
      upsertUpiAccountCredentialBackup = null,
      waitForTabStableComplete = null,
    } = deps;

    function getVisibleStep(state = {}) {
      const visibleStep = Math.floor(Number(state?.visibleStep) || 0);
      return visibleStep > 0 ? visibleStep : 6;
    }

    function addStepLog(step, message, level = 'info') {
      return rawAddLog(message, level, {
        step,
        stepKey: 'set-gpt-password',
      });
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

    function resolveAccountEmail(state = {}) {
      return normalizeEmail(
        state.email
        || state.step8VerificationTargetEmail
        || state.boundEmail
        || state.registrationEmailState?.current
        || state.accountIdentifier
      );
    }

    function resolveSessionEmail(sessionResult = {}) {
      return normalizeEmail(
        sessionResult.email
        || sessionResult.session?.user?.email
        || sessionResult.user?.email
      );
    }

    function resolvePasswordAccountIdentity(state = {}) {
      const email = resolveAccountEmail(state);
      return {
        accountIdentifierType: 'email',
        accountIdentifier: email,
        email,
      };
    }

    function normalizePasswordAccountIdentifierValue(value = '') {
      const normalizedValue = normalizeString(value);
      return normalizedValue.toLowerCase();
    }

    function isStatePasswordForIdentity(state = {}, identity = {}) {
      const password = normalizeString(state?.password);
      if (!password) return false;
      const accountIdentifier = normalizePasswordAccountIdentifierValue(identity.accountIdentifier);
      if (!accountIdentifier) return false;
      const stateIdentifier = normalizePasswordAccountIdentifierValue(state?.passwordAccountIdentifier);
      const stateType = 'email';
      const identityType = 'email';
      return Boolean(stateIdentifier && stateIdentifier === accountIdentifier && stateType === identityType);
    }

    async function persistGptPassword(password, accountIdentity = {}) {
      if (typeof setPasswordState === 'function') {
        await setPasswordState(password, accountIdentity);
      } else {
        await setState({
          password,
          passwordAccountIdentifierType: accountIdentity.accountIdentifier ? accountIdentity.accountIdentifierType : null,
          passwordAccountIdentifier: accountIdentity.accountIdentifier || '',
        });
      }
    }

    function isSetGptPasswordPrepareNavigationPendingError(error) {
      const message = normalizeString(typeof error === 'string' ? error : error?.message || '');
      return isRetryableContentScriptTransportError(error)
        || /未进入\s*OpenAI\s*设置密码邮箱验证页或新密码页|当前状态\s+unknown|设置密码页面正在切换|页面正在切换/i.test(message);
    }

    async function ensureGptPassword(state = {}, visibleStep = 6) {
      const accountIdentity = resolvePasswordAccountIdentity(state);
      const customPassword = normalizeString(state.customPassword || '');
      if (customPassword) {
        if (normalizeString(state.password) !== customPassword || !isStatePasswordForIdentity(state, accountIdentity)) {
          await persistGptPassword(customPassword, accountIdentity);
        }
        return customPassword;
      }
      const existingPassword = isStatePasswordForIdentity(state, accountIdentity)
        ? normalizeString(state.password)
        : '';
      if (existingPassword) {
        return existingPassword;
      }
      if (typeof generatePassword !== 'function') {
        throw new Error(`步骤 ${visibleStep}：缺少 GPT 密码，且当前环境无法自动生成密码。`);
      }
      const generatedPassword = normalizeString(generatePassword());
      if (!generatedPassword) {
        throw new Error(`步骤 ${visibleStep}：自动生成 GPT 密码失败。`);
      }
      await persistGptPassword(generatedPassword, accountIdentity);
      await addStepLog(visibleStep, '当前账号缺少 GPT 密码，已自动生成并保存到扩展本地状态。', 'info');
      return generatedPassword;
    }

    async function generateReplacementGptPassword(previousPasswords = [], visibleStep = 6, state = {}) {
      if (typeof generatePassword !== 'function') {
        throw new Error(`步骤 ${visibleStep}：OpenAI 拒绝重复密码，但当前环境无法自动生成新 GPT 密码。`);
      }
      const blocked = new Set(
        previousPasswords
          .map((item) => normalizeString(item))
          .filter(Boolean)
      );
      for (let attempt = 1; attempt <= 8; attempt += 1) {
        const candidate = normalizeString(generatePassword());
        if (!candidate || blocked.has(candidate)) {
          continue;
        }
        await persistGptPassword(candidate, resolvePasswordAccountIdentity(state));
        await addStepLog(visibleStep, 'OpenAI 提示密码已用过，已自动生成并保存新的 GPT 登录密码。', 'warn');
        return candidate;
      }
      throw new Error(`步骤 ${visibleStep}：OpenAI 拒绝重复密码，且连续生成的新密码仍不可用。`);
    }

    function getExpectedMail2925MailboxEmail(state = {}) {
      if (Boolean(state?.mail2925UseAccountPool)) {
        const currentAccountId = normalizeString(state?.currentMail2925AccountId);
        const accounts = Array.isArray(state?.mail2925Accounts) ? state.mail2925Accounts : [];
        const currentAccount = accounts.find((account) => normalizeString(account?.id) === currentAccountId) || null;
        const accountEmail = normalizeEmail(currentAccount?.email);
        if (accountEmail) {
          return accountEmail;
        }
      }
      return normalizeEmail(state?.mail2925BaseEmail);
    }

    function isApiMailProvider(mail = {}) {
      return [
        HOTMAIL_PROVIDER,
        ICLOUD_API_PROVIDER,
        LUCKMAIL_PROVIDER,
        CLOUDFLARE_TEMP_EMAIL_PROVIDER,
        CLOUD_MAIL_PROVIDER,
        FREEMAIL_PROVIDER,
        MOEMAIL_PROVIDER,
        YYDSMAIL_PROVIDER,
        OUTLOOK_EMAIL_PLUS_PROVIDER,
      ].includes(mail.provider);
    }

    function getPasswordSetupResendIntervalMs(mail = {}) {
      if (mail.provider === LUCKMAIL_PROVIDER) {
        return 15000;
      }
      if (mail.provider === HOTMAIL_PROVIDER || mail.provider === ICLOUD_API_PROVIDER || mail.provider === '2925') {
        return 0;
      }
      return Math.max(0, Number(STANDARD_MAIL_VERIFICATION_RESEND_INTERVAL_MS) || 0);
    }

    function normalizeVerificationWaitSeconds(value, fallback = DEFAULT_VERIFICATION_WAIT_SECONDS) {
      const rawValue = String(value ?? '').trim();
      const fallbackValue = Math.max(0, Math.min(MAX_VERIFICATION_WAIT_SECONDS, Math.floor(Number(fallback) || 0)));
      if (!rawValue) {
        return fallbackValue;
      }
      const numeric = Number.parseInt(rawValue, 10);
      if (!Number.isFinite(numeric)) {
        return fallbackValue;
      }
      return Math.max(0, Math.min(MAX_VERIFICATION_WAIT_SECONDS, numeric));
    }

    async function waitBeforeFetchingPasswordSetupCode(state = {}, visibleStep = 6, attempt = 1, maxAttempts = 1) {
      const waitSeconds = normalizeVerificationWaitSeconds(state.setGptPasswordVerificationWaitSeconds);
      if (waitSeconds <= 0) {
        return;
      }
      const attemptText = attempt > 1
        ? `第 ${attempt}/${maxAttempts} 次取码前`
        : '首次取码前';
      await addStepLog(
        visibleStep,
        `设置 GPT 密码：${attemptText}等待 ${waitSeconds} 秒，避免读取旧验证码。`,
        'info'
      );
      await sleepWithStop(waitSeconds * 1000);
    }

    async function focusOrOpenMailTab(mail = {}) {
      if (!mail?.source) {
        return;
      }
      const alive = typeof isTabAlive === 'function'
        ? await isTabAlive(mail.source)
        : false;
      if (alive) {
        if (mail.navigateOnReuse && typeof reuseOrCreateTab === 'function') {
          await reuseOrCreateTab(mail.source, mail.url, {
            inject: mail.inject,
            injectSource: mail.injectSource,
          });
          return;
        }
        const tabId = typeof getTabId === 'function' ? await getTabId(mail.source) : 0;
        if (tabId && chrome?.tabs?.update) {
          await chrome.tabs.update(tabId, { active: true });
        }
        return;
      }
      if (typeof reuseOrCreateTab !== 'function') {
        throw new Error(`无法打开 ${mail.label || '邮箱'} 标签页，缺少 reuseOrCreateTab。`);
      }
      await reuseOrCreateTab(mail.source, mail.url, {
        inject: mail.inject,
        injectSource: mail.injectSource,
      });
    }

    async function prepareMailProviderForPolling(mail = {}, state = {}, visibleStep = 6) {
      if (!mail || mail.provider === 'custom') {
        return;
      }
      if (mail.source === 'icloud-mail') {
        await addStepLog(visibleStep, '设置 GPT 密码：iCloud 邮箱将优先通过取码接口获取验证码，不主动打开 iCloud 网页。', 'info');
        return;
      }
      if (isApiMailProvider(mail)) {
        await addStepLog(visibleStep, `设置 GPT 密码：正在通过 ${mail.label || mail.provider} 轮询验证码...`, 'info');
        return;
      }
      if (mail.provider === '2925' && typeof ensureMail2925MailboxSession === 'function') {
        await addStepLog(visibleStep, `设置 GPT 密码：正在确认 ${mail.label || '2925 邮箱'} 登录态...`, 'info');
        await ensureMail2925MailboxSession({
          accountId: state.currentMail2925AccountId || null,
          forceRelogin: false,
          allowLoginWhenOnLoginPage: Boolean(state?.mail2925UseAccountPool),
          expectedMailboxEmail: getExpectedMail2925MailboxEmail(state),
          actionLabel: `步骤 ${visibleStep}：确认 2925 邮箱登录态`,
        });
        return;
      }
      await addStepLog(visibleStep, `设置 GPT 密码：正在打开 ${mail.label || '邮箱'} 等待验证码...`, 'info');
      await focusOrOpenMailTab(mail);
    }

    async function openPasswordSetupVerificationPage(visibleStep) {
      if (typeof reuseOrCreateTab !== 'function') {
        throw new Error(`步骤 ${visibleStep}：无法打开 OpenAI 设置密码入口页，缺少标签页管理器。`);
      }
      const tabId = await reuseOrCreateTab(AUTH_SOURCE, SET_GPT_PASSWORD_ENTRY_URL, {
        inject: SIGNUP_PAGE_INJECT_FILES,
        injectSource: AUTH_SOURCE,
        reloadIfSameUrl: true,
      });
      if (!tabId) {
        throw new Error(`步骤 ${visibleStep}：打开 OpenAI 设置密码入口页失败。`);
      }
      if (typeof waitForTabStableComplete === 'function') {
        await waitForTabStableComplete(tabId, {
          timeoutMs: 45000,
          retryDelayMs: 300,
          stableMs: 800,
          initialDelayMs: 300,
        });
      }
      await ensureContentScriptReadyOnTab(AUTH_SOURCE, tabId, {
        inject: SIGNUP_PAGE_INJECT_FILES,
        injectSource: AUTH_SOURCE,
        timeoutMs: 30000,
      });
      return tabId;
    }

    async function openPasswordSetupNewPasswordPage(tabId, visibleStep) {
      let nextTabId = tabId;
      if (chrome?.tabs?.update && nextTabId) {
        await chrome.tabs.update(nextTabId, {
          active: true,
          url: SET_GPT_PASSWORD_NEW_PASSWORD_URL,
        });
      } else {
        if (typeof reuseOrCreateTab !== 'function') {
          throw new Error(`步骤 ${visibleStep}：无法打开 OpenAI 新密码页，缺少标签页管理器。`);
        }
        nextTabId = await reuseOrCreateTab(AUTH_SOURCE, SET_GPT_PASSWORD_NEW_PASSWORD_URL, {
          inject: SIGNUP_PAGE_INJECT_FILES,
          injectSource: AUTH_SOURCE,
          reloadIfSameUrl: true,
        });
      }
      if (!nextTabId) {
        throw new Error(`步骤 ${visibleStep}：打开 OpenAI 新密码页失败。`);
      }
      if (typeof waitForTabStableComplete === 'function') {
        await waitForTabStableComplete(nextTabId, {
          timeoutMs: 45000,
          retryDelayMs: 300,
          stableMs: 800,
          initialDelayMs: 300,
        });
      }
      await ensureContentScriptReadyOnTab(AUTH_SOURCE, nextTabId, {
        inject: SIGNUP_PAGE_INJECT_FILES,
        injectSource: AUTH_SOURCE,
        timeoutMs: 30000,
      });
      return nextTabId;
    }

    async function ensureSetPasswordContentScriptReady(tabId, visibleStep, label = 'OpenAI 设置密码页面') {
      if (!tabId) {
        return;
      }
      await ensureContentScriptReadyOnTab(AUTH_SOURCE, tabId, {
        inject: SIGNUP_PAGE_INJECT_FILES,
        injectSource: AUTH_SOURCE,
        timeoutMs: 30000,
        logMessage: `步骤 ${visibleStep}：${label}内容脚本未就绪，正在重新注入...`,
        logStep: visibleStep,
        logStepKey: 'set-gpt-password',
      });
    }

    async function getCurrentAuthTabUrl(tabId) {
      if (!tabId || typeof chrome?.tabs?.get !== 'function') {
        return '';
      }
      const tab = await chrome.tabs.get(tabId).catch(() => null);
      return normalizeString(tab?.url || '');
    }

    async function waitBrieflyForAuthTabUrlAfterTransportLoss(tabId) {
      if (typeof waitForTabStableComplete === 'function' && tabId) {
        await waitForTabStableComplete(tabId, {
          timeoutMs: TRANSPORT_LOSS_CONFIRM_TIMEOUT_MS,
          retryDelayMs: 250,
          stableMs: TRANSPORT_LOSS_STABLE_MS,
          initialDelayMs: 250,
        });
      }
      return getCurrentAuthTabUrl(tabId);
    }

    function normalizeSetPasswordPageStateSnapshot(snapshot = {}) {
      const source = snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot) ? snapshot : {};
      const state = normalizeString(source.state || 'unknown') || 'unknown';
      return {
        ...source,
        state,
        url: normalizeString(source.url),
        errorText: normalizeString(source.errorText || source.verificationErrorText),
      };
    }

    function isSetPasswordAuthHttpErrorPage(snapshot = {}) {
      return normalizeString(snapshot?.state).toLowerCase() === 'auth_http_error_page'
        || snapshot?.authHttpErrorPage === true
        || snapshot?.httpErrorPage === true;
    }

    function isReloadableAuthHttpErrorUrl(url = '') {
      try {
        const parsed = new URL(normalizeString(url));
        return parsed.hostname === 'auth.openai.com'
          && /\/(?:u\/)?email-verification(?:[/?#]|$)/i.test(parsed.pathname);
      } catch {
        return false;
      }
    }

    async function reloadSetPasswordAuthHttpErrorPage(tabId, visibleStep, context = '') {
      if (!tabId || !chrome?.tabs?.get || !chrome?.tabs?.reload) {
        return false;
      }
      const tab = await chrome.tabs.get(tabId).catch(() => null);
      const url = normalizeString(tab?.url);
      if (!isReloadableAuthHttpErrorUrl(url)) {
        return false;
      }
      await addStepLog(
        visibleStep,
        `设置 GPT 密码：OpenAI 邮箱验证码页返回 HTTP 500，正在刷新页面后重试。${context ? `原因：${context}` : ''}`,
        'warn'
      );
      await chrome.tabs.reload(tabId, { bypassCache: true }).catch(() => {});
      if (typeof waitForTabStableComplete === 'function') {
        await waitForTabStableComplete(tabId, {
          timeoutMs: 30000,
          retryDelayMs: 300,
          stableMs: 800,
          initialDelayMs: 500,
        }).catch(() => null);
      } else {
        await sleepWithStop(1200).catch(() => {});
      }
      return true;
    }

    async function readSetPasswordPageState(tabId, visibleStep, options = {}) {
      if (!tabId) {
        return { state: 'unknown', url: '' };
      }
      const timeoutMs = Math.max(1000, Math.floor(Number(options.timeoutMs) || PASSWORD_SUBMIT_STATE_TIMEOUT_MS));
      try {
        if (options.ensureReady !== false) {
          await ensureSetPasswordContentScriptReady(tabId, visibleStep, 'OpenAI 新密码页');
        }
        const snapshot = await sendSetPasswordPageMessage(
          'GET_SET_GPT_PASSWORD_STATE',
          {},
          visibleStep,
          timeoutMs
        );
        return normalizeSetPasswordPageStateSnapshot(snapshot);
      } catch (error) {
        const url = options.waitForUrlAfterError === false
          ? await getCurrentAuthTabUrl(tabId).catch(() => '')
          : await waitBrieflyForAuthTabUrlAfterTransportLoss(tabId).catch(() => '');
        if (isReloadableAuthHttpErrorUrl(url)) {
          return {
            state: 'auth_http_error_page',
            url,
            errorText: normalizeString(error?.message || error),
          };
        }
        return {
          state: url && !isSetGptPasswordNewPasswordUrl(url)
            ? 'left_new_password_page'
            : 'new_password_unreachable',
          url,
          errorText: normalizeString(error?.message || error),
        };
      }
    }

    async function recoverSetPasswordAuthRetryPageFromBackground(tabId, visibleStep, snapshot = {}) {
      await addStepLog(
        visibleStep,
        '设置 GPT 密码：检测到 OpenAI 认证超时页，正在点击 Try again 恢复后继续提交密码。',
        'warn'
      );

      async function resolveRecoveredPageState(recoverResult = {}) {
        const recoveredState = normalizeString(recoverResult?.state || recoverResult?.pageState);
        if (['new_password_page', 'new_password_loading'].includes(recoveredState)) {
          return {
            state: recoveredState,
            url: normalizeString(recoverResult?.url || snapshot?.url),
            errorText: normalizeString(recoverResult?.errorText),
          };
        }
        return await readSetPasswordPageState(tabId, visibleStep, {
          timeoutMs: 3000,
        }).catch(() => null);
      }

      let recoverResult = {};
      try {
        recoverResult = await sendSetPasswordPageMessage(
          'RECOVER_SET_GPT_PASSWORD_AUTH_RETRY_PAGE',
          {},
          visibleStep,
          20000
        );
      } catch (error) {
        const recoveredPageState = await resolveRecoveredPageState();
        if (recoveredPageState?.state === 'left_new_password_page' || (recoveredPageState?.url && !isSetGptPasswordNewPasswordUrl(recoveredPageState.url))) {
          await addStepLog(visibleStep, '设置 GPT 密码：Try again 恢复消息异常，但页面已离开新密码页，按密码设置成功继续。', 'success');
          return createPasswordSubmitSuccess(recoveredPageState, {
            recoveredAuthRetryPage: true,
            recoveredAfterRecoverMessageError: true,
          });
        }
        if (['new_password_page', 'new_password_loading'].includes(recoveredPageState?.state)) {
          await addStepLog(visibleStep, '设置 GPT 密码：Try again 后已回到新密码页，将重新填写并提交 GPT 密码。', 'warn');
          if (tabId && recoveredPageState.state !== 'new_password_loading') {
            await ensureSetPasswordContentScriptReady(tabId, visibleStep, 'OpenAI 新密码页');
          }
          return {
            success: false,
            retryPasswordSubmit: true,
            recoveredAuthRetryPage: true,
            recoveredAfterRecoverMessageError: true,
            pageState: recoveredPageState.state,
            url: recoveredPageState.url || snapshot?.url,
            errorText: recoveredPageState.errorText,
          };
        }
        throw error;
      }

      const currentUrl = normalizeString(recoverResult?.url) || await getCurrentAuthTabUrl(tabId);
      if (currentUrl && !isSetGptPasswordNewPasswordUrl(currentUrl)) {
        await addStepLog(visibleStep, '设置 GPT 密码：Try again 后已离开新密码页，按密码设置成功继续。', 'success');
        return {
          success: true,
          gptPasswordSet: true,
          recoveredAuthRetryPage: true,
          pageState: 'auth_retry_page',
          url: currentUrl,
        };
      }
      const recoveredPageState = await resolveRecoveredPageState(recoverResult);
      if (recoveredPageState?.state === 'left_new_password_page' || (recoveredPageState?.url && !isSetGptPasswordNewPasswordUrl(recoveredPageState.url))) {
        await addStepLog(visibleStep, '设置 GPT 密码：Try again 后页面状态确认已离开新密码页，按密码设置成功继续。', 'success');
        return createPasswordSubmitSuccess(recoveredPageState, {
          recoveredAuthRetryPage: true,
        });
      }
      if (['new_password_page', 'new_password_loading'].includes(recoveredPageState?.state)) {
        await addStepLog(visibleStep, '设置 GPT 密码：Try again 后已回到新密码页，将重新填写并提交 GPT 密码。', 'warn');
        if (tabId && recoveredPageState.state !== 'new_password_loading') {
          await ensureSetPasswordContentScriptReady(tabId, visibleStep, 'OpenAI 新密码页');
        }
        return {
          success: false,
          retryPasswordSubmit: true,
          recoveredAuthRetryPage: true,
          pageState: recoveredPageState.state,
          url: recoveredPageState.url || currentUrl || snapshot?.url,
          errorText: recoveredPageState.errorText,
        };
      }
      await ensureSetPasswordContentScriptReady(tabId, visibleStep, 'OpenAI 新密码页');
      return {
        success: false,
        retryPasswordSubmit: true,
        recoveredAuthRetryPage: true,
        pageState: 'auth_retry_page',
        url: normalizeString(recoverResult?.url || snapshot?.url),
      };
    }

    async function recoverCodeSubmitAfterTransportLoss(tabId, visibleStep, error) {
      await addStepLog(
        visibleStep,
        `设置 GPT 密码：验证码提交后页面跳转导致通信中断，正在检查新密码页状态...（${normalizeString(error?.message || error)}）`,
        'warn'
      );
      let currentUrl = await getCurrentAuthTabUrl(tabId);
      if (isReloadableAuthHttpErrorUrl(currentUrl)) {
        await reloadSetPasswordAuthHttpErrorPage(tabId, visibleStep, '验证码提交后进入 HTTP 500');
        return null;
      }
      if (isSetGptPasswordNewPasswordUrl(currentUrl)) {
        await addStepLog(visibleStep, '设置 GPT 密码：已检测到页面进入新密码页，继续填写 GPT 密码。', 'success');
        return {
          success: true,
          newPasswordPage: true,
          recoveredAfterTransportLoss: true,
          url: currentUrl,
        };
      }
      currentUrl = await waitBrieflyForAuthTabUrlAfterTransportLoss(tabId);
      if (isReloadableAuthHttpErrorUrl(currentUrl)) {
        await reloadSetPasswordAuthHttpErrorPage(tabId, visibleStep, '验证码提交后短等仍为 HTTP 500');
        return null;
      }
      if (isSetGptPasswordNewPasswordUrl(currentUrl)) {
        await addStepLog(visibleStep, '设置 GPT 密码：短等后已确认进入新密码页，继续填写 GPT 密码。', 'success');
        return {
          success: true,
          newPasswordPage: true,
          recoveredAfterTransportLoss: true,
          url: currentUrl,
        };
      }
      if (tabId) {
        await ensureSetPasswordContentScriptReady(tabId, visibleStep, 'OpenAI 设置密码页面');
      }
      return null;
    }

    async function recoverPasswordSubmitAfterTransportLoss(tabId, visibleStep, error) {
      await addStepLog(
        visibleStep,
        `设置 GPT 密码：提交密码后页面跳转导致通信中断，正在确认是否已离开新密码页...（${normalizeString(error?.message || error)}）`,
        'warn'
      );
      let currentUrl = await getCurrentAuthTabUrl(tabId);
      if (isReloadableAuthHttpErrorUrl(currentUrl)) {
        await reloadSetPasswordAuthHttpErrorPage(tabId, visibleStep, '密码提交后进入 HTTP 500');
        return {
          success: false,
          retryPasswordSubmit: true,
          recoveredAuthHttpErrorPage: true,
          pageState: 'auth_http_error_page',
          url: currentUrl,
        };
      }
      if (currentUrl && !isSetGptPasswordNewPasswordUrl(currentUrl)) {
        await addStepLog(visibleStep, '设置 GPT 密码：已检测到页面离开新密码页，按密码设置成功继续。', 'success');
        return {
          success: true,
          gptPasswordSet: true,
          recoveredAfterTransportLoss: true,
          url: currentUrl,
        };
      }
      currentUrl = await waitBrieflyForAuthTabUrlAfterTransportLoss(tabId);
      if (isReloadableAuthHttpErrorUrl(currentUrl)) {
        await reloadSetPasswordAuthHttpErrorPage(tabId, visibleStep, '密码提交后短等仍为 HTTP 500');
        return {
          success: false,
          retryPasswordSubmit: true,
          recoveredAuthHttpErrorPage: true,
          pageState: 'auth_http_error_page',
          url: currentUrl,
        };
      }
      if (currentUrl && !isSetGptPasswordNewPasswordUrl(currentUrl)) {
        await addStepLog(visibleStep, '设置 GPT 密码：短等后已确认页面离开新密码页，按密码设置成功继续。', 'success');
        return {
          success: true,
          gptPasswordSet: true,
          recoveredAfterTransportLoss: true,
          url: currentUrl,
        };
      }

      const pageState = await readSetPasswordPageState(tabId, visibleStep);
      if (isSetPasswordAuthHttpErrorPage(pageState)) {
        await reloadSetPasswordAuthHttpErrorPage(tabId, visibleStep, '页面状态为 HTTP 500');
        return {
          success: false,
          retryPasswordSubmit: true,
          recoveredAuthHttpErrorPage: true,
          pageState: pageState.state,
          url: pageState.url,
        };
      }
      if (pageState.url && !isSetGptPasswordNewPasswordUrl(pageState.url)) {
        await addStepLog(visibleStep, '设置 GPT 密码：页面状态探测确认已离开新密码页，按密码设置成功继续。', 'success');
        return {
          success: true,
          gptPasswordSet: true,
          recoveredAfterTransportLoss: true,
          pageState: pageState.state,
          url: pageState.url,
        };
      }
      if (pageState.state === 'left_new_password_page') {
        await addStepLog(visibleStep, '设置 GPT 密码：页面状态探测确认已离开新密码页，按密码设置成功继续。', 'success');
        return {
          success: true,
          gptPasswordSet: true,
          recoveredAfterTransportLoss: true,
          pageState: pageState.state,
          url: pageState.url,
        };
      }
      if (pageState.state === 'auth_retry_page') {
        return recoverSetPasswordAuthRetryPageFromBackground(tabId, visibleStep, pageState);
      }
      if (['new_password_page', 'new_password_loading', 'new_password_unreachable'].includes(pageState.state)) {
        if (tabId && pageState.state !== 'new_password_unreachable') {
          await ensureSetPasswordContentScriptReady(tabId, visibleStep, 'OpenAI 新密码页');
        }
        return {
          success: false,
          retryPasswordSubmit: true,
          recoveredAfterTransportLoss: true,
          pageState: pageState.state,
          url: pageState.url || currentUrl,
          errorText: pageState.errorText,
        };
      }
      return null;
    }

    function createPasswordSubmitSuccess(snapshot = {}, extra = {}) {
      return {
        success: true,
        gptPasswordSet: true,
        pageState: snapshot.state || snapshot.pageState || '',
        url: normalizeString(snapshot.url),
        ...extra,
      };
    }

    async function readChatGptSessionForPasswordConfirmation(tabId, visibleStep, confirmState = {}) {
      await ensureContentScriptReadyOnTab(AUTH_SOURCE, tabId, {
        inject: SIGNUP_PAGE_INJECT_FILES,
        injectSource: AUTH_SOURCE,
        timeoutMs: 12000,
        logMessage: `步骤 ${visibleStep}：正在复核 ChatGPT 登录会话以确认 GPT 密码已设置...`,
        logStep: visibleStep,
        logStepKey: 'set-gpt-password',
      });
      const sessionResult = await sendSetPasswordPageMessage(
        'READ_CHATGPT_SESSION_EXPORT_DATA',
        {},
        visibleStep,
        12000
      );
      const sessionEmail = resolveSessionEmail(sessionResult);
      confirmState.lastSessionEmail = sessionEmail || '';
      confirmState.lastSessionFieldCount = Math.max(0, Number(sessionResult?.fieldCount || sessionResult?.sessionFieldCount) || 0);
      return {
        sessionEmail,
        sessionResult,
      };
    }

    async function confirmPasswordSubmitSuccessFromUrl(tabId, visibleStep, url, expectedEmail = '', confirmState = {}) {
      const currentUrl = normalizeString(url);
      if (!currentUrl || isSetGptPasswordNewPasswordUrl(currentUrl)) {
        return null;
      }
      if (isReloadableAuthHttpErrorUrl(currentUrl)) {
        return null;
      }
      confirmState.lastUrl = currentUrl;
      if (!isLikelyChatGptLoggedInAfterPasswordUrl(currentUrl)) {
        return createPasswordSubmitSuccess({
          state: 'left_new_password_page',
          url: currentUrl,
        }, {
          confirmedByTabUrl: true,
        });
      }

      try {
        const { sessionEmail } = await readChatGptSessionForPasswordConfirmation(tabId, visibleStep, confirmState);
        const normalizedExpectedEmail = normalizeEmail(expectedEmail);
        const normalizedSessionEmail = normalizeEmail(sessionEmail);
        if (normalizedExpectedEmail && normalizedSessionEmail && normalizedExpectedEmail !== normalizedSessionEmail) {
          throw new Error(`步骤 ${visibleStep}：GPT 密码提交后进入 ChatGPT 首页，但 session 邮箱不匹配。期望 ${normalizedExpectedEmail}，实际 ${normalizedSessionEmail}。`);
        }
        if (normalizedSessionEmail || !normalizedExpectedEmail) {
          await addStepLog(visibleStep, `设置 GPT 密码：已进入 ChatGPT 首页并确认登录会话${normalizedSessionEmail ? `（${normalizedSessionEmail}）` : ''}，按密码设置成功继续。`, 'success');
          return createPasswordSubmitSuccess({
            state: 'chatgpt_logged_in_home',
            url: currentUrl,
          }, {
            confirmedByChatGptSession: true,
            sessionEmail: normalizedSessionEmail,
          });
        }
        confirmState.sessionReadError = 'ChatGPT session 未返回邮箱。';
      } catch (error) {
        const message = normalizeString(error?.message || error);
        if (/session 邮箱不匹配/.test(message)) {
          throw error;
        }
        confirmState.sessionReadError = message;
      }
      return null;
    }

    async function waitForPasswordSubmitOutcomeFromBackground(tabId, visibleStep, expectedEmail = '') {
      const startedAt = Date.now();
      let lastState = { state: 'unknown', url: '' };
      const confirmState = {};

      while (Date.now() - startedAt < PASSWORD_SUBMIT_CONFIRM_TIMEOUT_MS) {
        throwIfStopped();
        const currentTabUrlBeforeProbe = await getCurrentAuthTabUrl(tabId).catch(() => '');
        const urlSuccessBeforeProbe = await confirmPasswordSubmitSuccessFromUrl(
          tabId,
          visibleStep,
          currentTabUrlBeforeProbe,
          expectedEmail,
          confirmState
        );
        if (urlSuccessBeforeProbe) {
          return urlSuccessBeforeProbe;
        }

        const pageState = await readSetPasswordPageState(tabId, visibleStep, {
          ensureReady: false,
          timeoutMs: PASSWORD_SUBMIT_POLL_STATE_TIMEOUT_MS,
          waitForUrlAfterError: false,
        });
        lastState = pageState;

        const currentTabUrlAfterProbe = await getCurrentAuthTabUrl(tabId).catch(() => '');
        const urlSuccessAfterProbe = await confirmPasswordSubmitSuccessFromUrl(
          tabId,
          visibleStep,
          currentTabUrlAfterProbe,
          expectedEmail,
          confirmState
        );
        if (urlSuccessAfterProbe) {
          return {
            ...urlSuccessAfterProbe,
            pageState: urlSuccessAfterProbe.pageState || pageState.state,
          };
        }

        if (isSetPasswordAuthHttpErrorPage(pageState)) {
          await reloadSetPasswordAuthHttpErrorPage(tabId, visibleStep, '后台轮询检测到 HTTP 500');
          return {
            success: false,
            retryPasswordSubmit: true,
            recoveredAuthHttpErrorPage: true,
            pageState: pageState.state,
            url: pageState.url,
          };
        }
        if (pageState.state === 'auth_retry_page') {
          return recoverSetPasswordAuthRetryPageFromBackground(tabId, visibleStep, pageState);
        }
        if (pageState.state === 'left_new_password_page' || (pageState.url && !isSetGptPasswordNewPasswordUrl(pageState.url))) {
          await addStepLog(visibleStep, '设置 GPT 密码：后台轮询确认已离开新密码页，按密码设置成功继续。', 'success');
          return createPasswordSubmitSuccess(pageState, {
            confirmedByBackgroundPoll: true,
          });
        }

        const errorText = normalizeString(pageState.errorText);
        if (errorText && pageState.state !== 'new_password_unreachable') {
          if (isSetGptPasswordReuseErrorText(errorText)) {
            return {
              success: false,
              passwordReused: true,
              pageState: pageState.state,
              url: pageState.url,
              errorText,
              confirmedByBackgroundPoll: true,
            };
          }
          throw new Error(`步骤 ${visibleStep}：设置 GPT 密码失败：${errorText}`);
        }

        await sleepWithStop(PASSWORD_SUBMIT_CONFIRM_POLL_INTERVAL_MS);
      }

      const finalUrl = await waitBrieflyForAuthTabUrlAfterTransportLoss(tabId).catch(() => '');
      const finalUrlSuccess = await confirmPasswordSubmitSuccessFromUrl(
        tabId,
        visibleStep,
        finalUrl,
        expectedEmail,
        confirmState
      );
      if (finalUrlSuccess) {
        return {
          ...finalUrlSuccess,
          confirmedByFinalTabUrl: true,
        };
      }

      return {
        success: false,
        retryPasswordSubmit: true,
        pollTimedOut: true,
        pageState: lastState.state || 'unknown',
        url: finalUrl || lastState.url || confirmState.lastUrl || '',
        errorText: lastState.errorText || confirmState.sessionReadError || '',
        sessionEmail: confirmState.lastSessionEmail || '',
      };
    }

    async function sendSetPasswordPageMessage(type, payload = {}, visibleStep = 6, timeoutMs = 30000) {
      if (typeof sendToContentScriptResilient !== 'function') {
        throw new Error(`步骤 ${visibleStep}：无法与 OpenAI 认证页通信，内容脚本通道未初始化。`);
      }
      const result = await sendToContentScriptResilient(AUTH_SOURCE, {
        type,
        source: 'background',
        payload: {
          ...payload,
          visibleStep,
          nodeId: 'set-gpt-password',
        },
      }, {
        timeoutMs: Math.max(timeoutMs, 1000),
        responseTimeoutMs: Math.max(timeoutMs, 1000),
        retryDelayMs: 700,
        logMessage: `步骤 ${visibleStep}：OpenAI 设置密码页面正在切换，等待页面重新就绪...`,
        logStep: visibleStep,
        logStepKey: 'set-gpt-password',
      });
      if (result?.error) {
        throw new Error(result.error);
      }
      return result || {};
    }

    async function prepareSetPasswordFlowWithRetry(tabId, visibleStep, options = {}) {
      const timeoutMs = Math.max(5000, Math.floor(Number(options.timeoutMs) || SET_PASSWORD_RESET_NAVIGATION_TIMEOUT_MS));
      const startedAt = Date.now();
      let attempt = 0;
      let lastError = null;
      let lastResult = null;
      let loggedWaiting = false;

      while (Date.now() - startedAt < timeoutMs) {
        throwIfStopped();
        attempt += 1;
        const elapsedMs = Date.now() - startedAt;
        const remainingMs = Math.max(1000, timeoutMs - elapsedMs);
        const waitTimeoutMs = Math.max(
          2000,
          Math.min(SET_PASSWORD_RESET_PREPARE_WAIT_MS, remainingMs - 1000)
        );
        const messageTimeoutMs = Math.max(12000, (waitTimeoutMs * 2) + 3000);

        try {
          if (attempt > 1) {
            await ensureContentScriptReadyOnTab(AUTH_SOURCE, tabId, {
              inject: SIGNUP_PAGE_INJECT_FILES,
              injectSource: AUTH_SOURCE,
              timeoutMs: 15000,
            }).catch(() => {});
          }

          const result = await sendSetPasswordPageMessage('PREPARE_SET_GPT_PASSWORD', {
            waitTimeoutMs,
            fallbackWaitTimeoutMs: waitTimeoutMs,
          }, visibleStep, Math.min(messageTimeoutMs, Math.max(3000, remainingMs)));
          lastResult = result;
          if (result?.ready) {
            return result;
          }
        } catch (error) {
          lastError = error;
          if (!isSetGptPasswordPrepareNavigationPendingError(error)) {
            throw error;
          }
        }

        if (!loggedWaiting) {
          loggedWaiting = true;
          await addStepLog(
            visibleStep,
            '设置 GPT 密码：点击密码入口后页面仍在跳转到 OpenAI 邮箱验证码页，继续等待并重新探测。',
            'warn'
          );
        }
        await sleepWithStop(Math.min(SET_PASSWORD_RESET_PREPARE_RETRY_DELAY_MS, remainingMs));
      }

      const currentUrl = await getCurrentAuthTabUrl(tabId).catch(() => '');
      if (lastError) {
        const reason = normalizeString(lastError?.message || lastError);
        throw new Error(`步骤 ${visibleStep}：点击密码入口后等待 OpenAI 邮箱验证码页超时。URL: ${currentUrl || ''}；最后错误：${reason}`);
      }
      throw new Error(`步骤 ${visibleStep}：点击密码入口后等待 OpenAI 邮箱验证码页超时。URL: ${currentUrl || lastResult?.url || ''}；当前状态 ${lastResult?.state || 'unknown'}。`);
    }

    async function resolveLoggedInAccountEmailFromSession(visibleStep = 6) {
      await addStepLog(visibleStep, '当前运行状态缺少账号邮箱，正在从已登录的 ChatGPT 会话读取邮箱...', 'info');
      let sessionResult = null;
      try {
        sessionResult = await sendSetPasswordPageMessage('READ_CHATGPT_SESSION_EXPORT_DATA', {}, visibleStep, 30000);
      } catch (error) {
        throw new Error(`步骤 ${visibleStep}：缺少当前账号邮箱，且无法从 ChatGPT 会话读取登录邮箱：${error?.message || error}`);
      }
      const sessionEmail = resolveSessionEmail(sessionResult);
      if (!sessionEmail) {
        throw new Error(`步骤 ${visibleStep}：缺少当前账号邮箱，且 ChatGPT 会话未返回登录邮箱，请确认当前标签页已登录目标账号。`);
      }
      const patch = {
        email: sessionEmail,
        accountIdentifierType: 'email',
        accountIdentifier: sessionEmail,
        step8VerificationTargetEmail: sessionEmail,
      };
      await setState(patch);
      await addStepLog(visibleStep, `已从 ChatGPT 登录会话识别当前账号邮箱：${sessionEmail}`, 'success');
      return sessionEmail;
    }

    async function fetchPasswordSetupCode(state = {}, mail = null, options = {}) {
      if (typeof fetchVerificationCodeOnly !== 'function') {
        throw new Error('设置 GPT 密码取码能力未初始化。');
      }
      const disableIcloudWebMailFallback = mail?.source === 'icloud-mail';
      const result = await fetchVerificationCodeOnly(8, state, disableIcloudWebMailFallback ? null : mail, options);
      if (!result?.handled) {
        if (disableIcloudWebMailFallback) {
          throw new Error('当前邮箱是 iCloud 网页邮箱，但已禁止自动打开 iCloud Mail；请为该邮箱配置自定义取码 URL/Assurivo 查询码。');
        }
        throw new Error('当前邮箱来源没有可自动获取 OpenAI 设置密码验证码的接口，请配置自定义取码 URL/Assurivo 或可轮询邮箱 provider。');
      }
      if (!normalizeString(result.code)) {
        throw new Error('设置 GPT 密码验证码为空。');
      }
      return result;
    }

    async function requestPasswordSetupCodeResend(visibleStep = 6, reason = '') {
      const reasonSuffix = reason ? `（${reason}）` : '';
      await addStepLog(visibleStep, `设置 GPT 密码：正在请求重新发送邮箱验证码${reasonSuffix}。`, 'warn');
      const result = await sendSetPasswordPageMessage('RESEND_VERIFICATION_CODE', {
        step: visibleStep,
        visibleStep,
      }, visibleStep, 45000);
      const requestedAt = Date.now();
      if (result?.codeStageComplete || result?.alreadyOnNewPasswordPage || result?.emailAlreadyVerified) {
        await addStepLog(
          visibleStep,
          result?.alreadyOnNewPasswordPage
            ? '设置 GPT 密码：重发验证码前检测到已进入新密码页，将直接继续填写 GPT 密码。'
            : '设置 GPT 密码：重发验证码前检测到邮箱已验证，将直接进入新密码页。',
          'success'
        );
        return {
          requestedAt,
          codeStageComplete: true,
          alreadyOnNewPasswordPage: Boolean(result?.alreadyOnNewPasswordPage),
          emailAlreadyVerified: Boolean(result?.emailAlreadyVerified),
          requiresNewPasswordNavigation: Boolean(result?.requiresNewPasswordNavigation),
          url: normalizeString(result?.url),
        };
      }
      await addStepLog(
        visibleStep,
        `设置 GPT 密码：已点击重新发送验证码${result?.buttonText ? `（${result.buttonText}）` : ''}，将等待新邮件。`,
        'success'
      );
      return {
        requestedAt,
        resent: true,
        buttonText: normalizeString(result?.buttonText),
        url: normalizeString(result?.url),
      };
    }

    async function executeSetGptPassword(state = {}) {
      throwIfStopped();
      const initialState = await getMergedState(state);
      const visibleStep = getVisibleStep(initialState);
      let email = resolveAccountEmail(initialState);

      await setState({
        gptPasswordSet: false,
        gptPasswordSetAt: '',
      });
      let authTabId = await openPasswordSetupVerificationPage(visibleStep);
      if (chrome?.tabs?.update) {
        await chrome.tabs.update(authTabId, { active: true }).catch(() => {});
      }
      if (!email) {
        email = await resolveLoggedInAccountEmailFromSession(visibleStep);
      }
      let password = await ensureGptPassword({
        ...initialState,
        email,
        accountIdentifierType: 'email',
        accountIdentifier: email,
        step8VerificationTargetEmail: email,
      }, visibleStep);

      const startedAt = Date.now();
      const runtimeState = {
        ...(await getMergedState(initialState)),
        email,
        accountIdentifierType: 'email',
        accountIdentifier: email,
        step8VerificationTargetEmail: email,
        password,
      };

      await addStepLog(visibleStep, `正在为 ${email} 强制设置 GPT 登录密码，完成后会开通 2FA 并检测 UPI 试用资格...`, 'info');

      let prepareResult = await sendSetPasswordPageMessage('START_SET_GPT_PASSWORD_RESET', {
        email,
      }, visibleStep, 60000);
      if (prepareResult?.resetTriggered) {
        if (typeof waitForTabStableComplete === 'function') {
          await waitForTabStableComplete(authTabId, {
            timeoutMs: 15000,
            retryDelayMs: 300,
            stableMs: 800,
            initialDelayMs: 500,
          });
        }
        await ensureContentScriptReadyOnTab(AUTH_SOURCE, authTabId, {
          inject: SIGNUP_PAGE_INJECT_FILES,
          injectSource: AUTH_SOURCE,
            timeoutMs: 30000,
          });
        prepareResult = await prepareSetPasswordFlowWithRetry(authTabId, visibleStep, {
          timeoutMs: SET_PASSWORD_RESET_NAVIGATION_TIMEOUT_MS,
        });
      }
      if (!prepareResult?.ready) {
        prepareResult = await prepareSetPasswordFlowWithRetry(authTabId, visibleStep, {
          timeoutMs: 30000,
        });
      }
      if (prepareResult?.emailAlreadyVerified || prepareResult?.requiresNewPasswordNavigation) {
        await addStepLog(visibleStep, '设置 GPT 密码：邮箱已验证，正在直接打开新密码页。', 'info');
        authTabId = await openPasswordSetupNewPasswordPage(authTabId, visibleStep);
        prepareResult = await sendSetPasswordPageMessage('PREPARE_SET_GPT_PASSWORD', {}, visibleStep, 30000);
      }
      if (!prepareResult?.alreadyOnNewPasswordPage) {
        const mail = typeof getMailConfig === 'function' ? getMailConfig(runtimeState) : null;
        if (mail?.error) {
          throw new Error(mail.error);
        }
        await addStepLog(
          visibleStep,
          `设置 GPT 密码：验证码页已就绪，准备通过 ${mail?.label || mail?.provider || '邮箱'} 获取 ${email} 的验证码。`,
          'info'
        );
        await prepareMailProviderForPolling(mail, runtimeState, visibleStep);
        await addStepLog(visibleStep, '设置 GPT 密码：邮箱准备完成，开始取验证码。', 'info');

        const stateKey = typeof getVerificationCodeStateKey === 'function'
          ? getVerificationCodeStateKey(8)
          : 'lastLoginCode';
        const rejectedCodes = new Set();
        if (runtimeState[stateKey]) {
          rejectedCodes.add(runtimeState[stateKey]);
        }
        let acceptedCodeResult = null;
        let lastRejectedText = '';
        let codeStageComplete = false;
        let nextFilterAfterTimestamp = startedAt;
        let resendCount = 0;
        let lastResendAttempt = 0;
        const maxAttempts = Math.max(1, Math.min(8, Math.floor(Number(runtimeState.setGptPasswordCodeMaxAttempts) || DEFAULT_CODE_SUBMIT_ATTEMPTS)));
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          throwIfStopped();
          await waitBeforeFetchingPasswordSetupCode(runtimeState, visibleStep, attempt, maxAttempts);
          await addStepLog(visibleStep, `设置 GPT 密码：正在获取验证码（${attempt}/${maxAttempts}，邮箱：${email}）...`, 'info');
          let codeResult = null;
          try {
            codeResult = await fetchPasswordSetupCode(runtimeState, mail, {
              completionStep: visibleStep,
              targetEmail: email,
              filterAfterTimestamp: mail?.provider === '2925'
                ? Math.max(0, startedAt - MAIL_2925_FILTER_LOOKBACK_MS)
                : nextFilterAfterTimestamp,
              excludeCodes: [...rejectedCodes],
              maxResendRequests: mail?.provider === '2925' ? 2 : undefined,
              initialPollMaxAttempts: mail?.provider === '2925' ? 5 : undefined,
              pollAttemptPlan: mail?.provider === '2925' ? [2, 3, 15] : undefined,
              resendIntervalMs: getPasswordSetupResendIntervalMs(mail || {}),
            });
          } catch (error) {
            if (!isRetryablePasswordSetupCodeFetchError(error) || attempt >= maxAttempts) {
              throw error;
            }
            if (
              resendCount < PASSWORD_SETUP_CODE_RESEND_LIMIT
              && attempt >= 2
              && attempt - lastResendAttempt >= 2
            ) {
              try {
                const resendResult = await requestPasswordSetupCodeResend(
                  visibleStep,
                  '连续未取到本轮新验证码'
                );
                nextFilterAfterTimestamp = resendResult?.requestedAt || Date.now();
                resendCount += 1;
                lastResendAttempt = attempt;
                if (resendResult?.codeStageComplete) {
                  codeStageComplete = true;
                  acceptedCodeResult = {
                    code: '',
                    emailTimestamp: nextFilterAfterTimestamp,
                    codeStageComplete: true,
                  };
                  if (resendResult.requiresNewPasswordNavigation) {
                    await addStepLog(visibleStep, '设置 GPT 密码：邮箱已验证，正在直接打开新密码页。', 'info');
                    authTabId = await openPasswordSetupNewPasswordPage(authTabId, visibleStep);
                  }
                  break;
                }
              } catch (resendError) {
                await addStepLog(
                  visibleStep,
                  `设置 GPT 密码：尝试重新发送验证码失败，将继续等待邮箱新邮件：${resendError?.message || resendError}`,
                  'warn'
                );
              }
            }
            await addStepLog(
              visibleStep,
              `设置 GPT 密码：本次取码临时失败，将继续等待下一次尝试（${attempt + 1}/${maxAttempts}）：${error?.message || error}`,
              'warn'
            );
            continue;
          }

          await addStepLog(visibleStep, `已获取设置 GPT 密码验证码：${codeResult.code}，正在提交（${attempt}/${maxAttempts}）...`, 'info');
          let submitResult = null;
          try {
            submitResult = await sendSetPasswordPageMessage('SUBMIT_SET_GPT_PASSWORD_CODE', {
              code: codeResult.code,
            }, visibleStep, 45000);
          } catch (error) {
            if (!isRetryableContentScriptTransportError(error)) {
              throw error;
            }
            submitResult = await recoverCodeSubmitAfterTransportLoss(authTabId, visibleStep, error);
            if (!submitResult) {
              throw error;
            }
          }
          if (submitResult.invalidCode) {
            rejectedCodes.add(codeResult.code);
            lastRejectedText = submitResult.errorText || codeResult.code;
            await addStepLog(visibleStep, `设置 GPT 密码验证码被页面拒绝：${lastRejectedText}`, 'warn');
            if (attempt < maxAttempts) {
              if (resendCount < PASSWORD_SETUP_CODE_RESEND_LIMIT) {
                try {
                  const resendResult = await requestPasswordSetupCodeResend(
                    visibleStep,
                    '当前验证码被页面拒绝'
                  );
                  nextFilterAfterTimestamp = resendResult?.requestedAt || Date.now();
                  resendCount += 1;
                  lastResendAttempt = attempt;
                  if (resendResult?.codeStageComplete) {
                    codeStageComplete = true;
                    acceptedCodeResult = {
                      code: '',
                      emailTimestamp: nextFilterAfterTimestamp,
                      codeStageComplete: true,
                    };
                    if (resendResult.requiresNewPasswordNavigation) {
                      await addStepLog(visibleStep, '设置 GPT 密码：邮箱已验证，正在直接打开新密码页。', 'info');
                      authTabId = await openPasswordSetupNewPasswordPage(authTabId, visibleStep);
                    }
                    break;
                  }
                } catch (resendError) {
                  nextFilterAfterTimestamp = Date.now();
                  await addStepLog(
                    visibleStep,
                    `设置 GPT 密码：验证码被拒绝后尝试重新发送失败，将继续等待邮箱新邮件：${resendError?.message || resendError}`,
                    'warn'
                  );
                }
              } else {
                nextFilterAfterTimestamp = Date.now();
              }
              continue;
            }
            throw new Error(`步骤 ${visibleStep}：设置 GPT 密码验证码连续被拒绝：${lastRejectedText}`);
          }
          if (submitResult.unexpectedUrl) {
            throw new Error(`步骤 ${visibleStep}：验证码提交后没有进入设置新密码页。URL: ${submitResult.url || ''}`);
          }
          if (submitResult.emailAlreadyVerified || submitResult.requiresNewPasswordNavigation) {
            await addStepLog(visibleStep, '设置 GPT 密码：验证码提交后显示邮箱已验证，正在直接打开新密码页。', 'info');
            authTabId = await openPasswordSetupNewPasswordPage(authTabId, visibleStep);
          }
          acceptedCodeResult = codeResult;
          break;
        }
        if (!acceptedCodeResult) {
          throw new Error(`步骤 ${visibleStep}：未能提交有效的设置 GPT 密码验证码${lastRejectedText ? `：${lastRejectedText}` : ''}`);
        }
        if (!codeStageComplete) {
          await setState({
            lastEmailTimestamp: acceptedCodeResult.emailTimestamp || Date.now(),
            [stateKey]: acceptedCodeResult.code,
          });
        }
      }

      await ensureSetPasswordContentScriptReady(authTabId, visibleStep, 'OpenAI 新密码页');

      let passwordResult = null;
      let lastPasswordSubmitState = null;
      const submittedPasswords = new Set();
      for (let submitAttempt = 1; submitAttempt <= 3; submitAttempt += 1) {
        submittedPasswords.add(password);
        try {
          const submitAck = await sendSetPasswordPageMessage('SET_GPT_PASSWORD', {
            password,
            waitForOutcome: false,
          }, visibleStep, PASSWORD_SUBMIT_RESPONSE_TIMEOUT_MS);
          if (submitAck?.success || submitAck?.gptPasswordSet) {
            passwordResult = submitAck;
          } else {
            passwordResult = await waitForPasswordSubmitOutcomeFromBackground(authTabId, visibleStep, email);
          }
        } catch (error) {
          if (!isPasswordSubmitStateProbeError(error)) {
            throw error;
          }
          passwordResult = await recoverPasswordSubmitAfterTransportLoss(authTabId, visibleStep, error);
          if (passwordResult?.retryPasswordSubmit) {
            lastPasswordSubmitState = passwordResult;
            if (submitAttempt >= 3) {
              break;
            }
            await addStepLog(
              visibleStep,
              `设置 GPT 密码：页面状态 ${passwordResult.pageState || 'unknown'}，重新提交当前 GPT 密码（${submitAttempt + 1}/3）。`,
              'warn'
            );
            passwordResult = null;
            continue;
          }
          if (!passwordResult) {
            if (submitAttempt >= 3) {
              throw error;
            }
            await addStepLog(
              visibleStep,
              `设置 GPT 密码：页面通信恢复后仍停留在新密码页，重新提交当前 GPT 密码（${submitAttempt + 1}/3）。`,
              'warn'
            );
            continue;
          }
        }
        if (passwordResult?.retryPasswordSubmit) {
          lastPasswordSubmitState = passwordResult;
          if (submitAttempt >= 3) {
            break;
          }
          await addStepLog(
            visibleStep,
            `设置 GPT 密码：页面状态 ${passwordResult.pageState || 'unknown'}，重新提交当前 GPT 密码（${submitAttempt + 1}/3）。`,
            'warn'
          );
          passwordResult = null;
          continue;
        }
        if (passwordResult?.passwordReused) {
          await addStepLog(
            visibleStep,
            `设置 GPT 密码：OpenAI 拒绝重复使用当前密码，正在换一个新密码重试（${submitAttempt}/3）。`,
            'warn'
          );
          if (submitAttempt >= 3) {
            break;
          }
          password = await generateReplacementGptPassword([...submittedPasswords], visibleStep, runtimeState);
          runtimeState.password = password;
          continue;
        }
        break;
      }
      if (!passwordResult?.success && !passwordResult?.gptPasswordSet) {
        const finalState = passwordResult || lastPasswordSubmitState || {};
        const stateDetail = finalState.pageState ? ` 页面状态：${finalState.pageState}。` : '';
        const sessionDetail = finalState.sessionEmail ? ` session邮箱：${finalState.sessionEmail}。` : '';
        const detail = finalState.errorText ? ` 原因：${finalState.errorText}` : '';
        throw new Error(`步骤 ${visibleStep}：GPT 密码提交后未确认成功。${stateDetail}${sessionDetail}URL: ${finalState.url || ''}${detail}`);
      }

      const gptPasswordSetAt = new Date().toISOString();
      const patch = {
        password,
        gptPasswordSet: true,
        gptPasswordSetAt,
      };
      await setState(patch);
      if (typeof upsertUpiAccountCredentialBackup === 'function') {
        await upsertUpiAccountCredentialBackup({
          email,
          ...patch,
          sourceStep: 'set-gpt-password',
        });
      }
      await addStepLog(visibleStep, 'GPT 登录密码已设置成功，继续开通 2FA。', 'success');
      await completeNodeFromBackground(state?.nodeId || 'set-gpt-password', patch);
      return patch;
    }

    return {
      executeSetGptPassword,
    };
  }

  return {
    createSetGptPasswordExecutor,
  };
});
