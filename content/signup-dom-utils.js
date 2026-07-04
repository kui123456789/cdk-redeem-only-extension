// content/signup-dom-utils.js — Shared DOM helpers for OpenAI auth content scripts.
(function attachSignupDomUtils(root) {
  function isVisibleElement(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none'
      && style.visibility !== 'hidden'
      && rect.width > 0
      && rect.height > 0;
  }

  function getAssociatedInputText(input) {
    const parts = [
      input?.getAttribute?.('aria-label'),
      input?.getAttribute?.('placeholder'),
      input?.getAttribute?.('name'),
      input?.getAttribute?.('id'),
      input?.getAttribute?.('data-testid'),
    ];
    try {
      Array.from(input?.labels || []).forEach((label) => {
        parts.push(label?.textContent || '');
      });
    } catch {}
    let node = input?.parentElement || null;
    for (let depth = 0; node && depth < 3; depth += 1) {
      parts.push(node.textContent || '');
      node = node.parentElement;
    }
    return parts.filter(Boolean).join(' ');
  }

  function getActionText(el) {
    return [
      el?.textContent,
      el?.value,
      el?.getAttribute?.('aria-label'),
      el?.getAttribute?.('title'),
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isActionEnabled(el) {
    return Boolean(el)
      && !el.disabled
      && el.getAttribute('aria-disabled') !== 'true';
  }

  root.MultiPageSignupDomUtils = {
    isVisibleElement,
    getAssociatedInputText,
    getActionText,
    isActionEnabled,
  };
})(typeof self !== 'undefined' ? self : window);
