// content/signup-verification-page.js — Verification page detection helpers.
(function attachSignupVerificationPage(root) {
  function createSignupVerificationPage(context = {}) {
    const {
      documentRef = document,
      locationRef = location,
      verificationCodeInputSelector,
      loginTotpVerificationPattern,
      oneTimeCodeLoginPattern,
      resendVerificationCodePattern,
      invalidVerificationCodePattern,
      isVisibleElement,
      isActionEnabled,
      getActionText,
      getAssociatedInputText,
      getPageTextSnapshot,
    } = context;
    const authPageDetectors = context.authPageDetectors || root.MultiPageAuthPageDetectors || {};

    function getVisibleSplitVerificationInputs() {
      return Array.from(documentRef.querySelectorAll('input[maxlength="1"]'))
        .filter(isVisibleElement);
    }

    function getFallbackVerificationCodeInput() {
      const verificationText = typeof getPageTextSnapshot === 'function' ? getPageTextSnapshot() : '';
      const pageLooksLikeVerification = loginTotpVerificationPattern.test(verificationText)
        || oneTimeCodeLoginPattern.test(verificationText)
        || /verify\s+your\s+identity|one[-\s]*time\s+(?:code|password|passcode)|verification\s+code|动态码|验证码|身份验证|受信箱を確認|受信トレイ|認証コード|検証コード|確認コード|コードを入力|(?:सत्यापन|वेरिफिकेशन)\s+कोड|कोड\s+दर्ज\s+करें|इनबॉक्स\s+देखें/i.test(verificationText);
      if (!pageLooksLikeVerification) {
        return null;
      }

      const blockedTypes = new Set(['hidden', 'password', 'email', 'checkbox', 'radio', 'submit', 'button', 'file']);
      const candidates = Array.from(documentRef.querySelectorAll('input'))
        .filter(isVisibleElement)
        .filter((input) => {
          const type = String(input.getAttribute?.('type') || input.type || 'text').trim().toLowerCase();
          if (blockedTypes.has(type)) return false;
          if (input.disabled || input.readOnly) return false;
          return true;
        });
      if (!candidates.length) {
        return null;
      }

      const labeledCandidate = candidates.find((input) => (
        /one[-\s]*time\s*(?:code|password|passcode)|verification\s*code|authenticator|authentication\s*app|totp|otp|2fa|mfa|动态码|验证码|身份验证|認証コード|検証コード|確認コード|コード|(?:सत्यापन|वेरिफिकेशन)\s*कोड|कोड/i
          .test(getAssociatedInputText(input))
      ));
      if (labeledCandidate) {
        return labeledCandidate;
      }

      const nonLoginInputs = candidates.filter((input) => {
        const text = getAssociatedInputText(input);
        return !/(?:email|邮箱|phone|手机|password|密码|ई-?मेल|फोन|फ़ोन|मोबाइल|पासवर्ड)/i.test(text);
      });
      return nonLoginInputs.length === 1 ? nonLoginInputs[0] : null;
    }

    function getVerificationCodeTarget() {
      const splitInputs = getVisibleSplitVerificationInputs();
      const codeInput = documentRef.querySelector(verificationCodeInputSelector);
      if (codeInput && isVisibleElement(codeInput)) {
        const maxLength = Number(codeInput.getAttribute?.('maxlength') || codeInput.maxLength || 0);
        if (maxLength === 1 && splitInputs.length >= 6) {
          return { type: 'split', elements: splitInputs };
        }
        return { type: 'single', element: codeInput };
      }

      if (splitInputs.length >= 6) {
        return { type: 'split', elements: splitInputs };
      }

      const fallbackInput = getFallbackVerificationCodeInput();
      if (fallbackInput) {
        return { type: 'single', element: fallbackInput };
      }

      return null;
    }

    function findResendVerificationCodeTrigger({ allowDisabled = false } = {}) {
      const candidates = documentRef.querySelectorAll(
        'button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
      );

      for (const el of candidates) {
        if (!isVisibleElement(el)) continue;
        if (!allowDisabled && !isActionEnabled(el)) continue;

        const text = getActionText(el);
        const resendMatched = typeof authPageDetectors.isResendEmailText === 'function'
          ? authPageDetectors.isResendEmailText(text)
          : Boolean(text && resendVerificationCodePattern.test(text));
        if (resendMatched) {
          return el;
        }
      }

      return null;
    }

    function isEmailVerificationPage() {
      return /\/email-verification(?:[/?#]|$)/i.test(locationRef.pathname || '');
    }

    function getVerificationErrorText() {
      const messages = [];
      const selectors = [
        '.react-aria-FieldError',
        '[slot="errorMessage"]',
        '[id$="-error"]',
        '[data-invalid="true"] + *',
        '[aria-invalid="true"] + *',
        '[class*="error"]',
      ];

      for (const selector of selectors) {
        documentRef.querySelectorAll(selector).forEach((el) => {
          const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
          if (text) {
            messages.push(text);
          }
        });
      }

      const invalidInput = documentRef.querySelector(`${verificationCodeInputSelector}[aria-invalid="true"], ${verificationCodeInputSelector}[data-invalid="true"]`);
      if (invalidInput) {
        const wrapper = invalidInput.closest('form, [data-rac], ._root_18qcl_51, div');
        if (wrapper) {
          const text = (wrapper.textContent || '').replace(/\s+/g, ' ').trim();
          if (text) {
            messages.push(text);
          }
        }
      }

      return messages.find((text) => invalidVerificationCodePattern.test(text)) || '';
    }

    return {
      getVisibleSplitVerificationInputs,
      getFallbackVerificationCodeInput,
      getVerificationCodeTarget,
      findResendVerificationCodeTrigger,
      isEmailVerificationPage,
      getVerificationErrorText,
    };
  }

  root.MultiPageSignupVerificationPage = { createSignupVerificationPage };
})(typeof self !== 'undefined' ? self : window);
