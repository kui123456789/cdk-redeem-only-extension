(function attachMultiPageVerificationResendController(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MultiPageVerificationResendController = api;
})(typeof self !== 'undefined' ? self : globalThis, function createMultiPageVerificationResendControllerModule() {
  function createVerificationResendController(context = {}) {
    const constants = context.constants || {};
    const { DEFAULT_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS, MAX_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS, STEP4_ASSURIVO_RESEND_CONFIRM_TIMEOUT_MS, STEP4_ASSURIVO_EMPTY_FEED_WAIT_MS, POST_SUBMIT_CONFIRM_TIMEOUT_MS, POST_SUBMIT_CONFIRM_POLL_INTERVAL_MS, STEP4_STUCK_VERIFICATION_RESUBMIT_LIMIT } = constants;
    const chrome = context.chrome;
    const closeConflictingTabsForSource = context.closeConflictingTabsForSource;
    const CLOUDFLARE_TEMP_EMAIL_PROVIDER = context.CLOUDFLARE_TEMP_EMAIL_PROVIDER;
    const CLOUD_MAIL_PROVIDER = context.CLOUD_MAIL_PROVIDER;
    const FREEMAIL_PROVIDER = context.FREEMAIL_PROVIDER;
    const ICLOUD_API_PROVIDER = context.ICLOUD_API_PROVIDER;
    const MOEMAIL_PROVIDER = context.MOEMAIL_PROVIDER;
    const YYDSMAIL_PROVIDER = context.YYDSMAIL_PROVIDER;
    const OUTLOOK_EMAIL_PLUS_PROVIDER = context.OUTLOOK_EMAIL_PLUS_PROVIDER;
    const completeNodeFromBackground = context.completeNodeFromBackground;
    const confirmCustomVerificationStepBypassRequest = context.confirmCustomVerificationStepBypassRequest;
    const getHotmailVerificationPollConfig = context.getHotmailVerificationPollConfig;
    const getHotmailVerificationRequestTimestamp = context.getHotmailVerificationRequestTimestamp;
    const handleMail2925LimitReachedError = context.handleMail2925LimitReachedError;
    const getState = context.getState;
    const getTabId = context.getTabId;
    const HOTMAIL_PROVIDER = context.HOTMAIL_PROVIDER;
    const isMail2925LimitReachedError = context.isMail2925LimitReachedError;
    const isStopError = context.isStopError;
    const LUCKMAIL_PROVIDER = context.LUCKMAIL_PROVIDER;
    const MAIL_2925_VERIFICATION_INTERVAL_MS = context.MAIL_2925_VERIFICATION_INTERVAL_MS;
    const MAIL_2925_VERIFICATION_MAX_ATTEMPTS = context.MAIL_2925_VERIFICATION_MAX_ATTEMPTS;
    const pollCloudflareTempEmailVerificationCode = context.pollCloudflareTempEmailVerificationCode;
    const pollCloudMailVerificationCode = context.pollCloudMailVerificationCode;
    const pollFreemailVerificationCode = context.pollFreemailVerificationCode;
    const pollIcloudApiVerificationCode = context.pollIcloudApiVerificationCode;
    const pollMoemailVerificationCode = context.pollMoemailVerificationCode;
    const pollYydsMailVerificationCode = context.pollYydsMailVerificationCode;
    const pollOutlookEmailPlusVerificationCode = context.pollOutlookEmailPlusVerificationCode;
    const pollHotmailVerificationCode = context.pollHotmailVerificationCode;
    const pollLuckmailVerificationCode = context.pollLuckmailVerificationCode;
    const sendToContentScript = context.sendToContentScript;
    const sendToContentScriptResilient = context.sendToContentScriptResilient;
    const sendToMailContentScriptResilient = context.sendToMailContentScriptResilient;
    const setNodeStatus = context.setNodeStatus;
    const setState = context.setState;
    const sleepWithStop = context.sleepWithStop;
    const throwIfStopped = context.throwIfStopped;
    const VERIFICATION_POLL_MAX_ROUNDS = context.VERIFICATION_POLL_MAX_ROUNDS;
    const externalBuildVerificationPollPayload = context.buildVerificationPollPayload;
    const isRetryableVerificationTransportError = context.isRetryableVerificationTransportError;
    const getVerificationLogStepKey = typeof context.getVerificationLogStepKey === 'function'
      ? context.getVerificationLogStepKey
      : ((step) => {
        if (step === 4) return 'fetch-signup-code';
        if (step === 6) return 'set-gpt-password';
        if (step === 8) return 'fetch-login-code';
        return '';
      });
    let activeVerificationLogStep = null;

    function getActiveVerificationLogStep() {
      return activeVerificationLogStep;
    }

    function addLog(message, level = 'info', options = {}) {
      const nextOptions = options && typeof options === 'object' ? { ...options } : {};
      if (!nextOptions.step && activeVerificationLogStep) nextOptions.step = activeVerificationLogStep;
      if (!nextOptions.stepKey && nextOptions.step) {
        const stepKey = getVerificationLogStepKey(Number(nextOptions.step) || 0);
        if (stepKey) {
          nextOptions.stepKey = stepKey;
        }
      }
      return context.addLog(message, level, nextOptions);
    }
    const getNodeIdForStep = (...args) => context.getNodeIdForStep(...args);
    const isRetryableCustomEmailVerificationFetchError = (...args) => context.isRetryableCustomEmailVerificationFetchError(...args);
    const isAssurivoEmptyFeedVerificationFetchError = (...args) => context.isAssurivoEmptyFeedVerificationFetchError(...args);
    const normalizeCustomEmailVerificationUrl = (...args) => context.normalizeCustomEmailVerificationUrl(...args);
    const parseCustomEmailPoolEntryValue = (...args) => context.parseCustomEmailPoolEntryValue(...args);
    const getCustomEmailVerificationEntry = (...args) => context.getCustomEmailVerificationEntry(...args);
    const extractCustomEmailVerificationCode = (...args) => context.extractCustomEmailVerificationCode(...args);
    const buildAssurivoVerificationUrl = (...args) => context.buildAssurivoVerificationUrl(...args);
    const resolveMailPollingTimeouts = (...args) => context.resolveMailPollingTimeouts(...args);
    const fetchCustomEmailVerificationCode = (...args) => context.fetchCustomEmailVerificationCode(...args);

        function getVerificationCodeStateKey(step) {
          return step === 4 ? 'lastSignupCode' : 'lastLoginCode';
        }

        function getVerificationCodeLabel(step) {
          return step === 4 ? '注册' : '登录';
        }

        function normalizeSignupVerificationCodeWaitSeconds(value, fallback = DEFAULT_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS) {
          const rawValue = String(value ?? '').trim();
          const fallbackNumber = Number.parseInt(String(fallback ?? '').trim(), 10);
          const fallbackValue = Number.isFinite(fallbackNumber)
            ? Math.max(0, Math.min(MAX_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS, fallbackNumber))
            : DEFAULT_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS;
          if (!rawValue) {
            return fallbackValue;
          }
          const numeric = Number.parseInt(rawValue, 10);
          if (!Number.isFinite(numeric)) {
            return fallbackValue;
          }
          return Math.max(0, Math.min(MAX_SIGNUP_VERIFICATION_CODE_WAIT_SECONDS, numeric));
        }

        async function waitBeforeFetchingSignupVerificationCode(step, state = {}, attempt = 1, maxAttempts = 1, reason = '') {
          if (Number(step) !== 4) {
            return;
          }
          const waitSeconds = normalizeSignupVerificationCodeWaitSeconds(
            state?.setGptPasswordVerificationWaitSeconds ?? state?.signupVerificationCodeWaitSeconds
          );
          if (waitSeconds <= 0) {
            return;
          }
          const attemptText = attempt > 1
            ? `第 ${attempt}/${maxAttempts} 次取码前`
            : '首次取码前';
          const suffix = reason ? `，${reason}` : '';
          await addLog(`步骤 4：${attemptText}等待 ${waitSeconds} 秒${suffix}。`, 'info', {
            step: 4,
            stepKey: 'fetch-signup-code',
          });
          await sleepWithStop(waitSeconds * 1000);
        }

        function isLikelyLoggedInChatgptHomeUrl(rawUrl) {
          const url = String(rawUrl || '').trim();
          if (!url) return false;

          try {
            const parsed = new URL(url);
            const host = String(parsed.hostname || '').toLowerCase();
            if (!['chatgpt.com', 'www.chatgpt.com'].includes(host)) {
              return false;
            }
            const path = String(parsed.pathname || '');
            if (/^\/(?:auth\/|create-account\/|email-verification|log-in)(?:[/?#]|$)/i.test(path)) {
              return false;
            }
            return true;
          } catch {
            return false;
          }
        }

        function isSignupProfilePageUrl(rawUrl) {
          const url = String(rawUrl || '').trim();
          if (!url) return false;

          try {
            const parsed = new URL(url);
            const host = String(parsed.hostname || '').toLowerCase();
            if (!['auth.openai.com', 'auth0.openai.com', 'accounts.openai.com'].includes(host)) {
              return false;
            }
            return /\/(?:create-account\/profile|u\/signup\/profile|signup\/profile|about-you)(?:[/?#]|$)/i.test(String(parsed.pathname || ''));
          } catch {
            return false;
          }
        }

        function isPasskeyEnrollmentPageUrl(rawUrl) {
          const url = String(rawUrl || '').trim();
          if (!url) return false;

          try {
            const parsed = new URL(url);
            const host = String(parsed.hostname || '').toLowerCase();
            if (!['auth.openai.com', 'auth0.openai.com', 'accounts.openai.com'].includes(host)) {
              return false;
            }
            return /\/create-account-enroll-passkey(?:[/?#]|$)/i.test(String(parsed.pathname || ''));
          } catch {
            return false;
          }
        }

        function isStep4PendingVerificationSubmitResult(result = {}) {
          if (!result?.invalidCode) {
            return false;
          }
          const text = String(result.errorText || '').trim();
          return /提交后仍停留在验证码页面|仍停留在验证码页面|still\s+on\s+(?:the\s+)?verification/i.test(text)
            && !/代码不正确|验证码不正确|验证码错误|不正确|错误|invalid|incorrect|try\s+again/i.test(text);
        }

        async function detectStep4PostSubmitFallback(tabId, options = {}) {
          const timeoutMs = Math.max(1000, Number(options.timeoutMs) || POST_SUBMIT_CONFIRM_TIMEOUT_MS);
          const pollIntervalMs = Math.max(100, Number(options.pollIntervalMs) || POST_SUBMIT_CONFIRM_POLL_INTERVAL_MS);
          const startedAt = Date.now();
          let lastUrl = '';

          const inspectContentState = async () => {
            const requestTimeoutMs = Math.max(1200, Math.min(5000, timeoutMs));
            const request = {
              type: 'GET_SIGNUP_VERIFICATION_POST_SUBMIT_STATE',
              source: 'background',
              payload: {},
            };
            if (typeof sendToContentScriptResilient === 'function') {
              return sendToContentScriptResilient('signup-page', request, {
                timeoutMs: requestTimeoutMs,
                responseTimeoutMs: requestTimeoutMs,
                retryDelayMs: 400,
                logMessage: '步骤 4：验证码提交后页面正在切换，等待页面恢复并确认注册状态...',
                logStep: 4,
                logStepKey: 'fetch-signup-code',
              });
            }
            return sendToContentScript('signup-page', request, {
              responseTimeoutMs: requestTimeoutMs,
            });
          };

          while (Date.now() - startedAt < timeoutMs) {
            throwIfStopped();
            try {
              const tab = await chrome.tabs.get(tabId);
              const currentUrl = String(tab?.url || '').trim();
              if (currentUrl) {
                lastUrl = currentUrl;
              }

              try {
                const pageState = await inspectContentState();
                if (pageState?.url) {
                  lastUrl = pageState.url;
                }
                if (pageState?.maxCheckAttemptsBlocked) {
                  throw new Error('CF_SECURITY_BLOCKED::您已触发 OpenAI 认证页试行次数限制（max_check_attempts / 試行回数が多すぎます），已完全停止流程；请等待 15-30 分钟后再继续，不要反复点击“重试”。');
                }
                if (pageState?.userAlreadyExistsBlocked) {
                  throw new Error('SIGNUP_USER_ALREADY_EXISTS::步骤 4：检测到 user_already_exists，说明当前用户已存在，当前轮将直接停止。');
                }
                if (pageState?.invalidCode) {
                  return {
                    success: false,
                    reason: 'invalid_code',
                    invalidCode: true,
                    errorText: pageState.errorText || '验证码被拒绝。',
                    url: pageState.url || currentUrl,
                  };
                }
                if (pageState?.successState === 'logged_in_home') {
                  return {
                    success: true,
                    reason: 'chatgpt_home',
                    skipProfileStep: true,
                    url: pageState.url || currentUrl,
                  };
                }
                if (pageState?.successState === 'step5') {
                  return {
                    success: true,
                    reason: 'signup_profile',
                    skipProfileStep: false,
                    url: pageState.url || currentUrl,
                  };
                }
                if (pageState?.successState === 'passkey_enrollment') {
                  return {
                    success: true,
                    reason: 'passkey_enrollment',
                    passkeyEnrollmentRequired: true,
                    skipProfileStep: false,
                    url: pageState.url || currentUrl,
                  };
                }
              } catch (contentStateError) {
                const message = String(contentStateError?.message || contentStateError || '').trim();
                if (/^(?:CF_SECURITY_BLOCKED::|SIGNUP_USER_ALREADY_EXISTS::)/i.test(message)) {
                  throw contentStateError;
                }
              }

              if (isLikelyLoggedInChatgptHomeUrl(currentUrl)) {
                return {
                  success: true,
                  reason: 'chatgpt_home',
                  skipProfileStep: true,
                  url: currentUrl,
                };
              }

              if (isSignupProfilePageUrl(currentUrl)) {
                return {
                  success: true,
                  reason: 'signup_profile',
                  skipProfileStep: false,
                  url: currentUrl,
                };
              }

              if (isPasskeyEnrollmentPageUrl(currentUrl)) {
                return {
                  success: true,
                  reason: 'passkey_enrollment',
                  passkeyEnrollmentRequired: true,
                  skipProfileStep: false,
                  url: currentUrl,
                };
              }

            } catch (error) {
              const message = String(error?.message || error || '').trim();
              if (/^(?:CF_SECURITY_BLOCKED::|SIGNUP_USER_ALREADY_EXISTS::)/i.test(message)) {
                throw error;
              }
              // Keep polling until timeout; tab may be mid-navigation.
            }

            await sleepWithStop(pollIntervalMs);
          }

          return {
            success: false,
            reason: 'unknown',
            skipProfileStep: false,
            url: lastUrl,
          };
        }

        function getStep4FallbackLabel(fallback = {}) {
          switch (fallback.reason) {
            case 'chatgpt_home':
              return 'ChatGPT 已登录首页';
            case 'signup_profile':
              return '注册资料页';
            case 'passkey_enrollment':
              return '通行密钥页';
            default:
              return '后续页面';
          }
        }

        function buildStep4FallbackSubmitSuccess(fallback = {}) {
          return {
            success: true,
            assumed: true,
            transportRecovered: true,
            passkeyEnrollmentRequired: Boolean(fallback.passkeyEnrollmentRequired),
            skipProfileStep: Boolean(fallback.skipProfileStep),
            url: fallback.url || '',
          };
        }

        async function detectStep8PostSubmitFallback(options = {}) {
          const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 9000);
          const pollIntervalMs = Math.max(100, Number(options.pollIntervalMs) || 300);
          const step = Number(options.step) || 8;
          const startedAt = Date.now();
          let lastSnapshot = null;

          while (Date.now() - startedAt < timeoutMs) {
            throwIfStopped();
            try {
              const request = {
                type: 'GET_LOGIN_AUTH_STATE',
                source: 'background',
                payload: {},
              };
              const requestTimeoutMs = Math.max(1200, Math.min(5000, timeoutMs));
              const result = typeof sendToContentScriptResilient === 'function'
                ? await sendToContentScriptResilient(
                  'signup-page',
                  request,
                  {
                    timeoutMs: requestTimeoutMs,
                    responseTimeoutMs: requestTimeoutMs,
                    retryDelayMs: 400,
                    logMessage: `步骤 ${step}：验证码提交后页面正在切换，等待页面恢复并确认授权状态...`,
                  }
                )
                : await sendToContentScript('signup-page', request, {
                  responseTimeoutMs: requestTimeoutMs,
                });

              if (result?.error) {
                throw new Error(result.error);
              }

              const authState = String(result?.state || '').trim();
              const authUrl = String(result?.url || '').trim();
              const verificationErrorText = String(result?.verificationErrorText || '').trim();
              lastSnapshot = {
                state: authState || 'unknown',
                url: authUrl,
              };

              if (authState === 'verification_page' && verificationErrorText) {
                return {
                  success: false,
                  reason: 'invalid_code',
                  invalidCode: true,
                  errorText: verificationErrorText,
                  url: authUrl,
                };
              }
              if (authState === 'oauth_consent_page') {
                return {
                  success: true,
                  reason: 'oauth_consent_page',
                  url: authUrl,
                };
              }
              if (authState === 'login_timeout_error_page') {
                return {
                  success: false,
                  reason: 'login_timeout_error_page',
                  restartStep7: true,
                  url: authUrl,
                };
              }
            } catch (_) {
              // Ignore transient inspect failures and keep polling.
            }

            await sleepWithStop(pollIntervalMs);
          }

          return {
            success: false,
            reason: 'unknown',
            snapshot: lastSnapshot,
          };
        }

        function getVerificationResendStateKey() {
          return 'verificationResendCount';
        }

        function normalizeVerificationResendCount(value, fallback = 0) {
          const numeric = Number(value);
          if (!Number.isFinite(numeric)) {
            return Math.max(0, Math.floor(Number(fallback) || 0));
          }

          return Math.min(20, Math.max(0, Math.floor(numeric)));
        }

        function getVerificationRequestedAtStateKey(step) {
          if (Number(step) === 4) return 'signupVerificationRequestedAt';
          if (Number(step) === 8) return 'loginVerificationRequestedAt';
          return '';
        }

        function normalizeVerificationRequestedAtCandidate(value) {
          const numeric = Number(value);
          if (!Number.isFinite(numeric) || numeric <= 0) {
            return 0;
          }
          const timestamp = Math.floor(numeric);
          const now = Date.now();
          if (timestamp > now + 30000) {
            return now;
          }
          return timestamp;
        }

        function resolveInitialVerificationRequestedAt(step, state = {}, fallback = 0) {
          const stateKey = getVerificationRequestedAtStateKey(step);
          const candidateValues = [
            fallback,
            stateKey ? state?.[stateKey] : 0,
          ];

          for (const value of candidateValues) {
            const timestamp = normalizeVerificationRequestedAtCandidate(value);
            if (timestamp > 0) {
              return timestamp;
            }
          }
          return 0;
        }

        function getLegacyVerificationResendCountDefault(step, options = {}) {
          const requestFreshCodeFirst = Boolean(options.requestFreshCodeFirst);
          const legacyMaxRounds = Math.max(1, Math.floor(Number(VERIFICATION_POLL_MAX_ROUNDS) || 1));
          if (step === 4 && requestFreshCodeFirst) {
            return legacyMaxRounds;
          }
          return Math.max(0, legacyMaxRounds - 1);
        }

        function getConfiguredVerificationResendCount(step, state, options = {}) {
          const stateKey = getVerificationResendStateKey(step);
          const configuredValue = state?.[stateKey] !== undefined
            ? state[stateKey]
            : (state?.signupVerificationResendCount ?? state?.loginVerificationResendCount);
          return normalizeVerificationResendCount(
            configuredValue,
            getLegacyVerificationResendCountDefault(step, options)
          );
        }

        function resolveMaxResendRequests(pollOverrides = {}) {
          if (pollOverrides.maxResendRequests !== undefined) {
            return normalizeVerificationResendCount(pollOverrides.maxResendRequests, 0);
          }

          const legacyMaxRounds = Number(pollOverrides.maxRounds);
          if (Number.isFinite(legacyMaxRounds)) {
            return Math.max(0, Math.floor(legacyMaxRounds) - 1);
          }

          return Math.max(0, Math.floor(Number(VERIFICATION_POLL_MAX_ROUNDS) || 1) - 1);
        }

        function getCompletionStep(step, options = {}) {
          const completionStep = Number(options.completionStep);
          return Number.isFinite(completionStep) && completionStep > 0 ? completionStep : step;
        }

        async function confirmCustomVerificationStepBypass(step, options = {}) {
          const completionStep = getCompletionStep(step, options);
          const promptStep = getCompletionStep(step, { completionStep: options.promptStep ?? completionStep });
          const verificationLabel = getVerificationCodeLabel(step);
          await addLog(`步骤 ${completionStep}：当前为自定义邮箱模式，请手动在页面中输入${verificationLabel}验证码并进入下一页面。`, 'warn');

          let response = null;
          try {
            response = await confirmCustomVerificationStepBypassRequest(promptStep);
          } catch {
            throw new Error(`步骤 ${completionStep}：无法打开确认弹窗，请先保持侧边栏打开后重试。`);
          }

          if (response?.error) {
            throw new Error(response.error);
          }
          if (!response?.confirmed) {
            throw new Error(`步骤 ${completionStep}：已取消手动${verificationLabel}验证码确认。`);
          }

          await setState({
            lastEmailTimestamp: null,
            signupVerificationRequestedAt: null,
            loginVerificationRequestedAt: null,
          });
          const completionNodeId = await getNodeIdForStep(completionStep);
          if (!completionNodeId) {
            throw new Error(`步骤 ${completionStep} 未映射到验证码节点。`);
          }
          await setNodeStatus(completionNodeId, 'skipped');
          await addLog(`步骤 ${completionStep}：已确认手动完成${verificationLabel}验证码输入，当前步骤已跳过。`, 'warn');
        }

        function getVerificationPollPayload(step, state, overrides = {}) {
          if (typeof externalBuildVerificationPollPayload === 'function') {
            return externalBuildVerificationPollPayload(step, state, overrides);
          }
          const normalizedStep = Number(step) === 4 ? 4 : 8;
          const is2925Provider = state?.mailProvider === '2925';
          const mail2925MatchTargetEmail = is2925Provider
            && String(state?.mail2925Mode || '').trim().toLowerCase() === 'receive';
          return {
            flowId: String(state?.activeFlowId || '').trim(),
            step: normalizedStep,
            filterAfterTimestamp: is2925Provider ? 0 : getHotmailVerificationRequestTimestamp(normalizedStep, state),
            senderFilters: [],
            subjectFilters: [],
            requiredKeywords: [],
            codePatterns: [],
            targetEmail: normalizedStep === 4
              ? state.email
              : (String(state?.step8VerificationTargetEmail || '').trim() || state.email),
            targetEmailHints: [],
            mail2925MatchTargetEmail,
            maxAttempts: is2925Provider ? MAIL_2925_VERIFICATION_MAX_ATTEMPTS : 5,
            intervalMs: is2925Provider ? MAIL_2925_VERIFICATION_INTERVAL_MS : 3000,
            ...overrides,
          };
        }

        async function getRemainingTimeBudgetMs(step, options = {}, actionLabel = '') {
          const resolver = typeof options.getRemainingTimeMs === 'function'
            ? options.getRemainingTimeMs
            : null;
          if (!resolver) {
            return null;
          }

          const value = await resolver({ step, actionLabel });
          const numeric = Number(value);
          if (!Number.isFinite(numeric)) {
            return null;
          }

          return Math.max(0, Math.floor(numeric));
        }

        async function getResponseTimeoutMsForStep(step, options = {}, fallbackMs = 30000, actionLabel = '') {
          const remainingMs = await getRemainingTimeBudgetMs(step, options, actionLabel);
          const fallbackTimeoutMs = Math.max(1000, Number(fallbackMs) || 1000);
          const minResponseTimeoutMs = Math.min(
            fallbackTimeoutMs,
            Math.max(1000, Number(options.minResponseTimeoutMs) || 1000)
          );
          if (remainingMs === null) {
            return Math.max(minResponseTimeoutMs, fallbackTimeoutMs);
          }

          return Math.max(minResponseTimeoutMs, Math.min(fallbackTimeoutMs, remainingMs));
        }

        async function applyMailPollingTimeBudget(step, payload, options = {}, actionLabel = '') {
          const nextPayload = { ...payload };
          const intervalMs = Math.max(1, Number(nextPayload.intervalMs) || 3000);
          const baseMaxAttempts = Math.max(1, Number(nextPayload.maxAttempts) || 1);
          const disableTimeBudgetCap = Boolean(options.disableTimeBudgetCap);
          const remainingMs = await getRemainingTimeBudgetMs(step, options, actionLabel);
          const minPollingResponseTimeoutMs = Math.max(
            3000,
            Number(options.minPollingResponseTimeoutMs) || 5000
          );

          if (!disableTimeBudgetCap && remainingMs !== null) {
            nextPayload.maxAttempts = Math.max(
              1,
              Math.min(baseMaxAttempts, Math.floor(Math.max(0, remainingMs - 1000) / intervalMs) + 1)
            );
          }

          const defaultResponseTimeoutMs = Math.max(45000, nextPayload.maxAttempts * intervalMs + 25000);
          const responseTimeoutMs = disableTimeBudgetCap || remainingMs === null
            ? defaultResponseTimeoutMs
            : Math.max(
              minPollingResponseTimeoutMs,
              Math.min(defaultResponseTimeoutMs, remainingMs)
            );

          return {
            payload: nextPayload,
            responseTimeoutMs,
            timeoutMs: responseTimeoutMs,
          };
        }

        async function requestVerificationCodeResend(step, options = {}) {
          throwIfStopped();
          const signupTabId = await getTabId('signup-page');
          if (!signupTabId) {
            throw new Error('认证页面标签页已关闭，无法重新请求验证码。');
          }

          throwIfStopped();
          await chrome.tabs.update(signupTabId, { active: true });
          throwIfStopped();

          const result = await sendToContentScript('signup-page', {
            type: 'RESEND_VERIFICATION_CODE',
            step,
            source: 'background',
            payload: {},
          }, {
            responseTimeoutMs: await getResponseTimeoutMsForStep(
              step,
              options,
              30000,
              `重新发送${getVerificationCodeLabel(step)}验证码`
            ),
          });

          if (result && result.error) {
            throw new Error(result.error);
          }

          await addLog(`步骤 ${step}：已请求新的${getVerificationCodeLabel(step)}验证码。`, 'warn');

          const requestedAt = Date.now();
          if (step === 4) {
            await setState({ signupVerificationRequestedAt: requestedAt });
          }
          if (step === 8) {
            await setState({ loginVerificationRequestedAt: requestedAt });
          }

          const currentState = await getState();
          if (currentState.mailProvider === '2925') {
            const mailTabId = await getTabId('mail-2925');
            if (mailTabId) {
              await chrome.tabs.update(mailTabId, { active: true });
              await addLog(`步骤 ${step}：已切换到 2925 邮箱标签页等待新邮件。`, 'info');
            }
          }

          return requestedAt;
        }

        function shouldPreclear2925Mailbox(step, mail, options = {}) {
          if (mail?.provider !== '2925' || (step !== 4 && step !== 8)) {
            return false;
          }

          return !(Number(options.filterAfterTimestamp) > 0);
        }

        async function clear2925MailboxBeforePolling(step, mail, options = {}) {
          if (!shouldPreclear2925Mailbox(step, mail, options)) {
            return;
          }

          throwIfStopped();
          await addLog(`步骤 ${step}：开始刷新 2925 邮箱前先清空全部邮件，避免读取旧验证码邮件。`, 'warn');

          try {
            const responseTimeoutMs = await getResponseTimeoutMsForStep(
              step,
              options,
              15000,
              '清空 2925 邮箱历史邮件'
            );
            const result = await sendToMailContentScriptResilient(
              mail,
              {
                type: 'DELETE_ALL_EMAILS',
                step,
                source: 'background',
                payload: {},
              },
              {
                timeoutMs: responseTimeoutMs,
                responseTimeoutMs,
                maxRecoveryAttempts: 2,
                logStep: activeVerificationLogStep,
                logStepKey: getVerificationLogStepKey(Number(activeVerificationLogStep) || step),
              }
            );

            if (result?.error) {
              throw new Error(result.error);
            }

            if (result?.deleted === false) {
              await addLog(`步骤 ${step}：未能确认 2925 邮箱已清空，将继续刷新等待新邮件。`, 'warn');
              return;
            }

            await addLog(`步骤 ${step}：2925 邮箱已预先清空，开始刷新等待新邮件。`, 'info');
          } catch (err) {
            if (isStopError(err)) {
              throw err;
            }
            await addLog(`步骤 ${step}：预清空 2925 邮箱失败，将继续刷新等待新邮件：${err.message}`, 'warn');
          }
        }

        async function closeIcloudMailboxTabAfterSuccess(step, mail) {
          if (mail?.source !== 'icloud-mail') {
            return;
          }

          const tabId = typeof getTabId === 'function'
            ? await getTabId(mail.source)
            : null;

          if (Number.isInteger(tabId)) {
            await chrome.tabs.remove(tabId).catch(() => {});
            await addLog(`步骤 ${step}：已关闭 iCloud 邮箱标签页，避免长期累积。`, 'info');
            return;
          }

          if (typeof closeConflictingTabsForSource === 'function' && mail.url) {
            await closeConflictingTabsForSource(mail.source, mail.url).catch(() => {});
          }
        }

        function triggerPostSuccessMailboxCleanup(step, mail) {
          if (mail?.provider !== '2925' && mail?.source !== 'icloud-mail') {
            return;
          }

          Promise.resolve().then(async () => {
            try {
              if (mail?.source === 'icloud-mail') {
                await closeIcloudMailboxTabAfterSuccess(step, mail);
                return;
              }

              await sendToMailContentScriptResilient(
                mail,
                {
                  type: 'DELETE_ALL_EMAILS',
                  step,
                  source: 'background',
                  payload: {},
                },
                {
                  timeoutMs: 10000,
                  responseTimeoutMs: 5000,
                  maxRecoveryAttempts: 1,
                  logStep: activeVerificationLogStep,
                  logStepKey: getVerificationLogStepKey(Number(activeVerificationLogStep) || step),
                }
              );
            } catch (_) {
              // Best-effort cleanup only.
            }
          });
        }

        async function pollFreshVerificationCodeWithResendInterval(step, state, mail, pollOverrides = {}) {
          const stateKey = getVerificationCodeStateKey(step);
          const rejectedCodes = new Set();
          if (state[stateKey]) {
            rejectedCodes.add(state[stateKey]);
          }
          for (const code of (pollOverrides.excludeCodes || [])) {
            if (code) rejectedCodes.add(code);
          }

          const {
            maxRounds: _ignoredMaxRounds,
            maxResendRequests: _ignoredMaxResendRequests,
            resendIntervalMs: _ignoredResendIntervalMs,
            lastResendAt: _ignoredLastResendAt,
            onResendRequestedAt: _ignoredOnResendRequestedAt,
            ...payloadOverrides
          } = pollOverrides;
          const onResendRequestedAt = typeof pollOverrides.onResendRequestedAt === 'function'
            ? pollOverrides.onResendRequestedAt
            : null;
          let lastError = null;
          let filterAfterTimestamp = payloadOverrides.filterAfterTimestamp ?? getVerificationPollPayload(step, state).filterAfterTimestamp;
          const maxResendRequests = resolveMaxResendRequests(pollOverrides);
          const totalRounds = maxResendRequests + 1;
          const maxRounds = totalRounds;
          const resendIntervalMs = Math.max(0, Number(pollOverrides.resendIntervalMs) || 0);
          let lastResendAt = Number(pollOverrides.lastResendAt) || 0;
          let usedResendRequests = 0;
          let pollOnlyNoResendRounds = 0;
          let transportErrorStreak = 0;
          const maxTransportErrorStreak = mail?.source === 'icloud-mail' ? 6 : 4;
          const maxIcloudNoResendRounds = mail?.source === 'icloud-mail' ? 4 : 0;
          const hasExistingResendTimestamp = Number(lastResendAt) > 0;
          const initialRoundNoResendWindowMs = resendIntervalMs > 0
            ? Math.max(10000, Math.min(45000, resendIntervalMs))
            : 0;
          const initialRoundNoResendUntil = hasExistingResendTimestamp
            ? 0
            : (initialRoundNoResendWindowMs > 0 ? (Date.now() + initialRoundNoResendWindowMs) : 0);

          for (let round = 1; round <= totalRounds; round++) {
            throwIfStopped();
            if (round === 1 && initialRoundNoResendUntil > 0) {
              const waitSeconds = Math.max(1, Math.ceil((initialRoundNoResendUntil - Date.now()) / 1000));
              await addLog(
                `步骤 ${step}：首次进入验证码轮询，先等待 ${waitSeconds} 秒观察新邮件，避免过早重复重发。`,
                'info'
              );
            }
            if (round > 1) {
              lastResendAt = await requestVerificationCodeResend(step, pollOverrides);
              usedResendRequests += 1;
              if (onResendRequestedAt) {
                const nextFilterAfterTimestamp = await onResendRequestedAt(lastResendAt);
                if (nextFilterAfterTimestamp !== undefined) {
                  filterAfterTimestamp = nextFilterAfterTimestamp;
                }
              }
            }

            while (true) {
              throwIfStopped();
              const payload = getVerificationPollPayload(step, state, {
                ...payloadOverrides,
                filterAfterTimestamp,
                excludeCodes: [...rejectedCodes],
              });

              if (lastResendAt > 0) {
                const remainingBeforeResendMs = Math.max(0, resendIntervalMs - (Date.now() - lastResendAt));
                const baseMaxAttempts = Math.max(1, Number(payload.maxAttempts) || 5);
                const intervalMs = Math.max(1, Number(payload.intervalMs) || 3000);
                payload.maxAttempts = Math.max(1, Math.min(baseMaxAttempts, Math.floor(remainingBeforeResendMs / intervalMs) + 1));
              }

              try {
                const timedPoll = await applyMailPollingTimeBudget(
                  step,
                  payload,
                  pollOverrides,
                  `轮询${getVerificationCodeLabel(step)}验证码邮箱`
                );
                const timeoutWindow = resolveMailPollingTimeouts(mail, timedPoll);
                const result = await sendToMailContentScriptResilient(
                  mail,
                  {
                    type: 'POLL_EMAIL',
                    step,
                    source: 'background',
                    payload: timeoutWindow.payload,
                  },
                  {
                    timeoutMs: timeoutWindow.timeoutMs,
                    maxRecoveryAttempts: 2,
                    responseTimeoutMs: timeoutWindow.responseTimeoutMs,
                    logStep: activeVerificationLogStep,
                    logStepKey: getVerificationLogStepKey(Number(activeVerificationLogStep) || step),
                  }
                );

                if (result && result.error) {
                  throw new Error(result.error);
                }

                if (!result || !result.code) {
                  throw new Error(`步骤 ${step}：邮箱轮询结束，但未获取到验证码。`);
                }

                if (rejectedCodes.has(result.code)) {
                  throw new Error(`步骤 ${step}：再次收到了相同的${getVerificationCodeLabel(step)}验证码：${result.code}`);
                }

                transportErrorStreak = 0;

                return {
                  ...result,
                  lastResendAt,
                  remainingResendRequests: Math.max(0, maxResendRequests - usedResendRequests),
                };
              } catch (err) {
                if (isStopError(err)) {
                  throw err;
                }
                if (mail?.provider === '2925' && typeof isMail2925LimitReachedError === 'function' && isMail2925LimitReachedError(err)) {
                  if (typeof handleMail2925LimitReachedError === 'function') {
                    throw await handleMail2925LimitReachedError(step, err);
                  }
                  throw err;
                }
                const isTransportError = isRetryableVerificationTransportError(err);
                if (isTransportError) {
                  transportErrorStreak += 1;
                  lastError = err;
                  await addLog(`步骤 ${step}：${err.message}`, 'warn');
                  if (transportErrorStreak >= maxTransportErrorStreak) {
                    throw new Error(
                      `步骤 ${step}：${mail?.label || '邮箱'}页面通信异常连续 ${transportErrorStreak} 次，已停止当前轮询以避免重复重发验证码。最后错误：${err.message}`
                    );
                  }
                  const fallbackIntervalMs = Math.max(
                    800,
                    Math.min(
                      3000,
                      Number(payloadOverrides.intervalMs)
                        || Number(pollOverrides.intervalMs)
                        || 2000
                    )
                  );
                  await sleepWithStop(fallbackIntervalMs);
                  continue;
                }
                transportErrorStreak = 0;
                lastError = err;
                await addLog(`步骤 ${step}：${err.message}`, 'warn');
              }

              if (mail?.source === 'icloud-mail' && maxIcloudNoResendRounds > 0) {
                pollOnlyNoResendRounds += 1;
                if (pollOnlyNoResendRounds >= maxIcloudNoResendRounds) {
                  throw new Error(
                    `步骤 ${step}：iCloud 邮箱连续 ${pollOnlyNoResendRounds} 轮轮询均未拿到验证码且未触发重发，已停止当前链路以避免空轮询循环，请刷新邮箱页后重试。`
                  );
                }
              }

              const remainingBeforeResendMs = lastResendAt > 0
                ? Math.max(0, resendIntervalMs - (Date.now() - lastResendAt))
                : 0;
              const initialCooldownMs = (round === 1 && initialRoundNoResendUntil > 0)
                ? Math.max(0, initialRoundNoResendUntil - Date.now())
                : 0;
              const effectiveCooldownMs = Math.max(remainingBeforeResendMs, initialCooldownMs);
              if (effectiveCooldownMs > 0) {
                await addLog(
                  `步骤 ${step}：距离下次重新发送验证码还差 ${Math.ceil(effectiveCooldownMs / 1000)} 秒，继续刷新邮箱（第 ${round}/${maxRounds} 轮）...`,
                  'info'
                );
                const configuredIntervalMs = Math.max(
                  1,
                  Number(payloadOverrides.intervalMs)
                    || Number(pollOverrides.intervalMs)
                    || 3000
                );
                const cooldownSleepMs = Math.min(
                  effectiveCooldownMs,
                  Math.max(1000, Math.min(configuredIntervalMs, 3000))
                );
                await sleepWithStop(cooldownSleepMs);
                continue;
              }

              if (round < maxRounds) {
                await addLog(`步骤 ${step}：已到 25 秒重发间隔，准备重新发送验证码（第 ${round + 1}/${maxRounds} 轮）...`, 'warn');
              }
              break;
            }
          }

          throw lastError || new Error(`步骤 ${step}：无法获取新的${getVerificationCodeLabel(step)}验证码。`);
        }

        function shouldRequestLuckmailResendBeforeRetry(error) {
          const message = String(error?.message || error || '');
          if (!message) {
            return true;
          }

          return !/没有可用 token|token 对应邮箱与当前邮箱不一致/i.test(message);
        }

        async function pollLuckmailVerificationCodeWithResend(step, state, pollOverrides = {}) {
          const {
            onResendRequestedAt,
            maxRounds: _ignoredMaxRounds,
            maxResendRequests: _ignoredMaxResendRequests,
            initialPollMaxAttempts: _ignoredInitialPollMaxAttempts,
            pollAttemptPlan: _ignoredPollAttemptPlan,
            ...cleanPollOverrides
          } = pollOverrides;
          const basePayload = {
            ...getVerificationPollPayload(step, state),
            ...cleanPollOverrides,
          };
          const maxAttempts = Math.max(1, Number(basePayload.maxAttempts) || 1);
          const intervalMs = Math.max(15000, Number(basePayload.intervalMs) || 15000);
          let lastError = null;

          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            throwIfStopped();
            try {
              return await pollLuckmailVerificationCode(step, state, {
                ...basePayload,
                maxAttempts: 1,
                intervalMs,
              });
            } catch (err) {
              if (isStopError(err)) {
                throw err;
              }

              lastError = err;
              const canRetry = attempt < maxAttempts;
              if (!canRetry) {
                break;
              }

              if (shouldRequestLuckmailResendBeforeRetry(err)) {
                try {
                  await requestVerificationCodeResend(step, pollOverrides);
                } catch (resendError) {
                  if (isStopError(resendError)) {
                    throw resendError;
                  }
                  await addLog(`步骤 ${step}：LuckMail 点击重新发送验证码失败：${resendError.message}，仍将在 ${Math.ceil(intervalMs / 1000)} 秒后继续轮询 /code 接口。`, 'warn');
                }
              }

              await addLog(`步骤 ${step}：LuckMail 暂未获取到新的${getVerificationCodeLabel(step)}验证码，等待 ${Math.ceil(intervalMs / 1000)} 秒后继续轮询 /code 接口（${attempt + 1}/${maxAttempts}）...`, 'warn');
              await sleepWithStop(intervalMs);
            }
          }

          throw lastError || new Error(`步骤 ${step}：无法获取新的${getVerificationCodeLabel(step)}验证码。`);
        }

        async function pollFreshVerificationCode(step, state, mail, pollOverrides = {}) {
          const {
            onResendRequestedAt,
            maxRounds: _ignoredMaxRounds,
            maxResendRequests: _ignoredMaxResendRequests,
            initialPollMaxAttempts: _ignoredInitialPollMaxAttempts,
            pollAttemptPlan: _ignoredPollAttemptPlan,
            ...cleanPollOverrides
          } = pollOverrides;

          if (mail.provider === HOTMAIL_PROVIDER) {
            const hotmailPollConfig = getHotmailVerificationPollConfig(step);
            const timedPoll = await applyMailPollingTimeBudget(step, {
              ...getVerificationPollPayload(step, state),
              ...hotmailPollConfig,
              ...cleanPollOverrides,
            }, cleanPollOverrides, `轮询${getVerificationCodeLabel(step)}验证码邮箱`);
            return pollHotmailVerificationCode(step, state, timedPoll.payload);
          }
          if (mail.provider === LUCKMAIL_PROVIDER) {
            const timedPoll = await applyMailPollingTimeBudget(step, {
              ...getVerificationPollPayload(step, state),
              ...cleanPollOverrides,
            }, cleanPollOverrides, `轮询${getVerificationCodeLabel(step)}验证码邮箱`);
            return pollLuckmailVerificationCodeWithResend(step, state, {
              ...cleanPollOverrides,
              ...timedPoll.payload,
              onResendRequestedAt,
            });
          }
          if (mail.provider === CLOUDFLARE_TEMP_EMAIL_PROVIDER) {
            const timedPoll = await applyMailPollingTimeBudget(step, {
              ...getVerificationPollPayload(step, state),
              ...cleanPollOverrides,
            }, cleanPollOverrides, `轮询${getVerificationCodeLabel(step)}验证码邮箱`);
            return pollCloudflareTempEmailVerificationCode(step, state, timedPoll.payload);
          }
          if (mail.provider === CLOUD_MAIL_PROVIDER) {
            const timedPoll = await applyMailPollingTimeBudget(step, {
              ...getVerificationPollPayload(step, state),
              ...cleanPollOverrides,
            }, cleanPollOverrides, `轮询${getVerificationCodeLabel(step)}验证码邮箱`);
            return pollCloudMailVerificationCode(step, state, timedPoll.payload);
          }
          if (mail.provider === FREEMAIL_PROVIDER) {
            const timedPoll = await applyMailPollingTimeBudget(step, {
              ...getVerificationPollPayload(step, state),
              ...cleanPollOverrides,
            }, cleanPollOverrides, `轮询${getVerificationCodeLabel(step)}验证码邮箱`);
            return pollFreemailVerificationCode(step, state, timedPoll.payload);
          }
          if (mail.provider === MOEMAIL_PROVIDER) {
            const timedPoll = await applyMailPollingTimeBudget(step, {
              ...getVerificationPollPayload(step, state),
              ...cleanPollOverrides,
            }, cleanPollOverrides, `轮询${getVerificationCodeLabel(step)}验证码邮箱`);
            return pollMoemailVerificationCode(step, state, timedPoll.payload);
          }
          if (mail.provider === YYDSMAIL_PROVIDER) {
            const timedPoll = await applyMailPollingTimeBudget(step, {
              ...getVerificationPollPayload(step, state),
              ...cleanPollOverrides,
            }, cleanPollOverrides, `轮询${getVerificationCodeLabel(step)}验证码邮箱`);
            return pollYydsMailVerificationCode(step, state, timedPoll.payload);
          }
          if (mail.provider === ICLOUD_API_PROVIDER) {
            const timedPoll = await applyMailPollingTimeBudget(step, {
              ...getVerificationPollPayload(step, state),
              ...cleanPollOverrides,
            }, cleanPollOverrides, `轮询${getVerificationCodeLabel(step)}验证码邮箱`);
            return pollIcloudApiVerificationCode(step, state, timedPoll.payload);
          }
          if (mail.provider === OUTLOOK_EMAIL_PLUS_PROVIDER) {
            const timedPoll = await applyMailPollingTimeBudget(step, {
              ...getVerificationPollPayload(step, state),
              ...cleanPollOverrides,
            }, cleanPollOverrides, `轮询${getVerificationCodeLabel(step)}验证码邮箱`);
            return pollOutlookEmailPlusVerificationCode(step, state, timedPoll.payload);
          }

          if (Number(pollOverrides.resendIntervalMs) > 0) {
            return pollFreshVerificationCodeWithResendInterval(step, state, mail, pollOverrides);
          }

          const stateKey = getVerificationCodeStateKey(step);
          const rejectedCodes = new Set();
          if (state[stateKey]) {
            rejectedCodes.add(state[stateKey]);
          }
          for (const code of (pollOverrides.excludeCodes || [])) {
            if (code) rejectedCodes.add(code);
          }

          let lastError = null;
          let filterAfterTimestamp = cleanPollOverrides.filterAfterTimestamp ?? getVerificationPollPayload(step, state).filterAfterTimestamp;
          const maxResendRequests = resolveMaxResendRequests(pollOverrides);
          const maxRounds = maxResendRequests + 1;
          const initialPollMaxAttempts = Math.max(0, Math.floor(Number(pollOverrides.initialPollMaxAttempts) || 0));
          const configuredPollAttemptPlan = Array.isArray(pollOverrides.pollAttemptPlan)
            ? pollOverrides.pollAttemptPlan
              .map((value) => Math.floor(Number(value) || 0))
              .filter((value) => value > 0)
            : [];
          const pollAttemptPlan = rejectedCodes.size > 0 ? [] : configuredPollAttemptPlan;
          let usedResendRequests = 0;

          for (let round = 1; round <= maxRounds; round++) {
            throwIfStopped();
            if (round > 1) {
              const requestedAt = await requestVerificationCodeResend(step, pollOverrides);
              usedResendRequests += 1;
              if (typeof onResendRequestedAt === 'function') {
                const nextFilterAfterTimestamp = await onResendRequestedAt(requestedAt);
                if (nextFilterAfterTimestamp !== undefined) {
                  filterAfterTimestamp = nextFilterAfterTimestamp;
                }
              }
            }

            const payload = getVerificationPollPayload(step, state, {
              ...cleanPollOverrides,
              filterAfterTimestamp,
              excludeCodes: [...rejectedCodes],
            });
            const plannedPollMaxAttempts = pollAttemptPlan[round - 1] || 0;
            if (plannedPollMaxAttempts > 0) {
              payload.maxAttempts = plannedPollMaxAttempts;
            } else if (round === 1 && initialPollMaxAttempts > 0) {
              payload.maxAttempts = initialPollMaxAttempts;
            }

            try {
              const timedPoll = await applyMailPollingTimeBudget(
                step,
                payload,
                pollOverrides,
                `轮询${getVerificationCodeLabel(step)}验证码邮箱`
              );
              const timeoutWindow = resolveMailPollingTimeouts(mail, timedPoll);
              const result = await sendToMailContentScriptResilient(
                mail,
                {
                  type: 'POLL_EMAIL',
                  step,
                  source: 'background',
                  payload: timeoutWindow.payload,
                },
                {
                  timeoutMs: timeoutWindow.timeoutMs,
                  maxRecoveryAttempts: 2,
                  responseTimeoutMs: timeoutWindow.responseTimeoutMs,
                  logStep: activeVerificationLogStep,
                  logStepKey: getVerificationLogStepKey(Number(activeVerificationLogStep) || step),
                }
              );

              if (result && result.error) {
                throw new Error(result.error);
              }

              if (!result || !result.code) {
                throw new Error(`步骤 ${step}：邮箱轮询结束，但未获取到验证码。`);
              }

              if (rejectedCodes.has(result.code)) {
                throw new Error(`步骤 ${step}：再次收到了相同的${getVerificationCodeLabel(step)}验证码：${result.code}`);
              }

              return {
                ...result,
                remainingResendRequests: Math.max(0, maxResendRequests - usedResendRequests),
              };
            } catch (err) {
              if (isStopError(err)) {
                throw err;
              }
              if (mail?.provider === '2925' && typeof isMail2925LimitReachedError === 'function' && isMail2925LimitReachedError(err)) {
                if (typeof handleMail2925LimitReachedError === 'function') {
                  throw await handleMail2925LimitReachedError(step, err);
                }
                throw err;
              }
              lastError = err;
              await addLog(`步骤 ${step}：${err.message}`, 'warn');
              if (round < maxRounds) {
                await addLog(`步骤 ${step}：将重新发送验证码后重试（${round + 1}/${maxRounds}）...`, 'warn');
              }
            }
          }

          throw lastError || new Error(`步骤 ${step}：无法获取新的${getVerificationCodeLabel(step)}验证码。`);
        }

        async function submitVerificationCode(step, code, options = {}) {
          const completionStep = getCompletionStep(step, options);
          const authLoginStep = completionStep >= 11 ? 10 : 7;
          const signupTabId = await getTabId('signup-page');
          if (!signupTabId) {
            throw new Error('认证页面标签页已关闭，无法填写验证码。');
          }

          await chrome.tabs.update(signupTabId, { active: true });
          if (step === 4) {
            const prepareRequest = {
              type: 'PREPARE_SIGNUP_VERIFICATION', step: 4, source: 'background',
              payload: {
                password: options.password || '', prepareSource: 'step4_pre_submit',
                prepareLogLabel: '步骤 4 填码前检查', timeoutMs: 15000,
              },
            };
            const prepareVerificationPage = async () => {
              const sender = typeof sendToContentScriptResilient === 'function'
                ? sendToContentScriptResilient : sendToContentScript;
              const result = await sender('signup-page', prepareRequest, {
                timeoutMs: 20000, responseTimeoutMs: 18000, retryDelayMs: 500,
                logMessage: '步骤 4：取码完成后认证页正在恢复，等待验证码输入框重新就绪...',
                logStep: completionStep, logStepKey: 'fetch-signup-code',
              });
              if (result?.error) throw new Error(result.error);
              return result || {};
            };
            const reloadStaleVerificationPage = async () => {
              if (!chrome?.tabs?.get || !chrome?.tabs?.reload) return false;
              const tab = await chrome.tabs.get(signupTabId).catch(() => null);
              let reloadable = false;
              try {
                const parsed = new URL(String(tab?.url || ''));
                reloadable = ['auth.openai.com', 'auth0.openai.com', 'accounts.openai.com'].includes(parsed.hostname) && /\/email-verification(?:[/?#]|$)/i.test(parsed.pathname);
              } catch {}
              if (!reloadable) return false;
              await addLog('步骤 4：取码完成后验证码输入框已从页面消失，正在刷新认证页并恢复当前验证会话。', 'warn');
              await chrome.tabs.reload(signupTabId, { bypassCache: true });
              const reloadStartedAt = Date.now();
              while (Date.now() - reloadStartedAt < 15000) {
                throwIfStopped();
                const refreshedTab = await chrome.tabs.get(signupTabId).catch(() => null);
                if (String(refreshedTab?.status || '').toLowerCase() === 'complete') return true;
                await sleepWithStop(250);
              }
              return true;
            };
            let prepareResult;
            try {
              prepareResult = await prepareVerificationPage();
            } catch (error) {
              const inputMissing = /未找到验证码输入框/i.test(String(error?.message || error || ''));
              if (!inputMissing || !(await reloadStaleVerificationPage())) throw error;
              prepareResult = await prepareVerificationPage();
            }
            if (prepareResult?.alreadyVerified) {
              return {
                success: true, assumed: true, alreadyAdvanced: true,
                skipProfileStep: Boolean(prepareResult.skipProfileStep), url: prepareResult.url || '',
              };
            }
          }
          const baseResponseTimeoutMs = await getResponseTimeoutMsForStep(
            step,
            step === 8
              ? {
                ...options,
                minResponseTimeoutMs: Math.max(15000, Number(options.minResponseTimeoutMs) || 0),
              }
              : options,
            step === 7 ? 45000 : 30000,
            `填写${getVerificationCodeLabel(step)}验证码`
          );
          const message = {
            type: 'FILL_CODE',
            step,
            source: 'background',
            payload: {
              code,
              ...(step === 4 && options.signupProfile ? { signupProfile: options.signupProfile } : {}),
              ...(step === 4 && options.password ? { password: options.password } : {}),
            },
          };
          let result;
          const shouldAvoidReplaySubmit = step === 8;
          const recoverStep4AfterSlowSubmit = async () => {
            const fallback = await detectStep4PostSubmitFallback(signupTabId, {
              timeoutMs: POST_SUBMIT_CONFIRM_TIMEOUT_MS,
              pollIntervalMs: POST_SUBMIT_CONFIRM_POLL_INTERVAL_MS,
            });
            if (fallback.invalidCode) {
              return {
                invalidCode: true,
                errorText: fallback.errorText || '验证码被拒绝。',
                url: fallback.url || '',
              };
            }
            if (!fallback.success) {
              return null;
            }
            await addLog(`步骤 4：验证码提交后页面已切换到${getStep4FallbackLabel(fallback)}，按提交成功继续。`, 'warn');
            return buildStep4FallbackSubmitSuccess(fallback);
          };
          const sendStep4VerificationCode = async () => {
            for (let replayAttempt = 0; replayAttempt <= STEP4_STUCK_VERIFICATION_RESUBMIT_LIMIT; replayAttempt += 1) {
              let response = null;
              try {
                response = await sendToContentScriptResilient('signup-page', message, {
                  timeoutMs: Math.max(baseResponseTimeoutMs + 15000, 30000),
                  retryDelayMs: 700,
                  responseTimeoutMs: baseResponseTimeoutMs,
                  logMessage: '认证页正在切换，等待页面重新就绪后继续确认验证码提交结果...',
                  logStep: completionStep,
                  logStepKey: 'fetch-signup-code',
                });
              } catch (err) {
                if (isRetryableVerificationTransportError(err)) {
                  const recovered = await recoverStep4AfterSlowSubmit();
                  if (recovered) {
                    return recovered;
                  }
                }
                throw err;
              }

              if (response?.error) {
                throw new Error(response.error);
              }
              if (!isStep4PendingVerificationSubmitResult(response)) {
                return response || {};
              }

              const recovered = await recoverStep4AfterSlowSubmit();
              if (recovered) {
                return recovered;
              }
              if (replayAttempt < STEP4_STUCK_VERIFICATION_RESUBMIT_LIMIT) {
                await addLog(
                  `步骤 4：验证码提交后仍未确认跳转且页面没有明确错误，正在重提同一个验证码（${replayAttempt + 1}/${STEP4_STUCK_VERIFICATION_RESUBMIT_LIMIT}）。`,
                  'warn'
                );
                continue;
              }
              return response;
            }
            return {};
          };
          if (step === 4 && typeof sendToContentScriptResilient === 'function') {
            result = await sendStep4VerificationCode();
          } else if (typeof sendToContentScriptResilient === 'function' && !shouldAvoidReplaySubmit) {
            try {
              result = await sendToContentScriptResilient('signup-page', message, {
                timeoutMs: Math.max(baseResponseTimeoutMs + 15000, 30000),
                retryDelayMs: 700,
                responseTimeoutMs: baseResponseTimeoutMs,
                logMessage: '认证页正在切换，等待页面重新就绪后继续确认验证码提交结果...',
                logStep: completionStep,
                logStepKey: getVerificationLogStepKey(Number(activeVerificationLogStep) || step),
              });
            } catch (err) {
              if (step === 4 && isRetryableVerificationTransportError(err)) {
                const fallback = await detectStep4PostSubmitFallback(signupTabId, {
                  timeoutMs: POST_SUBMIT_CONFIRM_TIMEOUT_MS,
                  pollIntervalMs: POST_SUBMIT_CONFIRM_POLL_INTERVAL_MS,
                });
                if (fallback.success) {
                  await addLog(`步骤 4：验证码提交后页面已切换到${getStep4FallbackLabel(fallback)}，按提交成功继续。`, 'warn');
                  return buildStep4FallbackSubmitSuccess(fallback);
                }
              }
              if (step === 8 && isRetryableVerificationTransportError(err)) {
                const fallback = await detectStep8PostSubmitFallback({
                  step,
                  timeoutMs: 9000,
                  pollIntervalMs: 300,
                });
                if (fallback.success) {
                  await addLog('验证码提交后通信中断，但页面已进入 OAuth 授权页，按提交成功继续。', 'warn', {
                    step: completionStep,
                    stepKey: 'fetch-login-code',
                  });
                  return {
                    success: true,
                    assumed: true,
                    transportRecovered: true,
                    url: fallback.url || '',
                  };
                }
                if (fallback.restartStep7) {
                  const urlPart = fallback.url ? ` URL: ${fallback.url}` : '';
                  throw new Error(`STEP8_RESTART_STEP7::步骤 ${completionStep}：验证码提交后认证页进入登录超时报错页，请回到步骤 ${authLoginStep} 重新开始。${urlPart}`.trim());
                }
              }
              throw err;
            }
          } else if (shouldAvoidReplaySubmit) {
            try {
              result = await sendToContentScript('signup-page', message, {
                responseTimeoutMs: baseResponseTimeoutMs,
              });
            } catch (err) {
              if (isRetryableVerificationTransportError(err)) {
                await addLog('认证页正在切换，等待页面重新就绪后继续确认验证码提交结果...', 'warn', {
                  step: completionStep,
                  stepKey: 'fetch-login-code',
                });
                const fallback = await detectStep8PostSubmitFallback({
                  step,
                  timeoutMs: 9000,
                  pollIntervalMs: 300,
                });
                if (fallback.invalidCode) {
                  return {
                    invalidCode: true,
                    errorText: fallback.errorText || '验证码被拒绝。',
                    url: fallback.url || '',
                  };
                }
                if (fallback.success) {
                  await addLog('验证码提交后通信中断，但页面已进入 OAuth 授权页，按提交成功继续。', 'warn', {
                    step: completionStep,
                    stepKey: 'fetch-login-code',
                  });
                  return {
                    success: true,
                    assumed: true,
                    transportRecovered: true,
                    url: fallback.url || '',
                  };
                }
                if (fallback.restartStep7) {
                  const urlPart = fallback.url ? ` URL: ${fallback.url}` : '';
                  throw new Error(`STEP8_RESTART_STEP7::步骤 ${completionStep}：验证码提交后认证页进入登录超时报错页，请回到步骤 ${authLoginStep} 重新开始。${urlPart}`.trim());
                }
              }
              throw err;
            }
          } else {
            result = await sendToContentScript('signup-page', message, {
              responseTimeoutMs: baseResponseTimeoutMs,
            });
          }

          if (result && result.error) {
            throw new Error(result.error);
          }

          return result || {};
        }

        async function resolveCustomEmailVerificationStep(step, state = {}, options = {}) {
          const completionStep = getCompletionStep(step, options);
          activeVerificationLogStep = completionStep;
          const stateKey = getVerificationCodeStateKey(step);
          const beforeFetchAttempt = typeof options.beforeFetchAttempt === 'function'
            ? options.beforeFetchAttempt
            : null;
          const rejectedCodes = new Set(
            [
              state?.[stateKey],
              ...(Array.isArray(options.excludeCodes) ? options.excludeCodes : []),
            ].map((code) => String(code || '').trim()).filter(Boolean)
          );
          let maxAttempts = Math.max(1, Math.min(5, Math.floor(Number(options.maxSubmitAttempts) || 5)));
          let lastRejectedText = '';
          let nextFilterAfterTimestamp = resolveInitialVerificationRequestedAt(step, state, options.filterAfterTimestamp);
          let allowExcludedAfterTimestamp = 0;
          let assurivoEmptyFeedFirstSeenAt = 0;
          let assurivoEmptyFeedFirstAttempt = 0;
          let assurivoEmptyFeedResendRequested = false;

          function extendStep4AttemptsAfterResend(attemptState = {}, currentAttempt = 1) {
            if (step !== 4) {
              return;
            }
            const waitSeconds = normalizeSignupVerificationCodeWaitSeconds(
              attemptState?.setGptPasswordVerificationWaitSeconds ?? attemptState?.signupVerificationCodeWaitSeconds
            );
            const intervalMs = Math.max(10000, waitSeconds * 1000);
            const extraAttempts = Math.max(1, Math.ceil(STEP4_ASSURIVO_RESEND_CONFIRM_TIMEOUT_MS / intervalMs));
            maxAttempts = Math.max(maxAttempts, currentAttempt + extraAttempts);
          }

          function extendStep4AttemptsForAssurivoEmptyFeed(attemptState = {}, currentAttempt = 1) {
            if (step !== 4 || assurivoEmptyFeedFirstAttempt > 0) {
              return;
            }
            assurivoEmptyFeedFirstAttempt = currentAttempt;
            const waitSeconds = normalizeSignupVerificationCodeWaitSeconds(
              attemptState?.setGptPasswordVerificationWaitSeconds ?? attemptState?.signupVerificationCodeWaitSeconds
            );
            const intervalMs = Math.max(10000, waitSeconds * 1000);
            const extraAttempts = Math.max(1, Math.ceil(STEP4_ASSURIVO_EMPTY_FEED_WAIT_MS / intervalMs));
            maxAttempts = Math.max(maxAttempts, currentAttempt + extraAttempts);
          }

          for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            const latestState = typeof getState === 'function'
              ? await getState().catch(() => null)
              : null;
            const attemptState = latestState && typeof latestState === 'object'
              ? { ...state, ...latestState }
              : state;
            await waitBeforeFetchingSignupVerificationCode(
              step,
              attemptState,
              attempt,
              maxAttempts,
              attempt > 1
                ? (assurivoEmptyFeedFirstSeenAt ? '继续等待 Assurivo 新邮件送达' : '避免继续读取刚被拒绝的旧验证码')
                : '等待新邮件到达'
            );
            if (beforeFetchAttempt) {
              await beforeFetchAttempt({
                step,
                completionStep,
                attempt,
                maxAttempts,
                provider: 'custom',
                filterAfterTimestamp: nextFilterAfterTimestamp || options.filterAfterTimestamp,
              });
            }
            let result = null;
            try {
              result = await fetchCustomEmailVerificationCode(step, attemptState, {
                ...options,
                excludeCodes: [...rejectedCodes],
                filterAfterTimestamp: nextFilterAfterTimestamp || options.filterAfterTimestamp,
                allowExcludedAfterTimestamp,
              });
            } catch (err) {
              const retryableFetchError = isRetryableCustomEmailVerificationFetchError(err);
              const assurivoEmptyFeedError = step === 4 && isAssurivoEmptyFeedVerificationFetchError(err);
              if (assurivoEmptyFeedError) {
                if (!assurivoEmptyFeedFirstSeenAt) {
                  assurivoEmptyFeedFirstSeenAt = Date.now();
                  extendStep4AttemptsForAssurivoEmptyFeed(attemptState, attempt);
                  await addLog(
                    `步骤 ${completionStep}：Assurivo JSON 接口当前未收到本轮验证码邮件(data=[]/无新邮件/无 ChatGPT 邮件)，将最多继续等待 ${Math.round(STEP4_ASSURIVO_EMPTY_FEED_WAIT_MS / 1000)} 秒。`,
                    'warn'
                  );
                }
                if (!assurivoEmptyFeedResendRequested && attempt >= Math.max(2, assurivoEmptyFeedFirstAttempt + 1)) {
                  assurivoEmptyFeedResendRequested = true;
                  try {
                    const requestedAt = await requestVerificationCodeResend(step, options);
                    nextFilterAfterTimestamp = requestedAt || Date.now();
                    allowExcludedAfterTimestamp = nextFilterAfterTimestamp;
                    extendStep4AttemptsAfterResend(attemptState, attempt);
                    await addLog(`步骤 ${completionStep}：Assurivo 连续未返回邮件，已请求重新发送一封新的${getVerificationCodeLabel(step)}验证码，将继续等待。`, 'warn');
                  } catch (resendError) {
                    if (isStopError(resendError)) {
                      throw resendError;
                    }
                    await addLog(`步骤 ${completionStep}：Assurivo 暂无邮件，尝试重新发送验证码失败，将继续等待邮箱新邮件：${resendError.message}`, 'warn');
                  }
                }
              }
              if (!retryableFetchError || attempt >= maxAttempts) {
                if (assurivoEmptyFeedError && assurivoEmptyFeedFirstSeenAt) {
                  const waitedSeconds = Math.max(0, Math.round((Date.now() - assurivoEmptyFeedFirstSeenAt) / 1000));
                  throw new Error(`步骤 ${completionStep}：Assurivo JSON 在 ${waitedSeconds} 秒内仍未收到本轮验证码邮件(data=[]/无新邮件/无 ChatGPT 邮件)，请检查邮箱是否收信或接口是否延迟。最后结果：${err?.message || err}`);
                }
                if (step === 4 && allowExcludedAfterTimestamp > 0 && isRetryableCustomEmailVerificationFetchError(err)) {
                  const waitedSeconds = Math.max(0, Math.round((Date.now() - allowExcludedAfterTimestamp) / 1000));
                  throw new Error(`步骤 ${completionStep}：Assurivo 重发后 ${waitedSeconds} 秒内未收到新的有效验证码邮件。最后结果：${err?.message || err}`);
                }
                throw err;
              }
              await addLog(
                `步骤 ${completionStep}：自定义邮箱本次取码临时失败，将继续等待下一次尝试（${attempt + 1}/${maxAttempts}）：${err?.message || err}`,
                'warn'
              );
              continue;
            }
            if (!result?.handled) {
              return {
                handled: false,
              };
            }

            throwIfStopped();
            const submitResult = await submitVerificationCode(step, result.code, options);
            if (submitResult.invalidCode) {
              rejectedCodes.add(result.code);
              lastRejectedText = submitResult.errorText || result.code;
              await addLog(`步骤 ${completionStep}：自定义邮箱取码 URL 返回的验证码被页面拒绝：${lastRejectedText}`, 'warn');
              if (attempt < maxAttempts) {
                try {
                  const requestedAt = await requestVerificationCodeResend(step, options);
                  nextFilterAfterTimestamp = requestedAt || Date.now();
                  allowExcludedAfterTimestamp = nextFilterAfterTimestamp;
                  extendStep4AttemptsAfterResend(attemptState, attempt);
                  await addLog(`步骤 ${completionStep}：验证码被拒绝后已重新请求一封新的${getVerificationCodeLabel(step)}验证码。`, 'warn');
                } catch (err) {
                  if (isStopError(err)) {
                    throw err;
                  }
                  nextFilterAfterTimestamp = Date.now();
                  allowExcludedAfterTimestamp = nextFilterAfterTimestamp;
                  extendStep4AttemptsAfterResend(attemptState, attempt);
                  await addLog(`步骤 ${completionStep}：验证码被拒绝后尝试重新发送失败，将继续等待邮箱新邮件：${err.message}`, 'warn');
                }
                continue;
              }
              throw new Error(`步骤 ${completionStep}：自定义邮箱取码 URL 返回的验证码连续被页面拒绝：${lastRejectedText}`);
            }

            await setState({
              lastEmailTimestamp: result.emailTimestamp,
              [stateKey]: result.code,
            });

            const completionNodeId = await getNodeIdForStep(completionStep);
            if (!completionNodeId) {
              throw new Error(`步骤 ${completionStep} 未映射到验证码节点。`);
            }
            await completeNodeFromBackground(completionNodeId, {
              emailTimestamp: result.emailTimestamp,
              code: result.code,
              ...(step === 4 && (submitResult?.passwordSubmittedAfterVerification || options.passwordSubmittedAfterVerification) ? { passwordSubmittedAfterVerification: true } : {}),
              ...(step === 4 && submitResult?.skipProfileStep ? { skipProfileStep: true } : {}),
              ...(step === 4 && submitResult?.skipProfileStepReason
                ? { skipProfileStepReason: submitResult.skipProfileStepReason }
                : {}),
            });

            return {
              handled: true,
              code: result.code,
              emailTimestamp: result.emailTimestamp,
              url: submitResult.url || '',
              verificationUrl: result.verificationUrl,
            };
          }

          throw new Error(`步骤 ${completionStep}：自定义邮箱取码 URL 未能提交有效验证码${lastRejectedText ? `：${lastRejectedText}` : ''}`);
        }

        async function fetchVerificationCodeOnly(step, state = {}, mail = null, options = {}) {
          const completionStep = getCompletionStep(step, options);
          activeVerificationLogStep = completionStep;
          const stateKey = getVerificationCodeStateKey(step);
          const rejectedCodes = new Set(
            [
              state?.[stateKey],
              ...(Array.isArray(options.excludeCodes) ? options.excludeCodes : []),
            ].map((code) => String(code || '').trim()).filter(Boolean)
          );

          const customResult = await fetchCustomEmailVerificationCode(step, state, {
            ...options,
            excludeCodes: [...rejectedCodes],
          });
          if (customResult?.handled) {
            return {
              ...customResult,
              handled: true,
              stateKey,
            };
          }

          if (!mail || mail.provider === 'custom') {
            return {
              handled: false,
              stateKey,
              targetEmail: customResult?.targetEmail || options.targetEmail || '',
            };
          }

          const {
            completionStep: _completionStep,
            promptStep: _promptStep,
            maxSubmitAttempts: _maxSubmitAttempts,
            password: _password,
            signupProfile: _signupProfile,
            ...pollOverrides
          } = options;
          const result = await pollFreshVerificationCode(step, state, mail, {
            ...pollOverrides,
            excludeCodes: [...rejectedCodes],
          });
          return {
            ...(result || {}),
            handled: true,
            stateKey,
          };
        }

        async function resolveVerificationStep(step, state, mail, options = {}) {
          const completionStep = getCompletionStep(step, options);
          activeVerificationLogStep = completionStep;
          const stateKey = getVerificationCodeStateKey(step);
          const rejectedCodes = new Set();
          const hotmailPollConfig = mail.provider === HOTMAIL_PROVIDER
            ? getHotmailVerificationPollConfig(step)
            : null;
          const beforeSubmit = typeof options.beforeSubmit === 'function'
            ? options.beforeSubmit
            : null;
          const beforeFetchAttempt = typeof options.beforeFetchAttempt === 'function'
            ? options.beforeFetchAttempt
            : null;
          const ignorePersistedLastCode = Boolean(hotmailPollConfig?.ignorePersistedLastCode);
          if (state[stateKey] && !ignorePersistedLastCode) {
            rejectedCodes.add(state[stateKey]);
          }

          let nextFilterAfterTimestamp = options.filterAfterTimestamp ?? null;
          const requestFreshCodeFirst = options.requestFreshCodeFirst !== undefined
            ? Boolean(options.requestFreshCodeFirst)
            : (hotmailPollConfig?.requestFreshCodeFirst ?? false);
          let remainingAutomaticResendCount = options.maxResendRequests !== undefined
            ? normalizeVerificationResendCount(
              options.maxResendRequests,
              getLegacyVerificationResendCountDefault(step, { requestFreshCodeFirst })
            )
            : getConfiguredVerificationResendCount(step, state, { requestFreshCodeFirst });
          const maxSubmitAttempts = mail.provider === LUCKMAIL_PROVIDER ? 3 : 15;
          const resendIntervalMs = Math.max(0, Number(options.resendIntervalMs) || 0);
          const externalOnResendRequestedAt = typeof options.onResendRequestedAt === 'function'
            ? options.onResendRequestedAt
            : null;
          let lastResendAt = resolveInitialVerificationRequestedAt(
            step,
            state,
            Number(options.lastResendAt) || 0
          );

          const updateFilterAfterTimestampForVerificationStep = async (requestedAt) => {
            if (externalOnResendRequestedAt) {
              try {
                await externalOnResendRequestedAt(requestedAt);
              } catch (_) {
                // Keep resend flow best-effort; state sync callback failures should not break verification.
              }
            }
            return nextFilterAfterTimestamp;
          };

          await clear2925MailboxBeforePolling(step, mail, options);

          if (requestFreshCodeFirst) {
            if (remainingAutomaticResendCount <= 0) {
              await addLog(`步骤 ${step}：当前自动重新发送验证码次数为 0，将直接使用当前时间窗口轮询邮箱。`, 'info');
            } else {
              try {
                lastResendAt = await requestVerificationCodeResend(step, options);
                remainingAutomaticResendCount -= 1;
                await updateFilterAfterTimestampForVerificationStep(lastResendAt);
                await addLog(`步骤 ${step}：已先请求一封新的${getVerificationCodeLabel(step)}验证码，再开始轮询邮箱。`, 'warn');
              } catch (err) {
                if (isStopError(err)) {
                  throw err;
                }
                await addLog(`步骤 ${step}：首次重新获取验证码失败：${err.message}，将继续使用当前时间窗口轮询。`, 'warn');
              }
            }
          }

          if (mail.provider === HOTMAIL_PROVIDER) {
              const initialDelayMs = Number(options.initialDelayMs ?? hotmailPollConfig.initialDelayMs) || 0;
              if (initialDelayMs > 0) {
                const remainingMs = await getRemainingTimeBudgetMs(
                  step,
                  options,
                  `等待${getVerificationCodeLabel(step)}验证码邮件到达`
                );
                const delayMs = remainingMs === null
                  ? initialDelayMs
                  : Math.min(initialDelayMs, Math.max(0, remainingMs));
                await addLog(`步骤 ${step}：等待 ${Math.round(initialDelayMs / 1000)} 秒，让 Hotmail 验证码邮件先到达...`, 'info');
                await sleepWithStop(delayMs);
              }
            }

            for (let attempt = 1; attempt <= maxSubmitAttempts; attempt++) {
              await waitBeforeFetchingSignupVerificationCode(
                step,
                state,
                attempt,
                maxSubmitAttempts,
                attempt > 1 ? '避免继续读取刚被拒绝的旧验证码' : '等待新邮件到达'
              );
              if (beforeFetchAttempt) {
                await beforeFetchAttempt({
                  step,
                  completionStep,
                  attempt,
                  maxAttempts: maxSubmitAttempts,
                  provider: mail.provider,
                  filterAfterTimestamp: nextFilterAfterTimestamp ?? undefined,
                  lastResendAt,
                });
              }
              const pollOptions = {
                excludeCodes: [...rejectedCodes],
                disableTimeBudgetCap: Boolean(options.disableTimeBudgetCap),
                getRemainingTimeMs: options.getRemainingTimeMs,
                maxResendRequests: remainingAutomaticResendCount,
                initialPollMaxAttempts: mail.provider === '2925' && rejectedCodes.size > 0
                  ? undefined
                  : options.initialPollMaxAttempts,
                pollAttemptPlan: mail.provider === '2925' && rejectedCodes.size > 0
                  ? undefined
                  : options.pollAttemptPlan,
                resendIntervalMs,
                lastResendAt,
                onResendRequestedAt: updateFilterAfterTimestampForVerificationStep,
              };
              if (nextFilterAfterTimestamp !== null && nextFilterAfterTimestamp !== undefined) {
                pollOptions.filterAfterTimestamp = nextFilterAfterTimestamp;
              }
              const result = await pollFreshVerificationCode(step, state, mail, pollOptions);
              lastResendAt = Number(result?.lastResendAt) || lastResendAt;
              remainingAutomaticResendCount = normalizeVerificationResendCount(
                result?.remainingResendRequests,
                remainingAutomaticResendCount
              );

              throwIfStopped();
              await addLog(`步骤 ${step}：已获取${getVerificationCodeLabel(step)}验证码：${result.code}`);
              if (beforeSubmit) {
                await beforeSubmit(result, {
                  attempt,
                  rejectedCodes: new Set(rejectedCodes),
                  filterAfterTimestamp: nextFilterAfterTimestamp ?? undefined,
                  lastResendAt,
                });
              }
              throwIfStopped();
              const submitResult = await submitVerificationCode(step, result.code, options);

              if (submitResult.invalidCode) {
                rejectedCodes.add(result.code);
                await addLog(`步骤 ${step}：验证码被页面拒绝：${submitResult.errorText || result.code}`, 'warn');

                if (attempt >= maxSubmitAttempts) {
                  throw new Error(`步骤 ${step}：验证码连续失败，已达到 ${maxSubmitAttempts} 次重试上限。`);
                }

                if (mail.provider === LUCKMAIL_PROVIDER) {
                  await addLog(`步骤 ${step}：LuckMail 验证码提交失败，等待 15 秒后重新轮询 /code 接口（${attempt + 1}/${maxSubmitAttempts}）...`, 'warn');
                  await sleepWithStop(15000);
                  continue;
                }

                if (remainingAutomaticResendCount <= 0) {
                  await addLog(`步骤 ${step}：已达到自动重新发送验证码次数上限，将排除已拒绝验证码并继续轮询新邮件。`, 'warn');
                  continue;
                }

                lastResendAt = await requestVerificationCodeResend(step, options);
                remainingAutomaticResendCount -= 1;
                await updateFilterAfterTimestampForVerificationStep(lastResendAt);
                await addLog(`步骤 ${step}：提交失败后已请求新验证码（${attempt + 1}/${maxSubmitAttempts}）...`, 'warn');
                continue;
              }

              await setState({
                lastEmailTimestamp: result.emailTimestamp,
                [stateKey]: result.code,
              });

              const completionNodeId = await getNodeIdForStep(completionStep);
              if (!completionNodeId) {
                throw new Error(`步骤 ${completionStep} 未映射到验证码节点。`);
              }
              await completeNodeFromBackground(completionNodeId, {
                emailTimestamp: result.emailTimestamp,
                code: result.code,
                ...(step === 4 && (submitResult?.passwordSubmittedAfterVerification || options.passwordSubmittedAfterVerification) ? { passwordSubmittedAfterVerification: true } : {}),
                ...(step === 4 && submitResult?.skipProfileStep ? { skipProfileStep: true } : {}),
                ...(step === 4 && submitResult?.skipProfileStepReason
                  ? { skipProfileStepReason: submitResult.skipProfileStepReason }
                  : {}),
              });
              triggerPostSuccessMailboxCleanup(step, mail);
              return {
                url: submitResult.url || '',
              };
            }
          }

    return {
      getVerificationCodeStateKey,
      getVerificationCodeLabel,
      getVerificationLogStepKey,
      getActiveVerificationLogStep,
      normalizeSignupVerificationCodeWaitSeconds,
      waitBeforeFetchingSignupVerificationCode,
      isLikelyLoggedInChatgptHomeUrl,
      isSignupProfilePageUrl,
      isPasskeyEnrollmentPageUrl,
      isStep4PendingVerificationSubmitResult,
      detectStep4PostSubmitFallback,
      getStep4FallbackLabel,
      buildStep4FallbackSubmitSuccess,
      detectStep8PostSubmitFallback,
      getVerificationResendStateKey,
      normalizeVerificationResendCount,
      getVerificationRequestedAtStateKey,
      normalizeVerificationRequestedAtCandidate,
      resolveInitialVerificationRequestedAt,
      getLegacyVerificationResendCountDefault,
      getConfiguredVerificationResendCount,
      resolveMaxResendRequests,
      getCompletionStep,
      confirmCustomVerificationStepBypass,
      getVerificationPollPayload,
      getRemainingTimeBudgetMs,
      getResponseTimeoutMsForStep,
      applyMailPollingTimeBudget,
      requestVerificationCodeResend,
      shouldPreclear2925Mailbox,
      clear2925MailboxBeforePolling,
      closeIcloudMailboxTabAfterSuccess,
      triggerPostSuccessMailboxCleanup,
      pollFreshVerificationCodeWithResendInterval,
      shouldRequestLuckmailResendBeforeRetry,
      pollLuckmailVerificationCodeWithResend,
      pollFreshVerificationCode,
      submitVerificationCode,
      resolveCustomEmailVerificationStep,
      fetchVerificationCodeOnly,
      resolveVerificationStep,
    };
  }

  return {
    createVerificationResendController,
  };
});
