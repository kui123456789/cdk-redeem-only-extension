// content/signup-page-detector.js - Shared signup page detection helpers.
(function attachSignupPageDetector(root) {
  if (root.MultiPageSignupPageDetector?.createSignupPageDetector) {
    root.SignupPageDetector = root.SignupPageDetector || root.MultiPageSignupPageDetector;
    return;
  }

  const constants = Object.freeze({
    VERIFICATION_CODE_INPUT_SELECTOR: [
      'input[name="code"]',
      'input[name="otp"]',
      'input[autocomplete="one-time-code"]',
      'input[type="text"][maxlength="6"]',
      'input[type="tel"][maxlength="6"]',
      'input[aria-label*="code" i]',
      'input[aria-label*="कोड"]',
      'input[aria-label*="सत्यापन"]',
      'input[placeholder*="code" i]',
      'input[placeholder*="कोड"]',
      'input[placeholder*="सत्यापन"]',
      'input[inputmode="numeric"]',
    ].join(', '),
    ONE_TIME_CODE_LOGIN_PATTERN: /使用一次性验证码登录|改用(?:一次性)?验证码(?:登录)?|使用验证码登录|一次性验证码|验证码登录|one[-\s]*time\s*(?:passcode|password|code)|use\s+(?:a\s+)?one[-\s]*time\s*(?:passcode|password|code)(?:\s+instead)?|use\s+(?:a\s+)?code(?:\s+instead)?|sign\s+in\s+with\s+(?:email|code)|email\s+(?:me\s+)?(?:a\s+)?code|(?:एक[-\s]*)?बार(?:\s+का)?\s+(?:कोड|पासकोड)|कोड\s+(?:से|का)\s+(?:लॉग\s*इन|साइन\s*इन)/i,
    HINDI_LOGIN_ENTRY_PATTERN: /लॉग\s*इन(?:\s*करें)?|साइन\s*इन(?:\s*करें)?/i,
    LOGIN_ENTRY_ACTION_PATTERN: /(?:^|\b)(?:log\s*in|sign\s*in|continue\s+(?:with|using)\s+(?:email|chatgpt)|use\s+(?:an?\s+)?email|email\s+address)(?:\b|$)|登录|登陆|邮箱|电子邮件|लॉग\s*इन(?:\s*करें)?|साइन\s*इन(?:\s*करें)?|ई-?मेल(?:\s+पता)?/i,
    LOGIN_MORE_OPTIONS_PATTERN: /更多(?:选项|登录方式|方式)|其他(?:登录方式|选项|方式)|显示更多|more\s+(?:login\s+|sign[-\s]*in\s+)?options|other\s+(?:login\s+|sign[-\s]*in\s+)?(?:options|ways)|show\s+more|(?:और|अन्य)\s+(?:विकल्प|तरीके)|ज़्यादा\s+दिखाएं/i,
    LOGIN_EXTERNAL_IDP_PATTERN: /google|microsoft|apple|sso|single\s+sign[-\s]*on|企业|工作区|workspace/i,
    LOGIN_CODE_ONLY_ACTION_PATTERN: /one[-\s]*time|passcode|use\s+(?:a\s+)?code|验证码|一次性/i,
    LOGIN_TOTP_VERIFICATION_PATTERN: /authenticator|authentication\s+app|one[-\s]*time\s+password\s+application|two[-\s]*factor|2fa|mfa|multi[-\s]*factor|verification\s+app|totp|身份验证器|认证器|双重验证|两步验证|多重验证|动态验证码/i,
    LOGIN_EMAIL_VERIFICATION_PATTERN: /检查您的收件箱|输入我们刚刚向|重新发送电子邮件|email\s+verification|check\s+your\s+inbox|we\s+(?:just\s+)?(?:sent|emailed)|sent\s+(?:a\s+)?code\s+to|emailed\s+(?:a\s+)?code|email\s+(?:address|code)|收件箱|邮箱|电子邮件|(?:अपना\s+)?इनबॉक्स\s+देखें|(?:सत्यापन|वेरिफिकेशन)\s+कोड|(?:ई-?मेल|मेल)\s+(?:कोड|पता)|हमने.*(?:कोड|ई-?मेल)/i,
    RESEND_VERIFICATION_CODE_PATTERN: /重新发送(?:验证码)?|再次发送(?:验证码)?|重发(?:验证码)?|未收到(?:验证码|邮件)|resend(?:\s+code)?|send\s+(?:a\s+)?new\s+code|send\s+(?:it\s+)?again|request\s+(?:a\s+)?new\s+code|didn'?t\s+receive|(?:कोड|ई-?मेल|मेल)\s+(?:फिर\s+से|दोबारा|पुनः)\s+भेजें|(?:फिर\s+से|दोबारा|पुनः)\s+(?:कोड|ई-?मेल|मेल)\s+भेजें|प्राप्त\s+नहीं\s+हुआ/i,
    CONTACT_VERIFICATION_SERVER_ERROR_PATTERN: /this\s+page\s+isn['’]?t\s+working|currently\s+unable\s+to\s+handle\s+this\s+request|http\s+error\s+500|500\s+internal\s+server\s+error/i,
    INVALID_VERIFICATION_CODE_PATTERN: /代码不正确|验证码不正确|验证码错误|コードが正しくありません|確認コードが正しくありません|認証コードが正しくありません|code\s+(?:is\s+)?incorrect|invalid\s+code|incorrect\s+code|try\s+again|गलत\s+कोड|अमान्य\s+कोड|कोड\s+गलत/i,
    EMAIL_ALREADY_VERIFIED_PATTERN: /email\s+verified|already\s+been\s+verified|邮箱已验证|电子邮件已验证|已经验证|メール(?:アドレス)?は確認済み|確認済み/i,
    VERIFICATION_PAGE_PATTERN: /检查您的收件箱|输入我们刚刚向|重新发送电子邮件|重新发送验证码|代码不正确|受信トレイ|メールを確認|コードを入力|確認コード|認証コード|メールを再送信|コードを再送信|email\s+verification|check\s+your\s+inbox|enter\s+the\s+code|we\s+just\s+sent|we\s+emailed|resend|इनबॉक्स\s+देखें|कोड\s+दर्ज\s+करें|(?:सत्यापन|वेरिफिकेशन)\s+कोड|(?:ई-?मेल|कोड)\s+(?:फिर\s+से|दोबारा|पुनः)\s+भेजें/i,
    OAUTH_CONSENT_PAGE_PATTERN: /使用\s*ChatGPT\s*登录到\s*Codex|sign\s+in\s+to\s+codex(?:\s+with\s+chatgpt)?|login\s+to\s+codex|log\s+in\s+to\s+codex|authorize|授权/i,
    OAUTH_CONSENT_FORM_SELECTOR: 'form[action*="/sign-in-with-chatgpt/" i][action*="/consent" i]',
    CONTINUE_ACTION_PATTERN: /继续|続行|続ける|continue|जारी\s+रखें|आगे/i,
    ADD_EMAIL_PAGE_PATTERN: /add[\s-]*email|添加(?:电子邮件|邮箱)|要求提供(?:电子邮件|邮箱)地址|提供(?:电子邮件|邮箱)地址|provide\s+(?:an?\s+)?email\s+address|email\s+address\s+required/i,
  });

  function createSignupPageDetector(context = {}) {
    const {
      documentRef = document,
      locationRef = location,
      getSignupDomUtils = () => root.MultiPageSignupDomUtils || {},
      getSignupVerificationPageHelpers = () => ({}),
    } = context;

    function getPageTextSnapshot() {
      return (documentRef.body?.innerText || documentRef.body?.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function isVisibleElement(el) {
      const helper = getSignupDomUtils().isVisibleElement;
      return typeof helper === 'function' ? helper(el) : false;
    }

    function getVisibleSplitVerificationInputs() {
      return getSignupVerificationPageHelpers().getVisibleSplitVerificationInputs?.() || [];
    }

    function getAssociatedInputText(input) {
      const helper = getSignupDomUtils().getAssociatedInputText;
      return typeof helper === 'function' ? helper(input) : '';
    }

    function getFallbackVerificationCodeInput() {
      return getSignupVerificationPageHelpers().getFallbackVerificationCodeInput?.() || null;
    }

    function getVerificationCodeTarget() {
      return getSignupVerificationPageHelpers().getVerificationCodeTarget?.() || null;
    }

    function getLoginVerificationDisplayedEmail() {
      const pageText = getPageTextSnapshot();
      const matches = pageText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig) || [];
      return matches[0] ? String(matches[0]).trim().toLowerCase() : '';
    }

    function getLoginVerificationKind() {
      const path = `${locationRef.pathname || ''} ${locationRef.href || ''}`;
      if (/\/(?:mfa|totp|2fa|two-factor)(?:[/?#]|$)/i.test(path)) {
        return 'totp';
      }
      if (isEmailVerificationPage()) {
        return 'email';
      }

      const pageText = getPageTextSnapshot();
      if (constants.LOGIN_TOTP_VERIFICATION_PATTERN.test(pageText)) {
        return 'totp';
      }
      if (constants.LOGIN_EMAIL_VERIFICATION_PATTERN.test(pageText) || getLoginVerificationDisplayedEmail()) {
        return 'email';
      }

      return 'unknown';
    }

    function getActionText(el) {
      const helper = getSignupDomUtils().getActionText;
      return typeof helper === 'function' ? helper(el) : '';
    }

    function isActionEnabled(el) {
      const helper = getSignupDomUtils().isActionEnabled;
      return typeof helper === 'function' ? helper(el) : false;
    }

    function findOneTimeCodeLoginTrigger() {
      const candidates = documentRef.querySelectorAll(
        'button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
      );

      for (const el of candidates) {
        if (!isVisibleElement(el)) continue;
        if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;

        const text = [
          el.textContent,
          el.value,
          el.getAttribute('aria-label'),
          el.getAttribute('title'),
        ]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (text && constants.ONE_TIME_CODE_LOGIN_PATTERN.test(text)) {
          return el;
        }
      }

      return null;
    }

    function findResendVerificationCodeTrigger({ allowDisabled = false } = {}) {
      return getSignupVerificationPageHelpers().findResendVerificationCodeTrigger?.({ allowDisabled }) || null;
    }

    function isEmailVerificationPage() {
      return Boolean(getSignupVerificationPageHelpers().isEmailVerificationPage?.());
    }

    function getVerificationErrorText() {
      return getSignupVerificationPageHelpers().getVerificationErrorText?.() || '';
    }

    function getContactVerificationServerErrorText() {
      const path = String(locationRef?.pathname || '');
      if (!/\/contact-verification(?:[/?#]|$)/i.test(path)) {
        return '';
      }
      const text = String(getPageTextSnapshot?.() || documentRef?.body?.textContent || '').replace(/\s+/g, ' ').trim();
      const title = String(documentRef?.title || '').replace(/\s+/g, ' ').trim();
      const combined = `${title} ${text}`.trim();
      if (!constants.CONTACT_VERIFICATION_SERVER_ERROR_PATTERN.test(combined)) {
        return '';
      }
      return combined || 'OpenAI contact-verification page returned HTTP ERROR 500 after resend.';
    }

    function throwIfContactVerificationServerError() {
      const serverErrorText = getContactVerificationServerErrorText();
      if (serverErrorText) {
        throw new Error(`CONTACT_VERIFICATION_SERVER_ERROR::${serverErrorText}`);
      }
    }

    function findContinueButton({ allowDisabled = false } = {}) {
      const candidates = documentRef.querySelectorAll(
        'button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
      );
      return Array.from(candidates).find((el) => {
        if (!isVisibleElement(el) || (!allowDisabled && !isActionEnabled(el))) return false;
        return constants.CONTINUE_ACTION_PATTERN.test(getActionText(el));
      }) || null;
    }

    function detectPageState() {
      const verificationTarget = getVerificationCodeTarget();
      if (verificationTarget) {
        return {
          state: 'verification_page',
          url: locationRef.href,
          verificationTarget,
          verificationKind: getLoginVerificationKind(),
        };
      }
      if (isEmailVerificationPage()) {
        return {
          state: 'email_verification_page',
          url: locationRef.href,
          verificationKind: getLoginVerificationKind(),
        };
      }
      if (findOneTimeCodeLoginTrigger()) {
        return {
          state: 'one_time_code_login_available',
          url: locationRef.href,
        };
      }
      return {
        state: 'unknown',
        url: locationRef.href,
      };
    }

    function buildDiagnosticSnapshot() {
      return {
        url: locationRef.href,
        title: documentRef.title || '',
        readyState: documentRef.readyState || '',
        verificationTargetFound: Boolean(getVerificationCodeTarget()),
        resendButtonFound: Boolean(findResendVerificationCodeTrigger({ allowDisabled: true })),
        loginVerificationKind: getLoginVerificationKind(),
        bodyTextPreview: getPageTextSnapshot().slice(0, 300),
      };
    }

    return {
      constants,
      detectPageState,
      findSignupEntryAction: () => null,
      findContinueButton,
      findResendButton: findResendVerificationCodeTrigger,
      buildDiagnosticSnapshot,
      getPageTextSnapshot,
      isVisibleElement,
      getVisibleSplitVerificationInputs,
      getAssociatedInputText,
      getFallbackVerificationCodeInput,
      getVerificationCodeTarget,
      getLoginVerificationDisplayedEmail,
      getLoginVerificationKind,
      getActionText,
      isActionEnabled,
      findOneTimeCodeLoginTrigger,
      findResendVerificationCodeTrigger,
      isEmailVerificationPage,
      getVerificationErrorText,
      getContactVerificationServerErrorText,
      throwIfContactVerificationServerError,
    };
  }

  root.MultiPageSignupPageDetector = {
    constants,
    createSignupPageDetector,
  };
  root.SignupPageDetector = root.MultiPageSignupPageDetector;
})(typeof self !== 'undefined' ? self : globalThis);
