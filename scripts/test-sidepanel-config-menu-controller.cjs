const test = require('node:test');
const assert = require('node:assert/strict');
const moduleApi = require('../sidepanel/config-menu-controller.js');

function fakeButton() {
  const listeners = {};
  return {
    dataset: {},
    classList: { values: new Set(), toggle(name, enabled) { enabled ? this.values.add(name) : this.values.delete(name); } },
    addEventListener(type, listener) { listeners[type] = listener; },
    dispatch(type, event = {}) { listeners[type]?.({ preventDefault() {}, stopPropagation() {}, ...event }); },
    click() { this.dispatch('click'); },
    listeners,
  };
}

function flushAsyncHandlers() {
  return new Promise((resolve) => setImmediate(resolve));
}

test('config menu toggles open state and calls update callback', () => {
  const button = fakeButton();
  const menu = fakeButton();
  let updated = 0;
  const controller = moduleApi.createConfigMenuController({
    dom: { btnConfigMenu: button, configMenu: menu },
    onUpdate: () => { updated += 1; },
  });
  controller.bind();
  button.click();
  assert.equal(controller.isOpen(), true);
  assert.equal(updated, 1);
});

test('routes rejected export callback to onError', async () => {
  const button = fakeButton();
  const thrown = new Error('export failed');
  const errors = [];
  const controller = moduleApi.createConfigMenuController({
    dom: { btnExportSettings: button },
    exportSettings: async () => {
      throw thrown;
    },
    onError: (error) => errors.push(error),
  });
  controller.bind();

  button.click();
  await flushAsyncHandlers();

  assert.deepEqual(errors, [thrown]);
});

test('routes rejected import callback to onError', async () => {
  const input = fakeButton();
  const file = { name: 'settings.json' };
  const thrown = new Error('import failed');
  const errors = [];
  input.files = [file];
  const controller = moduleApi.createConfigMenuController({
    dom: { inputImportSettingsFile: input },
    importSettingsFromFile: async (selectedFile) => {
      assert.equal(selectedFile, file);
      throw thrown;
    },
    onError: (error) => errors.push(error),
  });
  controller.bind();

  input.dispatch('change');
  await flushAsyncHandlers();

  assert.deepEqual(errors, [thrown]);
});
