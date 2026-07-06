(function attachSettingsFieldBindings(root, factory) {
  const api = factory();
  root.SidepanelSettingsFieldBindings = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis, function createSettingsFieldBindingsModule() {
  function createSettingsFieldBindings({ scheduleSettingsSave = () => {} } = {}) {
    function applyBinding(element, eventName, options = {}) {
      element?.addEventListener?.(eventName, () => {
        const rawValue = element.type === 'checkbox' ? element.checked : element.value;
        const value = typeof options.normalize === 'function' ? options.normalize(rawValue, element) : rawValue;
        if (options.key) {
          scheduleSettingsSave({ [options.key]: value });
        }
        options.afterChange?.(value, element);
        if (eventName === 'blur') options.afterBlur?.(value, element);
      });
    }

    return {
      bindInput: (element, options) => applyBinding(element, 'input', options),
      bindChange: (element, options) => applyBinding(element, 'change', options),
      bindBlur: (element, options) => applyBinding(element, 'blur', options),
    };
  }

  return { createSettingsFieldBindings };
});
