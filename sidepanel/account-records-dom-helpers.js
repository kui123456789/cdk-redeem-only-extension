(function attachSidepanelAccountRecordsDomHelpers(globalScope) {
  function createAccountRecordsDomHelpers() {
    function setNodeHidden(node, hidden) {
      if (node) {
        node.hidden = Boolean(hidden);
      }
    }

    function setNodeDisabled(node, disabled) {
      if (node) {
        node.disabled = Boolean(disabled);
      }
    }

    function toggleNodeClass(node, className, enabled) {
      if (!node || !className) {
        return;
      }
      if (node.classList && typeof node.classList.toggle === 'function') {
        node.classList.toggle(className, Boolean(enabled));
      }
    }

    function setNodeText(node, value) {
      if (node) {
        node.textContent = String(value || '');
      }
    }

    function setNodeAttr(node, name, value) {
      if (!node || !name) {
        return;
      }
      if (typeof node.setAttribute === 'function') {
        node.setAttribute(name, String(value));
        return;
      }
      node[name] = value;
    }

    function getDatasetValue(node, attrName) {
      if (!node || !attrName) {
        return '';
      }

      if (typeof node.getAttribute === 'function') {
        return String(node.getAttribute(attrName) || '');
      }

      const dataKey = attrName
        .replace(/^data-/, '')
        .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      return String(node.dataset?.[dataKey] || '');
    }

    function findClosest(target, selector) {
      if (!target || typeof target.closest !== 'function') {
        return null;
      }
      try {
        return target.closest(selector);
      } catch {
        return null;
      }
    }

    return {
      findClosest,
      getDatasetValue,
      setNodeAttr,
      setNodeDisabled,
      setNodeHidden,
      setNodeText,
      toggleNodeClass,
    };
  }

  const api = {
    createAccountRecordsDomHelpers,
  };
  globalScope.SidepanelAccountRecordsDomHelpers = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
