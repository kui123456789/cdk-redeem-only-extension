(function attachConfigMenuController(root, factory) {
  const api = factory();
  root.SidepanelConfigMenuController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createConfigMenuControllerModule() {
  function markBound(element, key) {
    if (!element?.addEventListener) {
      return false;
    }
    if (!element.dataset) {
      return true;
    }
    if (element.dataset[key] === 'true') {
      return false;
    }
    element.dataset[key] = 'true';
    return true;
  }

  function createConfigMenuController({
    dom = {},
    exportSettings = async () => {},
    importSettingsFromFile = async () => {},
    onUpdate = () => {},
    onError = (error) => console.warn('Config menu action failed:', error?.message || error),
  } = {}) {
    let open = false;

    function reportAsyncError(error) {
      try {
        const result = onError(error);
        if (result && typeof result.catch === 'function') {
          result.catch((reportError) => {
            console.warn('Config menu error handler failed:', reportError?.message || reportError);
          });
        }
      } catch (reportError) {
        console.warn('Config menu error handler failed:', reportError?.message || reportError);
      }
    }

    function runAsyncAction(action) {
      try {
        const result = action();
        if (result && typeof result.catch === 'function') {
          result.catch(reportAsyncError);
        }
      } catch (error) {
        reportAsyncError(error);
      }
    }

    function setOpen(nextOpen) {
      const previousOpen = open;
      open = nextOpen === true;
      dom.configMenu?.classList?.toggle?.('open', open);
      dom.btnConfigMenu?.classList?.toggle?.('active', open);
      dom.btnConfigMenu?.setAttribute?.('aria-expanded', String(open));
      if (typeof dom.configMenu?.hidden !== 'undefined') {
        dom.configMenu.hidden = !open;
      }
      if (previousOpen !== open) {
        onUpdate(open);
      }
    }

    function bind() {
      if (markBound(dom.btnConfigMenu, 'configMenuBound')) {
        dom.btnConfigMenu.addEventListener('click', (event) => {
          event?.preventDefault?.();
          event?.stopPropagation?.();
          if (dom.btnConfigMenu?.disabled) {
            return;
          }
          setOpen(!open);
        });
      }

      if (markBound(dom.btnExportSettings, 'configExportBound')) {
        dom.btnExportSettings.addEventListener('click', (event) => {
          event?.preventDefault?.();
          event?.stopPropagation?.();
          if (dom.btnExportSettings?.disabled) {
            return;
          }
          runAsyncAction(exportSettings);
        });
      }

      if (markBound(dom.btnImportSettings, 'configImportBound')) {
        dom.btnImportSettings.addEventListener('click', (event) => {
          event?.preventDefault?.();
          event?.stopPropagation?.();
          if (dom.btnImportSettings?.disabled) {
            return;
          }
          dom.inputImportSettingsFile?.click?.();
        });
      }

      if (markBound(dom.inputImportSettingsFile, 'configImportFileBound')) {
        dom.inputImportSettingsFile.addEventListener('change', () => {
          runAsyncAction(() => importSettingsFromFile(dom.inputImportSettingsFile?.files?.[0] || null));
        });
      }
    }

    return {
      bind,
      close: () => setOpen(false),
      isOpen: () => open,
      setOpen,
    };
  }

  return { createConfigMenuController };
});
