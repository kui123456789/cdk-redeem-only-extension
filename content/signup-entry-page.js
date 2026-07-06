// content/signup-entry-page.js — Signup entry detection helpers for OpenAI auth pages.
(function attachSignupEntryPage(root) {
  function createSignupEntryPage(context = {}) {
    const {
      documentRef = document,
      windowRef = window,
      isVisibleElement,
      isActionEnabled,
      getActionText,
      getPageTextSnapshot,
    } = context;

    const authPageDetectors = context.authPageDetectors || root.MultiPageAuthPageDetectors || {};
    const SIGNUP_EMAIL_INPUT_SELECTOR = [
      'input[type="email"]',
      'input[autocomplete="email"]',
      'input[autocomplete="username"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[id*="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="电子邮件"]',
      'input[placeholder*="邮箱"]',
      'input[placeholder*="メール"]',
      'input[placeholder*="電子メール"]',
      'input[placeholder*="ईमेल"]',
      'input[placeholder*="ई-मेल"]',
      'input[placeholder*="मेल"]',
      'input[aria-label*="email" i]',
      'input[aria-label*="电子邮件"]',
      'input[aria-label*="邮箱"]',
      'input[aria-label*="メール"]',
      'input[aria-label*="電子メール"]',
      'input[aria-label*="ईमेल"]',
      'input[aria-label*="ई-मेल"]',
      'input[aria-label*="मेल"]',
    ].join(', ');
    const SIGNUP_SWITCH_TO_EMAIL_PATTERN = new RegExp([
      String.raw`\u7ee7\u7eed\u4f7f\u7528(?:\u7535\u5b50\u90ae\u4ef6\u5730\u5740|\u90ae\u7bb1)\u767b\u5f55`,
      String.raw`\u6539\u7528(?:\u7535\u5b50\u90ae\u4ef6\u5730\u5740|\u90ae\u7bb1)\u767b\u5f55`,
      String.raw`continue\s+using\s+(?:an?\s+)?email(?:\s+address)?(?:\s+(?:to\s+)?(?:log\s*in|sign\s*in|sign\s*up))?`,
      String.raw`continue\s+with\s+email(?:\s+address)?`,
      String.raw`use\s+(?:an?\s+)?email(?:\s+address)?(?:\s+instead)?`,
      String.raw`sign\s*(?:in|up)\s+with\s+email`,
      String.raw`(?:メール|メールアドレス|電子メール)(?:で|を)?(?:続行|続ける|使用|ログイン|サインイン|サインアップ)`,
      String.raw`(?:続行|続ける|使用|ログイン|サインイン|サインアップ)(?:する)?(?:\s*)?(?:メール|メールアドレス|電子メール)`,
      String.raw`(?:ई-?मेल|मेल)(?:\s+पता)?(?:\s+से)?\s*(?:जारी\s+रखें|लॉग\s*इन|साइन\s*इन|साइन\s*अप)`,
      String.raw`(?:जारी\s+रखें|उपयोग|लॉग\s*इन|साइन\s*इन|साइन\s*अप)(?:\s+करें)?(?:\s+के\s+लिए)?\s*(?:ई-?मेल|मेल)(?:\s+पता)?`,
    ].join('|'), 'i');
    const SIGNUP_SWITCH_ACTION_PATTERN = /\u7ee7\u7eed\u4f7f\u7528|\u6539\u7528|continue|use|sign\s*(?:in|up)|続行|続ける|使用|ログイン|サインイン|サインアップ|जारी\s+रखें|उपयोग|लॉग\s*इन|साइन\s*(?:इन|अप)/i;
    const SIGNUP_EMAIL_ACTION_PATTERN = /\u7535\u5b50\u90ae\u4ef6|\u90ae\u7bb1|email|メール|メールアドレス|電子メール|ई-?मेल|मेल/i;
    const SIGNUP_MORE_OPTIONS_PATTERN = /更多选项|其它方式|其他方式|more\s+options|show\s+more|other\s+(?:options|ways)|その他(?:の)?オプション|他(?:の)?方法|もっと見る|(?:और|अन्य)\s+(?:विकल्प|तरीके)|ज़्यादा\s+दिखाएं/i;
    const SIGNUP_WORK_EMAIL_PATTERN = /\u5de5\u4f5c|business|work\s+email|仕事用|ビジネス/i;

    function getSignupEmailInput() {
      const input = documentRef.querySelector(SIGNUP_EMAIL_INPUT_SELECTOR);
      if (input && isVisibleElement(input)) {
        return input;
      }

      const fallback = Array.from(documentRef.querySelectorAll('input')).find((el) => {
        if (!isVisibleElement(el)) return false;
        const type = String(el.getAttribute?.('type') || '').trim().toLowerCase();
        const name = String(el.getAttribute?.('name') || '').trim().toLowerCase();
        const id = String(el.getAttribute?.('id') || '').trim().toLowerCase();
        const placeholder = String(el.getAttribute?.('placeholder') || '').trim();
        const ariaLabel = String(el.getAttribute?.('aria-label') || '').trim();
        const autocomplete = String(el.getAttribute?.('autocomplete') || '').trim().toLowerCase();
        const autocompleteTokens = autocomplete.split(/\s+/).filter(Boolean);
        const combinedText = `${placeholder} ${ariaLabel}`;
        return type === 'email'
          || autocompleteTokens.includes('email')
          || autocompleteTokens.includes('username')
          || /email|username/i.test(`${name} ${id}`)
          || /email|电子邮件|邮箱|メール|メールアドレス|電子メール|ई-?मेल|मेल/i.test(combinedText);
      });

      return fallback || null;
    }

    function findSignupUseEmailTrigger() {
      const candidates = documentRef.querySelectorAll('button, a, [role="button"], [role="link"]');
      return Array.from(candidates).find((el) => {
        if (!isVisibleElement(el) || !isActionEnabled(el)) return false;
        const text = getActionText(el);
        if (!text) return false;
        if (SIGNUP_WORK_EMAIL_PATTERN.test(text)) return false;
        return SIGNUP_SWITCH_TO_EMAIL_PATTERN.test(text)
          || (SIGNUP_SWITCH_ACTION_PATTERN.test(text) && SIGNUP_EMAIL_ACTION_PATTERN.test(text));
      }) || null;
    }

    function findSignupMoreOptionsTrigger() {
      const candidates = documentRef.querySelectorAll('button, a, [role="button"], [role="link"]');
      return Array.from(candidates).find((el) => {
        if (!isVisibleElement(el) || !isActionEnabled(el)) return false;
        const text = getActionText(el);
        if (!text || !SIGNUP_MORE_OPTIONS_PATTERN.test(text)) return false;
        const expanded = String(el.getAttribute?.('aria-expanded') || '').trim().toLowerCase();
        const state = String(el.getAttribute?.('data-state') || '').trim().toLowerCase();
        return expanded !== 'true' && state !== 'open';
      }) || null;
    }

    function getSignupEmailContinueButton({ allowDisabled = false } = {}) {
      const direct = documentRef.querySelector('button[type="submit"], input[type="submit"]');
      if (direct && isVisibleElement(direct) && (allowDisabled || isActionEnabled(direct))) {
        return direct;
      }

      const candidates = documentRef.querySelectorAll(
        'button, a, [role="button"], [role="link"], input[type="button"], input[type="submit"]'
      );
      return Array.from(candidates).find((el) => {
        if (!isVisibleElement(el) || (!allowDisabled && !isActionEnabled(el))) return false;
        return Boolean(authPageDetectors.isContinueText?.(getActionText(el)));
      }) || null;
    }

    function isExcludedSignupEntryActionText(text = '') {
      return Boolean(authPageDetectors.isExcludedSignupEntryText?.(text));
    }

    function isSignupEntryTriggerText(text = '') {
      return Boolean(authPageDetectors.isSignupEntryText?.(text));
    }

    function isSignupAuthEntryTriggerText(text = '') {
      return Boolean(authPageDetectors.isSignupEntryText?.(text) || authPageDetectors.isLoginEntryText?.(text));
    }

    function isHindiLoginEntryText(text = '') {
      return Boolean(authPageDetectors.isHindiLoginEntryText?.(text));
    }

    function findSignupEntryTrigger(options = {}) {
      const { allowHiddenFallback = true } = options || {};
      const candidates = documentRef.querySelectorAll('a, button, [role="button"], [role="link"]');
      let hiddenSignupTrigger = null;
      let visibleAuthTrigger = null;
      let hiddenAuthTrigger = null;

      for (const el of Array.from(candidates)) {
        if (!isActionEnabled(el)) continue;
        const text = getActionText(el);
        if (!text || isExcludedSignupEntryActionText(text)) continue;
        if (!isSignupEntryTriggerText(text)) {
          if (isSignupAuthEntryTriggerText(text)) {
            if (isVisibleElement(el) && !visibleAuthTrigger) {
              visibleAuthTrigger = el;
            } else if (!hiddenAuthTrigger) {
              hiddenAuthTrigger = el;
            }
          }
          continue;
        }
        if (isVisibleElement(el)) {
          return el;
        }
        if (!hiddenSignupTrigger) {
          hiddenSignupTrigger = el;
        }
      }

      if (visibleAuthTrigger) {
        return visibleAuthTrigger;
      }

      if (!allowHiddenFallback || !hiddenSignupTrigger) {
        if (!allowHiddenFallback || !hiddenAuthTrigger) {
          return null;
        }
      }

      const collapsedViewport = Boolean(
        Math.round(Number(windowRef?.innerWidth) || 0) < 240
        || Math.round(Number(windowRef?.innerHeight) || 0) < 160
        || Math.round(Number(windowRef?.outerWidth) || 0) < 320
        || Math.round(Number(windowRef?.outerHeight) || 0) < 180
      );
      const pageText = typeof getPageTextSnapshot === 'function' ? getPageTextSnapshot() : '';
      const looksLikeLoggedOutHome = /登录|登入|log\s*in|sign\s*in|ログイン|サインイン|लॉग\s*इन|साइन\s*इन/i.test(pageText);
      return collapsedViewport || looksLikeLoggedOutHome ? (hiddenSignupTrigger || hiddenAuthTrigger) : null;
    }

    return {
      getSignupEmailInput,
      findSignupUseEmailTrigger,
      findSignupMoreOptionsTrigger,
      getSignupEmailContinueButton,
      isExcludedSignupEntryActionText,
      isSignupEntryTriggerText,
      isSignupAuthEntryTriggerText,
      isHindiLoginEntryText,
      findSignupEntryTrigger,
    };
  }

  root.MultiPageSignupEntryPage = { createSignupEntryPage };
})(typeof self !== 'undefined' ? self : window);
