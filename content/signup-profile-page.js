// content/signup-profile-page.js - Profile page helpers for OpenAI auth signup.
(function attachSignupProfilePage(root) {
  function createSignupProfilePage(context = {}) {
    const {
      documentRef = document,
      locationRef = location,
      windowRef = window,
      step5SubmitErrorPattern = /unable\s+to\s+create\s+(?:your\s+)?account/i,
      isVisibleElement = () => false,
      isActionEnabled = () => false,
      getActionText = () => '',
      getStep5AuthRetryPageState = () => null,
      isAuthMaxCheckAttemptsPage = () => false,
      getStep5PostSubmitSuccessState = () => null,
      getCreateAccountEnrollPasskeyPageState = () => null,
      fillProfileNameAndBirthday: fillProfileNameAndBirthdayDelegate = null,
      humanPause = async () => {},
      simulateClick = (el) => el?.click?.(),
      sleep = (ms = 0) => new Promise((resolve) => root.setTimeout(resolve, ms)),
      throwIfStopped = () => {},
      log = () => {},
    } = context;

    function normalizeInlineText(text) {
      return (text || '').replace(/\s+/g, ' ').trim();
    }

    function getStep5ProfilePathPatterns() {
      return [
        /\/create-account\/profile(?:[/?#]|$)/i,
        /\/u\/signup\/profile(?:[/?#]|$)/i,
        /\/signup\/profile(?:[/?#]|$)/i,
        /\/about-you(?:[/?#]|$)/i,
      ];
    }

    function detectProfilePage(rawUrl = locationRef.href) {
      const url = String(rawUrl || '').trim();
      if (!url) {
        return false;
      }

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

    function detectProfileFields() {
      return Boolean(
        documentRef.querySelector([
          'input[name="name"]',
          'input[autocomplete="name"]',
          'input[name="birthday"]',
          'input[name="age"]',
          'input[placeholder*="氏名"]',
          'input[placeholder*="名前"]',
          'input[placeholder*="年齢"]',
          'input[placeholder*="नाम"]',
          'input[placeholder*="पूरा नाम"]',
          'input[placeholder*="उम्र"]',
          'input[placeholder*="आयु"]',
          'input[aria-label*="氏名"]',
          'input[aria-label*="名前"]',
          'input[aria-label*="年齢"]',
          'input[aria-label*="नाम"]',
          'input[aria-label*="पूरा नाम"]',
          'input[aria-label*="उम्र"]',
          'input[aria-label*="आयु"]',
          '[role="spinbutton"][data-type="year"]',
        ].join(', '))
      );
    }

    function getStep5SubmitButton() {
      const direct = documentRef.querySelector('button[type="submit"], input[type="submit"]');
      if (direct && isVisibleElement(direct)) {
        return direct;
      }

      const candidates = documentRef.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
      return Array.from(candidates).find((el) => {
        if (!isVisibleElement(el)) return false;
        const text = getActionText(el);
        return /完成|创建|アカウントの作成を完了する|アカウントを作成|作成を完了|完了|作成|続行|同意|create|continue|finish|done|agree|जारी\s+रखें|पूरा\s+करें|खाता\s+बनाएं|अकाउंट\s+बनाएं|बनाएं|बनाएँ|सहमत/i.test(text);
      }) || null;
    }

    async function waitForStep5SubmitButton(timeout = 5000) {
      const start = Date.now();

      while (Date.now() - start < timeout) {
        throwIfStopped();
        const button = getStep5SubmitButton();
        if (button) {
          return button;
        }
        await sleep(150);
      }

      return null;
    }

    function isStep5SubmitButtonClickable(button) {
      if (
        !button
        || !isVisibleElement(button)
        || button.disabled
        || button.getAttribute?.('aria-disabled') === 'true'
      ) {
        return false;
      }

      const ariaBusy = String(button.getAttribute?.('aria-busy') || '').trim().toLowerCase();
      if (ariaBusy === 'true') {
        return false;
      }

      const pendingAttr = [
        button.getAttribute?.('data-loading'),
        button.getAttribute?.('data-pending'),
        button.getAttribute?.('data-submitting'),
        button.getAttribute?.('data-state'),
      ]
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean)
        .join(' ');
      if (/\b(?:true|loading|pending|submitting|busy)\b/.test(pendingAttr)) {
        return false;
      }

      const pendingAncestor = button.closest?.([
        '[aria-busy="true"]',
        '[data-loading="true"]',
        '[data-pending="true"]',
        '[data-submitting="true"]',
        '[data-state="loading"]',
        '[data-state="pending"]',
        '[data-state="submitting"]',
      ].join(', '));
      if (pendingAncestor) {
        return false;
      }

      let style = null;
      try {
        style = typeof windowRef !== 'undefined' && windowRef.getComputedStyle
          ? windowRef.getComputedStyle(button)
          : null;
      } catch {
        style = null;
      }

      if (style?.pointerEvents === 'none') {
        return false;
      }

      const opacity = Number.parseFloat(style?.opacity || '');
      if (Number.isFinite(opacity) && opacity < 0.8) {
        return false;
      }

      return true;
    }

    function isStep5ProfileStillVisible() {
      return detectProfilePage() || detectProfileFields();
    }

    function getStep5ErrorText() {
      const messages = [];
      const selectors = [
        '.react-aria-FieldError',
        '[slot="errorMessage"]',
        '[id$="-error"]',
        '[id$="-errors"]',
        '[role="alert"]',
        '[aria-live="assertive"]',
        '[aria-live="polite"]',
        '[class*="error"]',
      ];

      for (const selector of selectors) {
        documentRef.querySelectorAll(selector).forEach((el) => {
          if (!isVisibleElement(el)) return;
          const text = normalizeInlineText(el.textContent);
          if (text) {
            messages.push(text);
          }
        });
      }

      const invalidField = Array.from(documentRef.querySelectorAll('[aria-invalid="true"], [data-invalid="true"]'))
        .find((el) => isVisibleElement(el));
      if (invalidField) {
        const wrapper = invalidField.closest('form, fieldset, [data-rac], div');
        if (wrapper) {
          const text = normalizeInlineText(wrapper.textContent);
          if (text) {
            messages.push(text);
          }
        }
      }

      return messages.find((text) => step5SubmitErrorPattern.test(text)) || '';
    }

    function getStep5SubmitState() {
      const retryState = getStep5AuthRetryPageState();
      const maxCheckAttemptsBlocked = Boolean(retryState?.maxCheckAttemptsBlocked || isAuthMaxCheckAttemptsPage());
      const successState = getStep5PostSubmitSuccessState();
      const passkeyState = getCreateAccountEnrollPasskeyPageState();
      const submitButton = getStep5SubmitButton();
      const errorText = getStep5ErrorText();
      let signupAuthHost = false;
      try {
        const parsed = new URL(String(locationRef.href || '').trim());
        signupAuthHost = ['auth.openai.com', 'auth0.openai.com', 'accounts.openai.com']
          .includes(String(parsed.hostname || '').toLowerCase());
      } catch {
        signupAuthHost = false;
      }

      return {
        url: locationRef.href,
        retryPage: Boolean(retryState || maxCheckAttemptsBlocked),
        retryEnabled: Boolean(retryState?.retryEnabled),
        maxCheckAttemptsBlocked,
        userAlreadyExistsBlocked: Boolean(retryState?.userAlreadyExistsBlocked),
        successState: successState?.state || '',
        passkeyEnrollPage: Boolean(passkeyState),
        passkeySkipEnabled: Boolean(passkeyState?.skipEnabled),
        profileVisible: isStep5ProfileStillVisible(),
        submitButtonVisible: Boolean(submitButton),
        submitButtonClickable: isStep5SubmitButtonClickable(submitButton),
        errorText,
        unknownAuthPage: Boolean(
          signupAuthHost
          && !retryState
          && !maxCheckAttemptsBlocked
          && !successState
          && !passkeyState
          && !isStep5ProfileStillVisible()
        ),
      };
    }

    async function submitProfilePage(payload = {}) {
      const state = getStep5SubmitState();
      if (!state.profileVisible) {
        return {
          ...state,
          clicked: false,
          reason: state.successState ? 'already_left_profile' : 'profile_not_visible',
        };
      }

      if (state.errorText) {
        return {
          ...state,
          clicked: false,
          reason: 'profile_error_visible',
        };
      }

      const submitButton = getStep5SubmitButton();
      if (!submitButton) {
        return {
          ...state,
          clicked: false,
          reason: 'submit_button_missing',
        };
      }

      if (!isStep5SubmitButtonClickable(submitButton)) {
        return {
          ...state,
          clicked: false,
          reason: 'submit_button_not_clickable',
          submitButtonVisible: true,
          submitButtonClickable: false,
        };
      }

      const attempt = Math.max(1, Math.floor(Number(payload?.attempt) || 1));
      log(`步骤 5：检测到资料页仍停留，正在重新点击“完成帐户创建”（恢复 ${attempt}）。`, 'warn', {
        step: 5,
        stepKey: 'fill-profile',
      });
      await humanPause(250, 700);
      simulateClick(submitButton);
      await sleep(500);

      return {
        ...getStep5SubmitState(),
        clicked: true,
        reason: 'submit_clicked',
        attempt,
      };
    }

    function fillProfileNameAndBirthday(payload = {}) {
      if (typeof fillProfileNameAndBirthdayDelegate !== 'function') {
        throw new Error('资料页填写处理器未初始化。');
      }
      return fillProfileNameAndBirthdayDelegate(payload);
    }

    return {
      detectProfilePage,
      fillProfileNameAndBirthday,
      submitProfilePage,
      getStep5ProfilePathPatterns,
      isStep5Ready: detectProfileFields,
      isStep5ProfilePageUrl: detectProfilePage,
      getStep5SubmitButton,
      waitForStep5SubmitButton,
      isStep5SubmitButtonClickable,
      isStep5ProfileStillVisible,
      getStep5SubmitState,
      getStep5ErrorText,
    };
  }

  root.MultiPageSignupProfilePage = { createSignupProfilePage };
})(typeof self !== 'undefined' ? self : window);
