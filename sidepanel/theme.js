// sidepanel/theme.js — independent theme switcher

(() => {
  const STORAGE_MODE_KEY = 'multipage-theme-mode';
  const LEGACY_STORAGE_KEY = 'multipage-theme';
  const VALID_MODES = new Set(['light', 'dark', 'system']);
  const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)') || null;

  function normalizeMode(value = '') {
    const mode = String(value || '').trim().toLowerCase();
    return VALID_MODES.has(mode) ? mode : '';
  }

  function getStoredMode() {
    return normalizeMode(localStorage.getItem(STORAGE_MODE_KEY))
      || normalizeMode(localStorage.getItem(LEGACY_STORAGE_KEY))
      || 'dark';
  }

  function resolveTheme(mode = getStoredMode()) {
    const normalizedMode = normalizeMode(mode) || 'dark';
    if (normalizedMode === 'system') {
      return mediaQuery?.matches ? 'dark' : 'light';
    }
    return normalizedMode;
  }

  function updateButton(mode = getStoredMode(), theme = resolveTheme(mode)) {
    const button = document.getElementById('btn-theme');
    if (!button) {
      return;
    }
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const label = theme === 'dark' ? '当前深色，点击切换浅色' : '当前浅色，点击切换深色';
    button.dataset.theme = theme;
    button.dataset.themeMode = mode;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.title = label;
    button.querySelector('.theme-label')?.replaceChildren(document.createTextNode(nextTheme === 'dark' ? '深色' : '浅色'));
  }

  function applyTheme(mode = getStoredMode()) {
    const normalizedMode = normalizeMode(mode) || 'dark';
    const theme = resolveTheme(normalizedMode);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme-mode', normalizedMode);
    localStorage.setItem(STORAGE_MODE_KEY, normalizedMode);
    localStorage.setItem(LEGACY_STORAGE_KEY, theme);
    updateButton(normalizedMode, theme);
    return theme;
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || resolveTheme();
    return applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  function bindThemeButton() {
    const button = document.getElementById('btn-theme');
    if (!button || button.dataset.themeBound === 'true') {
      updateButton();
      return;
    }
    button.dataset.themeBound = 'true';
    button.type = 'button';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      toggleTheme();
    });
    updateButton();
  }

  applyTheme(getStoredMode());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindThemeButton, { once: true });
  } else {
    bindThemeButton();
  }

  mediaQuery?.addEventListener?.('change', () => {
    if (getStoredMode() === 'system') {
      applyTheme('system');
    }
  });

  window.MultiPageTheme = {
    applyTheme,
    getThemeMode: getStoredMode,
    toggleTheme,
  };
})();
