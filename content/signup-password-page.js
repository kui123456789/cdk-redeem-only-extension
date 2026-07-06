// content/signup-password-page.js - Password page helpers for OpenAI auth signup.
(function attachSignupPasswordPage(root) {
  function createSignupPasswordPage(context = {}) {
    const {
      documentRef = document,
      locationRef = location,
      windowRef = window,
      isVisibleElement = () => false,
      isActionEnabled = () => false,
      getActionText = () => '',
      getVisibleFieldErrorText = () => '',
      inspectSignupEntryState = null,
      logSignupPasswordDiagnostics = null,
      findOneTimeCodeLoginTrigger = null,
      waitForElementByText = null,
      fillInput = null,
      getOperationDelayRunner = null,
      humanPause = async () => {},
      simulateClick = (el) => el?.click?.(),
      sleep = (ms = 0) => new Promise((resolve) => root.setTimeout(resolve, ms)),
      throwIfStopped = () => {},
      isStopError = null,
      log = () => {},
    } = context;

    function getPerformOperationWithDelay() {
      if (typeof getOperationDelayRunner === 'function') {
        return getOperationDelayRunner();
      }

      const rootScope = typeof windowRef !== 'undefined' ? windowRef : root;
      const gate = rootScope?.CodexOperationDelay?.performOperationWithDelay;
      return typeof gate === 'function'
        ? gate
        : async (_metadata, operation) => operation();
    }

    function detectPasswordPage() {
      return /\/(?:create-account|log-in)\/password(?:[/?#]|$)/i.test(locationRef.pathname || '');
    }

    function getSignupPasswordDisplayedEmail() {
      const text = (documentRef.body?.innerText || documentRef.body?.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
      const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig);
      return matches?.[0] ? String(matches[0]).trim().toLowerCase() : '';
    }

    function getSignupPasswordInput() {
      const input = documentRef.querySelector('input[type="password"]');
      return input && isVisibleElement(input) ? input : null;
    }

    function getSignupPasswordSubmitButton({ allowDisabled = false } = {}) {
      const direct = documentRef.querySelector('button[type="submit"]');
      if (direct && isVisibleElement(direct) && (allowDisabled || isActionEnabled(direct))) {
        return direct;
      }

      const candidates = documentRef.querySelectorAll('button, [role="button"]');
      return Array.from(candidates).find((el) => {
        if (!isVisibleElement(el) || (!allowDisabled && !isActionEnabled(el))) return false;
        const text = getActionText(el);
        return /继续|続行|続ける|登録|作成|完了|continue|submit|创建|create|जारी\s+रखें|आगे|सबमिट|बनाएं|बनाएँ|खाता\s+बनाएं|अकाउंट\s+बनाएं/i.test(text);
      }) || null;
    }

    function getSignupPasswordFieldErrorText() {
      return getVisibleFieldErrorText();
    }

    async function ensureSignupPasswordPageReady(timeout = 20000) {
      const start = Date.now();

      while (Date.now() - start < timeout) {
        throwIfStopped();
        const passwordInput = getSignupPasswordInput();
        if (detectPasswordPage() && passwordInput) {
          return {
            ready: true,
            state: 'password_page',
            url: locationRef.href,
          };
        }
        await sleep(200);
      }

      throw new Error('等待进入密码页超时。URL: ' + locationRef.href);
    }

    async function fillSignupPasswordPageAndSubmit(snapshot, password, options = {}) {
      const {
        contextLabel = '步骤 3',
        deferredSubmit = true,
        requireSubmitButton = false,
        fillLabel = 'signup-password',
        submitLabel = 'submit-signup-password',
        submitDelayMs = 120,
        submitInitialSleepMs = 500,
      } = options;
      const performOperationWithDelay = getPerformOperationWithDelay();
      const activeSnapshot = snapshot || (typeof inspectSignupEntryState === 'function'
        ? inspectSignupEntryState()
        : {
            state: detectPasswordPage() ? 'password_page' : 'unknown',
            passwordInput: getSignupPasswordInput(),
            submitButton: getSignupPasswordSubmitButton({ allowDisabled: true }),
          });

      if (!password) {
        throw new Error(`${contextLabel}：缺少可用密码，无法自动填写密码页。`);
      }
      if (activeSnapshot.state !== 'password_page' || !activeSnapshot.passwordInput) {
        if (typeof logSignupPasswordDiagnostics === 'function') {
          logSignupPasswordDiagnostics(`${contextLabel}：未能识别可填写的密码输入框`);
        }
        throw new Error(`在密码页未找到密码输入框。URL: ${locationRef.href}`);
      }

      await humanPause(600, 1500);
      await performOperationWithDelay({ stepKey: 'fill-password', kind: 'fill', label: fillLabel }, async () => {
        fillInput(activeSnapshot.passwordInput, password);
      });
      log(`${contextLabel}：密码已填写`);

      const submitBtn = activeSnapshot.submitButton
        || getSignupPasswordSubmitButton({ allowDisabled: true })
        || (
          typeof waitForElementByText === 'function'
            ? await waitForElementByText('button', /continue|sign\s*up|submit|注册|创建|create|続行|登録|作成|जारी\s+रखें|आगे|सबमिट|साइन\s*अप|बनाएं|बनाएँ/i, 5000).catch(() => null)
            : null
        );

      if (!submitBtn) {
        if (typeof logSignupPasswordDiagnostics === 'function') {
          logSignupPasswordDiagnostics(`${contextLabel}：未找到可提交的密码页按钮`);
        }
        if (requireSubmitButton) {
          throw new Error(`${contextLabel}：未找到可提交的密码页按钮。URL: ${locationRef.href}`);
        }
      } else if (typeof findOneTimeCodeLoginTrigger === 'function' && findOneTimeCodeLoginTrigger()) {
        if (typeof logSignupPasswordDiagnostics === 'function') {
          logSignupPasswordDiagnostics(`${contextLabel}：当前密码页同时存在一次性验证码入口`, 'info');
        }
      }

      const submitPassword = async () => {
        throwIfStopped();
        if (submitInitialSleepMs > 0) {
          await sleep(submitInitialSleepMs);
        }
        await humanPause(500, 1300);
        await performOperationWithDelay({ stepKey: 'fill-password', kind: 'submit', label: submitLabel }, async () => {
          simulateClick(submitBtn);
        });
        log(`${contextLabel}：表单已提交`);
      };

      const signupVerificationRequestedAt = submitBtn ? Date.now() : null;
      if (submitBtn) {
        if (deferredSubmit) {
          windowRef.setTimeout(async () => {
            try {
              await submitPassword();
            } catch (error) {
              const stopped = typeof isStopError === 'function'
                ? isStopError(error)
                : (error?.name === 'MultiPageStopError' || error?.code === 'MULTIPAGE_STOPPED');
              if (!stopped) {
                console.error('[MultiPage:signup-password-page] deferred signup password submit failed:', error?.message || error);
              }
            }
          }, submitDelayMs);
        } else {
          await submitPassword();
        }
      }

      return {
        submitButtonFound: Boolean(submitBtn),
        signupVerificationRequestedAt,
        deferredSubmit: Boolean(submitBtn && deferredSubmit),
      };
    }

    function setPassword(password, options = {}) {
      return fillSignupPasswordPageAndSubmit(options.snapshot || null, password, options);
    }

    return {
      setPassword,
      detectPasswordPage,
      ensureSignupPasswordPageReady,
      fillSignupPasswordPageAndSubmit,
      getSignupPasswordDisplayedEmail,
      getSignupPasswordInput,
      getSignupPasswordSubmitButton,
      getSignupPasswordFieldErrorText,
    };
  }

  root.MultiPageSignupPasswordPage = { createSignupPasswordPage };
})(typeof self !== 'undefined' ? self : window);
